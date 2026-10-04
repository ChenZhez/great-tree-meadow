/* =================== sunflower maze =================== */
const MAZE_C = { x: 82, z: -40 },
  MAZE_N = 7,
  MAZE_S = 3.4;
function buildMaze(k, root) {
  const { x: cx, z: cz } = MAZE_C,
    N = MAZE_N,
    S = MAZE_S,
    half = (N * S) / 2;
  root.add(k.ink(rectPatch(k, cx, cz, N * S + 3, N * S + 3, 0.14, 0x9ccf6a), 0.012));
  // carve a perfect maze (seeded)
  const vis = [...Array(N * N)].map(() => false),
    E = [...Array(N * N)].map(() => [true, true, true, true]); // walls: 0 N(-z) 1 E(+x) 2 S(+z) 3 W(-x)
  const st = [[Math.floor(N / 2), N - 1]];
  vis[st[0][1] * N + st[0][0]] = true;
  const D = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  while (st.length) {
    const [x, z] = st[st.length - 1];
    const nb = [];
    D.forEach(([dx, dz], d) => {
      const nx = x + dx,
        nz = z + dz;
      if (nx >= 0 && nz >= 0 && nx < N && nz < N && !vis[nz * N + nx]) nb.push([nx, nz, d]);
    });
    if (!nb.length) {
      st.pop();
      continue;
    }
    const [nx, nz, d] = nb[Math.floor(R() * nb.length)];
    E[z * N + x][d] = false;
    E[nz * N + nx][(d + 2) % 4] = false;
    vis[nz * N + nx] = true;
    st.push([nx, nz]);
  }
  E[(N - 1) * N + Math.floor(N / 2)][2] = false; // entrance on the south side
  const segs = [];
  for (let z = 0; z < N; z++)
    for (let x = 0; x < N; x++) {
      const e = E[z * N + x],
        x0 = cx - half + x * S,
        z0 = cz - half + z * S;
      if (e[0]) segs.push([x0, z0, x0 + S, z0]);
      if (e[3]) segs.push([x0, z0, x0, z0 + S]);
      if (z === N - 1 && e[2]) segs.push([x0, z0 + S, x0 + S, z0 + S]);
      if (x === N - 1 && e[1]) segs.push([x0 + S, z0, x0 + S, z0 + S]);
    }
  const g = new THREE.Group(),
    sfl = [];
  segs.forEach(([x1, z1, x2, z2]) => {
    const L = Math.hypot(x2 - x1, z2 - z1) + 0.5;
    const h = k.mesh(new THREE.BoxGeometry(x1 === x2 ? 0.6 : L, 1.5, x1 === x2 ? L : 0.6), pick([0x5aa84e, 0x62b054]));
    h.position.set((x1 + x2) / 2, 0.9, (z1 + z2) / 2);
    g.add(h);
    for (let q = 0.1; q <= 0.9; q += 0.27)
      sfl.push([
        x1 + (x2 - x1) * q + rr(-0.1, 0.1),
        1.55,
        z1 + (z2 - z1) * q + rr(-0.1, 0.1),
        rr(-0.4, 0.4) + (x1 === x2 ? Math.PI / 2 : 0),
        rr(0.9, 1.2),
      ]);
    colLine(x1, z1, x2, z2, 0.42);
  });
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const pet = [];
  for (let p = 0; p < 12; p++) {
    const a = (p / 12) * TAU;
    pet.push([
      new THREE.SphereGeometry(0.1, 6, 4),
      0xffd23f,
      [Math.cos(a) * 0.24, 0.62 + Math.sin(a) * 0.24, 0.05],
      [0, 0, a],
      [0.55, 1.4, 0.35],
    ]);
  }
  const sgeo = partsGeo([
    [new THREE.CylinderGeometry(0.03, 0.04, 0.6, 4, 1, true), 0x5a9a48, [0, 0.3, 0]],
    [new THREE.CylinderGeometry(0.17, 0.17, 0.07, 10), 0x6e4a2a, [0, 0.62, 0.02], [Math.PI / 2, 0, 0]],
    ...pet,
  ]);
  root.add(flora(sgeo, sfl, 0.05, true, 0.01));
  // centre: a little stone plinth, and a sign at the entrance
  const cp = new THREE.Group();
  cp.add(P(k.mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.5, 12), 0xd9cfbf), cx, 0.4, cz));
  const sg = P(new THREE.Group(), cx + 2.2, 0.14, cz + half + 1.6);
  sg.add(P(k.mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), 0x8a5a3c), 0, 0.6, 0));
  sg.add(P(k.mesh(new THREE.BoxGeometry(1.2, 0.6, 0.08), 0xf3dfc0), 0, 1.15, 0));
  for (let i = 0; i < 3; i++) sg.add(P(k.mesh(k.sphere(0.07), 0xffd23f), -0.3 + i * 0.3, 1.15, 0.06));
  cp.add(sg);
  mergeGroup(cp);
  root.add(k.ink(cp, 0.012));
  W.mapShapes.push({ t: 'maze', x: cx, z: cz, segs });
  zone('maze', '向日葵迷宫', cx, cz + half + 2, 5, '这么高的向日葵！里面是迷宫吗？', '#ffd23f');
  seed(k, 'maze', '向日葵迷宫', cx, 1.5, cz, false);
}

