/* =================== waterfall cliff and hidden cave =================== */
const CLIFF_Z = -58;
/* the rock face is recessed around the waterfall so the water isn't hidden behind boulders */
function buildCliff(k, root) {
  const g = new THREE.Group(),
    cz = CLIFF_Z,
    rc = [0xa39a8e, 0x958c80, 0xb0a698, 0x9a9185];
  for (let x = -34; x <= 34; x += 3.1) {
    for (let y = 0; y < 19; y += 3.4) {
      if (Math.abs(x) < 3.6 && y < 5.5) continue;
      const r = rr(2.3, 3.3) * (1 - Math.abs(x) / 90);
      const rk = rock(k, r, pick(rc));
      rk.position.set(
        x + rr(-0.6, 0.6),
        y + rr(0, 1),
        cz - Math.abs(x) * 0.12 + rr(-1.2, 0.8) - (Math.abs(x) < 6.5 ? 2.4 : 0),
      );
      rk.scale.set(1, rr(0.9, 1.3), 0.85);
      rk.castShadow = false;
      g.add(rk);
    }
  }
  for (let x = -34; x <= 34; x += 5) {
    if (Math.abs(x) < 5.5) continue;
    const c = k.mesh(k.sphere(rr(3.8, 5)), pick([0x6fbf5a, 0x7cc85e]));
    c.scale.y = 0.35;
    c.position.set(x + rr(-1, 1), 20.2, cz - Math.abs(x) * 0.12 - 1);
    c.castShadow = false;
    g.add(c);
  }
  for (const x of [-26, -17, -9, 10, 19, 28]) {
    const t = roundTree(k, rr(1.6, 2.3), 0x7a5c4a, [0x6fbf5a, 0x8fd16a, 0x5aa84e]);
    t.position.set(x, 20.6, cz - Math.abs(x) * 0.12 - 1.5);
    g.add(t);
  }
  // cave walls, ceiling and crystals
  for (let z = cz + 0.5; z > cz - 7; z -= 1.8) {
    for (const s of [-1, 1])
      for (let y = 0.5; y < 5.5; y += 1.9) {
        const rk = rock(k, rr(1.1, 1.5), pick(rc));
        rk.position.set(s * rr(4.1, 4.6), y, z);
        g.add(rk);
      }
  }
  for (let x = -4; x <= 4; x += 1.9)
    for (let y = 0.5; y < 5.5; y += 1.9) {
      const rk = rock(k, rr(1.2, 1.6), pick(rc));
      rk.position.set(x, y, cz - 7.6);
      g.add(rk);
    }
  for (let x = -4; x <= 4; x += 2.2)
    for (let z = cz - 0.8; z > cz - 8; z -= 2.2) {
      const rk = rock(k, rr(1.4, 1.8), pick(rc));
      rk.position.set(x, 6.2, z);
      g.add(rk);
    }
  const fl = P(k.mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.3, 20), 0x8a8478), 0, -0.05, cz - 3.3);
  fl.castShadow = false;
  g.add(fl);
  W.raised.push({ x: 0, z: cz - 3.3, r: 3.8, h: 0.1 });
  const cry = new THREE.Group();
  cry.userData.dynamic = true;
  const cc = [0x6ff2ff, 0xb69cff, 0x8fe8ff];
  for (const [x, z, s] of [
    [-2.8, cz - 5.8, 1.2],
    [2.9, cz - 5.4, 1],
    [-3.2, cz - 2, 0.8],
    [3.1, cz - 1.6, 0.7],
    [0, cz - 6.6, 1.3],
  ]) {
    const c = pick(cc);
    const m = new THREE.MeshToonMaterial({ color: c, gradientMap: toonGrad, emissive: c, emissiveIntensity: 0.55 });
    for (let i = 0; i < 4; i++) {
      const h = rr(0.8, 1.8) * s,
        r = rr(0.14, 0.26) * s;
      const pr = new THREE.Group();
      pr.add(P(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 6), m), 0, h / 2, 0));
      pr.add(P(new THREE.Mesh(new THREE.ConeGeometry(r, r * 1.7, 6), m), 0, h + r * 0.85, 0));
      pr.position.set(x + rr(-0.3, 0.3), 0, z + rr(-0.3, 0.3));
      pr.rotation.set(rr(-0.4, 0.4), R() * TAU, rr(-0.4, 0.4));
      cry.add(pr);
    }
    const gg = P(glow(c, 3.5, 0.55), x, 1, z);
    cry.add(gg);
  }
  mergeGroup(cry);
  g.add(cry);
  const pl = new THREE.PointLight(0x8fe8ff, 1.4, 11, 1.6);
  pl.position.set(0, 3, cz - 4);
  g.add(pl);
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  waterfall(k, root, null, 0, 20.2, cz + 1.3, 9.6, 20.6, 0, { stream: 7 });
  for (const sx of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const b = rock(k, rr(1, 1.5), pick(rc));
      b.position.set(sx * rr(4.9, 5.6), 20 + rr(-0.2, 0.5), cz - 0.5 - i * 1.8);
      b.castShadow = false;
      root.add(k.ink(b, 0.012));
    } // stream banks
  colLine(-36, cz + 2.2, -4.3, cz + 1.4, 1.3);
  colLine(4.3, cz + 1.4, 36, cz + 2.2, 1.3);
  colLine(-4.4, cz + 1, -4.4, cz - 7, 0.7);
  colLine(4.4, cz + 1, 4.4, cz - 7, 0.7);
  colLine(-4.4, cz - 7.1, 4.4, cz - 7.1, 0.7);
  W.mapShapes.push({ t: 'r', x: 0, z: cz - 2, w: 70, d: 6, c: 0x958c80 });
  zone('fall', '瀑布后面', 0, cz + 5, 10, '瀑布后面好像有光……', '#8fd8ff');
  seed(k, 'cave', '瀑布洞穴', 0, 1.1, cz - 4.4, false);
}

