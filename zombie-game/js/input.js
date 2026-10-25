// Joysticks tactiles flottants (gauche = déplacement, droite = visée + tir) + clavier/souris pour tester sur PC
const Input = {
  mouse: { x: 0, y: 0, down: false }, keys: {}, ptr: { L: null, R: null },
  init(el) {
    const R = 48, S = { L: document.getElementById('sL'), R: document.getElementById('sR') };
    const set = (t, e) => {
      let dx = e.clientX - t.ox, dy = e.clientY - t.oy; const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      t.v = { x: dx / R, y: dy / R };
      t.el.firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
    };
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') { this.mouse = { x: e.clientX, y: e.clientY, down: true }; return; }
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
      if (e.pointerType === 'mouse') { this.mouse.down = false; return; }
      for (const k in this.ptr) {
        const t = this.ptr[k];
        if (t && t.id === e.pointerId) { t.el.style.display = 'none'; t.el.firstElementChild.style.transform = ''; this.ptr[k] = null; }
      }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    addEventListener('keydown', e => this.keys[e.code] = true);
    addEventListener('keyup', e => this.keys[e.code] = false);
    document.addEventListener('contextmenu', e => e.preventDefault());
  },
  getMove() {
    const t = this.ptr.L; if (t) return t.v;
    const k = this.keys;
    return { x: (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0),
             y: (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0) };
  },
  getAimStick() {
    const t = this.ptr.R; if (!t) return null;
    return { x: t.v.x, y: t.v.y, fire: Math.hypot(t.v.x, t.v.y) > 0.25 };
  }
};
