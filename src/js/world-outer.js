/* =================== helpers for the outer world =================== */
function hill(k, x, z, r, h, c) {
  const prof = [[r + 0.6, -0.4]],
    n = 16;
  for (let i = 0; i <= n; i++) {
    const d = r * (1 - i / n);
    prof.push([Math.max(0.001, d), h * (0.5 + 0.5 * Math.cos((Math.PI * d) / r))]);
  }
  const m = k.mesh(lathe(prof, 40), c);
  m.position.set(x, 0, z);
  m.castShadow = false;
  W.hills.push({ x, z, r, h });
  W.mapShapes.push({ t: 'c', x, z, r, c });
  return m;
}
function pathSeg(k, x1, z1, x2, z2, r, h, c) {
  const g = new THREE.Group(),
    L = Math.hypot(x2 - x1, z2 - z1);
  const b = k.mesh(new THREE.BoxGeometry(r * 2, h + 0.3, L), c);
  b.position.set((x1 + x2) / 2, h / 2 - 0.15, (z1 + z2) / 2);
  b.rotation.y = Math.atan2(x2 - x1, z2 - z1);
  g.add(b);
  for (const [x, z] of [
    [x1, z1],
    [x2, z2],
  ])
    g.add(P(k.mesh(new THREE.CylinderGeometry(r, r, h + 0.3, 20), c), x, h / 2 - 0.15, z));
  g.traverse((n) => {
    if (n.isMesh) n.castShadow = false;
  });
  W.raised.push({ seg: true, x1, z1, x2, z2, r, h });
  W.mapShapes.push({ t: 'l', x1, z1, x2, z2, r, c });
  return g;
}
function waypoint(k, root, id, name, x, z, found) {
  const y = raisedH(x, z),
    g = P(new THREE.Group(), x, y, z);
  g.add(P(k.mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.5, 10), 0xd9cfbf), 0, 0.25, 0));
  g.add(P(k.mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.1, 8), 0xcfc4b2), 0, 1, 0));
  const fl = P(new THREE.Group(), 0, 1.75, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const p = k.mesh(new THREE.ConeGeometry(0.16, 0.7, 5), 0xc8f4ff, { emissive: 0x7fdfff, emissiveIntensity: 0.35 });
    p.position.set(Math.cos(a) * 0.22, 0.25, Math.sin(a) * 0.22);
    p.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
    fl.add(p);
  }
  fl.add(P(k.mesh(k.sphere(0.14), 0xfff4c0, { emissive: 0xffd070, emissiveIntensity: 0.8 }), 0, 0.2, 0));
  g.add(fl);
  const gl = P(glow(0x9fe8ff, 3.2, found ? 0.8 : 0.15), 0, 2, 0);
  g.add(gl);
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  col(x, z, 0.95);
  W.wps.push({ id, name, x, z, y, found: !!found, gl });
}
function shard(k, root, x, z, yOff = 1.1) {
  const y = raisedH(x, z) + yOff,
    g = P(new THREE.Group(), x, y, z);
  g.userData.dynamic = true;
  g.add(
    k.mesh(
      new THREE.ExtrudeGeometry(starShape(0.28, 0.13), {
        depth: 0.1,
        bevelEnabled: true,
        bevelSize: 0.03,
        bevelThickness: 0.03,
        bevelSegments: 1,
      }),
      0xffe07a,
      { emissive: 0xffb040, emissiveIntensity: 0.7 },
    ),
  );
  g.children[0].position.z = -0.05;
  mergeGroup(g);
  k.ink(g, 0.012);
  g.add(glow(0xffe08a, 1.6, 0.7));
  root.add(g);
  W.shards.push({ x, y, z, g, found: false, ph: R() * TAU, i: W.shards.length });
}
function flowerGeo(c, s = 1) {
  return partsGeo([
    [new THREE.CylinderGeometry(0.012, 0.016, 0.42 * s, 3, 1, true), 0x6aa84f, [0, 0.21 * s, 0]],
    [new THREE.SphereGeometry(0.1 * s, 7, 4), c, [0, 0.44 * s, 0], [0, 0, 0], [1, 0.45, 1]],
    [new THREE.SphereGeometry(0.04 * s, 5, 3), 0xffe066, [0, 0.47 * s, 0]],
  ]);
}
function scatter(n, cx, cz, r, fn) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * r,
      x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d;
    const v = fn ? fn(x, z) : true;
    if (v !== false) out.push([x, raisedH(x, z), z, R() * TAU, rr(0.85, 1.25)]);
  }
  return out;
}
function tex1(draw, s = 128) {
  const t = ctex(s, draw);
  t.userData = {};
  return t;
}

/* =================== A. 花海丘陵 rolling flower hills =================== */
const HILL_C = { x: -165, z: -160 };
function buildHills(k, root) {
  const g = new THREE.Group();
  const H = [
    [-165, -160, 34, 8.5],
    [-202, -133, 26, 6],
    [-133, -188, 28, 6.5],
    [-195, -195, 22, 5],
    [-128, -138, 20, 4.5],
    [-170, -118, 16, 3.5],
  ];
  H.forEach(([x, z, r, h], i) => g.add(hill(k, x, z, r, h, [0x9ccf6a, 0xa8d977, 0x8fcf6a][i % 3])));
  mergeGroup(g);
  root.add(k.ink(g, 0.01));
  const cols = [0xffb3c6, 0xfff4e6, 0xa8d8ff, 0xffe066, 0xc9a6ff],
    inH = (x, z) => H.some(([hx, hz, r]) => Math.hypot(x - hx, z - hz) < r * 0.93);
  cols.forEach((c, ti) => {
    const list = [];
    for (let i = 0; i < 1400 && list.length < 380; i++) {
      const a = R() * TAU,
        d = Math.sqrt(R()) * 56,
        x = HILL_C.x + Math.cos(a) * d,
        z = HILL_C.z + Math.sin(a) * d;
      if (!inH(x, z)) continue;
      const ty = Math.floor(((Math.sin(x * 0.045) + Math.cos(z * 0.052) + 2) / 4) * 5 * 0.999);
      if (ty !== ti && R() > 0.15) continue;
      list.push([x, raisedH(x, z), z, R() * TAU, rr(0.9, 1.35)]);
    }
    root.add(flora(flowerGeo(c), list, 0.12, true, 0.009));
  });
  const grass = [];
  for (let i = 0; i < 2600 && grass.length < 1100; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * 56,
      x = HILL_C.x + Math.cos(a) * d,
      z = HILL_C.z + Math.sin(a) * d;
    if (inH(x, z)) grass.push([x, raisedH(x, z), z, R() * TAU, rr(0.9, 1.5)]);
  }
  root.add(
    flora(
      partsGeo([
        [new THREE.ConeGeometry(0.04, 0.4, 3, 1, true), 0x8fcf5e, [0, 0.2, 0], [0, 0, 0.15]],
        [new THREE.ConeGeometry(0.035, 0.32, 3, 1, true), 0x7fbf55, [0.04, 0.16, 0.02], [0, 0, -0.3]],
      ]),
      grass,
      0.2,
      false,
    ),
  );
  // lone tree with a swing on the tallest hill
  const tx = -165,
    tz = -160,
    ty = raisedH(tx, tz);
  const t = new THREE.Group();
  t.add(
    P(
      k.mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(0.4, 3, 0.2), new V3(-0.2, 6, 0), new V3(0.3, 8, 0.1)]),
          16,
          0.55,
          8,
        ),
        0x7a5c4a,
      ),
      0,
      0,
      0,
    ),
  );
  for (let i = 0; i < 9; i++)
    t.add(P(k.mesh(k.sphere(rr(2.2, 3.2)), pick([0x6fbf5a, 0x8fd16a, 0x7cc85e])), rr(-3, 3), rr(8, 11), rr(-3, 3)));
  t.add(
    k.mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new V3(0, 6.5, 0), new V3(2.5, 7.2, 1), new V3(4.8, 7, 2)]),
        10,
        0.28,
        8,
      ),
      0x7a5c4a,
    ),
  );
  for (const s of [-0.4, 0.4])
    t.add(P(k.mesh(new THREE.CylinderGeometry(0.02, 0.02, 5.8, 5), 0xe6d2bf), 4.3 + s, 4.05, 2));
  t.add(P(k.mesh(new THREE.BoxGeometry(1.1, 0.1, 0.42), 0xc08a58), 4.3, 1.15, 2));
  t.position.set(tx, ty - 0.2, tz);
  W.camCols.push({ x: tx, y: ty + 9.5, z: tz, r: 5 });
  mergeGroup(t);
  root.add(k.ink(t, 0.012));
  col(tx, tz, 0.8);
  inter({
    id: 'hswing',
    x: tx + 4.3,
    z: tz + 2,
    r: 1.6,
    label: '坐在山顶的秋千上',
    act: () =>
      sitOn('bench', {
        x: tx + 4.3,
        y: raisedH(tx + 4.3, tz + 2) + 0.55,
        z: tz + 2,
        ry: 0,
        sx: tx + 4.3,
        sz: tz + 3.4,
        rock: 0.5,
        line: '风从山坡上吹下来……好舒服。',
      }),
  });
  // kite
  const kite = new THREE.Group();
  const km = new THREE.Shape();
  km.moveTo(0, 1);
  km.lineTo(0.7, 0);
  km.lineTo(0, -1.3);
  km.lineTo(-0.7, 0);
  km.closePath();
  kite.add(k.mesh(new THREE.ShapeGeometry(km), 0xe84a5f, { side: THREE.DoubleSide }));
  kite.add(P(k.mesh(new THREE.BoxGeometry(0.05, 2.2, 0.05), 0xffffff), 0, -0.1, 0.02));
  kite.add(P(k.mesh(new THREE.BoxGeometry(1.35, 0.05, 0.05), 0xffffff), 0, 0, 0.02));
  const tail = [];
  for (let i = 0; i < 6; i++) {
    const b = k.mesh(new THREE.ConeGeometry(0.12, 0.25, 3), [0xffd23f, 0x4f7cc9, 0x7cc85e][i % 3]);
    b.position.y = -1.5 - i * 0.45;
    kite.add(b);
    tail.push(b);
  }
  kite.visible = false;
  root.add(k.ink(kite, 0.012));
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  line.frustumCulled = false;
  line.visible = false;
  root.add(line);
  W.dyn.kite = { g: kite, line, tail, on: false, pos: new V3() };
  inter({
    id: 'kite',
    x: tx - 2,
    z: tz + 3,
    r: 2.4,
    label: '放风筝',
    act: () => {
      const K = W.dyn.kite;
      K.on = !K.on;
      K.g.visible = K.line.visible = K.on;
      if (K.on) {
        K.pos.copy(boy.g.position).add(new V3(0, 2, 0));
        AU.sfx('whoosh');
        say('风筝飞起来了！跑起来它会飞得更高！', 3);
      } else say('把风筝收回来啦。', 2);
    },
  });
  const pt = particles({
    type: 'fall',
    n: 220,
    r: 55,
    cx: HILL_C.x,
    cz: HILL_C.z,
    y0: 0,
    y1: 16,
    size: 0.3,
    tex: TEX.petal,
    color: 0xffd0dc,
    op: 0.9,
    normal: true,
  });
  root.add(pt);
  W.upd.push(pt.userData.update);
  waypoint(k, root, 'hills', '花海丘陵', -140, -128);
  [
    [-150, -150],
    [-195, -130],
    [-133, -190],
    [-196, -196],
    [-172, -117],
  ].forEach(([x, z]) => shard(k, root, x, z, 1.2));
  zone('hills', '花海丘陵', HILL_C.x, HILL_C.z, 48, '整座山都开满了花……我们在这里走一走吧。', '#ffb3c6');
}

