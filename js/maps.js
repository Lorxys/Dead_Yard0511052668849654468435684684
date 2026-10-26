// Maps jouables : plan en texte (un caractère = une case de 16 px) + peinture du sol et des décors.
// Légende des plans :
//   .  boue   :  pavés / route   ,  herbe morte                                 (sol, on y marche)
//   #  mur (sacs de sable ou ruines selon la map)   S sacs de sable   C caisse   X hérisson tchèque
//   W  barbelés   T arbre mort   t tombe   R gravats   O fontaine (2x2 cases)
//   h r s f  machines à atout (Blindage, Second Souffle, Pied Léger, Double Détente) : mur au-dessus, sol libre en dessous
//   UU forge d'amélioration (on s'en sert par le haut)
//   BB emplacement de la boîte mystère : avec plusieurs emplacements, la boîte est sur un seul à la fois (au départ le plus
//      proche du joueur) et déménage quand elle sort la tête de mort ; les emplacements vides restent des palettes
//   P  apparition du joueur (au coin haut-gauche de la case)
//   1-9 portes achetables : les cases d'un même chiffre forment une porte, qui sépare deux zones
// zones : [nom, case de départ] ; la zone de départ du joueur est ouverte dès le début, les autres s'ouvrent avec les portes.
// vehicles : carcasses posées sur le plan (taille dans Decor.SIZE), fire = elles brûlent encore.
const MAPS = {
  noman: {
    name: "No Man's Land", info: 'Nuit · boue · tranchées', wall: 'sandbags', seed: 7,
    rows: [
      '########################',
      '#....h...r....s...f....#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#.....CC........S......#',
      '#...............S......#',
      '#......................#',
      '#........X....X........#',
      '#......................#',
      '#.BB...................#',
      '#...........P..........#',
      '#......................#',
      '#........X....X........#',
      '#......................#',
      '#.....S.........CC.....#',
      '#.....S................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#..........UU..........#',
      '########################'
    ],
    // boue, herbe morte, cratères d'obus, débris
    ground(g, P, rnd, m) {
      const W = m.W * CFG.TILE, H = m.H * CFG.TILE, MUD = ['#2b241b', '#30281e', '#352c21', '#271f17', '#3b3124'];
      P('#2f271d', 0, 0, W, H);
      for (let i = 0; i < W * H / 9; i++) P(MUD[rnd() * 5 | 0], rnd() * W, rnd() * H, rnd() < 0.3 ? 2 : 1, 1);
      for (let i = 0; i < 90; i++) {
        const x = rnd() * W, y = rnd() * H;
        P('#4f4a2a', x, y, 1, 2); P('#5e5832', x + 1, y - 1, 1, 3); P('#45401f', x + 2, y, 1, 2);
      }
      for (let i = 0; i < 8; i++) crater(P, 24 + rnd() * (W - 48), 24 + rnd() * (H - 48), 6 + rnd() * 10);
      for (let i = 0; i < 45; i++) debris(P, rnd() * W, rnd() * H, rnd);
    }
  },

  // Normandie, 1944 : village en ruines après le passage du front. La Place (départ) est reliée par des portes
  // à La Ferme (ouest), La Nationale et son convoi détruit (nord) et Le Cimetière avec l'église (est, forge).
  village: {
    name: 'Le Chemin des Damnés', info: 'Village en ruines · 4 zones', wall: 'stone', seed: 13,
    zones: [['La Place', [30, 38]], ['La Ferme', [10, 30]], ['La Nationale', [30, 8]], ['Le Cimetière', [48, 24]]],
    vehicles: [
      { type: 'tiger', x: 20, y: 5, fire: true }, { type: 'sherman', x: 38, y: 9, fire: true }, { type: 'truck', x: 4, y: 5, fire: true },
      { type: 'truck', x: 50, y: 10 }, { type: 'halftrack', x: 27, y: 12 }, { type: 'jeep', x: 44, y: 4 }, { type: 'pak', x: 32, y: 3 },
      { type: 'car', x: 4, y: 31 }, { type: 'car', x: 33, y: 34, fire: true }, { type: 'jeep', x: 23, y: 37 }, { type: 'halftrack', x: 43, y: 37, fire: true },
      { type: 'car', x: 13, y: 44 }, { type: 'car', x: 8, y: 10 }
    ],
    rows: [
      '############################################################',
      '#...........s.................................f............#',
      '#..T..............CC......X....SSSS......................T.#',
      '#..............................S..S.....BB..........C......#',
      '#:::::::::::::::...........................................#',
      '#:::::::::::::::......................................X....#',
      '#:::::::::::::::::::::::::::::::::::.......................#',
      '#:::::::::::::::::::::::::::::::::::.......................#',
      '#::::::::::::::::::::::::::::::::::::::::::::::::::::::::::#',
      '#...............:::::::::::::::::::::::::::::::::::::::::::#',
      '#...............:::::::::::::::::::::::::::::::::::::::::::#',
      '#........X..................:::.....:::::::::::::::::::::::#',
      '#..............X............:::.....:::::::::::::::::::::::#',
      '#.WWWW................WWWW..:::............................#',
      '#T...........R..............:::.....RR..T...X.........WWWW.#',
      '#...........................:::............................#',
      '#######444##################111##################555########',
      '#.................#.........:::..........#,,,,,,,,,,,,,,,,,#',
      '#.................#.##RR##..:::...######.#,T,,,,,,,,,,,,,,T#',
      '#..#R###R##.......#.######..:::...######.#,,,,,,,,,,,,,,,,,#',
      '#..#..r...#..T....#.######..:::...######.#,,t,,t,,t,,t,,t,,#',
      '#..#......#.......#.R....R..:::...R....R.#,,,,,,,,,,,,,,,,,#',
      '#..#.C....#.......#...h.....:::..........#,,,,,,,,,,,,,,,,,#',
      '#..#....C.........#...::::::::::::::::...#,,t,,t,,,,,t,,t,,#',
      '#..#......R....T..#...::::::::::::::::...#,,,,,,,,,,,,,,,,,#',
      '#..####R.##.......#...::::::::::::::::...#,,,,,,,,,,,,,,,,,#',
      '#.................#...:::::::::::::BB:...#,,t,,t,,t,,t,,t,,#',
      '#,,,,,,,,,,,,,,,,,#...::::SS::::::::::...#,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,T,,,,,#...::::::::::::::::C..#,,,,,,,,,,,,,,,,,#',
      '#,T,,,,,,,,,,,,,,,#...::::::::::::::::C..#,,t,,t,,,,,t,,t,,#',
      '#,,,,,,,,,,,,,,,,,2...::::::::::::::::...3.................#',
      '#,,,,,,,,,,,,,,,,,2...:::::::OO:::::::...3:::::::::::......#',
      '#,,,,,,,,,,,,,,,,,2...:::::::OO:::::::...3:::::::::::......#',
      '#,,,,,,,,,,BB,,T,,#.X.::::::::::::::::...#:::::::::::......#',
      '#,,,,,,,,,CC,,,,,,#...::::::::::::::::...#....#R##...##R#..#',
      '#,,,,,,,,,,C,,,,,,#...::::::::::::::::...#....#...:::...#..#',
      '#,,,T,,,,,,,,,,,,,#...::::::::P:::::::...#....#...:::...#..#',
      '#,,,,,,,,,,,,,,,,,#...::::::::::::::::...#....#.........#..#',
      '#,,,,,,,,,,,,T,,,,#...::::::::::::::::...#....#.C.......R..#',
      '#,,,,,,,,,,,,,,,,,#...::::::::::::::::...#....#.........#..#',
      '#,,,,,,,,,,,,,,,,,#...::::::::::::::::...#....R.....BB..#..#',
      '#,,,,,,,T,,,,,,,,,#......................#....#.......C.#..#',
      '#,,,,,,,,,,,,,,,,,#.#RRRR..........R####.#....#.........#..#',
      '#,,,,,,,,,,,,,,T,,#.#####..........#####.#....#.C.......#..#',
      '#,WWWW,,,,,,,,,,,,#.#####..........#####.#WWW.#.........#..#',
      '#,,,,,,,,,,,,,,,,,#.#####..........#####.#....#.........#..#',
      '#,,,,,,,,,,,,,,,,,#......................#....#...UU....#..#',
      '############################################################'
    ],
    // pavés, herbe morte, boue ; cratères, ornières, traces de brûlé sous les carcasses, sang et cadavres partout
    ground(g, P, rnd, m) {
      const T = CFG.TILE, MUD = ['#2b241b', '#30281e', '#352c21', '#271f17', '#3b3124'];
      const STO = ['#3a3734', '#423e3a', '#34312e', '#4a4540'], GRASS = ['#2e3020', '#383a26', '#25261a', '#43402a'];
      for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) {
        const k = m.ground[y][x], px = x * T, py = y * T;
        if (k === ':') {
          P('#1c1a17', px, py, T, T);
          for (let r = 0; r < 4; r++) for (let b = r % 2 ? -2 : 0; b < T; b += 4) {
            if (rnd() < 0.07) { P(MUD[rnd() * 5 | 0], px + b, py + r * 4, 3, 3); continue; }   // pavé arraché
            P(STO[rnd() * 4 | 0], px + b, py + r * 4, 3, 3); P('#55504a', px + b, py + r * 4, 3, 1);
          }
        } else if (k === ',') {
          P('#1e1f15', px, py, T, T);
          for (let i = 0; i < 18; i++) P(GRASS[rnd() * 4 | 0], px + rnd() * T, py + rnd() * T, 1, 1 + (rnd() * 2 | 0));
        } else {
          P('#2b241b', px, py, T, T);
          for (let i = 0; i < 28; i++) P(MUD[rnd() * 5 | 0], px + rnd() * T, py + rnd() * T, rnd() < 0.3 ? 2 : 1, 1);
        }
      }
      // ornières sur la nationale (la route descend d'une case à chaque tronçon : rangées 6, 8 puis 10 au centre)
      for (let x = 16; x < (m.W - 1) * T; x++) {
        const cy = ((x < 16 * T ? 6 : x < 36 * T ? 8 : 10) + 0.5) * T;
        for (const y of [cy - 11, cy - 7, cy + 7, cy + 11]) if (rnd() < 0.75) P('#15130f', x, y, 1, 2);
      }
      const free = () => { for (;;) { const x = 1 + rnd() * (m.W - 2), y = 1 + rnd() * (m.H - 2); if (m.grid[y | 0][x | 0] === 0) return [x * T, y * T]; } };
      for (let i = 0; i < 16; i++) { const [x, y] = free(); crater(P, x, y, 6 + rnd() * 9); }
      // brûlé sous les carcasses
      (this.vehicles || []).forEach(v => { const [w, h] = Decor.SIZE[v.type]; scorchPatch(P, (v.x + w / 2) * T, (v.y + h / 2) * T, Math.max(w, h) * 10, rnd); });
      // traînées de sang (corps qu'on a tirés), mares, cadavres, membres arrachés, débris
      for (let i = 0; i < 18; i++) {
        let [x, y] = free(); const a = rnd() * 6.28, len = 20 + rnd() * 50;
        for (let d = 0; d < len; d++) { x += Math.cos(a); y += Math.sin(a) + (rnd() - 0.5) * 0.6; P(BLOOD[rnd() * 3 | 0], x, y, 2, 2); if (rnd() < 0.3) P('#3a0404', x + 2, y, 1, 1); }
        Decor.body(P, x, y, rnd, rnd() < 0.3);
      }
      for (let i = 0; i < 40; i++) { const [x, y] = free(); Decor.gore(P, x, y, 4 + rnd() * 8, rnd); }
      for (let i = 0; i < 28; i++) { const [x, y] = free(); Sprites.corpse(g, x, y, rnd() * 4 | 0); Decor.gore(P, x, y + 3, 7, rnd); }
      for (let i = 0; i < 20; i++) { const [x, y] = free(); P('#8b6a50', x, y, 4, 2); P('#6a0808', x + 4, y, 2, 2); P('#c9bf9f', x - 1, y, 1, 2); }
      for (let i = 0; i < 160; i++) { const [x, y] = free(); debris(P, x, y, rnd); }
    }
  }
};

