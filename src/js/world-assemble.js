/* =================== horizon =================== */
function buildHorizon(k, root) {
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU + rr(-0.2, 0.2),
      d = rr(520, 640);
    const g = new THREE.Group(),
      m = 12 + Math.floor(R() * 7);
    for (let j = 0; j < m; j++) {
      const lv = j / m,
        r = rr(0.8, 1.4) * (1 - lv * 0.45);
      const s = k.mesh(k.sphere(r), 0xfffaf0, { emissive: 0xffc88a, emissiveIntensity: 0.08 });
      s.castShadow = s.receiveShadow = false;
      s.position.set(rr(-1.3, 1.3) * (1 - lv * 0.5), lv * 4.2 + rr(-0.2, 0.2), rr(-0.8, 0.8));
      g.add(s);
    }
    const s = rr(18, 30);
    g.scale.setScalar(s);
    g.position.set(Math.cos(a) * d, -14, Math.sin(a) * d);
    mergeGroup(g);
    root.add(k.ink(g, 0.012));
  }
  const hills = new THREE.Group();
  for (let i = 0; i < 22; i++) {
    const a = R() * TAU,
      d = rr(360, 470),
      s = rr(22, 48);
    const h = k.mesh(new THREE.SphereGeometry(1, 24, 10, 0, TAU, 0, Math.PI / 2), pick([0x7fbf7a, 0x8fcf8a, 0x6fae6a]));
    h.scale.set(s, s * rr(0.3, 0.5), s);
    h.position.set(Math.cos(a) * d, -0.5, Math.sin(a) * d);
    h.castShadow = false;
    hills.add(h);
    for (let t = 0; t < 3; t++) {
      const tr = roundTree(k, rr(4, 7), 0x7a5c4a, [0x5aa84e, 0x6fbf5a], 3);
      tr.position.set(h.position.x + rr(-s * 0.5, s * 0.5), s * 0.2, h.position.z + rr(-s * 0.5, s * 0.5));
      tr.traverse((n) => {
        if (n.isMesh) n.castShadow = false;
      });
      hills.add(tr);
    }
  }
  mergeGroup(hills);
  root.add(k.ink(hills, 0.01));
}

