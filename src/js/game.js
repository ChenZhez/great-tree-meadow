const rpick = (a) => a[Math.floor(Math.random() * a.length)];

/* =================== audio =================== */
const AU = {
  ctx: null,
  muted: false,
  step: 0,
  mi: 4,
  nextT: 0,
  night: 0,
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(c.destination);
    this.music = c.createGain();
    this.music.gain.value = 0.26 * SET.music;
    this.bus = c.createGain();
    this.bus.gain.value = 0.55 * SET.sfx;
    const dl = c.createDelay(1);
    dl.delayTime.value = 0.36;
    const fb = c.createGain();
    fb.gain.value = 0.36;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    dl.connect(lp);
    lp.connect(fb);
    fb.connect(dl);
    this.music.connect(this.master);
    this.music.connect(dl);
    this.bus.connect(dl);
    dl.connect(this.master);
    this.bus.connect(this.master);
    setInterval(() => this.tick(), 50);
  },
  f: (m) => 440 * Math.pow(2, (m - 69) / 12),
  tone(fr, t, dur, type, g, dest) {
    const c = this.ctx,
      o = c.createOscillator(),
      a = c.createGain();
    o.type = type;
    o.frequency.value = fr;
    a.gain.setValueAtTime(0, t);
    a.gain.linearRampToValueAtTime(g, t + 0.012);
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(a);
    a.connect(dest || this.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  tick() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx,
      beat = this.style === 1 ? 0.62 : this.style === 2 ? 0.32 : this.night > 0.5 ? 0.56 : 0.44;
    if (this.nextT < c.currentTime) this.nextT = c.currentTime + 0.06;
    while (this.nextT < c.currentTime + 0.25) {
      const t = this.nextT,
        sc = this.night > 0.5 ? [0, 3, 5, 7, 10, 12, 15, 17, 19] : [0, 2, 4, 7, 9, 12, 14, 16, 19],
        root = this.night > 0.5 ? 69 : 72;
      if (Math.random() > 0.32) {
        this.mi = clamp(this.mi + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)], 0, sc.length - 1);
        const fr = this.f(root + sc[this.mi]);
        this.tone(fr, t, 1.6, 'sine', 0.17, this.music);
        this.tone(fr * 2, t, 0.45, 'sine', 0.035, this.music);
      }
      if (this.step % 8 === 0) {
        const pr = this.night > 0.5 ? [0, -4, 3, -2] : [0, 5, -3, 7],
          ch = pr[Math.floor(this.step / 8) % 4];
        this.tone(this.f(root - 24 + ch), t, beat * 8, 'triangle', 0.1, this.music);
        this.tone(this.f(root - 12 + ch + 7), t, beat * 6, 'sine', 0.045, this.music);
      }
      this.nextT += beat;
      this.step++;
    }
  },
  chime() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 4, 7, 12, 16].forEach((n, i) => this.tone(this.f(79 + n), t + i * 0.07, 1.1, 'sine', 0.15));
  },
  note(n, d = 0.9) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(this.f(72 + n), t, d, 'sine', 0.18);
    this.tone(this.f(84 + n), t, d * 0.4, 'sine', 0.05);
  },
  bell() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 3, 7, 10, 14, 17].forEach((n, i) => {
      const tt = t + i * 0.11 + Math.random() * 0.05;
      this.tone(this.f(81 + n), tt, 2.4, 'sine', 0.1);
      this.tone(this.f(81 + n) * 2.76, tt, 0.6, 'sine', 0.025);
    });
  },
  pop() {
    if (!this.ctx) return;
    const c = this.ctx,
      t = c.currentTime,
      o = c.createOscillator(),
      a = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.1);
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    a.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(a);
    a.connect(this.bus);
    o.start(t);
    o.stop(t + 0.25);
  },
  noise(dur = 0.6, freq = 900, g = 0.2) {
    if (!this.ctx) return;
    const c = this.ctx,
      n = Math.floor(c.sampleRate * dur),
      b = c.createBuffer(1, n, c.sampleRate),
      d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource();
    s.buffer = b;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 0.8;
    const a = c.createGain();
    a.gain.value = g;
    s.connect(f);
    f.connect(a);
    a.connect(this.bus);
    s.start();
  },
  snort() {
    if (!this.ctx) return;
    const c = this.ctx,
      t0 = c.currentTime;
    for (let k = 0; k < 2; k++) {
      const t = t0 + k * 0.16,
        o = c.createOscillator(),
        f = c.createBiquadFilter(),
        g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(190, t);
      o.frequency.exponentialRampToValueAtTime(115, t + 0.12);
      f.type = 'bandpass';
      f.frequency.value = 750;
      f.Q.value = 2.5;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(f);
      f.connect(g);
      g.connect(this.bus);
      o.start(t);
      o.stop(t + 0.15);
    }
  },
  finale() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 4, 7, 11, 14, 19, 23].forEach((n, i) => {
      this.tone(this.f(60 + n), t + i * 0.18, 4, 'sine', 0.1);
      this.tone(this.f(72 + n), t + i * 0.18 + 0.05, 3, 'triangle', 0.04);
    });
  },
  env(fr, t, dur, type, g, fr2, q) {
    const c = this.ctx,
      o = c.createOscillator(),
      a = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(fr, t);
    if (fr2) o.frequency.exponentialRampToValueAtTime(fr2, t + dur * 0.8);
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + 0.015);
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = o;
    if (q) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = q;
      o.connect(f);
      n = f;
    }
    n.connect(a);
    a.connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  nz(t, dur, type, freq, g, f2) {
    const c = this.ctx,
      n = Math.floor(c.sampleRate * dur),
      b = c.createBuffer(1, n, c.sampleRate),
      d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    s.buffer = b;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    f.Q.value = 0.9;
    const a = c.createGain();
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + Math.min(0.08, dur * 0.3));
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(a);
    a.connect(this.bus);
    s.start(t);
    s.stop(t + dur + 0.02);
  },
  sfx(name, arg) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime,
      F = this.f;
    switch (name) {
      case 'knock':
        for (let i = 0; i < 3; i++) {
          this.env(140, t + i * 0.22, 0.14, 'sine', 0.35, 70);
          this.nz(t + i * 0.22, 0.06, 'lowpass', 600, 0.25);
        }
        break;
      case 'creak':
        this.env(95, t, 0.7, 'sawtooth', 0.06, 70, 500);
        this.env(150, t + 0.15, 0.5, 'sawtooth', 0.04, 120, 700);
        break;
      case 'ding':
        this.tone(F(88), t, 1.2, 'sine', 0.16);
        this.tone(F(100), t, 0.5, 'sine', 0.04);
        break;
      case 'rune': {
        const n = arg || 0;
        this.tone(F(84 + n), t, 1.8, 'sine', 0.14);
        this.tone(F(96 + n), t + 0.02, 1.2, 'sine', 0.06);
        this.tone(F(103 + n), t + 0.05, 0.8, 'sine', 0.03);
        break;
      }
      case 'rustle':
        for (let i = 0; i < 4; i++) this.nz(t + i * 0.09, 0.18, 'highpass', 2800, 0.14);
        break;
      case 'boing':
        this.env(180, t, 0.5, 'sine', 0.25, 620);
        this.env(620, t + 0.2, 0.35, 'sine', 0.1, 300);
        break;
      case 'thud':
        this.env(160, t, 0.25, 'sine', 0.35, 55);
        this.nz(t, 0.08, 'lowpass', 400, 0.15);
        break;
      case 'paper':
        for (let i = 0; i < 5; i++) this.nz(t + i * 0.07, 0.1, 'bandpass', 2600 + Math.random() * 800, 0.12);
        break;
      case 'sigh':
        [0, 4, 7, 11].forEach((n, i) => this.tone(F(62 + n), t + i * 0.06, 2.2, 'sine', 0.06, this.music));
        this.nz(t, 1.2, 'lowpass', 500, 0.05, 200);
        break;
      case 'marimba':
        this.env(F(72 + (arg || 0)), t, 0.5, 'triangle', 0.28);
        this.env(F(84 + (arg || 0)), t, 0.18, 'sine', 0.08);
        break;
      case 'whoosh':
        this.nz(t, 0.9, 'bandpass', 500, 0.2, 2400);
        break;
      case 'burner':
        this.nz(t, 1.2, 'lowpass', 300, 0.35, 900);
        this.nz(t, 1.2, 'bandpass', 1200, 0.08);
        break;
      case 'splash':
        this.nz(t, 0.7, 'bandpass', 1400, 0.3, 500);
        this.nz(t, 0.25, 'lowpass', 400, 0.2);
        break;
      case 'plop':
        this.env(700, t, 0.18, 'sine', 0.2, 180);
        this.nz(t, 0.2, 'bandpass', 1500, 0.08);
        break;
      case 'ribbit':
        for (let i = 0; i < 2; i++) {
          const tt = t + i * 0.17;
          this.env(210, tt, 0.12, 'sawtooth', 0.12, 150, 900);
          this.env(420, tt, 0.1, 'square', 0.03, 300, 1200);
        }
        break;
      case 'squeak':
        for (let i = 0; i < 4; i++)
          this.env(900 + Math.random() * 500, t + i * 0.09, 0.08, 'square', 0.05, 1300 + Math.random() * 400, 3000);
        break;
      case 'harp':
        [0, 4, 7, 12, 16, 19, 24, 28].forEach((n, i) => this.tone(F(67 + n), t + i * 0.07, 1.8, 'triangle', 0.09));
        break;
      case 'pluck':
        this.env(F(81), t, 0.35, 'triangle', 0.22);
        this.env(F(93), t, 0.15, 'sine', 0.06);
        this.nz(t, 0.05, 'highpass', 3000, 0.08);
        break;
      case 'sparkle':
        for (let i = 0; i < 10; i++) this.tone(F(84 + i * 2 + (i % 2) * 3), t + i * 0.035, 0.5, 'sine', 0.07);
        break;
      case 'discover':
        [0, 7, 12].forEach((n, i) => this.tone(F(76 + n), t + i * 0.12, 0.8, 'triangle', 0.1));
        break;
      case 'munch':
        for (let i = 0; i < 4; i++) this.nz(t + i * 0.13, 0.08, 'bandpass', 900, 0.2);
        break;
      case 'lantern':
        this.tone(F(79), t, 1.6, 'sine', 0.1);
        this.tone(F(86), t + 0.12, 1.4, 'sine', 0.06);
        this.env(500, t + 0.3, 0.2, 'sine', 0.12, 160);
        break;
      case 'wind':
        this.nz(t, 2.2, 'lowpass', 250, 0.3, 900);
        this.env(90, t + 0.3, 0.9, 'sawtooth', 0.04, 65, 400);
        break;
      case 'chimeTap':
        this.tone(F(84 + (arg || 0)), t, 1.4, 'sine', 0.1);
        break;
      case 'pop':
        this.pop();
        break;
      case 'bell':
        this.bell();
        break;
      case 'pour':
        for (let i = 0; i < 8; i++) this.env(900 + Math.random() * 700, t + i * 0.06, 0.08, 'sine', 0.05, 500);
        this.nz(t, 0.7, 'bandpass', 1800, 0.06);
        break;
      case 'buzz':
        this.env(220, t, 0.9, 'sawtooth', 0.05, 230, 700);
        this.env(228, t + 0.05, 0.8, 'sawtooth', 0.04, 215, 700);
        break;
      case 'clack':
        this.nz(t, 0.08, 'bandpass', 1600, 0.35);
        this.env(900, t, 0.12, 'square', 0.08, 500, 2500);
        this.nz(t + 0.25, 0.35, 'bandpass', 900, 0.08);
        break;
      case 'fridge':
        this.env(80, t, 0.4, 'sine', 0.2, 60);
        this.nz(t, 0.25, 'highpass', 2000, 0.06);
        break;
      case 'chop':
        for (let i = 0; i < 5; i++) {
          this.nz(t + i * 0.13, 0.05, 'bandpass', 2500, 0.2);
          this.env(600, t + i * 0.13, 0.05, 'sine', 0.1, 300);
        }
        break;
      case 'switch':
        this.nz(t, 0.03, 'highpass', 3000, 0.3);
        this.env(1500, t, 0.04, 'square', 0.05);
        break;
      case 'fire':
        for (let i = 0; i < 10; i++)
          this.nz(t + Math.random() * 1.2, 0.04, 'highpass', 2000 + Math.random() * 2000, 0.15);
        this.nz(t, 1.4, 'lowpass', 400, 0.12);
        break;
      case 'bath':
        this.nz(t, 1.2, 'bandpass', 900, 0.25, 400);
        for (let i = 0; i < 8; i++) this.env(500 + Math.random() * 600, t + 0.3 + i * 0.12, 0.1, 'sine', 0.08, 900);
        break;
      case 'brush':
        for (let i = 0; i < 4; i++) this.nz(t + i * 0.18, 0.15, 'bandpass', 3200, 0.12, 1800);
        break;
      case 'sizzle':
        this.nz(t, 3.2, 'highpass', 4500, 0.12);
        for (let i = 0; i < 12; i++) this.nz(t + Math.random() * 3, 0.03, 'highpass', 3000, 0.15);
        break;
      case 'lullaby':
        [0, 4, 7, 12, 7, 4, 0].forEach((n, i) => this.tone(F(67 + n), t + i * 0.32, 1.2, 'sine', 0.09));
        break;
      case 'place':
        this.env(200, t, 0.15, 'sine', 0.25, 90);
        this.nz(t, 0.06, 'lowpass', 800, 0.15);
        break;
      case 'shutter':
        this.nz(t, 0.03, 'highpass', 3000, 0.35);
        this.nz(t + 0.09, 0.04, 'highpass', 2500, 0.3);
        this.env(1200, t, 0.05, 'square', 0.04);
        break;
      case 'dance': {
        const mel = [0, 4, 7, 9, 7, 4, 2, 4, 0, 4, 7, 12];
        mel.forEach((n, i) => {
          this.env(F(72 + n), t + i * 0.2, 0.25, 'triangle', 0.18);
          if (i % 2 === 0) this.env(F(48 + (i % 4 ? 5 : 0)), t + i * 0.2, 0.3, 'sine', 0.14);
        });
        break;
      }
      case 'piano': {
        const mel = [
          [0, 0.3],
          [4, 0.3],
          [7, 0.3],
          [12, 0.6],
          [11, 0.3],
          [7, 0.3],
          [9, 0.6],
          [5, 0.3],
          [4, 0.3],
          [2, 0.3],
          [0, 0.9],
        ];
        let tt = t;
        mel.forEach(([n, d]) => {
          this.env(F(67 + n), tt, d * 2.5, 'triangle', 0.16);
          this.env(F(55 + (n % 12)), tt, d * 2, 'sine', 0.06);
          tt += d;
        });
        break;
      }
      case 'musicbox': {
        const mel = [12, 7, 9, 4, 5, 0, 2, 7, 12, 16, 14, 12];
        mel.forEach((n, i) => this.tone(F(79 + n), t + i * 0.28, 1.2, 'sine', 0.09));
        break;
      }
      case 'whale':
        this.env(160, t, 3.5, 'sine', 0.12, 95);
        this.env(240, t + 1.2, 3, 'sine', 0.06, 180);
        this.env(120, t + 2, 2.5, 'triangle', 0.05, 160, 600);
        break;
      case 'coin':
        this.tone(F(88), t, 0.2, 'square', 0.05);
        this.tone(F(95), t + 0.08, 0.5, 'square', 0.05);
        break;
    }
  },
  toggle() {
    this.muted = !this.muted;
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    return this.muted;
  },
};

