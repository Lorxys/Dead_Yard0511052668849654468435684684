// Pixel art dessiné par code (aucune image à charger). Vue 3/4, ambiance 2nde Guerre mondiale.
const rectFn = (c, x, y) => (col, rx, ry, w, h) => { c.fillStyle = col; c.fillRect(x + rx, y + ry, w, h); };

const Sprites = {
  // fusil tenu à l'épaule et orienté selon a (crosse en bois, canon en acier)
  rifle(F, a, skin, flash) {
    const cs = Math.cos(a), sn = Math.sin(a);
    for (let i = 0; i <= 13; i++) {
      const px = Math.round(cs * i), py = Math.round(sn * i) - 3;
      if (i < 7) F(i < 2 ? '#4e2c12' : '#6e4220', px - 1, py - 1, 2, 2);
      else F(i === 13 ? '#0e0e10' : '#2b2b30', px, py, 1, 1);
    }
    F(skin, Math.round(cs * 3) - 1, Math.round(sn * 3) - 4, 2, 2);
    F(skin, Math.round(cs * 8) - 1, Math.round(sn * 8) - 4, 2, 2);
    if (flash) {
      const fx = Math.round(cs * 16), fy = Math.round(sn * 16) - 3;
      F('#ff8a1e', fx - 3, fy, 7, 1); F('#ff8a1e', fx, fy - 3, 1, 7); F('#ffe9a0', fx - 1, fy - 1, 3, 3);
    }
  },

  // GI américain : veste M1941, casque M1, fusil
  soldier(c, x, y, a, o) {
    x = Math.round(x); y = Math.round(y);
    const F = rectFn(c, x, y), cs = Math.cos(a), sn = Math.sin(a), back = sn < -0.35, skin = '#d9a478', l = o.step ? 1 : 0;
    F('rgba(0,0,0,.45)', -5, 6, 10, 2);
    F('#3d3b22', -3, 1, 3, 4 - l); F('#24180c', -3, 5 - l, 3, 2);   // jambes + bottes (une levée en marchant)
    F('#4a482a', 0, 1, 3, 3 + l); F('#24180c', 0, 4 + l, 3, 2);
    if (sn < 0) this.rifle(F, a, skin, o.flash);
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
    if (sn >= 0) this.rifle(F, a, skin, o.flash);
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
