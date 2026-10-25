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
    this.hero = this.hero || this.buildHero();
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

  // portrait du GI en gros plan (buste), éclairé en rouge par la lune à droite, couvert de sang
  buildHero() {
    const HW = 124, HH = 150, c = document.createElement('canvas'); c.width = HW; c.height = HH;
    const g = c.getContext('2d');
    let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const P = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
    const tone = (ramp, v, x, y) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length + dither(x, y) - 0.5)))];
    const ell = (cx, cy, rx, ry, fn) => {
      for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) fn(cx + x, cy + y, x / rx, y / ry);
    };
    const inPoly = (pts, x, y) => {
      let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
      }
      return ins;
    };
    const poly = (pts, fn) => {
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      for (let y = Math.min(...ys); y <= Math.max(...ys); y++) for (let x = Math.min(...xs); x <= Math.max(...xs); x++)
        if (inPoly(pts, x + 0.5, y + 0.5)) fn(x, y, !inPoly(pts, x + 0.5, y - 0.5), !inPoly(pts, x + 1.5, y + 0.5));
    };
    // éclaboussures de sang avec coulures vers le bas
    const spatter = (cx, cy, r, n, drips) => {
      for (let i = 0; i < n; i++) { const a = rnd() * 6.28, d = rnd() ** 1.5 * r; P(BLOOD_R[rnd() * 4 | 0], cx + Math.cos(a) * d, cy + Math.sin(a) * d, rnd() < 0.3 ? 2 : 1, 1); }
      for (let i = 0; i < drips; i++) { const x = cx + (rnd() - 0.5) * r, y = cy + (rnd() - 0.5) * r * 0.5, l = 4 + rnd() * 10; P('#5a0606', x, y, 1, l); P('#7e0a0a', x, y + l, 1, 1); }
    };
    const BLOOD_R = ['#3a0404', '#5a0606', '#7e0a0a', '#a01212'];
    const JACKET = ['#1a1a0e', '#262616', '#33331d', '#424226', '#525230', '#64603a'];
    const SKIN = ['#3e2216', '#5e3a28', '#82543a', '#a8704c', '#c88e64', '#e0aa7c'];
    const HELM = ['#161b0e', '#222a14', '#323d1e', '#435028', '#566634', '#6c7c42'];
    const WOOD = ['#26150a', '#3e2410', '#5a3418', '#784622', '#94602e'];
    const METAL = ['#0e0e11', '#1c1c20', '#2e2e34', '#46464e', '#66666e'];
    const RIM = '#b8452a', RIM2 = '#e06a3a';

    // buste : veste M1941, éclairée par la droite
    poly([[2, 150], [6, 120], [16, 105], [38, 96], [52, 93], [68, 93], [86, 97], [104, 106], [114, 122], [120, 150]], (x, y, top, right) => {
      let v = 0.32 + (x - 60) / 60 * 0.3 - (y - 95) / 55 * 0.12;
      if ((x * 3 + y * 2) % 23 === 0 || (x - y * 2 + 400) % 31 === 0) v -= 0.18;   // plis du tissu
      P(top && x > 56 ? RIM : right ? RIM2 : tone(JACKET, v, x, y), x, y);
    });
    // col ouvert + bretelles de suspension avec boucles
    poly([[46, 93], [74, 93], [60, 114]], (x, y) => P(tone(JACKET, 0.08, x, y), x, y));
    poly([[52, 93], [60, 106], [68, 93]], (x, y) => P(tone(SKIN, 0.2, x, y), x, y));
    for (let y = 98; y < 150; y++) { P('#2a2414', 30 - (y - 98) * 0.12, y, 4, 1); P('#3a3220', 31 - (y - 98) * 0.12, y, 1, 1); P('#2a2414', 92 + (y - 98) * 0.12, y, 4, 1); P('#4a4028', 94 + (y - 98) * 0.12, y, 1, 1); }
    P('#8a7a4a', 28, 124, 6, 4); P('#2a2414', 30, 125, 2, 2); P('#a8925a', 93, 130, 6, 4); P('#2a2414', 95, 131, 2, 2);
    // cou dans l'ombre du visage
    for (let y = 84; y < 98; y++) for (let x = 51; x < 70; x++) P(tone(SKIN, 0.18 + (x - 51) / 19 * 0.25 - (98 - y) / 14 * 0.1, x, y), x, y);
    // oreille
    ell(45, 70, 3, 5, (x, y, nx) => P(tone(SKIN, 0.35 + nx * 0.15, x, y), x, y)); P(SKIN[1], 45, 69, 1, 3);
    // tête : modelé éclairé à droite, mâchoire carrée, barbe de plusieurs jours
    ell(60, 68, 16, 19, (x, y, nx, ny) => {
      if (ny > 0.45 && Math.abs(nx) > 1 - (ny - 0.45) * 0.8) return;
      let v = 0.45 + nx * 0.4 - ny * 0.1;
      if (y < 62) v -= 0.25;                                      // ombre du casque
      if (ny > 0.4 && dither(x, y) > 0.45) v -= 0.22;             // barbe
      P(nx > 0.82 && ny < 0.6 ? RIM2 : tone(SKIN, v, x, y), x, y);
    });
    // sourcils froncés, yeux, nez, bouche
    [[53, 61], [54, 61], [55, 62], [56, 62], [57, 63], [58, 63]].forEach(([x, y]) => P('#2a1a10', x, y, 1, 2));
    [[63, 63], [64, 63], [65, 62], [66, 62], [67, 61], [68, 61]].forEach(([x, y]) => P('#2a1a10', x, y, 1, 2));
    P('#cfc2ac', 54, 65, 4, 2); P('#cfc2ac', 63, 65, 4, 2); P('#1a1008', 56, 65, 2, 2); P('#1a1008', 65, 65, 2, 2);
    P('#fff4e0', 57, 65); P('#fff4e0', 66, 65);
    P(SKIN[1], 54, 67, 4, 1); P(SKIN[1], 63, 67, 4, 1);           // cernes
    for (let y = 66; y < 74; y++) { P(SKIN[1], 61, y); P(SKIN[5], 63, y - 1); }
    P(SKIN[2], 61, 74, 4, 1); P('#2a160c', 62, 74); P(SKIN[4], 64, 73);
    P('#3a1a10', 55, 79, 11, 1); P(SKIN[2], 56, 80, 9, 1); P('#3a1a10', 54, 80); P(SKIN[3], 57, 81, 6, 1);
    // cigarette au coin des lèvres (la braise est animée dans draw)
    P('#e8e0d0', 66, 78, 7, 2); P('#b8b0a0', 66, 79, 7, 1); P('#7a7068', 73, 78, 1, 2);
    // blessures : entaille sur la joue, sang qui coule du casque sur le visage
    for (let i = 0; i < 5; i++) { P('#5a0a08', 48 + i * 0.7, 70 + i); P('#a01212', 49 + i * 0.7, 70 + i); }
    for (let y = 58; y < 77; y++) { P('#7e0a0a', 67 + (y > 70 ? 1 : 0), y); if (y < 72) P('#5a0606', 68, y); }
    P('#a01212', 68, 77, 1, 2);
    for (let y = 59; y < 71; y++) P('#6e0808', 48, y); P('#8e0e0e', 48, 71, 1, 2);
    spatter(54, 74, 5, 14, 0); spatter(70, 84, 4, 8, 1);
    // casque M1 : dôme avec filet de camouflage, bord, jugulaire pendante
    ell(60, 52, 25, 16, (x, y, nx, ny) => {
      if (y > 58) return;
      let v = 0.5 + nx * 0.3 - ny * 0.35;
      if ((x + y) % 5 === 0 || (x - y + 100) % 5 === 0) v -= 0.17;
      P(nx > 0.86 ? RIM : tone(HELM, v, x, y), x, y);
    });
    for (let x = 32; x <= 88; x++) {
      const nx = (x - 60) / 28, top = 58 + Math.round(Math.abs(nx) ** 2 * 2);
      P(nx > 0.8 ? RIM2 : HELM[4], x, top); P(tone(HELM, 0.25 + nx * 0.2, x, top + 1), x, top + 1, 1, 2);
    }
    for (let y = 60; y < 90; y++) P('#2e2a18', 43 + (y - 60) * 0.12, y, 2, 1);
    P('#8a7a4a', 45, 90, 3, 2);
    spatter(72, 46, 6, 22, 0); spatter(48, 50, 3, 8, 0);
    // fusil en travers de la poitrine, baïonnette ensanglantée vers le haut
    const ax = 48, ay = 150, bx = 122, by = 6, len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
    for (let d = 0; d < len; d++) {
      const t = d / len, w = t < 0.18 ? 8 : t < 0.62 ? 6 : t < 0.8 ? 3 : t < 0.98 ? 2 : 1;
      const metal = (t > 0.44 && t < 0.54) || t >= 0.62, blade = t >= 0.8;
      for (let k = -w / 2; k < w / 2; k++) {
        const x = ax + ux * d - uy * k, y = ay + uy * d + ux * k, lit = 0.5 - k / w * 0.8;
        let col = blade ? tone(['#3a3a40', '#6a6a72', '#9a9aa2', '#c8c8d0'], lit, x | 0, y | 0) : tone(metal ? METAL : WOOD, lit, x | 0, y | 0);
        if (blade && t > 0.87 && rnd() < 0.75) col = BLOOD_R[1 + (rnd() * 3 | 0)];
        P(col, x, y); P(col, x + 0.5, y);
      }
    }
    P(BLOOD_R[2], bx - 9, by + 16, 1, 6); P(BLOOD_R[3], bx - 9, by + 22);    // goutte qui coule de la lame
    // mains qui serrent le fusil, couvertes de sang
    [[0.28, 6, 5], [0.52, 5, 4]].forEach(([t, rx, ry]) => {
      const hx = Math.round(ax + (bx - ax) * t), hy = Math.round(ay + (by - ay) * t);
      ell(hx, hy, rx, ry, (x, y, nx, ny) => P(rnd() < 0.35 ? BLOOD_R[1 + (rnd() * 2 | 0)] : tone(SKIN, 0.5 + nx * 0.3 - ny * 0.2, x, y), x, y));
      for (let i = -rx + 2; i < rx; i += 3) P(SKIN[1], hx + i, hy - 1, 1, ry);   // doigts
    });
    // sang sur la veste
    spatter(30, 116, 10, 40, 4); spatter(80, 128, 8, 30, 3); spatter(100, 112, 5, 12, 2);
    return c;
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
    // le soldat au premier plan à droite (retourné pour regarder vers le centre), qui respire ; braise de cigarette et fumée
    const HW = this.hero.width, hx = W - Math.round(W * 0.03) + 6 - HW, hy = H - this.hero.height + 8 + (Math.sin(t / 900) > 0 ? 1 : 0);
    c.save(); c.translate(hx + HW, hy); c.scale(-1, 1); c.drawImage(this.hero, 0, 0); c.restore();
    c.fillStyle = Math.sin(t / 220) > 0.3 ? '#ffc040' : '#ff5a1e'; c.fillRect(hx + HW - 74, hy + 78, 1, 2);
    for (let i = 0; i < 6; i++) {
      const age = (t / 70 + i * 7) % 40;
      c.fillStyle = `rgba(170,150,150,${0.35 * (1 - age / 40)})`;
      c.fillRect(Math.round(hx + HW - 75 - Math.sin(age * 0.25 + i) * 2 - age * 0.15), Math.round(hy + 77 - age), 1, 1);
    }
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
