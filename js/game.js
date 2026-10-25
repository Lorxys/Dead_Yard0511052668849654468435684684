// Boucle principale : vagues, tirs, collisions, rendu, interface
const Game = {
  cam: { x: 0, y: 0 }, state: 'menu', zs: [], bullets: [], fx: [], shake: 0,
  init() {
    this.cv = document.getElementById('game'); this.c = this.cv.getContext('2d');
    this.hud = { hp: document.getElementById('hp'), wave: document.getElementById('wave'), score: document.getElementById('score') };
    this.resize(); addEventListener('resize', () => this.resize());
    GameMap.init(); Input.init(document.getElementById('touch'));
    document.getElementById('restart').onclick = () => this.reset();
    // menu : le jeu ne démarre qu'au clic sur Jouer
    document.getElementById('play').onclick = () => { document.getElementById('menu').classList.remove('show'); this.reset(); };
    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },
  resize() {
    const k = this.state === 'menu' ? 2 : 1;   // le décor du menu est plus détaillé
    this.W = CFG.VIEW_W * k; this.H = Math.round(this.W * innerHeight / innerWidth);
    this.cv.width = this.W; this.cv.height = this.H; this.c.imageSmoothingEnabled = false;
    if (this.state === 'menu') MenuScene.build(this.W, this.H);
  },
  reset() {
    this.state = 'play'; this.resize(); GameMap.render();
    this.p = new Player(); this.zs = []; this.bullets = []; this.fx = []; this.lastHp = this.p.hp;
    this.wave = 0; this.score = 0; this.toSpawn = 0; this.spawnT = 0; this.shake = 0;
    document.getElementById('over').classList.remove('show'); this.nextWave();
  },
  nextWave() {
    this.wave++; this.toSpawn = 4 + this.wave * 3;
    const b = document.getElementById('banner'); b.textContent = 'VAGUE ' + this.wave; b.classList.add('show');
    setTimeout(() => b.classList.remove('show'), 1800);
  },
  spawn() {
    for (let i = 0; i < 30; i++) {
      const x = (1.5 + Math.random() * (CFG.MW - 3)) * CFG.TILE, y = (1.5 + Math.random() * (CFG.MH - 3)) * CFG.TILE;
      if (Math.hypot(x - this.p.x, y - this.p.y) > 120 && !GameMap.blocked(x, y, 4)) { this.zs.push(new Zombie(x, y, this.wave)); return; }
    }
  },
  // gerbe de particules ; si stain, chaque goutte laisse une tache au sol en retombant
  blood(x, y, n, col, stain = true) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, s = 20 + Math.random() * 70;
      this.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.2 + Math.random() * 0.35,
        col: col || BLOOD[Math.random() * 3 | 0], s: Math.random() < 0.3 ? 2 : 1, stain });
    }
  },
  update(dt) {
    const p = this.p;
    let aim = Input.getAimStick();
    if (Input.mouse.down) {
      const r = this.cv.getBoundingClientRect(), k = this.W / r.width;
      aim = { x: (Input.mouse.x - r.left) * k + this.cam.x - p.x, y: (Input.mouse.y - r.top) * k + this.cam.y - p.y, fire: true };
    }
    p.update(dt, Input.getMove(), aim, this);
    // apparition progressive des zombies
    if (this.toSpawn > 0 && (this.spawnT -= dt) <= 0) { this.spawn(); this.toSpawn--; this.spawnT = 0.7; }
    this.zs.forEach(z => z.update(dt, p));
    // zombies qui se repoussent entre eux
    for (let i = 0; i < this.zs.length; i++) for (let j = i + 1; j < this.zs.length; j++) {
      const a = this.zs[i], b = this.zs[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d < 9) { const f = (9 - d) / 2; moveEntity(a, -dx / d * f, -dy / d * f); moveEntity(b, dx / d * f, dy / d * f); }
    }
    // balles
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0) return false;
      if (GameMap.solidAt(b.x, b.y)) { this.blood(b.x, b.y, 4, '#8a7a5a', false); return false; }
      for (const z of this.zs) if (Math.hypot(z.x - b.x, z.y - 3 - b.y) < 7) {
        z.hp--; z.hit = 0.08; z.x += b.vx * 0.02; z.y += b.vy * 0.02;
        this.blood(b.x, b.y, 10); GameMap.splat(z.x, z.y + 3, 3);
        if (z.hp <= 0) {
          this.score += 10; this.blood(z.x, z.y - 4, 30); this.blood(z.x, z.y - 4, 5, '#3a0404');
          GameMap.splat(z.x, z.y + 3, 10); Sprites.corpse(GameMap.ctx, z.x, z.y + 3, z.v);
        }
        return false;
      }
      return true;
    });
    this.zs = this.zs.filter(z => z.hp > 0);
    this.fx = this.fx.filter(f => {
      f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - 3 * dt; f.vy *= 1 - 3 * dt;
      if ((f.life -= dt) > 0) return true;
      if (f.stain) GameMap.stain(f.x, f.y, f.col, f.s);
      return false;
    });
    // le joueur saigne quand il est touché
    if (p.hp < this.lastHp) { this.shake = 0.3; this.blood(p.x, p.y - 5, 16); GameMap.splat(p.x, p.y + 3, 4); }
    this.lastHp = p.hp; this.shake -= dt;
    if (!this.zs.length && !this.toSpawn) this.nextWave();
    if (p.hp <= 0) {
      this.state = 'over';
      document.getElementById('final').textContent = `Vague ${this.wave} · Score ${this.score}`;
      document.getElementById('over').classList.add('show');
    }
    // caméra (centrée si la map est plus petite que l'écran) + secousse
    const mw = CFG.MW * CFG.TILE, mh = CFG.MH * CFG.TILE, sk = this.shake > 0 ? 3 : 0;
    this.cam.x = Math.round((mw <= this.W ? (mw - this.W) / 2 : Math.max(0, Math.min(mw - this.W, p.x - this.W / 2))) + (Math.random() - 0.5) * sk);
    this.cam.y = Math.round((mh <= this.H ? (mh - this.H) / 2 : Math.max(0, Math.min(mh - this.H, p.y - this.H / 2))) + (Math.random() - 0.5) * sk);
    this.hud.hp.textContent = '♥'.repeat(Math.max(0, p.hp));
    this.hud.wave.textContent = 'Vague ' + this.wave; this.hud.score.textContent = this.score;
  },
  draw(t) {
    const c = this.c, cam = this.cam;
    if (this.state === 'menu') return MenuScene.draw(c, t);
    c.fillStyle = '#0a0806'; c.fillRect(0, 0, this.W, this.H);
    GameMap.draw(c, cam);
    [...this.zs, this.p].sort((a, b) => a.y - b.y).forEach(e => e.draw(c, cam));
    this.fx.forEach(f => { c.fillStyle = f.col; c.fillRect(Math.round(f.x - cam.x), Math.round(f.y - cam.y), f.s, f.s); });
    // nuit : seule une zone autour du soldat est éclairée (plus large au moment du tir)
    const p = this.p, px = p.x - cam.x, py = p.y - cam.y - 4, low = p.hp <= 2;
    const gr = c.createRadialGradient(px, py, 12, px, py, p.flash > 0 ? 115 : 90);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.45, 'rgba(6,2,3,.35)');
    gr.addColorStop(1, low ? `rgba(45,0,0,${0.85 + Math.sin(t / 150) * 0.08})` : 'rgba(6,2,3,.86)');
    c.fillStyle = gr; c.fillRect(0, 0, this.W, this.H);
    // yeux des zombies et balles traçantes visibles dans le noir
    this.zs.forEach(z => Sprites.zombieEyes(c, z.x - cam.x, z.y - cam.y, z.a));
    this.bullets.forEach(b => {
      const bx = Math.round(b.x - cam.x), by = Math.round(b.y - cam.y), n = Math.hypot(b.vx, b.vy);
      c.fillStyle = '#ff8a2a';
      for (let i = 1; i <= 4; i++) c.fillRect(Math.round(bx - b.vx / n * i), Math.round(by - b.vy / n * i), 1, 1);
      c.fillStyle = '#fff3b0'; c.fillRect(bx, by, 1, 1);
    });
    // voile rouge quand on prend un coup
    if (p.inv > 0.6) { c.fillStyle = `rgba(150,0,0,${(p.inv - 0.6) * 0.9})`; c.fillRect(0, 0, this.W, this.H); }
  },
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    if (this.state === 'play') this.update(dt);
    this.draw(t);
    requestAnimationFrame(t2 => this.loop(t2));
  }
};
