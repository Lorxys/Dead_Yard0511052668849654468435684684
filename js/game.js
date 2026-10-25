// Boucle principale : vagues, tirs, collisions, rendu, interface
const Game = {
  cam: { x: 0, y: 0 }, state: 'menu', zs: [], bullets: [], fx: [],
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
    this.W = CFG.VIEW_W; this.H = Math.round(this.W * innerHeight / innerWidth);
    this.cv.width = this.W; this.cv.height = this.H; this.c.imageSmoothingEnabled = false;
  },
  reset() {
    this.p = new Player(); this.zs = []; this.bullets = []; this.fx = [];
    this.wave = 0; this.score = 0; this.toSpawn = 0; this.spawnT = 0; this.state = 'play';
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
  blood(x, y, n, col) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 20 + Math.random() * 50; this.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3 + Math.random() * 0.3, col }); }
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
      if (d < 7) { const f = (7 - d) / 2; moveEntity(a, -dx / d * f, -dy / d * f); moveEntity(b, dx / d * f, dy / d * f); }
    }
    // balles
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0) return false;
      if (GameMap.solidAt(b.x, b.y)) { this.blood(b.x, b.y, 3, '#d8d8d8'); return false; }
      for (const z of this.zs) if (Math.hypot(z.x - b.x, z.y - (b.y + 2)) < 6) {
        z.hp--; z.hit = 0.1; z.x += b.vx * 0.02; z.y += b.vy * 0.02; this.blood(b.x, b.y, 4, '#a01818');
        if (z.hp <= 0) { this.score += 10; this.blood(z.x, z.y, 12, '#7a1010'); }
        return false;
      }
      return true;
    });
    this.zs = this.zs.filter(z => z.hp > 0);
    this.fx = this.fx.filter(f => { f.x += f.vx * dt; f.y += f.vy * dt; return (f.life -= dt) > 0; });
    if (!this.zs.length && !this.toSpawn) this.nextWave();
    if (p.hp <= 0) {
      this.state = 'over';
      document.getElementById('final').textContent = `Vague ${this.wave} · Score ${this.score}`;
      document.getElementById('over').classList.add('show');
    }
    // caméra (centrée si la map est plus petite que l'écran)
    const mw = CFG.MW * CFG.TILE, mh = CFG.MH * CFG.TILE;
    this.cam.x = Math.round(mw <= this.W ? (mw - this.W) / 2 : Math.max(0, Math.min(mw - this.W, p.x - this.W / 2)));
    this.cam.y = Math.round(mh <= this.H ? (mh - this.H) / 2 : Math.max(0, Math.min(mh - this.H, p.y - this.H / 2)));
    this.hud.hp.textContent = '♥'.repeat(Math.max(0, p.hp));
    this.hud.wave.textContent = 'Vague ' + this.wave; this.hud.score.textContent = this.score;
  },
  draw() {
    const c = this.c, cam = this.cam;
    c.fillStyle = '#101418'; c.fillRect(0, 0, this.W, this.H);
    GameMap.draw(c, cam);
    if (this.p) [...this.zs, this.p].sort((a, b) => a.y - b.y).forEach(e => e.draw(c, cam));
    c.fillStyle = '#ffe066';
    this.bullets.forEach(b => c.fillRect(Math.round(b.x - cam.x) - 1, Math.round(b.y - cam.y) - 1, 2, 2));
    this.fx.forEach(f => { c.fillStyle = f.col; c.fillRect(Math.round(f.x - cam.x), Math.round(f.y - cam.y), 1, 1); });
  },
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
    if (this.state === 'play') this.update(dt);
    this.draw();
    requestAnimationFrame(t2 => this.loop(t2));
  }
};