/* =================== rune stone circle =================== */
const RUNE_C = { x: -38, z: -26 };
function runeTex(kind) {
  const t = ctex(128, (g, s) => {
    g.strokeStyle = '#fff';
    g.fillStyle = '#fff';
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.translate(s / 2, s / 2);
    g.beginPath();
    if (kind === 0) {
      g.arc(0, 0, 34, 0.6, TAU - 0.6);
      g.stroke();
      g.beginPath();
      g.arc(14, 0, 26, Math.PI * 0.62, Math.PI * 1.38, false);
      g.stroke();
    } else if (kind === 1) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU - Math.PI / 2,
          b = ((i + 2) / 5) * TAU - Math.PI / 2;
        g.moveTo(Math.cos(a) * 36, Math.sin(a) * 36);
        g.lineTo(Math.cos(b) * 36, Math.sin(b) * 36);
      }
      g.stroke();
    } else if (kind === 2) {
      g.moveTo(0, 40);
      g.lineTo(0, -38);
      g.moveTo(0, 10);
      g.quadraticCurveTo(-34, -6, -22, -34);
      g.moveTo(0, -4);
      g.quadraticCurveTo(34, -20, 24, -40);
      g.stroke();
    } else {
      g.moveTo(0, -38);
      g.quadraticCurveTo(30, 4, 22, 18);
      g.arc(0, 16, 22, 0, Math.PI);
      g.quadraticCurveTo(-30, 4, 0, -38);
      g.stroke();
    }
  });
  t.userData = {};
  return t;
}
function buildRunes(k, root) {
  const { x: cx, z: cz } = RUNE_C,
    g = P(new THREE.Group(), cx, 0, cz);
  root.add(k.ink(disc(k, cx, cz, 8.4, 0.16, 0xbfb4a2, 0xa39a8e), 0.012));
  for (let i = 0; i < 46; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * 7.6;
    const t = k.mesh(
      new THREE.CylinderGeometry(rr(0.45, 0.7), rr(0.5, 0.75), 0.1, 6),
      pick([0xd9cfbf, 0xcfc4b2, 0xc4b9a6]),
    );
    t.position.set(Math.cos(a) * d, 0.17, Math.sin(a) * d);
    t.rotation.y = R();
    t.castShadow = false;
    g.add(t);
  }
  const runes = [],
    rc = [0xb0a698, 0xa39a8e, 0xbdb2a0];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.2,
      h = rr(3.6, 4.8);
    const st = k.mesh(jitterGeo(new THREE.BoxGeometry(1.4, h, 0.9, 2, 3, 2), 0.12), pick(rc));
    st.position.set(Math.cos(a) * 7, h / 2, Math.sin(a) * 7);
    st.rotation.y = -a + Math.PI / 2;
    g.add(st);
    col(cx + Math.cos(a) * 7, cz + Math.sin(a) * 7, 0.95);
    for (let m = 0; m < 4; m++) {
      const ms = k.mesh(k.sphere(rr(0.14, 0.24)), pick([0x6fbf5a, 0x5aa84e]));
      ms.position.set(Math.cos(a) * 7 + rr(-0.5, 0.5), rr(0.5, h), Math.sin(a) * 7 + rr(-0.5, 0.5));
      g.add(ms);
    }
    if (i % 2 === 1) {
      const tx = runeTex((i - 1) / 2);
      const rm = new THREE.MeshBasicMaterial({ map: tx, transparent: true, color: 0x4f5870, depthWrite: false });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), rm);
      pl.position.set(Math.cos(a) * 6.52, 2.1, Math.sin(a) * 6.52);
      pl.lookAt(0, 2.1, 0);
      pl.userData.keepAlone = true;
      g.add(pl);
      const gl = P(glow(0x7ff5ff, 2.4, 0), pl.position.x * 0.97, 2.1, pl.position.z * 0.97);
      g.add(gl);
      runes.push({ m: rm, gl, lit: false, x: cx + Math.cos(a) * 5.6, z: cz + Math.sin(a) * 5.6 });
    }
  }
  for (const [i, j] of [
    [0, 1],
    [4, 5],
  ]) {
    const a = ((i + 0.5) / 8) * TAU + 0.2;
    const l = k.mesh(new THREE.BoxGeometry(3.4, 0.7, 1), 0xa39a8e);
    l.position.set(Math.cos(a) * 6.9, 5.1, Math.sin(a) * 6.9);
    l.rotation.y = -a + Math.PI / 2;
    g.add(l);
  }
  // central arch and portal
  const ar = new THREE.Group();
  for (const s of [-1, 1])
    for (let j = 0; j < 5; j++) {
      const b = k.mesh(new THREE.BoxGeometry(0.8, 0.62, 0.8), pick(rc));
      b.position.set(s * 1.9, 0.31 + j * 0.62, 0);
      b.rotation.y = rr(-0.1, 0.1);
      ar.add(b);
    }
  ar.add(P(k.mesh(new THREE.TorusGeometry(1.9, 0.38, 8, 28, Math.PI), 0xb0a698), 0, 3.1, 0));
  for (let m = 0; m < 18; m++) {
    const a = R() * Math.PI;
    ar.add(P(k.mesh(k.sphere(rr(0.12, 0.2)), 0x6fbf5a), Math.cos(a) * 1.9, 3.1 + Math.sin(a) * 1.9, rr(-0.35, 0.35)));
  }
  ar.rotation.y = Math.PI / 2;
  g.add(ar);
  col(cx, cz + 1.9, 0.6);
  col(cx, cz - 1.9, 0.6);
  const portal = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 40),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { t: { value: 0 }, a: { value: 0 } },
      vertexShader:
        'varying vec2 vU;void main(){vU=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'uniform float t,a;varying vec2 vU;void main(){float r=length(vU)*2.;float an=atan(vU.y,vU.x);float s=sin(an*5.+r*14.-t*3.)*.5+.5;vec3 c=mix(vec3(.5,1.,1.),vec3(.85,.7,1.),s);float al=a*smoothstep(1.,.75,r)*(.55+.45*s);gl_FragColor=vec4(c,al);}',
    }),
  );
  portal.position.set(0, 3, 0);
  portal.rotation.y = Math.PI / 2;
  portal.userData.keepAlone = true;
  g.add(portal);
  mergeGroup(g);
  root.add(k.ink(g, 0.013));
  W.dyn.runes = { list: runes, solved: false, portal };
  runes.forEach((r, i) =>
    inter({ id: 'rune' + i, x: r.x, z: r.z, r: 1.7, label: '触碰符文石', enabled: () => !r.lit }),
  );
  zone('runes', '石环遗迹', cx, cz, 9, '这些石头上刻着奇怪的符号。', '#b0a698');
  seed(k, 'runes', '石环遗迹', cx, 1.4, cz, true);
}

