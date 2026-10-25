// Pixel art dessiné par code (aucune image à charger). Personnage vu de dessus/3-4, style RPG rétro.
const Sprites = {
  human(c, x, y, a, o) {
    x = Math.round(x); y = Math.round(y);
    const cs = Math.cos(a), sn = Math.sin(a), st = o.step ? 1 : 0;
    const F = (col, rx, ry, w, h) => { c.fillStyle = col; c.fillRect(x + rx, y + ry, w, h); };
    F('rgba(0,0,0,.3)', -4, 3, 8, 3);                         // ombre
    F(o.legs, -3, 3, 2, 2 + st); F(o.legs, 1, 3, 2, 3 - st);  // jambes (marche)
    F(o.body, -3, -3, 6, 7);                                   // corps
    F(o.skin, -2, -8, 4, 5);                                   // tête
    F(o.hair, -2, -8, 4, sn < -0.4 ? 5 : 2);                   // cheveux (dos si on regarde vers le haut)
    if (sn > -0.4) {                                           // yeux
      const ox = cs > 0.5 ? 1 : cs < -0.5 ? -1 : 0;
      F(o.eyes, -1 + ox, -6, 1, 1); F(o.eyes, 1 + ox, -6, 1, 1);
    }
    const len = o.gun ? 9 : 6;                                 // arme ou bras tendus
    for (let i = 3; i <= len; i++) F(o.gun ? '#20232b' : o.skin, Math.round(cs * i) - 1, Math.round(sn * i) - 2, 2, 2);
    if (o.flash) F('#ffe066', Math.round(cs * 11) - 2, Math.round(sn * 11) - 3, 4, 4);
  }
};