/* =================== setup =================== */
const kit = makeKit('cel');
kit.seg = 16;
const ckit = makeKit('cel');
seedR(20260928);
buildWorld(kit, world);
autoCols(world);
function prepChar(c) {
  const parts = [c.head, ...c.legs, ...(c.arms || []), ...(c.wings || []), ...(c.cape ? [c.cape] : [])];
  parts.forEach((p) => (p.userData.dynamic = true));
  if (c.tail) c.tail.userData.keepAlone = true;
  mergeGroup(c.body);
  parts.forEach((p) => (p.userData.dynamic = false));
  (c.ears || []).forEach((e) => (e.userData.dynamic = true));
  mergeGroup(c.head);
  (c.ears || []).forEach((e) => {
    e.userData.dynamic = false;
    mergeGroup(e);
  });
  c.legs.forEach((g) => mergeGroup(g));
  (c.arms || []).forEach((g) => mergeGroup(g));
  (c.wings || []).forEach((g) => mergeGroup(g));
  if (c.cape) mergeGroup(c.cape);
  ckit.ink(c.g, 0.024);
  return c;
}
let boy = prepChar(celBoy(ckit, 0)),
  pig = prepChar(celPig(ckit, 0));
world.add(boy.g, pig.g);
const clipBelow2 = [new THREE.Plane(new V3(0, -1, 0), 0.03)];
let reflN = 0;
function setFloraLayer() {
  if (FLORA_ON) camera.layers.enable(1);
  else camera.layers.disable(1);
}
function renderTree() {
  if (HOME.on) {
    renderer.clippingPlanes = [];
    camera.layers.set(0);
    camera.layers.enable(1);
    renderer.setRenderTarget(null);
    if (composer && QB) {
      composer.passes[0].scene = HOME.scene;
      composer.render();
    } else renderer.render(HOME.scene, camera);
    return;
  }
  if (composer) composer.passes[0].scene = scene;
  world.scale.y = -1;
  skyU.flip.value = 1;
  water.visible = false;
  renderer.clippingPlanes = clipBelow2;
  sun.castShadow = false;
  camera.layers.set(0);
  if (++reflN >= REFL_EVERY) {
    reflN = 0;
    renderer.setRenderTarget(reflRT);
    renderer.clear();
    renderer.render(scene, camera);
  }
  world.scale.y = 1;
  skyU.flip.value = 0;
  water.visible = true;
  renderer.clippingPlanes = [];
  sun.castShadow = true;
  setFloraLayer();
  renderer.setRenderTarget(null);
  if (composer && QB) composer.render();
  else renderer.render(scene, camera);
}
const hemi = new THREE.HemisphereLight(0xbfe0ff, 0xffc080, 0.62);
world.add(hemi);
const sun = new THREE.DirectionalLight(0xffe4b8, 1.05);
sun.castShadow = true;
const sc_ = sun.shadow;
sc_.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
Object.assign(sc_.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 200 });
sc_.bias = -0.0004;
sc_.normalBias = 0.03;
sc_.camera.updateProjectionMatrix();
world.add(sun);
world.add(sun.target);
const starGeo = new THREE.BufferGeometry();
{
  const a = [];
  for (let i = 0; i < 1600; i++) {
    const th = Math.random() * TAU,
      ph = Math.asin(rnd(0.05, 1)),
      r = 900;
    a.push(Math.cos(th) * Math.cos(ph) * r, Math.sin(ph) * r, Math.sin(th) * Math.cos(ph) * r);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
}
const starM = new THREE.PointsMaterial({
  map: TEX.dot,
  size: 1.8,
  sizeAttenuation: false,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  fog: false,
  blending: THREE.AdditiveBlending,
});
const stars = new THREE.Points(starGeo, starM);
stars.frustumCulled = false;
world.add(stars);

const ENV = {
  day: {
    top: 0x5b8fd2,
    hor: 0xf2c48c,
    band: 0xffdca6,
    bandAmt: 0.5,
    expo: 0.4,
    sunDir: new V3(0.45, 0.14, -1),
    sunCol: 0xfff2d6,
    glowCol: 0xffb060,
    sunSize: 0.9986,
    glowAmt: 0.5,
    fog: 0xe9c999,
    fn: 110,
    ff: 560,
    tint: 0xc8e0b0,
    tintAmt: 0.16,
    spark: 0.65,
    sparkCol: 0xffe8b8,
    edge: 0xf2d29c,
    hs: 0xb4d0f0,
    hg: 0xe0a870,
    hi: 0.42,
    sc: 0xffdcaa,
    si: 0.64,
    bl: [0.2, 0.45, 0.97],
  },
  night: {
    top: 0x0b1438,
    hor: 0x3d3470,
    band: 0x6b4f9a,
    bandAmt: 0.5,
    expo: 0.45,
    sunDir: new V3(-0.3, 0.32, -1),
    sunCol: 0xfff6e0,
    glowCol: 0x8a8aff,
    sunSize: 0.9995,
    glowAmt: 0.45,
    fog: 0x2a2a5c,
    fn: 70,
    ff: 420,
    tint: 0x151a48,
    tintAmt: 0.14,
    spark: 0.45,
    sparkCol: 0xbfe8ff,
    edge: 0x2a2860,
    hs: 0x6a78c0,
    hg: 0x2a2040,
    hi: 0.55,
    sc: 0xa8b8ff,
    si: 0.5,
    bl: [0.5, 0.45, 0.86],
  },
};
const cA = new THREE.Color(),
  cB = new THREE.Color();
const lc = (a, b, t, dst) => dst.copy(cA.set(a)).lerp(cB.set(b), t);
let nightT = 0,
  nightTarget = 0;
function applyEnv(n) {
  const a = ENV.day,
    b = ENV.night,
    L = (x, y) => x + (y - x) * n;
  lc(a.top, b.top, n, skyU.top.value);
  lc(a.hor, b.hor, n, skyU.hor.value);
  lc(a.band, b.band, n, skyU.band.value);
  skyU.bandAmt.value = L(a.bandAmt, b.bandAmt);
  skyU.expo.value = L(a.expo, b.expo);
  skyU.sunDir.value.copy(a.sunDir).lerp(b.sunDir, n).normalize();
  lc(a.sunCol, b.sunCol, n, skyU.sunCol.value);
  lc(a.glowCol, b.glowCol, n, skyU.glowCol.value);
  skyU.sunSize.value = L(a.sunSize, b.sunSize);
  skyU.glowAmt.value = L(a.glowAmt, b.glowAmt);
  if (!scene.fog) scene.fog = new THREE.Fog(0, 1, 2);
  lc(a.fog, b.fog, n, scene.fog.color);
  scene.fog.near = L(a.fn, b.fn);
  scene.fog.far = L(a.ff, b.ff);
  renderer.setClearColor(scene.fog.color);
  lc(a.tint, b.tint, n, waterU.tint.value);
  waterU.tintAmt.value = L(a.tintAmt, b.tintAmt);
  waterU.sparkle.value = L(a.spark, b.spark) * (typeof SET !== 'undefined' && (SET.calm || SET.nausea) ? 0.5 : 1);
  lc(a.sparkCol, b.sparkCol, n, waterU.sparkCol.value);
  lc(a.edge, b.edge, n, waterU.edge.value);
  waterU.refl.value = 1;
  waterU.distort.value = 0.005;
  waterU.fogFar.value = L(a.ff, b.ff);
  lc(a.hs, b.hs, n, hemi.color);
  lc(a.hg, b.hg, n, hemi.groundColor);
  hemi.intensity = L(a.hi, b.hi);
  lc(a.sc, b.sc, n, sun.color);
  sun.intensity = L(a.si, b.si);
  if (bloom) {
    bloom.strength =
      L(a.bl[0], b.bl[0]) * (typeof SET !== 'undefined' ? SET.bloom * (SET.calm || SET.nausea ? 0.6 : 1) : 1);
    bloom.radius = L(a.bl[1], b.bl[1]);
    bloom.threshold = L(a.bl[2], b.bl[2]);
  }
  FALLU.light.value = L(1, 0.4);
  FALLU.night.value = n;
  W.night.forEach((o) => (o.obj.material.opacity = L(o.base, o.night)));
  starM.opacity = n * 0.95;
  W.dyn.fireflies.material.opacity = n;
  W.dyn.pollen.material.opacity = (1 - n) * 0.8;
  AU.night = n;
  document.body.style.background = n > 0.5 ? '#2a2a5a' : '#ffe2a6';
}

/* =================== save =================== */
const SAVE = 'great-tree-meadow-v1',
  SAVE_VERSION = 1;
let save = { saveVersion: SAVE_VERSION, seeds: [], zones: [], done: false };
let storageOK = true,
  storageWarned = false;
function storageWarn() {
  storageOK = false;
  if (storageWarned) return;
  storageWarned = true;
  const w = $('#storageWarn');
  if (w) w.classList.remove('hidden');
}
/* Upgrades older save data in place. Each step handles one version bump; keep them forever. */
function migrateSave(s) {
  if (!s || typeof s !== 'object') return {};
  const v = +s.saveVersion || 0;
  if (v < 1) {
    if (!Array.isArray(s.seeds)) s.seeds = [];
    if (!Array.isArray(s.zones)) s.zones = [];
  }
  s.saveVersion = SAVE_VERSION;
  return s;
}
try {
  const s = JSON.parse(localStorage.getItem(SAVE));
  if (s) save = Object.assign(save, migrateSave(s));
} catch (e) {
  if (e && e.name !== 'SyntaxError') storageOK = false;
}
try {
  localStorage.setItem(SAVE + '-probe', '1');
  localStorage.removeItem(SAVE + '-probe');
} catch (e) {
  storageOK = false;
}
const persist = () => {
  try {
    localStorage.setItem(SAVE, JSON.stringify(save));
    return true;
  } catch (e) {
    storageWarn();
    return false;
  }
};

/* =================== state =================== */
const PL = { level: 'ground', state: 'free', vx: 0, vz: 0, vy: 0, y: 0, grounded: true, walkTo: null, seat: null };
const AI = { state: 'follow', target: null, timer: 0, talk: 18, eat: null };
const cam = { yaw: 0, pitch: 0.2, dist: 10, tDist: 10, target: new V3(0, 1.1, 26), idle: 0 };
let t = 0,
  started = false,
  paused = false,
  seedsFound = 0,
  finale = { on: false, t: 0, orbs: [] },
  bubbleT = 0,
  zoneChipT = 0;
boy.g.position.set(0, 0, 28);
pig.g.position.set(1.2, 0, 28.6);
boy.g.rotation.y = pig.g.rotation.y = Math.PI;
save.seeds.forEach((id) => {
  const s = W.seeds.find((q) => q.id === id);
  if (s) {
    s.found = true;
    s.hidden = false;
    s.g.visible = false;
    seedsFound++;
  }
});
save.zones.forEach((id) => {
  const z = W.zones.find((q) => q.id === id);
  if (z) z.found = true;
});
if (save.seeds.includes('runes')) {
  W.dyn.runes.solved = true;
  W.dyn.runes.list.forEach((r) => {
    r.lit = true;
    r.m.color.set(0x7ff5ff);
    r.gl.material.opacity = 0.7;
  });
  W.dyn.runes.portal.material.uniforms.a.value = 1;
}
if (save.seeds.includes('scare')) W.dyn.scare.done = true;
if (save.seeds.includes('mail')) W.dyn.cot.read = true;
if (save.seeds.includes('ring')) W.dyn.ring.done = true;
if (save.done) {
  W.dyn.blossom.t = 99;
}
if (save.seeds.includes('shrine')) {
  W.dyn.shrine.done = true;
  W.dyn.shrine.t = 9;
}

/* =================== UI helpers =================== */
/* Dialogs: a small stack so the newest one is drawn on top, Esc closes the top one through its own
   close button, focus moves into the dialog and back to the game afterwards. */
const MODALS = [],
  MODAL_CLOSE = {
    '#letterBox': '#btnLetter',
    '#wardrobe': '#btnWearClose',
    '#photoBox': '#btnPhotoClose',
    '#mapBox': '#btnMapClose',
    '#cookBox': '#btnCookClose',
    '#bookBox': '#btnBookClose',
    '#setBox': '#btnResume',
  };
const modalEl = (s) => (typeof s === 'string' ? $(s) : s);
function openModal(sel) {
  const el = modalEl(sel);
  const i = MODALS.indexOf(el);
  if (i >= 0) MODALS.splice(i, 1);
  MODALS.push(el);
  el.style.zIndex = 30 + MODALS.length;
  el.classList.remove('hidden');
  paused = true;
  closePigMenuSafe();
  const f = el.querySelector('button:not([disabled]),input,[tabindex]');
  if (f)
    try {
      f.focus({ preventScroll: true });
    } catch (e) {}
}
function closeModal(sel) {
  const el = modalEl(sel);
  el.classList.add('hidden');
  const i = MODALS.indexOf(el);
  if (i >= 0) MODALS.splice(i, 1);
  if (!document.querySelector('.modal:not(.hidden)')) {
    if (started && $('#start').classList.contains('hidden')) paused = false;
    try {
      canvas.focus({ preventScroll: true });
    } catch (e) {}
  }
}
function topModal() {
  for (let i = MODALS.length - 1; i >= 0; i--) if (!MODALS[i].classList.contains('hidden')) return MODALS[i];
  return document.querySelector('.modal:not(.hidden)');
}
function closeTopModal() {
  const el = topModal();
  if (!el) return;
  const b = MODAL_CLOSE['#' + el.id] ? $(MODAL_CLOSE['#' + el.id]) : el.querySelector('[data-close]');
  if (b) b.click();
  else closeModal(el);
}
function closePigMenuSafe() {
  if (typeof pigMenuOpen !== 'undefined' && pigMenuOpen) closePigMenu();
}
function veilShow(txt) {
  $('#veilTxt').textContent = txt;
  $('#veilTxt').classList.remove('hidden');
  $('#veil .boot').classList.add('hidden');
  $('#veil').classList.add('on');
}
function veilHide() {
  $('#veil').classList.remove('on');
}
document.querySelectorAll('.modal').forEach((m) =>
  m.addEventListener('pointerdown', (e) => {
    if (e.target === m && m.id !== 'letterBox') closeTopModal();
  }),
);
const sayEl = $('#say'),
  promptEl = $('#prompt'),
  toastEl = $('#toast'),
  veil = $('#veil'),
  zoneEl = $('#zoneName'),
  useBtn = $('#useBtn');
function say(txt, dur = 3.2) {
  sayEl.textContent = txt;
  sayEl.classList.add('on');
  bubbleT = dur;
  AI.talk = Math.max(AI.talk, dur + 8);
}
let toastTimer = null;
function toast(k_, h, p, dur = 3200) {
  toastEl.querySelector('.k').textContent = k_;
  toastEl.querySelector('h2').textContent = h;
  toastEl.querySelector('p').textContent = p || '';
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('on'), dur);
}
function setZone(name) {
  zoneEl.textContent = name;
  zoneEl.classList.add('on');
  zoneChipT = 4;
}
const NSEED = W.seeds.length;
const updSeedHUD = () => ($('#seedCount').textContent = seedsFound + ' / ' + NSEED);
const tmp = new V3(),
  tmp2 = new V3();
function screenOf(v) {
  tmp2.copy(v).project(camera);
  if (tmp2.z > 1) return null;
  return [(tmp2.x * 0.5 + 0.5) * innerWidth, (-tmp2.y * 0.5 + 0.5) * innerHeight];
}
function place(el, v, dy = 0) {
  const s = screenOf(v);
  if (!s) {
    el.style.visibility = 'hidden';
    return;
  }
  el.style.visibility = '';
  const hw = Math.min(innerWidth / 2 - 4, (el.offsetWidth || 220) / 2 + 8);
  el.style.transform = `translate(${Math.round(clamp(s[0], hw, innerWidth - hw))}px,${Math.round(clamp(s[1] + dy, 60, innerHeight - 40))}px) translate(-50%,-100%)`;
}

