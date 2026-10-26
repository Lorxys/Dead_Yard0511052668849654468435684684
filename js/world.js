// Carte du monde : choix du front. Vieille carte d'état-major tachée de sang, dessinée par code (contours en longitude/latitude).
// On touche un pays (ou son étiquette) : la carte zoome dessus et le panneau de droite liste ses maps jouables.

// terres émergées, tracés simplifiés [lon, lat]
const LAND = [
  // Amérique du Nord
  [[-168,66],[-162,70],[-156,71.5],[-141,70],[-128,70],[-115,68],[-95,72],[-82,69],[-85,64],[-94,59],[-92,57],[-82,55],[-79,52],[-77,60],[-70,61],[-64,60],[-61,56],[-56,52],[-60,47],[-65,45],[-70,43],[-71,41],[-74,40],[-76,35],[-81,31],[-80,26],[-82,26],[-84,30],[-90,30],[-97,28],[-97,22],[-92,19],[-87,21],[-88,16],[-84,15],[-83,10],[-79,9],[-77,8],[-80,7],[-85,10],[-92,14],[-96,16],[-105,20],[-106,23],[-108,25],[-110,27],[-112,29.5],[-114.5,31.5],[-113.5,30],[-112,27.5],[-110.5,24.5],[-110,23],[-111,24.5],[-112.5,26],[-114.5,28],[-116,31],[-117,32.5],[-120,34],[-123,38],[-124,42],[-124,48],[-128,51],[-134,57],[-140,60],[-147,61],[-152,59],[-158,57],[-164,55],[-158,58],[-162,60],[-165,62]],
  [[-73,78],[-60,82],[-30,83.5],[-20,81],[-18,76],[-22,70],[-32,68],[-42,61],[-48,61],[-53,66],[-55,71],[-60,76],[-68,77]],   // Groenland
  [[-80,73],[-72,71],[-62,67],[-65,63],[-72,63],[-78,65],[-90,70]],
  [[-90,77],[-80,83],[-62,82],[-75,78]],
  [[-118,71],[-105,73],[-100,70],[-108,68],[-117,69]],
  [[-85,22],[-80,23.2],[-74,20],[-77,19.8],[-82,21.5]],
  [[-74.5,19.8],[-68.5,18.5],[-71,17.6],[-74.5,18.3]],
  // Amérique du Sud
  [[-77,8],[-72,12],[-63,10.5],[-60,8],[-52,5],[-50,0],[-44,-2],[-35,-5],[-35,-9],[-39,-14],[-39,-18],[-41,-22],[-48,-26],[-49,-29],[-53,-34],[-58,-35],[-57,-38],[-62,-39],[-65,-41],[-64,-43],[-67,-46],[-66,-48],[-69,-51],[-68,-55],[-72,-54],[-75,-50],[-73,-44],[-73,-38],[-71,-30],[-70,-20],[-75,-15],[-81,-6],[-80,-2],[-78,2]],
  // Eurasie (de la péninsule Ibérique, par le nord, jusqu'en Méditerranée)
  [[-9,43],[-8,44],[-2,43.4],[-1.5,46],[-4.5,48],[-1.5,48.7],[1.5,50],[2.5,51.1],[4,51.5],[5,53],[8.5,53.6],[8.6,55],[8,57],[10.5,57.7],[10.6,56],[10,54.5],[11,54],[14,54],[18,54.8],[19.6,54.4],[21,55.5],[21.5,57.3],[24,58.3],[23.5,59.3],[28,59.6],[30,60],[26,60.4],[22,60.3],[21.5,61.5],[21.5,63],[25,65],[25.5,65.8],[23,66],[21,64.5],[19,63.3],[17.5,62],[17,61],[18.5,60],[19,59.5],[16.5,57.5],[16,56.2],[14.2,55.4],[12.8,55.6],[12.5,56.5],[11.5,58.5],[10.5,59.3],[8,58],[6,58.2],[5,59.3],[5,61.5],[7,63],[10,64],[13,66.5],[15,68.5],[18,70],[23,71],[28,71],[31,70],[33,69.3],[41,67.8],[44,66.2],[44,68.5],[53,68.5],[59,69],[68,68.5],[72,72.5],[80,73],[87,75],[100,77],[105,77.7],[113,73.5],[130,71],[140,72.5],[150,71],[160,70],[170,69.8],[180,69],[180,65],[178,64],[173,61],[163,60],[162,57.5],[156.5,51],[155.5,56],[156,57.8],[160,61],[155,59.3],[143,59.3],[137,54],[141,52.5],[140.5,48],[135,43.3],[132,43],[129.5,41],[129.5,36],[126.5,34.5],[126.5,37.5],[124.5,40],[121.5,39],[121.5,40.8],[118,39],[119,37],[122.5,37],[120,34.5],[122,31],[122,29],[119.5,25.5],[117,23.5],[113,22.2],[110,21],[108,21.5],[106,20],[108.5,15],[109,11.5],[105,8.6],[104.8,10.4],[103,11],[100,13.5],[99,10],[100.5,7],[103.5,1.3],[101,2.8],[98,8],[98.5,13],[97.5,16.5],[94.5,16],[94,19],[92,21.5],[90,22],[87,21.5],[86,20],[80.2,15.5],[80,10],[77.5,8],[76,10],[74.5,14],[73,19],[72.8,21],[70,20.8],[68.5,23.5],[66.5,25.4],[61.5,25.2],[57.3,25.8],[56.4,27.1],[54,26.7],[51.5,27.9],[50,30],[48,29.9],[50,26],[51.5,24.3],[54,24],[56,26],[56.4,24.8],[59.8,22.5],[57.8,19],[55,17],[52,16],[45,13],[43.5,12.7],[42.5,15.5],[39,21.5],[35,28],[34.9,29.5],[34.3,28],[32.6,29.9],[32.3,31.3],[34.5,31.6],[35,33],[36,35.5],[36,36.8],[34,36.3],[32,36.3],[30,36.2],[28,36.7],[27,37.7],[26.3,39.5],[26,40.8],[24,40.7],[23.5,40],[22.6,40.4],[24,38],[23,36.5],[21.7,36.8],[21,38.5],[19.4,40.4],[19.5,42],[16,43.5],[13.7,45.6],[12.3,45.4],[12.5,44],[14,42.5],[16,41.4],[18.5,40.2],[17,39],[16.6,38],[15.7,38],[15.8,40],[14,40.8],[12,41.9],[10.5,43],[8.8,44.4],[7,43.6],[5,43.3],[3.2,43],[3,42],[0.8,41],[-0.3,39.5],[0,38.7],[-0.8,37.6],[-2,36.7],[-5.6,36],[-6.5,36.9],[-7.5,37.2],[-8.9,37],[-8.8,38.7],[-9.5,39.3],[-8.7,41]],
  // Afrique
  [[-5.9,35.8],[-2,35.1],[1,36.5],[4,36.9],[8.6,36.9],[10,37.3],[11,36.8],[10.2,35],[11,34],[10.5,33.5],[12,32.8],[15.2,32.3],[19,30.3],[20,31],[20,32.2],[23,32.6],[25,31.7],[29,30.9],[32.3,31.3],[32.6,29.9],[33.5,27.5],[35.5,24],[37.2,21],[38.5,18],[40,15.5],[43.3,12.5],[44,10.4],[51,11.8],[51,10.5],[49.5,6.5],[47.5,4],[44,0],[41,-2],[39.5,-5],[39,-8],[40.5,-11],[40.5,-15],[37,-17.5],[35,-21],[35.5,-24],[33,-25.8],[32.8,-28.5],[30,-31.3],[27,-33.7],[22.5,-34],[20,-34.8],[18.4,-34],[17.8,-31],[15,-27],[14.5,-23],[11.8,-17.5],[12.3,-13],[13.5,-11],[12,-6],[12.3,-4.5],[9,-1],[9.5,3],[8.5,4.5],[6,4.3],[4.5,6.3],[2,6.3],[-1,5],[-4,5.2],[-7.5,4.4],[-11,6.8],[-13,8.5],[-15,11],[-16.7,12.5],[-17.5,14.7],[-16.5,19.5],[-17,21],[-15.5,24.5],[-13,27.6],[-10,29.5],[-9.7,31.5],[-8.5,33.3],[-6.5,34]],
  [[49.3,-12],[50.5,-15.5],[49.5,-17.5],[47,-25],[45,-25.5],[43.5,-22],[44,-17],[46.5,-15.5]],   // Madagascar
  // îles d'Europe
  [[-5.7,50],[1.4,51.2],[1.7,52.7],[0.3,53.4],[-0.2,54.2],[-1.5,55.5],[-2,56],[-1.8,57.5],[-3.8,57.6],[-3,58.6],[-5,58.6],[-6.2,57.5],[-5.6,56.3],[-5,55],[-3,54.8],[-3.2,54],[-3,53.3],[-4.5,53.3],[-4.2,52.3],[-5.2,51.7],[-3.3,51.4],[-5,51]],
  [[-6,52.2],[-6,54],[-7,55.3],[-8.5,55],[-10,54],[-10,51.6],[-8,51.5]],
  [[-24,65.5],[-22,66.4],[-16,66.5],[-13.5,65.2],[-15,64.3],[-18.5,63.4],[-22.6,63.8]],
  [[9.4,43],[9.5,41.5],[8.6,41.5],[8.6,42.6]],
  [[9.7,41.2],[9.8,39],[8.4,38.9],[8.2,40.9]],
  [[12.4,38.1],[15.6,38.3],[15.1,36.7],[12.4,37.6]],
  [[52,71.5],[56,73.5],[60,76],[68,76.8],[62,75],[56,71]],
  // Asie et Océanie
  [[130.9,34],[132.5,35.4],[136,35.7],[137.5,36.9],[140,38],[140,41.2],[141.5,41.4],[142,39],[141,36.5],[140.8,35.4],[139.7,34.9],[137,34.5],[135,33.5],[133,34.3]],
  [[129.6,33.3],[131.5,34],[132,32.5],[131,31],[130.2,31.3]],
  [[140,41.5],[140.3,43.3],[141.8,45.4],[145.5,43.4],[143.3,42],[141,41.8]],
  [[142,46],[143.5,46.8],[143,49],[144.3,49],[142.8,54.3],[142.2,51]],
  [[120.2,23],[121,25.2],[121.9,24.6],[120.8,22]],
  [[120,16],[120.6,18.5],[122.3,18.4],[122,16],[124,13],[121,13.7]],
  [[122,7],[123.5,8.6],[126.5,9],[126,6.3],[125,5.6],[123.5,7.5]],
  [[80,9.8],[81.9,7.5],[81.2,6.2],[80,6.1]],
  [[95.3,5.6],[97.5,5.2],[100.4,2.2],[104.5,-1.8],[106,-3.2],[106,-5.9],[104.5,-5.9],[101,-2.5],[98.5,1.8]],
  [[105.2,-6.8],[106,-6],[108.5,-6.4],[111,-6.4],[112.7,-7],[114.5,-7.8],[114.5,-8.7],[111,-8.2],[108,-7.8],[105.5,-6.9]],
  [[109,1.5],[110,1.7],[111,2],[113,3.2],[115.5,5.5],[117,7],[119,5.2],[118,4.3],[117.6,1],[119,0.8],[116.2,-3.9],[114.5,-4],[111.5,-3],[110.2,-1.7],[109,-0.5]],
  [[119.5,-5.5],[119.4,-3.5],[118.8,-2.7],[120,0.5],[121,1.3],[124.5,1.4],[121.5,0.5],[120.5,-1],[121.5,-1.9],[122.8,-4.5],[121,-2.7],[120.4,-5.5]],
  [[131,-1.3],[134,-0.8],[138,-1.6],[141,-2.6],[145.8,-5],[147.5,-6.2],[150.5,-10.3],[147,-10.1],[144,-7.7],[141,-9.1],[138,-8.3],[138.5,-6.8],[135,-4.3],[132,-2.8]],
  [[114,-22],[113.6,-26],[115,-30],[115,-34.3],[118,-35],[123,-33.9],[126,-32.3],[131,-31.5],[134,-32.5],[136,-35],[138,-34.5],[138.5,-35.6],[140,-37.5],[144,-38.4],[146.5,-39],[150,-37.5],[151,-34],[153,-31],[153.5,-28],[153,-25],[150.8,-22.5],[149,-20.5],[146,-18],[145.4,-15],[143.5,-14],[142.5,-10.7],[141.6,-12.8],[141.5,-17],[140,-17.7],[137,-16],[136,-12],[132.5,-11.5],[130,-13],[129.5,-15],[127,-14],[125,-15],[123,-17],[121,-19.5],[117,-20.7]],
  [[144.7,-40.7],[148.3,-40.9],[148,-43.2],[146,-43.6]],
  [[172.7,-34.4],[174.5,-36.5],[178.5,-37.7],[177,-39.2],[175,-41.4],[174,-39.8]],
  [[172.7,-40.5],[174.3,-41.3],[173,-43.8],[171,-44.8],[169,-46.6],[166.5,-46],[168,-44],[171,-42]]
];
// mers fermées, repeintes par-dessus les terres
const SEAS = [
  [[28,41.3],[29,41.2],[31.5,41.2],[35,42],[38,41],[41.5,41.5],[41.5,42.5],[40,43.5],[38,44.5],[36.5,45.3],[35,45],[33.5,44.5],[32.5,45.5],[30.5,46.5],[29.5,45],[28.6,44],[28,42.5]],   // mer Noire
  [[47,45.5],[49,46.6],[51.5,47],[53,45.5],[51,44.5],[51,43],[52.7,42],[53,40],[54,38],[53.5,36.8],[51,36.7],[49,37.5],[49.5,40.2],[48,42],[47.5,43],[47,44.5]]                     // mer Caspienne
];