/* =================== B. 樱花长堤 sakura causeway =================== */
const SAK_P = [
  [112, 178],
  [146, 164],
  [180, 146],
  [210, 122],
  [236, 92],
];
function buildSakura(k, root) {
  const g = new THREE.Group();
  for (let i = 0; i < SAK_P.length - 1; i++)
    g.add(pathSeg(k, SAK_P[i][0], SAK_P[i][1], SAK_P[i + 1][0], SAK_P[i + 1][1], 2.6, 0.25, 0xd9cfbf));
  g.add(disc(k, 244, 82, 9, 0.3, 0x9ccf6a, 0xbdb2a0));
  const trees = [];
  for (let i = 0; i < SAK_P.length - 1; i++) {
    const [x1, z1] = SAK_P[i],
      [x2, z2] = SAK_P[i + 1],
      L = Math.hypot(x2 - x1, z2 - z1),
      nx = -(z2 - z1) / L,
      nz = (x2 - x1) / L;
    for (let q = 4; q < L - 2; q += 8)
      for (const s of [-1, 1]) {
        const x = x1 + ((x2 - x1) * q) / L + nx * s * 5.4,
          z = z1 + ((z2 - z1) * q) / L + nz * s * 5.4;
        trees.push([x, z]);
      }
  }
  trees.forEach(([x, z], i) => {
    g.add(disc(k, x, z, 2, 0.22, 0x9ccf6a, null));
    const t = new THREE.Group();
    t.add(
      k.mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new V3(0, 0, 0),
            new V3(0.3, 1.5, 0.1),
            new V3(-0.2, 2.8, 0.2),
            new V3(0.4, 3.8, 0),
          ]),
          12,
          0.28,
          7,
        ),
        0x5a4040,
      ),
    );
    for (let j = 0; j < 6; j++)
      t.add(
        P(
          k.mesh(k.sphere(rr(1.3, 2)), pick([0xffc6d6, 0xffb3c6, 0xffe0ea, 0xffd0dc]), {
            emissive: 0xff9ab8,
            emissiveIntensity: 0.06,
          }),
          rr(-1.6, 1.6),
          rr(3.6, 5.2),
          rr(-1.6, 1.6),
        ),
      );
    t.position.set(x, 0.2, z);
    t.rotation.y = R() * TAU;
    g.add(t);
    col(x, z, 0.5);
    W.camCols.push({ x, y: 4.6, z, r: 3.2 });
    if (i % 3 === 0) {
      const l = P(new THREE.Group(), x + (i % 2 ? 1.2 : -1.2), 0.2, z);
      l.add(P(k.mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.3, 6), 0xbdb2a0), 0, 0.15, 0));
      l.add(P(k.mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 6), 0xbdb2a0), 0, 0.7, 0));
      l.add(
        P(
          k.mesh(new THREE.BoxGeometry(0.6, 0.45, 0.6), 0xfff2c2, { emissive: 0xffc860, emissiveIntensity: 0.8 }),
          0,
          1.3,
          0,
        ),
      );
      l.add(P(k.mesh(new THREE.ConeGeometry(0.55, 0.4, 4), 0xa39a8e), 0, 1.72, 0));
      const lg = P(glow(0xffc070, 2.2, 0.15), 0, 1.3, 0);
      l.add(lg);
      nightGlow(lg, 0.12, 0.95);
      g.add(l);
    }
  });
  // petals floating on the water
  const pw = [];
  for (let i = 0; i < 500; i++) {
    const t = R(),
      seg = Math.min(3, Math.floor(t * 4)),
      f = t * 4 - seg,
      [x1, z1] = SAK_P[seg],
      [x2, z2] = SAK_P[seg + 1];
    const x = x1 + (x2 - x1) * f + rr(-14, 14),
      z = z1 + (z2 - z1) * f + rr(-14, 14);
    if (raisedH(x, z) > 0) continue;
    pw.push([x, 0.02, z, R() * TAU, rr(0.7, 1.3)]);
  }
  const pg = partsGeo([[new THREE.CircleGeometry(0.14, 6), 0xffc6d6, [0, 0, 0], [-Math.PI / 2, 0, 0], [1, 1.4, 1]]]);
  root.add(flora(pg, pw, 0, false));
  // wish tree
  const wt = new THREE.Group();
  wt.add(
    k.mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(0.6, 3, 0.3), new V3(-0.4, 6, 0), new V3(0.2, 8, 0.2)]),
        16,
        0.75,
        8,
      ),
      0x5a4040,
    ),
  );
  for (let j = 0; j < 14; j++)
    wt.add(
      P(
        k.mesh(k.sphere(rr(2, 3.2)), pick([0xffc6d6, 0xffb3c6, 0xffe0ea]), {
          emissive: 0xff9ab8,
          emissiveIntensity: 0.08,
        }),
        rr(-3.5, 3.5),
        rr(7, 11),
        rr(-3.5, 3.5),
      ),
    );
  wt.position.set(244, 0.3, 82);
  g.add(wt);
  col(244, 82, 1);
  W.camCols.push({ x: 244, y: 9.3, z: 82, r: 5.6 });
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const rib = new THREE.Group();
  const ribs = [];
  for (let i = 0; i < 36; i++) {
    const a = R() * TAU,
      d = rr(2.5, 4.5);
    const m = k.mesh(new THREE.BoxGeometry(0.12, 1.1, 0.02), pick([0xe84a5f, 0xffffff, 0xffd23f, 0x8fb8ff, 0xb58cff]), {
      side: THREE.DoubleSide,
    });
    m.position.set(244 + Math.cos(a) * d, rr(5.2, 6.8), 82 + Math.sin(a) * d);
    m.rotation.y = R() * TAU;
    m.visible = false;
    rib.add(m);
    ribs.push(m);
  }
  rib.userData.dynamic = true;
  root.add(rib);
  W.dyn.wish = { ribs, n: 0 };
  inter({
    id: 'wish',
    x: 244,
    z: 85.5,
    r: 2.6,
    label: '在许愿树上系一条丝带',
    act: () => {
      const Wd = W.dyn.wish;
      if (Wd.n < Wd.ribs.length) {
        Wd.ribs[Wd.n].visible = true;
        Wd.n++;
        save.wish = Wd.n;
        persist();
      }
      AU.sfx('chimeTap', rnd(0, 12) | 0);
      AU.sfx('rustle');
      say(rpick(['希望团子每天都开心。', '希望巨树年年开花！', '希望明天也是好天气。', '希望我们一直在一起。']), 3);
    },
  });
  inter({
    id: 'sbench',
    x: 180,
    z: 146,
    r: 2,
    label: '坐在长堤上看花',
    act: () =>
      sitOn('bench', {
        x: 180,
        y: 0.7,
        z: 146,
        ry: Math.atan2(-30, -24),
        sx: 181,
        sz: 147,
        line: '花瓣掉到水里，像一条粉色的小船。',
      }),
  });
  const pt = particles({
    type: 'fall',
    n: 320,
    r: 70,
    cx: 180,
    cz: 136,
    y0: 0,
    y1: 10,
    size: 0.3,
    tex: TEX.petal,
    color: 0xffc0d0,
    op: 0.95,
    normal: true,
  });
  root.add(pt);
  W.upd.push(pt.userData.update);
  waypoint(k, root, 'sakura', '樱花长堤', 112, 178);
  [
    [146, 164],
    [210, 122],
    [236, 92],
    [190, 150],
  ].forEach(([x, z]) => shard(k, root, x + rr(-1, 1), z + rr(-1, 1)));
  zone('sakura', '樱花长堤', 178, 140, 55, '满天都是花瓣！', '#ffc6d6');
}