/* =================== ground & collisions =================== */
const gY = (x, z, level) => (level === 'deck' ? DECK_Y : level === 'home' ? 0 : raisedH(x, z));
const CG = {};
function colsNear(x, z, level) {
  const L = W.cols[level];
  let G = CG[level];
  if (!G || G.n !== L.length) {
    G = CG[level] = { n: L.length, m: new Map() };
    for (const c of L) {
      const r = c.r + 1,
        x0 = Math.floor((c.x - r) / 8),
        x1 = Math.floor((c.x + r) / 8),
        z0 = Math.floor((c.z - r) / 8),
        z1 = Math.floor((c.z + r) / 8);
      for (let i = x0; i <= x1; i++)
        for (let j = z0; j <= z1; j++) {
          const k = i * 10007 + j;
          let a = G.m.get(k);
          if (!a) G.m.set(k, (a = []));
          a.push(c);
        }
    }
  }
  return G.m.get(Math.floor(x / 8) * 10007 + Math.floor(z / 8)) || [];
}
function solidAt(x, z, rad, level) {
  if (level === 'home') return false;
  for (const c of colsNear(x, z, level)) {
    const dx = x - c.x,
      dz = z - c.z,
      m = c.r + rad;
    if (dx * dx + dz * dz < m * m) return true;
  }
  return false;
}
function clearLine(x1, z1, x2, z2, rad, level) {
  const L = Math.hypot(x2 - x1, z2 - z1),
    n = Math.ceil(L / 0.4);
  for (let i = 1; i <= n; i++) {
    const q = i / n;
    if (solidAt(x1 + (x2 - x1) * q, z1 + (z2 - z1) * q, rad, level)) return false;
  }
  return true;
}
function resolve(p, rad, level) {
  if (level === 'home') {
    homeResolve(p, rad);
    return;
  }
  for (const c of colsNear(p.x, p.z, level)) {
    const dx = p.x - c.x,
      dz = p.z - c.z,
      d = Math.hypot(dx, dz),
      m = c.r + rad;
    if (d < m && d > 1e-4) {
      p.x = c.x + (dx / d) * m;
      p.z = c.z + (dz / d) * m;
    }
  }
  const r = Math.hypot(p.x, p.z);
  if (level === 'deck') {
    if (r < 5.75) {
      p.x *= 5.75 / r;
      p.z *= 5.75 / r;
    } else if (r > 9.85) {
      p.x *= 9.85 / r;
      p.z *= 9.85 / r;
    }
  } else if (r > 300) {
    p.x *= 300 / r;
    p.z *= 300 / r;
  }
}

/* =================== interactions =================== */
let nearInter = null;
function findInter() {
  const b = boy.g.position;
  let best = null,
    bd = 1e9;
  for (const o of W.inter) {
    if (o.level !== PL.level || !o.enabled()) continue;
    const d = Math.hypot(o.x - b.x, o.z - b.z);
    if (d < o.r && d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}
function doUse() {
  if (!started || paused || HOME.build) return;
  AU.init();
  if (PL.state === 'swing' || PL.state === 'bench') {
    standUp();
    return;
  }
  if (PL.state === 'balloon') return;
  if (PL.state !== 'free') return;
  if (pigMenuOpen) {
    closePigMenu();
    return;
  }
  const o = nearInter;
  if (!o) {
    const d = boy.g.position.distanceTo(pig.g.position);
    if (d < 3 || PL.carry) openPigMenu();
    else {
      AI.state = 'call';
      say('来啦来啦！', 1.6);
      AU.snort();
    }
    return;
  }
  if (o.it) {
    FURN[o.it.type].act(o.it);
    return;
  }
  if (o.bug) {
    catchBug(o.bug);
    return;
  }
  if (o.act) {
    o.act(o);
    return;
  }
  const id = o.id;
  if (id === 'door') {
    AU.sfx('knock');
    say('咚咚咚……里面传来一句：「嘘，松鼠奶奶在午睡。」', 4);
  } else if (id === 'liftUp') ride(true);
  else if (id === 'liftDown') ride(false);
  else if (id === 'chime') {
    W.dyn.chime.energy = 1.2;
    AU.bell();
    say(rpick(['叮铃铃……好好听！', '风铃在唱歌！']), 2.6);
  } else if (id === 'swing') {
    sitOn('swing');
  } else if (id === 'bench') {
    sitOn('bench', {
      x: LAV_C.x + 9.4,
      y: 0.45,
      z: LAV_C.z,
      ry: -Math.PI / 2,
      sx: LAV_C.x + 8.2,
      sz: LAV_C.z,
      line: '我们坐一会儿吧，花好香。',
    });
  } else if (id === 'picnic') {
    sitOn('bench', {
      x: BAL_C.x - 10.6,
      y: 0.62,
      z: BAL_C.z + 8.2,
      ry: Math.PI * 0.8,
      sx: BAL_C.x - 10,
      sz: BAL_C.z + 6,
      cross: true,
      line: '野餐！团子，给你一块三明治。',
    });
    setTimeout(() => {
      AU.sfx('munch');
      pet(true);
    }, 1400);
  } else if (id === 'pick') {
    W.dyn.hasFlower = true;
    holdFlower();
    AU.sfx('pluck');
    say('摘一朵……就一朵，给石像的。', 2.8);
  } else if (id === 'statue') {
    AU.sfx('rune', -12);
    say('石像捧着空空的花篮……也许它想要一朵花？', 3.4);
  } else if (id === 'offer') offerFlower();
  else if (id === 'balloon') rideBalloon();
  else if (id.startsWith('house')) {
    AU.sfx('knock');
    setTimeout(() => AU.sfx('squeak'), 650);
    setTimeout(() => say(o.line, 3.6), 700);
  } else if (id === 'mill') {
    W.dyn.mill.boost = 4;
    AU.sfx('wind');
    AU.sfx('creak');
    say('呼——转得好快！', 2.4);
  } else if (id === 'lantern') releaseLantern();
  else if (id.startsWith('rune')) touchRune(+id.slice(4));
  else if (id === 'scare') scarecrow();
  else if (id.startsWith('shake')) shakeTree(+id.slice(5) - 1);
  else if (id === 'mail') openLetter();
}
function pet(quiet) {
  AI.state = 'happy';
  AI.timer = 1.6;
  pig.vy = 3.6;
  boy.wave = 1.1;
  boy.g.rotation.y = Math.atan2(pig.g.position.x - boy.g.position.x, pig.g.position.z - boy.g.position.z);
  AU.pop();
  setTimeout(() => AU.snort(), 160);
  for (let i = 0; i < 6; i++)
    spark(pig.g.position.clone().add(new V3(rnd(-0.3, 0.3), 1.1, rnd(-0.3, 0.3))), TEX.heart, 0xff7f9e, {
      v: new V3(rnd(-0.4, 0.4), rnd(0.8, 1.4), rnd(-0.4, 0.4)),
      life: 1.5,
      size: rnd(0.22, 0.36),
    });
  if (!quiet && Math.random() < 0.7) say(rpick(['嘿嘿～', '再摸一下嘛！', '你的手好暖。', '哼哼～最喜欢你了。']), 2.2);
}
function ride(up) {
  const L = W.dyn.lift;
  PL.state = 'lift';
  L.moving = true;
  L.from = L.y;
  L.target = up ? DECK_Y - 0.05 : 0;
  L.t = 0;
  L.up = up;
  AU.sfx('creak');
  L.creak = 0;
  say(up ? '抓紧！我们要升上去啦！' : '慢慢往下啦～', 2.4);
}
function sitOn(which, seat) {
  PL.state = which;
  boy.speed = 0;
  if (which === 'swing') {
    W.dyn.swing.sit = true;
    AU.sfx('creak');
    say('推高一点！再高一点！', 2.6);
  } else {
    PL.seat = seat;
    AU.sfx('sigh');
    say(seat.line, 3);
    cam.idle = 6;
  }
}
function standUp() {
  if (PL.state === 'swing') {
    W.dyn.swing.sit = false;
    const s = W.dyn.swing.g;
    boy.g.position.set(s.position.x, 0, s.position.z + 1.2);
  } else if (PL.state === 'bench' && PL.seat) {
    const s = PL.seat;
    boy.g.position.set(s.sx, gY(s.sx, s.sz, PL.level), s.sz);
    PL.seat = null;
  } else return;
  boy.g.rotation.x = 0;
  PL.state = 'free';
  boy.body.position.y = 0;
  boy.legs.forEach((l) => (l.rotation.x = 0));
}
function touchRune(i) {
  const R_ = W.dyn.runes,
    r = R_.list[i];
  if (r.lit) return;
  r.lit = true;
  r.m.color.set(0x7ff5ff);
  r.gl.material.opacity = 0.75;
  AU.sfx('rune', [0, 4, 7, 12][R_.list.filter((q) => q.lit).length - 1]);
  const n = R_.list.filter((q) => q.lit).length;
  say(n < 4 ? tr('符文亮起来了（{n}/4）', { n }) : '全部亮了！中间的石门……', 2.6);
  if (n === 4 && !R_.solved) {
    R_.solved = true;
    R_.opening = 0;
    setTimeout(() => {
      AU.chime();
      revealSeed('runes');
      const s = W.seeds.find((q) => q.id === 'runes');
      s.y = 3;
      s.g.position.y = 3;
      toast('石环遗迹', '石门打开了', '一颗光之种子从光里飘了出来');
    }, 1400);
  }
}
function scarecrow() {
  const S = W.dyn.scare;
  if (S.done) return;
  S.done = true;
  S.t = 0;
  AU.sfx('rustle');
  setTimeout(() => AU.sfx('boing'), 300);
  say('稻草人晃了晃……帽子里有东西！', 3);
  setTimeout(() => {
    revealSeed('scare');
    AU.chime();
  }, 900);
}
function shakeTree(i) {
  const O = W.dyn.orch,
    tr = O.trees[i];
  tr.t = 0;
  AU.sfx('rustle');
  giveItem('peach', 1);
  if (Math.random() < 0.15)
    setTimeout(() => {
      say('树上掉下来一只金龟子！', 2);
      catchBug(null, 'beetle');
    }, 700);
  let n = 0;
  tr.fruits.forEach((f) => {
    if (f.parent === tr.top && n < 3) {
      n++;
      f.updateMatrixWorld();
      const wp = new V3();
      f.getWorldPosition(wp);
      tr.top.remove(f);
      world.add(f);
      f.position.copy(wp);
      O.falling.push({ m: f, vy: rnd(-0.5, 0.5), vx: rnd(-1.2, 1.2), vz: rnd(-1.2, 1.2), done: false, eaten: false });
    }
  });
  const s = W.seeds.find((q) => q.id === 'orch');
  if (s.hidden) {
    setTimeout(() => {
      revealSeed('orch');
      s.x = tr.x + 1.2;
      s.z = tr.z + 0.6;
      s.g.position.set(s.x, 1.2, s.z);
      AU.chime();
      say('果子里面掉出了一颗种子！', 2.8);
    }, 900);
  } else say(rpick(['果子掉下来了！我能吃一个吗？', '好香好香！']), 2.4);
}
function openLetter() {
  openModal('#letterBox');
  AU.sfx('paper');
  AU.sfx('coin');
  W.dyn.cot.flagT = 0;
}
$('#btnLetter').onclick = () => {
  closeModal('#letterBox');
  W.dyn.cot.read = true;
  revealSeed('mail');
  AU.sfx('paper');
  AU.chime();
  say('松鼠奶奶在树洞里住着呀……', 3);
};

/* =================== new-area interactions =================== */
let flowerMesh = null;
function holdFlower() {
  if (flowerMesh && flowerMesh.parent) flowerMesh.parent.remove(flowerMesh);
  if (!W.dyn.hasFlower) return;
  const f = new THREE.Group();
  f.add(P(ckit.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), 0x5a9a48), 0, 0.18, 0));
  f.add(
    P(
      ckit.mesh(
        lathe(
          [
            [0.001, 0],
            [0.05, 0.01],
            [0.075, 0.07],
            [0.075, 0.15],
            [0.06, 0.2],
            [0.001, 0.14],
          ],
          10,
        ),
        0xff8fb3,
      ),
      0,
      0.4,
      0,
    ),
  );
  f.add(P(ckit.mesh(new THREE.ConeGeometry(0.035, 0.14, 3), 0x6aa84f), 0.03, 0.14, 0));
  ckit.ink(f, 0.012);
  f.rotation.set(-0.4, 0, 0.3);
  boy.arms[0].userData.hand.add(f);
  flowerMesh = f;
}
function offerFlower() {
  W.dyn.hasFlower = false;
  holdFlower();
  const S = W.dyn.shrine;
  S.done = true;
  S.t = 0;
  AU.sfx('harp');
  say('花篮里……开出了好多花！', 3);
  setTimeout(() => {
    revealSeed('shrine');
    AU.chime();
    toast('花神石像', '石像笑了', '花篮里长出一颗光之种子', 3200);
  }, 1800);
}
function rideBalloon() {
  const B = W.dyn.balloon;
  B.t = 0;
  PL.state = 'balloon';
  PL.walkTo = null;
  cam.tDist = Math.max(cam.tDist, 15);
  AU.sfx('burner');
  B.burn = 0;
  say('起飞啦——抓紧篮子！', 2.8);
}
function updBalloon(dt) {
  const B = W.dyn.balloon;
  B.t += dt / 52;
  const u = Math.min(1, B.t);
  const p = B.path.getPointAt(u);
  B.g.position.copy(p);
  B.g.rotation.y += dt * 0.05;
  const b = boy.g.position;
  b.set(p.x - 0.4, p.y + 0.25, p.z);
  pig.g.position.set(p.x + 0.45, p.y + 0.25, p.z + 0.1);
  boy.speed = 0;
  pig.speed = 0;
  animBoy(boy, t, dt);
  animPig(pig, t, dt);
  boy.g.rotation.y += Math.sin(t * 0.3) * 0.004;
  B.burn -= dt;
  const climbing = B.path.getTangentAt(u).y > 0.05;
  if (climbing && B.burn < 0) {
    B.burn = rnd(2.5, 4);
    AU.sfx('burner');
    B.flame = 1;
  }
  B.flame = Math.max(0, (B.flame || 0) - dt * 0.8);
  B.fl.material.opacity = 0.2 + B.flame * 0.8;
  const s = W.seeds.find((q) => q.id === 'balloon');
  if (!s.found && p.distanceTo(tmp.set(s.x, s.y, s.z)) < 6) collectSeed(s);
  if (u > 0.02 && u < 0.98 && Math.random() < dt * 0.05 && bubbleT <= 0)
    say(
      rpick(['下面全是花！', '巨树好大好大……', '我看见我们的小木屋了！', '风车在那边！', '云好近，能咬一口吗？']),
      2.8,
    );
  if (B.t >= 1) {
    B.t = -1;
    PL.state = 'free';
    B.g.position.set(B.cx, 0.2, B.cz);
    B.fl.material.opacity = 0;
    b.set(B.cx + 0.2, raisedH(B.cx, B.cz + 2.6), B.cz + 2.6);
    pig.g.position.set(B.cx + 1.3, 0.2, B.cz + 2.8);
    AU.sfx('ding');
    say('回来啦！好想再飞一次。', 2.8);
  }
}
function releaseLantern() {
  const Lk = W.dyn.lake;
  if (Lk.made.length >= 10) {
    const o = Lk.made.shift();
    world.remove(o.f);
  }
  const o = W.dyn.lotusMaker(pick([0xffc6d6, 0xfff1a8, 0xb8f0ff]));
  o.gl.material.opacity = 0.5 + nightT * 0.5;
  o.f.position.set(Lk.cx + rnd(-0.3, 0.3), 0.02, Lk.cz + 3.8);
  world.add(o.f);
  Lk.made.push({ f: o.f, gl: o.gl, ph: R() * TAU, vx: rnd(-0.25, 0.25), vz: -rnd(0.35, 0.55) });
  AU.sfx('lantern');
  addRipple(o.f.position.x, o.f.position.z, 0.8);
  say(rpick(['许个愿吧！', '它漂走了……好漂亮。', '再放一盏！']), 2.4);
}
/* wardrobe */
save.outfit = save.outfit || 0;
function dress(v, quiet) {
  save.outfit = v;
  persist();
  const bp = boy.g.position.clone(),
    br = boy.g.rotation.y,
    pp = pig.g.position.clone(),
    pr = pig.g.rotation.y,
    keep = { vx: pig.vx, vz: pig.vz, y: pig.y, vy: pig.vy };
  const cr = charRoot();
  cr.remove(boy.g, pig.g);
  disposeGeometry(boy.g);
  disposeGeometry(pig.g);
  boy = prepChar(celBoy(ckit, v));
  pig = prepChar(celPig(ckit, v));
  Object.assign(pig, keep);
  boy.g.position.copy(bp);
  boy.g.rotation.y = br;
  pig.g.position.copy(pp);
  pig.g.rotation.y = pr;
  cr.add(boy.g, pig.g);
  holdFlower();
  document.querySelectorAll('.outfit').forEach((b, i) => b.classList.toggle('sel', i === v));
  if (!quiet) {
    AU.sfx('sparkle');
    for (let i = 0; i < 24; i++) {
      const who = i % 2 ? bp : pp;
      spark(
        who.clone().add(new V3(rnd(-0.5, 0.5), rnd(0.2, 1.6), rnd(-0.5, 0.5))),
        TEX.dot,
        pick([0xffe08a, 0xffc6d6, 0xb8f0ff]),
        { add: true, v: new V3(rnd(-1, 1), rnd(0.5, 2), rnd(-1, 1)), life: 1, size: rnd(0.18, 0.34) },
      );
    }
    say(['还是这身雨衣最舒服！', '我也戴了花环！好看吗？', '我有翅膀了！虽然飞不起来……'][v], 2.8);
  }
}
{
  const box = $('#outfits');
  OUTFITS.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'outfit paper';
    b.innerHTML = `<span class="sw">${o.sw.map((c) => `<i style="background:#${new THREE.Color(c).getHexString()}"></i>`).join('')}</span><b class="serif">${o.name}</b><small>${o.desc}</small>`;
    b.onclick = () => {
      dress(i);
      closeWardrobe();
    };
    box.appendChild(b);
  });
}
function openWardrobe() {
  if (!started) return;
  AU.init();
  openModal('#wardrobe');
  AU.sfx('paper');
}
function closeWardrobe() {
  closeModal('#wardrobe');
}
$('#btnWear').onclick = openWardrobe;
$('#btnWearClose').onclick = closeWardrobe;
/* =================== particles & sparks =================== */
const sparks = [];
function spark(pos, tex, color, o = {}) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      color,
      transparent: true,
      depthWrite: false,
      blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending,
    }),
  );
  s.position.copy(pos);
  const sz = o.size || 0.3;
  s.scale.set(sz, sz, 1);
  (typeof HOME !== 'undefined' && HOME.on ? HOME.root : world).add(s);
  sparks.push({ s, v: o.v || new V3(), life: 0, max: o.life || 1.2, g: o.g || 0 });
}
function updSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.life += dt;
    p.s.position.addScaledVector(p.v, dt);
    p.v.y += p.g * dt;
    p.s.material.opacity = 1 - p.life / p.max;
    if (p.life > p.max) {
      if (p.s.parent) p.s.parent.remove(p.s);
      p.s.material.dispose();
      sparks.splice(i, 1);
    }
  }
}
function puff(x, y, z, n) {
  const P_ = W.dyn.puff;
  for (let i = 0; i < n; i++) {
    const j = P_.next;
    P_.next = (P_.next + 1) % P_.N;
    P_.pos[j * 3] = x + rnd(-0.1, 0.1);
    P_.pos[j * 3 + 1] = y + rnd(-0.05, 0.1);
    P_.pos[j * 3 + 2] = z + rnd(-0.1, 0.1);
    P_.vel[j * 3] = rnd(-0.6, 0.6) + 0.4;
    P_.vel[j * 3 + 1] = rnd(0.6, 1.4);
    P_.vel[j * 3 + 2] = rnd(-0.6, 0.6);
    P_.life[j] = rnd(3, 5);
  }
}
function updPuff(dt) {
  const P_ = W.dyn.puff;
  for (let j = 0; j < P_.N; j++) {
    if (P_.life[j] <= 0) continue;
    P_.life[j] -= dt;
    P_.vel[j * 3 + 1] -= 0.12 * dt;
    P_.pos[j * 3] += (P_.vel[j * 3] + Math.sin(t + j) * 0.3) * dt;
    P_.pos[j * 3 + 1] += Math.max(P_.vel[j * 3 + 1], 0.05) * dt;
    P_.pos[j * 3 + 2] += P_.vel[j * 3 + 2] * dt;
    if (P_.life[j] <= 0) P_.pos[j * 3 + 1] = -999;
  }
  P_.g.attributes.position.needsUpdate = true;
}

