// Boucle principale : vagues, tirs, collisions, rendu, interface
//
// Organisation prévue pour un futur mode multijoueur :
// - step()     : la simulation (joueurs, zombies, balles, vagues). Elle ne touche ni à l'écran ni au DOM ;
//                c'est la partie qui tournera sur l'hôte/serveur.
// - intentions : chaque joueur est piloté par { move, aim, fire, grenade, buy }. Aujourd'hui elle vient du clavier/tactile
//                (readLocalIntent), demain elle pourra arriver du réseau pour les autres joueurs.
// - emit()     : la simulation signale ce qui se passe (tir, impact, mort...) sous forme d'événements ;
//                onEvent() en fait du sang, des secousses, des bannières. En réseau, ce sont ces événements
//                qu'on enverra aux autres joueurs.
// - pas de temps fixe (TICK) : la simulation avance par pas réguliers, quelle que soit la vitesse d'affichage.
// - this.players : liste de joueurs (un seul pour l'instant) ; localId = celui qu'on contrôle sur cette machine.
const TICK = 1 / 60;

const Game = {
  cam: { x: 0, y: 0 }, state: 'menu', players: [], zs: [], bullets: [], nades: [], fx: [], lights: [], events: [], shake: 0, acc: 0, localId: 1,
  init() {
    this.cv = document.getElementById('game'); this.c = this.cv.getContext('2d');
    this.hud = { nades: document.getElementById('nades'), weapon: document.getElementById('weapon'), wave: document.getElementById('wave'), score: document.getElementById('score') };
    // barre de vie : remplissage, « fantôme » qui montre les PV perdus, texte ; un trait tous les dégâts de zombie
    const bar = this.hpBar = document.getElementById('hpbar');
    this.hpFill = bar.querySelector('.fill'); this.hpGhost = bar.querySelector('.ghost'); this.hpText = document.getElementById('hptext');
    bar.style.setProperty('--seg', CFG.ZOMBIE.dmg / CFG.PLAYER.hp * 100 + '%');
    this.gStick = document.getElementById('sG'); this.gCount = document.getElementById('nadeCount');
    // panneau d'achat devant une machine à atout + icônes des atouts possédés
    this.buy = { box: document.getElementById('buy'), name: document.getElementById('buyName'), btn: document.getElementById('buyBtn'), label: document.getElementById('buyLabel'), info: document.getElementById('buyInfo'), price: document.getElementById('buyPrice') };
    this.buy.btn.addEventListener('pointerdown', e => { e.preventDefault(); Input.buyQueue = true; });
    this.perkBox = document.getElementById('perks'); this.shownPerks = '';
    this.resize(); addEventListener('resize', () => this.resize());
    GameMap.load('noman'); Input.init(document.getElementById('touch'));
    Sound.attach(); Sound.menu(true);   // la musique du menu démarre au premier appui (règle des navigateurs)
    document.getElementById('restart').onclick = () => this.reset();
    document.getElementById('toMenu').onclick = () => this.toWorld();
    // menu : Jouer ouvre la carte du monde, où l'on choisit le front puis la map
    // Jouer -> choix du type de partie : carte du monde ou cartes personnalisées (écran encore vide)
    const screen = id => ['menu', 'mode', 'custom'].forEach(s => document.getElementById(s).classList.toggle('show', s === id));
    WorldScene.init((front, map) => { this.front = front; this.mapId = map; WorldScene.hide(); this.reset(); }, () => { this.toMenu(); screen('mode'); });
    document.getElementById('play').onclick = () => { this.lockLandscape(); screen('mode'); };
    document.getElementById('toWorld').onclick = () => this.toWorld();
    document.getElementById('toCustom').onclick = () => screen('custom');
    document.getElementById('modeBack').onclick = () => screen('menu');
    document.getElementById('customBack').onclick = () => screen('mode');
    // réglages en jeu : pause, puis reprendre ou quitter vers la carte du monde (Échap ou P au clavier)
    document.getElementById('pauseBtn').onclick = () => this.pause(true);
    document.getElementById('resume').onclick = () => this.pause(false);
    // quitter demande confirmation : la partie en cours sera perdue
    const pauseBox = document.getElementById('pause');
    document.getElementById('quit').onclick = () => pauseBox.classList.add('ask');
    document.getElementById('quitNo').onclick = () => pauseBox.classList.remove('ask');
    document.getElementById('quitYes').onclick = () => this.toWorld();
    addEventListener('keydown', e => {
      if (e.repeat || (e.code !== 'Escape' && e.code !== 'KeyP')) return;
      if (this.state === 'play' || this.state === 'pause') this.pause(this.state === 'play');
      else if (this.state === 'world' && e.code === 'Escape') WorldScene.back();
    });
    // mobile à la verticale : écran « tourne ton appareil » et jeu en pause
    this.portrait = matchMedia('(orientation: portrait) and (pointer: coarse)');
    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
    // mise à jour automatique au lancement et au retour sur l'appli (seulement depuis le menu, jamais en pleine partie)
    this.checkUpdate();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && (this.state === 'menu' || this.state === 'world')) this.checkUpdate(); });
  },
  // le téléphone peut garder une ancienne index.html en cache : on demande la version en ligne sans cache
  // et, si elle diffère de celle affichée dans le menu, on recharge la page à une adresse neuve (?v=...)
  checkUpdate() {
    if (!location.protocol.startsWith('http')) return;
    const cur = document.querySelector('#menu .version').textContent.trim();
    fetch(location.pathname + '?nocache=' + Date.now(), { cache: 'no-store' })
      .then(r => r.text())
      .then(html => {
        const m = html.match(/class="version">v([\d.]+)</);
        if (m && 'v' + m[1] !== cur && !location.search.includes('v=' + m[1])) location.replace(location.pathname + '?v=' + m[1]);
      })
      .catch(() => {});
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
    this.W = this.state === 'menu' ? CFG.MENU_W : this.state === 'world' ? CFG.WORLD_W : CFG.VIEW_W; this.H = Math.round(this.W * innerHeight / innerWidth);
    this.cv.width = this.W; this.cv.height = this.H; this.c.imageSmoothingEnabled = false;
    if (this.state === 'menu') MenuScene.build(this.W, this.H);
    if (this.state === 'world') WorldScene.build(this.W, this.H);
  },
  reset() {
    this.state = 'play'; this.resize(); GameMap.load(this.mapId || 'noman');   // map neuve : portes refermées, sang effacé
    Sound.menu(false); Sound.setNear(null);   // en jeu : pas de musique, seulement les bruitages
    // plus tard : un Player par joueur connecté, chacun sur son point d'apparition
    const s = GameMap.playerSpawn(0);
    this.players = [new Player(this.localId, s.x, s.y)];
    this.zs = []; this.bullets = []; this.nades = []; this.fx = []; this.lights = []; this.events = [];
    // boîte mystère : idle (fermée) -> rolling (les armes défilent) -> ready (l'arme attend son propriétaire) -> idle
    this.box = { state: 'idle', t: 0, weapon: null, owner: null };
    this.wave = 0; this.score = 0; this.toSpawn = 0; this.spawnT = 0; this.shake = 0; this.acc = 0; this.ghostHp = CFG.PLAYER.hp;
    document.body.classList.add('playing');   // affiche le joystick grenade sur mobile
    document.getElementById('over').classList.remove('show'); this.nextWave();
  },
  // quitte la partie en cours (s'il y en a une) pour le menu principal ou la carte du monde
  leaveGame(state) {
    this.state = state; this.players = []; this.zs = []; this.bullets = []; this.nades = []; this.fx = []; this.lights = [];
    Sound.menu(true); Sound.setNear(null);
    for (const k in this.hud) this.hud[k].textContent = '';
    document.body.classList.remove('playing');
    ['over', 'pause', 'menu', 'mode', 'custom'].forEach(id => document.getElementById(id).classList.remove('show'));
    this.resize();
  },
  toMenu() { WorldScene.hide(); this.leaveGame('menu'); document.getElementById('menu').classList.add('show'); },
  toWorld() { this.leaveGame('world'); WorldScene.show(); },
  // pause : la simulation s'arrête, le jingle de la machine se tait ; on relâche le tir pour ne pas repartir en rafale
  pause(on) {
    if (on && this.state !== 'play') return;
    this.state = on ? 'pause' : 'play';
    document.getElementById('pause').classList.toggle('show', on);
    document.getElementById('pause').classList.remove('ask');
    Input.mouse.down = false; Input.nadeQueue = null; Input.buyQueue = false;
    if (on) Sound.setNear(null);
  },
  emit(type, data) { this.events.push({ type, ...data }); },

  // ---------- simulation ----------
  nextWave() {
    this.wave++; this.toSpawn = 4 + this.wave * 3;
    // ravitaillement en grenades à chaque nouvelle vague
    if (this.wave > 1) this.players.forEach(p => { if (p.alive) p.grenades = Math.min(CFG.GRENADE.max, p.grenades + CFG.GRENADE.perWave); });
    this.emit('wave', { n: this.wave });
  },
  // point d'impact d'une grenade : vers la cible (relative au joueur), limité par la portée et arrêté par les obstacles
  nadeTarget(p, rel) {
    const d = Math.min(Math.hypot(rel.x, rel.y), CFG.GRENADE.range), a = Math.atan2(rel.y, rel.x);
    let tx = p.x, ty = p.y;
    for (let s = 2; s <= d; s += 2) {
      const nx = p.x + Math.cos(a) * s, ny = p.y + Math.sin(a) * s;
      if (GameMap.solidAt(nx, ny)) break;
      tx = nx; ty = ny;
    }
    return { x: tx, y: ty };
  },
  throwGrenade(p, rel) {
    const tg = this.nadeTarget(p, rel);
    this.nades.push({ id: nextId++, owner: p.id, sx: p.x, sy: p.y, tx: tg.x, ty: tg.y, x: p.x, y: p.y, z: 0, t: 0 });
    this.emit('throw', { id: p.id, x: p.x, y: p.y });
  },
  // définition (nom, couleur, description) d'un atout ou de l'amélioration d'arme
  perkDef(k) { return k === 'upgrade' ? CFG.UPGRADE : CFG.PERKS[k]; },
  owns(p, k) { return k === 'upgrade' ? p.upgraded : !!p.perks[k]; },
  priceOf(p, k) { return k === 'upgrade' ? CFG.UPGRADE.price : p.perkPrice; },
  // ce que propose une machine au joueur ({ name, info, color, label, price }), ou null : rien à acheter
  // (atout déjà acquis, boîte en plein tirage ou arme sortie pour un autre joueur)
  offer(p, m) {
    if (m.perk === 'door') return { name: CFG.DOOR.name, info: 'Accès : ' + GameMap.doorTarget(m, p), color: CFG.DOOR.color, label: 'Ouvrir', price: CFG.DOOR.price };
    if (m.perk === 'box') {
      const B = this.box, C = CFG.BOX;
      if (B.state === 'idle') return { name: C.name, info: C.info, color: C.color, label: 'Acheter', price: C.price };
      if (B.state === 'ready' && B.owner === p.id) return { name: CFG.WEAPONS[B.weapon].name, info: '', color: C.color, label: 'Prendre', price: 0 };
      return null;
    }
    if (this.owns(p, m.perk)) return null;
    const def = this.perkDef(m.perk);
    return { name: def.name, info: def.info, color: def.color, label: 'Acheter', price: this.priceOf(p, m.perk) };
  },
  // achat à la machine devant laquelle se tient le joueur (les points servent de monnaie)
  buyPerk(p) {
    const m = GameMap.nearMachine(p); if (!m) return;
    if (m.perk === 'box') return this.useBox(p);
    if (m.perk === 'door') return this.openDoor(p, m);
    const def = this.perkDef(m.perk), price = this.priceOf(p, m.perk);
    if (this.owns(p, m.perk)) return;   // chaque atout et l'amélioration ne s'achètent qu'une fois
    if (p.score < price) { this.emit('buyfail', { id: p.id, perk: m.perk }); return; }
    p.score -= price;
    if (m.perk === 'upgrade') p.upgraded = true; else p.perks[m.perk] = true;
    if (def.maxHp) { p.hp += def.maxHp - p.maxHp; p.maxHp = def.maxHp; }
    this.emit('perk', { id: p.id, perk: m.perk, x: p.x, y: p.y });
  },
  // porte : payer fait s'effondrer la barricade ; la zone derrière s'ouvre (et les zombies peuvent y apparaître)
  openDoor(p, d) {
    if (p.score < CFG.DOOR.price) { this.emit('buyfail', { id: p.id, perk: 'door' }); return; }
    p.score -= CFG.DOOR.price;
    const T = CFG.TILE, zones = GameMap.unlock(d);
    this.emit('door', { id: p.id, x: (d.tx + d.w / 2) * T, y: (d.ty + d.h / 2) * T, w: d.w * T, h: d.h * T, zones });
  },
  // boîte mystère : payer lance le tirage ; une fois l'arme sortie, seul celui qui a payé peut la prendre
  useBox(p) {
    const B = this.box, C = CFG.BOX;
    if (B.state === 'idle') {
      if (p.score < C.price) { this.emit('buyfail', { id: p.id, perk: 'box' }); return; }
      const pool = C.weapons.filter(w => w !== p.weapon);   // jamais l'arme qu'on a déjà en main
      p.score -= C.price;
      Object.assign(B, { state: 'rolling', t: 0, owner: p.id, weapon: pool[Math.random() * pool.length | 0] });
      this.emit('boxopen', { id: p.id });
    } else if (B.state === 'ready' && B.owner === p.id) {
      p.weapon = B.weapon; p.cd = 0; p.upgraded = false;   // l'amélioration reste sur l'ancienne arme : à racheter
      Object.assign(B, { state: 'idle', t: 0, owner: null, weapon: null });
      this.emit('pickup', { id: p.id, weapon: p.weapon, x: p.x, y: p.y });
    }
  },
  updateBox(dt) {
    const B = this.box, C = CFG.BOX;
    if (B.state === 'idle') return;
    B.t += dt;
    if (B.state === 'rolling' && B.t >= C.roll) { B.state = 'ready'; B.t = 0; this.emit('boxready', { id: B.owner, weapon: B.weapon }); }
    else if (B.state === 'ready' && B.t >= C.keep) { Object.assign(B, { state: 'idle', t: 0, owner: null, weapon: null }); this.emit('boxclose', {}); }
  },
  // dégâts d'une balle selon la distance parcourue (baisse progressive entre fall[0] et fall[1])
  bulletDamage(b) {
    if (!b.fall) return b.dmg;
    const k = Math.min(1, Math.max(0, (b.d - b.fall[0]) / (b.fall[1] - b.fall[0])));
    return b.dmg + (b.far - b.dmg) * k;
  },
  // inflige des dégâts à un zombie et donne les points au joueur responsable :
  // chaque balle (ou plomb) qui touche rapporte les points de touche, la prime de mort n'est donnée qu'une fois
  damageZombie(z, dmg, ownerId) {
    const killed = z.hp > 0 && z.hp - dmg <= 0;
    z.hp -= dmg; z.hit = 0.08;
    const owner = this.players.find(p => p.id === ownerId), pts = CFG.SCORE.hit + (killed ? CFG.SCORE.kill : 0);
    this.score += pts;
    if (owner) { owner.score += pts; if (killed) owner.kills++; }
    if (killed) this.emit('kill', { id: z.id, x: z.x, y: z.y, v: z.v, by: ownerId });
  },
  explode(n) {
    const G = CFG.GRENADE;
    for (const z of this.zs) {
      const d = Math.hypot(z.x - n.x, z.y - 3 - n.y);
      if (z.hp <= 0 || d > G.radius) continue;
      this.damageZombie(z, Math.ceil(G.damage * (1 - 0.6 * d / G.radius)), n.owner);
      const k = 10 * (1 - d / G.radius) / (d || 1);   // souffle qui repousse
      moveEntity(z, (z.x - n.x) * k, (z.y - n.y) * k);
    }
    this.emit('explode', { x: n.x, y: n.y });
  },
  // un zombie apparaît dans une zone ouverte : jamais sous le nez d'un joueur (120 px), ni trop loin sur les grandes maps
  // (au-delà de 360 px il mettrait trop longtemps à arriver ; accepté seulement en dernier recours)
  spawn(alive) {
    const T = CFG.TILE, tiles = [...GameMap.openZones].flatMap(z => GameMap.zoneTiles[z]);
    for (let i = 0; i < 40; i++) {
      const [tx, ty] = tiles[Math.random() * tiles.length | 0], x = (tx + 0.5) * T, y = (ty + 0.5) * T;
      const d = Math.min(...alive.map(p => Math.hypot(x - p.x, y - p.y)));
      if (d > 120 && (d < 360 || i >= 30) && !GameMap.blocked(x, y, 4)) { this.zs.push(new Zombie(x, y, this.wave)); return; }
    }
  },
  // intents : { [id du joueur]: intention } pour ce pas de simulation
  step(dt, intents) {
    this.players.forEach(p => p.update(dt, intents[p.id] || NO_INTENT, this));
    const alive = this.players.filter(p => p.alive);
    GameMap.computeFlow(alive);
    // apparition progressive des zombies
    if (this.toSpawn > 0 && (this.spawnT -= dt) <= 0) { this.spawn(alive); this.toSpawn--; this.spawnT = 0.7; }
    this.updateBox(dt); GameMap.updateDoors(dt);
    this.zs.forEach(z => z.update(dt, this));
    // zombies qui se repoussent entre eux
    for (let i = 0; i < this.zs.length; i++) for (let j = i + 1; j < this.zs.length; j++) {
      const a = this.zs[i], b = this.zs[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d < 9) { const f = (9 - d) / 2; moveEntity(a, -dx / d * f, -dy / d * f); moveEntity(b, dx / d * f, dy / d * f); }
    }
    // balles
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.d += Math.hypot(b.vx, b.vy) * dt;
      if (b.life <= 0) return false;
      if (GameMap.solidAt(b.x, b.y)) { this.emit('impact', { x: b.x, y: b.y }); return false; }
      for (const z of this.zs) if (Math.hypot(z.x - b.x, z.y - 3 - b.y) < 7) {
        moveEntity(z, b.vx * 0.02, b.vy * 0.02);   // recul sans traverser les obstacles
        this.emit('hit', { x: b.x, y: b.y, zx: z.x, zy: z.y });
        this.damageZombie(z, this.bulletDamage(b), b.owner);   // points : chaque balle qui touche + bonus au coup fatal
        return false;
      }
      return true;
    });
    // grenades : vol en cloche jusqu'au point d'impact, puis explosion à la fin de la mèche
    const G = CFG.GRENADE;
    this.nades = this.nades.filter(n => {
      n.t += dt;
      const k = Math.min(1, n.t / G.flight), dist = Math.hypot(n.tx - n.sx, n.ty - n.sy);
      n.x = n.sx + (n.tx - n.sx) * k; n.y = n.sy + (n.ty - n.sy) * k;
      n.z = Math.sin(Math.PI * k) * (8 + dist * 0.12);
      if (n.t < G.fuse) return true;
      this.explode(n);
      return false;
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
    const q = Input.takeGrenade();
    const grenade = !q ? null : q.screen ? this.screenToRel(q.screen, p) : this.stickToRel(q.stick);
    return { move: Input.getMove(), aim, fire: !!(aim && aim.fire), grenade, buy: Input.takeBuy() };
  },
  screenToRel(s, p) {
    const r = this.cv.getBoundingClientRect(), k = this.W / r.width;
    return { x: (s.x - r.left) * k + this.cam.x - p.x, y: (s.y - r.top) * k + this.cam.y - p.y };
  },
  // joystick grenade : la direction et l'inclinaison donnent la cible ;
  // centre = aux pieds du joueur (simple appui), poussé à fond = portée max
  stickToRel(v) {
    const R = CFG.GRENADE.range;
    return { x: v.x * R, y: v.y * R };
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
  // volume et position gauche/droite d'un son selon sa distance au joueur local
  heard(x, y, range = 400) {
    const p = this.me; if (!p) return { vol: 1 };
    const d = Math.hypot(x - p.x, y - p.y);
    return { vol: Math.max(0, 1 - d / range), pan: (x - p.x) / 200 };
  },
  onEvent(e) {
    switch (e.type) {
      case 'shoot': {   // coup de feu + douille éjectée sur le côté, elle reste au sol
        Sound.shot(e.w, this.heard(e.x, e.y));
        const a = e.a + Math.PI / 2 + (Math.random() - 0.5);
        this.fx.push({ x: e.x, y: e.y - 3, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: 0.25, col: '#c09a40', s: 1, stain: true });
        break;
      }
      case 'impact': this.blood(e.x, e.y, 4, '#8a7a5a', false); break;
      case 'hit': this.blood(e.x, e.y, 10); GameMap.splat(e.zx, e.zy + 3, 3); break;
      case 'kill':
        this.blood(e.x, e.y - 4, 30); this.blood(e.x, e.y - 4, 5, '#3a0404');
        GameMap.splat(e.x, e.y + 3, 10); Sprites.corpse(GameMap.messCtx, e.x, e.y + 3, e.v);
        Sound.splat(this.heard(e.x, e.y));
        break;
      case 'hurt':      // le joueur saigne ; l'écran ne tremble que pour celui qui est touché
        if (e.id === this.localId) { this.shake = 0.3; Sound.bite(); }
        this.blood(e.x, e.y - 5, 16); GameMap.splat(e.x, e.y + 3, 4);
        break;
      case 'wave': {   // nouvelle manche : cadavres, sang et douilles s'estompent petit à petit
        GameMap.clearMess();
        const b = document.getElementById('banner'); b.textContent = 'VAGUE ' + e.n; b.classList.add('show');
        setTimeout(() => b.classList.remove('show'), 1800);
        break;
      }
      case 'explode': {
        const FIRE = ['#fff2b0', '#ffd060', '#ff9a30', '#ff5a1e', '#b3301a'];
        for (let i = 0; i < 45; i++) {
          const a = Math.random() * 6.28, s = 30 + Math.random() * 110;
          this.fx.push({ x: e.x, y: e.y - 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.8, life: 0.12 + Math.random() * 0.3, col: FIRE[Math.random() * 5 | 0], s: Math.random() < 0.4 ? 2 : 1 });
        }
        for (let i = 0; i < 18; i++) {   // fumée
          const a = Math.random() * 6.28, s = 6 + Math.random() * 18;
          this.fx.push({ x: e.x, y: e.y - 3, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 8, life: 0.7 + Math.random() * 0.7, col: 'rgba(58,50,48,.55)', s: 3 });
        }
        this.blood(e.x, e.y, 26, '#2a2018');   // terre projetée qui retombe
        GameMap.scorch(e.x, e.y, Math.round(CFG.GRENADE.radius * 0.45));
        this.lights.push({ x: e.x, y: e.y, t: 0.4 });
        const me = this.me; if (me && Math.hypot(me.x - e.x, me.y - e.y) < 160) this.shake = 0.45;
        Sound.explosion(this.heard(e.x, e.y, 600));
        break;
      }
      case 'perk': {   // atout acheté : bannière à la couleur de la machine + gerbe d'étincelles
        const def = this.perkDef(e.perk), b = document.getElementById('banner');
        if (e.id === this.localId) {
          b.textContent = def.name.toUpperCase(); b.style.color = def.color; b.classList.add('show');
          setTimeout(() => { b.classList.remove('show'); b.style.color = ''; }, 1800);
        }
        if (e.id === this.localId) e.perk === 'upgrade' ? Sound.upgrade() : Sound.perkBuy();
        this.blood(e.x, e.y - 6, 30, def.color, false);
        this.lights.push({ x: e.x, y: e.y, t: 0.4 });
        break;
      }
      case 'boxopen': {   // couvercle qui s'ouvre et boîte à musique pendant tout le tirage
        const b = GameMap.box, x = (b.tx + 1) * CFG.TILE, y = b.ty * CFG.TILE;
        this.lights.push({ x, y, t: 0.4 }); Sound.boxRoll(CFG.BOX.roll, this.heard(x, y, 500));
        break;
      }
      case 'boxclose': { const b = GameMap.box; Sound.boxClose(this.heard((b.tx + 1) * CFG.TILE, b.ty * CFG.TILE)); break; }
      case 'door': {   // la barricade s'effondre : poussière, éclats de bois, grondement ; bannière avec la zone ouverte
        Sound.door(this.heard(e.x, e.y));
        for (let i = 0; i < 6; i++) {
          const x = e.x + (Math.random() - 0.5) * e.w, y = e.y + (Math.random() - 0.5) * e.h;
          this.blood(x, y, 8, '#6a5a44', false); this.blood(x, y, 4, '#4a3018', false);
        }
        this.shake = 0.25;
        if (e.id === this.localId && e.zones.length) {
          const b = document.getElementById('banner'); b.textContent = e.zones.join(' · ').toUpperCase(); b.style.color = CFG.DOOR.color; b.classList.add('show');
          setTimeout(() => { b.classList.remove('show'); b.style.color = ''; }, 2200);
        }
        break;
      }
      case 'pickup': {   // nouvelle arme en main : bannière avec son nom
        if (e.id === this.localId) {
          const b = document.getElementById('banner'); b.textContent = CFG.WEAPONS[e.weapon].name.toUpperCase(); b.style.color = CFG.BOX.color; b.classList.add('show');
          setTimeout(() => { b.classList.remove('show'); b.style.color = ''; }, 1800);
        }
        if (e.id === this.localId) Sound.pickup();
        this.blood(e.x, e.y - 6, 20, CFG.BOX.color, false);
        break;
      }
      case 'buyfail':
        if (e.id === this.localId) { this.buy.box.classList.remove('nope'); void this.buy.box.offsetWidth; this.buy.box.classList.add('nope'); Sound.denied(); }
        break;
      case 'gameover':
        document.body.classList.remove('playing'); Sound.setNear(null);
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
    this.shake -= dt; GameMap.updateFade(dt);
    this.lights = this.lights.filter(l => (l.t -= dt) > 0);
    const p = this.me; if (!p) return;
    this.updateSounds(p, dt);
    this.hud.nades.textContent = '×' + p.grenades;
    this.gCount.textContent = p.grenades; this.gStick.classList.toggle('empty', !p.grenades);
    // caméra sur le joueur local (centrée si la map est plus petite que l'écran) + secousse
    const mw = GameMap.W * CFG.TILE, mh = GameMap.H * CFG.TILE, sk = this.shake > 0 ? 3 : 0;
    this.cam.x = Math.round((mw <= this.W ? (mw - this.W) / 2 : Math.max(0, Math.min(mw - this.W, p.x - this.W / 2))) + (Math.random() - 0.5) * sk);
    // marge de 22 px en haut (sous le HUD) et en bas pour bien voir les machines et leur bouton d'achat
    this.cam.y = Math.round((mh <= this.H ? (mh - this.H) / 2 : Math.max(-22, Math.min(mh - this.H + 22, p.y - this.H / 2))) + (Math.random() - 0.5) * sk);
    // barre de vie : le fantôme rattrape la vie réelle en douceur pour montrer les dégâts encaissés
    const hp = Math.max(0, p.hp);
    this.ghostHp = hp > this.ghostHp ? hp : Math.max(hp, this.ghostHp - 90 * dt);
    this.hpFill.style.width = hp / p.maxHp * 100 + '%'; this.hpGhost.style.width = this.ghostHp / p.maxHp * 100 + '%';
    this.hpText.textContent = Math.ceil(hp);
    this.hpBar.classList.toggle('regen', p.alive && hp < p.maxHp && p.sinceHit >= p.regenDelay);
    this.hpBar.classList.toggle('low', p.alive && hp <= p.maxHp * 0.4);
    this.hud.wave.textContent = 'Vague ' + this.wave; this.hud.score.textContent = p.score;   // points à dépenser
    this.hud.weapon.textContent = p.gun.name;
    this.hpBar.style.setProperty('--seg', CFG.ZOMBIE.dmg / p.maxHp * 100 + '%');
    // bouton posé sur la machine devant laquelle se tient le joueur, prix en dessous
    const m = p.alive && GameMap.nearMachine(p), B = this.buy, o = m && this.offer(p, m);
    B.box.classList.toggle('show', !!o);
    if (o) {
      const r = this.cv.getBoundingClientRect(), k = r.width / this.W;
      B.box.style.left = r.left + ((m.tx + (m.w || 1) / 2) * CFG.TILE - this.cam.x) * k + 'px';
      // machine du bas : bouton sur son socle pour laisser voir la chambre lumineuse ;
      // boîte : au-dessus quand elle est fermée, sur sa face avant quand l'arme flotte au-dessus
      // porte : bouton au milieu de la barricade
      const dy = m.perk === 'door' ? m.h * CFG.TILE / 2 : m.perk === 'upgrade' ? 22 : m.perk === 'box' ? (this.box.state === 'idle' ? -8 : 12) : 8;
      B.box.style.top = r.top + (m.ty * CFG.TILE + dy - this.cam.y) * k + 'px';
      B.info.textContent = o.info; B.name.textContent = o.name; B.name.style.color = o.color; B.label.textContent = o.label;
      B.price.textContent = o.price ? o.price + ' pts' : '';
      B.box.classList.toggle('poor', !!o.price && p.score < o.price);
    }
    // icônes des atouts possédés (l'arme améliorée n'est pas un atout : pas d'icône), centrées en bas ; la rangée est refaite à chaque achat
    const owned = Object.keys(p.perks), key = owned.join();
    if (key !== this.shownPerks) {
      const before = this.shownPerks.split(',');
      this.shownPerks = key; this.perkBox.textContent = '';
      owned.forEach(k => {
        const cv = document.createElement('canvas'); this.drawPerkIcon(cv, k);
        cv.classList.toggle('new', !before.includes(k));   // le nouvel atout apparaît avec un flash
        this.perkBox.appendChild(cv);
      });
    }
  },
  // sons continus : pas du joueur, gémissements des zombies proches, jingle de la machine devant laquelle on se tient
  updateSounds(p, dt) {
    const st = Math.floor(p.walk / 2);   // un pas toutes les 2 unités de marche
    if (st !== this.lastStep) { this.lastStep = st; if (p.alive && this.state === 'play') Sound.step(); }
    for (const z of this.zs) {
      z.moanT = (z.moanT ?? 1 + Math.random() * 5) - dt;
      if (z.moanT > 0) continue;
      z.moanT = 3 + Math.random() * 6;
      const d = Math.hypot(z.x - p.x, z.y - p.y);
      if (d < 260 && Sound.moanFree()) Sound.growl({ vol: Math.pow(1 - d / 260, 1.5), pan: (z.x - p.x) / 200 });
    }
    const m = this.state === 'play' && p.alive && GameMap.nearMachine(p);
    Sound.setNear(m && Sound.JINGLES[m.perk] ? m.perk : null);   // la boîte et les portes n'ont pas de jingle
  },
  // état affiché de la boîte mystère : pendant le tirage, les armes défilent de plus en plus lentement
  // puis s'arrêtent sur l'arme tirée ; elle clignote les 3 dernières secondes avant de redescendre dans la boîte
  boxView() {
    const B = this.box, C = CFG.BOX;
    if (B.state === 'rolling') {
      const phase = 14 * B.t - 1.5 * B.t * B.t, w = B.t > C.roll - 0.5 ? B.weapon : C.weapons[Math.floor(phase) % C.weapons.length];
      return { open: true, weapon: w, rise: Math.min(1, B.t / 0.8) };
    }
    if (B.state === 'ready') return { open: true, weapon: B.weapon, rise: 1, hide: B.t > C.keep - 3 && Math.floor(B.t * 8) % 2 === 1 };
    return { open: false };
  },
  // icône d'atout (9x9 pixels : fond sombre bordé de la couleur, symbole au centre), agrandie en CSS
  drawPerkIcon(cv, perk) {
    cv.width = cv.height = 9;
    const g = cv.getContext('2d'), [main, dark, light] = Sprites.PERK_PAL[perk];
    g.fillStyle = main; g.fillRect(0, 0, 9, 9); g.fillStyle = dark; g.fillRect(1, 1, 7, 7);
    Sprites.perkIcon(g, 1, 1, perk, light);
  },
  draw(t) {
    const c = this.c, cam = this.cam, p = this.me;
    if (this.state === 'world') return WorldScene.draw(c, t);
    if (this.state === 'menu' || !p) return MenuScene.draw(c, t);
    c.fillStyle = '#0a0806'; c.fillRect(0, 0, this.W, this.H);
    GameMap.draw(c, cam);
    const T = CFG.TILE;
    GameMap.drawDoors(c, cam);
    GameMap.machines.forEach(m => Sprites.perkMachine(c, m.tx * T - cam.x, m.ty * T - cam.y, m.perk));
    const fg = GameMap.forge; Sprites.forge(c, fg.tx * T - cam.x, fg.ty * T - cam.y);
    const mb = GameMap.box, bv = this.boxView(); Sprites.mysteryBox(c, mb.tx * T - cam.x, mb.ty * T - cam.y, bv.open);
    [...this.zs, ...this.players].sort((a, b) => a.y - b.y).forEach(e => e.draw(c, cam));
    this.nades.forEach(n => Sprites.grenade(c, n.x - cam.x, n.y - cam.y, n.z));
    this.fx.forEach(f => { c.fillStyle = f.col; c.fillRect(Math.round(f.x - cam.x), Math.round(f.y - cam.y), f.s, f.s); });
    // nuit : seule une zone autour du soldat est éclairée (plus large au moment du tir)
    const px = p.x - cam.x, py = p.y - cam.y - 4, low = p.hp <= p.maxHp * 0.4;
    const gr = c.createRadialGradient(px, py, 12, px, py, this.W * (p.flash > 0 ? 0.48 : 0.375));
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.45, 'rgba(6,2,3,.35)');
    gr.addColorStop(1, low ? `rgba(45,0,0,${0.85 + Math.sin(t / 150) * 0.08})` : 'rgba(6,2,3,.86)');
    c.fillStyle = gr; c.fillRect(0, 0, this.W, this.H);
    // machines à atout et d'amélioration : enseignes allumées et halo coloré qui percent la nuit
    const halo = (glow, cx, cy, r) => {
      if (!glow) return;
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${glow},.32)`); g.addColorStop(1, `rgba(${glow},0)`);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(cx - r, cy - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over';
    };
    GameMap.machines.forEach(m => {
      const x = m.tx * T - cam.x, y = m.ty * T - cam.y;
      halo(Sprites.perkMachineLit(c, x, y, m.perk, t / 1000), x + 8, y - 4, 34 + Math.sin(t / 400 + m.tx) * 3);
    });
    const fx0 = fg.tx * T - cam.x, fy0 = fg.ty * T - cam.y;
    halo(Sprites.forgeLit(c, fx0, fy0, t / 1000), fx0 + 16, fy0 + 2, 44 + Math.sin(t / 300) * 4);
    const bx0 = mb.tx * T - cam.x, by0 = mb.ty * T - cam.y;
    halo(Sprites.mysteryBoxLit(c, bx0, by0, t / 1000, bv), bx0 + 16, by0 + (bv.open ? -8 : 4), (bv.open ? 52 : 30) + Math.sin(t / 350) * 3);
    // yeux des zombies et balles traçantes visibles dans le noir
    GameMap.drawFires(c, cam, t, this.W, this.H);
    this.zs.forEach(z => Sprites.zombieEyes(c, z.x - cam.x, z.y - cam.y, z.a));
    this.bullets.forEach(b => {
      const bx = Math.round(b.x - cam.x), by = Math.round(b.y - cam.y), n = Math.hypot(b.vx, b.vy);
      const up = b.up;   // balles de l'arme améliorée : traçantes violettes ; traînée plus longue pour les balles rapides (sniper)
      c.fillStyle = up ? '#b060ff' : '#ff8a2a';
      for (let i = 1; i <= (n > 300 ? 9 : 4); i++) c.fillRect(Math.round(bx - b.vx / n * i), Math.round(by - b.vy / n * i), 1, 1);
      c.fillStyle = up ? '#f0d8ff' : '#fff3b0'; c.fillRect(bx, by, 1, 1);
    });
    this.nades.forEach(n => Sprites.grenadeFuse(c, n.x - cam.x, n.y - cam.y, n.z, n.t / CFG.GRENADE.fuse));
    // lueur des explosions qui perce la nuit
    c.globalCompositeOperation = 'lighter';
    this.lights.forEach(l => {
      const x = l.x - cam.x, y = l.y - cam.y, k = l.t / 0.4, g = c.createRadialGradient(x, y, 0, x, y, 95);
      g.addColorStop(0, `rgba(255,190,90,${0.8 * k})`); g.addColorStop(1, 'rgba(255,80,20,0)');
      c.fillStyle = g; c.fillRect(x - 95, y - 95, 190, 190);
    });
    c.globalCompositeOperation = 'source-over';
    // visée de la grenade (joystick tactile, visée lissée) : trajectoire en cloche dont les points défilent vers la cible,
    // zone d'explosion légèrement teintée qui pulse, et croix au point d'impact
    if (Input.nadeAim && p.alive && p.grenades > 0) {
      const tg = this.nadeTarget(p, this.stickToRel(Input.nadeAim)), dist = Math.hypot(tg.x - p.x, tg.y - p.y), R = CFG.GRENADE.radius;
      const tx = tg.x - cam.x, ty = tg.y - cam.y, h = 8 + dist * 0.12, N = Math.max(6, Math.round(dist / 6)), ph = (t / 450) % 1;
      c.fillStyle = 'rgba(255,60,30,' + (0.12 + Math.sin(t / 160) * 0.04) + ')';
      c.beginPath(); c.ellipse(tx, ty, R, R * 0.75, 0, 0, 6.29); c.fill();
      c.fillStyle = 'rgba(255,70,40,.85)';
      for (let i = 0, n = 40; i < n; i++) { const a = i / n * 6.28 + t / 1500; if (i % 4 !== 3) c.fillRect(Math.round(tx + Math.cos(a) * R), Math.round(ty + Math.sin(a) * R * 0.75), 1, 1); }
      for (let i = 0; i < N; i++) {
        const k = (i + ph) / N;
        c.fillStyle = k < 0.15 ? 'rgba(255,210,58,.5)' : '#ffd23a';
        c.fillRect(Math.round(p.x - cam.x + (tg.x - p.x) * k), Math.round(p.y - cam.y + (tg.y - p.y) * k - Math.sin(Math.PI * k) * h), 1, 1);
      }
      c.fillStyle = '#ffd23a';
      c.fillRect(Math.round(tx) - 2, Math.round(ty), 5, 1); c.fillRect(Math.round(tx), Math.round(ty) - 2, 1, 5);
    }
    // voile rouge quand on prend un coup
    if (p.hurtT > 0) { c.fillStyle = `rgba(150,0,0,${p.hurtT * 0.9})`; c.fillRect(0, 0, this.W, this.H); }
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
    Input.update(dt);
    if (this.state === 'play' || this.state === 'over') this.updateVisuals(dt);
    this.draw(t);
    requestAnimationFrame(t2 => this.loop(t2));
  }
};