/* =================== firefly grove =================== */
const GROVE_C = { x: -80, z: -50 };
function buildGrove(k, root) {
  const { x: cx, z: cz } = GROVE_C,
    g = new THREE.Group();
  g.add(disc(k, cx, cz, 14, 0.14, 0x4f8a5a, 0x7a8a8a));
  const trees = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + rr(-0.2, 0.2),
      d = rr(8, 12.5);
    const x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d,
      s = rr(1.8, 2.6);
    const t = roundTree(k, s, 0x5a4a5a, [0x3f7a6a, 0x4a8a7a, 0x356a60], 6);
    t.position.set(x, 0.14, z);
    g.add(t);
    col(x, z, 0.4 * s);
    trees.push([x, z]);
  }
  const shroom = (x, z, s, c) => {
    const m = P(new THREE.Group(), x, 0.14, z);
    m.add(P(k.mesh(new THREE.CylinderGeometry(0.08 * s, 0.11 * s, 0.45 * s, 10), 0xe8f4ff), 0, 0.22 * s, 0));
    const cp = P(
      k.mesh(new THREE.SphereGeometry(0.3 * s, 14, 8, 0, TAU, 0, Math.PI / 2), c, {
        emissive: c,
        emissiveIntensity: 0.7,
      }),
      0,
      0.43 * s,
      0,
    );
    cp.scale.y = 0.7;
    m.add(cp);
    g.add(m);
  };
  const glows = [];
  for (let i = 0; i < 34; i++) {
    const a = R() * TAU,
      d = rr(2, 12),
      s = rr(0.6, 1.5),
      c = pick([0x6ff2ff, 0x9fffc8, 0xb69cff]);
    const x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d;
    shroom(x, z, s, c);
    if (i % 3 === 0) {
      const gl = P(glow(c, 2.4 * s, 0.15), x, 0.6 * s, z);
      g.add(gl);
      glows.push(gl);
      nightGlow(gl, 0.12, 0.8);
    }
  }
  const log = P(k.mesh(new THREE.CylinderGeometry(0.45, 0.5, 4, 12), 0x6e5a5a), cx + 3, 0.5, cz + 2);
  log.rotation.set(0, 0.6, Math.PI / 2);
  g.add(log);
  col(cx + 3, cz + 2, 0.6);
  col(cx + 4.4, cz + 1.1, 0.6);
  col(cx + 1.6, cz + 2.9, 0.6);
  for (let i = 0; i < 30; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * 13;
    const fn = k.mesh(new THREE.ConeGeometry(0.18, 0.5, 4), 0x4f9a6a);
    fn.position.set(cx + Math.cos(a) * d, 0.35, cz + Math.sin(a) * d);
    fn.rotation.set(rr(-0.4, 0.4), R() * TAU, rr(-0.4, 0.4));
    g.add(fn);
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const ff = particles({
    type: 'drift',
    n: 140,
    r: 12,
    y0: 0.4,
    y1: 4,
    size: 0.28,
    color: 0xb8ffd8,
    op: 0.9,
    speed: 0.5,
  });
  ff.position.set(cx, 0, cz);
  root.add(ff);
  W.upd.push(ff.userData.update);
  W.night.push({ obj: ff, base: 0.25, night: 1 });
  zone('grove', '萤火林', cx, cz, 13, '这里好暗，蘑菇在发光……晚上来一定更漂亮。', '#6ff2ff');
  const s = seed(k, 'grove', '萤火林', cx, 1.3, cz, false);
  s.nightOnly = true;
}

