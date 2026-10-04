/* =================== style kits =================== */
function makeKit(style) {
  const cache = new Map(),
    kit = { style, seg: style === 'night' ? 10 : 30 };
  kit.mat = (c, o) => {
    const k = c + '|' + (o ? JSON.stringify(o) : '');
    let m = cache.get(k);
    if (m) return m;
    if (style === 'cel') m = new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: toonGrad }, o || {}));
    else
      m = new THREE.MeshStandardMaterial(
        Object.assign(
          { color: c, roughness: style === 'night' ? 0.55 : 0.8, metalness: 0, flatShading: style === 'night' },
          o || {},
        ),
      );
    cache.set(k, m);
    return m;
  };
  kit.mesh = (g, c, o) => {
    const m = new THREE.Mesh(g, kit.mat(c, o));
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  kit.sphere = (r, d) =>
    style === 'night'
      ? new THREE.IcosahedronGeometry(r, d == null ? 2 : d)
      : new THREE.SphereGeometry(r, kit.seg, Math.round(kit.seg * 0.7));
  kit.ink = (obj, w = 0.022, color = 0x2e3a59) => {
    if (style !== 'cel') return obj;
    const om = outlineMat(color, w);
    const list = [];
    obj.traverse((n) => {
      if (n.isMesh && !n.userData.noInk && !n.userData.isInk) list.push(n);
    });
    list.forEach((n) => {
      let h;
      if (n.isInstancedMesh) {
        h = new THREE.InstancedMesh(n.geometry, om, n.count);
        h.instanceMatrix = n.instanceMatrix;
        h.frustumCulled = false;
      } else h = new THREE.Mesh(n.geometry, om);
      h.userData.isInk = true;
      h.layers.set(1);
      n.add(h);
    });
    return obj;
  };
  return kit;
}

/* =================== face =================== */
function face(kit, head, R, o) {
  const noInk = (m) => {
    m.userData.noInk = true;
    return m;
  };
  for (const s of [-1, 1]) {
    const x = s * o.ex,
      y = o.ey,
      z = Math.sqrt(Math.max(0.001, R * R - x * x - y * y));
    const n = new V3(x, y, z);
    const eg = onSurface(new THREE.Group(), n, R * 0.975);
    head.add(eg);
    const eye = noInk(kit.mesh(new THREE.SphereGeometry(o.er, 24, 18), o.eye || 0x2a2230, { roughness: 0.25 }));
    eye.scale.set(o.sx || 0.78, o.sy || 1.18, 0.42);
    eg.add(eye);
    if (o.iris) {
      const ir = noInk(kit.mesh(new THREE.SphereGeometry(o.er * 0.62, 20, 14), o.iris, { roughness: 0.3 }));
      ir.scale.set(0.9, 0.55, 0.3);
      ir.position.set(0, -o.er * 0.55, o.er * 0.14);
      eg.add(ir);
    }
    const hl = noInk(
      new THREE.Mesh(new THREE.SphereGeometry(o.er * 0.34, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })),
    );
    hl.position.set(o.er * 0.28 * s * -1 + o.er * 0.1, o.er * 0.42, o.er * 0.3);
    eg.add(hl);
    const hl2 = noInk(
      new THREE.Mesh(new THREE.SphereGeometry(o.er * 0.15, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })),
    );
    hl2.position.set(o.er * 0.2 * s, -o.er * 0.35, o.er * 0.3);
    eg.add(hl2);
    if (o.brow) {
      const bx = s * o.ex * 1.02,
        by = o.ey + o.er * 1.9,
        bz = Math.sqrt(Math.max(0.001, R * R - bx * bx - by * by));
      const bg = onSurface(new THREE.Group(), new V3(bx, by, bz), R * 0.99);
      const b = noInk(kit.mesh(capsule(0.014, 0.06, 8, 3), o.brow));
      b.rotation.z = Math.PI / 2 + s * 0.18;
      bg.add(b);
      head.add(bg);
    }
    const cx = s * R * 0.56,
      cy = o.ey - R * 0.3,
      cz = Math.sqrt(Math.max(0.001, R * R - cx * cx - cy * cy));
    const ck = noInk(
      new THREE.Mesh(
        new THREE.CircleGeometry(o.er * 1.25, 24),
        new THREE.MeshBasicMaterial({
          color: o.blush || 0xff9aa8,
          transparent: true,
          opacity: o.blushOp || 0.5,
          depthWrite: false,
        }),
      ),
    );
    onSurface(ck, new V3(cx, cy, cz), R * 1.004);
    ck.scale.set(1.25, 0.8, 1);
    head.add(ck);
  }
  if (o.mouth !== false) {
    const my = o.ey - R * 0.42,
      mz = Math.sqrt(R * R - my * my);
    const mg = onSurface(new THREE.Group(), new V3(0, my, mz), R * 0.99);
    const m = noInk(kit.mesh(new THREE.TorusGeometry(0.04, 0.011, 8, 18, Math.PI), o.mouthC || 0x8a3f52));
    m.rotation.z = Math.PI;
    mg.add(m);
    head.add(mg);
  }
}