// fronts jouables (les îles viennent de LAND par leur numéro : 11 Grande-Bretagne, 14 Corse, 15 Sardaigne, 16 Sicile, 18-20 Japon) : contour du pays, épingle (lieu de la bataille), décalage de l'étiquette (px écran) et maps proposées
const FRONTS = [
  { id: 'uk', name: 'Royaume-Uni', sub: 'Londres · 1940', pin: [-0.1, 51.5], tag: [-80, -38], maps: ['noman'],
    shapes: [LAND[11]] },
  { id: 'fr', name: 'France', sub: 'Normandie · 1944', pin: [-0.6, 49.2], tag: [-92, 22], maps: ['noman'],
    shapes: [[[2.5,51.1],[4.2,49.9],[4.8,50.1],[5.8,49.5],[6.4,49.4],[8.2,49],[7.6,48.3],[7.6,47.6],[7,47.4],[6,46.4],[6.8,46],[7,45],[7,44.2],[7.5,43.8],[6,43.1],[4.5,43.4],[3.2,43],[3,42.4],[1.5,42.5],[0,42.7],[-1.8,43.4],[-1.3,44.5],[-1.2,46],[-2.2,47],[-4.7,48],[-4.6,48.6],[-3,48.8],[-1.6,48.6],[-1.9,49.7],[-1,49.4],[0.2,49.5],[1.5,50.2],[1.6,50.9]], LAND[14]] },
  { id: 'de', name: 'Allemagne', sub: 'Berlin · 1945', pin: [13.4, 52.5], tag: [-6, -48], maps: ['noman'],
    shapes: [[[7.2,53.2],[8.5,53.6],[8.6,54.9],[9.8,54.8],[11,54],[12.5,54.4],[14.2,53.9],[14.4,53.3],[14.6,52.6],[14.7,51.4],[15,51],[14.3,50.9],[12.5,50.3],[12.3,50.2],[13.6,49],[13.8,48.6],[13,47.5],[12.2,47.7],[10.5,47.5],[9.6,47.5],[8.5,47.6],[7.6,47.6],[7.6,48.3],[8.2,49],[6.4,49.4],[6.1,50.1],[6,50.8],[5.9,51.1],[6.2,51.8],[6.9,52.2],[7,53.3]]] },
  { id: 'pl', name: 'Pologne', sub: 'Varsovie · 1944', pin: [21, 52.2], tag: [62, -40], maps: ['noman'],
    shapes: [[[14.2,53.9],[16,54.3],[18.5,54.8],[19.6,54.4],[22.8,54.4],[23.5,53.9],[23.9,52.7],[23.2,52.3],[24.1,50.9],[24,50.4],[22.6,49.1],[21,49.4],[19.5,49.5],[18.8,49.5],[18,50],[16.5,50.4],[15,51],[14.7,51.4],[14.6,52.6],[14.4,53.3]]] },
  { id: 'su', name: 'URSS', sub: 'Stalingrad · 1942', pin: [44.5, 48.7], tag: [74, -8], maps: ['noman'],
    shapes: [[[30,60.2],[29.5,61.5],[30.5,63],[29.6,64.5],[30,66],[29,68.5],[31,70],[33,69.3],[41,67.8],[44,66.2],[44,68.5],[53,68.5],[60,69],[60,50],[55,51],[50,51.3],[47.5,50.4],[47,49],[46.8,48.4],[47,45.5],[47,44.5],[47.5,43],[48,42],[49.5,40.2],[48,38.4],[46,38.9],[44,39.6],[43.5,41.1],[41.5,41.5],[41.5,42.5],[40,43.5],[38,44.5],[36.5,45.3],[35,45],[33.5,44.5],[32.5,45.5],[30.5,46.5],[29.5,45.4],[28.2,45.5],[26.6,48.3],[24,48],[22.6,49.1],[24,50.4],[24.1,50.9],[23.2,52.3],[23.9,52.7],[23.5,53.9],[22.8,54.4],[21,55.5],[21.5,57.3],[24,58.3],[23.5,59.3],[28,59.6]]] },
  { id: 'it', name: 'Italie', sub: 'Monte Cassino · 1944', pin: [13.8, 41.5], tag: [-58, 40], maps: ['noman'],
    shapes: [[[7.5,43.8],[7,44.2],[7,45],[6.8,46],[7.9,45.9],[8.5,46.4],[9.3,46.5],[10.4,46.9],[12.2,47.1],[13.7,46.5],[13.7,45.6],[12.3,45.4],[12.5,44],[14,42.5],[16,41.4],[18.5,40.2],[17,39],[16.6,38],[15.7,38],[15.8,40],[14,40.8],[12,41.9],[10.5,43],[8.8,44.4]], LAND[15], LAND[16]] },
  { id: 'eg', name: 'Égypte', sub: 'El Alamein · 1942', pin: [28.9, 30.8], tag: [24, 46], maps: ['noman'],
    shapes: [[[25,31.6],[29,30.9],[32.3,31.3],[34.2,31.3],[34.9,29.5],[34.3,28],[32.6,29.9],[33.5,27.5],[35.5,24],[36.9,22],[25,22]]] },
  { id: 'jp', name: 'Japon', sub: 'Tokyo · 1945', pin: [139.7, 35.7], tag: [-10, -42], maps: ['noman'],
    shapes: [LAND[18], LAND[19], LAND[20]] }
];