/* =================== flower goddess shrine =================== */
const SHR_C = { x: -6, z: 94 };
function buildShrine(k, root) {
  const { x: cx, z: cz } = SHR_C,
    g = new THREE.Group(),
    white = 0xe2d6c2,
    wv = [0xd8ccb6, 0xe2d6c2, 0xcfc2ac];
  g.add(disc(k, cx, cz, 10, 0.3, 0xd4c8b2, 0xbdb2a0));
  g.add(disc(k, cx, cz, 7.4, 0.6, 0xe0d4be, null));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU,
      x = cx + Math.cos(a) * 6.4,
      z = cz + Math.sin(a) * 6.4,
      h = i === 3 || i === 7 ? rr(1.4, 2.2) : 3.6;
    const c = new THREE.Group();
    c.add(P(k.mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.3, 12), white), 0, 0.75, 0));
    c.add(P(k.mesh(new THREE.CylinderGeometry(0.32, 0.36, h, 12), pick(wv)), 0, 0.9 + h / 2, 0));
    if (h > 3) c.add(P(k.mesh(new THREE.BoxGeometry(0.9, 0.25, 0.9), white), 0, 0.9 + h + 0.12, 0));
    for (let m = 0; m < 6; m++) {
      const y = rr(1, 0.9 + h);
      c.add(
        P(
          k.mesh(k.sphere(rr(0.1, 0.16)), m % 3 ? 0x6fbf5a : pick([0xff8fb3, 0xffffff, 0xffd23f])),
          Math.cos(m * 2) * 0.36,
          y,
          Math.sin(m * 2) * 0.36,
        ),
      );
    }
    c.position.set(x, 0, z);
    g.add(c);
    col(x, z, 0.55);
  }
  for (const [i, j] of [
    [0, 1],
    [5, 6],
  ]) {
    const a = ((i + 0.5) / 10) * TAU;
    const l = k.mesh(new THREE.BoxGeometry(4.2, 0.35, 0.8), white);
    l.position.set(cx + Math.cos(a) * 6.3, 4.72, cz + Math.sin(a) * 6.3);
    l.rotation.y = -a + Math.PI / 2;
    g.add(l);
  }
  // statue of the flower keeper
  const st = P(new THREE.Group(), cx, 0.6, cz);
  st.add(P(k.mesh(new THREE.CylinderGeometry(1, 1.15, 0.8, 16), 0xdcd2c2), 0, 0.4, 0));
  st.add(
    P(
      k.mesh(
        lathe(
          [
            [0.001, 0],
            [0.7, 0],
            [0.62, 0.5],
            [0.45, 1.4],
            [0.3, 2],
            [0.2, 2.25],
            [0.001, 2.3],
          ],
          16,
        ),
        white,
      ),
      0,
      0.8,
      0,
    ),
  );
  st.add(P(k.mesh(k.sphere(0.36), white), 0, 3.35, 0));
  st.add(P(k.mesh(k.sphere(0.22), white), 0, 3.62, -0.2));
  const hood = k.mesh(new THREE.SphereGeometry(0.42, 16, 10, 0, TAU, 0, Math.PI * 0.55), 0xd8ccb6);
  hood.position.set(0, 3.4, -0.04);
  hood.rotation.x = -0.3;
  st.add(hood);
  for (const s of [-1, 1]) {
    const ar = k.mesh(capsule(0.1, 0.6, 10, 4), white);
    ar.position.set(s * 0.34, 2.55, 0.3);
    ar.rotation.set(-1.2, 0, s * 0.4);
    st.add(ar);
  }
  const bowl = k.mesh(new THREE.SphereGeometry(0.45, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), 0xdcd2c2, {
    side: THREE.DoubleSide,
  });
  bowl.position.set(0, 2.4, 0.62);
  st.add(bowl);
  g.add(st);
  col(cx, cz, 1.3);
  const bl = new THREE.Group();
  bl.userData.dynamic = true;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    bl.add(
      P(
        k.mesh(k.sphere(rr(0.12, 0.17)), pick([0xff8fb3, 0xffd23f, 0xffffff, 0xe84a5f])),
        Math.cos(a) * rr(0.1, 0.3),
        0,
        Math.sin(a) * rr(0.1, 0.3),
      ),
    );
  }
  mergeGroup(bl);
  bl.position.set(cx, 0.6 + 2.52, cz + 0.62);
  bl.scale.setScalar(0.001);
  g.add(bl);
  const halo = P(glow(0xfff0c0, 6, 0), cx, 3.6, cz + 0.3);
  g.add(halo);
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  W.dyn.shrine = { bl, halo, done: false, t: -1 };
  inter({
    id: 'offer',
    x: cx,
    z: cz + 2,
    r: 2.2,
    label: '把花放进石像的花篮',
    enabled: () => W.dyn.hasFlower && !W.dyn.shrine.done,
  });
  inter({
    id: 'statue',
    x: cx,
    z: cz + 2,
    r: 2.2,
    label: '看看石像',
    enabled: () => !W.dyn.hasFlower && !W.dyn.shrine.done,
  });
  zone('shrine', '花神石像', cx, cz, 10, '石像捧着一个空空的花篮……', '#f4ede0');
  seed(k, 'shrine', '花神石像', cx, 1.9, cz + 2.3, true);
}