/* =================== boy base =================== */
function boyBase(kit, o) {
  const g = new THREE.Group(),
    body = new THREE.Group();
  g.add(body);
  const legs = [],
    arms = [];
  for (const s of [-1, 1]) {
    const hip = P(new THREE.Group(), s * 0.11, 0.42, 0);
    hip.add(P(kit.mesh(capsule(0.085, 0.18), o.pants), 0, -0.15, 0));
    const sh = o.shoe(kit);
    sh.position.y = -0.33;
    hip.add(sh);
    body.add(hip);
    legs.push(hip);
  }
  const torso = o.torso(kit);
  torso.position.y = 0.36;
  body.add(torso);
  for (const s of [-1, 1]) {
    const sh = P(new THREE.Group(), s * 0.25, 0.86, 0);
    sh.add(P(kit.mesh(capsule(0.072, 0.2), o.sleeve), 0, -0.14, 0));
    if (o.cuff) sh.add(P(kit.mesh(new THREE.TorusGeometry(0.068, 0.022, 10, 20), o.cuff), 0, -0.27, 0)).children;
    const hand = P(kit.mesh(kit.sphere(0.075), o.skin), 0, -0.32, 0);
    sh.add(hand);
    sh.userData.hand = hand;
    sh.rotation.z = s * 0.16;
    body.add(sh);
    arms.push(sh);
  }
  arms.forEach((a) => {
    const c = a.children.find((ch) => ch.geometry && ch.geometry.type === 'TorusGeometry');
    if (c) c.rotation.x = Math.PI / 2;
  });
  body.add(P(kit.mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 16), o.skin), 0, 0.96, 0));
  const head = new THREE.Group(),
    R = 0.42;
  head.add(kit.mesh(kit.sphere(R), o.skin));
  for (const s of [-1, 1]) head.add(P(kit.mesh(kit.sphere(0.085, 1), o.skin), s * R * 0.96, -0.04, 0));
  face(kit, head, R, o.face);
  o.hair(kit, head, R);
  head.position.y = 1.28;
  body.add(head);
  return { g, body, legs, arms, head, R, phase: 0, speed: 0, wave: 0 };
}