/* =================== input =================== */
const keys = {};
const joy = { x: 0, y: 0, id: null };
/* keyboard: see the single router near the end of this file */
const jEl = $('#joy'),
  knob = $('#knob');
function joyMove(e) {
  const r = jEl.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2),
    dy = e.clientY - (r.top + r.height / 2);
  const m = Math.hypot(dx, dy),
    mx = 46;
  if (m > mx) {
    dx *= mx / m;
    dy *= mx / m;
  }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  joy.x = dx / mx;
  joy.y = -dy / mx;
}
jEl.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  AU.init();
  joy.id = e.pointerId;
  jEl.setPointerCapture(e.pointerId);
  joyMove(e);
});
jEl.addEventListener('pointermove', (e) => {
  if (e.pointerId === joy.id) joyMove(e);
});
const jEnd = (e) => {
  if (e.pointerId !== joy.id) return;
  joy.id = null;
  joy.x = joy.y = 0;
  knob.style.transform = '';
};
jEl.addEventListener('pointerup', jEnd);
jEl.addEventListener('pointercancel', jEnd);
document.querySelectorAll('.act[data-act]').forEach((b) => {
  const go = () => {
    const a = b.dataset.act;
    if (a === 'use') doUse();
    else if (a === 'sniff') sniff();
    else if (a === 'jump') doJump();
  };
  let pd = 0;
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pd = performance.now();
    b.classList.add('on');
    go();
  });
  const off = () => b.classList.remove('on');
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, off));
  b.addEventListener('click', () => {
    if (performance.now() - pd > 800) go(); /* keyboard activation; taps already acted on pointerdown */
  });
});
const ptrs = new Map();
let down = null,
  pinch0 = 0;
const ray = new THREE.Raycaster(),
  ndc = new V2();
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
  else {
    const [a, b] = [...ptrs.values()];
    pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
    down = null;
  }
  cam.idle = 0;
  AU.init();
});
canvas.addEventListener('pointermove', (e) => {
  const p = ptrs.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x,
    dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (ptrs.size === 1) {
    cam.yaw -= dx * 0.005 * SET.sens * (SET.invX ? -1 : 1);
    cam.pitch = clamp(cam.pitch + dy * 0.003 * SET.sens * (SET.invY ? -1 : 1), -0.05, 1.2);
    if (down) down.moved += Math.abs(dx) + Math.abs(dy);
  } else if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch0) cam.tDist = clamp((cam.tDist * pinch0) / d, 4, HOME.on ? 24 : 36);
    pinch0 = d;
  }
  cam.idle = 0;
});
const pUp = (e) => {
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch0 = 0;
  if (down && e.type === 'pointerup' && down.moved < 8 && performance.now() - down.t < 450) tapAt(e.clientX, e.clientY);
  down = null;
};
canvas.addEventListener('pointerup', pUp);
canvas.addEventListener('pointercancel', pUp);
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    cam.tDist = clamp(cam.tDist * (1 + e.deltaY * 0.001), 4, HOME.on ? 24 : 36);
    cam.idle = 0;
  },
  { passive: false },
);
function tapAt(x, y) {
  if (HOME.build) {
    homeTap(x, y);
    return;
  }
  if (!started || paused || PL.state !== 'free') return;
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (ray.intersectObject(pig.g, true).length) {
    openPigMenu();
    return;
  }
  const o = ray.ray.origin,
    d = ray.ray.direction,
    py = PL.level === 'deck' ? DECK_Y : 0;
  if (d.y >= -1e-4) return;
  const k = (py - o.y) / d.y;
  if (k < 0) return;
  const p = o.clone().addScaledVector(d, k);
  resolve(p, 0.35, PL.level);
  PL.walkTo = p;
  addRipple(p.x, p.z, 0.8);
}
function doJump() {
  if (!started || paused) return;
  AU.init();
  if (PL.state !== 'free') {
    if (PL.state === 'swing' || PL.state === 'bench') standUp();
    return;
  }
  if (PL.grounded) {
    PL.vy = 6.4;
    PL.grounded = false;
    AU.sfx('boing');
    if (boy.g.position.distanceTo(pig.g.position) < 4) AI.jumpQ = 0.2;
  }
}
function toggleNight() {
  nightTarget = nightTarget > 0.5 ? 0 : 1;
  $('#timeIco').innerHTML = nightTarget
    ? '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
    : '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  say(nightTarget ? '天黑了……树上的果子亮起来了！' : '太阳又回来啦。', 2.8);
}
$('#btnTime').onclick = () => {
  AU.init();
  toggleNight();
};
$('#btnSound').onclick = () => {
  AU.init();
  const m = AU.toggle();
  $('#sndIco').innerHTML = m
    ? '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'
    : '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>';
};
$('#btnHelp').onclick = () => openHelp();
$('#btnGo').onclick = () => startGame();

/* =================== companion =================== */
function seedTarget() {
  const p = pig.g.position;
  let best = null,
    bd = 1e9;
  for (const s of W.seeds) {
    if (s.found) continue;
    let x = s.x,
      z = s.z,
      lvl = s.level;
    if (s.hidden) {
      if (s.id === 'runes') {
        const r = W.dyn.runes.list.find((q) => !q.lit);
        if (r) {
          x = r.x;
          z = r.z;
        }
      } else if (s.id === 'scare') {
        x = TUL_C.x + 2;
        z = TUL_C.z + 1.4;
      } else if (s.id === 'ring') {
        x = RING_C.x;
        z = RING_C.z;
      } else if (s.id === 'orch') {
        x = W.dyn.orch.trees[0].x;
        z = W.dyn.orch.trees[0].z + 1.6;
      } else if (s.id === 'mail') {
        x = COT_C.x + 3.8;
        z = COT_C.z - 1.9;
      } else if (s.id === 'shrine') {
        if (W.dyn.hasFlower) {
          x = SHR_C.x;
          z = SHR_C.z + 2.4;
        } else {
          x = TUL_C.x - 7.6;
          z = TUL_C.z + 3;
        }
      }
    }
    if (s.id === 'maze') {
      x = MAZE_C.x;
      z = MAZE_C.z + (MAZE_N * MAZE_S) / 2 + 1.8;
    }
    if (s.id === 'balloon') {
      x = BAL_C.x;
      z = BAL_C.z + 2.6;
      lvl = PL.level;
    }
    if (lvl !== PL.level) {
      x = LIFT.x;
      z = LIFT.z + (PL.level === 'deck' ? -0.1 : 1.6);
    }
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < bd) {
      bd = d;
      best = { x, z, s };
    }
  }
  return best;
}
function sniff() {
  if (!started || paused) return;
  AU.init();
  AU.snort();
  if (HOME.on) {
    say('家里没有种子啦，出门再找吧！', 2.4);
    return;
  }
  const tg = seedTarget();
  if (!tg) {
    say(seedsFound >= NSEED ? '种子都找齐啦！去巨树下面看看！' : '嗯……闻不到了。', 2.6);
    if (seedsFound >= NSEED) {
      AI.state = 'sniff';
      AI.target = { x: 0, z: 18 };
      AI.timer = 0;
    }
    return;
  }
  AI.state = 'sniff';
  AI.target = tg;
  AI.timer = 0;
  AI.arrived = false;
  say(
    tg.s.id === 'balloon'
      ? '种子在好高好高的地方……坐热气球吧！'
      : tg.s.id === 'maze'
        ? '在迷宫正中间！从入口进去！'
        : tg.s.nightOnly && nightT < 0.55
          ? '萤火林……可是要天黑了才闻得到。'
          : tg.s.id === 'shrine' && !W.dyn.hasFlower
            ? '石像好像想要一朵花，先去郁金香田摘一朵？'
            : tg.s.hidden
              ? '嗅嗅……那边好像藏着什么！'
              : tg.s.level !== PL.level
                ? '种子在另一层！坐篮子去！'
                : '嗅嗅……这边这边！',
    2.8,
  );
}
function updPig(dt) {
  const p = pig.g.position,
    b = boy.g.position;
  let tx = p.x,
    tz = p.z,
    sp = 0;
  const dist = Math.hypot(b.x - p.x, b.z - p.z);
  if (PL.carry) {
    carryPig();
    return;
  }
  if (PL.state === 'lift' || PL.state === 'balloon') {
    return;
  }
  const ex = pigExtra(dt, p, b, dist);
  if (ex) {
    tx = ex[0];
    tz = ex[1];
    sp = ex[2];
  } else if (AI.state === 'sniff') {
    const T = AI.target,
      d = Math.hypot(T.x - p.x, T.z - p.z);
    AI.timer += dt;
    if (d > 1.2 && AI.timer < 14) {
      tx = T.x;
      tz = T.z;
      sp = Math.min(6.2, 1.5 + d);
      if (Math.random() < dt * 8)
        spark(new V3(p.x, 0.35 + gY(p.x, p.z, PL.level), p.z), TEX.dot, 0xe6ff8a, {
          add: true,
          size: 0.35,
          v: new V3(0, 0.4, 0),
          life: 1.4,
        });
    } else {
      if (!AI.arrived) {
        AI.arrived = true;
        AI.timer = 0;
        pig.vy = 3.4;
      }
      if (AI.timer > 3.5 || dist < 2.2) AI.state = 'follow';
    }
  } else if (AI.state === 'call') {
    tx = b.x;
    tz = b.z;
    sp = 7;
    if (dist < 1.8) AI.state = 'follow';
  } else if (AI.state === 'happy') {
    AI.timer -= dt;
    if (pig.y <= 0 && AI.timer > 0.4) pig.vy = 3.2;
    if (AI.timer <= 0) AI.state = 'follow';
  } else if (AI.state === 'eat') {
    const f = AI.eat;
    const d = Math.hypot(f.m.position.x - p.x, f.m.position.z - p.z);
    if (d > 0.7) {
      tx = f.m.position.x;
      tz = f.m.position.z;
      sp = 4.5;
    } else {
      AI.timer += dt;
      f.m.scale.setScalar(Math.max(0.01, 1 - AI.timer / 1.2));
      if (AI.timer > 1.2) {
        f.eaten = true;
        world.remove(f.m);
        AI.state = 'happy';
        AI.timer = 1.4;
        AU.sfx('munch');
        say(rpick(['好甜！', '嗯～蜜桃味的！', '吧唧吧唧……']), 2.2);
        for (let i = 0; i < 5; i++)
          spark(p.clone().setY(p.y + 1.1), TEX.heart, 0xff7f9e, {
            v: new V3(rnd(-0.4, 0.4), 1.1, rnd(-0.4, 0.4)),
            life: 1.4,
            size: 0.28,
          });
      }
    }
  } else {
    const r = boy.g.rotation.y;
    let ox = b.x + Math.cos(r) * 1.15 - Math.sin(r) * 0.4,
      oz = b.z - Math.sin(r) * 1.15 - Math.cos(r) * 0.4;
    if (solidAt(ox, oz, 0.4, PL.level)) {
      ox = b.x - Math.sin(r) * 1.2;
      oz = b.z - Math.cos(r) * 1.2;
    }
    const dd = Math.hypot(ox - p.x, oz - p.z);
    if (dist > 2.1 || (dd > 1.2 && boy.speed > 0.5)) {
      let gx = ox,
        gz = oz;
      if (!clearLine(p.x, p.z, gx, gz, 0.3, PL.level)) {
        AI.trT = (AI.trT || 0) - dt;
        if (AI.trT <= 0 || !AI.crumb) {
          AI.trT = 0.2;
          AI.crumb = pickCrumb(p);
        }
        if (AI.crumb) {
          gx = AI.crumb.x;
          gz = AI.crumb.z;
        }
      } else AI.crumb = null;
      tx = gx;
      tz = gz;
      sp = clamp(Math.hypot(gx - p.x, gz - p.z) * 2.4 + (dist > 4 ? 2.5 : 0), 0, dist > 8 ? 9 : 6.5);
    }
    AI.stuck = dist > 4 && pig.speed < 0.7 ? (AI.stuck || 0) + dt : 0;
    if ((dist > 24 || AI.stuck > 2.5) && PL.state === 'free' && PL.level !== 'home') {
      const c = rescueSpot();
      p.set(c.x, 0, c.z);
      pig.vx = pig.vz = 0;
      AI.stuck = 0;
      AI.crumb = null;
      spark(p.clone().setY(gY(p.x, p.z, PL.level) + 0.5), TEX.dot, 0xfff4c0, {
        add: true,
        v: new V3(0, 1, 0),
        life: 0.8,
        size: 0.4,
      });
    }
    const fr = W.dyn.orch.falling.find(
      (f) => f.done && !f.eaten && Math.hypot(f.m.position.x - b.x, f.m.position.z - b.z) < 10,
    );
    if (fr && Math.random() < dt * 0.8) {
      AI.state = 'eat';
      AI.eat = fr;
      AI.timer = 0;
    }
  }
  if (PL.state === 'swing' || PL.state === 'bench') {
    if (dist < 3.2) sp = 0;
  }
  let vx = 0,
    vz = 0;
  if (sp > 0) {
    const dx = tx - p.x,
      dz = tz - p.z,
      l = Math.hypot(dx, dz) || 1;
    vx = (dx / l) * sp;
    vz = (dz / l) * sp;
  }
  pig.vx = (pig.vx || 0) + (vx - (pig.vx || 0)) * damp(8, dt);
  pig.vz = (pig.vz || 0) + (vz - (pig.vz || 0)) * damp(8, dt);
  p.x += pig.vx * dt;
  p.z += pig.vz * dt;
  resolve(p, 0.4, PL.level);
  pig.speed = Math.hypot(pig.vx, pig.vz);
  if (pig.speed > 0.25) pig.g.rotation.y = lerpAngle(pig.g.rotation.y, Math.atan2(pig.vx, pig.vz), damp(9, dt));
  else pig.g.rotation.y = lerpAngle(pig.g.rotation.y, Math.atan2(b.x - p.x, b.z - p.z) + 0.3, damp(2.5, dt));
  if (AI.jumpQ > 0) {
    AI.jumpQ -= dt;
    if (AI.jumpQ <= 0 && pig.y <= 0) pig.vy = 5.4;
  }
  if (pig.speed < 0.1 && AI.state === 'follow' && pig.y <= 0 && Math.random() < dt * 0.1) pig.vy = 2.4;
  pig.vy -= 16 * dt;
  pig.y += pig.vy * dt;
  if (pig.y <= 0) {
    if (pig.vy < -2.5 && PL.level === 'ground' && gY(p.x, p.z, 'ground') < 0.05) addRipple(p.x, p.z, 0.8);
    pig.y = 0;
    pig.vy = 0;
  }
  p.y =
    gY(p.x, p.z, PL.level) + pig.y + (AI.state === 'nap' ? AI.napY || 0 : AI.state === 'slide' ? AI.slideY || 0 : 0);
  pig.happy = AI.state === 'happy' ? 1 : 0;
  animPig(pig, t, dt);
  pigPose(dt);
  pigIdle(dt, p, b);
  if (pig.speed > 0.5 && PL.level === 'ground' && gY(p.x, p.z, 'ground') < 0.05) {
    pig.rip = (pig.rip || 0) - dt;
    if (pig.rip < 0) {
      addRipple(p.x, p.z, 0.45);
      pig.rip = 0.3;
    }
  }
  if (started && !paused) {
    AI.talk -= dt;
    if (AI.talk <= 0 && bubbleT <= 0) {
      say(
        rpick(
          nightT > 0.5
            ? ['星星好多呀。', '萤火虫在跳舞！', '巨树晚上好漂亮。', '有点困了……']
            : ['风是甜的。', '那边好像有东西在发光？', '我们去那边看看！', '你看，水里有两个天空。'],
        ),
        3,
      );
      AI.talk = rnd(18, 28);
    }
  }
}