/* =================== balloon pad =================== */
const BAL_C = { x: 68, z: 66 };
function balloonMesh(k) {
  const g = new THREE.Group();
  const cols = [0xff8a5b, 0xfff1d6, 0xffd23f, 0xfff1d6, 0xe84a5f, 0xfff1d6, 0x7cc85e, 0xfff1d6];
  const prof = [
      [0.001, -3.2],
      [1.2, -2.6],
      [2.6, -1],
      [3.3, 0.8],
      [3.1, 2.4],
      [2.2, 3.6],
      [0.001, 4.1],
    ].map((p) => new V2(p[0], p[1])),
    env = new THREE.Group();
  cols.forEach((c, i) =>
    env.add(k.mesh(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(22), 6, (i / 8) * TAU, TAU / 8), c)),
  );
  mergeGroup(env);
  env.position.y = 7.2;
  g.add(env);
  const bk = new THREE.Group();
  bk.add(P(k.mesh(new THREE.BoxGeometry(1.8, 0.9, 1.8), 0xc89a5a), 0, 0.45, 0));
  bk.add(P(k.mesh(new THREE.BoxGeometry(1.95, 0.14, 1.95), 0x8a5a3c), 0, 0.92, 0));
  g.add(bk);
  const burner = P(k.mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.3, 10), 0x6e6e7a), 0, 3.2, 0);
  g.add(burner);
  const fl = P(glow(0xffa040, 2.2, 0.0), 0, 3.5, 0);
  g.add(fl);
  const pts = [];
  for (const [x, z] of [
    [0.9, 0.9],
    [-0.9, 0.9],
    [0.9, -0.9],
    [-0.9, -0.9],
  ]) {
    pts.push(new V3(x, 0.95, z), new V3(x * 1.3, 4.4, z * 1.3));
  }
  g.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: INKC })),
  );
  mergeGroup(g);
  return { g: k.ink(g, 0.012), fl };
}
function buildBalloon(k, root) {
  const { x: cx, z: cz } = BAL_C;
  root.add(k.ink(disc(k, cx, cz, 7, 0.2, 0x8fcf6a, 0xbdb2a0), 0.012));
  const pad = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    pad.add(
      P(k.mesh(new THREE.BoxGeometry(0.9, 0.1, 0.5), 0xc08a58), cx + Math.cos(a) * 2.4, 0.26, cz + Math.sin(a) * 2.4),
    ).children;
    pad.children[i].rotation.y = -a;
  }
  for (const [dx, dz] of [
    [-4.5, 2],
    [4.2, -2.8],
  ]) {
    const hb = k.mesh(new THREE.CylinderGeometry(0.6, 0.6, 1, 14), 0xe8c96a);
    hb.rotation.z = Math.PI / 2;
    hb.position.set(cx + dx, 0.7, cz + dz);
    pad.add(hb);
    col(cx + dx, cz + dz, 0.8);
  }
  // picnic blanket nearby
  const pic = P(new THREE.Group(), cx - 10, 0, cz + 8);
  pic.add(P(k.mesh(new THREE.BoxGeometry(3, 0.04, 2.4), 0xe84a5f), 0, 0.2, 0));
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++)
      if ((i + j) % 2)
        pic.add(P(k.mesh(new THREE.BoxGeometry(0.72, 0.05, 0.78), 0xfff4e6), -1.1 + i * 0.74, 0.21, -0.8 + j * 0.8));
  pic.add(P(k.mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.35, 12), 0xc89a5a), 0.9, 0.4, -0.5));
  pic.add(P(k.mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 16), 0xffffff), -0.6, 0.25, 0.4));
  for (let i = 0; i < 3; i++)
    pic.add(P(k.mesh(k.sphere(0.1), pick([0xff8a5b, 0xffd23f, 0xe84a5f])), -0.7 + i * 0.12, 0.33, 0.4));
  pad.add(pic);
  W.raised.push({ x: cx - 10, z: cz + 8, w: 3, d: 2.4, h: 0.2 });
  mergeGroup(pad);
  root.add(k.ink(pad, 0.012));
  const b = balloonMesh(k);
  b.g.position.set(cx, 0.2, cz);
  b.g.userData.dynamic = true;
  root.add(b.g);
  col(cx, cz, 1.2);
  const path = new THREE.CatmullRomCurve3(
    [
      [cx, 0.2, cz],
      [cx - 4, 10, cz - 6],
      [40, 34, 34],
      [18, 52, 12],
      [0, 61, 0],
      [-26, 52, -18],
      [-60, 44, -34],
      [-86, 40, 4],
      [-60, 40, 58],
      [-14, 40, 96],
      [32, 34, 90],
      [58, 18, 76],
      [cx, 6, cz + 1],
      [cx, 0.2, cz],
    ].map((p) => new V3(p[0], p[1], p[2])),
  );
  W.dyn.balloon = { g: b.g, fl: b.fl, path, t: -1, cx, cz };
  inter({ id: 'balloon', x: cx, z: cz + 2, r: 2.4, label: '坐热气球', enabled: () => W.dyn.balloon.t < 0 });
  inter({ id: 'picnic', x: cx - 10, z: cz + 6.6, r: 2, label: '在野餐布上吃点心' });
  zone('bal', '热气球草坪', cx, cz, 9, '热气球！坐上去能看到整片花海吧？', '#ff8a5b');
  const s = seed(k, 'balloon', '巨树之顶', 0, 62.2, 0, false, 'air');
  s.g.scale.setScalar(2.2);
}