/* =================== C. 星光浅滩 starlit shoals =================== */
const SHO_C = { x: -215, z: 110 };
function buildShoals(k, root) {
  const { x: cx, z: cz } = SHO_C,
    g = new THREE.Group();
  for (const [dx, dz, r] of [
    [0, 0, 11],
    [16, -10, 7],
    [-15, 12, 8],
    [12, 18, 6],
    [-18, -14, 6],
  ])
    g.add(disc(k, cx + dx, cz + dz, r, 0.12, 0xf3e3c3, null));
  const cc = [0x8fe8ff, 0xb69cff, 0xffb3e6];
  for (let i = 0; i < 18; i++) {
    const a = R() * TAU,
      d = rr(14, 30),
      x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d,
      c = pick(cc),
      m = new THREE.MeshToonMaterial({ color: c, gradientMap: toonGrad, emissive: c, emissiveIntensity: 0.5 });
    const h = rr(2, 7),
      r = rr(0.4, 0.9);
    const pr = new THREE.Group();
    pr.add(P(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 6), m), 0, h / 2, 0));
    pr.add(P(new THREE.Mesh(new THREE.ConeGeometry(r, r * 2, 6), m), 0, h + r, 0));
    pr.position.set(x, -0.2, z);
    pr.rotation.set(rr(-0.25, 0.25), R() * TAU, rr(-0.25, 0.25));
    g.add(pr);
    col(x, z, r + 0.2);
  }
  // stone tablet showing the melody as coloured dots
  const notes = [0xff8a8a, 0xffb36b, 0xffe066, 0x9be07a, 0x7fd8ff, 0x8f9dff, 0xd49cff],
    melody = [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1];
  const tb = P(new THREE.Group(), cx, 0.12, cz - 6.5);
  tb.add(P(k.mesh(new THREE.BoxGeometry(3.6, 2, 0.35), 0xd9cfbf), 0, 1, 0));
  const tt = tex1((c, s) => {
    c.fillStyle = '#e8e0d0';
    c.fillRect(0, 0, s * 2, s);
    melody.forEach((n, i) => {
      c.fillStyle = '#' + new THREE.Color(notes[n]).getHexString();
      c.beginPath();
      c.arc(18 + i * 15.3, s / 2 + (i % 2 ? 10 : -10) - n * 3 + 10, 6.5, 0, TAU);
      c.fill();
      c.strokeStyle = '#2e3a59';
      c.lineWidth = 2;
      c.stroke();
    });
  }, 256);
  const tp = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: tt }));
  tp.position.set(0, 1.05, 0.18);
  tp.userData.keepAlone = true;
  tb.add(tp);
  g.add(tb);
  col(cx, cz - 6.5, 1.3);
  col(cx - 1.3, cz - 6.5, 0.6);
  col(cx + 1.3, cz - 6.5, 0.6);
  const xs = [];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + (i / 6) * 0.7),
      x = cx + Math.cos(a) * 5.2,
      z = cz - 6.5 + Math.sin(a) * 5.2 + 1.5,
      h = 1.2 + i * 0.22;
    const m = new THREE.MeshToonMaterial({
      color: notes[i],
      gradientMap: toonGrad,
      emissive: notes[i],
      emissiveIntensity: 0.25,
    });
    const c = new THREE.Group();
    c.add(P(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, h, 6), m), 0, h / 2, 0));
    c.add(P(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), m), 0, h + 0.25, 0));
    c.position.set(x, 0.12, z);
    c.userData.dynamic = true;
    g.add(c);
    col(x, z, 0.4);
    const gl = P(glow(notes[i], 2.4, 0), x, h * 0.7, z);
    g.add(gl);
    xs.push({ m, gl, x, z, t: 0 });
    inter({
      id: 'xylo' + i,
      x: x + Math.cos(a) * -1.2,
      z: z + Math.sin(a) * -1.2,
      r: 1.1,
      label: '敲一下水晶',
      act: () => {
        const X = W.dyn.xylo;
        xs[i].t = 1;
        AU.sfx('rune', [0, 2, 4, 5, 7, 9, 11][i]);
        X.seq.push(i);
        if (X.seq.length > melody.length) X.seq.shift();
        if (!X.done && X.seq.join() === melody.join()) {
          X.done = true;
          save.xylo = true;
          persist();
          AU.sfx('harp');
          toast('星光浅滩', '水晶唱出了一首歌', '三块星星碎片从水里浮了起来', 3600);
          for (let q = 0; q < 3; q++) shard(kit, world, cx + rr(-3, 3), cz - 2 + rr(-2, 2), 1.3);
        }
      },
    });
  }
  W.dyn.xylo = { xs, seq: [], done: false };
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const jel = [];
  for (let i = 0; i < 16; i++) {
    const c = pick([0xb8f0ff, 0xffc6f0, 0xd8c8ff]);
    const j = new THREE.Group();
    const dome = k.mesh(new THREE.SphereGeometry(0.7, 16, 8, 0, TAU, 0, Math.PI / 2), c, {
      transparent: true,
      opacity: 0.7,
      emissive: c,
      emissiveIntensity: 0.5,
    });
    j.add(dome);
    const pts = [];
    for (let q = 0; q < 6; q++) {
      const a = (q / 6) * TAU;
      for (let s = 0; s < 6; s++) {
        pts.push(
          new V3(Math.cos(a) * 0.45 + Math.sin(s) * 0.08, -s * 0.35, Math.sin(a) * 0.45),
          new V3(Math.cos(a) * 0.45 + Math.sin(s + 1) * 0.08, -(s + 1) * 0.35, Math.sin(a) * 0.45),
        );
      }
    }
    j.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.6 }),
      ),
    );
    const gl = glow(c, 3, 0.35);
    j.add(gl);
    nightGlow(gl, 0.25, 0.9);
    k.ink(j, 0.012);
    const a = R() * TAU,
      d = rr(3, 32);
    j.position.set(cx + Math.cos(a) * d, rr(2, 7), cz + Math.sin(a) * d);
    root.add(j);
    jel.push({ g: j, dome, base: j.position.clone(), ph: R() * TAU });
  }
  W.dyn.jelly = jel;
  waypoint(k, root, 'shoals', '星光浅滩', cx + 8, cz + 4);
  [
    [cx - 15, cz + 12],
    [cx + 16, cz - 10],
    [cx + 12, cz + 18],
    [cx - 26, cz - 4],
  ].forEach(([x, z]) => shard(k, root, x, z));
  zone('shoals', '星光浅滩', cx, cz, 34, '脚下的水会发光！天上还有水母在飘……', '#b8f0ff');
}