/* =================== fairy mushroom ring =================== */
const RING_C = { x: -32, z: 16 };
function buildRing(k, root) {
  const { x: cx, z: cz } = RING_C,
    g = P(new THREE.Group(), cx, 0, cz);
  root.add(k.ink(disc(k, cx, cz, 7.2, 0.14, 0x6fae5a, null), 0.012));
  const ms = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU,
      s = rr(0.8, 1.15);
    const m = P(new THREE.Group(), Math.cos(a) * 4.2, 0.14, Math.sin(a) * 4.2);
    m.userData.dynamic = true;
    m.add(P(k.mesh(new THREE.CylinderGeometry(0.16 * s, 0.22 * s, 0.7 * s, 14), 0xfff1e0), 0, 0.35 * s, 0));
    const cp = P(k.mesh(new THREE.SphereGeometry(0.55 * s, 22, 10, 0, TAU, 0, Math.PI / 2), 0xe84a4a), 0, 0.66 * s, 0);
    cp.scale.y = 0.72;
    m.add(cp);
    for (let j = 0; j < 5; j++) {
      const aa = R() * TAU,
        th = rr(0.3, 1.1);
      m.add(
        P(
          k.mesh(k.sphere(0.06 * s), 0xffffff),
          Math.sin(th) * Math.cos(aa) * 0.55 * s,
          0.66 * s + Math.cos(th) * 0.55 * s * 0.72,
          Math.sin(th) * Math.sin(aa) * 0.55 * s,
        ),
      );
    }
    mergeGroup(m);
    g.add(m);
    ms.push({ g: m, base: 0.14, v: 0, t: -1 });
    col(cx + Math.cos(a) * 4.2, cz + Math.sin(a) * 4.2, 0.45);
  }
  for (let i = 0; i < 22; i++) {
    const a = R() * TAU,
      d = rr(5.2, 6.8),
      s = rr(0.3, 0.5);
    const m = P(new THREE.Group(), Math.cos(a) * d, 0.14, Math.sin(a) * d);
    m.add(P(k.mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 0.6 * s, 10), 0xfff1e0), 0, 0.3 * s, 0));
    const cp = P(
      k.mesh(new THREE.SphereGeometry(0.4 * s, 16, 8, 0, TAU, 0, Math.PI / 2), pick([0xffb347, 0xe84a4a, 0xc9a6ff])),
      0,
      0.58 * s,
      0,
    );
    cp.scale.y = 0.7;
    m.add(cp);
    g.add(m);
  }
  for (let i = 0; i < 30; i++) {
    const a = R() * TAU,
      d = rr(0.5, 6.8);
    const c = k.mesh(new THREE.ConeGeometry(0.05, rr(0.2, 0.4), 4), 0x5a9a48);
    c.position.set(Math.cos(a) * d, 0.3, Math.sin(a) * d);
    g.add(c);
  }
  const fx = [];
  for (let i = 0; i < 10; i++) {
    const s = glow(pick([0xfff4a0, 0xb8ffe0, 0xffc6f0]), 0.9, 0);
    g.add(s);
    fx.push(s);
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.013));
  W.dyn.ring = { ms, fx, t: -1, done: false, cx, cz };
  zone('ring', '蘑菇圈', cx, cz, 8, '站到圈中间去试试？', '#e84a4a');
  seed(k, 'ring', '蘑菇圈', cx, 1.2, cz, true);
}