/* =================== player =================== */
let wetT = 0,
  lastZ = 0;
function updBoy(dt) {
  const b = boy.g.position;
  if (PL.state === 'lift') {
    const L = W.dyn.lift;
    L.t += dt / 4.5;
    const e = L.t < 1 ? L.t * L.t * (3 - 2 * L.t) : 1;
    L.y = L.from + (L.target - L.from) * e;
    b.set(LIFT.x - 0.35, L.y + 0.1, LIFT.z);
    pig.g.position.set(LIFT.x + 0.35, L.y + 0.1, LIFT.z - 0.1);
    boy.speed = 0;
    pig.speed = 0;
    animBoy(boy, t, dt);
    animPig(pig, t, dt);
    L.creak = (L.creak || 0) - dt;
    if (L.creak < 0 && L.t < 0.95) {
      L.creak = 1.1;
      AU.sfx('creak');
    }
    if (L.t >= 1) {
      L.moving = false;
      AU.sfx('ding');
      PL.level = L.up ? 'deck' : 'ground';
      PL.state = 'free';
      if (L.up) {
        b.set(0, DECK_Y, 6.4);
        pig.g.position.set(1.2, DECK_Y, 6.6);
        setZone('树上木台');
        say('哇——能看到好远好远！', 3);
      } else {
        b.set(0, 0, 10.2);
        pig.g.position.set(1, 0, 10.6);
      }
    }
    return;
  }
  if (PL.state === 'swing') {
    const S = W.dyn.swing;
    S.g.updateMatrixWorld();
    tmp.set(0, -7.8, 0).applyMatrix4(S.g.matrixWorld);
    b.copy(tmp);
    boy.g.rotation.y = 0;
    boy.speed = 0;
    animBoy(boy, t, dt);
    boy.legs.forEach((l) => (l.rotation.x = -1.35 + Math.sin(S.ph) * 0.4));
    boy.body.position.y = -0.3;
    boy.arms.forEach((a) => (a.rotation.x = -2.6));
    return;
  }
  if (PL.state === 'bench') {
    const s = PL.seat,
      rk = s.rock ? Math.sin(t * 1.7) * s.rock * 0.35 : 0;
    b.set(s.x + Math.sin(s.ry) * rk, s.y, s.z + Math.cos(s.ry) * rk);
    boy.g.rotation.y = s.ry;
    boy.speed = 0;
    animBoy(boy, t, dt);
    if (s.lie) {
      boy.g.rotation.x = Math.PI / 2;
      b.y = s.y + 0.2;
      boy.legs.forEach((l) => (l.rotation.x = 0));
    } else {
      boy.legs.forEach((l) => (l.rotation.x = s.cross ? -1.5 : -1.4));
      boy.body.position.y = s.cross ? -0.4 : -0.32;
    }
    return;
  }
  if (PL.state === 'balloon') {
    updBalloon(dt);
    return;
  }
  if (PL.state === 'fish') {
    boy.speed = 0;
    animBoy(boy, t, dt);
    const mv = keys.w || keys.a || keys.s || keys.d || Math.hypot(joy.x, joy.y) > 0.3;
    if (mv && FS.ph === 'wait') stopFish('收竿了。');
    return;
  }
  let ix = 0,
    iy = 0;
  if (started && !paused) {
    ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joy.x;
    iy = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0) + joy.y;
  }
  boy.g.rotation.x = 0;
  const m = Math.hypot(ix, iy);
  let tx = 0,
    tz = 0;
  const spd =
    ((SET.runMode === 'toggle' ? PL.runOn : keys.shift) || Math.hypot(joy.x, joy.y) > 0.95 ? 8.5 : 4.2) *
    (PL.carry ? 0.8 : 1);
  if (m > 0.05) PL.dance = 0;
  if (m > 0.05) {
    PL.walkTo = null;
    if (m > 1) {
      ix /= m;
      iy /= m;
    }
    const fx = -Math.sin(cam.yaw),
      fz = -Math.cos(cam.yaw),
      rx = Math.cos(cam.yaw),
      rz = -Math.sin(cam.yaw);
    tx = (rx * ix + fx * iy) * spd;
    tz = (rz * ix + fz * iy) * spd;
    cam.idle = 0;
  } else if (PL.walkTo) {
    const dx = PL.walkTo.x - b.x,
      dz = PL.walkTo.z - b.z,
      d = Math.hypot(dx, dz);
    if (d < 0.15) PL.walkTo = null;
    else {
      const s = Math.min(3.9, d * 3);
      tx = (dx / d) * s;
      tz = (dz / d) * s;
    }
  }
  const TR = PL.trail || (PL.trail = []),
    lc = TR[TR.length - 1];
  if (!lc || lc.l !== PL.level || Math.hypot(lc.x - b.x, lc.z - b.z) > 0.7) {
    if (lc && lc.l !== PL.level) TR.length = 0;
    TR.push({ x: b.x, z: b.z, l: PL.level });
    if (TR.length > 80) TR.shift();
  }
  PL.vx += (tx - PL.vx) * damp(11, dt);
  PL.vz += (tz - PL.vz) * damp(11, dt);
  lastZ = b.z;
  b.x += PL.vx * dt;
  b.z += PL.vz * dt;
  resolve(b, 0.35, PL.level);
  PL.vy -= 19 * dt;
  PL.y += PL.vy * dt;
  if (PL.y <= 0) {
    if (!PL.grounded && PL.vy < -3 && gY(b.x, b.z, PL.level) < 0.05 && PL.level === 'ground') {
      addRipple(b.x, b.z, 1);
      AU.sfx('plop');
    }
    PL.y = 0;
    PL.vy = 0;
    PL.grounded = true;
  }
  const g0 = gY(b.x, b.z, PL.level);
  b.y = g0 + PL.y;
  boy.speed = Math.hypot(PL.vx, PL.vz);
  if (boy.speed > 0.2) boy.g.rotation.y = lerpAngle(boy.g.rotation.y, Math.atan2(PL.vx, PL.vz), damp(11, dt));
  boy.body.position.y = 0;
  animBoy(boy, t, dt);
  if (PL.dance > 0 && boy.speed < 0.3) {
    PL.dance -= dt;
    boy.g.rotation.y += dt * 2.6;
    boy.arms.forEach((a, i) => (a.rotation.x = -2.6 + Math.sin(t * 8 + i * 3) * 0.5));
    boy.body.position.y = Math.abs(Math.sin(t * 8)) * 0.1;
  }
  if (!PL.grounded) {
    boy.legs[0].rotation.x = 0.6;
    boy.legs[1].rotation.x = -0.3;
    boy.arms.forEach((a) => (a.rotation.x = -2.3));
  }
  if (boy.speed > 0.6 && PL.level === 'ground' && g0 < 0.05 && PL.grounded) {
    PL.rip = (PL.rip || 0) - dt;
    if (PL.rip < 0) {
      addRipple(b.x, b.z, 0.55);
      PL.rip = 0.32;
    }
  }
  // walking through the waterfall
  const wz = CLIFF_Z + 1.3;
  if (PL.level === 'ground' && Math.abs(b.x) < 3.8 && (lastZ - wz) * (b.z - wz) < 0) {
    AU.sfx('splash');
    for (let i = 0; i < 14; i++)
      spark(new V3(b.x + rnd(-0.5, 0.5), rnd(0.6, 2), wz), TEX.dot, 0xe8f7ff, {
        v: new V3(rnd(-1.5, 1.5), rnd(0.5, 2.2), rnd(-1.5, 1.5)),
        g: -5,
        life: 0.8,
        size: rnd(0.12, 0.25),
      });
    if (b.z < wz) say('哇，好凉！后面是个山洞！', 2.6);
  }
  // dandelions burst when walking through
  if (PL.level === 'ground' && (boy.speed > 0.4 || pig.speed > 0.4)) {
    const D = W.dyn.dand;
    for (const who of [b, pig.g.position]) {
      if (Math.hypot(who.x - DAND_C.x, who.z - DAND_C.z) > 11) continue;
      for (const d of D.list) {
        if (d.cool > t) continue;
        if (Math.abs(d.x - who.x) < 0.8 && Math.abs(d.z - who.z) < 0.8) {
          d.cool = t + 5;
          puff(d.x, 0.14 + 0.66 * d.s, d.z, 5);
          if (t > (W.dyn.dand.snd || 0)) {
            W.dyn.dand.snd = t + 0.5;
            AU.sfx('whoosh');
          }
        }
      }
    }
  }
  // fairy ring
  const RG = W.dyn.ring;
  if (PL.level === 'ground' && RG.t < 0 && Math.hypot(b.x - RG.cx, b.z - RG.cz) < 1.4) {
    RG.t = 0;
    RG.note = 0;
    say(RG.done ? '蘑菇们又跳起舞来了！' : '蘑菇……在跳舞？！', 2.6);
  }
}