/* =================== D. 金枫谷 maple vale =================== */
const MAP_C = { x: 190, z: -140 };
function buildMaple(k, root) {
  const { x: cx, z: cz } = MAP_C,
    g = new THREE.Group();
  [
    [0, 0, 26, 5],
    [24, -18, 18, 4],
    [-22, 16, 18, 3.5],
    [20, 20, 14, 3],
  ].forEach(([dx, dz, r, h], i) => g.add(hill(k, cx + dx, cz + dz, r, h, [0xc8b060, 0xb8a858, 0xd0b868][i % 3])));
  const reds = [0xe8702a, 0xf0a030, 0xd84a2a, 0xffc040];
  for (let i = 0; i < 30; i++) {
    const a = R() * TAU,
      d = rr(6, 34),
      x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d,
      s = rr(1.3, 2),
      y = raisedH(x, z);
    const t = new THREE.Group();
    t.add(P(k.mesh(new THREE.CylinderGeometry(0.14 * s, 0.24 * s, 2.4 * s, 8), 0x5a4038), 0, 1.2 * s, 0));
    const c = pick(reds);
    for (let j = 0; j < 6; j++)
      t.add(
        P(
          k.mesh(k.sphere(rr(0.8, 1.2) * s), j % 3 ? c : pick(reds)),
          rr(-0.9, 0.9) * s,
          (2.6 + rr(0, 1.3)) * s,
          rr(-0.9, 0.9) * s,
        ),
      );
    t.position.set(x, y - 0.1, z);
    g.add(t);
    col(x, z, 0.35 * s);
    W.camCols.push({ x, y: y + 3.2 * s, z, r: 1.6 * s });
  }
  // leaf carpet
  const lf = [];
  for (let i = 0; i < 900; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * 36,
      x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d;
    lf.push([x, raisedH(x, z) + 0.02, z, R() * TAU, rr(0.7, 1.4)]);
  }
  root.add(
    flora(
      partsGeo([
        [new THREE.CircleGeometry(0.13, 5), 0xf0a030, [0, 0, 0], [-Math.PI / 2, 0, 0]],
        [new THREE.CircleGeometry(0.1, 5), 0xd84a2a, [0.18, 0.005, 0.05], [-Math.PI / 2, 0, 1]],
      ]),
      lf,
      0,
      false,
    ),
  );
  // hollow log tunnel
  const lx = cx - 8,
    lz = cz + 8,
    ly = raisedH(lx, lz);
  const log = new THREE.Group();
  const lm = k.mesh(new THREE.CylinderGeometry(1.6, 1.7, 7, 16, 1, true), 0x7a5a48, { side: THREE.DoubleSide });
  lm.rotation.z = Math.PI / 2;
  lm.position.y = 1.5;
  log.add(lm);
  for (const s of [-1, 1]) {
    const rg = k.mesh(new THREE.TorusGeometry(1.62, 0.18, 8, 20), 0xa07a5a);
    rg.rotation.y = Math.PI / 2;
    rg.position.set(s * 3.5, 1.5, 0);
    log.add(rg);
  }
  for (let m = 0; m < 5; m++) log.add(P(k.mesh(k.sphere(rr(0.25, 0.4)), 0x6fbf5a), rr(-3, 3), 3, rr(-0.6, 0.6)));
  log.position.set(lx, ly - 0.1, lz);
  log.userData.walk = true;
  g.add(log);
  colLine(lx - 3.5, lz - 1.75, lx + 3.5, lz - 1.75, 0.25);
  colLine(lx - 3.5, lz + 1.75, lx + 3.5, lz + 1.75, 0.25);
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const piles = [
    [cx + 6, cz - 4],
    [cx - 14, cz - 10],
  ].map(([x, z]) => {
    const pg = new THREE.Group();
    for (let i = 0; i < 22; i++) {
      const a = R() * TAU,
        d = Math.sqrt(R()) * 1.3;
      pg.add(
        P(k.mesh(k.sphere(rr(0.25, 0.45)), pick(reds)), Math.cos(a) * d, rr(0.1, 0.5) * (1.3 - d), Math.sin(a) * d),
      );
    }
    pg.position.set(x, raisedH(x, z), z);
    mergeGroup(pg);
    root.add(k.ink(pg, 0.01));
    return { g: pg, x, z };
  });
  piles.forEach((p, i) =>
    inter({
      id: 'leaf' + i,
      x: p.x,
      z: p.z,
      r: 2.6,
      label: '让团子跳进落叶堆',
      act: () =>
        pigGoDo(p.x, p.z, () => {
          pig.vy = 5.5;
          AU.sfx('rustle');
          for (let q = 0; q < 26; q++)
            spark(new V3(p.x, p.g.position.y + 0.5, p.z), TEX.petal, pick(reds), {
              v: new V3(rnd(-2.5, 2.5), rnd(2, 5), rnd(-2.5, 2.5)),
              g: -4,
              life: 1.8,
              size: rnd(0.25, 0.45),
            });
          p.g.scale.set(1.2, 0.6, 1.2);
          setTimeout(() => p.g.scale.set(1, 1, 1), 900);
          say('哗啦——！落叶好软好香！', 2.8);
          gainLove(2);
        }),
    }),
  );
  const lp = particles({
    type: 'fall',
    n: 260,
    r: 40,
    cx,
    cz,
    y0: 0,
    y1: 12,
    size: 0.34,
    tex: TEX.petal,
    color: 0xf0a030,
    op: 0.95,
    normal: true,
  });
  root.add(lp);
  W.upd.push(lp.userData.update);
  for (const [x, z] of [
    [cx + 3, cz + 3],
    [cx - 10, cz - 6],
    [cx + 18, cz - 14],
  ]) {
    const o = rabbit(k, 0xd07a3a);
    o.g.scale.setScalar(0.8);
    o.g.position.set(x, raisedH(x, z), z);
    root.add(o.g);
    W.dyn.rabbits.push(Object.assign(o, { hx: x, hz: z, hr: 9, t: rr(1, 3), hop: null }));
  }
  waypoint(k, root, 'maple', '金枫谷', cx - 26, cz + 22);
  [
    [cx, cz],
    [cx + 24, cz - 18],
    [cx - 22, cz + 16],
    [lx, lz],
  ].forEach(([x, z]) => shard(k, root, x + rr(-2, 2), z + rr(-2, 2), 1.3));
  zone('maple', '金枫谷', cx, cz, 40, '树叶都是金色的，踩上去沙沙响。', '#f0a030');
}

/* =================== E. 镜之湖 mirror lake =================== */
const MIR_C = { x: 0, z: -248 };
function buildMirror(k, root) {
  const { x: cx, z: cz } = MIR_C,
    g = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU,
      x = cx + Math.cos(a) * 28,
      z = cz + Math.sin(a) * 28,
      h = rr(9, 14);
    g.add(P(k.mesh(new THREE.CylinderGeometry(0.55, 0.7, h, 8), pick([0xf0ece4, 0xe6e0d6])), x, h / 2 - 0.2, z));
    g.add(P(k.mesh(new THREE.BoxGeometry(1.6, 0.3, 1.6), 0xf0ece4), x, h, z));
    col(x, z, 0.8);
  }
  g.add(disc(k, cx, cz, 4.2, 0.3, 0xc08a58, null));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    g.add(P(k.mesh(new THREE.BoxGeometry(0.3, 0.06, 4), 0xa0704a), cx + Math.cos(a) * 2, 0.31, cz + Math.sin(a) * 2))
      .children;
    g.children[g.children.length - 1].rotation.y = -a;
  }
  for (let i = 0; i < 9; i++) {
    const t = i / 8,
      x = cx + Math.sin(t * 3) * 3,
      z = cz + 24 - t * 18;
    g.add(P(k.mesh(new THREE.CylinderGeometry(0.9, 1, 0.3, 10), 0xd9cfbf), x, 0.05, z));
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const orbs = [];
  for (let i = 0; i < 24; i++) {
    const s = glow(pick([0xfff4c0, 0xc8f4ff, 0xffd6f0]), rr(1.2, 2.4), 0.75);
    root.add(s);
    orbs.push({ s, a: R() * TAU, r: rr(8, 26), h: rr(2, 12), sp: rr(0.04, 0.12) * (R() < 0.5 ? -1 : 1) });
  }
  W.dyn.orbs = { list: orbs, cx, cz };
  inter({
    id: 'gaze',
    x: cx,
    z: cz,
    r: 2.6,
    label: '躺下来看天空',
    act: () =>
      sitOn('bench', {
        x: cx,
        y: 0.45,
        z: cz,
        ry: Math.PI,
        sx: cx,
        sz: cz + 3,
        lie: true,
        line: nightT > 0.5 ? '好多星星……看，流星！' : '云走得好慢，好像在睡觉。',
      }),
  });
  waypoint(k, root, 'mirror', '镜之湖', cx + 6, cz + 26);
  [
    [cx + 10, cz - 6],
    [cx - 12, cz + 8],
    [cx, cz + 14],
  ].forEach(([x, z]) => shard(k, root, x, z, 1.4));
  zone('mirror', '镜之湖', cx, cz, 32, '这里的水好静，天空完完整整地掉进了湖里。', '#c8f4ff');
}