// maps jouables (pour l'instant une seule, proposée sur tous les fronts)
const MAPS = {
  noman: { name: "No Man's Land", info: 'Nuit · boue · tranchées' }
};

const WorldScene = {
  VIEW: { lon: [-170, 180], lat: [80, -56] },   // partie du monde affichée en vue d'ensemble
  sel: null, prev: null, from: null, to: null, t: 1,

  // éléments de l'interface (étiquettes des fronts, panneau du pays choisi) ; onPlay(front, mapId) lance la partie
  init(onPlay, onBack) {
    this.el = document.getElementById('world'); this.pins = document.getElementById('pins');
    this.panel = { sub: document.getElementById('fSub'), name: document.getElementById('fName'), maps: document.getElementById('fMaps') };
    this.onPlay = onPlay;
    this.tags = FRONTS.map(f => {
      const b = document.createElement('button'); b.textContent = f.name;
      b.onclick = () => this.select(f);
      this.pins.appendChild(b); return b;
    });
    document.getElementById('wBack').onclick = onBack;
    document.getElementById('fBack').onclick = () => this.unselect();
    // toucher directement un pays sur la carte
    this.el.addEventListener('click', e => {
      if (e.target !== this.el || this.sel) return;
      const p = this.unproject(e.clientX, e.clientY), f = FRONTS.find(f => f.shapes.some(s => inPoly(s, p[0], p[1])));
      if (f) this.select(f);
    });
  },
  // taches de sang sur la carte (en coordonnées du monde : elles suivent le zoom)
  build(W, H) {
    this.W = W; this.H = H;
    let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    this.stains = Array.from({ length: 9 }, () => {
      const lon = -160 + rnd() * 330, lat = -50 + rnd() * 120, r = 2 + rnd() * 6;
      return { lon, lat, r, drops: Array.from({ length: 26 }, () => { const a = rnd() * 6.28, d = rnd() ** 1.4 * r * 1.8; return [Math.cos(a) * d, Math.sin(a) * d * 0.8, 0.2 + rnd() * 0.5, BLOOD[rnd() * 3 | 0]]; }) };
    });
    // trame de papier jauni (terres) et hachures de la mer, en motifs répétés
    const pat = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn((col, x, y, a = 1, b = 1) => { g.fillStyle = col; g.fillRect(x, y, a, b); }); return g.createPattern(c, 'repeat'); };
    this.landPat = pat(8, 8, P => {
      P('#5a4a32', 0, 0, 8, 8);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const d = dither(x * 3 + y, y * 5 + x); if (d < 0.18) P('#4c3e2a', x, y); else if (d > 0.88) P('#66553a', x, y); }
    });
    this.seaPat = pat(12, 6, P => { P('#0f0c0b', 0, 0, 12, 6); P('#17110f', 0, 2, 5, 1); P('#17110f', 6, 5, 4, 1); });
    // vue d'ensemble sous le titre et au-dessus de l'indication du bas, pour que les textes ne cachent pas la carte
    this.base = this.fit(this.VIEW.lon, this.VIEW.lat, 0, H * 0.14, W, H * 0.77, 4);
    this.cam = this.sel ? this.countryCam(this.sel) : { ...this.base }; this.t = 1;
  },
  // caméra qui fait tenir une zone [lon0,lon1]x[lat0,lat1] dans le rectangle (x,y,w,h) de l'écran
  fit(lon, lat, x, y, w, h, pad) {
    const s = Math.min((w - pad * 2) / Math.abs(lon[1] - lon[0]), (h - pad * 2) / Math.abs(lat[1] - lat[0]) / 1.25);
    return { lon: (lon[0] + lon[1]) / 2, lat: (lat[0] + lat[1]) / 2, s, x: x + w / 2, y: y + h / 2 };
  },
  // vue d'un pays : il occupe la partie gauche de l'écran, le panneau des maps est à droite
  countryCam(f) {
    const pts = f.shapes.flat(), lon = pts.map(p => p[0]), lat = pts.map(p => p[1]);
    const box = this.fit([Math.min(...lon), Math.max(...lon)], [Math.max(...lat), Math.min(...lat)], 0, this.H * 0.08, this.W * 0.56, this.H * 0.84, 14);
    box.s = Math.min(box.s, this.base.s * 14);
    return box;
  },
  // projection équirectangulaire (latitudes un peu étirées pour garder des formes lisibles)
  proj(lon, lat, cam = this.cam) { return [cam.x + (lon - cam.lon) * cam.s, cam.y - (lat - cam.lat) * cam.s * 1.25]; },
  // point de l'écran (px CSS) -> [lon, lat]
  unproject(cx, cy) {
    const r = Game.cv.getBoundingClientRect(), k = this.W / r.width, x = (cx - r.left) * k, y = (cy - r.top) * k, c = this.cam;
    return [c.lon + (x - c.x) / c.s, c.lat - (y - c.y) / (c.s * 1.25)];
  },
  show() {
    this.sel = null; this.cam = { ...this.base }; this.t = 1;
    this.el.classList.add('show'); this.el.classList.remove('zoom');
  },
  hide() { this.el.classList.remove('show', 'zoom'); },
  go(to) { this.from = { ...this.cam }; this.to = to; this.t = 0; },
  select(f) {
    if (this.sel) return;
    this.sel = f; this.go(this.countryCam(f));
    this.panel.sub.textContent = f.sub;
    this.panel.name.firstChild.textContent = f.name;
    this.panel.maps.textContent = '';
    f.maps.forEach(id => {
      const m = MAPS[id], card = document.createElement('div'); card.className = 'mapcard';
      card.appendChild(this.thumb());
      const txt = document.createElement('div'); txt.innerHTML = `<b>${m.name}</b><small>${m.info}</small>`;
      const play = document.createElement('button'); play.textContent = 'Jouer'; play.onclick = () => this.onPlay(f, id);
      txt.appendChild(play); card.appendChild(txt); this.panel.maps.appendChild(card);
    });
    this.el.classList.add('zoom');
  },
  unselect() { if (!this.sel) return; this.prev = this.sel; this.sel = null; this.go({ ...this.base }); this.el.classList.remove('zoom'); },
  back() { if (this.sel) this.unselect(); else document.getElementById('wBack').click(); },
  // aperçu de la map : le sol déjà dessiné + les machines
  thumb() {
    const T = CFG.TILE, big = document.createElement('canvas'); big.width = CFG.MW * T; big.height = CFG.MH * T;
    const g = big.getContext('2d'); g.drawImage(GameMap.canvas, 0, 0);
    GameMap.machines.forEach(m => Sprites.perkMachine(g, m.tx * T, m.ty * T, m.perk));
    Sprites.forge(g, GameMap.forge.tx * T, GameMap.forge.ty * T); Sprites.mysteryBox(g, GameMap.box.tx * T, GameMap.box.ty * T, false);
    const c = document.createElement('canvas'); c.width = c.height = 96;
    c.getContext('2d').drawImage(big, 0, 0, 96, 96);
    return c;
  },

  draw(c, t) {
    const { W, H } = this, dt = Math.min(0.1, (t - (this.lastT ?? t)) / 1000); this.lastT = t;
    // zoom animé : échelle interpolée en logarithmique (vitesse de zoom régulière) ; le pays visé glisse
    // vers sa place à l'écran à vitesse régulière au lieu de filer en travers de la carte en plein zoom
    if (this.t < 1) {
      this.t = Math.min(1, this.t + dt / 0.9);
      const k = this.t < 0.5 ? 4 * this.t ** 3 : 1 - (-2 * this.t + 2) ** 3 / 2, a = this.from, b = this.to, L = (u, v) => u + (v - u) * k;
      const s = Math.exp(L(Math.log(a.s), Math.log(b.s)));
      const pan = (u, v) => b.s > a.s ? v - (v - u) * a.s * (1 - k) / s : u + (v - u) * b.s * k / s;
      this.cam = { s, x: L(a.x, b.x), y: L(a.y, b.y), lon: pan(a.lon, b.lon), lat: pan(a.lat, b.lat) };
    }
    const cam = this.cam, path = pts => { c.beginPath(); pts.forEach((p, i) => { const [x, y] = this.proj(p[0], p[1]); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
    // mer, quadrillage, terres
    c.fillStyle = this.seaPat; c.fillRect(0, 0, W, H);
    c.fillStyle = '#211813';
    const step = cam.s > this.base.s * 4 ? 5 : 15;
    for (let lon = -180; lon <= 180; lon += step) { const x = Math.round(this.proj(lon, 0)[0]); for (let y = 0; y < H; y += 3) c.fillRect(x, y, 1, 1); }
    for (let lat = -75; lat <= 85; lat += step) { const y = Math.round(this.proj(0, lat)[1]); for (let x = 0; x < W; x += 3) c.fillRect(x, y, 1, 1); }
    c.lineJoin = 'round';
    LAND.forEach(p => { path(p); c.fillStyle = '#2a1e14'; c.save(); c.translate(1, 2); c.fill(); c.restore(); });   // ombre portée
    LAND.forEach(p => { path(p); c.fillStyle = this.landPat; c.fill(); c.strokeStyle = '#1c140d'; c.lineWidth = 1; c.stroke(); });
    SEAS.forEach(p => { path(p); c.fillStyle = this.seaPat; c.fill(); c.strokeStyle = '#1c140d'; c.stroke(); });
    // taches de sang sur le papier
    this.stains.forEach(st => {
      const [sx, sy] = this.proj(st.lon, st.lat), k = cam.s / this.base.s;
      st.drops.forEach(([dx, dy, r, col]) => { c.fillStyle = col; const w = Math.max(1, Math.min(4, Math.round(r * k * 2))); c.fillRect(Math.round(sx + dx * k * 1.3), Math.round(sy + dy * k * 1.3), w, w); });
    });
    // pays jouables teintés de rouge ; en vue zoomée, le reste du monde s'assombrit
    const z = this.sel ? this.t : 1 - this.t, sel = this.sel || (this.t < 1 ? this.prev : null);
    if (z > 0) { c.fillStyle = `rgba(5,2,2,${0.55 * z})`; c.fillRect(0, 0, W, H); }
    FRONTS.forEach(f => {
      const on = f === sel;
      f.shapes.forEach(p => {
        path(p);
        c.fillStyle = on ? this.landPat : 'rgba(150,18,14,.35)'; c.fill();
        if (on) { c.fillStyle = `rgba(150,18,14,${0.25 + 0.08 * Math.sin(t / 300)})`; c.fill(); }
        c.strokeStyle = on ? '#c41a14' : '#7a0c0a'; c.lineWidth = on ? 2 : 1; c.stroke();
      });
    });
    // épingles : tête rouge qui pulse ; les étiquettes (boutons HTML) suivent la carte, reliées par un trait
    const r = Game.cv.getBoundingClientRect(), k = r.width / W, sc = Math.max(0.8, Math.min(1.6, r.width / 800)), fade = this.sel ? 1 - this.t : this.t;
    FRONTS.forEach((f, i) => {
      const [x, y] = this.proj(f.pin[0], f.pin[1]), px = Math.round(x), py = Math.round(y), tag = this.tags[i];
      const tx = x + f.tag[0] * sc / k, ty = y + f.tag[1] * sc / k;
      if (!this.sel && fade > 0.5) {
        c.fillStyle = 'rgba(196,26,20,.6)';
        const n = Math.max(Math.abs(tx - x), Math.abs(ty - y)) | 0;
        for (let j = 4; j < n; j += 2) c.fillRect(Math.round(x + (tx - x) * j / n), Math.round(y + (ty - y) * j / n), 1, 1);
      }
      tag.style.left = r.left + tx * k + 'px'; tag.style.top = r.top + ty * k + 'px';
      tag.style.opacity = fade; tag.style.visibility = fade > 0.05 ? 'visible' : 'hidden';
      const ring = (t / 600 + i * 0.37) % 1, R = 2 + ring * 7;
      c.fillStyle = `rgba(255,60,40,${0.6 * (1 - ring)})`;
      for (let a = 0; a < 6.28; a += 0.5) c.fillRect(Math.round(x + Math.cos(a) * R), Math.round(y + Math.sin(a) * R), 1, 1);
      c.fillStyle = '#000'; c.fillRect(px - 2, py - 2, 5, 5);
      c.fillStyle = '#c41a14'; c.fillRect(px - 1, py - 2, 3, 4); c.fillRect(px - 2, py - 1, 5, 2);
      c.fillStyle = '#ff6a4a'; c.fillRect(px - 1, py - 1, 1, 1);
    });
    // lampe de bureau : halo chaud au centre, coins dans le noir
    const g = c.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.45, W * 0.7);
    g.addColorStop(0, 'rgba(255,170,90,.05)'); g.addColorStop(0.6, 'rgba(0,0,0,.15)'); g.addColorStop(1, 'rgba(0,0,0,.75)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
};

function inPoly(pts, x, y) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