/* =================== dandelion slope =================== */
const DAND_C = { x: 32, z: -26 };
function buildDandelions(k, root) {
  const { x: cx, z: cz } = DAND_C;
  root.add(k.ink(disc(k, cx, cz, 10.5, 0.14, 0x9ccf6a, null), 0.012));
  const geo = partsGeo([
    [new THREE.CylinderGeometry(0.012, 0.018, 0.6, 4, 1, true), 0x6aa84f, [0, 0.3, 0]],
    [new THREE.IcosahedronGeometry(0.15, 1), 0xffffff, [0, 0.66, 0]],
    [new THREE.ConeGeometry(0.05, 0.3, 3, 1, true), 0x6aa84f, [0.05, 0.12, 0], [0, 0, -0.5]],
  ]);
  const list = [];
  for (let i = 0; i < 300; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * 10;
    list.push([cx + Math.cos(a) * d, 0.14, cz + Math.sin(a) * d, R() * TAU, rr(0.8, 1.35)]);
  }
  root.add(flora(geo, list, 0.12, true));
  const yel = partsGeo([
    [new THREE.CylinderGeometry(0.01, 0.014, 0.3, 3, 1, true), 0x6aa84f, [0, 0.15, 0]],
    [new THREE.SphereGeometry(0.08, 8, 4), 0xffd23f, [0, 0.32, 0], [0, 0, 0], [1, 0.5, 1]],
  ]);
  const yl = [];
  for (let i = 0; i < 120; i++) {
    const a = R() * TAU,
      d = Math.sqrt(R()) * 10;
    yl.push([cx + Math.cos(a) * d, 0.14, cz + Math.sin(a) * d, R() * TAU, rr(0.9, 1.3)]);
  }
  root.add(flora(yel, yl, 0.08, true));
  grassField(k, root, cx, cz, 10, 0.14, 420);
  W.dyn.dand = { list: list.map((l) => ({ x: l[0], z: l[2], s: l[4], cool: 0 })) };
  zone('dand', '蒲公英坡', cx, cz, 11, '跑过去！种子会飞起来！', '#ffffff');
  seed(k, 'dand', '蒲公英坡', cx, 1.2, cz, false);
}
function grassField(k, root, cx, cz, r, y, n, rect) {
  const geo = partsGeo([
    [new THREE.ConeGeometry(0.035, 0.34, 3, 1, true), 0x7fbf55, [0, 0.17, 0], [0, 0, 0.15]],
    [new THREE.ConeGeometry(0.03, 0.28, 3, 1, true), 0x8fcf5e, [0.04, 0.14, 0.02], [0, 0, -0.25]],
    [new THREE.ConeGeometry(0.03, 0.3, 3, 1, true), 0x6aa84f, [-0.03, 0.15, -0.03], [0.2, 0, 0.1]],
  ]);
  const list = [];
  for (let i = 0; i < n; i++) {
    let x, z;
    if (rect) {
      x = cx + rr(-rect[0] / 2, rect[0] / 2);
      z = cz + rr(-rect[1] / 2, rect[1] / 2);
    } else {
      const a = R() * TAU,
        d = Math.sqrt(R()) * r;
      x = cx + Math.cos(a) * d;
      z = cz + Math.sin(a) * d;
    }
    list.push([x, y, z, R() * TAU, rr(0.8, 1.4)]);
  }
  root.add(flora(geo, list, 0.18, false));
}