/* =================== pig base =================== */
function pigBase(kit, o) {
  const g = new THREE.Group(),
    body = new THREE.Group();
  g.add(body);
  const tr = P(kit.mesh(kit.sphere(0.4), o.pink), 0, 0.5, 0);
  tr.scale.set(1, 0.9, 1.18);
  body.add(tr);
  const head = P(new THREE.Group(), 0, 0.74, 0.44);
  body.add(head);
  const R = 0.33;
  head.add(kit.mesh(kit.sphere(R), o.pink));
  const sn = P(kit.mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.13, kit.seg), o.snout), 0, -0.07, 0.3);
  sn.rotation.x = Math.PI / 2;
  head.add(sn);
  for (const s of [-1, 1]) {
    const n = P(kit.mesh(capsule(0.02, 0.03, 8, 3), o.nostril), s * 0.05, -0.07, 0.37);
    n.rotation.x = Math.PI / 2;
    n.userData.noInk = true;
    head.add(n);
  }
  face(kit, head, R, o.face);
  const ears = [];
  for (const s of [-1, 1]) {
    const eg = P(new THREE.Group(), s * 0.2, 0.24, -0.02);
    eg.rotation.set(-0.2, 0, -s * 0.55);
    const e = kit.mesh(new THREE.ConeGeometry(0.11, 0.2, kit.style === 'night' ? 4 : 20), o.pink);
    e.scale.z = 0.5;
    e.position.y = 0.08;
    eg.add(e);
    const ie = kit.mesh(new THREE.ConeGeometry(0.07, 0.13, kit.style === 'night' ? 4 : 16), o.snout);
    ie.scale.z = 0.3;
    ie.position.set(0, 0.06, 0.03);
    ie.userData.noInk = true;
    eg.add(ie);
    head.add(eg);
    ears.push(eg);
  }
  const legs = [];
  for (const [sx, sz] of [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ]) {
    const hip = P(new THREE.Group(), sx * 0.2, 0.3, sz * 0.25);
    hip.add(P(kit.mesh(capsule(0.08, 0.12), o.pink), 0, -0.12, 0));
    hip.add(P(kit.mesh(new THREE.CylinderGeometry(0.078, 0.082, 0.06, kit.seg), o.hoof), 0, -0.25, 0));
    body.add(hip);
    legs.push(hip);
  }
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2.4;
    pts.push(new V3(Math.cos(a) * 0.055 * (1 - i / 30), Math.sin(a) * 0.055 * (1 - i / 30) + 0.02, -i * 0.011));
  }
  const tail = P(
    kit.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.022, 8), o.snout),
    0,
    0.58,
    -0.47,
  );
  body.add(tail);
  return { g, body, head, legs, ears, tail, phase: 0, speed: 0, vy: 0, y: 0 };
}

/* =================== animation =================== */
function animBoy(c, t, dt) {
  const k = clamp(c.speed / 2.2, 0, 1.2);
  c.phase += dt * (2.5 + c.speed * 3.2);
  const sw = Math.sin(c.phase) * 0.7 * k;
  c.legs[0].rotation.x = sw;
  c.legs[1].rotation.x = -sw;
  c.arms[0].rotation.x = -sw * 0.85;
  c.arms[1].rotation.x = sw * 0.85;
  c.body.position.y = Math.abs(Math.sin(c.phase)) * 0.05 * k + (1 - Math.min(k, 1)) * Math.sin(t * 2) * 0.01;
  c.head.rotation.z = Math.sin(c.phase * 0.5) * 0.05 * k + Math.sin(t * 0.7) * 0.03 * (1 - k);
  c.head.rotation.y = Math.sin(t * 0.45) * 0.18 * (1 - k);
  if (c.wave > 0) {
    c.wave -= dt;
    c.arms[0].rotation.x = -2.6;
    c.arms[0].rotation.z = -0.3 + Math.sin(t * 12) * 0.25;
  } else c.arms[0].rotation.z += (-0.16 - c.arms[0].rotation.z) * damp(8, dt);
  if (c.extra) c.extra(t, dt, k);
}
function animPig(c, t, dt) {
  const k = clamp(c.speed / 2.5, 0, 1.3);
  c.phase += dt * (3 + c.speed * 3.6);
  const sw = Math.sin(c.phase) * 0.65 * k;
  c.legs[0].rotation.x = sw;
  c.legs[3].rotation.x = sw;
  c.legs[1].rotation.x = -sw;
  c.legs[2].rotation.x = -sw;
  c.body.position.y = Math.abs(Math.sin(c.phase)) * 0.04 * k;
  c.ears.forEach(
    (e, i) => (e.rotation.x = -0.2 + Math.sin(c.phase + i) * 0.22 * k + Math.sin(t * 2.6 + i * 1.7) * 0.06),
  );
  c.tail.rotation.z = Math.sin(t * (c.happy > 0 ? 22 : 5)) * 0.35;
  c.head.rotation.x = Math.sin(t * 0.9) * 0.05;
  c.head.rotation.y = Math.sin(t * 0.5 + 1) * 0.2 * (1 - Math.min(k, 1));
  if (c.extra) c.extra(t, dt, k);
}

