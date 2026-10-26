// Décors des maps, dessinés en pixels par code et peints une fois pour toutes sur le sol de la map.
// P(couleur, x, y, largeur, hauteur) dessine un rectangle ; rnd() = hasard reproductible de la map.
const STONE = ['#221e1b', '#2e2925', '#3c3630', '#4a433b', '#5a5248', '#6c6358'];

const Decor = {
  // taille des véhicules en cases (largeur, hauteur) : ces cases deviennent solides
  SIZE: { tiger: [4, 3], sherman: [4, 3], truck: [4, 2], halftrack: [3, 2], jeep: [2, 1], pak: [2, 1], car: [2, 1] },

  // ---------- petits éléments communs ----------
  // suie, rouille et impacts sur une carcasse
  burn(P, x, y, w, h, rnd, n = 40) {
    for (let i = 0; i < n; i++) P(rnd() < 0.55 ? '#14110e' : rnd() < 0.5 ? '#5a2e16' : '#7a4020', x + rnd() * w, y + rnd() * h, rnd() < 0.3 ? 2 : 1, 1);
    for (let i = 0; i < n / 10; i++) { const hx = x + 2 + rnd() * (w - 4), hy = y + 2 + rnd() * (h - 4); P('#7a3a14', hx - 1, hy - 1, 3, 3); P('#050404', hx, hy, 1, 1); }
  },
  // éclaboussure et coulure de sang
  gore(P, x, y, r, rnd, drip = 0) {
    for (let i = 0; i < r * 5; i++) { const a = rnd() * 6.28, d = rnd() ** 1.5 * r; P(BLOOD[rnd() * 3 | 0], x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, rnd() < 0.3 ? 2 : 1, 1); }
    if (drip) { P('#5a0606', x, y, 1, drip); P('#850c0c', x, y + drip, 1, 1); }
  },
  // soldat mort affalé (vu de dessus) : uniforme gris ou olive, mare de sang
  body(P, x, y, rnd, us) {
    const U = us ? ['#3e4426', '#4e5632', '#2c3018'] : ['#474b41', '#575e50', '#30352c'], d = rnd() < 0.5 ? 1 : -1;
    const M = (col, rx, ry, w, h) => P(col, d > 0 ? x + rx : x - rx - w, y + ry, w, h);
    this.gore(P, x, y + 1, 6, rnd);
    M('#1c1610', -7, -1, 2, 3); M(U[0], -5, -1, 4, 3); M(U[1], -1, -2, 6, 5); M(U[2], -1, 2, 6, 1);
    M('#8b6a50', 5, -1, 3, 3); M(U[1], 1, 3, 2, 3); M('#7a0c0c', 1, 0, 2, 2);
  },

  // ---------- éléments d'une case ----------
  // mur de pierre en ruine (vue 3/4 : dessus en briques, face avant visible si rien n'est collé dessous)
  wall(P, x, y, rnd, front) {
    const top = front ? 10 : 16;
    P(STONE[1], x, y, 16, top);
    for (let r = 0; r < top; r += 4) for (let b = (r / 4) % 2 ? -4 : 0; b < 16; b += 8) {
      const bx = Math.max(x, x + b), bw = Math.min(x + 16, x + b + 7) - bx;
      if (bw <= 0) continue;
      P(STONE[2 + (rnd() * 3 | 0)], bx, y + r, bw, 3); P(STONE[5], bx, y + r, bw, 1);
    }
    if (front) {
      P('#1a1612', x, y + 10, 16, 6); for (let i = rnd() * 3 | 0; i < 16; i += 5) P('#24201b', x + i, y + 11, 4, 2);
      P('#0c0a08', x, y + 15, 16, 1);
    }
    if (rnd() < 0.5) { let cx = x + 2 + rnd() * 12, cy = y + rnd() * 4; for (let i = 0; i < 6; i++) { P('#121010', cx, cy); cx += rnd() < 0.5 ? 1 : -1; cy++; } }   // fissure
    for (let i = 0; i < 3; i++) if (rnd() < 0.35) P('#0e0c0b', x + 1 + rnd() * 13, y + 1 + rnd() * (top - 2), 2, 2);                                  // impacts de balles
    if (rnd() < 0.3) for (let i = 0; i < 8; i++) P('#141110', x + rnd() * 16, y + rnd() * top, 2, 1);                                                // suie
    if (rnd() < 0.22) { this.gore(P, x + 4 + rnd() * 8, y + 2 + rnd() * (top - 4), 4, rnd); if (front) P('#5a0606', x + 5 + rnd() * 6, y + 10, 1, 3 + rnd() * 3); }
  },
  // tas de gravats : pierres, briques, poutre calcinée
  rubble(P, x, y, rnd) {
    P('rgba(0,0,0,.35)', x + 1, y + 11, 15, 4);
    for (let i = 0; i < 15; i++) {
      const w = 2 + (rnd() * 4 | 0), h = 2 + (rnd() * 3 | 0), bx = x + 1 + rnd() * (14 - w), mid = 1 - Math.abs(bx + w / 2 - x - 8) / 8;
      const by = y + 12 - h - rnd() * 8 * mid, col = rnd() < 0.3 ? '#6a3a2a' : STONE[2 + (rnd() * 4 | 0)];
      P(col, bx, by, w, h); P(rnd() < 0.3 ? '#8a5040' : STONE[5], bx, by, w, 1); P('#14110e', bx, by + h - 1, w, 1);
    }
    P('#1c140c', x + 2, y + 6, 12, 2); P('#3a2614', x + 2, y + 6, 12, 1);
    if (rnd() < 0.5) { P('#5a4a3a', x + 11, y + 2, 1, 7); P('#5a4a3a', x + 12, y + 1, 1, 2); }   // fer tordu
    if (rnd() < 0.3) { P('#8b9566', x + 4, y + 9, 3, 2); this.gore(P, x + 5, y + 11, 3, rnd); }    // main qui dépasse des gravats
  },
  // arbre mort calciné, branches nues
  tree(P, x, y, rnd) {
    const cx = x + 7, cy = y + 12;
    P('rgba(0,0,0,.35)', cx - 6, cy + 1, 14, 3);
    P('#140e0a', cx - 1, cy - 8, 4, 10); P('#2a1e14', cx, cy - 8, 1, 10);
    const br = (bx, by, a, len) => {
      for (let i = 0; i < len; i++) { P('#120d09', bx, by, 1, 1); bx += Math.cos(a); by += Math.sin(a); a += (rnd() - 0.5) * 0.5; }
      if (len > 4) { br(bx, by, a - 0.6, len * 0.6 | 0); br(bx, by, a + 0.5, len * 0.5 | 0); }
    };
    for (let k = 0; k < 4; k++) br(cx + 1, cy - 8, -Math.PI / 2 + (k - 1.5) * 0.75, 6 + (rnd() * 4 | 0));
    if (rnd() < 0.35) { P('#3a3020', cx + 5, cy - 9, 1, 6); P('#474b41', cx + 4, cy - 3, 3, 5); P('#6e7852', cx + 4, cy - 4, 3, 2); P('#5a0606', cx + 5, cy + 2, 1, 3); }   // pendu
  },
  // tombe : stèle ou croix de bois ; certaines sont ouvertes (les morts en sont sortis)
  tomb(P, x, y, rnd) {
    const k = rnd(), open = rnd() < 0.3;
    P('#1e1810', x + 2, y + 9, 12, 6); P('#2e2418', x + 3, y + 9, 10, 1);
    if (open) { P('#080605', x + 4, y + 10, 8, 4); P('#8a8070', x + 6, y + 12, 3, 1); P('#8a8070', x + 9, y + 11, 1, 2); this.gore(P, x + 8, y + 13, 4, rnd); }
    if (k < 0.3) {
      P('#2a1a0e', x + 7, y + 1, 2, 11); P('#2a1a0e', x + 4, y + 4, 8, 2); P('#4a3018', x + 7, y + 1, 1, 11); P('#4a3018', x + 4, y + 4, 8, 1);
      if (rnd() < 0.5) { P('#3c4238', x + 6, y, 4, 2); P('#50584a', x + 7, y, 2, 1); }   // casque posé sur la croix
    } else {
      const b = k > 0.8 ? 4 : 0;
      P('rgba(0,0,0,.4)', x + 5, y + 12, 9, 2);
      P('#4a4642', x + 4, y + 2 + b, 8, 10 - b); P('#4a4642', x + 5, y + 1 + b, 6, 1);
      P('#66615a', x + 4, y + 2 + b, 1, 10 - b); P('#302c28', x + 11, y + 2 + b, 1, 10 - b); P('#34302c', x + 4, y + 11, 8, 1);
      if (!b) { P('#24201c', x + 7, y + 4, 2, 6); P('#24201c', x + 5, y + 6, 6, 1); }
      if (rnd() < 0.4) this.gore(P, x + 6 + rnd() * 4, y + 5, 3, rnd, 4);
    }
  },
  // barbelés sur piquets, lambeaux d'uniforme accrochés
  wire(P, x, y, rnd) {
    P('#241810', x + 1, y + 3, 1, 10); P('#241810', x + 14, y + 4, 1, 9);
    for (let i = 0; i < 16; i++) {
      const a = y + 8 + Math.round(Math.sin(i * 0.9 + x) * 4), b = y + 8 + Math.round(Math.cos(i * 0.9 + x) * 4);
      P('#5a5650', x + i, a); P('#3e3a34', x + i, b);
      if (i % 3 === 0) { P('#2e2b27', x + i - 1, a - 1); P('#2e2b27', x + i + 1, a + 1); }
    }
    if (rnd() < 0.45) { P('#3c4238', x + 5, y + 6, 3, 2); P('#6a0808', x + 6, y + 8, 1, 3); }
  },
  // fontaine de la place (2x2 cases) : le bassin est rempli de sang
  fountain(P, x, y) {
    const cx = x + 16, cy = y + 16;
    P('rgba(0,0,0,.4)', cx - 14, cy + 10, 30, 5);
    for (let dy = -13; dy <= 13; dy++) for (let dx = -15; dx <= 15; dx++) {
      const d = Math.hypot(dx / 15, dy / 13);
      if (d <= 1) P(d > 0.8 ? (dy < 0 ? '#6a6258' : '#443e36') : d > 0.7 ? '#26221e' : (dither(dx, dy) > 0.75 ? '#5e0808' : '#3a0404'), cx + dx, cy + dy);
    }
    P('#4e4840', cx - 3, cy - 7, 6, 9); P('#746c60', cx - 3, cy - 7, 6, 1); P('#2e2a26', cx + 2, cy - 6, 1, 8); P('#2e2a26', cx - 4, cy - 9, 3, 2);
    P('#8a0c0c', cx - 1, cy - 5, 1, 7); P('#a01212', cx - 7, cy + 4, 3, 1); P('#a01212', cx + 5, cy - 3, 2, 1);
    P('#8b9566', cx + 7, cy + 2, 4, 2); P('#6e7852', cx + 10, cy + 1, 2, 2); P('#6a0808', cx + 7, cy + 4, 2, 1);   // bras qui sort du bassin
  },

  // emplacement de la boîte mystère quand elle n'y est pas : palette vide, chaîne qui traîne, bougie éteinte, sang séché
  boxSpot(P, x, y) {
    P('rgba(0,0,0,.35)', x + 1, y + 5, 31, 11);
    for (let i = 0; i < 4; i++) { P('#3a2814', x + 2 + i * 7, y + 4, 6, 10); P('#4e3620', x + 2 + i * 7, y + 4, 6, 1); P('#24180c', x + 7 + i * 7, y + 4, 1, 10); }
    P('#24180c', x + 2, y + 8, 28, 1);
    for (let i = 0; i < 8; i++) P(i % 2 ? '#3e3a34' : '#5a564e', x + 3 + i * 2, y + 13 + (i % 2), 2, 1);
    P('#c8c0a0', x + 27, y + 2, 2, 4); P('#3a3020', x + 27, y + 1, 1, 1);
    P('#4a0606', x + 10, y + 6, 3, 2); P('#5a0808', x + 20, y + 10, 2, 1);
  },

  // ---------- véhicules (x, y = coin haut-gauche de leur première case) ----------
  // char Tigre allemand éventré, canon de 88 qui pend, équipage mort sur la tourelle
  tiger(P, x, y, rnd) {
    P('rgba(0,0,0,.45)', x + 3, y + 6, 62, 42);
    for (const ty of [y + 2, y + 37]) { P('#13110d', x, ty, 64, 9); for (let i = 1; i < 64; i += 4) P('#2a2822', x + i, ty + 1, 2, 7); P('#38362e', x, ty, 64, 1); }
    P('#3a3628', x + 3, y + 10, 58, 28); P('#56503c', x + 3, y + 10, 58, 2); P('#24211a', x + 3, y + 36, 58, 2); P('#46412f', x + 5, y + 13, 54, 22);
    P('#2c291f', x + 46, y + 15, 12, 18); for (let i = 0; i < 4; i++) P('#1c1a14', x + 47, y + 17 + i * 4, 10, 2);
    P('#14110e', x + 8, y + 21, 7, 1); P('#14110e', x + 11, y + 18, 1, 7); P('#d8d0c0', x + 9, y + 21, 5, 1); P('#d8d0c0', x + 11, y + 19, 1, 5);   // croix
    P('#28251c', x + 15, y + 12, 26, 24); P('#524c39', x + 16, y + 13, 24, 22); P('#686146', x + 16, y + 13, 24, 1); P('#34301f', x + 16, y + 34, 24, 1);
    P('#2c291f', x + 26, y + 16, 8, 7); P('#0a0806', x + 28, y + 18, 4, 3);
    P('#28251c', x - 10, y + 23, 26, 4); P('#44402e', x - 10, y + 23, 26, 1); P('#1a1813', x - 13, y + 22, 4, 6);
    this.burn(P, x + 4, y + 11, 56, 26, rnd, 60);
    P('#050404', x + 36, y + 24, 5, 5); P('#7a3a14', x + 35, y + 23, 7, 1);   // trou d'obus
    this.body(P, x + 30, y + 20, rnd); this.gore(P, x + 30, y + 26, 4, rnd, 10);
  },
  // Sherman américain brûlé, étoile délavée, chenille arrachée
  sherman(P, x, y, rnd) {
    P('rgba(0,0,0,.45)', x + 3, y + 6, 62, 42);
    P('#13110d', x + 2, y + 2, 60, 9); for (let i = 3; i < 60; i += 4) P('#2a2822', x + i, y + 3, 2, 7);
    P('#13110d', x + 2, y + 37, 40, 9); for (let i = 3; i < 40; i += 4) P('#2a2822', x + i, y + 38, 2, 7);
    for (let i = 0; i < 6; i++) P('#2a2822', x + 44 + i * 4, y + 44 + (i % 2), 3, 2);   // maillons éparpillés
    P('#363c22', x + 3, y + 10, 58, 28); P('#525a34', x + 3, y + 10, 58, 2); P('#24281a', x + 3, y + 36, 58, 2); P('#454c2c', x + 5, y + 13, 54, 22);
    for (let i = -2; i <= 2; i++) { P('#a8a490', x + 12 + i, y + 24 - (2 - Math.abs(i)), 1, 1 + (2 - Math.abs(i)) * 2); }
    P('#a8a490', x + 9, y + 23, 7, 1);
    P('#2a2e1a', x + 22, y + 14, 22, 20); P('#4e5632', x + 23, y + 15, 20, 18); P('#62693e', x + 24, y + 15, 18, 1); P('#2a2e1a', x + 22, y + 15, 1, 18);
    P('#2a2e1a', x + 43, y + 22, 24, 3); P('#44482c', x + 43, y + 22, 24, 1);
    this.burn(P, x + 4, y + 11, 56, 26, rnd, 70);
    P('#050404', x + 26, y + 30, 4, 4); P('#7a3a14', x + 25, y + 29, 6, 1);
    this.body(P, x + 14, y + 47, rnd, true);
  },
  // camion Opel Blitz : cabine à gauche, bâche déchirée sur les arceaux, caisses renversées
  truck(P, x, y, rnd) {
    P('rgba(0,0,0,.45)', x + 3, y + 4, 62, 30);
    [[6, 0], [6, 29], [44, 0], [44, 29], [54, 0], [54, 29]].forEach(([a, b]) => P('#0e0d0b', x + a, y + b, 8, 3));
    P('#2a2c22', x + 1, y + 4, 16, 24); P('#3e4232', x + 2, y + 5, 14, 22); P('#1a1c16', x + 1, y + 4, 4, 24);
    P('#0c0e10', x + 6, y + 7, 3, 18); P('#4a5a60', x + 6, y + 9, 1, 2); P('#4a5a60', x + 7, y + 19, 1, 3);   // pare-brise brisé
    P('#24261c', x + 18, y + 3, 45, 26); P('#4a4a36', x + 19, y + 4, 43, 24);
    for (let i = 0; i < 5; i++) P('#1e1e16', x + 21 + i * 9, y + 4, 2, 24);                                         // arceaux
    for (let i = 0; i < 30; i++) P(rnd() < 0.5 ? '#5e5e44' : '#3a3a2a', x + 19 + rnd() * 43, y + 4 + rnd() * 24, 3, 1);
    P('#0e0c0a', x + 34, y + 8, 14, 12); P('#30261a', x + 36, y + 10, 4, 3); P('#30261a', x + 42, y + 14, 5, 3);      // bâche arrachée
    this.burn(P, x + 2, y + 4, 60, 24, rnd, 50);
    P('#4c5430', x + 62, y + 18, 9, 8); P('#5f6a3c', x + 62, y + 18, 9, 1); P('#bdb690', x + 64, y + 21, 5, 1);       // caisse tombée
    this.gore(P, x + 10, y + 16, 5, rnd, 6);
  },
  // semi-chenillé : roues avant, chenilles arrière, compartiment ouvert plein de cadavres
  halftrack(P, x, y, rnd) {
    P('rgba(0,0,0,.45)', x + 3, y + 4, 46, 30);
    P('#0e0d0b', x + 3, y, 8, 3); P('#0e0d0b', x + 3, y + 29, 8, 3);
    P('#13110d', x + 18, y, 29, 4); P('#13110d', x + 18, y + 28, 29, 4);
    for (let i = 19; i < 47; i += 3) { P('#2a2822', x + i, y + 1, 1, 2); P('#2a2822', x + i, y + 29, 1, 2); }
    P('#2c2a20', x + 1, y + 6, 16, 20); P('#46422f', x + 2, y + 7, 14, 18); P('#56503a', x + 2, y + 7, 14, 1);
    P('#2c2a20', x + 16, y + 4, 31, 24); P('#46422f', x + 17, y + 5, 29, 22); P('#14110e', x + 19, y + 8, 25, 16);   // compartiment
    this.body(P, x + 26, y + 13, rnd); this.body(P, x + 36, y + 19, rnd);
    this.gore(P, x + 30, y + 16, 7, rnd);
    this.burn(P, x + 2, y + 5, 44, 22, rnd, 40);
  },
  // jeep Willys renversée sur le côté, étoile blanche
  jeep(P, x, y, rnd) {
    P('rgba(0,0,0,.45)', x + 2, y + 3, 31, 14);
    [[3, 0], [3, 13], [23, 0], [23, 13]].forEach(([a, b]) => P('#0e0d0b', x + a, y + b, 6, 3));
    P('#2c321c', x + 1, y + 2, 30, 12); P('#4a522e', x + 2, y + 3, 28, 10); P('#5c663a', x + 2, y + 3, 28, 1);
    P('#1a1e12', x + 12, y + 3, 1, 10); P('#24281a', x + 14, y + 4, 6, 3); P('#24281a', x + 14, y + 9, 6, 3);      // pare-brise, sièges
    P('#a8a490', x + 5, y + 7, 3, 1); P('#a8a490', x + 6, y + 6, 1, 3);
    this.burn(P, x + 2, y + 3, 28, 10, rnd, 18); this.gore(P, x + 17, y + 7, 4, rnd);
  },
  // canon antichar PaK : bouclier, tube vers la gauche, flèches d'affût écartées
  pak(P, x, y, rnd) {
    P('rgba(0,0,0,.4)', x - 4, y + 9, 36, 6);
    P('#1c1c1a', x + 20, y + 3, 12, 2); P('#1c1c1a', x + 20, y + 11, 12, 2);
    P('#0e0d0b', x + 12, y, 5, 3); P('#0e0d0b', x + 12, y + 13, 5, 3);
    P('#2e302a', x + 10, y + 2, 4, 12); P('#4a4c44', x + 10, y + 2, 1, 12);
    P('#262824', x - 8, y + 7, 22, 2); P('#40423a', x - 8, y + 7, 22, 1); P('#141412', x - 10, y + 6, 3, 4);
    this.burn(P, x + 9, y + 2, 6, 12, rnd, 6);
    for (let i = 0; i < 5; i++) P('#a07a30', x + 20 + rnd() * 10, y + 5 + rnd() * 6, 2, 1);   // douilles d'obus
  },
  // traction avant noire criblée de balles, vitres brisées, portière arrachée
  car(P, x, y, rnd) {
    P('rgba(0,0,0,.45)', x + 2, y + 3, 32, 14);
    [[4, 0], [4, 13], [22, 0], [22, 13]].forEach(([a, b]) => P('#0a0a0a', x + a, y + b, 6, 3));
    P('#0c0c0e', x, y + 3, 32, 11); P('#1c1c22', x + 1, y + 3, 30, 10); P('#2e2e36', x + 1, y + 3, 30, 1);
    P('#121216', x + 1, y + 5, 9, 6); P('#26262c', x + 2, y + 6, 7, 1);                                            // capot
    P('#060608', x + 11, y + 4, 12, 8); P('#3a4a50', x + 12, y + 5, 2, 1); P('#3a4a50', x + 19, y + 10, 1, 1);       // habitacle, éclats de vitre
    P('#16161a', x + 24, y + 4, 7, 8);
    this.burn(P, x + 1, y + 3, 30, 10, rnd, 22);
    P('#1c1c22', x + 12, y + 15, 8, 2);   // portière tombée au sol
    this.gore(P, x + 16, y + 8, 4, rnd);
  },

  // ---------- porte achetable ----------
  // barricade (planches clouées, sacs de sable, barbelés, empreintes de mains en sang) dessinée sur un canvas à part :
  // elle s'efface quand on l'achète. Marge de M px autour de son emprise pour les parties qui dépassent.
  M: 8,
  barricade(w, h, seed) {
    const T = CFG.TILE, M = this.M, c = document.createElement('canvas'), L = Math.max(w, h) * T, horiz = w >= h;
    c.width = w * T + M * 2; c.height = h * T + M * 2;
    const g = c.getContext('2d');
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    // (a, b) = position le long de la barricade et en travers : on tourne le dessin pour les portes verticales
    const Q = (col, a, b, la = 1, lb = 1) => { g.fillStyle = col; horiz ? g.fillRect(M + Math.round(a), M + Math.round(b), la, lb) : g.fillRect(M + Math.round(b), M + Math.round(a), lb, la); };
    Q('rgba(0,0,0,.45)', 0, 12, L, 6);
    for (let a = 0; a < L; a += 7) { Q('#6a5a3e', a, 9, 7, 6); Q('#8a7a56', a + 1, 9, 5, 1); Q('#4a3e2a', a, 14, 7, 1); }   // sacs de sable
    for (const a of [1, L - 5]) { Q('#24160c', a, -6, 4, 20); Q('#4a3018', a, -6, 1, 20); }                              // poteaux
    for (let i = 0; i < 4; i++) {                                                                                        // planches
      const b0 = -3 + i * 3.5, sk = (rnd() - 0.5) * 4;
      for (let a = 0; a < L; a++) { const b = b0 + sk * a / L; Q(i % 2 ? '#5a3a1c' : '#6e4a24', a, b, 1, 3); Q('#2a1a0e', a, b + 2); }
      Q('#9a9a9a', 3, b0 + 1); Q('#9a9a9a', L - 4, b0 + sk + 1);
    }
    for (let k = 0; k < Math.floor(L / 24); k++) {                                                                       // planches en croix
      const a0 = 4 + k * 24;
      for (let i = 0; i < 16; i++) { Q('#4e3218', a0 + i, -5 + i * 0.9, 2, 2); Q('#4e3218', a0 + 15 - i, -5 + i * 0.9, 2, 2); }
    }
    for (let a = 0; a < L; a++) { const b = -8 + Math.round(Math.sin(a * 0.8) * 2); Q('#6a665e', a, b); if (a % 4 === 0) { Q('#44403a', a - 1, b - 1); Q('#44403a', a + 1, b + 1); } }   // barbelés
    for (let k = 0; k < 2; k++) {                                                                                        // mains en sang
      const a = 6 + rnd() * (L - 12), b = 1 + rnd() * 4;
      Q('#7a0a0a', a, b, 3, 3); [0, 1, 2, 3].forEach(i => Q('#7a0a0a', a - 1 + i, b - 2 - (i % 2), 1, 2)); Q('#5a0606', a + 1, b + 3, 1, 4);
    }
    return c;
  }
};
