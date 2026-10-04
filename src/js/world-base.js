/* =================== world registry =================== */
const INKC = 0x2e3a59;
const W = {
  camCols: [],
  hills: [],
  wps: [],
  shards: [],
  lod: [],
  zones: [],
  seeds: [],
  inter: [],
  raised: [],
  upd: [],
  cols: { ground: [], deck: [] },
  night: [],
  dyn: {},
  mapShapes: [],
};
function raisedH(x, z) {
  let h = 0;
  for (const a of W.raised) {
    let e;
    if (a.seg) {
      const dx = a.x2 - a.x1,
        dz = a.z2 - a.z1,
        L = dx * dx + dz * dz,
        q = clamp(((x - a.x1) * dx + (z - a.z1) * dz) / L, 0, 1);
      e = a.r - Math.hypot(x - a.x1 - dx * q, z - a.z1 - dz * q);
    } else if (a.r) e = a.r - Math.hypot(x - a.x, z - a.z);
    else e = Math.min(a.w / 2 - Math.abs(x - a.x), a.d / 2 - Math.abs(z - a.z));
    if (e > 0) h = Math.max(h, a.h * Math.min(1, e / 0.45));
  }
  for (const q of W.hills) {
    const d = Math.hypot(x - q.x, z - q.z);
    if (d < q.r) h = Math.max(h, q.h * (0.5 + 0.5 * Math.cos((Math.PI * d) / q.r)));
  }
  return h;
}
function col(x, z, r, level = 'ground') {
  W.cols[level].push({ x, z, r });
}
function colLine(x1, z1, x2, z2, r, level = 'ground') {
  const L = Math.hypot(x2 - x1, z2 - z1),
    n = Math.max(1, Math.ceil(L / (r * 1.1)));
  for (let j = 0; j <= n; j++) {
    const q = j / n;
    W.cols[level].push({ x: x1 + (x2 - x1) * q, z: z1 + (z2 - z1) * q, r });
  }
}
function zone(id, name, x, z, r, line, color) {
  W.zones.push({ id, name, x, z, r, line, color, found: false });
}
function inter(o) {
  o.level = o.level || 'ground';
  o.r = o.r || 2;
  o.enabled = o.enabled || (() => true);
  W.inter.push(o);
  return o;
}
function nightGlow(obj, base, night) {
  W.night.push({ obj, base, night });
}

function rock(k, r, c, d = 1) {
  return k.mesh(jitterGeo(new THREE.IcosahedronGeometry(r, d), r * 0.28), c);
}
function roundTree(k, s, trunkC, leaves, n = 5) {
  const g = new THREE.Group();
  g.userData.camR = 1.4 * s;
  g.userData.camY = 2.3 * s;
  g.add(P(k.mesh(new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 1.6 * s, 10), trunkC), 0, 0.8 * s, 0));
  for (let i = 0; i < n; i++)
    g.add(
      P(
        k.mesh(k.sphere(rr(0.55, 0.85) * s), pick(leaves)),
        rr(-0.5, 0.5) * s,
        (1.9 + rr(0, 0.8)) * s,
        rr(-0.5, 0.5) * s,
      ),
    );
  return g;
}
function disc(k, x, z, r, h, c, edge) {
  const g = new THREE.Group();
  const d = P(k.mesh(new THREE.CylinderGeometry(r, r * 1.02, h + 0.3, 48), c), 0, h / 2 - 0.15, 0);
  d.castShadow = false;
  g.add(d);
  if (edge) {
    const n = Math.floor(r * 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rr(-0.05, 0.05);
      const s = rock(k, rr(0.28, 0.45), edge);
      s.scale.y = 0.55;
      s.position.set(Math.cos(a) * r, h * 0.4, Math.sin(a) * r);
      s.castShadow = false;
      g.add(s);
    }
  }
  g.position.set(x, 0, z);
  W.raised.push({ x, z, r, h });
  W.mapShapes.push({ t: 'c', x, z, r, c });
  return mergeGroup(g);
}
function rectPatch(k, x, z, w, d, h, c) {
  const m = P(k.mesh(new THREE.BoxGeometry(w, h + 0.3, d), c), x, h / 2 - 0.15, z);
  m.castShadow = false;
  W.raised.push({ x, z, w, d, h });
  W.mapShapes.push({ t: 'r', x, z, w, d, c });
  return m;
}
/* =================== waterfalls ===================
   Each fall is a curved front sheet plus a darker back sheet (so it reads as a body of water, not a card),
   a short stream on top, a rounded lip, foam at the plunge pool, spray and mist. The water is shaded by
   FALLU.light, which applyEnv() lowers at night, so it never turns into a glowing white column. */