/* =================== characters: 小夏 & 团子, three outfits =================== */
const OUTFITS = [
  { name: '雨天小黄帽', desc: '黄色雨衣、红伞，团子戴小雨帽。', sw: [0xffd23f, 0xe84a5f, 0x4f7cc9] },
  { name: '花园探险家', desc: '草帽背带裤、捕虫网，团子戴花环。', sw: [0x6aa84f, 0xe8c96a, 0xff8fb3] },
  { name: '星夜花仙', desc: '星星斗篷和萤火提灯，团子长出花瓣翅膀。', sw: [0x5a6ab8, 0xb58cff, 0xffd97a] },
];
function celBoy(kit, v = 0) {
  const skin = 0xffe4cf,
    hair = 0x2c2c44;
  const C = [
    { coat: 0xffd23f, cuff: 0xf2b92a, pants: 0x4a5a86, shoe: 0x4f7cc9, shoe2: 0x3d63a8 },
    { coat: 0xfff1dc, cuff: 0xe8d8bf, pants: 0x5a9a58, shoe: 0x8a5a3c, shoe2: 0x6e4a30 },
    { coat: 0x5a6ab8, cuff: 0xffd97a, pants: 0x3d4a7a, shoe: 0xb58cff, shoe2: 0x8a6ad0 },
  ][v];
  const c = boyBase(kit, {
    skin,
    pants: C.pants,
    sleeve: C.coat,
    cuff: C.cuff,
    shoe: (k) => {
      const g = new THREE.Group();
      g.add(P(k.mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 24), C.shoe), 0, 0.06, 0));
      g.add(P(k.mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 24), C.shoe2), 0, 0.16, 0));
      g.children[1].rotation.x = Math.PI / 2;
      const toe = k.mesh(k.sphere(0.1), C.shoe);
      toe.scale.set(1, 0.55, 1.3);
      toe.position.set(0, -0.03, 0.05);
      g.add(toe);
      return g;
    },
    torso: (k) => {
      const g = new THREE.Group();
      if (v === 0) {
        g.add(
          k.mesh(
            lathe([
              [0, -0.14],
              [0.33, -0.14],
              [0.34, -0.1],
              [0.31, 0.1],
              [0.28, 0.3],
              [0.25, 0.45],
              [0.19, 0.55],
              [0.12, 0.59],
              [0, 0.6],
            ]),
            C.coat,
          ),
        );
        for (let i = 0; i < 3; i++)
          g.add(
            P(
              k.mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 16), 0x2e3a59),
              0,
              0.4 - i * 0.16,
              0.3 - i * 0.005 + (i === 2 ? 0.02 : 0),
            ),
          );
        g.children.slice(1).forEach((b) => (b.rotation.x = Math.PI / 2));
        for (const s of [-1, 1]) {
          const pk = P(k.mesh(new THREE.BoxGeometry(0.14, 0.1, 0.02), 0xf2b92a), s * 0.18, 0.02, 0.29);
          pk.rotation.y = s * 0.5;
          g.add(pk);
        }
        const hood = k.mesh(new THREE.SphereGeometry(0.24, 24, 14, 0, TAU, 0, Math.PI * 0.5), C.coat, {
          side: THREE.DoubleSide,
        });
        hood.position.set(0, 0.56, -0.2);
        hood.rotation.x = -2.1;
        g.add(hood);
      } else if (v === 1) {
        g.add(
          k.mesh(
            lathe([
              [0, -0.02],
              [0.3, -0.02],
              [0.31, 0.1],
              [0.28, 0.3],
              [0.25, 0.45],
              [0.19, 0.55],
              [0.12, 0.59],
              [0, 0.6],
            ]),
            C.coat,
          ),
        );
        g.add(
          k.mesh(
            lathe([
              [0, -0.12],
              [0.32, -0.12],
              [0.325, 0.05],
              [0.31, 0.14],
              [0, 0.14],
            ]),
            C.pants,
          ),
        );
        const bib = P(k.mesh(new THREE.BoxGeometry(0.34, 0.28, 0.06), C.pants), 0, 0.26, 0.26);
        bib.rotation.x = -0.12;
        g.add(bib);
        const pk = P(k.mesh(new THREE.BoxGeometry(0.14, 0.1, 0.02), 0x4a8a48), 0, 0.26, 0.3);
        g.add(pk);
        for (const s of [-1, 1]) {
          const st = k.mesh(new THREE.BoxGeometry(0.06, 0.5, 0.03), C.pants);
          st.position.set(s * 0.13, 0.4, 0);
          st.scale.z = 1;
          const sg = new THREE.Group();
          sg.add(P(k.mesh(new THREE.BoxGeometry(0.06, 0.4, 0.03), C.pants), s * 0.13, 0.4, 0.24));
          sg.add(P(k.mesh(new THREE.BoxGeometry(0.06, 0.4, 0.03), C.pants), s * 0.13, 0.4, -0.24));
          g.add(sg);
          g.add(P(k.mesh(k.sphere(0.03), 0xffd23f), s * 0.13, 0.38, 0.3));
        }
        const sat = P(new THREE.Group(), 0.3, 0.1, -0.02);
        sat.add(k.mesh(new THREE.BoxGeometry(0.1, 0.22, 0.26), 0xb07a4a));
        sat.add(P(k.mesh(new THREE.BoxGeometry(0.11, 0.1, 0.27), 0x8a5a3c), 0, 0.07, 0));
        g.add(sat);
        const bs = k.mesh(new THREE.TorusGeometry(0.36, 0.018, 6, 30), 0x8a5a3c);
        bs.position.set(0.04, 0.36, 0);
        bs.rotation.set(0, Math.PI / 2, 0.75);
        g.add(bs);
      } else {
        g.add(
          k.mesh(
            lathe([
              [0, -0.24],
              [0.36, -0.24],
              [0.36, -0.18],
              [0.32, 0.1],
              [0.28, 0.3],
              [0.25, 0.45],
              [0.19, 0.55],
              [0.12, 0.59],
              [0, 0.6],
            ]),
            C.coat,
          ),
        );
        const hem = P(k.mesh(new THREE.TorusGeometry(0.36, 0.025, 8, 36), 0xffd97a), 0, -0.22, 0);
        hem.rotation.x = Math.PI / 2;
        g.add(hem);
        for (let i = 0; i < 3; i++) {
          const st = k.mesh(
            new THREE.ExtrudeGeometry(starShape(0.05, 0.022), { depth: 0.015, bevelEnabled: false }),
            0xffd97a,
            { emissive: 0xffb040, emissiveIntensity: 0.35 },
          );
          st.position.set(0, 0.38 - i * 0.17, 0.29 - i * 0.004);
          g.add(st);
        }
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU;
          const pt = k.mesh(new THREE.SphereGeometry(0.09, 10, 6), i % 2 ? 0xffc6d6 : 0xffe0ea);
          pt.scale.set(0.7, 0.25, 1.3);
          pt.position.set(Math.sin(a) * 0.2, 0.6, Math.cos(a) * 0.2);
          pt.rotation.set(0, a, 0);
          pt.rotateX(0.5);
          g.add(pt);
        }
      }
      return g;
    },
    face: {
      ex: 0.16,
      ey: -0.03,
      er: 0.072,
      sy: 1.35,
      sx: 0.72,
      iris: 0x5b86d6,
      brow: hair,
      blush: 0xff8d8d,
      blushOp: 0.55,
    },
    hair: (k, h, R) => {
      const cap = k.mesh(new THREE.SphereGeometry(R * 1.05, 30, 18, 0, TAU, 0, Math.PI * 0.55), hair);
      cap.rotation.x = -0.35;
      cap.position.set(0, 0.02, -0.02);
      h.add(cap);
      const spikes =
        v === 1
          ? [
              [0.38, 0.72, -0.12, 0.1, -1.1],
              [-0.38, 0.72, -0.12, 0.1, 1.1],
              [0.22, 0.7, -0.38, -1, -0.5],
              [-0.22, 0.7, -0.38, -1, 0.5],
            ]
          : [
              [0, 1.05, -0.05, -0.3, 0],
              [0.25, 0.95, -0.1, -0.2, -0.5],
              [-0.25, 0.95, -0.1, -0.2, 0.5],
              [0.38, 0.72, -0.12, 0.1, -1.1],
              [-0.38, 0.72, -0.12, 0.1, 1.1],
              [0, 0.85, -0.35, -0.9, 0],
              [0.22, 0.7, -0.38, -1, -0.5],
              [-0.22, 0.7, -0.38, -1, 0.5],
              [0.12, 0.95, 0.22, 0.6, -0.3],
            ];
      spikes.forEach(([x, y, z, rx, rz]) => {
        const sp = k.mesh(new THREE.ConeGeometry(0.11, 0.3, 20), hair);
        sp.position.set(x * R, y * R, z * R);
        sp.rotation.set(rx, 0, rz);
        h.add(sp);
      });
      for (let i = 0; i < 5; i++) {
        const a = -0.55 + i * 0.27;
        const f = k.mesh(new THREE.ConeGeometry(0.08, 0.22, 16), hair);
        f.position.set(Math.sin(a) * R * 0.8, R * 0.55, Math.cos(a) * R * 0.62);
        f.rotation.set(Math.PI * 0.85, 0, -a * 0.8);
        h.add(f);
      }
      const hl = k.mesh(new THREE.TorusGeometry(R * 0.85, 0.012, 6, 30, Math.PI * 0.5), 0x6f7aa8);
      hl.position.set(0, R * 0.3, -0.05);
      hl.rotation.set(-0.5, 0, Math.PI * 0.25);
      hl.userData.noInk = true;
      h.add(hl);
      if (v === 1) {
        const hat = P(new THREE.Group(), 0, R * 0.62, -0.02);
        hat.rotation.x = -0.18;
        hat.add(
          k.mesh(
            lathe([
              [0.001, 0],
              [0.3, 0],
              [0.62, -0.04],
              [0.66, -0.07],
              [0.3, -0.02],
              [0.001, -0.02],
            ]),
            0xe8c96a,
          ),
        );
        hat.add(P(k.mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.26, 24), 0xe8c96a), 0, 0.12, 0));
        const rb = P(k.mesh(new THREE.CylinderGeometry(0.315, 0.315, 0.07, 24), 0xe84a5f), 0, 0.04, 0);
        hat.add(rb);
        hat.add(P(k.mesh(k.sphere(0.07), 0xff8fb3), 0.28, 0.06, 0.12));
        hat.add(P(k.mesh(k.sphere(0.06), 0xffffff), 0.3, 0.06, 0.02));
        h.add(hat);
      }
      if (v === 2) {
        const hd = k.mesh(new THREE.SphereGeometry(R * 1.12, 28, 16, 0, TAU, 0, Math.PI * 0.5), 0xb58cff, {
          side: THREE.DoubleSide,
        });
        hd.position.set(0, 0.02, -0.1);
        hd.rotation.x = -1.25;
        h.add(hd);
        const ti = k.mesh(new THREE.ConeGeometry(0.12, 0.35, 16), 0xb58cff);
        ti.position.set(0, -0.12, -0.52);
        ti.rotation.x = -2.4;
        h.add(ti);
        h.add(P(k.mesh(k.sphere(0.06), 0xffd97a, { emissive: 0xffb040, emissiveIntensity: 0.6 }), 0, -0.32, -0.66));
      }
    },
  });
  const hand = c.arms[1].userData.hand,
    um = P(new THREE.Group(), 0, 0, 0.03);
  hand.add(um);
  if (v === 0) {
    um.rotation.set(3.94, 0, 0.18);
    um.add(P(kit.mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.05, 10), 0x8a8f9e), 0, 0.5, 0));
    const can = P(kit.mesh(new THREE.ConeGeometry(0.075, 0.72, 12), 0xe84a5f), 0, 0.62, 0);
    can.rotation.x = Math.PI;
    um.add(can);
    const bd = P(kit.mesh(new THREE.TorusGeometry(0.028, 0.006, 6, 12), 0xe84a5f), 0, 0.5, 0);
    bd.rotation.x = Math.PI / 2;
    um.add(bd);
    um.add(P(kit.mesh(new THREE.ConeGeometry(0.014, 0.06, 8), 0x8a8f9e), 0, 1.05, 0));
    const hk = P(kit.mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 16, Math.PI), 0x8a5a3c), 0.06, -0.02, 0);
    hk.rotation.z = Math.PI;
    um.add(hk);
  } else if (v === 1) {
    um.rotation.set(3.7, 0, 0.25);
    um.add(P(kit.mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.2, 8), 0xb07a4a), 0, 0.55, 0));
    const rg = P(kit.mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 24), 0xe8c96a), 0, 1.17, 0);
    rg.rotation.x = Math.PI / 2;
    um.add(rg);
    const net = P(
      kit.mesh(new THREE.ConeGeometry(0.2, 0.4, 16, 1, true), 0xffffff, {
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
      0,
      1.37,
      0,
    );
    net.userData.noInk = true;
    um.add(net);
  } else {
    um.rotation.set(0.4, 0, 0);
    um.add(P(kit.mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 8), 0x8a6ad0), 0, -0.2, 0));
    const lp = P(new THREE.Group(), 0, -0.42, 0);
    lp.add(
      kit.mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.18, 6), 0xfff2c2, { emissive: 0xffc860, emissiveIntensity: 1 }),
    );
    lp.add(P(kit.mesh(new THREE.ConeGeometry(0.12, 0.1, 6), 0x8a6ad0), 0, 0.14, 0));
    lp.add(P(kit.mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.04, 6), 0x8a6ad0), 0, -0.11, 0));
    um.add(lp);
    const gl = glow(0xffd070, 1.3, 0.7);
    gl.position.y = -0.42;
    um.add(gl);
  }
  c.arms[1].rotation.x = v === 2 ? -0.5 : -0.15;
  let cape = null;
  if (v === 2) {
    cape = P(new THREE.Group(), 0, 1.02, -0.16);
    const cm = kit.mesh(
      new THREE.CylinderGeometry(0.18, 0.42, 0.95, 20, 1, true, Math.PI * 0.55, Math.PI * 0.9),
      0xb58cff,
      { side: THREE.DoubleSide },
    );
    cm.position.y = -0.47;
    cm.rotation.y = Math.PI;
    cape.add(cm);
    c.body.add(cape);
    c.cape = cape;
  }
  c.extra = (t, dt, k) => {
    c.arms[1].rotation.x = (v === 2 ? -0.5 : -0.15) + Math.sin(c.phase) * 0.12 * k;
    if (cape) cape.rotation.x = -0.12 - k * 0.35 + Math.sin(t * 2.2) * 0.04;
  };
  return c;
}
function celPig(kit, v = 0) {
  const c = pigBase(kit, {
    pink: 0xffa3b5,
    snout: 0xff7f96,
    nostril: 0x6a2f3f,
    hoof: 0xe07a90,
    face: {
      ex: 0.13,
      ey: 0.05,
      er: 0.05,
      sy: 1.35,
      sx: 0.72,
      iris: 0x8a3b4b,
      blush: 0xff7a8a,
      blushOp: 0.55,
      mouth: false,
    },
  });
  if (v === 0) {
    const hat = P(new THREE.Group(), 0, 0.2, -0.02);
    hat.rotation.x = -0.15;
    c.head.add(hat);
    hat.add(P(kit.mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, TAU, 0, Math.PI / 2), 0xffd23f), 0, 0.04, 0));
    const brim = kit.mesh(
      lathe([
        [0.001, 0],
        [0.2, 0],
        [0.3, -0.04],
        [0.31, -0.06],
        [0.18, -0.02],
        [0.001, -0.02],
      ]),
      0xffd23f,
    );
    brim.position.y = 0.05;
    brim.scale.z = 1.1;
    hat.add(brim);
    const band = P(kit.mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 30), 0xf2b92a), 0, 0.06, 0);
    band.rotation.x = Math.PI / 2;
    hat.add(band);
    const kerch = P(kit.mesh(new THREE.ConeGeometry(0.16, 0.2, 3), 0xe84a5f), 0, 0.56, 0.45);
    kerch.rotation.set(Math.PI * 0.95, 0, 0);
    kerch.scale.z = 0.35;
    c.body.add(kerch);
    const knot = P(kit.mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 24), 0xe84a5f), 0, 0.66, 0.3);
    knot.rotation.x = Math.PI / 2 - 0.5;
    c.body.add(knot);
  } else if (v === 1) {
    const cr = P(new THREE.Group(), 0, 0.25, -0.03);
    cr.rotation.x = -0.28;
    c.head.add(cr);
    const vine = kit.mesh(new THREE.TorusGeometry(0.2, 0.022, 10, 40), 0x6aa84f);
    vine.rotation.x = Math.PI / 2;
    cr.add(vine);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const fc = [0xff8fb3, 0xffffff, 0xffd23f][i % 3];
      cr.add(P(kit.mesh(kit.sphere(0.05), fc), Math.cos(a) * 0.2, 0.02, Math.sin(a) * 0.2));
      if (i % 3 === 1) {
        const lf = P(
          kit.mesh(new THREE.SphereGeometry(0.05, 10, 6), 0x7cc85e),
          Math.cos(a + 0.3) * 0.21,
          0.0,
          Math.sin(a + 0.3) * 0.21,
        );
        lf.scale.set(1.5, 0.4, 0.8);
        cr.add(lf);
      }
    }
    const sc = P(kit.mesh(new THREE.TorusGeometry(0.27, 0.045, 10, 26), 0x7cc85e), 0, 0.66, 0.3);
    sc.rotation.x = Math.PI / 2 - 0.5;
    c.body.add(sc);
    for (const s of [-1, 1]) {
      const lf = P(kit.mesh(new THREE.SphereGeometry(0.09, 12, 8), 0x6aa84f), s * 0.07, 0.5, 0.52);
      lf.scale.set(0.6, 1.3, 0.25);
      lf.rotation.z = s * 0.35;
      c.body.add(lf);
    }
  } else {
    const wings = [];
    for (const s of [-1, 1]) {
      const w = P(new THREE.Group(), s * 0.14, 0.86, -0.1);
      for (const [len, ang, col] of [
        [0.34, 0.35, 0xffc6d6],
        [0.26, -0.15, 0xffe0ea],
      ]) {
        const p = kit.mesh(new THREE.SphereGeometry(0.16, 14, 10), col, { transparent: true, opacity: 0.85 });
        p.scale.set((len / 0.16) * 0.5, 0.9, 0.12);
        p.position.set(s * len * 0.5, Math.sin(ang) * 0.15, 0);
        p.rotation.z = s * ang;
        w.add(p);
      }
      w.rotation.y = s * 0.4;
      c.body.add(w);
      wings.push(w);
    }
    const clip = kit.mesh(
      new THREE.ExtrudeGeometry(starShape(0.07, 0.03), { depth: 0.02, bevelEnabled: false }),
      0xffd97a,
      { emissive: 0xffb040, emissiveIntensity: 0.4 },
    );
    clip.position.set(0.14, 0.3, 0.1);
    clip.rotation.set(-0.3, 0.3, 0);
    c.head.add(clip);
    const col_ = P(kit.mesh(new THREE.TorusGeometry(0.26, 0.025, 8, 24), 0x8a6ad0), 0, 0.66, 0.3);
    col_.rotation.x = Math.PI / 2 - 0.5;
    c.body.add(col_);
    c.body.add(P(kit.mesh(k_sphere(kit, 0.055), 0xffd97a), 0, 0.53, 0.52));
    c.wings = wings;
    c.extra = (t, dt, k) => {
      const f = Math.sin(t * (c.y > 0.05 ? 26 : 5)) * (c.y > 0.05 ? 0.6 : 0.18);
      wings[0].rotation.z = 0.2 + f;
      wings[1].rotation.z = -0.2 - f;
    };
  }
  return c;
}
function k_sphere(kit, r) {
  return kit.sphere(r);
}
