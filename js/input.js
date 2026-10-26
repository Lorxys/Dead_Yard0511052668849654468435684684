// Joysticks tactiles flottants (gauche = déplacement, droite = visée + tir), joystick grenade fixe
// + clavier/souris pour PC (clic gauche = tir, clic droit ou G = grenade vers le curseur, R = recharger)
const Input = {
  mouse: { x: 0, y: 0, down: false }, keys: {}, ptr: { L: null, R: null },
  nadeDrag: null,    // visée en cours sur le joystick grenade ({x,y} de longueur ≤ 1)
  nadeAim: null,     // la même, lissée image par image pour un aperçu de trajectoire fluide
  nadeQueue: null,   // lancer en attente : { stick: {x,y} } ou { screen: {x,y} }
  buyQueue: false,   // achat demandé (bouton « Acheter » ou touche E)
  reloadQueue: false,   // rechargement demandé (bouton « Recharger » ou touche R)
  init(el) {
    const R = 48, S = { L: document.getElementById('sL'), R: document.getElementById('sR') };
    const set = (t, e) => {
      let dx = e.clientX - t.ox, dy = e.clientY - t.oy; const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      t.v = { x: dx / R, y: dy / R };
      t.el.firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
    };
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') {
        if (e.button === 2) { this.nadeQueue = { screen: { x: e.clientX, y: e.clientY } }; return; }
        this.mouse = { x: e.clientX, y: e.clientY, down: true }; return;
      }
      const side = e.clientX < innerWidth / 2 ? 'L' : 'R';
      if (this.ptr[side]) return;
      const s = S[side]; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.style.display = 'block';
      this.ptr[side] = { id: e.pointerId, ox: e.clientX, oy: e.clientY, el: s, v: { x: 0, y: 0 } };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse') { this.mouse.x = e.clientX; this.mouse.y = e.clientY; return; }
      for (const k in this.ptr) { const t = this.ptr[k]; if (t && t.id === e.pointerId) set(t, e); }
    });
    const end = e => {
      if (e.pointerType === 'mouse') { if (e.button === 0) this.mouse.down = false; return; }
      for (const k in this.ptr) {
        const t = this.ptr[k];
        if (t && t.id === e.pointerId) { t.el.style.display = 'none'; t.el.firstElementChild.style.transform = ''; this.ptr[k] = null; }
      }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    // joystick grenade (fixe, au-dessus de la zone de tir) : glisser pour viser, relâcher pour lancer.
    // Le centre de visée est l'endroit où le doigt se pose (pas de saut au premier mouvement) et la course
    // est longue (GR px) pour un réglage fin de la distance ; le pommeau ne suit qu'à moitié pour rester dans l'anneau.
    const G = document.getElementById('sG'), GR = 64;
    let gp = null;
    G.addEventListener('pointerdown', e => {
      gp = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
      this.nadeDrag = { x: 0, y: 0 }; this.nadeAim = { x: 0, y: 0 };
      G.setPointerCapture(e.pointerId); G.classList.add('on');
    });
    G.addEventListener('pointermove', e => {
      if (!gp || e.pointerId !== gp.id) return;
      let dx = e.clientX - gp.ox, dy = e.clientY - gp.oy; const d = Math.hypot(dx, dy);
      if (d > GR) { dx *= GR / d; dy *= GR / d; }
      this.nadeDrag = { x: dx / GR, y: dy / GR };
      G.firstElementChild.style.transform = `translate(${dx * 0.45}px,${dy * 0.45}px)`;
    });
    const gEnd = e => {
      if (!gp || e.pointerId !== gp.id) return;
      if (e.type === 'pointerup') {
        this.nadeQueue = { stick: this.nadeDrag };
        if (navigator.vibrate) navigator.vibrate(12);   // petit retour sous le doigt au lancer
      }
      gp = null; this.nadeDrag = this.nadeAim = null; G.firstElementChild.style.transform = ''; G.classList.remove('on');
    };
    G.addEventListener('pointerup', gEnd); G.addEventListener('pointercancel', gEnd);
    addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'KeyG' && !e.repeat) this.nadeQueue = { screen: { x: this.mouse.x, y: this.mouse.y } };
      if (e.code === 'KeyE' && !e.repeat) this.buyQueue = true;
      if (e.code === 'KeyR' && !e.repeat) this.reloadQueue = true;
    });
    addEventListener('keyup', e => this.keys[e.code] = false);
    document.addEventListener('contextmenu', e => e.preventDefault());
  },
  getMove() {
    const t = this.ptr.L; if (t) return t.v;
    const k = this.keys;
    return { x: (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0),
             y: (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0) };
  },
  // lissage de la visée grenade (appelé à chaque image) : l'aperçu glisse vers le doigt au lieu de sauter de pixel en pixel
  update(dt) {
    const d = this.nadeDrag, a = this.nadeAim; if (!d || !a) return;
    const k = 1 - Math.exp(-dt * 22);
    a.x += (d.x - a.x) * k; a.y += (d.y - a.y) * k;
  },
  // récupère (et consomme) le lancer de grenade en attente
  takeGrenade() { const q = this.nadeQueue; this.nadeQueue = null; return q; },
  takeBuy() { const b = this.buyQueue; this.buyQueue = false; return b; },
  takeReload() { const r = this.reloadQueue; this.reloadQueue = false; return r; },
  getAimStick() {
    const t = this.ptr.R; if (!t) return null;
    return { x: t.v.x, y: t.v.y, fire: Math.hypot(t.v.x, t.v.y) > 0.25 };
  }
};