/* =================== tulip field with scarecrow =================== */
const TUL_C = { x: 46, z: 8 };
function buildTulips(k, root) {
  const { x: cx, z: cz } = TUL_C,
    W_ = 18,
    D_ = 13;
  root.add(k.ink(rectPatch(k, cx, cz, W_ + 1, D_ + 1, 0.14, 0x9a7a5a), 0.012));
  const cols = [0xff8fb3, 0xe84a5f, 0xffd23f, 0xfff4e6, 0xff8a5b, 0xb58cff, 0xff8fb3];
  cols.forEach((c, ri) => {
    const z = cz - D_ / 2 + 1.2 + ri * 1.75;
    const cup = lathe(
      [
        [0.001, 0],
        [0.07, 0.02],
        [0.11, 0.1],
        [0.11, 0.22],
        [0.09, 0.29],
        [0.001, 0.2],
      ],
      8,
    );
    const geo = partsGeo([
      [new THREE.CylinderGeometry(0.014, 0.018, 0.5, 3, 1, true), 0x5a9a48, [0, 0.25, 0]],
      [new THREE.ConeGeometry(0.07, 0.36, 3), 0x6aa84f, [0.05, 0.2, 0], [0, 0, -0.4], [1, 1, 0.35]],
      [new THREE.ConeGeometry(0.06, 0.3, 3), 0x6aa84f, [-0.05, 0.17, 0], [0, 0, 0.45], [1, 1, 0.35]],
      [cup, c, [0, 0.48, 0]],
    ]);
    const list = [];
    for (let x = -W_ / 2 + 0.4; x < W_ / 2 - 0.3; x += 0.46)
      for (const dz of [-0.22, 0.22])
        list.push([cx + x + rr(-0.06, 0.06), 0.14, z + dz + rr(-0.06, 0.06), R() * TAU, rr(0.9, 1.15)]);
    root.add(flora(geo, list, 0.1, true, 0.01));
  });
  const f = new THREE.Group();
  const post = (x, z) => f.add(P(k.mesh(new THREE.BoxGeometry(0.16, 1.1, 0.16), 0xb07a4a), x, 0.55, z));
  for (let x = -W_ / 2; x <= W_ / 2 + 0.01; x += 1.8) {
    post(cx + x, cz - D_ / 2 - 0.3);
    post(cx + x, cz + D_ / 2 + 0.3);
  }
  for (let z = -D_ / 2; z <= D_ / 2 + 0.01; z += 1.8) {
    post(cx + W_ / 2 + 0.3, cz + z);
    if (Math.abs(z) > 1.5) post(cx - W_ / 2 - 0.3, cz + z);
  }
  for (const y of [0.45, 0.85]) {
    f.add(P(k.mesh(new THREE.BoxGeometry(W_ + 0.6, 0.08, 0.08), 0xc08a58), cx, y, cz - D_ / 2 - 0.3));
    f.add(P(k.mesh(new THREE.BoxGeometry(W_ + 0.6, 0.08, 0.08), 0xc08a58), cx, y, cz + D_ / 2 + 0.3));
    f.add(P(k.mesh(new THREE.BoxGeometry(0.08, 0.08, D_ + 0.6), 0xc08a58), cx + W_ / 2 + 0.3, y, cz));
    for (const s of [-1, 1])
      f.add(
        P(
          k.mesh(new THREE.BoxGeometry(0.08, 0.08, D_ / 2 - 1.5), 0xc08a58),
          cx - W_ / 2 - 0.3,
          y,
          cz + s * (D_ / 4 + 0.75),
        ),
      );
  }
  // sunflowers along the far fence
  for (let i = 0; i < 6; i++) {
    const x = cx + W_ / 2 + 1.4,
      z = cz - D_ / 2 + 1 + i * 2.2,
      h = rr(2.2, 2.9);
    const sf = P(new THREE.Group(), x, 0, z);
    sf.add(P(k.mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 8), 0x5a9a48), 0, h / 2, 0));
    for (const s of [-1, 1]) {
      const lf = k.mesh(new THREE.SphereGeometry(0.22, 10, 6), 0x6aa84f);
      lf.scale.set(1.6, 0.2, 0.8);
      lf.position.set(s * 0.25, h * 0.5 + s * 0.2, 0);
      lf.rotation.z = s * 0.4;
      sf.add(lf);
    }
    const hd = P(new THREE.Group(), 0, h, 0);
    hd.rotation.set(0, -Math.PI / 2 - 0.4, 0);
    hd.add(P(k.mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 20), 0x6e4a2a), 0, 0, 0));
    hd.children[0].rotation.x = Math.PI / 2;
    for (let p = 0; p < 16; p++) {
      const a = (p / 16) * TAU;
      const pe = k.mesh(new THREE.SphereGeometry(0.14, 8, 6), 0xffd23f);
      pe.scale.set(0.5, 1.3, 0.2);
      pe.position.set(Math.cos(a) * 0.48, Math.sin(a) * 0.48, -0.02);
      pe.rotation.z = a - Math.PI / 2;
      hd.add(pe);
    }
    sf.add(hd);
    f.add(sf);
  }
  mergeGroup(f);
  root.add(k.ink(f, 0.012));
  colLine(cx - W_ / 2 - 0.3, cz - D_ / 2 - 0.3, cx + W_ / 2 + 0.3, cz - D_ / 2 - 0.3, 0.25);
  colLine(cx - W_ / 2 - 0.3, cz + D_ / 2 + 0.3, cx + W_ / 2 + 0.3, cz + D_ / 2 + 0.3, 0.25);
  colLine(cx + W_ / 2 + 0.3, cz - D_ / 2, cx + W_ / 2 + 0.3, cz + D_ / 2, 0.25);
  colLine(cx - W_ / 2 - 0.3, cz - D_ / 2, cx - W_ / 2 - 0.3, cz - 1.6, 0.25);
  colLine(cx - W_ / 2 - 0.3, cz + 1.6, cx - W_ / 2 - 0.3, cz + D_ / 2, 0.25);
  // scarecrow
  const sc = P(new THREE.Group(), cx + 2, 0.14, cz + 0.2);
  sc.userData.dynamic = true;
  const body = new THREE.Group();
  sc.add(body);
  body.add(P(k.mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.4, 8), 0x8a5a3c), 0, 1.2, 0));
  const arm = P(k.mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), 0x8a5a3c), 0, 1.75, 0);
  arm.rotation.z = Math.PI / 2;
  body.add(arm);
  body.add(
    P(
      k.mesh(
        lathe(
          [
            [0.001, 0.9],
            [0.34, 0.95],
            [0.4, 1.3],
            [0.36, 1.75],
            [0.2, 1.95],
            [0.001, 1.97],
          ],
          14,
        ),
        0x4f7cc9,
      ),
      0,
      0,
      0,
    ),
  );
  for (let i = 0; i < 4; i++) {
    const pl = k.mesh(new THREE.BoxGeometry(0.05, 0.05, 0.8), 0xe84a5f);
    pl.position.set(0, 1.1 + i * 0.22, 0);
    pl.rotation.y = Math.PI / 2;
    pl.scale.x = 8;
    body.add(pl);
  }
  for (const s of [-1, 1]) {
    body.add(P(k.mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.9, 10), 0x4f7cc9), s * 0.62, 1.75, 0)).children;
    const sl = body.children[body.children.length - 1];
    sl.rotation.z = Math.PI / 2;
    for (let j = 0; j < 4; j++) {
      const st = k.mesh(new THREE.ConeGeometry(0.04, 0.35, 4), 0xe8c96a);
      st.position.set(s * (1.12 + rr(0, 0.1)), 1.75 + rr(-0.12, 0.12), rr(-0.1, 0.1));
      st.rotation.z = (-s * Math.PI) / 2 + rr(-0.4, 0.4);
      body.add(st);
    }
  }
  const hd = P(new THREE.Group(), 0, 2.25, 0);
  body.add(hd);
  hd.add(k.mesh(k.sphere(0.34), 0xe8d2a0));
  for (const s of [-1, 1])
    hd.add(P(k.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), 0x2e3a59), s * 0.12, 0.05, 0.31)).children;
  hd.children.slice(1).forEach((c) => (c.rotation.x = Math.PI / 2));
  const sm = P(k.mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 14, Math.PI), 0x8a4a3a), 0, -0.08, 0.3);
  sm.rotation.z = Math.PI;
  hd.add(sm);
  const hat = P(new THREE.Group(), 0, 0.25, 0);
  hat.add(P(k.mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.05, 20), 0xe8c96a), 0, 0, 0));
  hat.add(P(k.mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.36, 16), 0xe8c96a), 0, 0.18, 0));
  hat.add(P(k.mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.08, 16), 0xe84a5f), 0, 0.06, 0));
  hd.add(hat);
  hat.userData.dynamic = true;
  mergeGroup(body);
  hat.userData.dynamic = false;
  mergeGroup(hat);
  root.add(k.ink(sc, 0.013));
  col(cx + 2, cz + 0.2, 0.5);
  W.dyn.scare = { g: sc, body, hat, t: -1, done: false };
  inter({ id: 'scare', x: cx + 2, z: cz + 1.3, r: 1.8, label: '和稻草人打招呼', enabled: () => !W.dyn.scare.done });
  zone('tulip', '郁金香田', cx, cz, 11, '好多颜色！像打翻的颜料盒。', '#ff8fb3');
  seed(k, 'scare', '郁金香田', cx + 2, 1.2, cz + 1.6, true);
}