/* =================== world animation =================== */
function updWorld(dt) {
  W.upd.forEach((f) => f(t, dt));
  // chimes
  const C = W.dyn.chime;
  C.energy = Math.max(0, C.energy - dt * 0.35);
  const ce = 0.06 + C.energy * 0.5;
  C.tubes.forEach((p, i) => {
    p.rotation.x = Math.sin(t * 2.2 + i * 1.3) * ce;
    p.rotation.z = Math.cos(t * 1.9 + i * 0.9) * ce;
  });
  if (C.energy < 0.02 && Math.random() < dt * 0.05 && PL.level === 'deck') {
    C.energy = 0.3;
  }
  // lift ropes
  const L = W.dyn.lift;
  L.g.position.y = L.y;
  const rp = L.rope.geometry.attributes.position;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    rp.setXYZ(i * 2, LIFT.x + Math.cos(a) * 0.15, 23.1, LIFT.z + Math.sin(a) * 0.15);
    rp.setXYZ(i * 2 + 1, LIFT.x + Math.cos(a) * 1.1, L.y + 0.92, LIFT.z + Math.sin(a) * 1.1);
  }
  rp.needsUpdate = true;
  // swing
  const S = W.dyn.swing;
  const tgtA = S.sit ? 0.55 : 0.06;
  S.amp += (tgtA - S.amp) * damp(0.6, dt);
  const oldS = Math.sin(S.ph);
  S.ph += dt * 1.25;
  S.g.rotation.x = Math.sin(S.ph) * S.amp;
  if (S.sit && Math.sign(Math.cos(S.ph)) !== Math.sign(Math.cos(S.ph - dt * 1.25))) AU.sfx('creak');
  // canopy sway
  // runes portal
  const RN = W.dyn.runes;
  RN.portal.material.uniforms.t.value = t;
  if (RN.solved) RN.portal.material.uniforms.a.value = Math.min(1, RN.portal.material.uniforms.a.value + dt * 0.5);
  // fairy ring dance
  const RG = W.dyn.ring;
  if (RG.t >= 0) {
    RG.t += dt;
    const idx = Math.floor(RG.t / 0.28);
    if (idx < 24 && idx >= RG.note) {
      RG.note = idx + 1;
      const m = RG.ms[idx % 12];
      m.v = 3.2;
      AU.sfx('marimba', [0, 2, 4, 7, 9, 12, 14, 16, 19, 16, 14, 12][idx % 12]);
    }
    RG.fx.forEach((s, i) => {
      const a = RG.t * 1.6 + (i / RG.fx.length) * TAU,
        r = 2.2 + Math.sin(RG.t * 2 + i) * 0.6;
      s.position.set(Math.cos(a) * r, 1 + RG.t * 0.35 + Math.sin(RG.t * 3 + i) * 0.3, Math.sin(a) * r);
      s.material.opacity = Math.min(1, RG.t) * Math.max(0, 1 - (RG.t - 6) / 1.5) * 0.9;
    });
    if (RG.t > 2.5 && !RG.done) {
      RG.done = true;
      revealSeed('ring');
      AU.chime();
    }
    if (RG.t > 7.5) {
      RG.t = -1;
      RG.fx.forEach((s) => (s.material.opacity = 0));
    }
  }
  RG.ms.forEach((m) => {
    if (m.v !== 0 || m.g.position.y > m.base) {
      m.v -= 16 * dt;
      m.g.position.y += m.v * dt;
      if (m.g.position.y <= m.base) {
        m.g.position.y = m.base;
        m.v = 0;
      }
      m.g.scale.set(1, 1 + Math.max(0, m.v) * 0.05, 1);
    }
  });
  // scarecrow
  const SC = W.dyn.scare;
  if (SC.t >= 0) {
    SC.t += dt;
    SC.body.rotation.z = Math.sin(SC.t * 14) * 0.18 * Math.max(0, 1 - SC.t / 1.4);
    SC.hat.position.y = 0.25 + Math.max(0, Math.sin(Math.min(SC.t, 1) * Math.PI)) * 0.8;
    SC.hat.rotation.y = SC.t * 6 * Math.max(0, 1 - SC.t);
    if (SC.t > 1.6) SC.t = -1;
  } else SC.body.rotation.z = Math.sin(t * 1.1) * 0.03;
  // orchard
  const O = W.dyn.orch;
  O.trees.forEach((tr) => {
    if (tr.t >= 0) {
      tr.t += dt;
      tr.g.rotation.z = Math.sin(tr.t * 18) * 0.07 * Math.max(0, 1 - tr.t / 0.9);
      if (tr.t > 0.9) {
        tr.t = -1;
        tr.g.rotation.z = 0;
      }
    }
  });
  O.falling.forEach((f) => {
    if (f.done) return;
    f.vy -= 14 * dt;
    f.m.position.x += f.vx * dt;
    f.m.position.z += f.vz * dt;
    f.m.position.y += f.vy * dt;
    const gy = raisedH(f.m.position.x, f.m.position.z) + 0.18;
    if (f.m.position.y <= gy) {
      f.m.position.y = gy;
      if (Math.abs(f.vy) > 2) {
        if (Math.abs(f.vy) > 4) AU.sfx('thud');
        f.vy *= -0.35;
        f.vx *= 0.5;
        f.vz *= 0.5;
      } else f.done = true;
    }
  });
  // frog
  const F = W.dyn.frog;
  if (F.t < 0) {
    if (
      Math.hypot(boy.g.position.x - F.g.position.x, boy.g.position.z - F.g.position.z) < 3.4 &&
      PL.level === 'ground'
    ) {
      let ni = F.cur,
        best = -1;
      F.pads.forEach((p, i) => {
        const d = Math.hypot(p.x - boy.g.position.x, p.z - boy.g.position.z);
        if (i !== F.cur && d > best && Math.hypot(p.x - F.g.position.x, p.z - F.g.position.z) < 4.5) {
          best = d;
          ni = i;
        }
      });
      if (ni !== F.cur) {
        F.from.copy(F.g.position);
        F.to.set(F.pads[ni].x, 0.05, F.pads[ni].z);
        F.cur = ni;
        F.t = 0;
        AU.sfx('ribbit');
      }
    } else F.g.scale.y = 1 + Math.sin(t * 3) * 0.03;
  } else {
    F.t += dt / 0.55;
    const e = Math.min(1, F.t);
    F.g.position.lerpVectors(F.from, F.to, e);
    F.g.position.y = 0.05 + Math.sin(e * Math.PI) * 1.1;
    F.g.rotation.y = Math.atan2(F.to.x - F.from.x, F.to.z - F.from.z);
    if (F.t >= 1) {
      F.t = -1;
      addRipple(F.to.x, F.to.z, 0.7);
    }
  }
  W.dyn.dragon.forEach((d) => {
    const a = t * 0.7 + d.ph;
    d.g.position.set(
      d.cx + Math.cos(a) * 2.4 + Math.sin(t * 3.1 + d.ph) * 0.4,
      0.7 + Math.sin(t * 2 + d.ph) * 0.25,
      d.cz + Math.sin(a * 1.3) * 2.4,
    );
    d.g.rotation.y = -a;
    d.g.rotation.z = Math.sin(t * 9 + d.ph) * 0.08;
  });
  // cottage
  const CT = W.dyn.cot;
  CT.cloths.forEach((c, i) => {
    c.rotation.x = Math.sin(t * 2.3 + i) * 0.25;
    c.rotation.z = Math.sin(t * 1.7 + i * 2) * 0.06;
  });
  CT.flag.rotation.z = CT.read ? -Math.PI / 2 : 0;
  CT.smoke.forEach((s) => {
    s.t += dt * 0.16;
    if (s.t > 1) s.t -= 1;
    const k = s.t;
    s.s.position.set(CT.chim.x + Math.sin(t * 0.5 + k * 6) * 0.5 * k + k * 1.2, CT.chim.y + k * 5, CT.chim.z);
    const z = 0.6 + k * 2.4;
    s.s.scale.set(z, z, 1);
    s.s.material.opacity = 0.5 * Math.sin(k * Math.PI);
  });
  // bees
  W.dyn.bees.forEach((o) => {
    const a = t * 1.1 + o.ph;
    o.g.position.set(
      o.cx + Math.sin(a) * 1.2 + Math.sin(t * 7 + o.ph) * 0.15,
      0.8 + Math.sin(t * 3 + o.ph) * 0.2,
      o.cz + Math.cos(a * 1.4) * 1.2,
    );
    o.g.rotation.y = a;
  });
  // butterflies (curious ones drift toward the player)
  const bp = boy.g.position;
  W.dyn.bfs.forEach((o) => {
    const a = t * o.sp + o.ph;
    tmp.set(
      o.cx + Math.cos(a) * o.r,
      gY(o.cx, o.cz, 'ground') + o.h + Math.sin(a * 2.3) * 0.35,
      o.cz + Math.sin(a * 1.3) * o.r,
    );
    if (PL.level === 'ground' && Math.hypot(bp.x - o.cx, bp.z - o.cz) < 7) o.follow = Math.min(1, o.follow + dt * 0.3);
    else o.follow = Math.max(0, o.follow - dt * 0.2);
    if (o.follow > 0)
      tmp.lerp(
        tmp2.set(bp.x + Math.cos(a * 1.7) * 1.4, bp.y + 1.8 + Math.sin(a * 2) * 0.4, bp.z + Math.sin(a * 1.7) * 1.4),
        o.follow * 0.7,
      );
    o.b.position.copy(tmp);
    o.b.rotation.y = -a + Math.PI;
    const f = Math.sin(t * 16 + o.ph) * 0.9;
    o.wl.rotation.z = f;
    o.wr.rotation.z = -f;
  });
  // rabbits
  W.dyn.rabbits.forEach((r) => {
    const p = r.g.position;
    const d = Math.hypot(bp.x - p.x, bp.z - p.z);
    if (!r.hop) {
      r.t -= dt;
      r.hd.rotation.x = Math.sin(t * 6) * 0.08 * (Math.sin(t * 0.7 + r.hx) > 0 ? 1 : 0);
      if (d < 3.6 && PL.level === 'ground') {
        const ang = Math.atan2(p.x - bp.x, p.z - bp.z) + rnd(-0.5, 0.5);
        r.hop = {
          from: p.clone(),
          to: new V3(p.x + Math.sin(ang) * 1.6, 0, p.z + Math.cos(ang) * 1.6),
          t: 0,
          d: 0.32,
          n: 3,
        };
      } else if (r.t < 0) {
        const a = R() * TAU,
          rr_ = Math.sqrt(R()) * r.hr;
        r.hop = {
          from: p.clone(),
          to: new V3(r.hx + Math.cos(a) * rr_, 0, r.hz + Math.sin(a) * rr_),
          t: 0,
          d: 0.45,
          n: 1,
        };
        r.t = rnd(1.5, 4);
      }
    } else {
      const H = r.hop;
      H.t += dt / H.d;
      const e = Math.min(1, H.t);
      p.x = H.from.x + (H.to.x - H.from.x) * e;
      p.z = H.from.z + (H.to.z - H.from.z) * e;
      p.y = raisedH(p.x, p.z) + Math.sin(e * Math.PI) * 0.45;
      r.g.rotation.y = lerpAngle(r.g.rotation.y, Math.atan2(H.to.x - H.from.x, H.to.z - H.from.z), 0.3);
      r.body.scale.y = 1 + Math.sin(e * Math.PI) * 0.12;
      if (H.t >= 1) {
        H.n--;
        if (H.n > 0) {
          const ang = Math.atan2(H.to.x - H.from.x, H.to.z - H.from.z);
          H.from.copy(H.to);
          H.to.set(H.to.x + Math.sin(ang) * 1.6, 0, H.to.z + Math.cos(ang) * 1.6);
          H.t = 0;
        } else r.hop = null;
      }
    }
    const rr0 = Math.hypot(r.hx - p.x, r.hz - p.z);
    if (rr0 > r.hr + 4) {
      const H = r.hop;
      if (!H) {
        p.x = r.hx + (p.x - r.hx) * (r.hr / rr0);
        p.z = r.hz + (p.z - r.hz) * (r.hr / rr0);
      }
    }
  });
  // jumping fish
  W.dyn.fish.forEach((f) => {
    if (f.t < 0) {
      f.wait -= dt;
      if (f.wait < 0) {
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * TAU,
            d = rnd(8, 60),
            x = bp.x + Math.cos(a) * d * 0.4 + Math.cos(a) * 6,
            z = bp.z + Math.sin(a) * d * 0.4 + Math.sin(a) * 6;
          if (raisedH(x, z) > 0 || Math.hypot(x, z) < 16 || Math.hypot(x, z) > 290) continue;
          const h = rnd(0, TAU);
          f.a.set(x, 0, z);
          f.b.set(x + Math.cos(h) * 2.2, 0, z + Math.sin(h) * 2.2);
          f.t = 0;
          f.g.visible = true;
          addRipple(x, z, 1);
          break;
        }
        f.wait = rnd(3, 8);
      }
    } else {
      f.t += dt / 0.85;
      const e = Math.min(1, f.t);
      f.g.position.lerpVectors(f.a, f.b, e);
      f.g.position.y = Math.sin(e * Math.PI) * 1.3 - 0.1;
      f.g.lookAt(f.b.x, f.g.position.y + Math.cos(e * Math.PI) * 1.3, f.b.z);
      if (f.t >= 1) {
        f.t = -1;
        f.g.visible = false;
        addRipple(f.b.x, f.b.z, 1);
        if (f.g.position.distanceTo(boy.g.position) < 25) AU.sfx('plop');
      }
    }
  });
  // birds
  W.dyn.birds.forEach((o) => {
    o.a += dt * 0.08;
    o.b.position.set(Math.cos(o.a) * o.r, o.h + Math.sin(t * 0.7 + o.ph) * 0.8, Math.sin(o.a) * o.r);
    o.b.rotation.y = -o.a;
    const f = Math.sin(t * 5 + o.ph) * 0.5;
    o.wl.rotation.z = f;
    o.wr.rotation.z = -f;
  });
  const M = W.dyn.mill;
  M.boost = Math.max(0, M.boost - dt * 0.7);
  M.bl.rotation.z += dt * (M.sp + M.boost);
  const SH = W.dyn.shrine;
  if (SH.done) {
    SH.t += dt;
    const e = Math.min(1, SH.t / 1.5);
    SH.bl.scale.setScalar(Math.max(0.001, e));
    SH.halo.material.opacity = Math.min(0.55, SH.t * 0.4) * (0.8 + 0.2 * Math.sin(t * 2));
  }
  const LK = W.dyn.lake;
  LK.L.forEach((o) => {
    o.f.position.y = 0.02 + Math.sin(t * 1.3 + o.ph) * 0.03;
    o.f.rotation.y += dt * 0.05;
    o.f.position.x += o.vx * dt;
    o.f.position.z += o.vz * dt;
    if (Math.hypot(o.f.position.x - LK.cx, o.f.position.z - LK.cz) > 19) {
      o.vx *= -1;
      o.vz *= -1;
    }
  });
  LK.made.forEach((o) => {
    o.f.position.x += o.vx * dt;
    o.f.position.z += o.vz * dt;
    o.f.position.y = 0.02 + Math.sin(t * 1.3 + o.ph) * 0.03;
    o.gl.material.opacity = 0.5 + nightT * 0.5;
  });
  LK.swans.forEach((o) => {
    o.a += dt * 0.06;
    o.g.position.set(LK.cx + Math.cos(o.a) * o.r, 0, LK.cz + Math.sin(o.a) * o.r * 0.7);
    o.g.rotation.y = -o.a;
  });
  const BA = W.dyn.balloon;
  if (BA.t < 0) {
    BA.g.position.y = 0.2 + Math.max(0, Math.sin(t * 0.8)) * 0.05;
    BA.fl.material.opacity = 0.1 + 0.1 * Math.sin(t * 3);
  }
  updPuff(dt);
  updSparks(dt);
  // seeds
  W.seeds.forEach((s) => {
    if (s.nightOnly && !s.found) s.g.visible = nightT > 0.55;
    if (s.found || s.hidden || (s.nightOnly && nightT <= 0.55)) return;
    if (s.rise > 0) {
      s.rise = Math.max(0, s.rise - dt * 0.8);
      const e = 1 - s.rise;
      s.g.scale.setScalar(Math.max(0.01, e * (1 + Math.sin(e * Math.PI) * 0.3)));
    }
    s.g.position.y = s.y + Math.sin(t * 2 + s.ph) * 0.15;
    s.g.rotation.y += dt * 1.2;
    if (started && s.level === PL.level && PL.state === 'free' && s.rise < 0.4) {
      const b = boy.g.position,
        p = pig.g.position;
      if (Math.hypot(b.x - s.x, b.z - s.z) < 1.3 && Math.abs(b.y + 1 - s.g.position.y) < 2.4) collectSeed(s);
      else if (Math.hypot(p.x - s.x, p.z - s.z) < 0.9) collectSeed(s, true);
    }
  });
  // blossom finale
  const BL = W.dyn.blossom;
  if (BL.t >= 0 && !BL.fin) {
    if (BL.t >= 99) BL.fin = true;
    BL.t += dt;
    const m = new THREE.Matrix4(),
      q = new THREE.Quaternion(),
      sv = new V3();
    BL.list.forEach((b, i) => {
      const k_ = clamp((BL.t - b.d) / 2.2, 0, 1),
        e = k_ < 1 ? 1 - Math.pow(1 - k_, 3) * Math.cos(k_ * 5) : 1;
      sv.setScalar(Math.max(0.001, e * b.s));
      m.compose(b.p, q, sv);
      BL.mesh.setMatrixAt(i, m);
    });
    BL.mesh.instanceMatrix.needsUpdate = true;
    if (BL.t > 6 && BL.t < 99) BL.t = 99;
  }
}
function collectSeed(s, byPig) {
  s.found = true;
  s.g.visible = false;
  seedsFound++;
  updSeedHUD();
  save.seeds.push(s.id);
  persist();
  AU.chime();
  for (let i = 0; i < 16; i++)
    spark(s.g.position.clone(), TEX.dot, 0xe6ff8a, {
      add: true,
      v: new V3(rnd(-2, 2), rnd(0, 3), rnd(-2, 2)),
      g: -2,
      life: 1.2,
      size: rnd(0.2, 0.4),
    });
  toast(
    tr('光之种子 {a} / {b}', { a: seedsFound, b: NSEED }),
    s.name,
    seedsFound >= NSEED ? '十二颗都找齐了！回到巨树下面去吧' : '',
  );
  say(
    byPig ? '我先找到的！嘿嘿。' : rpick(['找到啦！亮晶晶的！', '它在发光，暖暖的。', '又一颗！巨树一定很高兴。']),
    2.8,
  );
}
function startFinale() {
  finale.on = true;
  finale.t = 0;
  save.done = true;
  persist();
  AU.finale();
  say('种子……飞起来了！', 3);
  for (let i = 0; i < NSEED; i++) {
    const s = glow(0xe6ff8a, 1.6, 1);
    world.add(s);
    finale.orbs.push({ s, a: (i / NSEED) * TAU });
  }
  setTimeout(() => {
    W.dyn.blossom.t = 0;
    toast('巨树花海', '巨树开花了', '谢谢你，把光之种子都带回来了', 6000);
  }, 3800);
}
function updFinale(dt) {
  if (!finale.on) return;
  finale.t += dt;
  const b = boy.g.position;
  finale.orbs.forEach((o, i) => {
    const k_ = Math.min(1, finale.t / 4),
      a = o.a + finale.t * 2.2,
      r = (1 - k_) * 2 + k_ * 12;
    o.s.position.set(b.x * (1 - k_) + Math.cos(a) * r, 1.5 + k_ * 34, b.z * (1 - k_) + Math.sin(a) * r);
    o.s.material.opacity = finale.t < 4 ? 1 : Math.max(0, 1 - (finale.t - 4));
  });
  if (finale.t > 4.2 && !finale.petals) {
    finale.petals = particles({
      type: 'fall',
      n: 500,
      r: 28,
      y0: 0,
      y1: 30,
      size: 0.3,
      tex: TEX.petal,
      color: 0xffb7c9,
      op: 0.95,
      normal: true,
    });
    world.add(finale.petals);
    W.upd.push(finale.petals.userData.update);
  }
}

