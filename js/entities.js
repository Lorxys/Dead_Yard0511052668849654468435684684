// Joueurs et zombies
let nextId = 1;   // identifiant unique de chaque zombie/balle (pour les synchroniser en réseau plus tard)
// dégâts d'un coup de zombie à une manche donnée (paliers de CFG.ZOMBIE.dmg)
const zombieDamage = wave => CFG.ZOMBIE.dmg.reduce((d, [from, v]) => wave >= from ? v : d, 0);
const NO_INTENT ={ move: { x: 0, y: 0 }, aim: null, fire: false, grenade: null, buy: false };

function moveEntity(e, dx, dy) {
  if (!GameMap.blocked(e.x + dx, e.y, e.r)) e.x += dx;
  if (!GameMap.blocked(e.x, e.y + dy, e.r)) e.y += dy;
}

class Player {
  constructor(id, x, y) {
    this.id = id; this.x = x; this.y = y; this.r = 4; this.alive = true; this.kills = 0; this.score = CFG.PLAYER.score;
    this.grenades = CFG.GRENADE.start; this.gcd = 0; this.perks = {}; this.upgraded = false; this.weapon = CFG.PLAYER.weapon;
    this.hp = this.maxHp = CFG.PLAYER.hp; this.sinceHit = Infinity; this.a = Math.PI / 2; this.cd = 0; this.hurtT = 0; this.flash = 0; this.walk = 0;
    this.reload = 0; this.refill();   // reload = temps restant du rechargement en cours (s)
  }
  // munitions de l'arme en main : chargeur et réserve max (x2 et x3 si elle est améliorée)
  get magSize() { return this.gun.mag * (this.upgraded ? CFG.UPGRADE.mag : 1); }
  get reserveMax() { return this.gun.reserve * (this.upgraded ? CFG.UPGRADE.reserve : 1); }
  get ammoFull() { return this.mag >= this.magSize && this.reserve >= this.reserveMax; }
  refill() { this.mag = this.magSize; this.reserve = this.reserveMax; this.reload = 0; }
  // nouvelle arme en main (boîte mystère) : pas améliorée, munitions au max
  setWeapon(w) { this.weapon = w; this.upgraded = false; this.cd = 0; this.refill(); }
  // caractéristiques modifiées par les atouts achetés
  get speed() { return CFG.PLAYER.speed * (this.perks.speed ? CFG.PERKS.speed.mult : 1) * (this.gun.slow || 1); }   // mitrailleuse : plus lent
  get gun() { return CFG.WEAPONS[this.weapon]; }   // arme en main
  get fireRate() { return this.gun.rate / (this.perks.fire ? CFG.PERKS.fire.mult : 1); }
  get reloadTime() { return this.perks.reload ? CFG.PERKS.reload.time : CFG.RELOAD; }
  get regenDelay() { return this.perks.regen ? CFG.PERKS.regen.delay : CFG.PLAYER.regenDelay; }
  get regenRate() { return this.perks.regen ? CFG.PERKS.regen.rate : CFG.PLAYER.regenRate; }
  get damage() { return this.upgraded ? CFG.UPGRADE.mult : 1; }   // multiplicateur de dégâts de l'arme en main (améliorée ou non)
  // prix du prochain atout : augmente à chaque atout déjà acheté
  get perkPrice() { return CFG.PERK_PRICE.start + CFG.PERK_PRICE.step * Object.keys(this.perks).length; }
  // intent = { move: {x,y}, aim: {x,y} | null, fire, grenade: {x,y} | null (cible relative au joueur), buy }
  // vient du clavier/tactile en local, du réseau plus tard
  update(dt, intent, world) {
    if (!this.alive) return;
    let mv = intent.move, m = Math.hypot(mv.x, mv.y);
    if (m > 1) { mv = { x: mv.x / m, y: mv.y / m }; m = 1; }
    moveEntity(this, mv.x * this.speed * dt, mv.y * this.speed * dt);
    this.walk += m * dt * 8; this.cd -= dt; this.hurtT -= dt; this.flash -= dt;
    // régénération : la vie remonte petit à petit si le joueur n'a pas été touché depuis un moment
    this.sinceHit += dt;
    if (this.sinceHit >= this.regenDelay) this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
    const aim = intent.aim;
    if (aim && Math.hypot(aim.x, aim.y) > 0.1) this.a = Math.atan2(aim.y, aim.x);
    else if (m > 0.2) this.a = Math.atan2(mv.y, mv.x);
    // rechargement : à la fin, le chargeur se remplit avec ce qu'il reste en réserve
    if (this.reload > 0 && (this.reload -= dt) <= 0) {
      const n = Math.min(this.magSize - this.mag, this.reserve);
      this.mag += n; this.reserve -= n; this.reload = 0;
    }
    if (intent.fire && this.cd <= 0 && this.reload <= 0 && !this.mag) {
      if (this.reserve > 0) { this.reload = this.reloadTime; world.emit('reload', { id: this.id, x: this.x, y: this.y, t: this.reloadTime }); }
      else { this.cd = 0.35; world.emit('dry', { id: this.id }); }   // chargeur et réserve vides : clic à vide
    }
    if (intent.fire && this.cd <= 0 && this.reload <= 0 && this.mag > 0) {
      // le reste du délai est reporté pour que la cadence réelle suive exactement fireRate malgré le pas fixe
      this.cd = (this.cd > -dt ? this.cd : 0) + this.fireRate; this.flash = 0.05;
      // une balle de moins ; chargeur vide -> rechargement automatique s'il reste des balles en réserve
      if (--this.mag === 0 && this.reserve > 0) { this.reload = this.reloadTime; world.emit('reload', { id: this.id, x: this.x, y: this.y, t: this.reloadTime }); }
      // un tir = une balle, ou une gerbe de plombs pour le fusil à pompe
      const g = this.gun, v = g.speed, k = this.damage;
      for (let i = 0; i < (g.pellets || 1); i++) {
        const a = this.a + (Math.random() - 0.5) * g.spread;
        world.bullets.push({ id: nextId++, owner: this.id, up: this.upgraded, pierce: g.pierce || 0, ray: g.cls === 'ray', splash: g.splash, k, dmg: g.dmg * k, far: (g.far ?? g.dmg) * k, fall: g.fall, d: 0,
          x: this.x + Math.cos(a) * 14, y: this.y + Math.sin(a) * 14 - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: g.range });
      }
      world.emit('shoot', { id: this.id, x: this.x, y: this.y, a: this.a, w: this.weapon });
    }
    this.gcd -= dt;
    if (intent.grenade && this.grenades > 0 && this.gcd <= 0) {
      this.grenades--; this.gcd = CFG.GRENADE.cooldown;
      world.throwGrenade(this, intent.grenade);
    }
    if (intent.buy) world.buyPerk(this);
  }
  // renvoie true si le coup a porté ; pas d'invincibilité (hurtT sert seulement au clignotement)
  hurt(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg; this.hurtT = 0.4; this.sinceHit = 0;
    if (this.hp <= 0) this.alive = false;
    return true;
  }
  draw(c, cam) {
    if (!this.alive || (this.hurtT > 0 && Math.floor(this.hurtT * 14) % 2)) return;
    Sprites.soldier(c, this.x - cam.x, this.y - cam.y, this.a, { step: Math.floor(this.walk) % 2, flash: this.flash > 0, weapon: this.weapon });
    if (this.reload > 0) Sprites.reloadBar(c, this.x - cam.x, this.y - cam.y - 20, 1 - this.reload / this.reloadTime);
  }
}