/* =================== orchard =================== */
const ORCH_C = { x: 28, z: 42 };
function buildOrchard(k, root) {
  const { x: cx, z: cz } = ORCH_C;
  root.add(k.ink(disc(k, cx, cz, 9, 0.14, 0x8fcf6a, null), 0.012));
  grassField(k, root, cx, cz, 8.6, 0.14, 300);
  const trees = [];
  for (const [dx, dz, s] of [
    [-3, -2, 1.25],
    [3.4, 1.2, 1.05],
    [-1, 4, 0.95],
  ]) {
    const x = cx + dx,
      z = cz + dz;
    const t = P(new THREE.Group(), x, 0.14, z);
    t.userData.dynamic = true;
    const top = new THREE.Group();
    t.add(top);
    t.add(P(k.mesh(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 2.2 * s, 10), 0x8a6a55), 0, 1.1 * s, 0));
    for (let i = 0; i < 7; i++)
      top.add(
        P(
          k.mesh(k.sphere(rr(0.8, 1.15) * s), pick([0x6fbf5a, 0x7cc85e, 0x5aa84e])),
          rr(-0.8, 0.8) * s,
          (2.6 + rr(0, 0.9)) * s,
          rr(-0.8, 0.8) * s,
        ),
      );
    const fruits = [];
    for (let i = 0; i < 9; i++) {
      const a = R() * TAU;
      const f = k.mesh(k.sphere(0.19), 0xffa27a, { emissive: 0xff8a5a, emissiveIntensity: 0.35 });
      f.position.set(Math.cos(a) * 1.25 * s, (2.3 + rr(0, 0.8)) * s, Math.sin(a) * 1.25 * s);
      f.userData.keepAlone = true;
      top.add(f);
      fruits.push(f);
    }
    mergeGroup(t);
    W.camCols.push({ x, y: 3 * s, z, r: 1.6 * s });
    root.add(k.ink(t, 0.013));
    col(x, z, 0.5);
    trees.push({ g: t, top, fruits, x, z, t: -1, shaken: 0 });
    inter({
      id: 'shake' + trees.length,
      x,
      z,
      r: 2.2,
      label: '摇一摇果树',
      enabled: () => fruits.some((f) => f.parent === top),
    });
  }
  const bk = P(new THREE.Group(), cx + 1.2, 0.14, cz - 4.2);
  bk.add(
    P(
      k.mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.45, 14, 1, true), 0xc89a5a, { side: THREE.DoubleSide }),
      0,
      0.23,
      0,
    ),
  );
  for (let i = 0; i < 5; i++) bk.add(P(k.mesh(k.sphere(0.16), 0xffa27a), rr(-0.2, 0.2), 0.4, rr(-0.2, 0.2)));
  const ld = P(new THREE.Group(), cx - 5, 0.14, cz - 1);
  for (const s of [-1, 1]) ld.add(P(k.mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), 0xb07a4a), s * 0.25, 1.2, 0));
  for (let i = 0; i < 6; i++) ld.add(P(k.mesh(new THREE.BoxGeometry(0.5, 0.05, 0.07), 0xb07a4a), 0, 0.3 + i * 0.38, 0));
  ld.rotation.z = 0.25;
  const pr = new THREE.Group();
  pr.add(bk, ld);
  mergeGroup(pr);
  root.add(k.ink(pr, 0.012));
  W.dyn.orch = { trees, falling: [] };
  zone('orch', '果园', cx, cz, 10, '果子闻起来像蜜桃！', '#ffa27a');
  seed(k, 'orch', '果园', cx - 3, 1.2, cz - 2, true);
}

/* =================== lily pond with a frog =================== */
const POND_C = { x: 14, z: 28 };
function buildPond(k, root) {
  const { x: cx, z: cz } = POND_C,
    g = new THREE.Group(),
    pads = [];
  for (let i = 0; i < 22; i++) {
    const a = R() * TAU,
      d = rr(0.8, 6),
      x = cx + Math.cos(a) * d,
      z = cz + Math.sin(a) * d;
    if (pads.some((p) => Math.hypot(p.x - x, p.z - z) < 1.3)) continue;
    const s = rr(0.5, 0.85);
    const pd = k.mesh(
      new THREE.CylinderGeometry(s, s, 0.05, 24, 1, false, 0.3, TAU - 0.3),
      pick([0x5aa84e, 0x6fbf5a, 0x4f9448]),
    );
    pd.position.set(x, 0.03, z);
    pd.rotation.y = R() * TAU;
    pd.castShadow = false;
    g.add(pd);
    pads.push({ x, z, s });
    if (R() < 0.3) {
      const f = P(new THREE.Group(), x, 0.05, z);
      for (let l = 0; l < 2; l++)
        for (let p = 0; p < 8; p++) {
          const pa = (p / 8) * TAU + l * 0.4;
          const pe = k.mesh(k.sphere(0.1), l ? 0xffc6d6 : 0xffffff);
          pe.scale.set(0.55, 1.3, 0.35);
          pe.position.set(Math.cos(pa) * 0.1 * (1 + l * 0.5), 0.12 + l * 0.02, Math.sin(pa) * 0.1 * (1 + l * 0.5));
          pe.lookAt(
            pe.position
              .clone()
              .multiplyScalar(3)
              .add(new V3(0, 0.6, 0)),
          );
          f.add(pe);
        }
      f.add(P(k.mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.06, 12), 0xffd23f), 0, 0.18, 0));
      g.add(f);
    }
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  const fr = new THREE.Group();
  fr.userData.dynamic = true;
  const bd = k.mesh(k.sphere(0.26), 0x7cc85e);
  bd.scale.set(1, 0.7, 1.15);
  bd.position.y = 0.2;
  fr.add(bd);
  for (const s of [-1, 1]) {
    fr.add(P(k.mesh(k.sphere(0.09), 0x7cc85e), s * 0.13, 0.38, 0.14));
    fr.add(P(k.mesh(k.sphere(0.05), 0x2e3a59), s * 0.13, 0.42, 0.2));
    fr.add(P(k.mesh(k.sphere(0.1), 0x6aa84f), s * 0.22, 0.1, -0.1));
  }
  fr.add(P(k.mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 12, Math.PI), 0x2e3a59), 0, 0.2, 0.28)).children;
  fr.children[fr.children.length - 1].rotation.z = Math.PI;
  fr.add(P(k.mesh(new THREE.CircleGeometry(0.05, 10), 0xff9aa8), 0.17, 0.24, 0.26));
  fr.add(P(k.mesh(new THREE.CircleGeometry(0.05, 10), 0xff9aa8), -0.17, 0.24, 0.26));
  mergeGroup(fr);
  root.add(k.ink(fr, 0.012));
  const p0 = pads[0];
  fr.position.set(p0.x, 0.05, p0.z);
  W.dyn.frog = { g: fr, pads, cur: 0, t: -1, from: new V3(), to: new V3() };
  const df = [];
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Group();
    d.add(P(k.mesh(capsule(0.02, 0.3, 6, 3), 0x4f7cc9), 0, 0, 0)).children;
    d.children[0].rotation.x = Math.PI / 2;
    for (const s of [-1, 1])
      for (const z of [0.06, -0.02]) {
        const w = k.mesh(new THREE.PlaneGeometry(0.32, 0.07), 0xdff4ff, {
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });
        w.rotation.x = -Math.PI / 2;
        w.position.set(s * 0.17, 0.01, z);
        d.add(w);
      }
    mergeGroup(d);
    root.add(d);
    df.push({ g: d, ph: R() * TAU, cx: cx + rr(-5, 5), cz: cz + rr(-5, 5) });
  }
  W.dyn.dragon = df;
  zone('pond', '睡莲池', cx, cz, 7, '嘘——荷叶上有一只青蛙。', '#6fbf5a');
}