/* =================== camera, HUD, minimap =================== */
function updCamera(dt) {
  cam.idle += dt;
  const ar = SET.autoRot && !SET.nausea;
  if (!started) {
    cam.yaw = Math.sin(t * 0.045) * 0.55;
    cam.pitch = 0.16;
    cam.tDist = 13;
  } else if (ar && cam.idle > 8 && PL.state === 'free') cam.yaw += dt * 0.03;
  if (ar && PL.state === 'bench') cam.yaw += dt * 0.08;
  tmp.set(boy.g.position.x, boy.g.position.y + 1.15, boy.g.position.z);
  cam.target.lerp(tmp, damp(PL.state === 'lift' ? 8 : SET.follow === 'tight' || SET.nausea ? 14 : 5, dt));
  cam.dist += (cam.tDist - cam.dist) * damp(6, dt);
  const cp = Math.cos(cam.pitch);
  camera.position.set(
    cam.target.x + Math.sin(cam.yaw) * cp * cam.dist,
    cam.target.y + Math.sin(cam.pitch) * cam.dist,
    cam.target.z + Math.cos(cam.yaw) * cp * cam.dist,
  );
  if (HOME.on) {
    const U = HOME.U;
    cam.target.x = clamp(cam.target.x, U.x0 + 1, U.x1 - 1);
    cam.target.z = clamp(cam.target.z, U.z0 + 0.5, U.z1 - 0.5);
  }
  const minY = HOME.on
    ? 0.8
    : PL.level === 'deck'
      ? DECK_Y + 0.6
      : gY(camera.position.x, camera.position.z, 'ground') + 0.35;
  if (camera.position.y < minY) camera.position.y = minY;
  if (!HOME.on) {
    // keep the camera out of hills and big canopies
    const tg = cam.target;
    for (let it = 0; it < 3; it++) {
      for (const f of [0.25, 0.5, 0.75, 1]) {
        const px = tg.x + (camera.position.x - tg.x) * f,
          pz = tg.z + (camera.position.z - tg.z) * f,
          py = tg.y + (camera.position.y - tg.y) * f,
          g = gY(px, pz, PL.level === 'deck' ? 'ground' : PL.level) + 0.45;
        if (PL.level !== 'deck' && py < g) camera.position.y += (g - py) / f;
      }
    }
    const cp = camera.position,
      dx = cp.x - tg.x,
      dy = cp.y - tg.y,
      dz = cp.z - tg.z,
      L = Math.hypot(dx, dy, dz);
    let best = L;
    if (L > 0.01) {
      const ux = dx / L,
        uy = dy / L,
        uz = dz / L;
      for (const c of W.camCols) {
        if (Math.abs(c.x - tg.x) > 45 || Math.abs(c.z - tg.z) > 45) continue;
        const ox = tg.x - c.x,
          oy = tg.y - c.y,
          oz = tg.z - c.z,
          bq = ox * ux + oy * uy + oz * uz,
          cq = ox * ox + oy * oy + oz * oz - c.r * c.r;
        if (cq < 0) continue;
        const disc = bq * bq - cq;
        if (disc <= 0) continue;
        const t0 = -bq - Math.sqrt(disc);
        if (t0 > 0 && t0 < best) best = t0;
      }
      best = Math.max(1.6, best - 0.35);
      if (best < L) {
        cam.occ = best;
        cp.set(tg.x + ux * best, tg.y + uy * best, tg.z + uz * best);
      }
    }
  }
  camera.lookAt(cam.target);
  sky.position.copy(camera.position);
  const d = skyU.sunDir.value;
  sun.position.set(boy.g.position.x + d.x * 90, Math.max(12, d.y * 300), boy.g.position.z + d.z * 90);
  sun.target.position.set(boy.g.position.x, 0, boy.g.position.z);
}
const mini = $('#mini'),
  mg = mini.getContext('2d');
let miniT = 0;
function drawMini() {
  const S = mini.width,
    c = S / 2,
    k_ = S / 2 / 85,
    pb = boy.g.position;
  mg.clearRect(0, 0, S, S);
  mg.save();
  mg.beginPath();
  mg.arc(c, c, c, 0, TAU);
  mg.clip();
  mg.fillStyle = nightT > 0.5 ? '#3a4a86' : '#bfe2f0';
  mg.fillRect(0, 0, S, S);
  const X = (x) => c + (x - pb.x) * k_,
    Y = (z) => c + (z - pb.z) * k_;
  W.mapShapes.forEach((s) => {
    mg.fillStyle = '#' + new THREE.Color(s.c || 0).getHexString();
    if (s.t === 'c') {
      mg.beginPath();
      mg.arc(X(s.x), Y(s.z), s.r * k_, 0, TAU);
      mg.fill();
    } else if (s.t === 'r') {
      mg.fillRect(X(s.x - s.w / 2), Y(s.z - s.d / 2), s.w * k_, s.d * k_);
    }
  });
  W.mapShapes.forEach((s) => {
    if (s.t === 'l') {
      mg.strokeStyle = '#' + new THREE.Color(s.c).getHexString();
      mg.lineWidth = s.r * 2 * k_;
      mg.lineCap = 'round';
      mg.beginPath();
      mg.moveTo(X(s.x1), Y(s.z1));
      mg.lineTo(X(s.x2), Y(s.z2));
      mg.stroke();
    }
  });
  W.wps.forEach((w) => {
    mg.fillStyle = w.found ? '#9fe8ff' : 'rgba(255,255,255,.6)';
    mg.strokeStyle = '#2e3a59';
    mg.lineWidth = 2;
    mg.beginPath();
    mg.moveTo(X(w.x), Y(w.z) - 8);
    mg.lineTo(X(w.x) + 6, Y(w.z));
    mg.lineTo(X(w.x), Y(w.z) + 8);
    mg.lineTo(X(w.x) - 6, Y(w.z));
    mg.closePath();
    mg.fill();
    mg.stroke();
  });
  W.mapShapes.forEach((s) => {
    if (s.t === 'maze') {
      mg.strokeStyle = '#4a8a3e';
      mg.lineWidth = 2;
      mg.beginPath();
      s.segs.forEach((q) => {
        mg.moveTo(X(q[0]), Y(q[1]));
        mg.lineTo(X(q[2]), Y(q[3]));
      });
      mg.stroke();
    }
  });
  mg.fillStyle = '#6fbf5a';
  mg.beginPath();
  mg.arc(X(0), Y(0), 18 * k_, 0, TAU);
  mg.fill();
  mg.strokeStyle = '#2e3a59';
  mg.lineWidth = 3;
  mg.stroke();
  mg.fillStyle = '#8a6a55';
  mg.beginPath();
  mg.arc(X(0), Y(0), 5 * k_, 0, TAU);
  mg.fill();
  mg.font = 'bold 20px sans-serif';
  mg.textAlign = 'center';
  mg.textBaseline = 'middle';
  W.zones.forEach((z) => {
    if (z.id === 'tree') return;
    if (!z.found) {
      mg.fillStyle = 'rgba(46,58,89,.55)';
      mg.fillText('?', X(z.x), Y(z.z));
    }
  });
  W.seeds.forEach((s) => {
    if (!s.found) return;
    mg.fillStyle = '#e6ff8a';
    mg.strokeStyle = '#2e3a59';
    mg.lineWidth = 2;
    mg.beginPath();
    mg.arc(X(s.x), Y(s.z), 5, 0, TAU);
    mg.fill();
    mg.stroke();
  });
  const p = pig.g.position;
  mg.fillStyle = '#ff9ab0';
  mg.beginPath();
  mg.arc(X(p.x), Y(p.z), 6, 0, TAU);
  mg.fill();
  mg.strokeStyle = '#2e3a59';
  mg.lineWidth = 2;
  mg.stroke();
  const b = boy.g.position,
    r = boy.g.rotation.y;
  mg.save();
  mg.translate(X(b.x), Y(b.z));
  mg.rotate(-r + Math.PI);
  mg.fillStyle = '#ffd23f';
  mg.beginPath();
  mg.moveTo(0, -12);
  mg.lineTo(8, 8);
  mg.lineTo(0, 4);
  mg.lineTo(-8, 8);
  mg.closePath();
  mg.fill();
  mg.stroke();
  mg.restore();
  mg.restore();
}
function updHUD(dt) {
  nearInter =
    started && !paused && PL.state === 'free' && !HOME.build
      ? HOME.on
        ? homeInter()
        : findInter() || bugInter()
      : null;
  if (pigMenuOpen) place(pigMenuEl, tmp2.copy(pig.g.position).setY(pig.g.position.y + 1.2));
  if (nearInter) {
    promptEl.innerHTML = (isTouch ? '' : '<kbd>E</kbd>') + nearInter.label;
    promptEl.classList.add('on');
    place(promptEl, tmp.set(nearInter.x, gY(nearInter.x, nearInter.z, nearInter.level) + 2.4, nearInter.z));
    useBtn.firstChild.nodeValue = '互动';
  } else {
    promptEl.classList.remove('on');
    useBtn.firstChild.nodeValue = PL.state === 'swing' || PL.state === 'bench' ? '起来' : '摸摸';
  }
  if (!HOME.on)
    W.lod.forEach((o) => {
      o.g.visible = Math.hypot(camera.position.x - o.x, camera.position.z - o.z) < o.far;
    });
  if (bubbleT > 0) {
    bubbleT -= dt;
    if (bubbleT <= 0) sayEl.classList.remove('on');
    place(sayEl, tmp.copy(pig.g.position).setY(pig.g.position.y + 1.35));
  }
  if (zoneChipT > 0) {
    zoneChipT -= dt;
    if (zoneChipT <= 0) zoneEl.classList.remove('on');
  }
  miniT -= dt;
  if (miniT < 0) {
    miniT = 0.12;
    drawMini();
  }
  if (started) {
    const b = boy.g.position;
    for (const z of W.zones) {
      if (Math.hypot(b.x - z.x, b.z - z.z) < z.r && PL.level === 'ground') {
        if (!z.found) {
          z.found = true;
          save.zones.push(z.id);
          persist();
          toast('发现', '「' + z.name + '」', '', 2600);
          AU.sfx('discover');
          setTimeout(() => say(z.line, 3.2), 900);
        }
        if (z.cur !== true) {
          W.zones.forEach((q) => (q.cur = false));
          z.cur = true;
          setZone(z.name);
        }
      }
    }
  }
  if (
    started &&
    seedsFound >= NSEED &&
    !finale.on &&
    !save.doneShown &&
    PL.level === 'ground' &&
    Math.hypot(boy.g.position.x, boy.g.position.z) < 19
  ) {
    save.doneShown = true;
    startFinale();
  }
}

/* =================== outer world, map, shards, waypoints =================== */
save.wps = save.wps || [];
save.shards = save.shards || [];
save.unlock = save.unlock || [];
W.wps.forEach((w) => {
  if (save.wps.includes(w.id)) {
    w.found = true;
    w.gl.material.opacity = 0.8;
  }
});
W.shards.forEach((s) => {
  if (save.shards.includes(s.i)) {
    s.found = true;
    s.g.visible = false;
  }
});
if (save.wish) {
  for (let i = 0; i < Math.min(save.wish, W.dyn.wish.ribs.length); i++) W.dyn.wish.ribs[i].visible = true;
  W.dyn.wish.n = save.wish;
}
if (save.xylo) W.dyn.xylo.done = true;
function updShardHUD() {
  $('#shardCount').textContent = shardsLeft();
}
function homeInter() {
  const it = nearestItem(boy.g.position);
  return it ? { id: 'item', label: FURN[it.type].label, x: it.x, z: it.z, level: 'home', it } : null;
}
function teleport(x, z) {
  closeMap();
  veilShow('传送中……');
  AU.sfx('sparkle');
  paused = true;
  setTimeout(() => {
    PL.level = 'ground';
    PL.state = 'free';
    PL.walkTo = null;
    PL.trail = [];
    boy.g.position.set(x, gY(x, z, 'ground'), z + 2.2);
    pig.g.position.set(x + 1.2, gY(x + 1.2, z + 2.6, 'ground'), z + 2.6);
    cam.target.copy(boy.g.position);
    veilHide();
    paused = false;
  }, 600);
}
const bigmap = $('#bigmap'),
  bg_ = bigmap.getContext('2d');
