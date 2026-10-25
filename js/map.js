// Map fermée : no man's land de nuit.
// 0 = boue, 1 = sacs de sable (bordure), 2 = caisse de munitions, 3 = hérisson tchèque, 4 = sacs de sable
const BLOOD = ['#4a0505', '#6a0808', '#850c0c'];
const GameMap = {
  grid: [], canvas: null, ctx: null,
  init() {
    const { MW, MH } = CFG;
    this.grid = [];
    for (let y = 0; y < MH; y++) {
      this.grid[y] = [];
      for (let x = 0; x < MW; x++) this.grid[y][x] = (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) ? 1 : 0;
    }
    const layout = { 2: [[6,6],[7,6],[16,16],[17,16]], 4: [[16,6],[16,7],[6,16],[6,17]], 3: [[9,9],[14,9],[9,14],[14,14]] };
    for (const t in layout) layout[t].forEach(([x, y]) => this.grid[y][x] = +t);
    this.render();
  },
  // redessine le sol (efface aussi le sang et les cadavres de la partie précédente)
  render() {
    const T = CFG.TILE, c = document.createElement('canvas');
    c.width = CFG.MW * T; c.height = CFG.MH * T;
    const g = c.getContext('2d'); this.canvas = c; this.ctx = g;
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const P = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
    // boue et terre retournée
    const MUD = ['#2b241b', '#30281e', '#352c21', '#271f17', '#3b3124'];
    P('#2f271d', 0, 0, c.width, c.height);
    for (let i = 0; i < c.width * c.height / 9; i++) P(MUD[rnd() * 5 | 0], rnd() * c.width, rnd() * c.height, rnd() < 0.3 ? 2 : 1, 1);
    for (let i = 0; i < 90; i++) {                                   // herbe morte
      const x = rnd() * c.width, y = rnd() * c.height;
      P('#4f4a2a', x, y, 1, 2); P('#5e5832', x + 1, y - 1, 1, 3); P('#45401f', x + 2, y, 1, 2);
    }
    // cratères d'obus (certains remplis d'eau croupie)
    for (let i = 0; i < 8; i++) {
      const cx = 24 + rnd() * (c.width - 48), cy = 24 + rnd() * (c.height - 48), r = 6 + rnd() * 10;
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y * 1.3) / r;
        if (d < 1) P(d > 0.8 ? (y < 0 ? '#1f1912' : '#40362a') : d > 0.55 ? '#1d1711' : '#16110c', cx + x, cy + y);
      }
      if (r > 11) { P('#141a1e', cx - r * 0.4, cy - 1, r * 0.8, 3); P('#141a1e', cx - r * 0.25, cy - 2, r * 0.5, 5); P('#2c363c', cx - 2, cy - 1, 3, 1); }
    }
    // débris : os, casques, douilles, vieilles traces de sang
    for (let i = 0; i < 45; i++) {
      const x = rnd() * c.width, y = rnd() * c.height, k = rnd();
      if (k < 0.2) { P('#c9bf9f', x, y, 4, 1); P('#c9bf9f', x - 1, y - 1, 1, 1); P('#c9bf9f', x + 4, y + 1, 1, 1); }
      else if (k < 0.32) { P('#30352c', x - 1, y + 2, 6, 1); P('#3c4238', x, y, 4, 2); P('#50584a', x + 1, y, 2, 1); }
      else if (k < 0.55) P('#8a6c2c', x, y, 2, 1);
      else for (let j = 0; j < 14; j++) P(rnd() < 0.5 ? '#2e0505' : '#3a0606', x + (rnd() - 0.5) * 10, y + (rnd() - 0.5) * 6, rnd() < 0.4 ? 2 : 1, 1);
    }
    // murs et obstacles
    for (let y = 0; y < CFG.MH; y++) for (let x = 0; x < CFG.MW; x++) {
      const t = this.grid[y][x], px = x * T, py = y * T;
      if (t === 1 || t === 4) this.sandbags(g, P, px, py, T);
      else if (t === 2) {
        P('rgba(0,0,0,.4)', px + 2, py + 3, 14, 13);
        P('#4c5430', px + 1, py + 1, 14, 13); P('#5f6a3c', px + 1, py + 1, 14, 1);
        P('#3c4325', px + 1, py + 5, 14, 1); P('#3c4325', px + 1, py + 9, 14, 1); P('#323820', px + 1, py + 13, 14, 1);
        [[1, 1], [13, 1], [1, 12], [13, 12]].forEach(([a, b]) => P('#26262a', px + a, py + b, 2, 2));
        P('#bdb690', px + 4, py + 6, 8, 1); P('#bdb690', px + 4, py + 8, 5, 1);    // marquage au pochoir
        P('#7a6a48', px, py + 6, 1, 3); P('#7a6a48', px + 15, py + 6, 1, 3);       // poignées en corde
      } else if (t === 3) {
        for (let i = 0; i < 13; i++) {
          P('rgba(0,0,0,.4)', px + 2 + i, py + 4 + i, 2, 1); P('rgba(0,0,0,.4)', px + 15 - i, py + 4 + i, 2, 1);
          P('#3a3a3e', px + 1 + i, py + 1 + i, 2, 2); P('#3a3a3e', px + 13 - i, py + 1 + i, 2, 2);
          P('#66666c', px + 1 + i, py + 1 + i, 1, 1); P('#66666c', px + 14 - i, py + 1 + i, 1, 1);
        }
        P('#2c2c30', px + 7, py + 2, 2, 12); P('#55555a', px + 7, py + 2, 1, 12);
        for (let i = 0; i < 6; i++) P('#6e3a1c', px + 2 + rnd() * 12, py + 2 + rnd() * 12);   // rouille
      }
    }
  },
  sandbags(g, P, px, py, T) {
    g.save(); g.beginPath(); g.rect(px, py, T, T); g.clip();
    P('#241d14', px, py, T, T);
    for (let r = 0; r < 3; r++) for (let b = r % 2 ? -4 : 0; b < T; b += 8) {
      const bx = px + b, by = py + r * 5;
      P('#7a6a48', bx + 1, by, 6, 5); P('#7a6a48', bx, by + 1, 8, 3);
      P('#93835c', bx + 1, by, 6, 1); P('#58492f', bx + 1, by + 4, 6, 1); P('#5e4f33', bx + 7, by + 1, 1, 3);
      P('#4a3e28', bx + 3, by + 2, 1, 1); P('#4a3e28', bx + 5, by + 2, 1, 1);
    }
    g.restore();
  },
  // tache de sang (ou douille) qui retombe au sol et y reste
  stain(x, y, col, s = 1) { this.ctx.fillStyle = col; this.ctx.fillRect(Math.round(x), Math.round(y), s, s); },
  splat(x, y, r) {
    const g = this.ctx;
    for (let i = 0; i < r * 7; i++) {
      const a = Math.random() * 6.28, d = Math.random() * r;
      g.fillStyle = BLOOD[Math.random() * 3 | 0];
      g.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.7), 1 + (Math.random() * 2 | 0), 1 + (Math.random() * 2 | 0));
    }
  },
  // points d'apparition des joueurs (un par joueur, autour du centre)
  playerSpawn(i) {
    const c = CFG.MW * CFG.TILE / 2, o = [[0, 0], [-16, 0], [16, 0], [0, -16]][i % 4];
    return { x: c + o[0], y: c + o[1] };
  },
  // champ de distances (BFS) depuis les cases de tous les joueurs vivants :
  // chaque case connaît son nombre de pas jusqu'au joueur le plus proche
  computeFlow(players) {
    const { MW, MH, TILE } = CFG, src = players.map(p => Math.floor(p.x / TILE) + Math.floor(p.y / TILE) * MW);
    const key = src.join(',');
    if (this.flowKey === key) return;   // recalculé seulement quand un joueur change de case
    this.flowKey = key;
    this.dist = new Array(MW * MH).fill(Infinity);
    const q = [];
    for (const k of src) if (this.dist[k] !== 0) { this.dist[k] = 0; q.push(k); }
    for (let i = 0; i < q.length; i++) {
      const cx = q[i] % MW, cy = q[i] / MW | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, k = nx + ny * MW;
        if (!this.solid(nx, ny) && this.dist[k] === Infinity) { this.dist[k] = this.dist[q[i]] + 1; q.push(k); }
      }
    }
  },
  // centre de la case voisine la plus proche du joueur (diagonales autorisées sans couper les coins)
  nextStep(x, y) {
    const { MW, TILE } = CFG, tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    let best = null, bd = this.dist ? this.dist[tx + ty * MW] : Infinity;
    if (bd === Infinity) return null;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = tx + dx, ny = ty + dy;
      if ((!dx && !dy) || this.solid(nx, ny) || (dx && dy && (this.solid(tx + dx, ty) || this.solid(tx, ty + dy)))) continue;
      const d = this.dist[nx + ny * MW];
      if (d < bd) { bd = d; best = { x: (nx + 0.5) * TILE, y: (ny + 0.5) * TILE }; }
    }
    return best;
  },
  // vrai si une entité de rayon r peut aller en ligne droite de (x1,y1) à (x2,y2)
  clearPath(x1, y1, x2, y2, r) {
    const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 4);
    for (let i = 1; i <= n; i++) if (this.blocked(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n, r)) return false;
    return true;
  },
  // trace de brûlure laissée par une explosion
  scorch(x, y, r) {
    const g = this.ctx, C = ['#0e0b09', '#16110d', '#1e1712', '#2a2018'];
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dy * 1.3) / r;
      if (d < 1 && Math.random() < 1.05 - d) { g.fillStyle = C[Math.min(3, (d * 3 + Math.random()) | 0)]; g.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1); }
    }
    for (let i = 0; i < r; i++) { g.fillStyle = Math.random() < 0.5 ? '#6a2a10' : '#3a1a0c'; g.fillRect(Math.round(x + (Math.random() - 0.5) * r), Math.round(y + (Math.random() - 0.5) * r * 0.7), 1, 1); }
  },
  solid(tx, ty) { return tx < 0 || ty < 0 || tx >= CFG.MW || ty >= CFG.MH || this.grid[ty][tx] > 0; },
  solidAt(x, y) { return this.solid(Math.floor(x / CFG.TILE), Math.floor(y / CFG.TILE)); },
  blocked(x, y, r) { return this.solidAt(x - r, y - r) || this.solidAt(x + r, y - r) || this.solidAt(x - r, y + r) || this.solidAt(x + r, y + r); },
  draw(c, cam) { c.drawImage(this.canvas, -cam.x, -cam.y); }
};