const FALLU = { time: { value: 0 }, light: { value: 1 }, night: { value: 0 } };
function fallTex() {
  const t = ctex(
    256,
    (g, w, h) => {
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * w,
          ww = 1.5 + Math.random() * 5,
          y = Math.random() * h,
          hh = 40 + Math.random() * 150,
          a = 0.25 + Math.random() * 0.75;
        const gr = g.createLinearGradient(0, y, 0, y + hh);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, `rgba(255,255,255,${a})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        for (const dy of [0, -h, h]) {
          g.fillRect(x, y + dy, ww, hh);
          if (x + ww > w) g.fillRect(x - w, y + dy, ww, hh);
        }
      }
    },
    128,
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData = { keep: true };
  return t;
}
let FALL_TEX = null;
function fallMat(o) {
  if (!FALL_TEX) FALL_TEX = fallTex();
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        speed: { value: o.speed },
        rep: { value: new V2(o.rx, o.ry) },
        alpha: { value: o.alpha },
        deep: { value: new THREE.Color(o.deep) },
        shallow: { value: new THREE.Color(o.shallow) },
        foam: { value: new THREE.Color(0xf4fbff) },
        flow: { value: o.flow || 0 },
      },
    ]),
    vertexShader: `varying vec2 vUv;varying float vEdge;
      #include <fog_pars_vertex>
      void main(){vUv=uv;vEdge=1.-abs(uv.x*2.-1.);vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D map;uniform float time,speed,alpha,light,night,flow;uniform vec2 rep;uniform vec3 deep,shallow,foam;varying vec2 vUv;varying float vEdge;
      #include <fog_pars_fragment>
      void main(){vec2 uv=vUv*rep;vec2 d=flow>.5?vec2(0.,-time*speed):vec2(0.,time*speed);
        float a1=texture2D(map,uv+d).r, a2=texture2D(map,vec2(uv.x*1.63+.37,uv.y*.71)+d*1.37).r;
        float st=a1*.6+a2*.4;
        float base=flow>.5?0.:smoothstep(.72,1.,1.-vUv.y);
        vec3 c=mix(deep,shallow,st);
        c=mix(c,foam,clamp(base*.75+pow(st,2.5)*.45,0.,1.));
        c*=light; c=mix(c,c*vec3(.72,.84,1.12),night);
        float a=alpha*(.72+.28*st)*smoothstep(0.,.14,vEdge)*(flow>.5?smoothstep(0.,.25,vUv.y):1.);
        gl_FragColor=vec4(c,a);
        #include <fog_fragment>
      }`,
  });
  m.uniforms.map = { value: FALL_TEX };
  m.uniforms.time = FALLU.time;
  m.uniforms.light = FALLU.light;
  m.uniforms.night = FALLU.night;
  return m;
}
/* curved curtain: bulges toward +z and leaves the lip with a little forward throw */
function fallSheet(w, h, bulge, throwZ, mat) {
  const geo = new THREE.PlaneGeometry(w, h, 14, 28),
    p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2),
      v = (p.getY(i) + h / 2) / h;
    p.setZ(i, bulge * (1 - x * x) + Math.pow(v, 7) * throwZ + Math.sin(v * 9 + x * 2) * 0.04);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}
function waterfall(k, parent, base, x, yTop, z, w, h, ry, o = {}) {
  const g = P(new THREE.Group(), x, 0, z);
  g.rotation.y = ry;
  g.userData.dynamic = true;
  const sp = (3.2 / h) * 2.2,
    ry_ = (h / Math.max(4, w)) * 0.9;
  const front = fallSheet(
    w,
    h,
    0.55,
    1.25,
    fallMat({ speed: sp, rx: Math.max(1, w / 4), ry: ry_, alpha: 0.9, deep: 0x4a9fd8, shallow: 0xb8e6ff }),
  );
  front.position.y = yTop - h / 2;
  front.renderOrder = 2;
  front.userData.noInk = true;
  g.add(front);
  const back = fallSheet(
    w * 0.92,
    h,
    0.2,
    0.9,
    fallMat({ speed: sp * 0.8, rx: Math.max(1, w / 5), ry: ry_ * 0.8, alpha: 0.85, deep: 0x2f7fb8, shallow: 0x8ccbf0 }),
  );
  back.position.set(0, yTop - h / 2, -0.45);
  back.renderOrder = 1;
  back.userData.noInk = true;
  g.add(back);
  // stream on top of the cliff feeding the fall
  const sl = o.stream == null ? 5 : o.stream;
  if (sl > 0) {
    const st = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.9, sl, 6, 6),
      fallMat({
        speed: 0.35,
        rx: Math.max(1, w / 4),
        ry: sl / 4,
        alpha: 0.92,
        deep: 0x3f93cf,
        shallow: 0x9fd8ff,
        flow: 1,
      }),
    );
    st.rotation.x = -Math.PI / 2;
    st.position.set(0, yTop + 0.06, 0.9 - sl / 2);
    st.userData.noInk = true;
    g.add(st);
  }
  const lip = P(k.mesh(capsule(0.2, w * 0.9, 10, 3), 0xd8f0ff), 0, yTop, 0.95);
  lip.rotation.z = Math.PI / 2;
  lip.castShadow = false;
  g.add(lip);
  // plunge pool foam
  const foam = new THREE.Group(),
    fs = Math.max(0.6, w / 5),
    n = Math.round(10 + w * 1.5);
  for (let i = 0; i < n; i++) {
    const f = k.mesh(k.sphere(rr(0.3, 0.62) * fs), i % 3 ? 0xffffff : 0xe6f5ff);
    f.castShadow = false;
    f.position.set(rr(-w * 0.55, w * 0.55), rr(-0.05, 0.3), rr(-0.3, 1.2));
    f.userData.ph = R() * TAU;
    foam.add(f);
  }
  g.add(foam);
  const fpad = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  fpad.rotation.x = -Math.PI / 2;
  fpad.scale.set(w * 0.75, w * 0.42, 1);
  fpad.position.set(0, 0.04, 0.7);
  fpad.userData.noInk = true;
  g.add(fpad);
  // mist: normal blending and dimmed at night
  const mist = [];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }),
    );
    s.scale.set(w * 2, w * 1.2, 1);
    s.position.set(rr(-w * 0.35, w * 0.35), 0.8 + i * 0.7, 1.1);
    g.add(s);
    mist.push(s);
  }
  // spray droplets
  const N = 60,
    sp_ = new Float32Array(N * 3),
    life = new Float32Array(N),
    vel = new Float32Array(N * 3);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp_, 3));
  const sm = new THREE.PointsMaterial({
    map: TEX.dot,
    size: 0.22,
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const spray = new THREE.Points(sg, sm);
  spray.frustumCulled = false;
  g.add(spray);
  for (let i = 0; i < N; i++) life[i] = -Math.random();
  parent.add(k.ink(g, 0.015));
  let rt = 0;
  const wp = new V3();
  W.upd.push((tt, dt) => {
    const nt = typeof nightT === 'number' ? nightT : 0;
    foam.children.forEach((f) => {
      const q = 1 + Math.sin(tt * 4 + f.userData.ph) * 0.09;
      f.scale.set(q, q * 0.9, q);
    });
    mist.forEach((s, i) => {
      s.material.opacity = (0.26 + 0.1 * Math.sin(tt * 1.3 + i * 2)) * (1 - nt * 0.65);
      s.material.color.setRGB(1 - nt * 0.45, 1 - nt * 0.38, 1 - nt * 0.2);
    });
    sm.opacity = 0.75 * (1 - nt * 0.5);
    fpad.material.color.setRGB(0.92 - nt * 0.5, 0.96 - nt * 0.45, 1 - nt * 0.3);
    sm.color.setRGB(1 - nt * 0.45, 1 - nt * 0.35, 1 - nt * 0.15);
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      life[i] -= dt;
      if (life[i] <= 0) {
        life[i] = rr(0.5, 1.1);
        sp_[j] = rr(-w * 0.45, w * 0.45);
        sp_[j + 1] = 0.1;
        sp_[j + 2] = rr(0.2, 0.9);
        vel[j] = rr(-0.8, 0.8);
        vel[j + 1] = rr(1.6, 3.4);
        vel[j + 2] = rr(0.4, 1.6);
      }
      vel[j + 1] -= 6 * dt;
      sp_[j] += vel[j] * dt;
      sp_[j + 1] = Math.max(0, sp_[j + 1] + vel[j + 1] * dt);
      sp_[j + 2] += vel[j + 2] * dt;
    }
    sg.attributes.position.needsUpdate = true;
    rt -= dt;
    if (rt < 0) {
      rt = 0.18;
      g.localToWorld(wp.set(rr(-w * 0.45, w * 0.45), 0, rr(0.4, 1.2)));
      addRipple(wp.x, wp.z, 0.9);
    }
  });
  return g;
}
function makeSeed(k) {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const body = k.mesh(
    lathe(
      [
        [0, -0.26],
        [0.12, -0.2],
        [0.16, -0.05],
        [0.13, 0.1],
        [0.06, 0.22],
        [0, 0.28],
      ],
      20,
    ),
    0xe9ff9a,
    { emissive: 0xb8ff5a, emissiveIntensity: 0.9 },
  );
  g.add(body);
  for (const s of [-1, 1]) {
    const lf = k.mesh(new THREE.SphereGeometry(0.09, 12, 8), 0x7cc85e, { emissive: 0x3a8a2a, emissiveIntensity: 0.4 });
    lf.scale.set(1.5, 0.35, 0.7);
    lf.position.set(s * 0.1, 0.33, 0);
    lf.rotation.z = s * 0.5;
    g.add(lf);
  }
  g.add(glow(0xd8ff8a, 2.2, 0.8));
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.35, 14, 8, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xe6ff9a,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beam.position.y = 6.5;
  g.add(beam);
  mergeGroup(g);
  return k.ink(g, 0.014);
}
function seed(k, id, name, x, y, z, hidden, level = 'ground') {
  const g = makeSeed(k);
  g.position.set(x, y, z);
  g.visible = !hidden;
  const s = { id, name, g, x, y, z, level, hidden: !!hidden, found: false, ph: R() * TAU, rise: 0 };
  W.seeds.push(s);
  return s;
}
function revealSeed(id) {
  const s = W.seeds.find((q) => q.id === id);
  if (s && s.hidden) {
    s.hidden = false;
    s.g.visible = true;
    s.rise = 1;
    s.g.scale.setScalar(0.01);
  }
  return s;
}

/* =================== the great tree =================== */
const DECK_Y = 16.1,
  LIFT = { x: 0, z: 8.2 };
function buildTree(k, root) {
  const T = new THREE.Group(),
    bark = [0x8a6a55, 0x7a5c4a, 0x967560, 0x6e5242];
  T.add(P(k.mesh(new THREE.CylinderGeometry(3.4, 4.6, 32, 18, 4), 0x7a5c4a), 0, 15, 0));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU,
      pts = [];
    for (let j = 0; j <= 6; j++) {
      const tw = a + j * 0.28,
        rad = (j === 0 ? 5.1 : 4.1 - j * 0.12) + Math.sin(j + i) * 0.25;
      pts.push(new V3(Math.cos(tw) * rad, j * 5.4 - 0.5, Math.sin(tw) * rad));
    }
    T.add(k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 1.15 - (i % 3) * 0.15, 10), bark[i % 4]));
  }
  for (const a of [0.6, 1.15, 1.7, 2.3, 2.85, 3.4, 3.95, 4.5, 4.9, 5.85]) {
    const L = rr(13, 15.5),
      hy = rr(3.6, 4.6);
    const pts = [
      new V3(Math.sin(a) * 3.6, 4.8, Math.cos(a) * 3.6),
      new V3(Math.sin(a) * 7.5, hy + 0.6, Math.cos(a) * 7.5),
      new V3(Math.sin(a + 0.08) * (L - 2.5), hy - 0.8, Math.cos(a + 0.08) * (L - 2.5)),
      new V3(Math.sin(a + 0.12) * L, -0.7, Math.cos(a + 0.12) * L),
    ];
    T.add(k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, rr(0.8, 1.1), 10), pick(bark)));
    for (let m = 0; m < 3; m++) {
      const q = pts[1].clone().lerp(pts[2], m / 3);
      const ms = k.mesh(k.sphere(rr(0.4, 0.6)), pick([0x6fbf5a, 0x5aa84e]));
      ms.scale.y = 0.4;
      ms.position.copy(q).add(new V3(0, 0.85, 0));
      T.add(ms);
    }
    col(Math.sin(a + 0.12) * L, Math.cos(a + 0.12) * L, 1.3);
  }
  col(0, 0, 5.6);
  for (let y = 2; y < 34; y += 4) W.camCols.push({ x: 0, y, z: 0, r: 5.2 });
  // round door with tiny lantern
  const dr = P(new THREE.Group(), 0, 0, 4.75);
  dr.add(P(k.mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.2, 28), 0x8a5a3c), 0, 1.2, 0)).children;
  dr.children[0].rotation.x = Math.PI / 2;
  const fr = P(k.mesh(new THREE.TorusGeometry(1.08, 0.13, 10, 32), 0x6e5242), 0, 1.2, 0.08);
  dr.add(fr);
  for (let i = -2; i <= 2; i++)
    dr.add(P(k.mesh(new THREE.BoxGeometry(0.05, 1.9, 0.04), 0x6e4a30), i * 0.36, 1.1, 0.12));
  dr.add(P(k.mesh(k.sphere(0.08), 0xffcf4a), 0.55, 1.1, 0.16));
  dr.add(P(k.mesh(new THREE.BoxGeometry(1.6, 0.05, 0.7), 0xc8a070), 0, 0.05, 0.6));
  const dl = P(new THREE.Group(), 1.5, 2.2, 0.35);
  dl.add(
    P(
      k.mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.3, 8), 0xffe6a8, { emissive: 0xffb050, emissiveIntensity: 1 }),
      0,
      0,
      0,
    ),
  );
  const dlg = glow(0xffc070, 1.6, 0.6);
  dl.add(dlg);
  dr.add(dl);
  nightGlow(dlg, 0.6, 1);
  T.add(dr);
  // branches up to canopy
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.2,
      L = rr(12, 20),
      y = rr(27, 31);
    T.add(
      k.mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new V3(Math.cos(a) * 2, y - 5, Math.sin(a) * 2),
            new V3(Math.cos(a) * L * 0.5, y + 1, Math.sin(a) * L * 0.5),
            new V3(Math.cos(a) * L, y + rr(5, 9), Math.sin(a) * L),
          ]),
          28,
          0.7,
          8,
        ),
        pick(bark),
      ),
    );
  }
  // deck ring
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    const pl = k.mesh(new THREE.BoxGeometry(5.1, 0.18, 1.05), pick([0xc08a58, 0xb07a4a, 0xcc9868]));
    pl.position.set(Math.cos(a) * 7.85, DECK_Y - 0.09, Math.sin(a) * 7.85);
    pl.rotation.y = -a;
    T.add(pl);
  }
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    T.add(
      P(
        k.mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), 0x8a5a3c),
        Math.cos(a) * 10.3,
        DECK_Y + 0.45,
        Math.sin(a) * 10.3,
      ),
    );
  }
  const rail = P(k.mesh(new THREE.TorusGeometry(10.3, 0.08, 6, 96), 0x8a5a3c), 0, DECK_Y + 0.9, 0);
  rail.rotation.x = Math.PI / 2;
  T.add(rail);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.15;
    const s = new V3(Math.cos(a) * 4.2, DECK_Y - 5.2, Math.sin(a) * 4.2),
      e = new V3(Math.cos(a) * 9.6, DECK_Y - 0.25, Math.sin(a) * 9.6);
    const b = k.mesh(new THREE.CylinderGeometry(0.16, 0.16, s.distanceTo(e), 8), 0x8a5a3c);
    b.position.copy(s).lerp(e, 0.5);
    b.lookAt(e);
    b.rotateX(Math.PI / 2);
    T.add(b);
  }
  // treehouse on the deck
  const th = P(new THREE.Group(), -8, DECK_Y, 0);
  th.rotation.y = Math.PI / 2;
  th.add(P(k.mesh(new THREE.BoxGeometry(3.4, 2.4, 2.8), 0xf3dfc0), 0, 1.2, 0));
  for (const x of [-1.7, 1.7]) th.add(P(k.mesh(new THREE.BoxGeometry(0.16, 2.5, 0.16), 0x8a5a3c), x, 1.25, 1.42));
  th.add(P(k.mesh(new THREE.BoxGeometry(3.5, 0.16, 0.16), 0x8a5a3c), 0, 2.4, 1.42));
  const rf = k.mesh(new THREE.ConeGeometry(2.8, 2, 4), 0xe8604a);
  rf.rotation.y = Math.PI / 4;
  rf.position.y = 3.4;
  rf.scale.z = 0.9;
  th.add(rf);
  th.add(P(k.mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), 0xb07a67), 0.9, 3.9, -0.4));
  const win = P(
    k.mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20), 0xfff2c2, { emissive: 0xffc860, emissiveIntensity: 0.7 }),
    -0.8,
    1.4,
    1.42,
  );
  win.rotation.x = Math.PI / 2;
  th.add(win);
  th.add(P(k.mesh(new THREE.TorusGeometry(0.44, 0.06, 8, 20), 0x8a5a3c), -0.8, 1.4, 1.46));
  th.add(P(k.mesh(new THREE.BoxGeometry(0.8, 1.5, 0.06), 0x8a5a3c), 0.75, 0.75, 1.42));
  const thg = P(glow(0xffcf70, 3.5, 0.4), -0.8, 1.4, 2);
  th.add(thg);
  nightGlow(thg, 0.4, 1.1);
  for (let i = 0; i < 5; i++)
    th.add(P(k.mesh(k.sphere(0.14), pick([0xff9ec4, 0xffe066, 0xffffff])), -1.4 + i * 0.3, 0.95, 1.55));
  th.add(P(k.mesh(new THREE.BoxGeometry(1.6, 0.18, 0.25), 0x8a5a3c), -0.8, 0.82, 1.55));
  T.add(th);
  col(-8, 0, 2.3, 'deck');
  // lantern string along the rail + bunting
  const bun = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU + 0.07;
    const x = Math.cos(a) * 10.3,
      z = Math.sin(a) * 10.3;
    const c = pick([0xffe08a, 0xffb3c6, 0xb8f0ff]);
    T.add(P(k.mesh(k.sphere(0.1), c, { emissive: c, emissiveIntensity: 0.8 }), x, DECK_Y + 1.25, z));
    const gg = P(glow(c, 0.9, 0.35), x, DECK_Y + 1.25, z);
    T.add(gg);
    nightGlow(gg, 0.35, 0.95);
  }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU;
    const f = k.mesh(new THREE.ConeGeometry(0.16, 0.34, 3), pick([0xe84a5f, 0xffd23f, 0x4f7cc9, 0x7cc85e, 0xfff1d6]));
    f.position.set(
      Math.cos(a) * 10.3,
      DECK_Y + 1.65 - 0.15 * Math.abs(Math.sin((i / 2) * Math.PI)),
      Math.sin(a) * 10.3,
    );
    f.rotation.set(Math.PI, -a, 0);
    f.scale.z = 0.25;
    T.add(f);
  }
  // canopy (merged on its own)
  const cano = new THREE.Group();
  const greens = [0x6fbf5a, 0x8fd16a, 0x5aa84e, 0x7cc85e, 0x66b451];
  for (let i = 0; i < 52; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * 23,
      y = 38 + rr(-3, 6) * (1 - d / 30) + Math.cos(((d / 23) * Math.PI) / 2) * 5;
    const cr_ = rr(5, 8.5),
      s = k.mesh(k.sphere(cr_), pick(greens), { emissive: 0xffc070, emissiveIntensity: 0.04 });
    s.position.set(Math.cos(a) * d, y, Math.sin(a) * d);
    W.camCols.push({ x: s.position.x, y, z: s.position.z, r: cr_ + 0.6 });
    s.castShadow = true;
    cano.add(s);
  }
  for (let i = 0; i < 22; i++) {
    const a = R() * TAU,
      d = rr(8, 22);
    const s = k.mesh(k.sphere(rr(3.5, 5.5)), 0x4f9448);
    s.position.set(Math.cos(a) * d, rr(31.5, 34), Math.sin(a) * d);
    cano.add(s);
  }
  mergeGroup(cano);
  cano.userData.dynamic = true;
  T.add(cano);
  // glowing fruits
  const fr_ = [],
    fg = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.34, 16, 12),
      k.mat(0xffe08a, { emissive: 0xffb040, emissiveIntensity: 0.9 }),
      72,
    ),
    dm = new THREE.Object3D(),
    lines = [],
    gl = [];
  for (let i = 0; i < 72; i++) {
    const a = R() * TAU,
      d = rr(5, 21),
      top = rr(31, 34),
      L = rr(1, 3.6);
    const p = new V3(Math.cos(a) * d, top - L, Math.sin(a) * d);
    fr_.push(p);
    dm.position.copy(p);
    dm.updateMatrix();
    fg.setMatrixAt(i, dm.matrix);
    lines.push(p.x, p.y, p.z, p.x, top, p.z);
    gl.push(p.x, p.y, p.z);
  }
  fg.frustumCulled = false;
  fg.userData.dynamic = true;
  T.add(fg);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  T.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5a4a3a })));
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3));
  const pm = new THREE.PointsMaterial({
    map: TEX.glow,
    color: 0xffd070,
    size: 3,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(pg, pm);
  pts.frustumCulled = false;
  T.add(pts);
  nightGlow(pts, 0.5, 1);
  // finale blossoms (hidden until the end)
  const BL = 240,
    bl = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 14, 10),
      k.mat(0xffb3c6, { emissive: 0xff8fb0, emissiveIntensity: 0.15 }),
      BL,
    ),
    blP = [];
  for (let i = 0; i < BL; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * 26,
      low = i % 5 === 0,
      y = low ? rr(31, 33.5) : 46 + Math.cos((Math.min(1, d / 26) * Math.PI) / 2) * 9 + rr(-1, 1.5);
    blP.push({ p: new V3(Math.cos(a) * d, y, Math.sin(a) * d), s: rr(1.4, 2.8), d: R() * 1.5 });
    dm.position.copy(blP[i].p);
    dm.scale.setScalar(0.001);
    dm.updateMatrix();
    bl.setMatrixAt(i, dm.matrix);
  }
  bl.frustumCulled = false;
  bl.userData.dynamic = true;
  T.add(bl);
  W.dyn.blossom = { mesh: bl, list: blP, t: -1 };
  // wind chimes above the deck
  const br = k.mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new V3(2.8, 21, -2.2), new V3(5.5, 21.6, -4.4), new V3(7.6, 21.2, -6.3)]),
      16,
      0.28,
      8,
    ),
    0x7a5c4a,
  );
  T.add(br);
  const ch = P(new THREE.Group(), 7.2, 20.9, -6);
  ch.userData.dynamic = true;
  ch.add(P(k.mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16), 0x8a5a3c), 0, 0, 0));
  const tubes = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU,
      L = 0.6 + i * 0.16;
    const pv = P(new THREE.Group(), Math.cos(a) * 0.38, -0.05, Math.sin(a) * 0.38);
    pv.add(
      P(
        k.mesh(new THREE.CylinderGeometry(0.045, 0.045, L, 10), 0xbfe8ff, {
          emissive: 0x6ab8e0,
          emissiveIntensity: 0.2,
        }),
        0,
        -0.45 - L / 2,
        0,
      ),
    );
    pv.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new V3(0, 0, 0), new V3(0, -0.45, 0)]),
        new THREE.LineBasicMaterial({ color: INKC }),
      ),
    );
    ch.add(pv);
    tubes.push(pv);
  }
  ch.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new V3(0, 0, 0), new V3(0, 0.35, 0)]),
      new THREE.LineBasicMaterial({ color: INKC }),
    ),
  );
  T.add(ch);
  W.dyn.chime = { g: ch, tubes, energy: 0 };
  // lift: pulley, ropes and basket
  const pul = P(k.mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 20), 0x6e5a4a), LIFT.x, 23.2, LIFT.z);
  T.add(pul);
  T.add(
    k.mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new V3(2, 23.5, 2.5), new V3(0.8, 23.8, 6), new V3(0, 23.5, 8.2)]),
        12,
        0.22,
        8,
      ),
      0x7a5c4a,
    ),
  );
  const bk = P(new THREE.Group(), LIFT.x, 0, LIFT.z);
  bk.userData.dynamic = true;
  bk.add(
    P(k.mesh(new THREE.CylinderGeometry(1.15, 1, 0.9, 20, 1, true), 0xc89a5a, { side: THREE.DoubleSide }), 0, 0.45, 0),
  );
  bk.add(P(k.mesh(new THREE.CylinderGeometry(1, 1, 0.08, 20), 0xa0784a), 0, 0.04, 0));
  const rim = P(k.mesh(new THREE.TorusGeometry(1.15, 0.07, 8, 28), 0x8a5a3c), 0, 0.9, 0);
  rim.rotation.x = Math.PI / 2;
  bk.add(rim);
  for (let i = 0; i < 3; i++) {
    const b = P(k.mesh(new THREE.TorusGeometry(1.08, 0.03, 6, 28), 0xa0784a), 0, 0.25 + i * 0.22, 0);
    b.rotation.x = Math.PI / 2;
    bk.add(b);
  }
  const lamp = P(
    k.mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.26, 8), 0xffe6a8, { emissive: 0xffb050, emissiveIntensity: 1 }),
    0.9,
    1.2,
    0,
  );
  bk.add(lamp);
  mergeGroup(bk);
  T.add(bk);
  const ropeG = new THREE.BufferGeometry();
  ropeG.setAttribute('position', new THREE.Float32BufferAttribute(new Array(24).fill(0), 3));
  const rope = new THREE.LineSegments(ropeG, new THREE.LineBasicMaterial({ color: 0x6e5a4a }));
  rope.frustumCulled = false;
  T.add(rope);
  W.dyn.lift = { g: bk, rope, y: 0, target: 0, moving: false };
  // swing under a low branch
  T.add(
    k.mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new V3(-3.4, 9.5, 2.4), new V3(-8, 8.8, 5.5), new V3(-12.8, 8.5, 8.7)]),
        20,
        0.45,
        8,
      ),
      0x7a5c4a,
    ),
  );
  const sw = P(new THREE.Group(), -11.5, 8.45, 7.9);
  sw.userData.dynamic = true;
  for (const s of [-1, 1])
    sw.add(P(k.mesh(new THREE.CylinderGeometry(0.025, 0.025, 7.8, 6), 0xe6d2bf), s * 0.42, -3.9, 0));
  sw.add(P(k.mesh(new THREE.BoxGeometry(1.1, 0.1, 0.42), 0xc08a58), 0, -7.85, 0));
  mergeGroup(sw);
  T.add(sw);
  W.dyn.swing = { g: sw, amp: 0.05, sit: false, ph: 0 };
  col(-11.5 + 0.45, 7.9, 0.2);
  col(-11.5 - 0.45, 7.9, 0.2);
  mergeGroup(T);
  root.add(k.ink(T, 0.012));
  W.mapShapes.push({ t: 'tree' });
  zone('tree', '巨树', 0, 0, 17, '抬头看，树冠像另一片天空。', '#6fbf5a');
  inter({ id: 'door', x: 0, z: 5.9, r: 1.8, label: '敲敲树洞门' });
  inter({ id: 'liftUp', x: LIFT.x, z: LIFT.z, r: 1.9, label: '乘升降篮上树', enabled: () => !W.dyn.lift.moving });
  inter({
    id: 'liftDown',
    x: LIFT.x,
    z: LIFT.z,
    r: 1.9,
    label: '乘升降篮下去',
    level: 'deck',
    enabled: () => !W.dyn.lift.moving,
  });
  inter({ id: 'chime', x: 6.9, z: -5.8, r: 2.3, label: '摇响风铃', level: 'deck' });
  inter({ id: 'swing', x: -11.5, z: 7.9, r: 1.6, label: '荡秋千' });
  seed(k, 'deck', '树上木台', -4.2, DECK_Y + 1, -7.2, false, 'deck');
}