function mapXY(x, z) {
  const S = bigmap.width,
    k_ = S / 2 / 305;
  return [S / 2 + x * k_, S / 2 + z * k_];
}
function drawBigMap() {
  const S = bigmap.width,
    c = S / 2,
    k_ = S / 2 / 305;
  bg_.clearRect(0, 0, S, S);
  bg_.save();
  bg_.beginPath();
  bg_.arc(c, c, c, 0, TAU);
  bg_.clip();
  bg_.fillStyle = nightT > 0.5 ? '#3a4a86' : '#bfe2f0';
  bg_.fillRect(0, 0, S, S);
  const X = (x) => c + x * k_,
    Y = (z) => c + z * k_;
  W.mapShapes.forEach((s) => {
    const col = '#' + new THREE.Color(s.c || 0).getHexString();
    bg_.fillStyle = col;
    bg_.strokeStyle = col;
    if (s.t === 'c') {
      bg_.beginPath();
      bg_.arc(X(s.x), Y(s.z), Math.max(1.5, s.r * k_), 0, TAU);
      bg_.fill();
    } else if (s.t === 'r') {
      bg_.fillRect(X(s.x - s.w / 2), Y(s.z - s.d / 2), s.w * k_, s.d * k_);
    } else if (s.t === 'l') {
      bg_.lineWidth = s.r * 2 * k_;
      bg_.lineCap = 'round';
      bg_.beginPath();
      bg_.moveTo(X(s.x1), Y(s.z1));
      bg_.lineTo(X(s.x2), Y(s.z2));
      bg_.stroke();
    }
  });
  bg_.fillStyle = '#6fbf5a';
  bg_.beginPath();
  bg_.arc(X(0), Y(0), 20 * k_, 0, TAU);
  bg_.fill();
  bg_.textAlign = 'center';
  bg_.textBaseline = 'middle';
  bg_.font = 'bold 17px "Noto Sans SC",sans-serif';
  W.zones.forEach((z) => {
    if (z.found) {
      bg_.fillStyle = 'rgba(255,255,255,.85)';
      const nm = tr(z.name),
        w = bg_.measureText(nm).width + 10;
      bg_.fillRect(X(z.x) - w / 2, Y(z.z) - 22, w, 20);
      bg_.fillStyle = '#2e3a59';
      bg_.fillText(nm, X(z.x), Y(z.z) - 12);
    } else {
      bg_.fillStyle = 'rgba(46,58,89,.5)';
      bg_.fillText('?', X(z.x), Y(z.z));
    }
  });
  W.wps.forEach((w) => {
    bg_.fillStyle = w.found ? '#9fe8ff' : 'rgba(255,255,255,.5)';
    bg_.strokeStyle = '#2e3a59';
    bg_.lineWidth = 2.5;
    bg_.beginPath();
    const x = X(w.x),
      y = Y(w.z);
    bg_.moveTo(x, y - 11);
    bg_.lineTo(x + 9, y);
    bg_.lineTo(x, y + 11);
    bg_.lineTo(x - 9, y);
    bg_.closePath();
    bg_.fill();
    bg_.stroke();
  });
  if (!HOME.on) {
    const b = boy.g.position;
    bg_.save();
    bg_.translate(X(b.x), Y(b.z));
    bg_.rotate(-boy.g.rotation.y + Math.PI);
    bg_.fillStyle = '#ffd23f';
    bg_.strokeStyle = '#2e3a59';
    bg_.lineWidth = 2.5;
    bg_.beginPath();
    bg_.moveTo(0, -14);
    bg_.lineTo(10, 10);
    bg_.lineTo(0, 5);
    bg_.lineTo(-10, 10);
    bg_.closePath();
    bg_.fill();
    bg_.stroke();
    bg_.restore();
  }
  bg_.restore();
}
function openMap() {
  if (!started || HOME.on) return;
  AU.init();
  drawBigMap();
  openModal('#mapBox');
  AU.sfx('paper');
}
function closeMap() {
  closeModal('#mapBox');
}
$('#btnMap').onclick = openMap;
$('#btnMapClose').onclick = closeMap;
bigmap.addEventListener('click', (e) => {
  const r = bigmap.getBoundingClientRect(),
    sx = ((e.clientX - r.left) / r.width) * bigmap.width,
    sy = ((e.clientY - r.top) / r.height) * bigmap.height;
  let best = null,
    bd = 26;
  W.wps.forEach((w) => {
    if (!w.found) return;
    const [x, y] = mapXY(w.x, w.z),
      d = Math.hypot(x - sx, y - sy);
    if (d < bd) {
      bd = d;
      best = w;
    }
  });
  if (best) teleport(best.x, best.z);
  else note('点击发光的传送花台可以传送');
});
function updOuter(dt) {
  const bp = boy.g.position;
  // follow-the-player particles
  [W.dyn.motes, W.dyn.fireflies, W.dyn.pollen].forEach((p) => p.position.set(bp.x, 0, bp.z));
  W.dyn.motes.material.opacity = (0.28 + nightT * 0.5) * (SET.calm || SET.nausea ? 0.5 : 1);
  // sky whale
  const Wh = W.dyn.whale;
  Wh.a += (dt * TAU) / 300;
  const wx = Math.cos(Wh.a) * 175,
    wz = Math.sin(Wh.a) * 175;
  Wh.g.position.set(wx, 112 + Math.sin(t * 0.3) * 4, wz);
  Wh.g.rotation.y = Math.atan2(-Math.sin(Wh.a), Math.cos(Wh.a));
  Wh.body.rotation.x = Math.sin(t * 0.4) * 0.05;
  Wh.tail.rotation.x = Math.sin(t * 1.1) * 0.35;
  Wh.trail.position.set(wx + Math.sin(Wh.a) * 40, Wh.g.position.y - 2, wz - Math.cos(Wh.a) * 40);
  Wh.song -= dt;
  if (Wh.song < 0) {
    Wh.song = rnd(35, 60);
    if (Math.hypot(wx - bp.x, wz - bp.z) < 240) AU.sfx('whale');
  }
  // aurora & shooting stars
  W.dyn.aurora.forEach((m) => {
    m.material.uniforms.t.value = t;
    m.material.uniforms.a.value = nightT;
    m.visible = nightT > 0.02;
  });
  const SS = W.dyn.shoot;
  SS.next -= dt * (PL.seat && PL.seat.lie ? 4 : 1);
  if (nightT > 0.6 && SS.next < 0) {
    SS.next = rnd(5, 12);
    const s = SS.ss.find((q) => q.t < 0);
    if (s) {
      const a = R() * TAU,
        el = rnd(0.35, 0.8);
      s.p = new V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el))
        .multiplyScalar(600)
        .add(camera.position);
      s.v = new V3(rnd(-1, 1), -rnd(0.3, 0.6), rnd(-1, 1)).normalize().multiplyScalar(420);
      s.t = 0;
    }
  }
  SS.ss.forEach((s) => {
    if (s.t < 0) {
      s.m.material.opacity = 0;
      return;
    }
    s.t += dt;
    s.p.addScaledVector(s.v, dt);
    s.m.position.copy(s.p);
    const a1 = tmp.copy(s.p).project(camera),
      a2 = tmp2.copy(s.p).addScaledVector(s.v, 0.1).project(camera);
    s.m.material.rotation = Math.atan2((a2.y - a1.y) * innerHeight, (a2.x - a1.x) * innerWidth);
    s.m.material.opacity = Math.sin(Math.min(1, s.t / 1.1) * Math.PI) * 0.95;
    if (s.t > 1.1) s.t = -1;
  });
  W.dyn.rays.forEach(
    (r) =>
      (r.m.material.opacity = SET.calm || SET.nausea ? 0 : (1 - nightT) * (0.06 + 0.035 * Math.sin(t * 0.6 + r.ph))),
  );
  // kite
  const K = W.dyn.kite;
  if (K.on) {
    if (Math.hypot(bp.x - HILL_C.x, bp.z - HILL_C.z) > 75 || PL.level !== 'ground') {
      K.on = false;
      K.g.visible = K.line.visible = false;
    } else {
      const hgt = 9 + Math.min(8, boy.speed * 1.6);
      tmp.set(bp.x - 6 + Math.sin(t * 0.7) * 1.5, bp.y + hgt + Math.sin(t * 1.3), bp.z - 7);
      K.pos.lerp(tmp, damp(1.2, dt));
      K.g.position.copy(K.pos);
      K.g.lookAt(bp.x, K.pos.y, bp.z);
      K.g.rotation.z = Math.sin(t * 1.7) * 0.25;
      K.tail.forEach((b, i) => (b.position.x = Math.sin(t * 4 - i * 0.8) * 0.18 * i));
      const la = K.line.geometry.attributes.position;
      la.setXYZ(0, bp.x, bp.y + 1.3, bp.z);
      la.setXYZ(1, K.pos.x, K.pos.y, K.pos.z);
      la.needsUpdate = true;
    }
  }
  // jellyfish & mirror lake orbs
  W.dyn.jelly.forEach((j) => {
    const s = 1 + Math.sin(t * 2 + j.ph) * 0.08;
    j.dome.scale.set(s, 1 / s, s);
    j.g.position.set(
      j.base.x + Math.sin(t * 0.2 + j.ph) * 3,
      j.base.y + Math.sin(t * 0.7 + j.ph) * 0.8,
      j.base.z + Math.cos(t * 0.17 + j.ph) * 3,
    );
  });
  const O = W.dyn.orbs;
  O.list.forEach((o) => {
    o.a += dt * o.sp;
    o.s.position.set(O.cx + Math.cos(o.a) * o.r, o.h + Math.sin(t * 0.5 + o.r) * 0.6, O.cz + Math.sin(o.a) * o.r);
  });
  // tea steam, shishi-odoshi, snail, bouncy mushrooms, lighthouse, crystals
  const T_ = W.dyn.tea;
  if (T_.on > 0) T_.on -= dt;
  T_.steam.forEach((s) => {
    s.t += dt * 0.3;
    if (s.t > 1) s.t -= 1;
    s.s.position.set(T_.x + Math.sin(t + s.t * 5) * 0.1, T_.y + s.t * 1.4, T_.z);
    s.s.scale.setScalar(0.25 + s.t * 0.6);
    s.s.material.opacity = (T_.on > 0 ? 0.55 : 0.15) * Math.sin(s.t * Math.PI);
  });
  const SO = W.dyn.shishi;
  SO.t += dt;
  const ph = SO.t % 6;
  SO.tube.rotation.z = ph < 5.4 ? -0.35 + (ph / 5.4) * 0.3 : 0.45;
  if (ph >= 5.4 && ph - dt < 5.4 && Math.hypot(bp.x - SO.x, bp.z - SO.z) < 30) AU.sfx('clack');
  const SN = W.dyn.snail;
  SN.a += dt * 0.02;
  SN.g.position.set(SN.cx + Math.cos(SN.a) * 14, 0.25, SN.cz + Math.sin(SN.a) * 14);
  SN.g.rotation.y = -SN.a;
  W.dyn.gshroom.forEach((o) => {
    if (o.t >= 0) {
      o.t += dt;
      const e = Math.sin(Math.min(1, o.t / 0.5) * Math.PI);
      o.m.scale.set(1 + e * 0.15, 1 - e * 0.25, 1 + e * 0.15);
      if (o.t > 0.5) {
        o.t = -1;
        o.m.scale.set(1, 1, 1);
      }
    }
  });
  const L = W.dyn.light;
  L.bm.material.opacity += ((L.on ? 0.16 + nightT * 0.2 : 0) - L.bm.material.opacity) * damp(3, dt);
  if (L.on) L.beam.rotation.y += dt * 0.8;
  W.dyn.xylo.xs.forEach((x) => {
    if (x.t > 0) {
      x.t = Math.max(0, x.t - dt * 1.2);
    }
    x.m.emissiveIntensity = 0.25 + x.t * 0.9;
    x.gl.material.opacity = x.t * 0.9;
  });
  if (
    PL.level === 'ground' &&
    boy.speed > 1 &&
    Math.hypot(bp.x - SHO_C.x, bp.z - SHO_C.z) < 36 &&
    Math.random() < dt * 10
  )
    spark(new V3(bp.x + rnd(-0.3, 0.3), 0.08, bp.z + rnd(-0.3, 0.3)), TEX.glow, pick([0x9fe8ff, 0xd8b8ff]), {
      add: true,
      v: new V3(0, 0.2, 0),
      life: 1.4,
      size: rnd(0.5, 0.9),
    });
  // star shards
  W.shards.forEach((s) => {
    if (s.found) return;
    s.g.rotation.y += dt * 1.8;
    s.g.position.y = s.y + Math.sin(t * 2 + s.ph) * 0.12;
    if (
      PL.level === 'ground' &&
      Math.abs(bp.x - s.x) < 1.3 &&
      Math.abs(bp.z - s.z) < 1.3 &&
      Math.abs(bp.y + 1 - s.g.position.y) < 2.5
    ) {
      s.found = true;
      s.g.visible = false;
      save.shards.push(s.i);
      persist();
      task('shard');
      AU.sfx('coin');
      updShardHUD();
      note('+1 星星碎片（可以在家里换家具）');
      for (let i = 0; i < 10; i++)
        spark(s.g.position.clone(), TEX.dot, 0xffe08a, {
          add: true,
          v: new V3(rnd(-1.5, 1.5), rnd(0, 2.5), rnd(-1.5, 1.5)),
          g: -2,
          life: 1,
          size: 0.3,
        });
    }
  });
  // waypoints light up when you walk by
  W.wps.forEach((w) => {
    if (!w.found && PL.level === 'ground' && Math.hypot(bp.x - w.x, bp.z - w.z) < 6) {
      w.found = true;
      save.wps.push(w.id);
      persist();
      AU.sfx('rune', 12);
      toast('传送花台', tr('「{z}」点亮了', { z: tr(w.name) }), '打开地图可以直接传送到这里', 2800);
    }
    w.gl.material.opacity = (w.found ? 0.55 + 0.25 * Math.sin(t * 2) : 0.12) * (1 - nightT * 0.45);
  });
}

/* pig path helpers: follow the boy's footsteps when the straight line is blocked */
function pickCrumb(p) {
  const T = PL.trail || [];
  for (let i = T.length - 1; i >= 0; i--) {
    const c = T[i];
    if (c.l !== PL.level) continue;
    if (clearLine(p.x, p.z, c.x, c.z, 0.3, PL.level)) return c;
  }
  let best = null,
    bd = 1e9;
  for (const c of T) {
    const d = Math.hypot(c.x - p.x, c.z - p.z);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}
function rescueSpot() {
  const T = PL.trail || [],
    b = boy.g.position;
  for (let i = T.length - 3; i >= 0; i--) {
    const c = T[i];
    if (c.l === PL.level && Math.hypot(c.x - b.x, c.z - b.z) > 1.3 && !solidAt(c.x, c.z, 0.45, PL.level)) return c;
  }
  return { x: b.x - Math.sin(boy.g.rotation.y) * 1.4, z: b.z - Math.cos(boy.g.rotation.y) * 1.4 };
}

function bugInter() {
  const o = nearBug();
  return o ? { id: 'bug', label: '捕蝴蝶', x: o.b.position.x, z: o.b.position.z, level: 'ground', bug: o } : null;
}
/* =================== keyboard router ===================
   One handler for every key so that dialogs, text fields, fishing and build mode can't leak shortcuts
   into the game underneath them. */
const isTyping = (el) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (isTyping(e.target)) {
    if (k === 'escape') e.target.blur();
    return;
  }
  const intro = $('#intro');
  if (!intro.classList.contains('hidden') && (k === 'enter' || k === ' ' || k === 'escape')) {
    e.preventDefault();
    intro.click();
    return;
  }
  const open = topModal();
  if (k === 'escape') {
    e.preventDefault();
    if (open) {
      closeTopModal();
      return;
    }
    if (!started) return;
    if (HOME.build) {
      homeEscape();
      return;
    }
    if (FS.on) {
      stopFish('收竿了。');
      return;
    }
    if (pigMenuOpen) {
      closePigMenu();
      return;
    }
    openSettings();
    return;
  }
  if (open || !started || paused) {
    return;
  }
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  keys[k] = true;
  if (FS.on) {
    if (k === ' ' || k === 'f' || k === 'e') {
      if (!e.repeat) fishPress(true);
    }
    return;
  }
  if (e.repeat) return;
  if (k === 'shift' && SET.runMode === 'toggle') {
    PL.runOn = !PL.runOn;
    note(PL.runOn ? '奔跑：开' : '奔跑：关');
    return;
  }
  if (HOME.build) {
    homeBuildKey(k);
    return;
  }
  if (pigMenuOpen && '01234567'.includes(k) && k !== '') {
    pigAct(['close', 'pet', 'feed', 'ball', 'carry', 'dance', 'trick', 'photo'][+k]);
    return;
  }
  if (k === ' ') doJump();
  else if (k === 'e') doUse();
  else if (k === 'q') sniff();
  else if (k === 'f') startFish();
  else if (k === 'n') toggleNight();
  else if (k === 'c') openWardrobe();
  else if (k === 'm') openMap();
  else if (k === 'j') openJournal();
  else if (k === 't') openTasks();
  else if (k === 'g') HOME.on ? leaveHome() : goHome();
  else if (k === 'b' && HOME.on) startBuild();
  else if (k === 'h') document.body.classList.toggle('clean');
});
addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = false;
  if (FS.on && (k === ' ' || k === 'f' || k === 'e')) fishPress(false);
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  if (FS.on) fishPress(false);
});