/* =================== wildlife =================== */
function butterfly(k, c) {
  const b = new THREE.Group(),
    wl = new THREE.Group(),
    wr = new THREE.Group();
  for (const [w, s] of [
    [wl, -1],
    [wr, 1],
  ]) {
    const up = k.mesh(new THREE.CircleGeometry(0.13, 14), c, { side: THREE.DoubleSide });
    up.scale.set(1, 0.8, 1);
    up.position.set(s * 0.12, 0, 0.04);
    up.rotation.x = -Math.PI / 2;
    w.add(up);
    const lo = k.mesh(new THREE.CircleGeometry(0.08, 12), c, { side: THREE.DoubleSide });
    lo.position.set(s * 0.08, 0, -0.09);
    lo.rotation.x = -Math.PI / 2;
    w.add(lo);
    const dt = k.mesh(new THREE.CircleGeometry(0.03, 8), 0xffffff, { side: THREE.DoubleSide });
    dt.position.set(s * 0.14, 0.003, 0.05);
    dt.rotation.x = -Math.PI / 2;
    w.add(dt);
  }
  mergeGroup(wl);
  mergeGroup(wr);
  b.add(wl, wr);
  const bd = k.mesh(capsule(0.018, 0.14, 6, 3), INKC);
  bd.rotation.x = Math.PI / 2;
  b.add(bd);
  return { b: k.ink(b, 0.01), wl, wr };
}
function rabbit(k, c) {
  const g = new THREE.Group(),
    body = new THREE.Group();
  g.add(body);
  const b = k.mesh(k.sphere(0.26), c);
  b.scale.set(0.9, 0.8, 1.15);
  b.position.y = 0.26;
  body.add(b);
  const hd = P(new THREE.Group(), 0, 0.46, 0.26);
  body.add(hd);
  hd.add(k.mesh(k.sphere(0.17), c));
  for (const s of [-1, 1]) {
    const e = k.mesh(capsule(0.05, 0.26, 10, 4), c);
    e.position.set(s * 0.07, 0.27, -0.02);
    e.rotation.set(-0.2, 0, s * 0.15);
    hd.add(e);
    const ei = k.mesh(capsule(0.025, 0.2, 8, 3), 0xffb3c6);
    ei.position.set(s * 0.07, 0.28, 0.02);
    ei.rotation.set(-0.2, 0, s * 0.15);
    ei.userData.noInk = true;
    hd.add(ei);
    const ey = P(k.mesh(k.sphere(0.028), 0x2e3a59), s * 0.08, 0.04, 0.14);
    ey.userData.noInk = true;
    hd.add(ey);
  }
  hd.add(P(k.mesh(k.sphere(0.025), 0xff8fa3), 0, -0.02, 0.17));
  body.add(P(k.mesh(k.sphere(0.09), 0xffffff), 0, 0.3, -0.3));
  hd.userData.dynamic = true;
  mergeGroup(body);
  hd.userData.dynamic = false;
  mergeGroup(hd);
  return { g: k.ink(g, 0.012), body, hd };
}
function buildLife(k, root) {
  // butterflies around flower zones
  const bfs = [];
  const centers = [
    [46, 8],
    [32, -26],
    [28, 42],
    [-56, -4],
    [-32, 16],
    [0, 20],
    [-27, 42],
    [82, -40],
    [-6, 94],
    [-82, 30],
    [68, 66],
  ];
  for (let i = 0; i < 26; i++) {
    const c = centers[i % centers.length];
    const ci = Math.floor(R() * 6),
      o = butterfly(k, [0xffd23f, 0xff8a5b, 0x8fb8ff, 0xffffff, 0xff9ec4, 0xb58cff][ci]);
    o.ci = ci;
    root.add(o.b);
    bfs.push(
      Object.assign(o, {
        cx: c[0] + rr(-5, 5),
        cz: c[1] + rr(-5, 5),
        r: rr(1, 2.6),
        h: rr(0.5, 2),
        sp: rr(0.35, 0.8),
        ph: R() * TAU,
        follow: 0,
        pos: new V3(),
      }),
    );
  }
  W.dyn.bfs = bfs;
  // rabbits
  const rbs = [];
  for (const [x, z, r] of [
    [32, -26, 8],
    [34, -22, 8],
    [28, 42, 7],
    [-56, -4, 6],
    [-32, 16, 5],
    [26, 38, 7],
    [-82, 30, 8],
    [94, 14, 5],
    [-6, 94, 7],
  ]) {
    const o = rabbit(k, pick([0xffffff, 0xe8d2b8, 0xd9c2a8]));
    o.g.position.set(x, raisedH(x, z), z);
    root.add(o.g);
    rbs.push(Object.assign(o, { hx: x, hz: z, hr: r, t: rr(1, 3), hop: null }));
  }
  W.dyn.rabbits = rbs;
  // jumping fish
  const fish = [];
  for (let i = 0; i < 2; i++) {
    const f = new THREE.Group();
    const b = k.mesh(k.sphere(0.22), 0xff8a5b);
    b.scale.set(0.6, 0.8, 1.8);
    f.add(b);
    const t = P(k.mesh(new THREE.ConeGeometry(0.2, 0.35, 4), 0xff8a5b), 0, 0, -0.5);
    t.rotation.x = -Math.PI / 2;
    t.scale.x = 0.25;
    f.add(t);
    f.add(P(k.mesh(k.sphere(0.08), 0xffffff), 0, 0.12, 0.1));
    f.visible = false;
    mergeGroup(f);
    root.add(k.ink(f, 0.012));
    fish.push({ g: f, t: -1, wait: rr(2, 6), a: new V3(), b: new V3() });
  }
  W.dyn.fish = fish;
  // birds circling the canopy
  const birds = [];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Group(),
      wl = new THREE.Group(),
      wr = new THREE.Group();
    wl.add(P(k.mesh(new THREE.BoxGeometry(0.8, 0.04, 0.2), INKC), -0.4, 0, 0));
    wr.add(P(k.mesh(new THREE.BoxGeometry(0.8, 0.04, 0.2), INKC), 0.4, 0, 0));
    b.add(wl, wr, k.mesh(new THREE.BoxGeometry(0.14, 0.12, 0.45), INKC));
    root.add(b);
    birds.push({ b, wl, wr, a: i * 0.35, r: 30 + i * 1.2, h: 52 + i * 0.6, ph: R() * TAU });
  }
  W.dyn.birds = birds;
  // particles
  const ff = particles({
    type: 'drift',
    n: 600,
    r: 115,
    y0: 0.4,
    y1: 7,
    size: 0.26,
    color: 0xe6ff8a,
    op: 1,
    speed: 0.7,
  });
  ff.material.opacity = 0;
  root.add(ff);
  W.dyn.fireflies = ff;
  const pollen = particles({ type: 'drift', n: 360, r: 110, y0: 0.3, y1: 6, size: 0.12, color: 0xfff2c0, op: 0.8 });
  root.add(pollen);
  W.dyn.pollen = pollen;
  const seeds = particles({
    type: 'drift',
    n: 120,
    r: 50,
    y0: 0.6,
    y1: 8,
    size: 0.32,
    tex: TEX.seed,
    color: 0xffffff,
    op: 0.9,
    normal: true,
    speed: 0.5,
  });
  root.add(seeds);
  W.upd.push(ff.userData.update, pollen.userData.update, seeds.userData.update);
  // dandelion seed burst pool
  const N = 500,
    pos = new Float32Array(N * 3).fill(-999),
    vel = new Float32Array(N * 3),
    life = new Float32Array(N);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({
    map: TEX.seed,
    size: 0.35,
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
  });
  const pp = new THREE.Points(g, pm);
  pp.frustumCulled = false;
  root.add(pp);
  W.dyn.puff = { pos, vel, life, g, next: 0, N };
}

