// Pixel art dessiné par code (aucune image à charger). Vue 3/4, ambiance 2nde Guerre mondiale.
const rectFn = (c, x, y) => (col, rx, ry, w, h) => { c.fillStyle = col; c.fillRect(x + rx, y + ry, w, h); };

const Sprites = {
  // armes vues de profil : segments le long du canon [début, fin, couleur, épaisseur, décalage sous le canon]
  // len = longueur (le départ du coup de feu), hands = positions des deux mains
  GUNS: {
    rifle:   { len: 13, hands: [3, 8], segs: [[0, 1, '#4e2c12', 2, 0], [2, 6, '#6e4220', 2, 0], [7, 12, '#2b2b30', 1, 0], [13, 13, '#0e0e10', 1, 0]] },
    pistol:  { len: 9, hands: [5, 5], segs: [[5, 5, '#3a2414', 1, 1], [5, 5, '#3a2414', 1, 2], [4, 8, '#4c4c54', 1, 0], [9, 9, '#0e0e10', 1, 0]] },
    smg:     { len: 13, hands: [4, 10], segs: [[0, 3, '#6e4220', 2, 0], [4, 9, '#2b2b30', 2, 0], [6, 7, '#1a1a1e', 2, 2], [10, 11, '#6e4220', 1, 1], [10, 12, '#2b2b30', 1, 0], [13, 13, '#0e0e10', 1, 0]] },
    ar:      { len: 15, hands: [5, 11], segs: [[0, 3, '#4a3a26', 2, 0], [4, 10, '#3a3a40', 2, 0], [7, 7, '#2b2b30', 1, 2], [8, 8, '#2b2b30', 1, 3], [11, 14, '#2b2b30', 1, 0], [15, 15, '#0e0e10', 1, 0]] },
    shotgun: { len: 15, hands: [4, 10], segs: [[0, 5, '#6e4220', 2, 0], [6, 14, '#3a3a40', 1, 0], [9, 11, '#8a5a2a', 1, 1], [15, 15, '#0e0e10', 1, 0]] },
    sniper:  { len: 17, hands: [3, 9], segs: [[0, 1, '#4e2c12', 2, 0], [2, 7, '#6e4220', 2, 0], [8, 16, '#2b2b30', 1, 0], [5, 9, '#18181c', 1, -2], [5, 5, '#18181c', 1, -1], [9, 9, '#18181c', 1, -1], [17, 17, '#0e0e10', 1, 0]] }
  },
  // arme orientée selon a (y = -3 : hauteur des épaules) ; le chargeur reste toujours sous le canon
  gun(F, a, skin, flash, w = 'rifle', y0 = -3) {
    const G = this.GUNS[w], cs = Math.cos(a), sn = Math.sin(a), side = cs < 0 ? -1 : 1;
    const at = (i, off) => [Math.round(cs * i - sn * off * side), Math.round(sn * i + cs * off * side) + y0];
    for (const [from, to, col, th, off] of G.segs) for (let i = from; i <= to; i++) {
      const [px, py] = at(i, off);
      F(col, px - (th > 1 ? 1 : 0), py - (th > 1 ? 1 : 0), th, th);
    }
    if (skin) for (const h of G.hands) { const [px, py] = at(h, 0); F(skin, px - 1, py - 1, 2, 2); }
    if (flash) {
      const [fx, fy] = at(G.len + 3, 0);
      F('#ff8a1e', fx - 3, fy, 7, 1); F('#ff8a1e', fx, fy - 3, 1, 7); F('#ffe9a0', fx - 1, fy - 1, 3, 3);
    }
  },
  // GI américain : veste M1941, casque M1, arme en main (o.weapon)
  soldier(c, x, y, a, o) {
    x = Math.round(x); y = Math.round(y);
    const F = rectFn(c, x, y), cs = Math.cos(a), sn = Math.sin(a), back = sn < -0.35, skin = '#d9a478', l = o.step ? 1 : 0;
    F('rgba(0,0,0,.45)', -5, 6, 10, 2);
    F('#3d3b22', -3, 1, 3, 4 - l); F('#24180c', -3, 5 - l, 3, 2);   // jambes + bottes (une levée en marchant)
    F('#4a482a', 0, 1, 3, 3 + l); F('#24180c', 0, 4 + l, 3, 2);
    if (sn < 0) this.gun(F, a, skin, o.flash, o.weapon);
    F('#56552f', -4, -6, 8, 7); F('#6a6839', -4, -6, 2, 7); F('#42411f', 3, -6, 1, 7);
    F('#33301c', -3, -6, 1, 6); F('#33301c', 2, -6, 1, 6);           // bretelles
    F('#4a4630', -4, -1, 2, 1); F('#4a4630', 2, -1, 2, 1);           // cartouchières
    F('#2b2214', -4, 0, 8, 1); F('#a8925a', -1, 0, 2, 1);            // ceinturon
    if (back) F('#b5845c', -2, -8, 4, 2);
    else {
      const ox = cs > 0.5 ? 1 : cs < -0.5 ? -1 : 0;
      F(skin, -3, -11, 6, 5); F('#b5845c', 2, -11, 1, 5); F('#b5845c', -3, -7, 6, 1);
      F('#1a120c', -2 + ox, -9, 1, 1); F('#1a120c', 1 + ox, -9, 1, 1);
      F('#2e3219', -3, -9, 1, 2); F('#2e3219', 2, -9, 1, 2);       // jugulaire
    }
    F('#4b562f', -3, -15, 6, 1); F('#4b562f', -4, -14, 8, 3); F('#606d3d', -3, -14, 3, 1);
    if (back) F('#4b562f', -4, -11, 8, 2);
    F('#37401f', -5, back ? -9 : -11, 10, 1);                       // bord du casque
    if (sn >= 0) this.gun(F, a, skin, o.flash, o.weapon);
  },

  // soldat allemand mort-vivant : uniforme feldgrau déchiré, casque Stahlhelm, bras tendus
  // o.v = variante (0-3) : 1 = jambe arrachée, 2 = cage thoracique ouverte, 3 = sans casque
  zombie(c, x, y, a, o) {
    x = Math.round(x); y = Math.round(y);
    const F = rectFn(c, x, y), cs = Math.cos(a), sn = Math.sin(a), back = sn < -0.35, h = o.hit > 0;
    const cl = h ? ['#fff', '#fff', '#ddd', '#eee'] : ['#575e50', '#6a7262', '#41473b', '#474b41'];
    const skin = h ? '#fff' : '#8b9566', sk2 = h ? '#ddd' : '#646e45', blood = '#7a0c0c', l = o.step ? 1 : 0;
    F('rgba(0,0,0,.45)', -5, 6, 10, 2);
    F(cl[3], -3, 1, 3, 4 - l); F('#1c1610', -3, 5 - l, 3, 2);
    F(cl[3], 0, 1, 3, 3 + l); F('#1c1610', 0, 4 + l, 3, 2);
    if (o.v === 1) { F(sk2, 0, 2, 2, 2); F(blood, 1, 3, 1, 3); }
    const arms = () => {
      for (const s of [-1, 1]) {
        const sx = -sn * 3 * s, sy = cs * 1.5 * s - 5, sway = Math.sin(o.t * 4 + s) * 0.8;
        for (let i = 1; i <= 7; i++) {
          const px = Math.round(sx + cs * i), py = Math.round(sy + sn * i * 0.8 + sway);
          F(i <= 4 ? cl[0] : i === 7 ? blood : skin, px - 1, py - 1, 2, 2);
        }
      }
    };
    if (sn < 0) arms();
    F(cl[0], -4, -6, 8, 7); F(cl[1], -4, -6, 2, 7); F(cl[2], 3, -6, 1, 7);
    if (!h) {
      if (!back) { F('#2f3a2c', -2, -6, 4, 1); F('#8a8a7a', 0, -4, 1, 1); F('#8a8a7a', 0, -2, 1, 1); }
      if (o.v === 2 && !back) { F(sk2, -2, -5, 4, 4); F('#cfc5a2', -2, -4, 4, 1); F('#cfc5a2', -2, -2, 4, 1); F(blood, -1, -3, 2, 1); }
      F(blood, -3, -3, 2, 2); F('#5a0808', 1, -1, 2, 3); F(blood, -2, 1, 1, 2);   // taches de sang
    }
    F('#241e14', -4, 0, 8, 1); F('#6e6e66', -1, 0, 2, 1);
    F(skin, -3, -11, 6, 5); F(sk2, -3, -7, 6, 1);
    if (back) F('#5a1a12', -1, -9, 2, 2);
    else {
      const ox = cs > 0.5 ? 1 : cs < -0.5 ? -1 : 0;
      F(sk2, 2, -11, 1, 5); F('#5a1a12', -3, -10, 1, 2);
      F('#1a0505', -1 + ox, -7, 3, 1); F(blood, ox, -6, 1, 2);       // mâchoire ensanglantée
      this.zombieEyes(c, x, y, a);
    }
    if (o.v === 3) { F('#2a2a1e', -3, -12, 6, 1); F('#2a2a1e', -3, -11, 2, 1); F('#d6cdb0', 0, -12, 2, 1); F(blood, 1, -11, 1, 1); }
    else {
      F('#3c4238', -3, -15, 6, 1); F('#3c4238', -4, -14, 8, 3); F('#50584a', -3, -14, 3, 1);
      if (back) F('#3c4238', -4, -11, 8, 2);
      F('#30352c', -5, back ? -9 : -11, 10, 1); F('#30352c', -5, back ? -8 : -10, 1, 2); F('#30352c', 4, back ? -8 : -10, 1, 2);
    }
    if (sn >= 0) arms();
  },

  // yeux luisants (redessinés par-dessus l'obscurité pour briller dans le noir)
  zombieEyes(c, x, y, a) {
    if (Math.sin(a) < -0.35) return;
    const F = rectFn(c, Math.round(x), Math.round(y)), cs = Math.cos(a), ox = cs > 0.5 ? 1 : cs < -0.5 ? -1 : 0;
    F('#ffd23a', -2 + ox, -9, 1, 1); F('#ffd23a', 1 + ox, -9, 1, 1);
  },

  // grenade Mk2 « ananas » : ombre au sol, corps décalé de sa hauteur z pendant le vol
  grenade(c, x, y, z) {
    x = Math.round(x); y = Math.round(y);
    const F = rectFn(c, x, y), h = Math.round(z);
    F('rgba(0,0,0,.45)', -2, 0, 4, 1);
    F('#4b5a2a', -2, -3 - h, 4, 4); F('#2f3a1a', -2, -1 - h, 4, 1); F('#2f3a1a', 0, -3 - h, 1, 4);
    F('#7a8a46', -2, -3 - h, 1, 2); F('#9a9a90', -1, -4 - h, 2, 1); F('#9a9a90', 1, -4 - h, 1, 3);
  },
  // mèche qui clignote (redessinée par-dessus l'obscurité)
  grenadeFuse(c, x, y, z, t) {
    if (Math.floor(t * (t > 0.9 ? 16 : 8)) % 2) return;
    c.fillStyle = '#ff3020'; c.fillRect(Math.round(x), Math.round(y) - 5 - Math.round(z), 1, 1);
  },

  // icônes des atouts (7x7) : cœur, croix de soin, double chevron, deux balles
  PERK_ICONS: {
    health: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    regen:  ['..XXX..', '..XXX..', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '..XXX..', '..XXX..'],
    speed:  ['X..X...', '.X..X..', '..X..X.', '...X..X', '..X..X.', '.X..X..', 'X..X...'],
    fire:   ['.X...X.', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX'],
    upgrade: ['.XXXXX.', 'XXXXXXX', 'X..X..X', 'XXXXXXX', '.XX.XX.', '.XXXXX.', '.X.X.X.']   // crâne : arme améliorée
  },
  // teintes des machines : corps, ombre, reflet, lueur (r,g,b)
  PERK_PAL: {
    health: ['#8e1a16', '#5a0e0c', '#c43a2a', '255,60,40'],
    regen:  ['#1e4a9a', '#10285a', '#3a78d8', '60,130,255'],
    speed:  ['#b85a14', '#6e3008', '#ff8a2a', '255,140,40'],
    fire:   ['#b89a14', '#6e5a08', '#ffd84a', '255,215,60'],
    upgrade: ['#6a2aa8', '#2e1050', '#b060ff', '170,80,255']
  },
  perkIcon(c, x, y, perk, col) {
    c.fillStyle = col;
    this.PERK_ICONS[perk].forEach((row, j) => { for (let i = 0; i < 7; i++) if (row[i] === 'X') c.fillRect(x + i, y + j, 1, 1); });
  },
  // machine à atout : (x, y) = coin haut-gauche de sa case ; elle dépasse sur le mur au-dessus (vue 3/4)
  perkMachine(c, x, y, perk) {
    const [main, dark, light] = this.PERK_PAL[perk], F = rectFn(c, Math.round(x) + 1, Math.round(y) - 12);
    F('rgba(0,0,0,.45)', -1, 27, 16, 2);
    F(main, 0, 4, 14, 23); F(light, 0, 4, 2, 23); F(dark, 12, 4, 2, 23);
    F('#2a2a2a', 0, 4, 14, 1); F('#1a1a1a', 0, 26, 14, 1);
    F('#140808', -1, 0, 16, 5); F(main, 0, 1, 14, 3);                  // enseigne (allumée dans perkMachineLit)
    F('#140808', 2, 7, 10, 10);                                          // vitrine
    this.perkIcon(c, Math.round(x) + 2 + 2, Math.round(y) - 12 + 8 + 1, perk, light);
    F('#c8b060', 11, 18, 2, 3); F('#5a4a20', 11, 20, 2, 1);              // fente à pièces
    F('#0a0505', 2, 20, 8, 4); F(light, 5, 21, 2, 3); F('#ffffff', 5, 21, 1, 1);   // trappe + bouteille
    F('#5a0808', 1, 15, 1, 3); F('#7a0c0c', 12, 9, 1, 2); F('#4a0606', 9, 24, 3, 1); // sang séché
  },
  // enseigne et icône lumineuses (redessinées par-dessus l'obscurité), qui grésillent par moments
  perkMachineLit(c, x, y, perk, t) {
    const [, , light, glow] = this.PERK_PAL[perk], bx = Math.round(x) + 1, by = Math.round(y) - 12;
    const on = Math.sin(t * 2.3 + bx) > -0.92;
    c.fillStyle = on ? light : this.PERK_PAL[perk][1]; c.fillRect(bx, by + 1, 14, 3);
    c.fillStyle = on ? '#ffffff' : light; c.fillRect(bx + 2, by + 2, 10, 1);
    this.perkIcon(c, bx + 3, by + 9, perk, on ? light : this.PERK_PAL[perk][0]);
    return on ? glow : null;
  },
  // machine d'amélioration d'arme : presse en fonte rivetée, 2 cases de large, chambre violette où l'on glisse l'arme
  // (x, y) = coin haut-gauche de sa première case ; elle dépasse un peu sur la case au-dessus
  forge(c, x, y) {
    const [main, dark] = this.PERK_PAL.upgrade, F = rectFn(c, Math.round(x) + 1, Math.round(y) - 6);
    F('rgba(0,0,0,.45)', -1, 21, 32, 2);
    F('#2e2a28', 0, 4, 30, 15); F('#4a4540', 0, 4, 30, 1); F('#1c1a18', 0, 18, 30, 1);    // corps en fonte
    F('#1a1614', -1, 18, 32, 4);                                                          // socle
    for (let i = 0; i < 32; i += 4) { F('#b89a14', i - 1, 19, 2, 2); }                    // bandes de danger
    [[1, 5], [28, 5], [1, 16], [28, 16]].forEach(([a, b]) => F('#77706a', a, b, 1, 1));    // rivets
    F('#45403c', 2, 6, 4, 11); F('#6a645e', 3, 6, 1, 11); F('#45403c', 24, 6, 4, 11); F('#6a645e', 25, 6, 1, 11); // pistons
    F('#5a5550', 1, 9, 6, 1); F('#5a5550', 23, 9, 6, 1);
    F('#0a0410', 8, 6, 14, 11); F(dark, 9, 7, 12, 9);                                    // chambre (allumée dans forgeLit)
    F('#140808', 5, 0, 20, 5); F(main, 6, 1, 18, 3);                                      // enseigne
    F('#5a0808', 4, 12, 1, 4); F('#7a0c0c', 22, 15, 2, 1); F('#4a0606', 12, 17, 5, 1);    // sang séché
  },
  // enseigne, chambre et crâne lumineux par-dessus l'obscurité ; renvoie la lueur (ou null quand elle grésille)
  forgeLit(c, x, y, t) {
    const [main, dark, light, glow] = this.PERK_PAL.upgrade, bx = Math.round(x) + 1, by = Math.round(y) - 6;
    const on = Math.sin(t * 1.7 + 3) > -0.92, pulse = 0.5 + Math.sin(t * 5) * 0.5;
    c.fillStyle = on ? light : dark; c.fillRect(bx + 6, by + 1, 18, 3);
    c.fillStyle = on ? '#ffffff' : main; c.fillRect(bx + 8, by + 2, 14, 1);
    c.fillStyle = on ? main : dark; c.fillRect(bx + 9, by + 7, 12, 9);
    c.fillStyle = `rgba(230,190,255,${on ? 0.25 + pulse * 0.35 : 0.1})`; c.fillRect(bx + 10, by + 8, 10, 7);
    c.fillStyle = '#140820'; c.fillRect(bx + 10, by + 13, 10, 1); c.fillRect(bx + 11, by + 14, 3, 1);   // fusil dans la chambre
    this.perkIcon(c, bx + 12, by + 7, 'upgrade', on ? '#ffffff' : main);
    if (on && pulse > 0.85) { c.fillStyle = '#ffe0ff'; c.fillRect(bx + 8 + (t * 37 % 14 | 0), by + 6, 1, 1); }   // étincelle
    return on ? glow : null;
  },

  // boîte mystère : caisse de munitions enchaînée, 2 cases de large ; (x, y) = coin haut-gauche de sa première case
  // open = couvercle relevé (pendant le tirage et tant que l'arme attend dans la boîte)
  mysteryBox(c, x, y, open) {
    const F = rectFn(c, Math.round(x), Math.round(y));
    F('rgba(0,0,0,.45)', 0, 15, 32, 2);
    F('#4a3018', 1, 6, 30, 9); F('#3a2410', 1, 9, 30, 1); F('#3a2410', 1, 12, 30, 1); F('#2a1a0a', 1, 14, 30, 1);   // face avant
    F('#2a2a2e', 1, 6, 2, 9); F('#2a2a2e', 29, 6, 2, 9); F('#55555a', 1, 6, 1, 9);                                  // coins en fer
    if (open) {
      F('#6a4422', 1, -9, 30, 6); F('#80562c', 1, -9, 30, 1); F('#5a381a', 1, -6, 30, 1); F('#2a2a2e', 1, -4, 30, 1);  // couvercle relevé
      F('#2a1a0a', 1, -3, 30, 9); F('#0c0604', 3, -2, 26, 7);                                                         // intérieur
    } else {
      F('#6a4422', 1, -2, 30, 8); F('#80562c', 1, -2, 30, 1); F('#5a381a', 1, 1, 30, 1); F('#5a381a', 1, 4, 30, 1);  // couvercle
      F('#2a2a2e', 15, -2, 2, 8);
      for (let i = 0; i < 6; i++) { F('#77706a', 4 + i * 2, -1 + i, 2, 1); F('#77706a', 26 - i * 2, -1 + i, 2, 1); }   // chaînes
      F('#a89a70', 14, 3, 4, 3); F('#5a4a20', 15, 4, 2, 1);                                                          // cadenas
    }
    F('#6a0a0a', 4, 11, 3, 1); F('#5a0808', 24, 7, 1, 3); F('#7a0c0c', 20, 13, 2, 1);                                 // sang
  },
  // « ? » lumineux sur la boîte, et quand elle est ouverte : faisceau de lumière et arme qui flotte au-dessus
  // st = { open, weapon (arme montrée ou null), rise (0-1), hide (clignote quand l'arme va disparaître) }
  mysteryBoxLit(c, x, y, t, st) {
    const bx = Math.round(x), by = Math.round(y), on = Math.sin(t * 2.1 + 1) > -0.9;
    const Q = ['XXX', '..X', '.X.', '...', '.X.'];
    c.fillStyle = on ? '#8ad4ff' : '#2a4a60';
    for (const qx of [5, 14, 23]) Q.forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === 'X') c.fillRect(bx + qx + i, by + 8 + j, 1, 1); });
    if (!st.open) return on ? '120,200,255' : null;
    const g = c.createLinearGradient(0, by - 46, 0, by + 2);
    g.addColorStop(0, 'rgba(140,210,255,0)'); g.addColorStop(1, 'rgba(170,225,255,.55)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(bx + 2, by - 46, 28, 48); c.globalCompositeOperation = 'source-over';
    if (st.weapon && !st.hide) {   // arme dessinée en double taille pour bien la reconnaître
      const G = this.GUNS[st.weapon], ox = bx + 16 - G.len, oy = by - 6 - Math.round(st.rise * 16 + Math.sin(t * 3) * 1.5);
      this.gun((col, rx, ry, w, h) => { c.fillStyle = col; c.fillRect(ox + rx * 2, oy + ry * 2, w * 2, h * 2); }, 0, null, false, st.weapon, 0);
    }
    return '120,200,255';
  },

  // cadavre allongé, peint une fois pour toutes sur le sol de la map
  corpse(g, x, y, v) {
    x = Math.round(x); y = Math.round(y);
    const d = v & 1 ? -1 : 1, M = (col, rx, ry, w, h) => { g.fillStyle = col; g.fillRect(x + (d > 0 ? rx : -rx - w), y + ry, w, h); };
    M('#3e0505', -10, -3, 21, 7); M('#560707', -8, -4, 15, 2); M('#560707', 6, 3, 8, 2);
    M('#1c1610', -10, -1, 2, 3); M('#474b41', -8, -1, 5, 3);                         // bottes + jambes
    M('#575e50', -3, -2, 7, 5); M('#6a7262', -3, -2, 7, 1); M('#7a0c0c', -1, 0, 3, 2); // torse ensanglanté
    M('#8b9566', 1, 3, 2, 2); M('#7a0c0c', 2, 4, 1, 1);                               // bras qui dépasse
    M('#6e7852', 4, -1, 4, 3); M('#2a0303', 6, 0, 1, 1);                              // tête
    if (v !== 3) { M('#3c4238', 10, 1, 4, 2); M('#30352c', 9, 3, 6, 1); }               // casque tombé
  }
};
