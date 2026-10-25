// Joueur et zombies
function moveEntity(e, dx, dy) {
  if (!GameMap.blocked(e.x + dx, e.y, e.r)) e.x += dx;
  if (!GameMap.blocked(e.x, e.y + dy, e.r)) e.y += dy;
}

class Player {
  constructor() {
    this.x = CFG.MW * CFG.TILE / 2; this.y = CFG.MH * CFG.TILE / 2; this.r = 4;
    this.hp = CFG.PLAYER.hp; this.a = Math.PI / 2; this.cd = 0; this.inv = 0; this.flash = 0; this.walk = 0;
  }
  update(dt, mv, aim, game) {
    let m = Math.hypot(mv.x, mv.y);
    if (m > 1) { mv = { x: mv.x / m, y: mv.y / m }; m = 1; }
    moveEntity(this, mv.x * CFG.PLAYER.speed * dt, mv.y * CFG.PLAYER.speed * dt);
    this.walk += m * dt * 8; this.cd -= dt; this.inv -= dt; this.flash -= dt;
    if (aim && Math.hypot(aim.x, aim.y) > 0.1) this.a = Math.atan2(aim.y, aim.x);
    else if (m > 0.2) this.a = Math.atan2(mv.y, mv.x);
    if (aim && aim.fire && this.cd <= 0) {
      this.cd = CFG.PLAYER.fireRate; this.flash = 0.05;
      const a = this.a + (Math.random() - 0.5) * 0.08, v = CFG.PLAYER.bulletSpeed;
      game.bullets.push({ x: this.x + Math.cos(a) * 14, y: this.y + Math.sin(a) * 14 - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: CFG.PLAYER.range });
      // douille éjectée sur le côté, elle reste au sol
      const e = this.a + Math.PI / 2 + (Math.random() - 0.5);
      game.fx.push({ x: this.x, y: this.y - 3, vx: Math.cos(e) * 40, vy: Math.sin(e) * 40, life: 0.25, col: '#c09a40', s: 1, stain: true });
    }
  }
  hurt() { if (this.inv > 0) return; this.hp--; this.inv = 1; }
  draw(c, cam) {
    if (this.inv > 0 && Math.floor(this.inv * 14) % 2) return;
    Sprites.soldier(c, this.x - cam.x, this.y - cam.y, this.a, { step: Math.floor(this.walk) % 2, flash: this.flash > 0 });
  }
}

class Zombie {
  constructor(x, y, wave) {
    this.x = x; this.y = y; this.r = 4; this.a = 0; this.t = Math.random() * 9; this.hit = 0; this.cd = 0;
    this.v = Math.random() * 4 | 0; this.stuck = 0; this.detour = 0;
    this.hp = 2 + Math.floor(wave / 3);
    const Z = CFG.ZOMBIE;
    this.sp = Z.speed + Math.min(wave * Z.speedPerWave, Z.speedMaxBonus) + Math.random() * 6;
  }
  update(dt, p) {
    // fonce droit sur le joueur s'il le voit, sinon contourne les obstacles en suivant le champ de distances
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
    if (this.stuck > 0.4 && Math.hypot(p.x - this.x, p.y - this.y) > 14) { this.detour = 1.5; this.stuck = 0; }
    this.t += dt; this.hit -= dt; this.cd -= dt;
    if (Math.hypot(p.x - this.x, p.y - this.y) < this.r + p.r + 2 && this.cd <= 0) { p.hurt(); this.cd = CFG.ZOMBIE.dmgCd; }
  }
  draw(c, cam) {
    Sprites.zombie(c, this.x - cam.x, this.y - cam.y, this.a, { t: this.t, hit: this.hit, v: this.v, step: Math.floor(this.t * 6) % 2 });
  }
}
