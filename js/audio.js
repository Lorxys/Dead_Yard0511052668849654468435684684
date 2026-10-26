// Sons et musiques générés par code (Web Audio) : aucun fichier à charger.
// Les navigateurs n'autorisent le son qu'après un premier geste du joueur : le contexte audio démarre
// au premier appui (écran ou clavier). Avant, tous les appels sont simplement ignorés.
// Le jeu déclenche les sons depuis onEvent() / updateVisuals(), jamais depuis la simulation.
const midi = m => 440 * Math.pow(2, (m - 69) / 12);

const Sound = {
  ctx: null, menuWanted: false, menuOn: false, loop: null, moans: [],

  attach() {
    const start = () => this.init();
    addEventListener('pointerdown', start); addEventListener('keydown', start);
    // boutons du menu et de l'écran de mort : coup de tonnerre
    document.addEventListener('click', e => { if (e.target.closest('#menu button, #over button')) this.thunder(); });
    document.addEventListener('visibilitychange', () => { if (this.ctx) document.hidden ? this.ctx.suspend() : this.ctx.resume(); });
  },
  // ctx : contexte imposé (tests hors ligne), sinon celui du navigateur
  init(ctx) {
    if (this.ctx && !ctx) { if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!ctx && !AC) return;
    const c = this.ctx = ctx || new AC();
    const comp = c.createDynamicsCompressor(); comp.connect(c.destination);
    this.master = this.gain(0.8, comp);
    this.sfx = this.gain(1, this.master);
    // réverbération partagée : écho du champ de bataille
    this.verb = c.createConvolver(); this.verb.buffer = this.impulse(2.8); this.verb.connect(this.master);
    this.verbIn = this.gain(0.5, this.verb);
    const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    // musique du menu (fondu à l'arrêt) et bruits lointains étouffés derrière elle
    this.menuBus = this.gain(0, this.master);
    this.far = c.createBiquadFilter(); this.far.type = 'lowpass'; this.far.frequency.value = 650;
    this.far.connect(this.menuBus); this.far.connect(this.gain(0.8, this.verbIn));
    // jingles des machines : son de vieille radio (bande étroite + grésillement)
    this.loopBus = this.gain(0, this.sfx);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 320;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    hp.connect(lp); lp.connect(this.loopBus); lp.connect(this.gain(0.3, this.verbIn));
    this.radio = hp;
    const cb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), cd = cb.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = Math.random() < 0.0015 ? Math.random() * 2 - 1 : (Math.random() * 2 - 1) * 0.03;
    const crackle = c.createBufferSource(); crackle.buffer = cb; crackle.loop = true;
    crackle.connect(this.gain(0.25, this.radio)); crackle.start();
    if (!ctx) this.timer = setInterval(() => this.schedule(), 100);
    if (this.menuWanted) this.menu(true);
  },

  // ---------- briques de base ----------
  gain(v, dest) { const g = this.ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; },
  impulse(sec) {
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    return b;
  },
  // sortie d'un son : o = { t (quand), vol, pan (-1 gauche, 1 droite), wet (part de réverbération), dest (sortie imposée) }
  at(o, vol, wet) {
    const c = this.ctx, t = o.t || c.currentTime;
    if (o.dest) { const g = this.gain((o.vol ?? 1) * vol, o.dest); return [t, g]; }
    const g = this.gain((o.vol ?? 1) * vol); let node = g;
    if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(p); node = p; }
    node.connect(this.sfx); node.connect(this.gain(o.wet ?? wet, this.verbIn));
    return [t, g];
  },
  env(param, t, a, peak, d) {
    param.setValueAtTime(0.0001, t); param.exponentialRampToValueAtTime(peak, t + a); param.exponentialRampToValueAtTime(0.0001, t + a + d);
  },
  noise(dest, t, dur, o = {}) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), a = o.a || 0.002;
    s.buffer = this.noiseBuf; s.loop = true;
    f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q || 1;
    if (o.fEnd) f.frequency.exponentialRampToValueAtTime(o.fEnd, t + a + dur);
    this.env(g.gain, t, a, o.v || 1, dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + a + dur + 0.05);
  },
  tone(dest, t, freq, dur, o = {}) {
    const c = this.ctx, s = c.createOscillator(), g = c.createGain(), a = o.a || 0.005;
    s.type = o.type || 'sine'; s.frequency.setValueAtTime(freq, t);
    if (o.to) s.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
    if (o.detune) s.detune.value = o.detune;
    this.env(g.gain, t, a, o.v || 1, dur);
    let n = s;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; s.connect(f); n = f; }
    n.connect(g); g.connect(dest); s.start(t); s.stop(t + a + dur + 0.05);
  },
  // cloche de boîte à musique (partiels inharmoniques)
  bell(dest, t, freq, dur = 1.2, v = 0.3) {
    this.tone(dest, t, freq, dur, { v }); this.tone(dest, t, freq * 2.76, dur * 0.35, { v: v * 0.25 }); this.tone(dest, t, freq * 5.4, dur * 0.15, { v: v * 0.1 });
  },

  // ---------- bruitages ----------
  // éclair : claquement sec, crépitements, puis grondement du tonnerre
  thunder() {
    if (!this.ctx) return;
    const [t, o] = this.at({}, 0.9, 0.7);
    this.noise(o, t, 0.08, { type: 'highpass', f: 3000 });
    for (let i = 0; i < 5; i++) this.noise(o, t + 0.02 + Math.random() * 0.18, 0.05, { f: 1500 + Math.random() * 2500, q: 0.8, v: 0.6 });
    this.noise(o, t + 0.08, 2.6, { type: 'lowpass', f: 420, fEnd: 50, a: 0.12 });
    this.tone(o, t + 0.05, 55, 1.8, { to: 28, a: 0.1, v: 0.5 });
  },
  // coup de feu par arme : [fréquence de la détonation, durée, fréquence du « corps », volume, réverbération]
  GUN: {
    rifle: [1300, 0.16, 110, 0.5, 0.35], pistol: [1900, 0.1, 150, 0.42, 0.25], smg: [2100, 0.07, 120, 0.3, 0.18],
    ar: [1500, 0.1, 100, 0.42, 0.3], shotgun: [650, 0.3, 70, 0.7, 0.5], sniper: [2600, 0.22, 80, 0.75, 0.9],
    lmg: [1200, 0.09, 90, 0.4, 0.25]
  },
  // w = arme (ou famille) : le son dépend de sa famille (cls), avec pompe ou culasse après le tir si l'arme en a une
  shot(w, o = {}) {
    if (!this.ctx) return;
    const W = CFG.WEAPONS[w] || {}, cls = W.cls || w;
    if (cls === 'ray') return this.rayShot(o);
    const [f, d, body, v, wet] = this.GUN[cls] || this.GUN.rifle, [t, out] = this.at(o, v, wet);
    this.noise(out, t, d, { f: f * (0.9 + Math.random() * 0.2), q: 0.6 });
    this.noise(out, t, d * 0.4, { type: 'highpass', f: 4000, v: 0.5 });
    this.tone(out, t, body * 2, d * 1.4, { to: body * 0.5, v: 0.8 });
    if (W.pump) this.clack(out, t + 0.38);                                       // pompe qu'on réarme
    if (W.bolt) { this.clack(out, t + 0.45); this.clack(out, t + 0.62); }         // culasse
  },
  // pistolet à rayons : « piou » électrique qui descend, et grésillement
  rayShot(o = {}) {
    const [t, out] = this.at(o, 0.35, 0.4);
    this.tone(out, t, 1800, 0.18, { type: 'square', to: 300, lp: 3000, v: 0.4 });
    this.tone(out, t, 1210, 0.14, { type: 'sawtooth', to: 220, lp: 2500, v: 0.25 });
    this.noise(out, t, 0.06, { f: 5000, q: 2, v: 0.2 });
  },
  // impact du rayon : petite explosion électrique
  zap(o = {}) {
    if (!this.ctx) return;
    const [t, out] = this.at(o, 0.4, 0.4);
    this.noise(out, t, 0.25, { type: 'lowpass', f: 1800, fEnd: 200 });
    this.tone(out, t, 220, 0.2, { type: 'square', to: 60, lp: 900, v: 0.3 });
  },
  clack(out, t) { this.noise(out, t, 0.03, { f: 3200, q: 4, v: 0.35 }); this.tone(out, t, 900, 0.04, { type: 'square', v: 0.12 }); },
  explosion(o = {}) {
    if (!this.ctx) return;
    const [t, out] = this.at(o, 1, 0.7);
    this.noise(out, t, 1.6, { type: 'lowpass', f: 2200, fEnd: 60 });
    this.noise(out, t, 0.15, { type: 'highpass', f: 1500, v: 0.6 });
    this.tone(out, t, 90, 1.2, { to: 26 });
    for (let i = 0; i < 5; i++) this.noise(out, t + 0.3 + Math.random() * 0.8, 0.04, { f: 2500, q: 2, v: 0.15 });   // débris qui retombent
  },
  // pas dans la boue
  step() {
    if (!this.ctx) return;
    const [t, out] = this.at({}, 1, 0.05);
    this.noise(out, t, 0.07, { type: 'lowpass', f: 350 + Math.random() * 250 });
    this.noise(out, t + 0.02, 0.05, { f: 900, q: 2, v: 0.25 });
  },
  // voix synthétique : dents de scie désaccordées -> râle (modulation rapide du volume) -> saturation -> formants (voyelle)
  // o = { pitch (courbe de hauteur), det, fry (Hz du râle, 0 = sans), dist, breath, formants: [[[début, fin], Q, gain]], v, a }
  voice(out, t, dur, o) {
    const c = this.ctx, src = this.gain(1), am = this.gain(o.fry ? 0.5 : 1), env = c.createGain(), v = o.v || 0.8;
    for (const det of o.det || [0]) {
      const s = c.createOscillator(); s.type = 'sawtooth'; s.detune.value = det;
      s.frequency.setValueCurveAtTime(o.pitch, t, dur); s.connect(src); s.start(t); s.stop(t + dur + 0.05);
    }
    if (o.breath) this.noise(src, t, dur, { f: 1500, q: 0.8, a: 0.05, v: o.breath });
    src.connect(am);
    if (o.fry) {
      const l = c.createOscillator(); l.type = 'square'; l.frequency.value = o.fry;
      l.connect(this.gain(0.5, am.gain)); l.start(t); l.stop(t + dur + 0.05);
    }
    let n = am;
    if (o.dist) { const w = c.createWaveShaper(); w.curve = this.distCurve(); am.connect(w); n = w; }
    for (const [[f1, f2], q, g] of o.formants) {
      const b = c.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = q;
      b.frequency.setValueAtTime(f1, t); b.frequency.linearRampToValueAtTime(f2, t + dur);
      n.connect(b); b.connect(this.gain(g, env));
    }
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.06));
    env.gain.setValueAtTime(v, t + dur * 0.7); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    env.connect(out);
  },
  distCurve() {
    if (!this.curve) {
      const n = 1024, k = 40; this.curve = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; this.curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    }
    return this.curve;
  },
  // cri de zombie façon Call of Duty : voix grave, éraillée et saturée
  // growl = râle profond qui gargouille, snarl = grognement agressif et sec, scream = hurlement aigu (plus rare)
  GROWLS: {   // [hauteur, + aléa, durée, + aléa, râle (Hz), formants, souffle]
    growl:  [55, 30, 1, 1.2, 32, [[[420, 260], 6, 1], [[1000, 800], 8, 0.5]], 0.35],
    snarl:  [95, 40, 0.45, 0.5, 45, [[[750, 500], 5, 1], [[1600, 1300], 7, 0.6]], 0.5],
    scream: [300, 120, 0.8, 0.5, 0, [[[900, 1100], 6, 1], [[2400, 2600], 8, 0.6]], 0.25]
  },
  growl(o = {}) {
    if (!this.ctx) return;
    const r = Math.random(), kind = o.kind || (r < 0.55 ? 'growl' : r < 0.9 ? 'snarl' : 'scream');
    const [f, fr, d0, dr, fry, formants, breath] = this.GROWLS[kind], dur = d0 + Math.random() * dr, f0 = f + Math.random() * fr;
    const pitch = new Float32Array(16);   // hauteur qui tremble au hasard, retombe (ou monte puis retombe pour le hurlement)
    for (let i = 0; i < 16; i++) {
      const k = i / 15;
      pitch[i] = f0 * (kind === 'scream' ? 0.8 + 0.6 * Math.sin(k * Math.PI) : 1.15 - 0.35 * k) * (0.88 + Math.random() * 0.24);
    }
    const [t, out] = this.at(o, kind === 'scream' ? 0.35 : 0.55, 0.3);
    this.voice(out, t, dur, { pitch, det: [0, 11, -14], fry: fry && fry + Math.random() * 15, dist: true, breath, formants, a: kind === 'snarl' ? 0.02 : 0.08 });
  },
  // cris limités à 3 par seconde pour ne pas saturer quand la horde est grande
  moanFree() { const n = performance.now(); this.moans = this.moans.filter(x => n - x < 1000); if (this.moans.length >= 3) return false; this.moans.push(n); return true; },
  // morsure : dents qui claquent, chair qui se déchire, sang qui gicle, cri de douleur du soldat, et le zombie qui grogne
  bite() {
    if (!this.ctx) return;
    const [t, out] = this.at({}, 0.75, 0.15);
    this.noise(out, t, 0.05, { f: 3500, q: 2, v: 0.8 }); this.noise(out, t + 0.03, 0.06, { f: 2200, q: 3, v: 0.6 });   // crac
    this.noise(out, t + 0.05, 0.25, { f: 1800, fEnd: 450, q: 2, v: 0.5 });                                               // déchirure
    for (let i = 0; i < 8; i++) this.tone(out, t + 0.12 + i * 0.035 + Math.random() * 0.02, 180 + Math.random() * 220, 0.04, { to: 500 + Math.random() * 300, v: 0.3 });   // glouglou du sang
    this.noise(out, t + 0.1, 0.35, { type: 'lowpass', f: 700, v: 0.5 });                                                 // éclaboussure
    this.voice(out, t + 0.08, 0.32, { pitch: new Float32Array([175, 160, 140, 118]), det: [0, 7], breath: 0.25, v: 0.5,   // « argh ! »
      formants: [[[680, 600], 5, 1], [[1150, 1000], 6, 0.5]] });
    this.growl({ kind: 'snarl', vol: 0.8 });
  },  // zombie abattu : bruit mouillé
  splat(o = {}) {
    if (!this.ctx) return;
    const [t, out] = this.at(o, 0.6, 0.1);
    this.noise(out, t, 0.18, { type: 'lowpass', f: 900 }); this.noise(out, t + 0.03, 0.1, { f: 400, q: 3, v: 0.6 });
  },
  // barricade qui s'effondre : grondement de gravats, planches qui craquent
  door(o = {}) {
    if (!this.ctx) return;
    const [t, out] = this.at(o, 0.9, 0.4);
    this.noise(out, t, 1.8, { type: 'lowpass', f: 600, fEnd: 80 });
    this.tone(out, t, 70, 1, { to: 35 });
    for (let i = 0; i < 7; i++) this.noise(out, t + 0.05 + Math.random() * 1.4, 0.05, { f: 1800, q: 3, v: 0.3 });
  },
  denied() {
    if (!this.ctx) return;
    const [t, out] = this.at({}, 0.15, 0.05);
    this.tone(out, t, 110, 0.18, { type: 'square', lp: 1200 }); this.tone(out, t, 104, 0.18, { type: 'square', lp: 1200 });
  },

  // ---------- machines ----------
  // jingle propre à chaque machine, joué en boucle à la radio tant qu'on se tient devant (notes en demi-tons)
  JINGLES: {
    health:  { base: 57, step: 0.2,  wave: 'square',   notes: [0, null, 0, 3, 5, null, 3, 0, 7, null, 5, 3, 0, null, null, null] },
    regen:   { base: 60, step: 0.24, wave: 'triangle', notes: [0, 4, 7, 12, 7, 4, 2, 5, 9, 14, 9, 5, 0, null, null, null] },
    speed:   { base: 64, step: 0.13, wave: 'square',   notes: [0, 2, 4, 7, 4, 2, 0, 2, 4, 7, 9, 7, 4, 2, 0, null] },
    fire:    { base: 59, step: 0.19, wave: 'sawtooth', notes: [0, null, 7, null, 5, 7, null, 3, 0, null, 10, null, 7, 5, 3, null] },
    reload:  { base: 62, step: 0.15, wave: 'square',   notes: [0, 5, 0, 7, null, 7, 5, 3, 0, 3, 5, 10, null, 7, 12, null] },
    upgrade: { base: 45, step: 0.28, wave: 'triangle', notes: [0, 3, 7, 12, 11, 7, 3, 0, 1, 5, 8, 13, 12, 8, 5, 1] }
  },
  setNear(key) {
    if (!this.ctx || (this.loop ? this.loop.key : null) === key) return;
    const t = this.ctx.currentTime, g = this.loopBus.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    if (!key) { g.linearRampToValueAtTime(0, t + 0.6); this.loop = null; return; }
    g.linearRampToValueAtTime(0.5, t + 0.4);
    this.loop = { key, i: 0, next: t + 0.15 };
  },
  // achat d'atout : bouteille qu'on décapsule, glouglou, arpège qui monte
  perkBuy() {
    if (!this.ctx) return;
    const [t, out] = this.at({}, 0.5, 0.4);
    this.noise(out, t, 0.04, { f: 1500, q: 6 }); this.tone(out, t, 600, 0.06, { to: 1300, v: 0.4 });
    for (let i = 0; i < 6; i++) this.tone(out, t + 0.15 + i * 0.09, 250 + Math.random() * 250, 0.05, { to: 500 + Math.random() * 300, v: 0.35 });
    [0, 4, 7, 12, 16].forEach((n, i) => this.bell(out, t + 0.75 + i * 0.09, midi(72 + n), 1, 0.25));
    if (this.loop) this.loop.next = Math.max(this.loop.next, t + 2);   // le jingle reprend après la fanfare
  },
  // amélioration d'arme : coups de marteau sur l'enclume, vapeur, accord grave et sinistre
  upgrade() {
    if (!this.ctx) return;
    const [t, out] = this.at({}, 0.55, 0.6);
    [0, 0.35, 0.7].forEach(d => {
      this.noise(out, t + d, 0.08, { f: 2500, q: 3, v: 0.7 });
      [1200, 1870, 2650].forEach(f => this.tone(out, t + d, f, 0.5, { v: 0.12 }));
    });
    this.noise(out, t + 0.9, 1.2, { type: 'highpass', f: 4000, a: 0.05, v: 0.3 });
    [33, 40, 45].forEach(n => this.tone(out, t + 1.1, midi(n), 1.8, { type: 'sawtooth', lp: 800, a: 0.05, v: 0.35 }));
    this.bell(out, t + 1.1, midi(69), 2, 0.25); this.bell(out, t + 1.3, midi(76), 2, 0.2);
    if (this.loop) this.loop.next = Math.max(this.loop.next, t + 3);
  },
  // boîte mystère : couvercle qui grince, boîte à musique pendant tout le tirage, accord final
  boxRoll(dur, o = {}) {
    if (!this.ctx) return;
    const [t, out] = this.at(o, 0.5, 0.5);
    this.tone(out, t, 90, 0.5, { type: 'sawtooth', to: 140, lp: 600, v: 0.25 });
    const tune = [72, 76, 79, 84, 79, 76, 74, 77, 81, 86, 81, 77];
    for (let i = 0, s = 0.12; i * s < dur - 0.3; i++) this.bell(out, t + 0.2 + i * s, midi(tune[i % tune.length]), 0.5, 0.15);
    [84, 88, 91, 96].forEach((n, i) => this.bell(out, t + dur + i * 0.05, midi(n), 1.6, 0.2));
  },
  // rechargement (dur s) : chargeur vide qui tombe, nouveau chargeur enfoncé, culasse armée à la fin
  reload(dur) {
    if (!this.ctx) return;
    const [t, out] = this.at({}, 0.6, 0.1);
    this.clack(out, t + 0.1); this.noise(out, t + 0.2, 0.1, { f: 900, q: 2, v: 0.3 });
    this.tone(out, t + 0.45, 260, 0.06, { type: 'square', to: 120, lp: 900, v: 0.2 });          // il tombe au sol
    this.noise(out, t + dur * 0.55, 0.08, { f: 1500, q: 2, v: 0.35 }); this.clack(out, t + dur * 0.6);   // nouveau chargeur
    this.clack(out, t + dur - 0.25); this.noise(out, t + dur - 0.2, 0.1, { f: 2400, q: 1.5, v: 0.4 }); this.clack(out, t + dur - 0.08);
  },
  // clic à vide : plus une balle
  dry() {
    if (!this.ctx) return;
    const [t, out] = this.at({}, 0.4, 0.05);
    this.clack(out, t);
  },
  pickup() {
    if (!this.ctx) return;
    const [t, out] = this.at({}, 0.6, 0.1);
    this.clack(out, t); this.noise(out, t + 0.06, 0.12, { f: 2000, q: 1.5, v: 0.4 }); this.clack(out, t + 0.2);
  },
  // tête de mort : petit rire moqueur qui résonne (salves de « ha ha ha » qui descendent), pendant dur s
  laugh(dur, o = {}) {
    if (!this.ctx) return;
    const [t0, out] = this.at(o, 0.55, 0.9);
    const formants = [[[850, 720], 5, 1], [[1250, 1100], 7, 0.6], [[2600, 2450], 9, 0.3]];
    for (let t = t0; t < t0 + dur - 0.4;) {
      const n = 4 + (Math.random() * 4 | 0), base = 170 + Math.random() * 70;
      for (let i = 0; i < n && t < t0 + dur - 0.2; i++) {
        const p = base * (1.25 - i * 0.06);
        this.voice(out, t, 0.13, { pitch: new Float32Array([p * 1.08, p, p * 0.88]), det: [0, 9], breath: 0.6, formants, a: 0.015, v: 0.7 });
        t += 0.18;
      }
      t += 0.45 + Math.random() * 0.5;   // reprise de souffle avant la salve suivante
    }
  },
  boxClose(o = {}) {
    if (!this.ctx) return;
    const [t, out] = this.at(o, 0.4, 0.2);
    this.tone(out, t, 120, 0.2, { to: 60 }); this.noise(out, t, 0.15, { type: 'lowpass', f: 300 });
  },

  // ---------- musique du menu ----------
  // nappe sombre en la mineur, boîte à musique lente et lointaine, et la guerre qui gronde au loin
  BAR: 6,
  CHORDS: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]],
  MELODY: [[76, null, 72, null, 69, null, null, 71], [72, null, 69, null, 65, null, 64, null],
           [74, null, 69, 72, null, 65, null, null], [71, null, 68, null, 64, null, null, null]],
  menu(on) {
    this.menuWanted = on;
    if (!this.ctx || this.menuOn === on) return;
    this.menuOn = on;
    const t = this.ctx.currentTime, g = this.menuBus.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(on ? 0.55 : 0, t + (on ? 2 : 1.2));
    if (on) { this.bar = 0; this.nextBar = t + 0.1; }
  },
  menuBar(t, n) {
    const k = n % 4, B = this.BAR, bus = this.menuBus, chord = this.CHORDS[k];
    // nappe : deux oscillateurs désaccordés par note, attaque et extinction lentes
    chord.forEach(m => [-7, 7].forEach(dt => this.tone(bus, t, midi(m - 12), B + 1, { type: 'triangle', detune: dt, a: 1.8, lp: 700, v: 0.07 })));
    this.tone(bus, t, midi(chord[0] - 24), B, { a: 1, v: 0.18 });
    const mel = this.gain(1, bus); mel.connect(this.gain(0.6, this.verbIn));
    this.MELODY[k].forEach((m, i) => { if (m) this.bell(mel, t + i * B / 8, midi(m), 2.2, 0.07); });
    // au loin : rafales, explosions, gémissements (étouffés par le filtre this.far)
    const far = v => ({ dest: this.gain(v, this.far) });
    if (Math.random() < 0.5) {
      const w = Math.random() < 0.5 ? 'smg' : 'rifle', t0 = t + Math.random() * (B - 2);
      for (let i = 0, n = 3 + Math.random() * 6 | 0; i < n; i++) this.shot(w, { ...far(0.5), t: t0 + i * (w === 'smg' ? 0.11 : 0.35) });
    }
    if (Math.random() < 0.3) this.explosion({ ...far(0.7), t: t + Math.random() * B });
    if (Math.random() < 0.6) this.growl({ ...far(0.9), t: t + Math.random() * B, kind: Math.random() < 0.3 ? 'scream' : 'growl' });
  },

  // ---------- programmation à l'avance (musique du menu et jingles) ----------
  // until : programme jusqu'à cet instant (tests hors ligne) ; sinon un peu en avance sur l'horloge audio
  schedule(until) {
    const c = this.ctx; if (!c || (until === undefined && c.state !== 'running')) return;
    const t = until ?? c.currentTime;
    if (this.menuOn) while (this.nextBar < t + 0.5) { this.menuBar(this.nextBar, this.bar++); this.nextBar += this.BAR; }
    const L = this.loop;
    if (L) while (L.next < t + 0.3) {
      const J = this.JINGLES[L.key], len = J.notes.length + 4, i = L.i % len, n = J.notes[i];
      if (n !== null && n !== undefined) this.tone(this.radio, L.next, midi(J.base + 12 + n), J.step * 0.85, { type: J.wave, lp: 2600, v: 0.1 });
      if (i % 4 === 0 && i < J.notes.length) this.tone(this.radio, L.next, midi(J.base - 12 + (i >= 8 ? 5 : 0)), J.step * 3, { type: 'triangle', v: 0.12 });
      L.i++; L.next += J.step;
    }
  }
};