// cratère d'obus (les plus gros sont remplis d'eau croupie)
function crater(P, cx, cy, r) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y * 1.3) / r;
    if (d < 1) P(d > 0.8 ? (y < 0 ? '#1f1912' : '#40362a') : d > 0.55 ? '#1d1711' : '#16110c', cx + x, cy + y);
  }
  if (r > 11) { P('#141a1e', cx - r * 0.4, cy - 1, r * 0.8, 3); P('#141a1e', cx - r * 0.25, cy - 2, r * 0.5, 5); P('#2c363c', cx - 2, cy - 1, 3, 1); }
}
// os, casque, douille ou vieille tache de sang
function debris(P, x, y, rnd) {
  const k = rnd();
  if (k < 0.2) { P('#c9bf9f', x, y, 4, 1); P('#c9bf9f', x - 1, y - 1, 1, 1); P('#c9bf9f', x + 4, y + 1, 1, 1); }
  else if (k < 0.32) { P('#30352c', x - 1, y + 2, 6, 1); P('#3c4238', x, y, 4, 2); P('#50584a', x + 1, y, 2, 1); }
  else if (k < 0.55) P('#8a6c2c', x, y, 2, 1);
  else for (let j = 0; j < 14; j++) P(rnd() < 0.5 ? '#2e0505' : '#3a0606', x + (rnd() - 0.5) * 10, y + (rnd() - 0.5) * 6, rnd() < 0.4 ? 2 : 1, 1);
}
// sol noirci autour d'une carcasse qui a brûlé
function scorchPatch(P, cx, cy, r, rnd) {
  for (let i = 0; i < r * r * 1.5; i++) {
    const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r;
    P(d < r * 0.6 ? '#0e0b09' : rnd() < 0.5 ? '#16110d' : '#1e1712', cx + Math.cos(a) * d * 1.3, cy + Math.sin(a) * d, 2, 1);
  }
}