/* =================== mushroom village =================== */
const VIL_C = { x: -82, z: 30 };
function buildVillage(k, root) {
  const { x: cx, z: cz } = VIL_C,
    g = new THREE.Group();
  g.add(disc(k, cx, cz, 12, 0.2, 0x7cc85e, 0xbdb2a0));
  const houses = [];
  const spots = [
    [-4, -4, 1.3, 0xe84a5f],
    [4, -5, 1.05, 0xff8a5b],
    [6, 3, 1.2, 0xb58cff],
    [-5, 5, 1, 0xe84a5f],
    [0.5, 7.5, 0.9, 0x5a86d0],
  ];
  spots.forEach(([dx, dz, s, c], i) => {
    const x = cx + dx,
      z = cz + dz,
      h = new THREE.Group(),
      ry = Math.atan2(-dx, -dz);
    h.add(P(k.mesh(new THREE.CylinderGeometry(1.1 * s, 1.3 * s, 2.2 * s, 18), 0xfff1dc), 0, 1.1 * s, 0));
    const cap = P(k.mesh(new THREE.SphereGeometry(2 * s, 20, 10, 0, TAU, 0, Math.PI / 2), c), 0, 2.1 * s, 0);
    cap.scale.y = 0.75;
    h.add(cap);
    for (let j = 0; j < 7; j++) {
      const aa = (j / 7) * TAU + i,
        th = rr(0.35, 1.1);
      h.add(
        P(
          k.mesh(k.sphere(0.2 * s), 0xffffff),
          Math.sin(th) * Math.cos(aa) * 2 * s,
          2.1 * s + Math.cos(th) * 1.5 * s,
          Math.sin(th) * Math.sin(aa) * 2 * s,
        ),
      );
    }
    const dr = P(k.mesh(new THREE.CylinderGeometry(0.42 * s, 0.42 * s, 0.08, 16), 0x8a5a3c), 0, 0.5 * s, 1.26 * s);
    dr.rotation.x = Math.PI / 2;
    dr.scale.set(1, 1, 1.5);
    h.add(dr);
    h.add(P(k.mesh(k.sphere(0.05), 0xffcf4a), 0.25 * s, 0.55 * s, 1.34 * s));
    const win = P(
      k.mesh(new THREE.CylinderGeometry(0.22 * s, 0.22 * s, 0.06, 14), 0xfff2c2, {
        emissive: 0xffc860,
        emissiveIntensity: 0.8,
      }),
      -0.6 * s,
      1.45 * s,
      1.02 * s,
    );
    win.rotation.set(Math.PI / 2, 0, 0);
    h.add(win);
    const wg = P(glow(0xffcf70, 1.6 * s, 0.2), -0.6 * s, 1.45 * s, 1.3 * s);
    h.add(wg);
    nightGlow(wg, 0.2, 0.9);
    h.position.set(x, 0.2, z);
    h.rotation.y = ry;
    g.add(h);
    col(x, z, 1.35 * s);
    W.camCols.push({ x, y: 2.4 * s, z, r: 2.3 * s });
    const fx = x + Math.sin(ry) * 1.9 * s,
      fz = z + Math.cos(ry) * 1.9 * s;
    houses.push({ x: fx, z: fz });
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3;
    const lp = new THREE.Group();
    lp.add(P(k.mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.5, 8), 0x6e5a4a), 0, 0.75, 0));
    lp.add(P(k.mesh(k.sphere(0.16), 0xfff2c2, { emissive: 0xffb050, emissiveIntensity: 0.9 }), 0, 1.6, 0));
    const lg = P(glow(0xffc070, 1.4, 0.2), 0, 1.6, 0);
    lp.add(lg);
    nightGlow(lg, 0.2, 0.95);
    lp.position.set(cx + Math.cos(a) * 9.5, 0.2, cz + Math.sin(a) * 9.5);
    g.add(lp);
  }
  for (let i = 0; i < 16; i++) {
    const a = R() * TAU,
      d = rr(1, 10);
    g.add(
      P(
        k.mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 8), 0xd9cfbf),
        cx + Math.cos(a) * d,
        0.22,
        cz + Math.sin(a) * d,
      ),
    );
  }
  const sign = P(new THREE.Group(), cx + 11, 0.2, cz - 2);
  sign.add(P(k.mesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), 0x8a5a3c), 0, 0.65, 0));
  sign.add(P(k.mesh(new THREE.BoxGeometry(1.1, 0.5, 0.08), 0xfff1dc), 0, 1.2, 0));
  sign.add(P(k.mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, TAU, 0, Math.PI / 2), 0xe84a5f), 0, 1.45, 0));
  g.add(sign);
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const lines = [
    [
      '里面传来细细的声音：「谁呀？我在烤蘑菇派！」',
      '「嘘……宝宝刚睡着。」',
      '「欢迎来蘑菇村！你们是从巨树那边来的吗？」',
      '「听说巨树从前会开花，我奶奶见过！」',
      '「门口的灯是萤火虫帮忙点的哦。」',
    ],
  ];
  houses.forEach((h, i) =>
    inter({ id: 'house' + i, x: h.x, z: h.z, r: 1.5, label: '敲敲蘑菇屋的门', line: lines[0][i] }),
  );
  zone('vil', '蘑菇村', cx, cz, 12, '好小的房子……住的是谁呀？', '#e84a5f');
}

