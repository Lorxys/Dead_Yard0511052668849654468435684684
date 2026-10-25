// Map fermée : bordure de murs + quelques caisses. 0 = herbe, 1 = mur, 2 = caisse
const GameMap = {
  grid: [], canvas: null,
  init() {
    const { MW, MH } = CFG;
    this.grid = [];
    for (let y = 0; y < MH; y++) {
      this.grid[y] = [];
      for (let x = 0; x < MW; x++) this.grid[y][x] = (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) ? 1 : 0;
    }
    [[6,6],[7,6],[16,6],[16,7],[6,16],[6,17],[16,16],[17,16],[9,9],[14,9],[9,14],[14,14]]
      .forEach(([x, y]) => this.grid[y][x] = 2);
    this.render();
  },
  render() {
    const T = CFG.TILE, c = document.createElement('canvas');
    c.width = CFG.MW * T; c.height = CFG.MH * T;
    const g = c.getContext('2d');
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < CFG.MH; y++) for (let x = 0; x < CFG.MW; x++) {
      const t = this.grid[y][x], px = x * T, py = y * T;
      if (t === 1) {
        g.fillStyle = '#5a5a6e'; g.fillRect(px, py, T, T);
        g.fillStyle = '#44445a'; g.fillRect(px, py + 7, T, 1); g.fillRect(px, py + 15, T, 1);
        g.fillRect(px + (y % 2 ? 4 : 10), py, 1, 7); g.fillRect(px + (y % 2 ? 10 : 4), py + 8, 1, 7);
        g.fillStyle = '#80809a'; g.fillRect(px, py, T, 1);
      } else {
        g.fillStyle = (x + y) % 2 ? '#3d8a4a' : '#3a8247'; g.fillRect(px, py, T, T);
        g.fillStyle = '#2f6e3b';
        for (let i = 0; i < 3; i++) g.fillRect(px + (rnd() * 14 | 0), py + (rnd() * 14 | 0), 1, 2);
        if (rnd() < 0.06) { g.fillStyle = '#f0e46a'; g.fillRect(px + (rnd() * 14 | 0), py + (rnd() * 14 | 0), 2, 2); }
        if (t === 2) {
          g.fillStyle = '#8b5a2b'; g.fillRect(px + 1, py + 1, 14, 14);
          g.fillStyle = '#5e3a17'; g.fillRect(px + 1, py + 1, 14, 1); g.fillRect(px + 1, py + 14, 14, 1);
          g.fillRect(px + 1, py + 1, 1, 14); g.fillRect(px + 14, py + 1, 1, 14);
          for (let i = 3; i < 13; i++) { g.fillRect(px + i, py + i, 1, 1); g.fillRect(px + 15 - i, py + i, 1, 1); }
        }
      }
    }
    this.canvas = c;
  },
  solid(tx, ty) { return tx < 0 || ty < 0 || tx >= CFG.MW || ty >= CFG.MH || this.grid[ty][tx] > 0; },
  solidAt(x, y) { return this.solid(Math.floor(x / CFG.TILE), Math.floor(y / CFG.TILE)); },
  blocked(x, y, r) { return this.solidAt(x - r, y - r) || this.solidAt(x + r, y - r) || this.solidAt(x - r, y + r) || this.solidAt(x + r, y + r); },
  draw(c, cam) { c.drawImage(this.canvas, -cam.x, -cam.y); }
};
