// Décor animé du menu : no man's land de nuit, Allemagne 1945. Tout est dessiné en pixels par code.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];   // trame 4x4 pour des dégradés pixel
const dither = (x, y) => BAYER[((y % 4) + 4) % 4 * 4 + ((x % 4) + 4) % 4] / 16;

const MenuScene = {
  build(W, H) {
    this.W = W; this.H = H;
    const hz = this.hz = Math.round(H * 0.7);
    this.hill = x => hz + Math.round(Math.sin(x * 0.021) * 4 + Math.sin(x * 0.067 + 1) * 2);
    let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const layer = fn => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      fn((col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); }, g);
      return c;
    };
    this.back = layer((P, g) => this.drawBack(P, g, W, H, hz, rnd));
    this.front = layer(P => this.drawFront(P, W, H, hz, rnd));
    this.walkers = Array.from({ length: 7 }, () => ({ x0: rnd() * W, sp: 0.004 + rnd() * 0.004, d: rnd() < 0.5 ? -1 : 1, ph: rnd() * 9 }));
    this.embers = Array.from({ length: 50 }, () => ({ x: rnd() * W, y: rnd() * H, sp: 0.01 + rnd() * 0.02,
      c: ['#ff6a1e', '#ffa040', '#b3301a'][rnd() * 3 | 0], s: rnd() < 0.2 ? 2 : 1 }));
  },

  // ciel, lune de sang, nuages, ville en ruine qui brûle
  drawBack(P, g, W, H, hz, rnd) {
    const SKY = ['#040203', '#080305', '#0f0407', '#180508', '#240709', '#33090a', '#470c0b', '#5e130e', '#7a1c10'];
    const rgb = SKY.map(h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)));
    const img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
      const t = Math.pow(Math.min(1, y / hz), 1.6) * (SKY.length - 1), i0 = Math.floor(t), f = t - i0;
      for (let x = 0; x < W; x++) {
        const col = rgb[Math.min(SKY.length - 1, i0 + (f > dither(x, y) ? 1 : 0))], o = (y * W + x) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    for (let i = 0; i < 70; i++) P(rnd() < 0.7 ? '#2a1a1c' : '#4a3030', rnd() * W, rnd() * hz * 0.5);
    // lune de sang éclairée en haut à gauche, avec cratères et halo tramé
    const mx = Math.round(W * 0.74), my = Math.round(H * 0.22), r = Math.max(14, Math.round(H * 0.1));
    const MOON = ['#4e0c09', '#6e140d', '#901f12', '#b03218', '#c8482a'];
    const craters = [[-0.3, -0.2, 0.22], [0.35, 0.25, 0.18], [0.1, -0.45, 0.12], [-0.2, 0.45, 0.14]];
    for (let y = -r * 2; y <= r * 2; y++) for (let x = -r * 2; x <= r * 2; x++) {
      const dist = Math.hypot(x, y), b = dither(x, y);
      if (dist > r) { const h = 1 - (dist - r) / r; if (h > 0 && h * 0.55 > b) P(h > 0.6 ? '#4a0d0b' : '#300809', mx + x, my + y); continue; }
      let v = 0.55 - (x + y) / (r * 2.2) * 0.6 + (b - 0.5) * 0.3;
      if (craters.some(([cx, cy, cr]) => Math.hypot(x / r - cx, y / r - cy) < cr)) v -= 0.25;
      if (dist > r - 1.5) v -= 0.2;
      P(MOON[Math.max(0, Math.min(4, Math.floor(v * 5)))], mx + x, my + y);
    }
    // bandes de nuages bordées de rouge
    for (let k = 0; k < 7; k++) {
      const cy = H * (0.1 + k * 0.07), cx = rnd() * W, len = W * (0.2 + rnd() * 0.35), th = 2 + (rnd() * 4 | 0);
      for (let i = 0; i < th; i++) { const ins = Math.abs(i - th / 2) * 6 + rnd() * 6; P(i === 0 ? '#2c0a0b' : '#110406', cx + ins - len / 2, cy + i, Math.max(0, len - ins * 2) | 0, 1); }
    }
    // incendies à l'horizon + colonnes de fumée
    for (let k = 0; k < 4; k++) {
      const fx = Math.round(W * (0.08 + k * 0.27 + rnd() * 0.08));
      for (let y = -26; y <= 0; y++) for (let x = -44; x <= 44; x++) {
        const h = 1 - Math.hypot(x / 44, y / 26);
        if (h > 0 && h > dither(x, y) * 0.8 + 0.1) P(h > 0.55 ? '#a0361a' : '#6a1c10', fx + x, hz + y);
      }
      for (let y = 0; y < 90; y++) {
        const w = 3 + y * 0.3, cx = fx + Math.sin(y * 0.07 + k) * 5 + y * 0.35;
        for (let x = -w; x <= w; x++) if (rnd() < 0.5 * (1 - y / 90)) P('#170607', cx + x, hz - 20 - y);
      }
    }
    // ville en ruine (silhouettes déchiquetées, fenêtres en feu)
    let x = 0;
    while (x < W) {
      const w = 8 + rnd() * 26 | 0, h = 8 + rnd() * 34 | 0;
      for (let i = 0; i < w; i++) { const hh = h - (rnd() < 0.25 ? rnd() * 7 | 0 : 0); P('#140507', x + i, hz - hh, 1, hh + 6); }
      for (let wy = hz - h + 5; wy < hz - 3; wy += 6) for (let wx = x + 2; wx < x + w - 2; wx += 5) if (rnd() < 0.18) P(rnd() < 0.4 ? '#d0601e' : '#4a1208', wx, wy, 2, 3);
      x += w + (rnd() * 10 | 0);
    }
    // clocher d'église éventré
    const cx0 = Math.round(W * 0.22), ch = Math.round(H * 0.3);
    P('#120406', cx0 - 6, hz - ch, 12, ch);
    for (let i = 0; i < 12; i++) P('#120406', cx0 - 6 + Math.ceil(i * 0.4), hz - ch - i, 12 - Math.ceil(i * 0.8), 1);
    P('#120406', cx0 + 3, hz - ch - 18, 1, 7); P('#120406', cx0 + 1, hz - ch - 15, 5, 1);
    P('#c8501a', cx0 - 1, hz - ch + 8, 2, 4); P('#6a1c10', cx0 - 3, hz - ch + 20, 2, 3);
  },

  // colline, char détruit, arbres morts, barbelés, tombes, main qui sort de terre
  drawFront(P, W, H, hz, rnd) {
    const K = '#060102', RIM = '#3a0b0b';
    for (let x = 0; x < W; x++) { const y = this.hill(x); P('#0b0305', x, y, 1, H - y); P('#2a0809', x, y); }
    // poteaux télégraphiques et câbles qui pendent
    const poles = [0.44, 0.98].map(f => { const x = Math.round(W * f), y = this.hill(x); P(K, x, y - 40, 2, 40); P(K, x - 6, y - 36, 14, 2); return [x, y - 36]; });
    for (let x = poles[0][0]; x < poles[1][0]; x++) {
      const t = (x - poles[0][0]) / (poles[1][0] - poles[0][0]);
      P('#1a0607', x, poles[0][1] + (poles[1][1] - poles[0][1]) * t + 14 * 4 * t * (1 - t));
    }
    // char détruit, canon baissé, qui fume encore
    const tx = Math.round(W * 0.62), ty = this.hill(tx);
    for (let y = 0; y < 70; y++) {
      const w = 3 + y * 0.35, cx = tx - 4 + Math.sin(y * 0.08) * 6 + y * 0.25;
      for (let x = -w; x <= w; x++) if (rnd() < 0.45 * (1 - y / 70)) P('#1a0708', cx + x, ty - 24 - y);
    }
    P(K, tx - 24, ty - 7, 48, 8); for (let i = 0; i < 6; i++) P('#160406', tx - 21 + i * 8, ty - 5, 4, 3);
    P(K, tx - 22, ty - 14, 42, 7); P(K, tx - 26, ty - 11, 4, 4);
    P(K, tx - 10, ty - 21, 20, 7); P(K, tx - 6, ty - 24, 10, 3);
    for (let i = 0; i < 26; i++) P(K, tx + 10 + i, ty - 19 + Math.floor(i / 6), 1, 2);
    P(RIM, tx - 10, ty - 21, 20, 1); P(RIM, tx - 22, ty - 14, 12, 1); P(RIM, tx - 6, ty - 24, 10, 1);
    // arbres morts
    const branch = (x, y, a, len, w) => {
      for (let i = 0; i < len; i++) { P(K, x, y, w, w); x += Math.cos(a); y += Math.sin(a); }
      if (len > 5) {
        branch(x, y, a - 0.5 - rnd() * 0.4, len * 0.6, Math.max(1, w - 1));
        if (rnd() < 0.7) branch(x, y, a + 0.4 + rnd() * 0.4, len * 0.55, Math.max(1, w - 1));
      }
    };
    [0.05, 0.36, 0.86].forEach(f => { const x = Math.round(W * f); branch(x, this.hill(x) + 2, -Math.PI / 2 + (rnd() - 0.5) * 0.3, 22 + rnd() * 14, 3); });
    // premier plan : boue, flaques de sang qui reflètent la lune
    const fg = Math.round(H * 0.86);
    for (let x = 0; x < W; x++) { const y = fg + Math.round(Math.sin(x * 0.04) * 3 + Math.sin(x * 0.13)); P('#040102', x, y, 1, H - y); P('#200607', x, y); }
    for (let i = 0; i < W; i++) P('#0c0405', rnd() * W, fg + 4 + rnd() * (H - fg));
    for (let k = 0; k < 6; k++) {
      const bx = rnd() * W, by = fg + 7 + rnd() * Math.max(1, H - fg - 10), rw = 6 + rnd() * 16;
      for (let y = -3; y <= 3; y++) for (let x = -rw; x <= rw; x++) if (Math.hypot(x / rw, y / 3.5) < 1) P('#2e0506', bx + x, by + y);
      P('#8a1212', bx - rw * 0.3, by - 1, 3, 1); P('#5a0a0a', bx + rw * 0.2, by, 2, 1);
    }
    // chevaux de frise et fil barbelé
    for (let x = 10; x < W; x += 46 + (rnd() * 20 | 0)) {
      const y = fg + 1;
      for (let i = 0; i < 16; i++) { P(K, x + i, y - i, 2, 2); P(K, x + 15 - i, y - i, 2, 2); }
      P(K, x - 2, y - 9, 20, 2); P(RIM, x - 2, y - 9, 20, 1);
    }
    for (let x = 0; x < W; x++) {
      const y = fg - 8 + Math.round(Math.sin(x * 0.35) * 4);
      if (x % 2 === 0) P('#1c0708', x, y);
      if (x % 9 === 0) { P('#2a0a0a', x - 1, y - 1); P('#2a0a0a', x + 1, y + 1); }
    }
    // croix de fortune coiffées d'un casque
    [0.12, 0.8].forEach(f => {
      const x = Math.round(W * f), y = fg + 2;
      P(K, x, y - 30, 3, 32); P(K, x - 7, y - 24, 17, 3); P(RIM, x, y - 30, 3, 1); P(RIM, x - 7, y - 24, 17, 1);
      P(K, x - 3, y - 35, 9, 4); P(K, x - 5, y - 31, 13, 1); P('#4a0e0c', x - 2, y - 35, 6, 1);
    });
    // sacs de sable en bas à droite
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) {
      const bx = W - 70 + i * 15 + r * 7, by = H - 8 - r * 7;
      P(K, bx + 1, by, 13, 7); P(K, bx, by + 1, 15, 5); P('#2a0808', bx + 1, by, 13, 1);
    }
    // main décharnée qui sort de terre
    const hx = Math.round(W * 0.32), hy = fg + 8;
    for (let i = 0; i < 12; i++) P(K, hx + Math.round(i * 0.4), hy - i, 3, 2);
    P(K, hx + 3, hy - 15, 6, 3); P(K, hx + 3, hy - 20, 1, 5); P(K, hx + 5, hy - 21, 1, 6); P(K, hx + 7, hy - 20, 1, 5); P(K, hx + 9, hy - 18, 1, 4); P(K, hx + 1, hy - 16, 2, 1);
    P(RIM, hx + 3, hy - 20, 1, 1); P(RIM, hx + 5, hy - 21, 1, 1); P(RIM, hx + 7, hy - 20, 1, 1);
  },

  draw(c, t) {
    const { W, H, hz } = this;
    c.drawImage(this.back, 0, 0);
    // lueurs d'artillerie au loin
    const boom = Math.max(0, Math.sin(t * 0.0011) * Math.sin(t * 0.00037) - 0.85) * 4;
    if (boom > 0) { c.fillStyle = `rgba(255,110,40,${boom * 0.25})`; c.fillRect(0, 0, W, hz); }
    // projecteurs anti-aériens qui balaient le ciel
    [[0.14, 0], [0.9, 2.4]].forEach(([f, ph]) => {
      const x = W * f, a = -Math.PI / 2 + Math.sin(t * 0.00035 + ph) * 0.55, L = H * 1.3;
      [[0.05, 0.05], [0.02, 0.06]].forEach(([w, al]) => {
        c.fillStyle = `rgba(255,225,190,${al})`; c.beginPath(); c.moveTo(x, hz);
        c.lineTo(x + Math.cos(a - w) * L, hz + Math.sin(a - w) * L); c.lineTo(x + Math.cos(a + w) * L, hz + Math.sin(a + w) * L); c.fill();
      });
    });
    c.drawImage(this.front, 0, 0);
    // silhouettes de zombies qui errent sur la crête, yeux luisants
    this.walkers.forEach(w => {
      const x = Math.round(((w.x0 + t * w.sp * w.d) % (W + 40) + W + 40) % (W + 40) - 20), st = Math.floor(t / 280 + w.ph) % 2, y = this.hill(x) + 1 - st;
      const M = (rx, ry, ww, hh, col = '#050102') => { c.fillStyle = col; c.fillRect(x + (w.d > 0 ? rx : -rx - ww), y + ry, ww, hh); };
      M(-2 + st, -7, 2, 7); M(1 - st, -7, 2, 7); M(-3, -15, 6, 9); M(-2, -16, 6, 2);
      M(2, -14, 7, 2); M(2, -11, 6, 2); M(-1, -19, 5, 4); M(-2, -21, 7, 2); M(-3, -19, 9, 1);
      M(2, -19, 3, 3, 'rgba(255,150,30,.3)'); M(3, -18, 1, 1, '#ffb020');
    });
    // brume rougeâtre
    c.fillStyle = 'rgba(110,30,30,0.07)';
    for (let i = 0; i < 5; i++) {
      const y = hz - 4 + i * 7, off = (t * 0.008 * (i % 2 ? 1 : -1) * (1 + i * 0.3)) % W;
      for (let k = -2; k < 3; k++) c.fillRect(Math.round(off + k * W * 0.45), y, Math.round(W * 0.3), 5);
    }
    // braises qui montent
    this.embers.forEach(e => {
      const y = ((e.y - t * e.sp) % H + H) % H, x = Math.round(e.x + Math.sin(t * 0.001 + e.y) * 5);
      c.fillStyle = e.c; c.fillRect(x, Math.round(y), e.s, e.s);
    });
  }
};