/* =================== windmill =================== */
const MILL_C = { x: 94, z: 14 };
function buildWindmill(k, root) {
  const { x: cx, z: cz } = MILL_C,
    g = new THREE.Group();
  g.add(disc(k, cx, cz, 7, 0.25, 0x9ccf6a, 0xbdb2a0));
  g.add(
    P(
      k.mesh(
        lathe(
          [
            [0.001, 0],
            [2.2, 0],
            [2.1, 0.3],
            [1.6, 6.5],
            [1.5, 6.8],
            [0.001, 6.8],
          ],
          18,
        ),
        0xfff1dc,
      ),
      cx,
      0.25,
      cz,
    ),
  );
  const roof = P(k.mesh(new THREE.ConeGeometry(2, 2.2, 18), 0xe84a5f), cx, 8.1, cz);
  g.add(roof);
  g.add(P(k.mesh(new THREE.BoxGeometry(1, 1.7, 0.1), 0x8a5a3c), cx - 2.08, 1.1, cz)).children;
  g.children[g.children.length - 1].rotation.y = Math.PI / 2;
  for (const y of [3.2, 5.2]) {
    const w = P(
      k.mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 14), 0xfff2c2, { emissive: 0xffc860, emissiveIntensity: 0.5 }),
      cx - 1.75 + (y - 3.2) * 0.1,
      y,
      cz,
    );
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  for (let i = 0; i < 5; i++) {
    const hb = k.mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12), 0xe8c96a);
    hb.rotation.x = Math.PI / 2;
    hb.position.set(cx - 4 + rr(-0.5, 0.5), 0.65, cz + 3.5 - i * 1.3);
    g.add(hb);
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  col(cx, cz, 2.3);
  for (let y = 1; y < 8; y += 2) W.camCols.push({ x: cx, y, z: cz, r: 2.5 });
  col(cx - 4, cz + 1, 1.2);
  col(cx - 4, cz - 1.5, 1.2);
  const hub = P(new THREE.Group(), cx - 2.1, 6, cz);
  hub.userData.dynamic = true;
  hub.rotation.y = -Math.PI / 2;
  const bl = new THREE.Group();
  hub.add(bl);
  bl.add(P(k.mesh(k.sphere(0.35), 0x8a5a3c), 0, 0, 0.1));
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i / 4) * TAU;
    arm.add(P(k.mesh(new THREE.BoxGeometry(0.16, 4.6, 0.12), 0x8a5a3c), 0, 2.4, 0.15));
    const sail = P(k.mesh(new THREE.BoxGeometry(1.2, 3.6, 0.04), 0xfff4e6), 0.68, 2.7, 0.18);
    arm.add(sail);
    for (let j = 0; j < 4; j++)
      arm.add(P(k.mesh(new THREE.BoxGeometry(1.25, 0.05, 0.06), 0x8a5a3c), 0.68, 1.2 + j * 1, 0.2));
    bl.add(arm);
  }
  mergeGroup(bl);
  root.add(k.ink(hub, 0.012));
  W.dyn.mill = { bl, sp: 0.5, boost: 0 };
  inter({ id: 'mill', x: cx - 3.6, z: cz, r: 2.6, label: '推一把风车' });
  zone('mill', '风车坡', cx, cz, 9, '风车在转！咯吱咯吱。', '#e84a5f');
}