/* =================== F. 竹林茶亭 bamboo & tea =================== */
const BAM_C = { x: -262, z: -10 };
function buildBamboo(k, root) {
  const { x: cx, z: cz } = BAM_C,
    g = new THREE.Group();
  g.add(disc(k, cx, cz, 18, 0.2, 0x7fae5a, 0xa39a8e));
  const bparts = [[new THREE.CylinderGeometry(0.09, 0.11, 7, 5, 1, true), 0x7cbf5a, [0, 3.5, 0]]];
  for (let i = 1; i < 6; i++) bparts.push([new THREE.CylinderGeometry(0.12, 0.12, 0.1, 5), 0x5a9a48, [0, i * 1.25, 0]]);
  for (let i = 0; i < 5; i++)
    bparts.push([
      new THREE.ConeGeometry(0.12, 0.9, 3),
      0x6aa84f,
      [Math.cos(i * 2.4) * 0.4, 4.5 + i * 0.6, Math.sin(i * 2.4) * 0.4],
      [Math.sin(i * 2.4) * 0.9, 0, -Math.cos(i * 2.4) * 0.9],
      [1, 1, 0.3],
    ]);
  const bl = [];
  for (let c = 0; c < 14; c++) {
    const a = (c / 14) * TAU + rr(-0.15, 0.15),
      d = rr(11, 16.5);
    for (let i = 0; i < 10; i++)
      bl.push([
        cx + Math.cos(a) * d + rr(-1.4, 1.4),
        0.2,
        cz + Math.sin(a) * d + rr(-1.4, 1.4),
        R() * TAU,
        rr(0.8, 1.25),
      ]);
    col(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 1.3);
  }
  root.add(flora(partsGeo(bparts), bl, 0.018, true, 0.008));
  const pv = P(new THREE.Group(), cx, 0.2, cz);
  pv.add(P(k.mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.3, 8), 0xbdb2a0), 0, 0.15, 0));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    pv.add(
      P(k.mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 8), 0xc0443a), Math.cos(a) * 2.8, 1.8, Math.sin(a) * 2.8),
    );
    col(cx + Math.cos(a) * 2.8, cz + Math.sin(a) * 2.8, 0.25);
  }
  const rf = k.mesh(new THREE.ConeGeometry(4.6, 1.8, 4), 0x3f6a5a);
  rf.rotation.y = Math.PI / 4;
  rf.position.y = 4.1;
  pv.add(rf);
  pv.add(P(k.mesh(new THREE.ConeGeometry(0.3, 0.7, 6), 0xffd23f), 0, 5.2, 0));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    const tip = k.mesh(new THREE.ConeGeometry(0.18, 0.6, 5), 0x3f6a5a);
    tip.position.set(Math.cos(a) * 3.2, 3.55, Math.sin(a) * 3.2);
    tip.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
    pv.add(tip);
  }
  pv.add(P(k.mesh(new THREE.CylinderGeometry(0.9, 0.8, 0.1, 14), 0x8a5a3c), 0, 0.9, 0));
  pv.add(P(k.mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.6, 10), 0x8a5a3c), 0, 0.5, 0));
  pv.add(
    P(
      k.mesh(
        lathe(
          [
            [0.001, 0],
            [0.16, 0],
            [0.2, 0.1],
            [0.17, 0.22],
            [0.08, 0.26],
            [0.001, 0.28],
          ],
          12,
        ),
        0xd8e8e0,
      ),
      0,
      0.96,
      0,
    ),
  );
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    pv.add(
      P(k.mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.08, 10), 0xffffff), Math.cos(a) * 0.5, 0.99, Math.sin(a) * 0.5),
    );
  }
  for (const s of [-1, 1])
    pv.add(P(k.mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.45, 10), 0xbdb2a0), s * 1.5, 0.42, 0));
  g.add(pv);
  col(cx, cz, 1.1);
  const steam = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
    );
    root.add(s);
    steam.push({ s, t: i / 5 });
  }
  W.dyn.tea = { steam, on: 0, x: cx, y: 1.4, z: cz };
  // shishi-odoshi water clacker
  const so = P(new THREE.Group(), cx + 7, 0.2, cz + 5);
  so.add(P(k.mesh(new THREE.CylinderGeometry(1, 1.1, 0.4, 10), 0xa39a8e), 0, 0.2, 0));
  for (const s of [-1, 1]) so.add(P(k.mesh(new THREE.BoxGeometry(0.1, 1, 0.1), 0x8a6a4a), 0.3 * s, 0.8, 0));
  g.add(so);
  const tube = P(new THREE.Group(), cx + 7, 1.1, cz + 5);
  tube.userData.dynamic = true;
  const tb = k.mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.8, 8), 0x9ccf6a);
  tb.rotation.z = Math.PI / 2;
  tb.position.x = 0.3;
  tube.add(tb);
  root.add(k.ink(tube, 0.012));
  W.dyn.shishi = { tube, t: 0, x: cx + 7, z: cz + 5 };
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const tbush = P(k.mesh(k.sphere(0.6), 0x4f8a4a), cx + Math.cos(a) * 7.5, 0.55, cz + Math.sin(a) * 7.5);
    tbush.scale.y = 0.7;
    g.add(tbush);
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  inter({
    id: 'tea',
    x: cx + 1.5,
    z: cz + 1.6,
    r: 1.8,
    label: '泡一壶花茶',
    act: () => {
      sitOn('bench', {
        x: cx + 1.5,
        y: 0.85,
        z: cz,
        ry: -Math.PI / 2,
        sx: cx + 1.6,
        sz: cz + 2,
        line: '茶好香……团子，小心烫。',
      });
      W.dyn.tea.on = 8;
      AU.sfx('pour');
      giveItem('tea', 1);
    },
  });
  inter({
    id: 'picktea',
    x: cx + 7.5,
    z: cz + 1.8,
    r: 2,
    label: '采一把茶叶',
    act: () =>
      cooldown('picktea', 12, () => {
        giveItem('tea', 1);
        AU.sfx('rustle');
      }),
  });
  waypoint(k, root, 'bamboo', '竹林茶亭', cx + 14, cz + 6);
  [
    [cx - 6, cz + 5],
    [cx + 4, cz - 8],
    [cx - 10, cz - 6],
  ].forEach(([x, z]) => shard(k, root, x, z));
  zone('bamboo', '竹林茶亭', cx, cz, 20, '竹叶沙沙的，好安静。', '#7cbf5a');
}

