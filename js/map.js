// Map en cours : cases solides, zones, portes achetables, rendu du sol et des décors.
// Les maps elles-mêmes (plans, décors) sont décrites dans maps.js. Cases de grid : 0 = libre, 1 = solide, 2 = porte fermée.
const BLOOD = ['#4a0505', '#6a0808', '#850c0c'];
const FLOOR = '.:,';
const GameMap = {
  id: null, W: 0, H: 0, grid: [], canvas: null, ctx: null, doors: [], fires: [], previews: {},
  // charge une map (au lancement d'une partie) : plan, zones, portes, sol repeint (sang et cadavres effacés)
  load(id) {
    Object.assign(this, this.build(id));
    this.canvas = this.paint(this); this.ctx = this.canvas.getContext('2d');
    this.newMess(); this.fading = null; this.fadeT = 0; this.flowKey = null; this.dist = null;
    this.doors.forEach(d => d.img = Decor.barricade(d.w, d.h, 31 + d.id * 7));
    this.openZones = new Set([this.zoneAt(this.spawn.x, this.spawn.y)]);
  },
  // lit le plan d'une map (sans la dessiner)
  build(id) {
    const def = MAPS[id], T = CFG.TILE, H = def.rows.length, W = def.rows[0].length;
    const m = { id, def, W, H, chars: def.rows.map(r => [...r]), machines: [], forge: null, boxSpots: [], ammo: [], fires: [] }, cells = {};
    const PERK = { h: 'health', r: 'regen', s: 'speed', f: 'fire', k: 'reload' };
    m.grid = m.chars.map((row, y) => row.map((c, x) => {
      if (FLOOR.includes(c)) return 0;
      if (c === 'P') { m.spawn = { x: x * T, y: y * T }; return 0; }
      if (PERK[c]) m.machines.push({ perk: PERK[c], tx: x, ty: y });
      if (c === 'U' && !m.forge) m.forge = { perk: 'upgrade', tx: x, ty: y, w: 2 };
      if (c === 'B' && row[x - 1] !== 'B') m.boxSpots.push({ perk: 'box', tx: x, ty: y, w: 2 });
      if (c === 'A') m.ammo.push({ perk: 'ammo', tx: x, ty: y });
      if (c >= '1' && c <= '9') { (cells[c] = cells[c] || []).push([x, y]); return 2; }
      return 1;
    }));
    // la boîte mystère commence sur l'emplacement le plus proche du joueur ; m.box = emplacement où elle se trouve
    const dSpawn = b => Math.hypot((b.tx + 1) * T - m.spawn.x, b.ty * T - m.spawn.y);
    m.boxStart = m.boxSpots.indexOf(m.boxSpots.reduce((a, b) => dSpawn(b) < dSpawn(a) ? b : a));
    m.box = m.boxSpots[m.boxStart];
    // carcasses de véhicules : leurs cases deviennent solides ; certaines brûlent encore
    (def.vehicles || []).forEach(v => {
      const [w, h] = Decor.SIZE[v.type];
      for (let y = v.y; y < v.y + h; y++) for (let x = v.x; x < v.x + w; x++) m.grid[y][x] = 1;
      if (v.fire) m.fires.push({ x: (v.x + w / 2) * T, y: (v.y + h / 2) * T });
    });
    // sol sous les cases pleines : le sol le plus présent autour (pavés sous une porte de la place, herbe sous une tombe...)
    m.ground = m.chars.map((row, y) => row.map((c, x) => {
      if (FLOOR.includes(c)) return c;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (m.chars[y + dy] || [])[x + dx]).filter(k => k && FLOOR.includes(k));
      return n.sort((a, b) => n.filter(k => k === b).length - n.filter(k => k === a).length)[0] || '.';
    }));
    // zones : remplissage depuis le point de départ de chacune, sans traverser murs, décors ni portes
    const zones = def.zones || [[def.name, [m.spawn.x / T, m.spawn.y / T]]];
    m.zoneNames = zones.map(z => z[0]); m.zoneTiles = zones.map(() => []);
    m.zone = m.grid.map(row => row.map(() => -1));
    zones.forEach(([, [sx, sy]], i) => {
      const q = [[sx, sy]]; m.zone[sy][sx] = i;
      for (let k = 0; k < q.length; k++) {
        const [x, y] = q[k]; m.zoneTiles[i].push(q[k]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (m.grid[ny]?.[nx] === 0 && m.zone[ny][nx] < 0) { m.zone[ny][nx] = i; q.push([nx, ny]); }
        }
      }
    });
    // portes : emprise (en cases) et zones qu'elles séparent
    m.doors = Object.keys(cells).sort().map(k => {
      const t = cells[k], xs = t.map(c => c[0]), ys = t.map(c => c[1]), tx = Math.min(...xs), ty = Math.min(...ys), z = new Set();
      t.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const n = m.zone[y + dy]?.[x + dx]; if (n >= 0) z.add(n); }));
      return { perk: 'door', id: +k, cells: t, tx, ty, w: Math.max(...xs) - tx + 1, h: Math.max(...ys) - ty + 1, zones: [...z], state: 'closed', t: 0 };
    });
    return m;
  },
  // peint le sol et les décors d'une map sur un canvas
  paint(m) {
    const T = CFG.TILE, c = document.createElement('canvas'); c.width = m.W * T; c.height = m.H * T;
    const g = c.getContext('2d');
    let s = m.def.seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const P = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
    m.def.ground.call(m.def, g, P, rnd, m);
    const wallAt = (x, y) => (m.chars[y] || [])[x] === '#';
    for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
      const k = m.chars[y][x], px = x * T, py = y * T;
      if (k === '#' && m.def.wall === 'stone') Decor.wall(P, px, py, rnd, !wallAt(x, y + 1));
      else if (k === '#' || k === 'S') this.sandbags(g, P, px, py, T);
      else if (k === 'C') this.crate(P, px, py);
      else if (k === 'X') this.hedgehog(P, px, py, rnd);
      else if (k === 'W') Decor.wire(P, px, py, rnd);
      else if (k === 'T') Decor.tree(P, px, py, rnd);
      else if (k === 't') Decor.tomb(P, px, py, rnd);
      else if (k === 'R') Decor.rubble(P, px, py, rnd);
      else if (k === 'A') Decor.ammo(P, px, py);
      else if (k === 'O' && m.chars[y][x - 1] !== 'O' && m.chars[y - 1][x] !== 'O') Decor.fountain(P, px, py);   // dessinée depuis son coin haut-gauche
    }
    (m.def.vehicles || []).forEach(v => Decor[v.type](P, v.x * T, v.y * T, rnd));
    if (m.boxSpots.length > 1) m.boxSpots.forEach(b => Decor.boxSpot(P, b.tx * T, b.ty * T));   // palettes vides (cachées sous la boîte quand elle y est)
    return c;
  },
  // aperçu d'une map pour le choix de la carte (sol, décors, machines et portes)
  preview(id) {
    if (this.previews[id]) return this.previews[id];
    const T = CFG.TILE, m = this.build(id), c = this.paint(m), g = c.getContext('2d');
    m.machines.forEach(k => Sprites.perkMachine(g, k.tx * T, k.ty * T, k.perk));
    Sprites.forge(g, m.forge.tx * T, m.forge.ty * T); Sprites.mysteryBox(g, m.box.tx * T, m.box.ty * T, false);
    m.doors.forEach(d => g.drawImage(Decor.barricade(d.w, d.h, 31 + d.id * 7), d.tx * T - Decor.M, d.ty * T - Decor.M));
    return this.previews[id] = c;
  },
  crate(P, px, py) {
    P('rgba(0,0,0,.4)', px + 2, py + 3, 14, 13);
    P('#4c5430', px + 1, py + 1, 14, 13); P('#5f6a3c', px + 1, py + 1, 14, 1);
    P('#3c4325', px + 1, py + 5, 14, 1); P('#3c4325', px + 1, py + 9, 14, 1); P('#323820', px + 1, py + 13, 14, 1);
    [[1, 1], [13, 1], [1, 12], [13, 12]].forEach(([a, b]) => P('#26262a', px + a, py + b, 2, 2));
    P('#bdb690', px + 4, py + 6, 8, 1); P('#bdb690', px + 4, py + 8, 5, 1);    // marquage au pochoir
    P('#7a6a48', px, py + 6, 1, 3); P('#7a6a48', px + 15, py + 6, 1, 3);       // poignées en corde
  },
  hedgehog(P, px, py, rnd) {
    for (let i = 0; i < 13; i++) {
      P('rgba(0,0,0,.4)', px + 2 + i, py + 4 + i, 2, 1); P('rgba(0,0,0,.4)', px + 15 - i, py + 4 + i, 2, 1);
      P('#3a3a3e', px + 1 + i, py + 1 + i, 2, 2); P('#3a3a3e', px + 13 - i, py + 1 + i, 2, 2);
      P('#66666c', px + 1 + i, py + 1 + i, 1, 1); P('#66666c', px + 14 - i, py + 1 + i, 1, 1);
    }
    P('#2c2c30', px + 7, py + 2, 2, 12); P('#55555a', px + 7, py + 2, 1, 12);
    for (let i = 0; i < 6; i++) P('#6e3a1c', px + 2 + rnd() * 12, py + 2 + rnd() * 12);   // rouille
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

  // ---------- zones et portes ----------
  zoneAt(x, y) { return (this.zone[Math.floor(y / CFG.TILE)] || [])[Math.floor(x / CFG.TILE)] ?? -1; },
  // zone vers laquelle mène une porte, vue depuis la position du joueur
  doorTarget(d, p) { const here = this.zoneAt(p.x, p.y); return this.zoneNames[d.zones.find(z => z !== here) ?? d.zones[0]]; },
  // porte achetée : les zones qu'elle sépare s'ouvrent aux zombies tout de suite, le passage une fois la barricade effondrée
  // renvoie les noms des zones nouvellement ouvertes
  unlock(d) {
    d.state = 'opening'; d.t = 0;
    const fresh = d.zones.filter(z => !this.openZones.has(z));
    fresh.forEach(z => this.openZones.add(z));
    return fresh.map(z => this.zoneNames[z]);
  },
  updateDoors(dt) {
    for (const d of this.doors) if (d.state === 'opening' && (d.t += dt) >= CFG.DOOR.fade) {
      d.state = 'open'; d.cells.forEach(([x, y]) => this.grid[y][x] = 0); this.flowKey = null;
    }
  },
  // barricades : stables tant qu'elles sont fermées, puis s'effacent par paliers en s'enfonçant dans le sol
  drawDoors(c, cam) {
    const T = CFG.TILE;
    for (const d of this.doors) {
      if (d.state === 'open') continue;
      const k = d.state === 'opening' ? d.t / CFG.DOOR.fade : 0;
      c.globalAlpha = Math.ceil((1 - k) * 8) / 8;
      c.drawImage(d.img, d.tx * T - Decor.M - cam.x, d.ty * T - Decor.M - cam.y + Math.round(k * 6));
      c.globalAlpha = 1;
    }
  },
  // feux des carcasses : halo orange qui vacille et flammes, par-dessus l'obscurité
  drawFires(c, cam, t, W, H) {
    for (const f of this.fires) {
      const x = f.x - cam.x, y = f.y - cam.y;
      if (x < -60 || y < -60 || x > W + 60 || y > H + 60) continue;
      const r = 46 * (0.88 + Math.sin(t / 90 + f.x) * 0.06 + Math.random() * 0.06), g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,130,40,.38)'); g.addColorStop(1, 'rgba(255,70,20,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 16; i++) {
        const k = (t / 650 + i * 0.137 + f.x * 0.01) % 1, fx = x + Math.sin(i * 7.3 + t / 180) * (6 - k * 5) + (i % 3 - 1) * 4, fy = y - k * 16;
        c.fillStyle = k < 0.25 ? '#fff0a0' : k < 0.55 ? '#ffa030' : k < 0.8 ? '#d84a14' : '#4a2a20';
        c.fillRect(Math.round(fx), Math.round(fy), k < 0.5 ? 2 : 1, k < 0.5 ? 2 : 1);
      }
    }
  },

  // machine (ou porte fermée) devant laquelle se tient le joueur (null s'il n'est près de rien)
  nearMachine(p) {
    const T = CFG.TILE, f = this.forge, b = this.box;
    if (Math.hypot(p.x - (f.tx + f.w / 2) * T, p.y - f.ty * T) < 24) return f;
    if (Math.hypot(p.x - (b.tx + b.w / 2) * T, (p.y - (b.ty + 0.5) * T) * 1.3) < 28) return b;
    const m = this.machines.find(m => Math.hypot(p.x - (m.tx + 0.5) * T, p.y - (m.ty + 1) * T) < 20);
    if (m) return m;
    // boîte de munitions : utilisable de n'importe quel côté
    const a = this.ammo.find(a => Math.hypot(p.x - (a.tx + 0.5) * T, p.y - (a.ty + 0.5) * T) < 18);
    if (a) return a;
    return this.doors.find(d => d.state === 'closed' &&
      Math.hypot(p.x - Math.max(d.tx * T, Math.min((d.tx + d.w) * T, p.x)), p.y - Math.max(d.ty * T, Math.min((d.ty + d.h) * T, p.y))) < 14) || null;
  },
  // tache de sang (ou douille) qui retombe au sol et y reste
  stain(x, y, col, s = 1) { this.messCtx.fillStyle = col; this.messCtx.fillRect(Math.round(x), Math.round(y), s, s); },
  splat(x, y, r) {
    const g = this.messCtx;
    for (let i = 0; i < r * 7; i++) {
      const a = Math.random() * 6.28, d = Math.random() * r;
      g.fillStyle = BLOOD[Math.random() * 3 | 0];
      g.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.7), 1 + (Math.random() * 2 | 0), 1 + (Math.random() * 2 | 0));
    }
  },
  // points d'apparition des joueurs (un par joueur, autour de la case P)
  playerSpawn(i) {
    const o = [[0, 0], [-16, 0], [16, 0], [0, -16]][i % 4];
    return { x: this.spawn.x + o[0], y: this.spawn.y + o[1] };
  },
  // champ de distances (BFS) depuis les cases de tous les joueurs vivants :
  // chaque case connaît son nombre de pas jusqu'au joueur le plus proche
  computeFlow(players) {
    const { W, H } = this, TILE = CFG.TILE, src = players.map(p => Math.floor(p.x / TILE) + Math.floor(p.y / TILE) * W);
    const key = src.join(',');
    if (this.flowKey === key) return;   // recalculé seulement quand un joueur change de case (ou qu'une porte s'ouvre)
    this.flowKey = key;
    this.dist = new Array(W * H).fill(Infinity);
    const q = [];
    for (const k of src) if (this.dist[k] !== 0) { this.dist[k] = 0; q.push(k); }
    for (let i = 0; i < q.length; i++) {
      const cx = q[i] % W, cy = q[i] / W | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, k = nx + ny * W;
        if (!this.solid(nx, ny) && this.dist[k] === Infinity) { this.dist[k] = this.dist[q[i]] + 1; q.push(k); }
      }
    }
  },
  // centre de la case voisine la plus proche du joueur (diagonales autorisées sans couper les coins)
  nextStep(x, y) {
    const { W } = this, TILE = CFG.TILE, tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    let best = null, bd = this.dist ? this.dist[tx + ty * W] : Infinity;
    if (bd === Infinity) return null;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = tx + dx, ny = ty + dy;
      if ((!dx && !dy) || this.solid(nx, ny) || (dx && dy && (this.solid(tx + dx, ty) || this.solid(tx, ty + dy)))) continue;
      const d = this.dist[nx + ny * W];
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
  solid(tx, ty) { return tx < 0 || ty < 0 || tx >= this.W || ty >= this.H || this.grid[ty][tx] > 0; },
  solidAt(x, y) { return this.solid(Math.floor(x / CFG.TILE), Math.floor(y / CFG.TILE)); },
  blocked(x, y, r) { return this.solidAt(x - r, y - r) || this.solidAt(x + r, y - r) || this.solidAt(x - r, y + r) || this.solidAt(x + r, y + r); },
  newMess() {
    this.mess = document.createElement('canvas'); this.mess.width = this.canvas.width; this.mess.height = this.canvas.height;
    this.messCtx = this.mess.getContext('2d');
  },
  // nouvelle manche : l'ancien calque s'estompe petit à petit (fadeTime s) pendant que le nouveau, vierge, reçoit le sang frais
  clearMess() { this.fading = this.mess; this.fadeT = 1; this.newMess(); },
  updateFade(dt) { if (this.fadeT > 0 && (this.fadeT -= dt / this.fadeTime) <= 0) { this.fadeT = 0; this.fading = null; } },
  fadeTime: 3,
  draw(c, cam) {
    c.drawImage(this.canvas, -cam.x, -cam.y);
    if (this.fading) {   // opacité par paliers, pour rester dans l'esprit pixel art
      c.globalAlpha = Math.ceil(this.fadeT * 8) / 8; c.drawImage(this.fading, -cam.x, -cam.y); c.globalAlpha = 1;
    }
    c.drawImage(this.mess, -cam.x, -cam.y);
  }
};