/* =================== lantern lake behind the cliff =================== */
const LAKE_C = { x: 0, z: -96 };
function buildLake(k, root) {
  const { x: cx, z: cz } = LAKE_C,
    g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    g.add(P(k.mesh(new THREE.BoxGeometry(2.2, 0.12, 0.8), pick([0xc08a58, 0xb07a4a])), cx, 0.22, cz + 12 - i * 0.85));
  }
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++)
      g.add(P(k.mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), 0x8a5a3c), cx + s * 1.05, 0.3, cz + 12 - i * 3.4));
  W.raised.push({ x: cx, z: cz + 8.6, w: 2.2, d: 7.6, h: 0.25 });
  for (let i = 0; i < 26; i++) {
    const a = R() * TAU,
      d = rr(6, 20),
      s = rr(0.5, 0.9);
    const pd = k.mesh(
      new THREE.CylinderGeometry(s, s, 0.05, 18, 1, false, 0.3, TAU - 0.3),
      pick([0x5aa84e, 0x6fbf5a, 0x4f9448]),
    );
    pd.position.set(cx + Math.cos(a) * d, 0.03, cz + Math.sin(a) * d);
    pd.rotation.y = R() * TAU;
    pd.castShadow = false;
    g.add(pd);
  }
  for (let i = 0; i < 5; i++) {
    const rk = rock(k, rr(1, 2), pick([0xa39a8e, 0xb0a698]));
    rk.position.set(cx + rr(-18, 18), rr(-0.3, 0.2), cz - rr(14, 20));
    rk.scale.y = 0.6;
    g.add(rk);
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const lotus = (c) => {
    const f = new THREE.Group();
    for (let l = 0; l < 2; l++)
      for (let p = 0; p < 7; p++) {
        const pa = (p / 7) * TAU + l * 0.45;
        const pe = k.mesh(new THREE.SphereGeometry(0.14, 8, 6), l ? c : 0xfff4f6);
        pe.scale.set(0.55, 1.3, 0.35);
        pe.position.set(Math.cos(pa) * 0.13 * (1 + l * 0.4), 0.16, Math.sin(pa) * 0.13 * (1 + l * 0.4));
        pe.lookAt(
          pe.position
            .clone()
            .multiplyScalar(3)
            .add(new V3(0, 0.8, 0)),
        );
        f.add(pe);
      }
    f.add(
      P(
        k.mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 10), 0xfff2c2, {
          emissive: 0xffb050,
          emissiveIntensity: 1,
        }),
        0,
        0.22,
        0,
      ),
    );
    mergeGroup(f);
    const gl = P(glow(0xffc070, 1.8, 0.2), 0, 0.4, 0);
    f.add(gl);
    k.ink(f, 0.011);
    return { f, gl };
  };
  const L = [];
  for (let i = 0; i < 16; i++) {
    const o = lotus(pick([0xffc6d6, 0xffb3c6, 0xfff1a8]));
    const a = R() * TAU,
      d = rr(4, 18);
    o.f.position.set(cx + Math.cos(a) * d, 0.02, cz + Math.sin(a) * d);
    root.add(o.f);
    nightGlow(o.gl, 0.2, 1);
    L.push({ f: o.f, gl: o.gl, ph: R() * TAU, vx: rr(-0.08, 0.08), vz: rr(-0.08, 0.08) });
  }
  const swans = [];
  for (let i = 0; i < 2; i++) {
    const s = new THREE.Group();
    const b = k.mesh(k.sphere(0.45), 0xffffff);
    b.scale.set(0.8, 0.6, 1.3);
    b.position.y = 0.25;
    s.add(b);
    const nk = k.mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new V3(0, 0.4, 0.4),
          new V3(0, 0.9, 0.55),
          new V3(0, 1.2, 0.4),
          new V3(0, 1.25, 0.55),
        ]),
        12,
        0.08,
        8,
      ),
      0xffffff,
    );
    s.add(nk);
    s.add(P(k.mesh(new THREE.ConeGeometry(0.06, 0.2, 8), 0xff8a5b), 0, 1.23, 0.72)).children;
    s.children[2].rotation.x = Math.PI / 2;
    s.add(P(k.mesh(k.sphere(0.1), 0xffffff), 0, 0.45, -0.5));
    mergeGroup(s);
    root.add(k.ink(s, 0.012));
    swans.push({ g: s, a: i * Math.PI, r: 9 + i * 4 });
  }
  W.dyn.lake = { L, swans, cx, cz, made: [] };
  W.dyn.lotusMaker = lotus;
  inter({ id: 'lantern', x: cx, z: cz + 5.4, r: 1.8, label: '放一盏河灯' });
  zone('lake', '河灯湖', cx, cz, 17, '瀑布后面还有一个湖！水上漂着灯。', '#ffc070');
}

