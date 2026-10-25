// Boucle principale : vagues, tirs, collisions, rendu, interface
//
// Organisation prévue pour un futur mode multijoueur :
// - step()     : la simulation (joueurs, zombies, balles, vagues). Elle ne touche ni à l'écran ni au DOM ;
//                c'est la partie qui tournera sur l'hôte/serveur.
// - intentions : chaque joueur est piloté par { move, aim, fire }. Aujourd'hui elle vient du clavier/tactile
//                (readLocalIntent), demain elle pourra arriver du réseau pour les autres joueurs.
// - emit()     : la simulation signale ce qui se passe (tir, impact, mort...) sous forme d'événements ;
//                onEvent() en fait du sang, des secousses, des bannières. En réseau, ce sont ces événements
//                qu'on enverra aux autres joueurs.
// - pas de temps fixe (TICK) : la simulation avance par pas réguliers, quelle que soit la vitesse d'affichage.
// - this.players : liste de joueurs (un seul pour l'instant) ; localId = celui qu'on contrôle sur cette machine.
const TICK = 1 / 60;

const Game = {
  cam: { x: 0, y: 0 }, state: 'menu', players: [], zs: [], bullets: [], fx: [], events: [], shake: 0, acc: 0, localId: 1,
  init() {
    this.cv = document.getElementById('game'); this.c = this.cv.getContext('2d');
    this.hud = { hp: document.getElementById('hp'), wave: document.getElementById('wave'), score: document.getElementById('score') };
    this.resize(); addEventListener('resize', () => this.resize());
    GameMap.init(); Input.init(document.getElementById('touch'));
    document.getElementById('restart').onclick = () => this.reset();
    document.getElementById('toMenu').onclick = () => this.toMenu();
    // menu : le jeu ne démarre qu'au clic sur Jouer
    document.getElementById('play').onclick = () => { document.getElementById('menu').classList.remove('show'); this.lockLandscape(); this.reset(); };
    // mobile à la verticale : écran « tourne ton appareil » et jeu en pause
    this.portrait = matchMedia('(orientation: portrait) and (pointer: coarse)');
    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
  },
  // joueur contrôlé sur cette machine
  get me() { return this.players.find(p => p.id === this.localId); },
  // sur mobile : plein écran + orientation bloquée à l'horizontale (Android ; iOS ne le permet pas)
  lockLandscape() {
    const el = document.documentElement;
    if (!matchMedia('(pointer: coarse)').matches || !el.requestFullscreen) return;
    el.requestFullscreen().then(() => screen.orientation.lock('landscape')).catch(() => {});
  },
  resize() {
    this.W = this.state === 'menu' ? CFG.MENU_W : CFG.VIEW_W; this.H = Math.round(this.W * innerHeight / innerWidth);
    this.cv.width = this.W; this.cv.height = this.H; this.c.imageSmoothingEnabled = false;
    if (this.state === 'menu') MenuScene.build(this.W, this.H);
  },
  reset() {
    this.state = 'play'; this.resize(); GameMap.render(); GameMap.flowKey = null;
    // plus tard : un Player par joueur connecté, chacun sur son point d'apparition
    const s = GameMap.playerSpawn(0);
    this.players = [new Player(this.localId, s.x, s.y)];
    this.zs = []; this.bullets = []; this.fx = []; this.events = [];
    this.wave = 0; this.score = 0; this.toSpawn = 0; this.spawnT = 0; this.shake = 0; this.acc = 0;
    document.getElementById('over').classList.remove('show'); this.nextWave();
  },
  toMenu() {
    this.state = 'menu'; this.players = []; this.zs = []; this.bullets = []; this.fx = [];
    for (const k in this.hud) this.hud[k].textContent = '';
    document.getElementById('over').classList.remove('show');
    document.getElementById('menu').classList.add('show');
    this.resize();
  },
  emit(type, data) { this.events.push({ type, ...data }); },

  // ---------- simulation ----------
  nextWave() { this.wave++; this.toSpawn = 4 + this.wave * 3; this.emit('wave', { n: this.wave }); },
  spawn(alive) {
    for (let i = 0; i < 30; i++) {
      const x = (1.5 + Math.random() * (CFG.MW - 3)) * CFG.TILE, y = (1.5 + Math.random() * (CFG.MH - 3)) * CFG.TILE;
      if (alive.every(p => Math.hypot(x - p.x, y - p.y) > 120) && !GameMap.blocked(x, y, 4)) { this.zs.push(new Zombie(x, y, this.wave)); return; }
    }
  },
  // intents : { [id du joueur]: intention } pour ce pas de simulation
  step(dt, intents) {
    this.players.forEach(p => p.update(dt, intents[p.id] || NO_INTENT, this));
    const alive = this.players.filter(p => p.alive);
    GameMap.computeFlow(alive);
    // apparition progressive des zombies
    if (this.toSpawn > 0 && (this.spawnT -= dt) <= 0) { this.spawn(alive); this.toSpawn--; this.spawnT = 0.7; }
    this.zs.forEach(z => z.update(dt, this));
    // zombies qui se repoussent entre eux
    for (let i = 0; i < this.zs.length; i++) for (let j = i + 1; j < this.zs.length; j++) {
      const a = this.zs[i], b = this.zs[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d < 9) { const f = (9 - d) / 2; moveEntity(a, -dx / d * f, -dy / d * f); moveEntity(b, dx / d * f, dy / d * f); }
    }
    // balles
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0) return false;
      if (GameMap.solidAt(b.x, b.y)) { this.emit('impact', { x: b.x, y: b.y }); return false; }
      for (const z of this.zs) if (Math.hypot(z.x - b.x, z.y - 3 - b.y) < 7) {
        z.hp--; z.hit = 0.08; moveEntity(z, b.vx * 0.02, b.vy * 0.02);   // recul sans traverser les obstacles
        this.emit('hit', { x: b.x, y: b.y, zx: z.x, zy: z.y });
        if (z.hp <= 0) {
          this.score += 10;
          const owner = this.players.find(p => p.id === b.owner); if (owner) owner.kills++;
          this.emit('kill', { id: z.id, x: z.x, y: z.y, v: z.v, by: b.owner });
        }
        return false;
      }
      return true;
    });
    this.zs = this.zs.filter(z => z.hp > 0);
    if (!this.zs.length && !this.toSpawn) this.nextWave();
    // partie perdue quand plus aucun joueur n'est en vie
    if (!this.players.some(p => p.alive)) { this.state = 'over'; this.emit('gameover', { wave: this.wave, score: this.score }); }
  },

  // ---------- entrées locales ----------
  readLocalIntent(p) {
    let aim = Input.getAimStick();
    if (Input.mouse.down) {
      const r = this.cv.getBoundingClientRect(), k = this.W / r.width;
      aim = { x: (Input.mouse.x - r.left) * k + this.cam.x - p.x, y: (Input.mouse.y - r.top) * k + this.cam.y - p.y, fire: true };
    }
    return { move: Input.getMove(), aim, fire: !!(aim && aim.fire) };
  },

  // ---------- effets visuels (uniquement à l'écran, jamais dans la simulation) ----------
  // gerbe de particules ; si stain, chaque goutte laisse une tache au sol en retombant
  blood(x, y, n, col, stain = true) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, s = 20 + Math.random() * 70;
      this.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.2 + Math.random() * 0.35,
        col: col || BLOOD[Math.random() * 3 | 0], s: Math.random() < 0.3 ? 2 : 1, stain });
    }
  },
  onEvent(e) {
    switch (e.type) {
      case 'shoot': {   // douille éjectée sur le côté, elle reste au sol
        const a = e.a + Math.PI / 2 + (Math.random() - 0.5);
        this.fx.push({ x: e.x, y: e.y - 3, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: 0.25, col: '#c09a40', s: 1, stain: true });
        break;
      }
      case 'impact': this.blood(e.x, e.y, 4, '#8a7a5a', false); break;
      case 'hit': this.blood(e.x, e.y, 10); GameMap.splat(e.zx, e.zy + 3, 3); break;
      case 'kill':
        this.blood(e.x, e.y - 4, 30); this.blood(e.x, e.y - 4, 5, '#3a0404');
        GameMap.splat(e.x, e.y + 3, 10); Sprites.corpse(GameMap.ctx, e.x, e.y + 3, e.v);
        break;
      case 'hurt':      // le joueur saigne ; l'écran ne tremble que pour celui qui est touché
        if (e.id === this.localId) this.shake = 0.3;
        this.blood(e.x, e.y - 5, 16); GameMap.splat(e.x, e.y + 3, 4);
        break;
      case 'wave': {
        const b = document.getElementById('banner'); b.textContent = 'VAGUE ' + e.n; b.classList.add('show');
        setTimeout(() => b.classList.remove('show'), 1800);
        break;
      }
      case 'gameover':
        document.getElementById('final').textContent = `Vague ${e.wave} · Score ${e.score}`;
        document.getElementById('over').classList.add('show');
        break;
    }
  },
  updateVisuals(dt) {
    this.fx = this.fx.filter(f => {
      f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - 3 * dt; f.vy *= 1 - 3 * dt;
      if ((f.life -= dt) > 0) return true;
      if (f.stain) GameMap.stain(f.x, f.y, f.col, f.s);
      return false;
    });
    this.shake -= dt;
    const p = this.me; if (!p) return;
    // caméra sur le joueur local (centrée si la map est plus petite que l'écran) + secousse
    const mw = CFG.MW * CFG.TILE, mh = CFG.MH * CFG.TILE, sk = this.shake > 0 ? 3 : 0;
    this.cam.x = Math.round((mw <= this.W ? (mw - this.W) / 2 : Math.max(0, Math.min(mw - this.W, p.x - this.W / 2))) + (Math.random() - 0.5) * sk);
    this.cam.y = Math.round((mh <= this.H ? (mh - this.H) / 2 : Math.max(0, Math.min(mh - this.H, p.y - this.H / 2))) + (Math.random() - 0.5) * sk);
    this.hud.hp.textContent = '♥'.repeat(Math.max(0, p.hp));
    this.hud.wave.textContent = 'Vague ' + this.wave; this.hud.score.textContent = this.score;
  },
  draw(t) {
    const c = this.c, cam = this.cam, p = this.me;
    if (this.state === 'menu' || !p) return MenuScene.draw(c, t);
    c.fillStyle = '#0a0806'; c.fillRect(0, 0, this.W, this.H);
    GameMap.draw(c, cam);
    [...this.zs, ...this.players].sort((a, b) => a.y - b.y).forEach(e => e.draw(c, cam));
    this.fx.forEach(f => { c.fillStyle = f.col; c.fillRect(Math.round(f.x - cam.x), Math.round(f.y - cam.y), f.s, f.s); });
    // nuit : seule une zone autour du soldat est éclairée (plus large au moment du tir)
    const px = p.x - cam.x, py = p.y - cam.y - 4, low = p.hp <= 2;
    const gr = c.createRadialGradient(px, py, 12, px, py, this.W * (p.flash > 0 ? 0.48 : 0.375));
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
    const dt = Math.min(0.25, (t - this.last) / 1000); this.last = t;
    if (this.state === 'play' && !this.portrait.matches) {
      // simulation à pas fixe ; l'intention du joueur local est lue à chaque pas
      this.acc += dt;
      while (this.acc >= TICK && this.state === 'play') {
        const me = this.me;
        this.step(TICK, me ? { [me.id]: this.readLocalIntent(me) } : {});
        this.acc -= TICK;
      }
    }
    this.events.splice(0).forEach(e => this.onEvent(e));
    if (this.state !== 'menu') this.updateVisuals(dt);
    this.draw(t);
    requestAnimationFrame(t2 => this.loop(t2));
  }
};