/* =================== cottage islet =================== */
const COT_C = { x: -27, z: 42 };
function buildCottage(k, root) {
  const { x: cx, z: cz } = COT_C,
    g = new THREE.Group();
  g.add(disc(k, cx, cz, 8, 0.3, 0x8fcf6a, 0xbdb2a0));
  const h = P(new THREE.Group(), cx - 1.5, 0.3, cz - 1.2);
  h.rotation.y = Math.atan2(-cx, -cz) * 0.8;
  h.add(P(k.mesh(new THREE.BoxGeometry(4.4, 2.6, 3.4), 0xfff1dc), 0, 1.3, 0));
  for (const x of [-2.2, 2.2])
    for (const z of [-1.7, 1.7]) h.add(P(k.mesh(new THREE.BoxGeometry(0.18, 2.7, 0.18), 0x8a5a3c), x, 1.35, z));
  h.add(P(k.mesh(new THREE.BoxGeometry(4.5, 0.16, 0.18), 0x8a5a3c), 0, 1.4, 1.72));
  const rf = new THREE.Group();
  rf.position.y = 2.6;
  for (const s of [-1, 1]) {
    const pl = k.mesh(new THREE.BoxGeometry(5, 0.2, 2.6), 0x5a86d0);
    pl.position.set(0, 0.8, s * 1.05);
    pl.rotation.x = s * 0.62;
    rf.add(pl);
  }
  h.add(rf);
  const gb = new THREE.Shape();
  gb.moveTo(-2.2, 0);
  gb.lineTo(2.2, 0);
  gb.lineTo(0, -1.6);
  gb.closePath();
  for (const x of [-2.2, 2.2]) {
    const tri = k.mesh(new THREE.ShapeGeometry(gb), 0xfff1dc, { side: THREE.DoubleSide });
    tri.rotation.set(0, Math.PI / 2, Math.PI);
    tri.position.set(x, 2.6, 0);
    h.add(tri);
  }
  h.add(P(k.mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), 0xb07a67), 1.3, 3.6, -0.6));
  for (const x of [-1.2, 1.2]) {
    h.add(
      P(
        k.mesh(new THREE.BoxGeometry(0.8, 0.7, 0.06), 0xfff2c2, { emissive: 0xffc860, emissiveIntensity: 0.6 }),
        x,
        1.5,
        1.72,
      ),
    );
    h.add(P(k.mesh(new THREE.BoxGeometry(0.9, 0.12, 0.25), 0x8a5a3c), x, 1.1, 1.8));
    for (let i = 0; i < 3; i++)
      h.add(P(k.mesh(k.sphere(0.1), pick([0xff8fb3, 0xffd23f, 0xffffff])), x - 0.25 + i * 0.25, 1.22, 1.82));
  }
  h.add(P(k.mesh(new THREE.BoxGeometry(0.8, 1.5, 0.06), 0x6e8fcf), 0, 0.75, 1.72));
  h.add(P(k.mesh(k.sphere(0.06), 0xffcf4a), 0.25, 0.75, 1.77));
  const cg = P(glow(0xffcf70, 4, 0.35), 0, 1.5, 2.4);
  h.add(cg);
  nightGlow(cg, 0.35, 1.1);
  g.add(h);
  col(cx - 1.5, cz - 1.2, 2.9);
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 5; i++) {
      const x = cx + 2.5 + i * 0.7,
        z = cz + 2 + r * 0.8;
      g.add(P(k.mesh(k.sphere(0.22), pick([0x8fcf6a, 0x7cc85e])), x, 0.45, z));
    }
  const mb = P(new THREE.Group(), cx + 3.8, 0.3, cz - 2.8);
  mb.add(P(k.mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), 0x8a5a3c), 0, 0.55, 0));
  mb.add(P(k.mesh(capsule(0.22, 0.35, 12, 4), 0xe84a5f), 0, 1.2, 0)).children;
  mb.children[1].rotation.x = Math.PI / 2;
  g.add(mb);
  const flag = P(new THREE.Group(), cx + 3.8 + 0.24, 1.5, cz - 2.8);
  flag.userData.dynamic = true;
  flag.add(P(k.mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), 0xffd23f), 0, 0.2, 0));
  flag.add(P(k.mesh(new THREE.BoxGeometry(0.04, 0.14, 0.2), 0xffd23f), 0, 0.33, 0.1));
  g.add(flag);
  const ln = new THREE.Group();
  for (const x of [0, 4.2]) ln.add(P(k.mesh(new THREE.CylinderGeometry(0.06, 0.07, 2, 8), 0x8a5a3c), x, 1, 0));
  ln.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new V3(0, 1.9, 0), new V3(2.1, 1.75, 0), new V3(4.2, 1.9, 0)]),
      new THREE.LineBasicMaterial({ color: INKC }),
    ),
  );
  const cloths = [];
  for (let i = 0; i < 4; i++) {
    const c = P(new THREE.Group(), 0.7 + i * 0.95, 1.78, 0);
    c.userData.dynamic = true;
    const m = k.mesh(new THREE.PlaneGeometry(0.6, 0.7, 4, 4), pick([0xffffff, 0x8fb8ff, 0xffc6d6, 0xffd23f]), {
      side: THREE.DoubleSide,
    });
    m.position.y = -0.35;
    c.add(m);
    ln.add(c);
    cloths.push(c);
  }
  ln.position.set(cx - 5.5, 0.3, cz + 3);
  ln.rotation.y = 0.6;
  g.add(ln);
  const smoke = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
    );
    g.add(s);
    smoke.push({ s, t: i / 6 });
  }
  mergeGroup(g);
  root.add(k.ink(g, 0.013));
  const chim = new V3(1.3, 4.4, -0.6);
  h.updateMatrixWorld(true);
  const cw = chim.clone().applyMatrix4(h.matrixWorld);
  W.dyn.cot = { flag, cloths, smoke, chim: cw };
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const x = -5 + (-18.5 + 5) * t,
      z = 24 + (35 - 24) * t;
    const pl = k.mesh(new THREE.BoxGeometry(1.8, 0.08, 0.34), pick([0xc08a58, 0xb07a4a, 0xcc9868]));
    pl.position.set(x, 0.06, z);
    pl.rotation.y = Math.atan2(-18.5 + 5, 35 - 24);
    root.add(k.ink(pl, 0.01));
  }
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const x = -5 + (-18.5 + 5) * t,
      z = 24 + (35 - 24) * t;
    for (const s of [-1, 1]) {
      const p = k.mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), 0x8a5a3c);
      p.position.set(x + s * 0.95 * Math.cos(Math.atan2(35 - 24, -18.5 + 5) + Math.PI / 2) * 0, 0.3, z);
      p.position.x += s * 0.8;
      root.add(k.ink(p, 0.01));
    }
  }
  inter({ id: 'mail', x: cx + 3.8, z: cz - 1.9, r: 1.8, label: '打开信箱', enabled: () => !W.dyn.cot.read });
  zone('cot', '小木屋', cx, cz, 9, '烟囱在冒烟，里面有人在做饭吗？', '#5a86d0');
  seed(k, 'mail', '小木屋', cx + 3.8, 1.9, cz - 2.8, true);
}

