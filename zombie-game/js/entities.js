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
      game.bullets.push({ x: this.x + Math.cos(a) * 9, y: this.y + Math.sin(a) * 9 - 1, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: CFG.PLAYER.range });
    }
  }
  hurt() { if (this.inv > 0) return; this.hp--; this.inv = 1; }
  draw(c, cam) {
    if (this.inv > 0 && Math.floor(this.inv * 14) % 2) return;
    Sprites.human(c, this.x - cam.x, this.y - cam.y, this.a, {
      body: '#3b82c4', skin: '#f1c27d', hair: '#4a2f1b', eyes: '#111', legs: '#2b2b3d',
      gun: true, step: Math.floor(this.walk) % 2, flash: this.flash > 0
    });
  }
}

class Zombie {
  constructor(x, y, wave) {
    this.x = x; this.y = y; this.r = 4; this.a = 0; this.t = Math.random() * 9; this.hit = 0; this.cd = 0;
    this.hp = 2 + Math.floor(wave / 3);
    this.sp = CFG.ZOMBIE.speed + Math.min(wave * 2, 20) + Math.random() * 6;
  }
  update(dt, p) {
    this.a = Math.atan2(p.y - this.y, p.x - this.x);
    moveEntity(this, Math.cos(this.a) * this.sp * dt, Math.sin(this.a) * this.sp * dt);
    this.t += dt; this.hit -= dt; this.cd -= dt;
    if (Math.hypot(p.x - this.x, p.y - this.y) < this.r + p.r + 2 && this.cd <= 0) { p.hurt(); this.cd = CFG.ZOMBIE.dmgCd; }
  }
  draw(c, cam) {
    Sprites.human(c, this.x - cam.x, this.y - cam.y, this.a, {
      body: this.hit > 0 ? '#ffffff' : '#5b6c8f', skin: '#7fb069', hair: '#3b4a2f', eyes: '#d00', legs: '#2d3550',
      step: Math.floor(this.t * 6) % 2
    });
  }
}