/* =================== assemble =================== */
function buildWorld(k, root) {
  const wrap = (fn, x, z, far = 175) => {
    const n0 = root.children.length;
    fn(k, root);
    const add = root.children.slice(n0),
      g = new THREE.Group();
    add.forEach((c) => g.add(c));
    root.add(g);
    W.lod.push({ g, x, z, far });
  };
  buildTree(k, root);
  wrap(buildCliff, 0, -58, 230);
  wrap(buildRunes, RUNE_C.x, RUNE_C.z);
  wrap(buildRing, RING_C.x, RING_C.z);
  wrap(buildDandelions, DAND_C.x, DAND_C.z);
  wrap(buildTulips, TUL_C.x, TUL_C.z);
  wrap(buildOrchard, ORCH_C.x, ORCH_C.z);
  wrap(buildPond, POND_C.x, POND_C.z, 120);
  wrap(buildCottage, COT_C.x, COT_C.z);
  wrap(buildLavender, LAV_C.x, LAV_C.z);
  wrap(buildMaze, MAZE_C.x, MAZE_C.z, 190);
  wrap(buildGrove, GROVE_C.x, GROVE_C.z, 190);
  wrap(buildShrine, SHR_C.x, SHR_C.z, 200);
  wrap(buildBalloon, BAL_C.x, BAL_C.z, 210);
  wrap(buildVillage, VIL_C.x, VIL_C.z, 190);
  wrap(buildWindmill, MILL_C.x, MILL_C.z, 230);
  wrap(buildLake, LAKE_C.x, LAKE_C.z, 170);
  buildSkyIslands(k, root);
  buildHorizon(k, root);
  buildLife(k, root);
  wrap(
    (k, r) => {
      grassField(k, r, -32, 16, 7, 0.14, 240);
      grassField(k, r, -38, -26, 8, 0.16, 120);
      grassField(k, r, VIL_C.x, VIL_C.z, 11.5, 0.2, 260);
      grassField(k, r, BAL_C.x, BAL_C.z, 6.8, 0.2, 160);
      grassField(k, r, MILL_C.x, MILL_C.z, 6.8, 0.25, 160);
    },
    0,
    0,
    1e9,
  );
  inter({
    id: 'pick',
    x: TUL_C.x - 7.6,
    z: TUL_C.z + 3,
    r: 1.8,
    label: '摘一朵郁金香',
    enabled: () => !W.dyn.hasFlower && !W.dyn.shrine.done,
  });
  buildOuter(k, root, wrap);
  W.seeds.forEach((s) => root.add(s.g));
}