/* =================== lavender strip with a bench =================== */
const LAV_C = { x: -56, z: -4 };
function buildLavender(k, root) {
  const { x: cx, z: cz } = LAV_C;
  root.add(k.ink(rectPatch(k, cx, cz, 16, 11, 0.14, 0x8a6a7a), 0.012));
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU,
      h = rr(0.5, 0.75),
      ox = Math.cos(a) * 0.1,
      oz = Math.sin(a) * 0.1;
    parts.push([
      new THREE.CylinderGeometry(0.008, 0.01, h, 3, 1, true),
      0x6a9a58,
      [ox, h / 2, oz],
      [Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12],
    ]);
    parts.push([new THREE.ConeGeometry(0.045, 0.3, 5), i % 2 ? 0x9b7bd6 : 0xb58cff, [ox * 1.1, h - 0.05, oz * 1.1]]);
  }
  const geo = partsGeo(parts),
    list = [];
  for (let r = 0; r < 7; r++) {
    const z = cz - 5 + 0.9 + r * 1.45;
    for (let x = -7.6; x < 7.6; x += 0.5)
      list.push([cx + x + rr(-0.08, 0.08), 0.14, z + rr(-0.12, 0.12), R() * TAU, rr(0.85, 1.2)]);
  }
  root.add(flora(geo, list, 0.14, true, 0.009));
  const b = P(new THREE.Group(), cx + 9.4, 0, cz);
  b.rotation.y = -Math.PI / 2;
  b.add(P(k.mesh(new THREE.BoxGeometry(1.8, 0.1, 0.5), 0xc08a58), 0, 0.5, 0));
  b.add(P(k.mesh(new THREE.BoxGeometry(1.8, 0.45, 0.08), 0xc08a58), 0, 0.85, -0.24));
  for (const s of [-1, 1]) b.add(P(k.mesh(new THREE.BoxGeometry(0.1, 0.5, 0.45), 0x8a5a3c), s * 0.8, 0.25, 0));
  mergeGroup(b);
  root.add(k.ink(b, 0.012));
  col(cx + 9.4, cz, 0.7);
  const bees = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const bd = k.mesh(k.sphere(0.08), 0xffd23f);
    bd.scale.z = 1.4;
    g.add(bd);
    g.add(P(k.mesh(new THREE.TorusGeometry(0.075, 0.02, 6, 12), 0x2e3a59), 0, 0, 0));
    for (const s of [-1, 1]) {
      const w = k.mesh(new THREE.CircleGeometry(0.07, 10), 0xffffff, {
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      w.position.set(s * 0.07, 0.07, 0);
      w.rotation.set(-Math.PI / 2 + 0.4, 0, s * 0.3);
      g.add(w);
    }
    mergeGroup(g);
    root.add(g);
    bees.push({ g, cx: cx + rr(-7, 7), cz: cz + rr(-4, 4), ph: R() * TAU });
  }
  W.dyn.bees = bees;
  inter({ id: 'bench', x: cx + 8.6, z: cz, r: 1.6, label: '在长椅上坐一会儿' });
  zone('lav', '薰衣草田', cx, cz, 10, '紫色的！还有蜜蜂在嗡嗡嗡。', '#b58cff');
}