/* =================== G. 彩虹湾 rainbow cove & lighthouse =================== */
const RAIN_C = { x: 250, z: 25 };
function buildRainbow(k, root) {
  const g = new THREE.Group(),
    A = [238, 2],
    B = [262, 50];
  g.add(disc(k, A[0], A[1], 9, 0.3, 0x9ccf6a, 0xbdb2a0));
  g.add(disc(k, B[0], B[1], 8, 0.3, 0x9ccf6a, 0xbdb2a0));
  const lh = P(new THREE.Group(), A[0] + 2, 0.3, A[1] - 2);
  for (let i = 0; i < 5; i++)
    lh.add(
      P(
        k.mesh(new THREE.CylinderGeometry(1.5 - i * 0.12 - 0.12, 1.5 - i * 0.12, 2.2, 14), i % 2 ? 0xffffff : 0xe84a5f),
        0,
        1.1 + i * 2.2,
        0,
      ),
    );
  lh.add(P(k.mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.2, 14), 0x3d4a7a), 0, 11.1, 0));
  lh.add(
    P(
      k.mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.4, 10), 0xfff2c2, { emissive: 0xffd070, emissiveIntensity: 0.6 }),
      0,
      11.9,
      0,
    ),
  );
  lh.add(P(k.mesh(new THREE.ConeGeometry(1.2, 1.2, 10), 0xe84a5f), 0, 13.2, 0));
  lh.add(P(k.mesh(new THREE.BoxGeometry(0.7, 1.2, 0.1), 0x3d4a7a), 0, 0.6, 1.48));
  g.add(lh);
  col(A[0] + 2, A[1] - 2, 1.7);
  const beam = new THREE.Group();
  beam.position.set(A[0] + 2, 12.2, A[1] - 2);
  beam.userData.dynamic = true;
  const bm = new THREE.Mesh(
    new THREE.ConeGeometry(4, 40, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff0b0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  bm.rotation.z = Math.PI / 2;
  bm.position.x = 20;
  beam.add(bm);
  root.add(beam);
  W.dyn.light = { beam, bm, on: false };
  inter({
    id: 'lighthouse',
    x: A[0] + 2,
    z: A[1] - 0.2,
    r: 1.8,
    label: '点亮灯塔',
    act: () => {
      const L = W.dyn.light;
      L.on = !L.on;
      AU.sfx(L.on ? 'ding' : 'thud');
      say(L.on ? '灯塔亮了！晚上船就不会迷路啦。' : '让灯塔休息一下。', 2.6);
    },
  });
  const flw = [];
  [0xe84a5f, 0xff8a5b, 0xffd23f, 0x7cc85e, 0x4f9ce0, 0x6a5acd, 0xb58cff].forEach((c, ci) => {
    const l = [];
    for (let i = 0; i < 60; i++) {
      const a = (ci / 7) * TAU + rr(-0.4, 0.4),
        d = rr(2, 7.3);
      const x = B[0] + Math.cos(a) * d,
        z = B[1] + Math.sin(a) * d;
      l.push([x, 0.3, z, R() * TAU, rr(0.9, 1.3)]);
    }
    root.add(flora(flowerGeo(c, 1.3), l, 0.1, true, 0.009));
  });
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const rb = new THREE.Group(),
    mx = (A[0] + B[0]) / 2,
    mz = (A[1] + B[1]) / 2,
    span = Math.hypot(B[0] - A[0], B[1] - A[1]) / 2;
  [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0x9775fa, 0xda77f2].forEach((c, i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(span - i * 0.9, 0.48, 8, 64, Math.PI),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    rb.add(m);
  });
  rb.position.set(mx, -1, mz);
  rb.rotation.y = -Math.atan2(B[1] - A[1], B[0] - A[0]);
  root.add(rb);
  W.dyn.rainbow = rb;
  waypoint(k, root, 'rainbow', '彩虹湾', A[0] - 6, A[1] + 6);
  [
    [B[0], B[1]],
    [A[0] - 4, A[1] - 5],
    [mx, mz],
  ].forEach(([x, z]) => shard(k, root, x, z, 1.3));
  zone('rainbow', '彩虹湾', mx, mz, 30, '是彩虹！我们从彩虹下面走过去吧！', '#74c0fc');
}

/* =================== H. 巨花园 giant garden =================== */
const GIA_C = { x: 70, z: 246 };
function buildGiant(k, root) {
  const { x: cx, z: cz } = GIA_C,
    g = new THREE.Group();
  g.add(disc(k, cx, cz, 22, 0.25, 0x9ccf6a, 0xbdb2a0));
  const stem = (x, z, h, bend) =>
    k.mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new V3(x, 0, z), new V3(x + bend * 0.3, h * 0.5, z), new V3(x + bend, h, z)]),
        12,
        0.2,
        7,
      ),
      0x6aa84f,
    );
  const heads = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + rr(-0.2, 0.2),
      d = rr(7, 19),
      x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d,
      h = rr(5, 10),
      b = rr(-1, 1),
      type = i % 4;
    g.add(stem(x, z, h, b));
    col(x, z, 0.4);
    const hx = x + b,
      hy = h;
    if (type === 0) {
      for (let p = 0; p < 12; p++) {
        const pa = (p / 12) * TAU;
        const pe = k.mesh(new THREE.SphereGeometry(0.7, 10, 6), 0xfff8f0);
        pe.scale.set(0.5, 0.12, 1.4);
        pe.position.set(hx + Math.cos(pa) * 1.2, hy, z + Math.sin(pa) * 1.2);
        pe.rotation.y = -pa + Math.PI / 2;
        g.add(pe);
      }
      g.add(P(k.mesh(k.sphere(0.6), 0xffd23f), hx, hy + 0.1, z));
    } else if (type === 1) {
      const cup = k.mesh(
        lathe(
          [
            [0.001, 0],
            [0.8, 0.2],
            [1.3, 1],
            [1.35, 2],
            [1.1, 2.5],
            [0.001, 1.8],
          ],
          14,
        ),
        pick([0xff8fb3, 0xffd23f, 0xe84a5f]),
      );
      cup.position.set(hx, hy - 0.2, z);
      g.add(cup);
    } else if (type === 2) {
      const pf = k.mesh(new THREE.IcosahedronGeometry(1.5, 1), 0xffffff);
      pf.position.set(hx, hy + 1, z);
      g.add(pf);
    } else {
      for (let q = 0; q < 3; q++) {
        const bb = k.mesh(new THREE.ConeGeometry(0.6, 1.2, 10, 1, true), 0x8f9dff, { side: THREE.DoubleSide });
        bb.position.set(hx + Math.cos(q * 2) * 1, hy - 0.9 - q * 0.2, z + Math.sin(q * 2) * 1);
        g.add(bb);
      }
    }
    for (const s of [-1, 1]) {
      const lf = k.mesh(new THREE.SphereGeometry(1, 10, 6), 0x7cc85e);
      lf.scale.set(1.8, 0.12, 0.7);
      lf.position.set(x + s * 1.1, h * 0.3, z);
      lf.rotation.z = s * 0.35;
      g.add(lf);
    }
    heads.push([hx, hy, z]);
    W.camCols.push({ x: hx, y: hy + 0.5, z, r: 2.4 });
  }
  for (let i = 0; i < 40; i++) {
    const [hx, hy, hz] = pick(heads);
    const dw = P(
      k.mesh(k.sphere(0.18), 0xdff8ff, {
        transparent: true,
        opacity: 0.75,
        emissive: 0x9fe8ff,
        emissiveIntensity: 0.4,
      }),
      hx + rr(-1, 1),
      rr(0.3, hy),
      hz + rr(-1, 1),
    );
    if (i % 2) dw.position.y = 0.4;
    g.add(dw);
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const shr = [];
  for (const [dx, dz, s, c] of [
    [-4, -3, 1.8, 0xe84a5f],
    [5, 2, 1.5, 0xb58cff],
    [0, 8, 1.3, 0xff8a5b],
  ]) {
    const x = cx + dx,
      z = cz + dz,
      m = P(new THREE.Group(), x, 0.25, z);
    m.userData.dynamic = true;
    m.add(P(k.mesh(new THREE.CylinderGeometry(0.5 * s, 0.7 * s, 2 * s, 12), 0xfff1e0), 0, s, 0));
    const cp = P(k.mesh(new THREE.SphereGeometry(1.6 * s, 18, 9, 0, TAU, 0, Math.PI / 2), c), 0, 2 * s, 0);
    cp.scale.y = 0.6;
    m.add(cp);
    for (let j = 0; j < 6; j++) {
      const aa = (j / 6) * TAU;
      m.add(P(k.mesh(k.sphere(0.2 * s), 0xffffff), Math.cos(aa) * 1.1 * s, 2 * s + 0.55 * s, Math.sin(aa) * 1.1 * s));
    }
    mergeGroup(m);
    root.add(k.ink(m, 0.012));
    col(x, z, 0.7 * s);
    W.camCols.push({ x, y: 2 * s + 0.25, z, r: 1.9 * s });
    shr.push({ m, s, t: -1 });
    inter({
      id: 'bounce' + shr.length,
      x: x + 2.2 * s * 0.8,
      z: z,
      r: 1.6 * s,
      label: '在大蘑菇上弹一下',
      act: () => {
        const o = shr.find((q) => q.m === m);
        o.t = 0;
        PL.vy = 15;
        PL.grounded = false;
        AU.sfx('boing');
        setTimeout(() => AU.sfx('boing'), 120);
        pig.vy = 9;
        say('哇啊啊——好高！', 2);
        gainLove(1);
      },
    });
  }
  W.dyn.gshroom = shr;
  const lb = new THREE.Group();
  const lbb = k.mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, TAU, 0, Math.PI / 2), 0xe84a4a);
  lb.add(lbb);
  lb.add(P(k.mesh(k.sphere(0.45), 0x2e3a59), 0, 0.1, 0.8));
  for (let i = 0; i < 5; i++) lb.add(P(k.mesh(k.sphere(0.15), 0x2e3a59), rr(-0.5, 0.5), 0.75, rr(-0.4, 0.5)));
  mergeGroup(lb);
  lb.position.set(cx + 9, 0.25, cz - 6);
  root.add(k.ink(lb, 0.012));
  const sn = new THREE.Group();
  const shell = k.mesh(new THREE.TorusGeometry(0.7, 0.45, 10, 20), 0xd9a86a);
  shell.position.y = 1.1;
  sn.add(shell);
  const sb = k.mesh(capsule(0.35, 2, 10, 4), 0xc8d8a0);
  sb.rotation.x = Math.PI / 2;
  sb.position.set(0, 0.35, 0.3);
  sn.add(sb);
  for (const s of [-1, 1])
    sn.add(P(k.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 5), 0xc8d8a0), s * 0.15, 0.9, 1.3));
  mergeGroup(sn);
  sn.userData.dynamic = true;
  root.add(k.ink(sn, 0.012));
  W.dyn.snail = { g: sn, a: 0, cx, cz };
  waypoint(k, root, 'giant', '巨花园', cx - 16, cz - 14);
  [
    [cx + 4, cz - 12],
    [cx - 12, cz + 6],
    [cx + 14, cz + 10],
    [cx, cz],
  ].forEach(([x, z]) => shard(k, root, x, z, 1.2));
  zone('giant', '巨花园', cx, cz, 24, '我们变小了吗？！花比我们还高！', '#fff8f0');
}