class Zombie {
  constructor(x, y, wave) {
    this.id = nextId++; this.x = x; this.y = y; this.r = 4; this.a = 0; this.t = Math.random() * 9; this.hit = 0; this.cd = 0;
    this.v = Math.random() * 4 | 0; this.stuck = 0; this.detour = 0;
    this.hp = 2 + Math.floor(wave / 3);
    const Z = CFG.ZOMBIE;
    this.dmg = zombieDamage(wave);
    this.sp = Z.speed + Math.min(wave * Z.speedPerWave, Z.speedMaxBonus) + Math.random() * 6;
  }
  update(dt, world) {
    // cible : le joueur vivant le plus proche
    let p = null, pd = Infinity;
    for (const q of world.players) { const d = Math.hypot(q.x - this.x, q.y - this.y); if (q.alive && d < pd) { p = q; pd = d; } }
    if (!p) return;
    // fonce droit sur lui s'il le voit, sinon contourne les obstacles en suivant le champ de distances
    let tx = p.x, ty = p.y;
    if (this.detour > 0 || !GameMap.clearPath(this.x, this.y, p.x, p.y, this.r)) {
      const n = GameMap.nextStep(this.x, this.y);
      if (n) { tx = n.x; ty = n.y; }
    }
    this.a = Math.atan2(ty - this.y, tx - this.x);
    const ox = this.x, oy = this.y;
    moveEntity(this, Math.cos(this.a) * this.sp * dt, Math.sin(this.a) * this.sp * dt);
    // sécurité : s'il n'avance presque plus, il passe en mode contournement pendant 1,5 s
    this.stuck = Math.hypot(this.x - ox, this.y - oy) < this.sp * dt * 0.3 ? this.stuck + dt : 0;
    this.detour -= dt;
    if (this.stuck > 0.4 && pd > 14) { this.detour = 1.5; this.stuck = 0; }
    this.t += dt; this.hit -= dt; this.cd -= dt;
    if (Math.hypot(p.x - this.x, p.y - this.y) < this.r + p.r + 2 && this.cd <= 0) {
      if (p.hurt(this.dmg)) world.emit('hurt', { id: p.id, x: p.x, y: p.y });
      this.cd = CFG.ZOMBIE.dmgCd;   // ce zombie ne peut plus frapper pendant 1 s
    }
  }
  draw(c, cam) {
    Sprites.zombie(c, this.x - cam.x, this.y - cam.y, this.a, { t: this.t, hit: this.hit, v: this.v, step: Math.floor(this.t * 6) % 2 });
  }
}