/* =================== far sky islands (scenery) =================== */
function buildSkyIslands(k, root) {
  for (const [a, d, y, s] of [
    [0.4, 170, 70, 1.2],
    [2.2, 190, 58, 1],
    [3.6, 160, 80, 0.8],
    [5, 200, 66, 1.3],
  ]) {
    const g = new THREE.Group();
    const base = k.mesh(new THREE.ConeGeometry(9, 12, 9), pick([0xb0a698, 0xa39a8e]));
    base.rotation.x = Math.PI;
    base.position.y = -6;
    g.add(base);
    const top = k.mesh(new THREE.CylinderGeometry(9.3, 9, 1.4, 20), 0x7cc85e);
    g.add(top);
    for (let i = 0; i < 5; i++) {
      const t = roundTree(k, rr(2, 3), 0x7a5c4a, [0x6fbf5a, 0x8fd16a]);
      t.position.set(rr(-5, 5), 0.6, rr(-5, 5));
      g.add(t);
    }
    const wf = k.mesh(new THREE.BoxGeometry(1.2, 14, 0.2), 0xd8f2ff, { emissive: 0x9fd8ff, emissiveIntensity: 0.3 });
    wf.position.set(8.6, -6.5, 0);
    g.add(wf);
    g.traverse((n) => {
      if (n.isMesh) n.castShadow = false;
    });
    g.scale.setScalar(s);
    g.position.set(Math.cos(a) * d, y, Math.sin(a) * d);
    mergeGroup(g);
    g.userData.dynamic = true;
    root.add(k.ink(g, 0.012));
    W.upd.push((t) => {
      g.position.y = y + Math.sin(t * 0.3 + a) * 1.2;
    });
  }
}