/* =================== I. 浮空瀑布 floating waterfalls =================== */
const FALL2_C = { x: -110, z: 224 };
function buildSkyFalls(k, root) {
  const { x: cx, z: cz } = FALL2_C;
  for (const [dx, dz, y, s] of [
    [0, 0, 42, 1.2],
    [-26, 14, 32, 0.9],
    [22, 18, 50, 1],
  ]) {
    const g = new THREE.Group();
    const base = k.mesh(new THREE.ConeGeometry(10, 14, 9), pick([0xb0a698, 0xa39a8e]));
    base.rotation.x = Math.PI;
    base.position.y = -7;
    g.add(base);
    g.add(k.mesh(new THREE.CylinderGeometry(10.3, 10, 1.4, 20), 0x7cc85e));
    for (let i = 0; i < 6; i++) {
      const t = roundTree(k, rr(2, 3), 0x7a5c4a, [0x6fbf5a, 0x8fd16a, 0xffc6d6]);
      t.position.set(rr(-6, 6), 0.6, rr(-6, 6));
      g.add(t);
    }
    g.traverse((n) => {
      if (n.isMesh) n.castShadow = false;
    });
    g.scale.setScalar(s);
    g.position.set(cx + dx, y, cz + dz);
    mergeGroup(g);
    g.userData.dynamic = true;
    root.add(k.ink(g, 0.012));
    const yy = y;
    W.upd.push((t) => {
      g.position.y = yy + Math.sin(t * 0.25 + dx) * 0.8;
    });
    waterfall(k, root, null, cx + dx, y + 0.4, cz + dz + 10 * s + 0.2, 4.5 * s, y + 0.6, 0, { stream: 3.5 * s });
  }
  const pads = [];
  for (let i = 0; i < 60; i++) {
    const a = R() * TAU,
      d = rr(4, 30);
    pads.push([cx + Math.cos(a) * d, 0.03, cz + Math.sin(a) * d, R() * TAU, rr(1.2, 2.2)]);
  }
  root.add(
    flora(
      partsGeo([[new THREE.CylinderGeometry(0.5, 0.5, 0.05, 14, 1, false, 0.3, TAU - 0.3), 0x5aa84e]]),
      pads,
      0,
      true,
      0.01,
    ),
  );
  for (let i = 0; i < 12; i++) {
    const t = i / 11,
      x = cx - 30 + t * 48,
      z = cz + 30 - t * 6 + Math.sin(t * 5) * 4;
    root.add(k.ink(P(k.mesh(new THREE.CylinderGeometry(1, 1.1, 0.4, 10), 0xd9cfbf), x, 0.1, z), 0.01));
  }
  const mist = particles({
    type: 'rise',
    n: 120,
    r: 26,
    cx,
    cz: cz + 12,
    y0: 0,
    y1: 9,
    size: 1.4,
    tex: TEX.glow,
    color: 0xffffff,
    op: 0.25,
    normal: true,
  });
  root.add(mist);
  W.upd.push(mist.userData.update);
  waypoint(k, root, 'skyfalls', '浮空瀑布', cx - 8, cz - 16);
  [
    [cx - 12, cz + 30],
    [cx + 18, cz + 26],
    [cx + 2, cz - 6],
  ].forEach(([x, z]) => shard(k, root, x, z, 1.4));
  zone('skyfalls', '浮空瀑布', cx, cz, 32, '瀑布是从天上的小岛掉下来的！', '#a8dcff');
}

/* =================== J. 草莓坡 strawberry slope =================== */
const BER_C = { x: 96, z: -205 };
function buildBerries(k, root) {
  const { x: cx, z: cz } = BER_C,
    g = new THREE.Group();
  g.add(hill(k, cx, cz, 22, 3.2, 0x9ccf6a));
  const plant = partsGeo([
    [new THREE.SphereGeometry(0.28, 7, 5), 0x5a9a48, [0, 0.18, 0], [0, 0, 0], [1, 0.55, 1]],
    [new THREE.SphereGeometry(0.07, 6, 4), 0xe8304a, [0.18, 0.12, 0.08]],
    [new THREE.SphereGeometry(0.06, 6, 4), 0xe8304a, [-0.12, 0.1, 0.15]],
    [new THREE.SphereGeometry(0.05, 5, 3), 0xffffff, [0.05, 0.36, 0]],
  ]);
  const list = [];
  for (let r = 0; r < 8; r++) {
    const z = cz - 10 + r * 2.6;
    for (let x = -12; x < 12; x += 0.9) {
      const px = cx + x,
        pz = z + rr(-0.1, 0.1);
      if (Math.hypot(px - cx, pz - cz) > 18) continue;
      list.push([px, raisedH(px, pz), pz, R() * TAU, rr(0.9, 1.2)]);
    }
  }
  root.add(flora(plant, list, 0.05, true, 0.01));
  const ct = P(new THREE.Group(), cx + 14, raisedH(cx + 14, cz + 6), cz + 6);
  ct.add(P(k.mesh(new THREE.BoxGeometry(2, 0.8, 1.2), 0xc08a58), 0, 0.9, 0));
  for (const s of [-1, 1]) {
    const w = k.mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 12), 0x8a5a3c);
    w.rotation.x = Math.PI / 2;
    w.position.set(0.6, 0.45, s * 0.65);
    ct.add(w);
  }
  for (let i = 0; i < 10; i++) ct.add(P(k.mesh(k.sphere(0.12), 0xe8304a), rr(-0.8, 0.8), 1.35, rr(-0.4, 0.4)));
  g.add(ct);
  col(cx + 14, cz + 6, 1.2);
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  [
    [-6, -6],
    [4, 0],
    [-2, 6],
  ].forEach(([dx, dz], i) =>
    inter({
      id: 'berry' + i,
      x: cx + dx,
      z: cz + dz,
      r: 2.2,
      label: '摘草莓',
      act: () =>
        cooldown('berry' + i, 15, () => {
          giveItem('berry', 1);
          AU.sfx('pluck');
        }),
    }),
  );
  waypoint(k, root, 'berry', '草莓坡', cx - 20, cz + 16);
  [
    [cx + 8, cz - 8],
    [cx - 10, cz + 4],
    [cx + 16, cz + 10],
  ].forEach(([x, z]) => shard(k, root, x, z));
  zone('berry', '草莓坡', cx, cz, 22, '草莓！红红的，好香！', '#e8304a');
}

/* =================== global fairyland dressing =================== */
function buildFairySky(k, root) {
  // sky whale
  const wh = new THREE.Group(),
    body = new THREE.Group();
  wh.add(body);
  const bm = k.mesh(
    lathe(
      [
        [0.001, -9],
        [1.6, -8],
        [3.2, -5],
        [4.1, -1],
        [4.3, 2],
        [3.7, 5],
        [2.3, 7.6],
        [0.001, 9],
      ],
      24,
    ),
    0x8fb8e8,
  );
  bm.rotation.x = Math.PI / 2;
  body.add(bm);
  const belly = k.mesh(new THREE.SphereGeometry(4, 20, 10, 0, TAU, Math.PI * 0.55, Math.PI * 0.45), 0xe8f4ff);
  belly.scale.set(0.98, 0.9, 2);
  belly.position.set(0, -0.2, 1);
  body.add(belly);
  for (const s of [-1, 1]) {
    body.add(P(k.mesh(k.sphere(0.35), 0x2e3a59), s * 3.2, 0.6, 5.4));
    const fin = k.mesh(new THREE.SphereGeometry(1.2, 12, 8), 0x7aa4d8);
    fin.scale.set(2.2, 0.2, 0.8);
    fin.position.set(s * 4.4, -1.5, 2);
    fin.rotation.z = s * 0.4;
    body.add(fin);
  }
  for (let i = 0; i < 9; i++)
    body.add(
      P(
        k.mesh(k.sphere(0.28), 0xfff4c0, { emissive: 0xffe08a, emissiveIntensity: 0.8 }),
        rr(-1.5, 1.5),
        rr(3, 4),
        -6 + i * 1.5,
      ),
    );
  const tail = P(new THREE.Group(), 0, 0, -8.5);
  for (const s of [-1, 1]) {
    const fl = k.mesh(new THREE.SphereGeometry(1.6, 12, 8), 0x7aa4d8);
    fl.scale.set(1.6, 0.18, 0.7);
    fl.position.set(s * 1.8, 0, -0.8);
    fl.rotation.y = s * 0.5;
    tail.add(fl);
  }
  body.add(tail);
  wh.scale.setScalar(3.2);
  wh.userData.dynamic = true;
  mergeGroup(tail);
  root.add(k.ink(wh, 0.012));
  const trail = particles({
    type: 'drift',
    n: 90,
    r: 6,
    y0: -3,
    y1: 3,
    size: 1.2,
    tex: TEX.glow,
    color: 0xfff4c0,
    op: 0.6,
  });
  root.add(trail);
  W.upd.push(trail.userData.update);
  W.dyn.whale = { g: wh, body, tail, trail, a: 0, song: 10 };
  // aurora ribbons (night)
  const au = [];
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.PlaneGeometry(900, 160, 80, 1),
      p = geo.attributes.position;
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j);
      p.setZ(j, Math.sin(x * 0.008 + i) * 120);
    }
    const m = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { t: { value: 0 }, a: { value: 0 }, h: { value: i * 0.3 } },
        vertexShader:
          'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'uniform float t,a,h;varying vec2 vU;void main(){float band=sin(vU.x*40.+t*.6+h*10.)*.5+.5;float v=smoothstep(0.,.25,vU.y)*smoothstep(1.,.3,vU.y);vec3 c=mix(vec3(.3,1.,.7),vec3(.7,.5,1.),vU.y+h*.3);gl_FragColor=vec4(c*.85,a*v*(.3+.7*band)*.26);}',
      }),
    );
    m.position.set(i * 260 - 260, 250 + i * 45, -760 + i * 40);
    m.rotation.y = (i - 1) * 0.35;
    m.rotation.x = 0.25;
    m.frustumCulled = false;
    root.add(m);
    au.push(m);
  }
  W.dyn.aurora = au;
  // shooting stars
  const ss = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: TEX.glow,
        color: 0xfff8e0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    m.scale.set(70, 1.6, 1);
    m.frustumCulled = false;
    scene.add(m);
    ss.push({ m, t: -1 });
  }
  W.dyn.shoot = { ss, next: 4 };
  // light shafts through the great canopy
  const rt = tex1((c, s) => {
    const g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, 'rgba(255,240,200,0)');
    g.addColorStop(0.3, 'rgba(255,240,200,.9)');
    g.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
    const h = c.createLinearGradient(0, 0, s, 0);
    h.addColorStop(0, 'rgba(0,0,0,1)');
    h.addColorStop(0.5, 'rgba(0,0,0,0)');
    h.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = h;
    c.fillRect(0, 0, s, s);
  });
  const rays = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3,
      d = rr(12, 22);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(rr(3, 6), 34),
      new THREE.MeshBasicMaterial({
        map: rt,
        color: 0xffe6b0,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    m.position.set(Math.cos(a) * d, 16, Math.sin(a) * d);
    m.rotation.set(0, a, 0.35);
    root.add(m);
    rays.push({ m, ph: R() * TAU });
  }
  W.dyn.rays = rays;
  // fairy motes that follow the player
  const motes = particles({
    type: 'drift',
    n: 160,
    r: 30,
    y0: 0.4,
    y1: 7,
    size: 0.42,
    tex: TEX.glow,
    colors: [0xfff4c0, 0xc8f4ff, 0xffd6f0, 0xe6ffc0],
    op: 0.7,
    speed: 0.6,
  });
  root.add(motes);
  W.upd.push(motes.userData.update);
  W.dyn.motes = motes;
  waypoint(k, root, 'home0', '巨树码头', -8, 34, true);
}
function buildOuter(k, root, wrap) {
  wrap(buildHills, HILL_C.x, HILL_C.z, 260);
  wrap(buildSakura, 178, 140, 270);
  wrap(buildShoals, SHO_C.x, SHO_C.z, 240);
  wrap(buildMaple, MAP_C.x, MAP_C.z, 250);
  wrap(buildMirror, MIR_C.x, MIR_C.z, 240);
  wrap(buildBamboo, BAM_C.x, BAM_C.z, 230);
  wrap(buildRainbow, RAIN_C.x, RAIN_C.z, 300);
  wrap(buildGiant, GIA_C.x, GIA_C.z, 240);
  wrap(buildSkyFalls, FALL2_C.x, FALL2_C.z, 320);
  wrap(buildBerries, BER_C.x, BER_C.z, 220);
  buildFairySky(k, root);
  buildStall(k, root);
  // extra ingredient spots in the inner world
  inter({
    id: 'mush',
    x: GROVE_C.x + 4,
    z: GROVE_C.z - 3,
    r: 2.4,
    label: '采几朵蘑菇',
    act: () =>
      cooldown('mush', 12, () => {
        giveItem('mush', 1);
        AU.sfx('pluck');
      }),
  });
  const hv = new THREE.Group();
  hv.add(P(k.mesh(new THREE.BoxGeometry(0.12, 1, 0.12), 0x8a5a3c), 0, 0.5, 0));
  const hb = k.mesh(
    lathe(
      [
        [0.001, 0],
        [0.4, 0.05],
        [0.5, 0.3],
        [0.45, 0.6],
        [0.3, 0.8],
        [0.001, 0.85],
      ],
      14,
    ),
    0xffd23f,
  );
  hb.position.y = 1;
  hv.add(hb);
  for (let i = 0; i < 3; i++) {
    const b = k.mesh(new THREE.TorusGeometry(0.46 - i * 0.04, 0.03, 6, 16), 0xe8b030);
    b.rotation.x = Math.PI / 2;
    b.position.y = 1.2 + i * 0.2;
    hv.add(b);
  }
  hv.position.set(LAV_C.x + 8, 0.14, LAV_C.z + 4.5);
  mergeGroup(hv);
  root.add(k.ink(hv, 0.012));
  col(LAV_C.x + 8, LAV_C.z + 4.5, 0.6);
  inter({
    id: 'honey',
    x: LAV_C.x + 8,
    z: LAV_C.z + 3.2,
    r: 1.8,
    label: '收一点蜂蜜',
    act: () =>
      cooldown('honey', 15, () => {
        giveItem('honey', 1);
        AU.sfx('buzz');
      }),
  });
}

/* =================== automatic colliders ===================
   Every solid object that overlaps body height (0.5–1.45 m above its ground) and is small/medium
   gets a circle collider; long thin things (rails, fences, logs) get a line of circles.
   Large structures keep their hand-made colliders. Mark anything walk-through with userData.walk=true. */
const AUTO = { n: 0 };
function autoCols(root) {
  AUTO.base = W.cols.ground.length;
  AUTO.baseD = W.cols.deck.length;
  root.updateMatrixWorld(true);
  const v = new V3();
  const add = (a, mw) => {
    let y0 = 1e9,
      y1 = -1e9;
    const xs = [],
      zs = [];
    for (let i = 0; i < 24; i += 3) {
      v.set(a[i], a[i + 1], a[i + 2]);
      if (mw) v.applyMatrix4(mw);
      y0 = Math.min(y0, v.y);
      y1 = Math.max(y1, v.y);
      xs.push(v.x);
      zs.push(v.z);
    }
    const cx = xs.reduce((s, q) => s + q, 0) / 8,
      cz = zs.reduce((s, q) => s + q, 0) / 8,
      rr_ = Math.hypot(cx, cz);
    if (rr_ > 304) return;
    const deck = typeof DECK_Y !== 'undefined' && rr_ > 5.4 && rr_ < 10.2 && y0 > DECK_Y - 1.2,
      ground = deck ? DECK_Y : raisedH(cx, cz),
      level = deck ? 'deck' : 'ground';
    if (!(y0 < ground + 1.45 && y1 > ground + 0.5)) return;
    let sxx = 0,
      szz = 0,
      sxz = 0;
    for (let i = 0; i < 8; i++) {
      const dx = xs[i] - cx,
        dz = zs[i] - cz;
      sxx += dx * dx;
      szz += dz * dz;
      sxz += dx * dz;
    }
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz),
      ux = Math.cos(th),
      uz = Math.sin(th);
    let a0 = 1e9,
      a1 = -1e9,
      b0 = 1e9,
      b1 = -1e9;
    for (let i = 0; i < 8; i++) {
      const dx = xs[i] - cx,
        dz = zs[i] - cz,
        pa = dx * ux + dz * uz,
        pb = -dx * uz + dz * ux;
      a0 = Math.min(a0, pa);
      a1 = Math.max(a1, pa);
      b0 = Math.min(b0, pb);
      b1 = Math.max(b1, pb);
    }
    const L = (a1 - a0) / 2,
      Wd = (b1 - b0) / 2,
      mid = (a0 + a1) / 2,
      mx = cx + ux * mid,
      mz = cz + uz * mid;
    if (Math.max(L, Wd) < 0.13) return;
    if (L > Wd * 2.5 && Wd < 0.6 && L < 12) {
      colLine(
        mx - ux * (L - Wd),
        mz - uz * (L - Wd),
        mx + ux * (L - Wd),
        mz + uz * (L - Wd),
        Math.max(Wd, 0.15),
        level,
      );
      AUTO.n++;
      return;
    }
    if (Math.max(L, Wd) > 1.8) return;
    col(mx, mz, Math.max(L, Wd) * 0.82, level);
    AUTO.n++;
  };
  (function walk(n) {
    if (n.userData.walk || n.userData.dynamic || n.isSprite || n.isPoints) return;
    if (n.userData.solids) n.userData.solids.forEach((a) => add(a, n.matrixWorld));
    else if (
      n.isMesh &&
      !n.isInstancedMesh &&
      !n.userData.isInk &&
      !n.userData.merged &&
      !(n.material.transparent && n.material.opacity < 0.9)
    ) {
      const g = n.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox,
        a = new Float32Array(24);
      let i = 0;
      for (const x of [bb.min.x, bb.max.x])
        for (const y of [bb.min.y, bb.max.y])
          for (const z of [bb.min.z, bb.max.z]) {
            a[i++] = x;
            a[i++] = y;
            a[i++] = z;
          }
      add(a, n.matrixWorld);
    }
    n.children.forEach(walk);
  })(root);
}
