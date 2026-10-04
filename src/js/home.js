/* =================== 小家 home =================== */
const HOME = {
  on: false,
  build: false,
  scene: new THREE.Scene(),
  root: new THREE.Group(),
  W: 18,
  D: 13,
  H: 5,
  rooms: [],
  segs: [],
  items: [],
  walls: [],
  ghost: null,
  sel: null,
  moving: null,
  tab: 'all',
  uid: 1,
  dishes: [],
  music: 0,
  ret: null,
};
HOME.scene.background = new THREE.Color(0xf3dcb8);
const hk = makeKit('cel');
hk.seg = 18;
function charRoot() {
  return HOME.on ? HOME.root : world;
}
save.home = save.home || null;
save.unlock = save.unlock || [];
save.shards = save.shards || [];
save.inv = Object.assign({ peach: 0, mush: 0, berry: 0, honey: 0, tea: 0 }, save.inv || {});
save.room = save.room || { wall: 0, floor: 0 };
const INV_N = { peach: '蜜桃', mush: '蘑菇', berry: '草莓', honey: '蜂蜜', tea: '茶叶' };
function giveItem(k, n) {
  save.inv[k] = (save.inv[k] || 0) + n;
  persist();
  task('ingred', n);
  note(tr('+{n} {item}（现在有 {have}）', { n, item: tr(INV_N[k]), have: save.inv[k] }));
}
const cds = {};
function cooldown(id, sec, fn) {
  if (cds[id] && cds[id] > performance.now()) {
    say(rpick(['刚刚才采过，让它再长一会儿吧。', '等一下下再来～']), 2);
    return;
  }
  cds[id] = performance.now() + sec * 1000;
  fn();
}
let noteT = null;
function note(txt) {
  const n = $('#note');
  n.textContent = txt;
  n.classList.add('on');
  clearTimeout(noteT);
  noteT = setTimeout(() => n.classList.remove('on'), 2200);
}

/* ---------- room shell ---------- */
const WALLS = [
  { n: '奶油', c: '#fbeed6', p: null },
  { n: '薄荷条纹', c: '#d8f0e2', p: 'stripe', p2: '#c4e6d2' },
  { n: '樱花点点', c: '#ffe6ec', p: 'dots', p2: '#ffc6d6' },
  { n: '星空蓝', c: '#cfe0f6', p: 'stars', p2: '#fff6c8' },
  { n: '薰衣草格', c: '#ebe0f8', p: 'grid', p2: '#d8c8f0' },
];
const FLOORS = [
  { n: '浅木地板', c: '#e0b884', p: 'plank', p2: '#cfa270' },
  { n: '深木地板', c: '#a8764e', p: 'plank', p2: '#936440' },
  { n: '棋盘地砖', c: '#f4ecdc', p: 'check', p2: '#d8c8b0' },
  { n: '青草地毯', c: '#a8d888', p: 'dots', p2: '#98c878' },
];
function patTex(o, rep) {
  const t = ctex(
    256,
    (g, s) => {
      g.fillStyle = o.c;
      g.fillRect(0, 0, s, s);
      g.fillStyle = o.p2 || o.c;
      g.strokeStyle = o.p2 || o.c;
      if (o.p === 'stripe') for (let x = 0; x < s; x += 64) g.fillRect(x, 0, 28, s);
      else if (o.p === 'dots')
        for (let y = 16; y < s; y += 64)
          for (let x = 16 + ((y / 64) % 2) * 32; x < s; x += 64) {
            g.beginPath();
            g.arc(x, y, 9, 0, TAU);
            g.fill();
          }
      else if (o.p === 'stars')
        for (let i = 0; i < 14; i++) {
          const x = (i * 97) % s,
            y = (i * 53 + 30) % s;
          g.save();
          g.translate(x, y);
          g.beginPath();
          for (let k = 0; k < 10; k++) {
            const r = k % 2 ? 5 : 12,
              a = (k / 10) * TAU - Math.PI / 2;
            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          g.fill();
          g.restore();
        }
      else if (o.p === 'grid') {
        g.lineWidth = 6;
        for (let x = 0; x <= s; x += 64) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, s);
          g.stroke();
          g.beginPath();
          g.moveTo(0, x);
          g.lineTo(s, x);
          g.stroke();
        }
      } else if (o.p === 'plank') {
        g.lineWidth = 4;
        for (let y = 0; y <= s; y += 42) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(s, y);
          g.stroke();
          for (let x = ((y / 42) % 2) * 80; x < s; x += 160) {
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x, y + 42);
            g.stroke();
          }
        }
      } else if (o.p === 'check')
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) g.fillRect(x * 64, y * 64, 64, 64);
    },
    256,
  );
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.userData = {};
  return t;
}
/* rooms: the main room plus up to three extensions the player builds (west / east / back), each small or large */
const SLOTS = {
  west: {
    n: '西厢房',
    opts: [
      { w: 8, d: 9, price: 400, star: 2 },
      { w: 12, d: 13, price: 900, star: 4 },
    ],
  },
  east: {
    n: '东厢房',
    opts: [
      { w: 8, d: 9, price: 400, star: 2 },
      { w: 12, d: 13, price: 900, star: 4 },
    ],
  },
  north: {
    n: '后屋',
    opts: [
      { w: 10, d: 7, price: 500, star: 2 },
      { w: 18, d: 9, price: 1100, star: 5 },
    ],
  },
};
save.ext = save.ext || {};
save.rooms = save.rooms || { main: { wall: save.room.wall, floor: save.room.floor } };
const ROOM_N = { main: '客厅', west: '西厢房', east: '东厢房', north: '后屋' };
function roomRects() {
  const R = [{ id: 'main', x0: -9, x1: 9, z0: -6.5, z1: 6.5 }],
    E = save.ext;
  if (E.west != null) {
    const o = SLOTS.west.opts[E.west];
    R.push({ id: 'west', x0: -9 - o.w, x1: -9, z0: -o.d / 2, z1: o.d / 2 });
  }
  if (E.east != null) {
    const o = SLOTS.east.opts[E.east];
    R.push({ id: 'east', x0: 9, x1: 9 + o.w, z0: -o.d / 2, z1: o.d / 2 });
  }
  if (E.north != null) {
    const o = SLOTS.north.opts[E.north];
    R.push({ id: 'north', x0: -o.w / 2, x1: o.w / 2, z0: -6.5 - o.d, z1: -6.5 });
  }
  return R;
}
function roomAt(x, z) {
  return HOME.rooms.find((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
}
function buildRoom() {
  HOME.scene.add(HOME.root);
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0xd8b890, 0.6);
  HOME.scene.add(hemi);
  HOME.hemi = hemi;
  const sl = new THREE.DirectionalLight(0xffe4b8, 0.5);
  sl.position.set(-10, 16, -12);
  sl.castShadow = true;
  Object.assign(sl.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 60 });
  sl.shadow.camera.updateProjectionMatrix();
  sl.shadow.mapSize.set(2048, 2048);
  sl.shadow.bias = -0.0005;
  HOME.scene.add(sl);
  HOME.sun = sl;
  const motes = particles({ type: 'drift', n: 50, r: 9, y0: 0.5, y1: 4, size: 0.14, color: 0xfff2c0, op: 0.6 });
  HOME.root.add(motes);
  HOME.motes = motes;
  HOME.skyM = new THREE.MeshBasicMaterial({ color: 0xbfe2f0 });
  buildShell();
}
function buildShell() {
  if (HOME.shell) {
    HOME.root.remove(HOME.shell);
    disposeTree(HOME.shell);
  }
  const sh = (HOME.shell = new THREE.Group());
  HOME.root.add(sh);
  const R = (HOME.rooms = roomRects());
  HOME.walls = [];
  HOME.segs = [];
  HOME.mats = {};
  const H = HOME.H,
    trim = hk.mat(0xa8764e);
  R.forEach((r) => {
    const st = save.rooms[r.id] || (save.rooms[r.id] = { wall: r.id.length % 5, floor: 0 });
    const fm = new THREE.MeshToonMaterial({ gradientMap: toonGrad }),
      wm = new THREE.MeshToonMaterial({ gradientMap: toonGrad });
    HOME.mats[r.id] = { fm, wm };
    const w = r.x1 - r.x0,
      d = r.z1 - r.z0,
      fl = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), fm);
    fl.position.set((r.x0 + r.x1) / 2, -0.15, (r.z0 + r.z1) / 2);
    fl.receiveShadow = true;
    sh.add(fl);
    styleRoom(r.id);
  });
  const box = (w, h, d, m) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.castShadow = b.receiveShadow = true;
    return b;
  };
  R.forEach((r, i) => {
    const wm = HOME.mats[r.id].wm;
    const edges = [
      { ax: 'x', c: r.z0, a0: r.x0, a1: r.x1, nx: 0, nz: -1 },
      { ax: 'x', c: r.z1, a0: r.x0, a1: r.x1, nx: 0, nz: 1 },
      { ax: 'z', c: r.x0, a0: r.z0, a1: r.z1, nx: -1, nz: 0 },
      { ax: 'z', c: r.x1, a0: r.z0, a1: r.z1, nx: 1, nz: 0 },
    ];
    edges.forEach((e) => {
      // split the edge into exterior parts and parts shared with another room
      let parts = [[e.a0, e.a1, null]];
      R.forEach((q, j) => {
        if (j === i) return;
        let qa0, qa1, touch;
        if (e.ax === 'x') {
          touch = Math.abs((e.nz < 0 ? q.z1 : q.z0) - e.c) < 0.01;
          qa0 = q.x0;
          qa1 = q.x1;
        } else {
          touch = Math.abs((e.nx < 0 ? q.x1 : q.x0) - e.c) < 0.01;
          qa0 = q.z0;
          qa1 = q.z1;
        }
        if (!touch) return;
        const o0 = Math.max(e.a0, qa0),
          o1 = Math.min(e.a1, qa1);
        if (o1 - o0 < 0.1) return;
        const np = [];
        parts.forEach(([a, b, t]) => {
          if (t || b <= o0 || a >= o1) {
            np.push([a, b, t]);
            return;
          }
          if (a < o0) np.push([a, o0, null]);
          np.push([Math.max(a, o0), Math.min(b, o1), j < i ? 'skip' : 'inner']);
          if (b > o1) np.push([o1, b, null]);
        });
        parts = np;
      });
      parts.forEach(([a, b, t]) => {
        if (t === 'skip' || b - a < 0.05) return;
        const g = new THREE.Group(),
          L = b - a,
          mid = (a + b) / 2;
        if (e.ax === 'x') g.position.set(mid, 0, e.c);
        else {
          g.position.set(e.c, 0, mid);
          g.rotation.y = Math.PI / 2;
        }
        const seg = (u0, u1, y0, y1) => {
          const m = box(u1 - u0 + 0.3, y1 - y0, 0.3, wm);
          m.position.set((u0 + u1) / 2, (y0 + y1) / 2, 0);
          g.add(m);
        };
        if (t === 'inner') {
          const dw = Math.min(2.4, L - 0.6);
          seg(-L / 2, -dw / 2, 0, H);
          seg(dw / 2, L / 2, 0, H);
          seg(-dw / 2, dw / 2, 3.1, H);
          g.add(P(box(dw + 0.3, 0.2, 0.4, trim), 0, 3.05, 0));
          const wx = e.ax === 'x' ? 1 : 0;
          HOME.segs.push(
            ...[
              [a, mid - dw / 2],
              [mid + dw / 2, b],
            ].map(([u0, u1]) => (e.ax === 'x' ? [u0, e.c, u1, e.c] : [e.c, u0, e.c, u1])),
          );
        } else {
          seg(-L / 2, L / 2, 0, H);
          HOME.segs.push(e.ax === 'x' ? [a, e.c, b, e.c] : [e.c, a, e.c, b]);
          const outward = e.ax === 'x' ? e.nz : -e.nx; // windows face outward; skip the front (south) wall
          if (!(e.nz === 1))
            for (let k = 0, n = Math.floor(L / 6); k < n; k++)
              win(g, -L / 2 + ((k + 0.5) * L) / n, 2.6, Math.min(3, L / n - 1.4), 2, outward);
          if (r.id === 'main' && e.nz === 1) addDoor(g, -6 - mid);
        }
        g.add(P(box(L + 0.3, 0.35, 0.4, trim), 0, 0.17, 0));
        g.add(P(box(L + 0.4, 0.25, 0.45, trim), 0, H, 0));
        hk.ink(g, 0.012);
        sh.add(g);
        HOME.walls.push({
          g,
          x: g.position.x,
          z: g.position.z,
          nx: e.nx,
          nz: e.nz,
          ax: e.ax,
          a0: a,
          a1: b,
          inner: t === 'inner',
        });
      });
    });
  });
  const U = (HOME.U = {
    x0: Math.min(...R.map((r) => r.x0)),
    x1: Math.max(...R.map((r) => r.x1)),
    z0: Math.min(...R.map((r) => r.z0)),
    z1: Math.max(...R.map((r) => r.z1)),
  });
}
function win(g, x, y, w, h, side) {
  const q = new THREE.Group();
  q.position.set(x, y, 0.17 * (side || 1));
  if (side < 0) q.rotation.y = Math.PI;
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), HOME.skyM);
  q.add(pane);
  const tree = new THREE.Mesh(new THREE.CircleGeometry(h * 0.35, 16), hk.mat(0x6fbf5a));
  tree.position.set(w * 0.2, -h * 0.15, 0.01);
  q.add(tree);
  const f = hk.mat(0xfff4e6);
  q.add(
    P(new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.2, 0.2), f), 0, h / 2, 0.05),
    P(new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.25, 0.35), f), 0, -h / 2, 0.1),
    P(new THREE.Mesh(new THREE.BoxGeometry(0.2, h, 0.2), f), -w / 2, 0, 0.05),
    P(new THREE.Mesh(new THREE.BoxGeometry(0.2, h, 0.2), f), w / 2, 0, 0.05),
    P(new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.15), f), 0, 0, 0.06),
    P(new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.15), f), 0, 0, 0.06),
  );
  const cur = hk.mat(0xffb3c6);
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, h + 0.4, 0.1), cur);
    c.position.set(s * (w / 2 + 0.35), 0.1, 0.12);
    q.add(c);
  }
  g.add(q);
}
function addDoor(g, x) {
  const door = new THREE.Group();
  door.position.set(x, 0, -0.17);
  door.rotation.y = Math.PI;
  const trim = hk.mat(0xa8764e);
  door.add(P(new THREE.Mesh(new THREE.BoxGeometry(1.7, 3, 0.12), hk.mat(0x8a5a3c)), 0, 1.5, 0));
  door.add(P(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 0.25), trim), 0, 3.1, 0.05));
  door.add(P(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), hk.mat(0xffcf4a)), 0.55, 1.5, 0.1));
  door.add(P(new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), HOME.skyM), 0, 2.3, 0.07));
  g.add(door);
  HOME.shell.add(P(new THREE.Mesh(new THREE.BoxGeometry(2, 0.04, 1.1), hk.mat(0xe8c96a)), -6, 0.02, 6.5 - 0.8));
}
function styleRoom(id) {
  const st = save.rooms[id],
    M = HOME.mats[id];
  if (!M) return;
  const w = WALLS[st.wall],
    f = FLOORS[st.floor];
  if (M.wm.map) M.wm.map.dispose();
  if (M.fm.map) M.fm.map.dispose();
  M.wm.map = patTex(w, [4, 1.2]);
  M.wm.color.set(0xffffff);
  M.wm.needsUpdate = true;
  M.fm.map = patTex(f, [4, 3]);
  M.fm.color.set(0xffffff);
  M.fm.needsUpdate = true;
}
function applyRoom() {
  Object.keys(HOME.mats || {}).forEach(styleRoom);
}
/* ---------- furniture catalogue ---------- */
const m_ = (g, c, o) => hk.mesh(g, c, o),
  B_ = (w, h, d) => new THREE.BoxGeometry(w, h, d),
  C_ = (r1, r2, h, s = 14) => new THREE.CylinderGeometry(r1, r2, h, s),
  S_ = (r) => hk.sphere(r);
function legs(g, w, d, h, c, r = 0.05) {
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) g.add(P(m_(C_(r, r, h, 8), c), sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1)));
}
const CAT = [
  ['all', '全部'],
  ['live', '客厅'],
  ['kitchen', '厨房'],
  ['bed', '卧室'],
  ['fun', '娱乐'],
  ['pig', '团子'],
  ['garden', '园艺'],
  ['deco', '装饰'],
  ['room', '墙纸地板'],
  ['ext', '扩建'],
];
const FURN = {
  bed: {
    n: '小床',
    cat: 'bed',
    cost: 0,
    w: 2.2,
    d: 3,
    c: 0x8fb8ff,
    b: (g) => {
      g.add(P(m_(B_(2.2, 0.45, 3), 0xc08a58), 0, 0.35, 0));
      g.add(P(m_(B_(2.1, 0.3, 2.9), 0xfff8f0), 0, 0.72, 0));
      g.add(P(m_(B_(2.12, 0.2, 1.9), 0x8fb8ff), 0, 0.9, 0.45));
      g.add(P(m_(B_(1.4, 0.25, 0.6), 0xffffff), 0, 0.95, -1.05));
      g.add(P(m_(B_(2.3, 1.4, 0.2), 0xc08a58), 0, 0.9, -1.45));
      for (let i = 0; i < 4; i++) g.add(P(m_(S_(0.1), 0xffd23f), -0.6 + i * 0.4, 1.55, -1.45));
      legs(g, 2.2, 3, 0.15, 0x8a5a3c);
    },
    label: '睡一觉',
    act: (it) => sleepAt(it),
  },
  pigbed: {
    n: '团子小窝',
    cat: 'pig',
    cost: 0,
    w: 1.2,
    d: 1.2,
    c: 0xffb3c6,
    b: (g) => {
      g.add(P(m_(C_(0.6, 0.62, 0.18, 20), 0xffb3c6), 0, 0.09, 0));
      const r = m_(new THREE.TorusGeometry(0.5, 0.16, 10, 24), 0xff8fb3);
      r.rotation.x = Math.PI / 2;
      r.position.y = 0.22;
      g.add(r);
      g.add(P(m_(S_(0.16), 0xffffff), 0.2, 0.25, -0.25));
    },
    label: '让团子睡午觉',
    act: (it) => {
      pigGoDo(it.x, it.z, () => {
        AI.state = 'nap';
        AI.timer = 0;
        AI.napUntil = 20;
        AI.napAny = true;
        AI.napY = 0.16;
        pig.g.position.set(it.x, 0, it.z);
        pig.g.rotation.y = (-it.r * Math.PI) / 2;
        say('这是我的窝！呼……', 2.4);
        gainLove(1);
      });
    },
  },
  stove: {
    n: '灶台',
    cat: 'kitchen',
    cost: 0,
    w: 1.6,
    d: 1,
    c: 0xfff1dc,
    b: (g) => {
      g.add(P(m_(B_(1.6, 1, 1), 0xfff1dc), 0, 0.5, 0));
      g.add(P(m_(B_(1.62, 0.08, 1.02), 0x3d4a7a), 0, 1.04, 0));
      for (const x of [-0.4, 0.4]) g.add(P(m_(C_(0.22, 0.22, 0.04, 16), 0x2e3a59), x, 1.1, 0.05));
      g.add(P(m_(B_(1, 0.6, 0.05), 0xd9cfbf), 0, 0.45, 0.5));
      g.add(P(m_(B_(0.6, 0.05, 0.06), 0xc0c0c8), 0, 0.8, 0.53));
      const pan = new THREE.Group();
      pan.add(P(m_(C_(0.24, 0.2, 0.08, 16), 0x5a5a66), 0, 0, 0));
      pan.add(P(m_(B_(0.4, 0.04, 0.06), 0x8a5a3c), 0.4, 0, 0));
      pan.position.set(-0.4, 1.16, 0.05);
      pan.userData.dynamic = true;
      pan.name = 'pan';
      g.add(pan);
    },
    label: '做饭',
    act: (it) => openCook(it),
  },
  fridge: {
    n: '冰箱',
    cat: 'kitchen',
    cost: 0,
    w: 1,
    d: 1,
    c: 0xb8e8d8,
    b: (g) => {
      g.add(P(m_(B_(1, 2.2, 0.9), 0xb8e8d8), 0, 1.1, 0));
      g.add(P(m_(B_(1.01, 0.04, 0.91), 0x8ac8b8), 0, 1.4, 0));
      for (const y of [0.9, 1.8]) g.add(P(m_(B_(0.06, 0.4, 0.08), 0xffffff), 0.35, y, 0.47));
      g.add(P(m_(S_(0.1), 0xff8fb3), -0.2, 1.9, 0.46));
    },
    label: '看看冰箱',
    act: () => {
      AU.sfx('fridge');
      const s = Object.entries(save.inv)
        .map(([k, v]) => INV_N[k] + ' ' + v)
        .join('　');
      say('冰箱里有：' + s, 4);
    },
  },
  counter: {
    n: '橱柜',
    cat: 'kitchen',
    cost: 0,
    w: 1.6,
    d: 0.9,
    c: 0xd8e8c8,
    b: (g) => {
      g.add(P(m_(B_(1.6, 0.95, 0.9), 0xd8e8c8), 0, 0.48, 0));
      g.add(P(m_(B_(1.66, 0.08, 0.96), 0xf4ecdc), 0, 0.99, 0));
      for (const x of [-0.4, 0.4]) g.add(P(m_(B_(0.05, 0.3, 0.05), 0xffffff), x, 0.6, 0.46));
      g.add(P(m_(B_(0.6, 0.04, 0.4), 0xc08a58), 0.2, 1.05, 0));
      g.add(P(m_(S_(0.1), 0xffa27a), -0.4, 1.1, 0));
    },
    label: '切一盘水果',
    act: (it) => {
      if (save.inv.peach + save.inv.berry < 1) {
        say('没有水果了……去果园或者草莓坡摘一点吧。', 3);
        return;
      }
      if (save.inv.peach > 0) save.inv.peach--;
      else save.inv.berry--;
      persist();
      AU.sfx('chop');
      setTimeout(() => serveDish('fruit'), 900);
    },
  },
  table: {
    n: '餐桌',
    cat: 'kitchen',
    cost: 0,
    w: 2,
    d: 1.4,
    c: 0xc08a58,
    b: (g) => {
      g.add(P(m_(B_(2, 0.1, 1.4), 0xc08a58), 0, 0.8, 0));
      g.add(P(m_(B_(1.6, 0.02, 1.42), 0xfff4e6), 0, 0.86, 0));
      legs(g, 2, 1.4, 0.78, 0x8a5a3c, 0.06);
      g.add(P(m_(C_(0.08, 0.06, 0.2, 10), 0xffffff), 0, 0.96, 0));
      g.add(P(m_(S_(0.08), 0xff8fb3), 0, 1.1, 0));
    },
    label: '在桌边吃饭',
    table: true,
    act: (it) => eatAt(it),
  },
  chair: {
    n: '椅子',
    cat: 'kitchen',
    cost: 0,
    w: 0.7,
    d: 0.7,
    c: 0xe8c96a,
    b: (g) => {
      g.add(P(m_(B_(0.6, 0.08, 0.6), 0xe8c96a), 0, 0.48, 0));
      legs(g, 0.6, 0.6, 0.46, 0x8a5a3c, 0.04);
      g.add(P(m_(B_(0.6, 0.6, 0.07), 0xe8c96a), 0, 0.8, -0.27));
      g.add(P(m_(B_(0.5, 0.05, 0.5), 0xff8fb3), 0, 0.54, 0));
    },
    label: '坐下',
    seat: { y: 0.55, z: 0 },
    act: (it) => sitItem(it),
  },
  sofa: {
    n: '沙发',
    cat: 'live',
    cost: 0,
    w: 2.4,
    d: 1,
    c: 0xff9e7a,
    b: (g) => {
      g.add(P(m_(B_(2.4, 0.45, 1), 0xff9e7a), 0, 0.3, 0));
      g.add(P(m_(B_(2.4, 0.8, 0.3), 0xff9e7a), 0, 0.75, -0.35));
      for (const x of [-1.1, 1.1]) g.add(P(m_(B_(0.25, 0.6, 1), 0xf08a68), x, 0.55, 0));
      for (const x of [-0.5, 0.5]) g.add(P(m_(B_(0.95, 0.18, 0.8), 0xffc0a0), x, 0.6, 0.08));
      g.add(P(m_(S_(0.2), 0xfff4e6), 0.6, 0.85, -0.1));
    },
    label: '坐在沙发上',
    seat: { y: 0.62, z: 0.1 },
    act: (it) => sitItem(it),
  },
  rug: {
    n: '圆地毯',
    cat: 'live',
    cost: 0,
    w: 2.6,
    d: 2.6,
    c: 0xb8a0e8,
    floor: true,
    b: (g) => {
      g.add(P(m_(C_(1.3, 1.3, 0.03, 32), 0xb8a0e8), 0, 0.02, 0));
      g.add(P(m_(C_(1, 1, 0.035, 32), 0xd8c8f8), 0, 0.025, 0));
      g.add(P(m_(C_(0.55, 0.55, 0.04, 32), 0xfff4e6), 0, 0.03, 0));
    },
    label: '在地毯上打滚',
    act: (it) =>
      pigGoDo(it.x, it.z, () => {
        AI.state = 'roll';
        AI.timer = 0;
        AU.sfx('rustle');
        say('地毯软软的！', 1.8);
        gainLove(1);
      }),
  },
  rug2: {
    n: '长地毯',
    cat: 'live',
    cost: 0,
    w: 3,
    d: 2,
    c: 0x7cc8a8,
    floor: true,
    b: (g) => {
      g.add(P(m_(B_(3, 0.03, 2), 0x7cc8a8), 0, 0.02, 0));
      for (let i = 0; i < 5; i++) g.add(P(m_(B_(0.3, 0.035, 1.8), 0xfff4e6), -1.2 + i * 0.6, 0.025, 0));
    },
    label: '在地毯上打滚',
    act: (it) =>
      pigGoDo(it.x, it.z, () => {
        AI.state = 'roll';
        AI.timer = 0;
        AU.sfx('rustle');
        gainLove(1);
      }),
  },
  shelf: {
    n: '书架',
    cat: 'live',
    cost: 0,
    w: 1.8,
    d: 0.6,
    c: 0xc08a58,
    b: (g) => {
      g.add(P(m_(B_(1.8, 2.4, 0.1), 0xc08a58), 0, 1.2, -0.25));
      for (const x of [-0.85, 0.85]) g.add(P(m_(B_(0.1, 2.4, 0.6), 0xc08a58), x, 1.2, 0));
      for (let y = 0; y < 4; y++) {
        g.add(P(m_(B_(1.7, 0.08, 0.6), 0xc08a58), 0, 0.05 + y * 0.75, 0));
        if (y < 3)
          for (let i = 0; i < 7; i++) {
            const h = rr(0.4, 0.6);
            g.add(
              P(
                m_(B_(0.16, h, 0.4), pick([0xe84a5f, 0x4f7cc9, 0xffd23f, 0x7cc85e, 0xb58cff, 0xff8a5b])),
                -0.65 + i * 0.21,
                0.1 + y * 0.75 + h / 2,
                0,
              ),
            );
          }
      }
    },
    label: '读一本书',
    act: () => openBook(),
  },
  lamp: {
    n: '落地灯',
    cat: 'live',
    cost: 0,
    w: 0.6,
    d: 0.6,
    c: 0xffe6a8,
    light: true,
    b: (g) => {
      g.add(P(m_(C_(0.25, 0.3, 0.08, 14), 0x8a5a3c), 0, 0.04, 0));
      g.add(P(m_(C_(0.03, 0.03, 1.8, 6), 0x8a5a3c), 0, 0.95, 0));
      g.add(P(m_(C_(0.22, 0.38, 0.45, 16, 1), 0xffe6a8, { emissive: 0xffc060, emissiveIntensity: 0.5 }), 0, 1.95, 0));
    },
    label: '开关灯',
    act: (it) => toggleLight(it),
  },
  fire: {
    n: '壁炉',
    cat: 'live',
    cost: 3,
    w: 2,
    d: 0.8,
    c: 0xd9cfbf,
    light: true,
    b: (g) => {
      g.add(P(m_(B_(2, 1.6, 0.8), 0xd9cfbf), 0, 0.8, 0));
      g.add(P(m_(B_(2.3, 0.15, 0.95), 0xa39a8e), 0, 1.65, 0));
      g.add(P(m_(B_(1.1, 0.9, 0.3), 0x3d3040), 0, 0.55, 0.3));
      for (const x of [-0.25, 0.25]) {
        const l = m_(C_(0.08, 0.08, 0.7, 8), 0x7a5a48);
        l.rotation.z = Math.PI / 2;
        l.position.set(0, 0.2, 0.32 + x * 0.2);
        g.add(l);
      }
      const fl = new THREE.Group();
      fl.name = 'flame';
      fl.userData.dynamic = true;
      for (let i = 0; i < 3; i++)
        fl.add(
          P(
            new THREE.Mesh(
              new THREE.ConeGeometry(0.16 - i * 0.03, 0.5 - i * 0.08, 8),
              new THREE.MeshBasicMaterial({ color: [0xff8a3a, 0xffb040, 0xffe070][i] }),
            ),
            (i - 1) * 0.15,
            0.45,
            0.35,
          ),
        );
      g.add(fl);
    },
    label: '生火 / 熄火',
    act: (it) => toggleLight(it),
  },
  record: {
    n: '唱片机',
    cat: 'fun',
    cost: 2,
    w: 0.8,
    d: 0.6,
    c: 0xe8c96a,
    b: (g) => {
      g.add(P(m_(B_(0.8, 0.7, 0.6), 0xa0704a), 0, 0.35, 0));
      g.add(P(m_(C_(0.25, 0.25, 0.03, 20), 0x2e3a59), 0, 0.73, 0));
      g.add(P(m_(C_(0.08, 0.08, 0.035, 12), 0xe84a5f), 0, 0.745, 0));
      const h = m_(new THREE.ConeGeometry(0.3, 0.6, 16, 1, true), 0xe8c96a, { side: THREE.DoubleSide });
      h.rotation.z = -2.2;
      h.position.set(0.25, 1.05, -0.1);
      g.add(h);
    },
    label: '换一张唱片',
    act: () => {
      HOME.music = (HOME.music + 1) % 3;
      AU.style = HOME.music;
      AU.sfx('ding');
      say(['唱片：花海八音盒', '唱片：月光慢华尔兹', '唱片：森林小步舞曲'][HOME.music], 2.6);
    },
  },
  piano: {
    n: '钢琴',
    cat: 'fun',
    cost: 4,
    w: 1.8,
    d: 0.8,
    c: 0x3d4a7a,
    b: (g) => {
      g.add(P(m_(B_(1.8, 1.4, 0.6), 0x3d4a7a), 0, 0.7, -0.1));
      g.add(P(m_(B_(1.8, 0.12, 0.35), 0x3d4a7a), 0, 0.8, 0.3));
      g.add(P(m_(B_(1.6, 0.04, 0.25), 0xffffff), 0, 0.87, 0.32));
      for (let i = 0; i < 10; i++) g.add(P(m_(B_(0.06, 0.03, 0.14), 0x2e3a59), -0.7 + i * 0.16, 0.9, 0.28));
      g.add(P(m_(C_(0.08, 0.08, 0.2, 8), 0xffd23f, { emissive: 0xffb040, emissiveIntensity: 0.5 }), 0.7, 1.5, -0.1));
    },
    label: '弹一首曲子',
    act: () => {
      AU.sfx('piano');
      PL.dance = 0;
      boy.wave = 0;
      say('叮叮咚咚～团子在跟着摇尾巴。', 3);
      for (let i = 0; i < 8; i++)
        setTimeout(
          () =>
            spark(
              boy.g.position.clone().add(new V3(rnd(-0.5, 0.5), 1.8, rnd(-0.5, 0.5))),
              TEX.dot,
              pick([0xffd23f, 0x8fb8ff, 0xff8fb3]),
              { add: true, v: new V3(rnd(-0.3, 0.3), 1, 0), life: 1.4, size: 0.3 },
            ),
          i * 250,
        );
      gainLove(1);
    },
  },
  toybox: {
    n: '玩具箱',
    cat: 'pig',
    cost: 0,
    w: 1,
    d: 0.7,
    c: 0x7cc85e,
    b: (g) => {
      g.add(P(m_(B_(1, 0.6, 0.7), 0x7cc85e), 0, 0.3, 0));
      g.add(P(m_(B_(1.02, 0.08, 0.72), 0xffd23f), 0, 0.62, 0));
      g.add(P(m_(S_(0.15), 0xe84a5f), -0.2, 0.7, 0));
      g.add(P(m_(B_(0.2, 0.2, 0.2), 0x4f7cc9), 0.25, 0.72, 0.05));
    },
    label: '拿出小球',
    act: () => throwBall(),
  },
  easel: {
    n: '画架',
    cat: 'fun',
    cost: 2,
    w: 0.8,
    d: 0.7,
    c: 0xfff4e6,
    b: (g) => {
      for (const s of [-1, 1]) {
        const l = m_(C_(0.03, 0.03, 1.8, 6), 0xa0704a);
        l.position.set(s * 0.3, 0.9, 0);
        l.rotation.z = s * 0.12;
        g.add(l);
      }
      const bl = m_(C_(0.03, 0.03, 1.8, 6), 0xa0704a);
      bl.position.set(0, 0.9, -0.3);
      bl.rotation.x = -0.25;
      g.add(bl);
      g.add(P(m_(B_(0.8, 0.05, 0.1), 0xa0704a), 0, 0.7, 0.05));
      const cv = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      cv.name = 'canvas';
      cv.position.set(0, 1.1, 0.09);
      cv.rotation.x = -0.08;
      cv.userData.keepAlone = true;
      cv.userData.noInk = true;
      g.add(cv);
    },
    label: '画一幅画',
    act: (it) => paint(it),
  },
  tank: {
    n: '鱼缸',
    cat: 'fun',
    cost: 3,
    w: 1.2,
    d: 0.6,
    c: 0x8fd8ff,
    b: (g) => {
      g.add(P(m_(B_(1.2, 0.7, 0.6), 0xc08a58), 0, 0.35, 0));
      const gl = new THREE.Mesh(
        B_(1.1, 0.7, 0.5),
        new THREE.MeshToonMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.45, gradientMap: toonGrad }),
      );
      gl.position.y = 1.06;
      gl.userData.keepAlone = true;
      gl.userData.noInk = true;
      g.add(gl);
      g.add(P(m_(B_(1.05, 0.1, 0.45), 0xf3e3c3), 0, 0.76, 0));
      const fs = new THREE.Group();
      fs.name = 'fish';
      fs.userData.dynamic = true;
      for (let i = 0; i < 3; i++) {
        const f = m_(S_(0.07), [0xff8a5b, 0xffd23f, 0xff8fb3][i]);
        f.scale.set(0.7, 1, 1.6);
        f.position.set(-0.3 + i * 0.3, 1 + i * 0.08, 0);
        fs.add(f);
      }
      g.add(fs);
    },
    label: '喂小鱼',
    act: () => {
      AU.sfx('plop');
      say('小鱼游上来吃东西了！', 2.2);
      HOME.fishFeed = 4;
    },
  },
  tub: {
    n: '浴缸',
    cat: 'bed',
    cost: 3,
    w: 1.8,
    d: 0.9,
    c: 0xffffff,
    b: (g) => {
      g.add(P(m_(C_(0.45, 0.4, 1.6, 16), 0xffffff), 0, 0.5, 0));
      g.children[0].rotation.z = Math.PI / 2;
      g.children[0].scale.set(1, 1, 1.05);
      g.add(P(m_(B_(1.4, 0.05, 0.6), 0x9fe0ff), 0, 0.85, 0));
      for (const x of [-0.6, 0.6]) for (const z of [-0.25, 0.25]) g.add(P(m_(S_(0.08), 0xffd23f), x, 0.08, z));
    },
    label: '泡个澡',
    act: (it) => {
      AU.sfx('bath');
      pigGoDo(it.x, it.z + 0.2, () => {
        pig.vy = 4;
        say('泡泡！团子也要洗！', 2.4);
        gainLove(1);
      });
      for (let i = 0; i < 30; i++)
        setTimeout(
          () =>
            spark(new V3(it.x + rnd(-0.6, 0.6), 1, it.z + rnd(-0.3, 0.3)), TEX.glow, 0xffffff, {
              v: new V3(rnd(-0.2, 0.2), rnd(0.3, 0.8), rnd(-0.2, 0.2)),
              life: 2,
              size: rnd(0.15, 0.35),
            }),
          i * 80,
        );
    },
  },
  plant: {
    n: '大盆栽',
    cat: 'deco',
    cost: 0,
    w: 0.7,
    d: 0.7,
    c: 0x7cc85e,
    b: (g) => {
      g.add(P(m_(C_(0.3, 0.22, 0.5, 12), 0xe8845a), 0, 0.25, 0));
      const lf = new THREE.Group();
      lf.name = 'leaves';
      lf.userData.dynamic = true;
      for (let i = 0; i < 7; i++) {
        const l = m_(new THREE.SphereGeometry(0.22, 10, 6), 0x6fbf5a);
        l.scale.set(0.5, 1.4, 0.2);
        const a = (i / 7) * TAU;
        l.position.set(Math.cos(a) * 0.12, 0.75, Math.sin(a) * 0.12);
        l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
        lf.add(l);
      }
      const fl = m_(S_(0.12), 0xff8fb3);
      fl.name = 'bloom';
      fl.position.y = 1.1;
      lf.add(fl);
      g.add(lf);
    },
    label: '浇浇水',
    act: (it) => {
      it.s = ((it.s || 0) + 1) % 3;
      applyState(it);
      AU.sfx('pour');
      say(['重新发芽啦。', '长高了一点！', '开花了！'][it.s], 2);
      saveHome();
    },
  },
  vase: {
    n: '花瓶小桌',
    cat: 'deco',
    cost: 0,
    w: 0.6,
    d: 0.6,
    c: 0xff8fb3,
    b: (g) => {
      g.add(P(m_(C_(0.3, 0.3, 0.05, 16), 0xc08a58), 0, 0.7, 0));
      g.add(P(m_(C_(0.04, 0.04, 0.7, 6), 0x8a5a3c), 0, 0.35, 0));
      g.add(
        P(
          m_(
            lathe(
              [
                [0.001, 0],
                [0.1, 0.02],
                [0.13, 0.15],
                [0.07, 0.3],
                [0.09, 0.36],
                [0.001, 0.36],
              ],
              12,
            ),
            0x8fb8ff,
          ),
          0,
          0.73,
          0,
        ),
      );
      const fb = new THREE.Group();
      fb.name = 'bouquet';
      fb.userData.dynamic = true;
      for (let i = 0; i < 5; i++)
        fb.add(
          P(m_(S_(0.07), 0xff8fb3), Math.cos(i * 1.3) * 0.1, 1.18 + Math.sin(i * 2) * 0.04, Math.sin(i * 1.3) * 0.1),
        );
      g.add(fb);
    },
    label: '换一束花',
    act: (it) => {
      it.s = ((it.s || 0) + 1) % 4;
      applyState(it);
      AU.sfx('pluck');
      saveHome();
    },
  },
  wardrobe: {
    n: '衣柜',
    cat: 'bed',
    cost: 0,
    w: 1.4,
    d: 0.7,
    c: 0xfff1dc,
    b: (g) => {
      g.add(P(m_(B_(1.4, 2.4, 0.7), 0xfff1dc), 0, 1.2, 0));
      g.add(P(m_(B_(0.02, 2.2, 0.02), 0xa0704a), 0, 1.2, 0.36));
      for (const x of [-0.12, 0.12]) g.add(P(m_(S_(0.06), 0xffcf4a), x, 1.2, 0.37));
      g.add(P(m_(B_(1.5, 0.12, 0.78), 0xc08a58), 0, 2.45, 0));
    },
    label: '换衣服',
    act: () => openWardrobe(),
  },
  rocker: {
    n: '摇椅',
    cat: 'live',
    cost: 2,
    w: 0.9,
    d: 1,
    c: 0xc08a58,
    b: (g) => {
      for (const s of [-1, 1]) {
        const r = m_(new THREE.TorusGeometry(0.6, 0.04, 6, 20, Math.PI * 0.6), 0x8a5a3c);
        r.rotation.set(0, Math.PI / 2, Math.PI * 1.2);
        r.position.set(s * 0.35, 0.62, 0);
        g.add(r);
      }
      g.add(P(m_(B_(0.75, 0.08, 0.65), 0xc08a58), 0, 0.45, 0));
      const bk = m_(B_(0.75, 0.8, 0.07), 0xc08a58);
      bk.position.set(0, 0.85, -0.32);
      bk.rotation.x = -0.2;
      g.add(bk);
      g.add(P(m_(B_(0.6, 0.06, 0.55), 0xa8d8ff), 0, 0.51, 0));
    },
    label: '坐在摇椅上',
    seat: { y: 0.52, z: 0, rock: true },
    act: (it) => sitItem(it),
  },
  scope: {
    n: '望远镜',
    cat: 'fun',
    cost: 3,
    w: 0.8,
    d: 0.8,
    c: 0x4f7cc9,
    b: (g) => {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        const l = m_(C_(0.025, 0.025, 1.3, 6), 0x8a5a3c);
        l.position.set(Math.cos(a) * 0.2, 0.6, Math.sin(a) * 0.2);
        l.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25);
        g.add(l);
      }
      const tb = m_(C_(0.09, 0.13, 1, 12), 0x4f7cc9);
      tb.position.set(0, 1.3, 0.1);
      tb.rotation.x = -1;
      g.add(tb);
      g.add(P(m_(new THREE.TorusGeometry(0.13, 0.03, 6, 14), 0xffd23f), 0, 1.52, 0.45));
    },
    label: '用望远镜看天',
    act: () => {
      AU.sfx('chimeTap', 12);
      say(nightT > 0.5 ? '看到猎户座……还有天鲸在星星中间游！' : '看见天鲸了！它背上的光点在眨眼睛。', 3.6);
    },
  },
  clock: {
    n: '落地钟',
    cat: 'deco',
    cost: 0,
    w: 0.6,
    d: 0.5,
    c: 0xa0704a,
    b: (g) => {
      g.add(P(m_(B_(0.6, 2.2, 0.45), 0xa0704a), 0, 1.1, 0));
      g.add(P(m_(C_(0.24, 0.24, 0.04, 20), 0xfff4e6), 0, 1.8, 0.23));
      g.children[1].rotation.x = Math.PI / 2;
      const pd = new THREE.Group();
      pd.name = 'pend';
      pd.userData.dynamic = true;
      pd.position.set(0, 1.4, 0.24);
      pd.add(P(m_(B_(0.03, 0.6, 0.02), 0xffd23f), 0, -0.3, 0));
      pd.add(P(m_(C_(0.1, 0.1, 0.03, 12), 0xffd23f), 0, -0.62, 0));
      pd.children[1].rotation.x = Math.PI / 2;
      g.add(pd);
      g.add(P(m_(new THREE.ConeGeometry(0.4, 0.3, 4), 0x8a5a3c), 0, 2.35, 0));
    },
    label: '听听钟声',
    act: () => {
      AU.sfx('bell');
      say(nightT > 0.5 ? '当——当——已经是晚上啦。' : '当——当——现在是傍晚。', 2.6);
    },
  },
  photos: {
    n: '照片墙',
    cat: 'deco',
    cost: 2,
    w: 1.6,
    d: 0.3,
    c: 0xfff4e6,
    b: (g) => {
      g.add(P(m_(B_(1.6, 1.4, 0.08), 0xc08a58), 0, 1.6, 0));
      for (const s of [-1, 1]) g.add(P(m_(B_(0.08, 1, 0.08), 0x8a5a3c), s * 0.6, 0.5, 0));
      for (let i = 0; i < 4; i++) {
        const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), new THREE.MeshBasicMaterial({ color: 0xeeeeee }));
        f.position.set(-0.36 + (i % 2) * 0.72, 1.87 - Math.floor(i / 2) * 0.56, 0.05);
        f.name = 'ph' + i;
        f.userData.keepAlone = true;
        f.userData.noInk = true;
        g.add(f);
      }
    },
    label: '看看照片',
    act: () => {
      say(save.photos.length ? '这是我们一起拍的照片！' : '还没有照片……出去找团子合个影吧！', 2.8);
    },
  },
  plush: {
    n: '团子玩偶',
    cat: 'pig',
    cost: 2,
    w: 0.8,
    d: 0.8,
    c: 0xffa3b5,
    b: (g) => {
      const b = m_(S_(0.4), 0xffa3b5);
      b.scale.set(1, 0.85, 1);
      b.position.y = 0.35;
      g.add(b);
      g.add(P(m_(S_(0.28), 0xffa3b5), 0, 0.8, 0.15));
      g.add(P(m_(C_(0.1, 0.12, 0.08, 14), 0xff7f96), 0, 0.78, 0.42));
      g.children[2].rotation.x = Math.PI / 2;
      for (const s of [-1, 1]) {
        g.add(P(m_(new THREE.ConeGeometry(0.08, 0.15, 10), 0xffa3b5), s * 0.15, 1.05, 0.1));
        g.add(P(m_(S_(0.035), 0x2e3a59), s * 0.1, 0.88, 0.38));
      }
    },
    label: '抱抱玩偶',
    act: () => {
      AU.sfx('squeak');
      say('哼！你抱它不抱我？……好吧，它是我的双胞胎。', 3.4);
      AI.state = 'happy';
      AI.timer = 1;
    },
  },
  hang: {
    n: '吊椅',
    cat: 'live',
    cost: 3,
    w: 1.2,
    d: 1.2,
    c: 0xe8c96a,
    b: (g) => {
      const arc = m_(new THREE.TorusGeometry(1, 0.06, 8, 24, Math.PI), 0x8a5a3c);
      arc.position.y = 1;
      arc.rotation.z = 0;
      arc.position.x = 0;
      g.add(P(m_(C_(0.45, 0.5, 0.08, 16), 0x8a5a3c), 0, 0.04, 0));
      arc.rotation.set(0, 0, Math.PI / 2);
      arc.position.set(-0.1, 1.2, 0);
      const ch = new THREE.Group();
      ch.name = 'pod';
      ch.userData.dynamic = true;
      ch.position.set(0, 2.15, 0);
      ch.add(P(m_(C_(0.02, 0.02, 0.9, 6), 0xe6d2bf), 0, -0.45, 0));
      const pod = m_(new THREE.SphereGeometry(0.5, 16, 10, 0, TAU, Math.PI * 0.35, Math.PI * 0.65), 0xe8c96a, {
        side: THREE.DoubleSide,
      });
      pod.position.y = -1.3;
      ch.add(pod);
      ch.add(P(m_(C_(0.4, 0.4, 0.1, 14), 0xffb3c6), 0, -1.45, 0));
      g.add(ch);
      g.add(P(m_(C_(0.05, 0.05, 2.2, 8), 0x8a5a3c), -0.55, 1.1, 0));
      g.add(P(m_(B_(0.7, 0.06, 0.06), 0x8a5a3c), -0.22, 2.2, 0));
    },
    label: '坐进吊椅',
    seat: { y: 0.8, z: 0, rock: true },
    act: (it) => sitItem(it),
  },
  lights: {
    n: '星星灯树',
    cat: 'deco',
    cost: 2,
    w: 0.8,
    d: 0.8,
    c: 0xfff4c0,
    light: true,
    b: (g) => {
      g.add(P(m_(C_(0.25, 0.2, 0.35, 10), 0xa0704a), 0, 0.18, 0));
      g.add(P(m_(new THREE.ConeGeometry(0.5, 1.6, 10), 0x6fbf5a), 0, 1.1, 0));
      for (let i = 0; i < 10; i++) {
        const a = i * 1.7,
          h = 0.5 + i * 0.1;
        g.add(
          P(
            m_(S_(0.05), 0xfff4c0, { emissive: 0xffe080, emissiveIntensity: 1 }),
            Math.cos(a) * (0.45 - i * 0.035),
            h,
            Math.sin(a) * (0.45 - i * 0.035),
          ),
        );
      }
      const st = m_(new THREE.ExtrudeGeometry(starShape(0.15, 0.07), { depth: 0.05, bevelEnabled: false }), 0xffd23f, {
        emissive: 0xffb040,
        emissiveIntensity: 0.8,
      });
      st.position.y = 1.95;
      g.add(st);
    },
    label: '开关灯串',
    act: (it) => toggleLight(it),
  },
  coffee: {
    n: '小茶几',
    cat: 'live',
    cost: 0,
    w: 1.2,
    d: 0.8,
    c: 0xc08a58,
    b: (g) => {
      g.add(P(m_(B_(1.2, 0.08, 0.8), 0xc08a58), 0, 0.45, 0));
      legs(g, 1.2, 0.8, 0.42, 0x8a5a3c, 0.04);
      g.add(P(m_(C_(0.06, 0.05, 0.1, 10), 0xffffff), 0.3, 0.54, 0));
    },
    label: '在茶几旁吃点心',
    table: true,
    act: (it) => eatAt(it),
  },
  musicbox: {
    n: '八音盒',
    cat: 'fun',
    cost: 2,
    w: 0.6,
    d: 0.6,
    c: 0xffc6d6,
    b: (g) => {
      g.add(P(m_(C_(0.28, 0.28, 0.05, 16), 0xc08a58), 0, 0.7, 0));
      g.add(P(m_(C_(0.04, 0.04, 0.7, 6), 0x8a5a3c), 0, 0.35, 0));
      g.add(P(m_(B_(0.4, 0.22, 0.3), 0xffc6d6), 0, 0.84, 0));
      const top = new THREE.Group();
      top.name = 'dancer';
      top.userData.dynamic = true;
      top.position.y = 0.96;
      top.add(P(m_(new THREE.ConeGeometry(0.08, 0.14, 10), 0xffffff), 0, 0.07, 0));
      top.add(P(m_(S_(0.04), 0xffe4cf), 0, 0.18, 0));
      g.add(top);
    },
    label: '打开八音盒',
    act: (it) => {
      AU.sfx('musicbox');
      it.spin = 6;
      say('叮咚叮咚……团子听得睡着了。', 3);
    },
  },
  desk: {
    n: '书桌',
    cat: 'live',
    w: 1.4,
    d: 0.7,
    c: 0xc08a58,
    b: (g) => {
      g.add(P(m_(B_(1.4, 0.08, 0.7), 0xc08a58), 0, 0.76, 0));
      legs(g, 1.4, 0.7, 0.74, 0x8a5a3c, 0.04);
      g.add(P(m_(B_(0.4, 0.5, 0.6), 0xd9a86a), 0.45, 0.45, 0));
      g.add(P(m_(B_(0.5, 0.04, 0.36), 0xfff4e6), -0.2, 0.82, 0));
      g.add(P(m_(C_(0.05, 0.05, 0.25, 8), 0x4f7cc9), -0.5, 0.92, -0.2));
      g.add(
        P(m_(C_(0.12, 0.18, 0.12, 12), 0xffe6a8, { emissive: 0xffc060, emissiveIntensity: 0.4 }), 0.45, 1.05, -0.2),
      );
    },
    label: '翻开图鉴',
    act: () => openJournal(),
  },
  oven: {
    n: '烤箱',
    cat: 'kitchen',
    w: 1,
    d: 0.9,
    c: 0xffc6a0,
    b: (g) => {
      g.add(P(m_(B_(1, 1.1, 0.9), 0xffc6a0), 0, 0.55, 0));
      g.add(P(m_(B_(0.75, 0.55, 0.05), 0x3d3040), 0, 0.55, 0.46));
      g.add(P(m_(B_(0.7, 0.05, 0.06), 0xffffff), 0, 0.9, 0.48));
      for (const x of [-0.3, 0, 0.3]) g.add(P(m_(C_(0.05, 0.05, 0.05, 10), 0xffffff), x, 1.02, 0.46));
    },
    label: '烤点心',
    act: (it) => openCook(it),
  },
  bbq: {
    n: '烧烤架',
    cat: 'kitchen',
    w: 1.4,
    d: 0.8,
    c: 0x3d4a7a,
    b: (g) => {
      g.add(P(m_(B_(1.2, 0.35, 0.7), 0x3d4a7a), 0, 0.85, 0));
      g.add(P(m_(B_(1.15, 0.04, 0.65), 0x2e3a59), 0, 1.04, 0));
      legs(g, 1.2, 0.7, 0.7, 0x5a5a66, 0.04);
      g.add(P(m_(B_(0.3, 0.05, 0.6), 0xc08a58), 0.75, 0.8, 0));
    },
    label: '烤点东西',
    act: (it) => openCook(it),
  },
  hammock: {
    n: '吊床',
    cat: 'bed',
    w: 2.6,
    d: 1,
    c: 0xffd23f,
    b: (g) => {
      for (const s of [-1, 1]) g.add(P(m_(C_(0.07, 0.07, 2, 8), 0x8a5a3c), s * 1.2, 1, 0));
      const h = m_(new THREE.SphereGeometry(1, 16, 8, 0, TAU, Math.PI * 0.6, Math.PI * 0.4), 0xffd23f, {
        side: THREE.DoubleSide,
      });
      h.scale.set(1.1, 0.5, 0.45);
      h.position.y = 1.15;
      g.add(h);
    },
    label: '躺进吊床',
    seat: { y: 0.75, z: 0, rock: true, lie: true },
    act: (it) => sitItem(it),
  },
  fountain: {
    n: '小喷泉',
    cat: 'deco',
    w: 1.4,
    d: 1.4,
    c: 0x9fd8ff,
    b: (g) => {
      g.add(P(m_(C_(0.7, 0.75, 0.4, 20), 0xd9cfbf), 0, 0.2, 0));
      g.add(P(m_(C_(0.6, 0.6, 0.05, 20), 0x9fe0ff), 0, 0.38, 0));
      g.add(P(m_(C_(0.1, 0.14, 0.8, 10), 0xd9cfbf), 0, 0.7, 0));
      g.add(P(m_(C_(0.3, 0.1, 0.12, 14), 0xd9cfbf), 0, 1.1, 0));
    },
    label: '投一枚花币许愿',
    act: (it) => fountainWish(it),
  },
  planter: {
    n: '小菜地',
    cat: 'garden',
    w: 1.6,
    d: 1.1,
    c: 0x8a5a3c,
    b: (g) => {
      g.add(P(m_(B_(1.6, 0.35, 1.1), 0xa0704a), 0, 0.17, 0));
      g.add(P(m_(B_(1.45, 0.06, 0.95), 0x6a4a38), 0, 0.36, 0));
      const cr = new THREE.Group();
      cr.name = 'crop';
      cr.userData.dynamic = true;
      g.add(cr);
    },
    label: '看看菜地',
    act: (it) => gardenAct(it),
  },
  birdhouse: {
    n: '小鸟屋',
    cat: 'garden',
    w: 0.6,
    d: 0.6,
    c: 0x7cc8a8,
    b: (g) => {
      g.add(P(m_(C_(0.04, 0.04, 1.4, 6), 0x8a5a3c), 0, 0.7, 0));
      g.add(P(m_(B_(0.4, 0.4, 0.4), 0x7cc8a8), 0, 1.55, 0));
      g.add(P(m_(new THREE.ConeGeometry(0.38, 0.3, 4), 0xe84a5f), 0, 1.9, 0));
      g.children[2].rotation.y = Math.PI / 4;
      g.add(P(m_(C_(0.07, 0.07, 0.05, 10), 0x2e3a59), 0, 1.58, 0.2));
      g.children[3].rotation.x = Math.PI / 2;
    },
    label: '放一点鸟食',
    act: () => {
      AU.sfx('chimeTap', 14);
      say(rpick(['一只小鸟飞来啄了两口，唱了一句歌。', '小鸟说：啾！', '团子想跟小鸟交朋友。']), 2.8);
      task('birds');
    },
  },
  globe: {
    n: '地球仪',
    cat: 'fun',
    w: 0.6,
    d: 0.6,
    c: 0x4f9ce0,
    b: (g) => {
      g.add(P(m_(C_(0.2, 0.25, 0.1, 12), 0xc08a58), 0, 0.05, 0));
      g.add(P(m_(C_(0.03, 0.03, 0.7, 6), 0xc08a58), 0, 0.4, 0));
      const gl = new THREE.Group();
      gl.name = 'ball';
      gl.userData.dynamic = true;
      gl.position.y = 0.9;
      gl.add(m_(S_(0.25), 0x4f9ce0));
      for (let i = 0; i < 4; i++)
        gl.add(P(m_(S_(0.1), 0x7cc85e), Math.cos(i * 1.6) * 0.18, Math.sin(i * 2.1) * 0.12, Math.sin(i * 1.6) * 0.18));
      g.add(gl);
    },
    label: '转一转地球仪',
    act: (it) => {
      it.spin = 3;
      AU.sfx('whoosh');
      say(rpick(['转啊转……停！手指点到了大海。', '世界好大，花海只是其中一小块。', '以后带团子去看雪山。']), 2.6);
    },
  },
  pigtent: {
    n: '团子帐篷',
    cat: 'pig',
    w: 1.4,
    d: 1.4,
    c: 0xffd23f,
    b: (g) => {
      const t = m_(new THREE.ConeGeometry(0.8, 1.3, 4, 1, true), 0xffd23f, { side: THREE.DoubleSide });
      t.rotation.y = Math.PI / 4;
      t.position.y = 0.65;
      g.add(t);
      g.add(P(m_(C_(0.6, 0.6, 0.04, 16), 0xff8fb3), 0, 0.03, 0));
      g.add(P(m_(new THREE.ConeGeometry(0.12, 0.3, 6), 0xe84a5f), 0, 1.4, 0));
    },
    label: '让团子钻帐篷',
    act: (it) =>
      pigGoDo(it.x, it.z, () => {
        AI.state = 'nap';
        AI.timer = 0;
        AI.napUntil = 12;
        AI.napAny = true;
        AI.napY = 0.03;
        say('这是我的秘密基地！', 2.4);
        gainLove(1);
      }),
  },
  pigbowl: {
    n: '团子饭碗',
    cat: 'pig',
    w: 0.6,
    d: 0.6,
    c: 0xe84a5f,
    b: (g) => {
      g.add(
        P(
          m_(
            lathe(
              [
                [0.001, 0],
                [0.22, 0],
                [0.28, 0.14],
                [0.24, 0.16],
                [0.18, 0.04],
                [0.001, 0.04],
              ],
              18,
            ),
            0xe84a5f,
          ),
          0,
          0,
          0,
        ),
      );
      const f = m_(C_(0.2, 0.2, 0.05, 14), 0xe8b060);
      f.name = 'food';
      f.position.y = 0.1;
      g.add(f);
    },
    label: '给团子倒饭',
    act: (it) =>
      pigGoDo(it.x, it.z + 0.5, () => {
        AU.sfx('munch');
        hearts(5);
        gainLove(2);
        say('吧唧吧唧……谢谢你！', 2.4);
        task('pet');
      }),
  },
  pigslide: {
    n: '团子滑梯',
    cat: 'pig',
    w: 2,
    d: 0.9,
    c: 0x8fb8ff,
    b: (g) => {
      g.add(P(m_(B_(0.6, 1.2, 0.6), 0x8fb8ff), -0.7, 0.6, 0));
      for (let i = 0; i < 3; i++) g.add(P(m_(B_(0.5, 0.08, 0.25), 0xffd23f), -1.1, 0.25 + i * 0.35, 0));
      const sl = m_(B_(1.5, 0.08, 0.55), 0xff8fb3);
      sl.position.set(0.2, 0.65, 0);
      sl.rotation.z = -0.62;
      g.add(sl);
    },
    label: '看团子滑滑梯',
    act: (it) =>
      pigGoDo(it.x - 0.9, it.z, () => {
        AI.state = 'slide';
        AI.timer = 0;
        AI.slide = it;
        AU.sfx('whoosh');
        gainLove(1);
      }),
  },
  display: {
    n: '收藏柜',
    cat: 'fun',
    w: 1.4,
    d: 0.5,
    c: 0xd8e8f0,
    b: (g) => {
      g.add(P(m_(B_(1.4, 1.9, 0.5), 0xc08a58), 0, 0.95, 0));
      const gl = new THREE.Mesh(
        B_(1.25, 1.6, 0.05),
        new THREE.MeshToonMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35, gradientMap: toonGrad }),
      );
      gl.position.set(0, 1.05, 0.25);
      gl.userData.keepAlone = true;
      gl.userData.noInk = true;
      g.add(gl);
      for (let y = 0; y < 3; y++) {
        g.add(P(m_(B_(1.2, 0.05, 0.4), 0xfff4e6), 0, 0.4 + y * 0.5, 0));
        for (let i = 0; i < 3; i++)
          g.add(P(m_(S_(0.08), [0xffd23f, 0x7fd8ff, 0xff8fb3][(i + y) % 3]), -0.4 + i * 0.4, 0.5 + y * 0.5, 0));
      }
    },
    label: '看看收藏',
    act: () => openJournal(),
  },
  mirror: {
    n: '穿衣镜',
    cat: 'bed',
    w: 0.9,
    d: 0.5,
    c: 0xd8f0ff,
    b: (g) => {
      g.add(P(m_(B_(0.8, 1.9, 0.08), 0xc08a58), 0, 1.05, 0));
      g.add(P(m_(B_(0.65, 1.7, 0.02), 0xd8f0ff, { emissive: 0xffffff, emissiveIntensity: 0.15 }), 0, 1.05, 0.05));
      for (const s of [-1, 1]) g.add(P(m_(B_(0.08, 0.1, 0.45), 0x8a5a3c), s * 0.3, 0.05, 0));
    },
    label: '照照镜子换衣服',
    act: () => openWardrobe(),
  },
  beanbag: {
    n: '懒人沙发',
    cat: 'live',
    w: 1.1,
    d: 1.1,
    c: 0x7cc85e,
    b: (g) => {
      const b = m_(S_(0.55), 0x7cc85e);
      b.scale.set(1, 0.55, 1);
      b.position.y = 0.3;
      g.add(b);
      const bk = m_(S_(0.4), 0x7cc85e);
      bk.scale.set(1.2, 0.9, 0.6);
      bk.position.set(0, 0.55, -0.3);
      g.add(bk);
    },
    label: '陷进懒人沙发',
    seat: { y: 0.38, z: 0.1 },
    act: (it) => sitItem(it),
  },
  aquarium: {
    n: '大水族箱',
    cat: 'fun',
    w: 2,
    d: 0.7,
    c: 0x7fd8ff,
    b: (g) => {
      g.add(P(m_(B_(2, 0.7, 0.7), 0x3d4a7a), 0, 0.35, 0));
      const gl = new THREE.Mesh(
        B_(1.9, 1, 0.6),
        new THREE.MeshToonMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.4, gradientMap: toonGrad }),
      );
      gl.position.y = 1.2;
      gl.userData.keepAlone = true;
      gl.userData.noInk = true;
      g.add(gl);
      g.add(P(m_(B_(1.85, 0.12, 0.55), 0xf3e3c3), 0, 0.76, 0));
      const fs = new THREE.Group();
      fs.name = 'afish';
      fs.userData.dynamic = true;
      g.add(fs);
    },
    label: '看看钓到的鱼',
    act: () => {
      const n = Object.keys(save.fishLog || {}).length;
      say(n ? tr('水族箱里住着你钓到的 {n} 种鱼！', { n }) : '空空的……去钓几条鱼回来吧！', 2.8);
    },
  },
  shipbin: {
    n: '收购箱',
    cat: 'garden',
    w: 1.2,
    d: 0.8,
    c: 0xc08a58,
    b: (g) => {
      g.add(P(m_(B_(1.2, 0.7, 0.8), 0xc08a58), 0, 0.35, 0));
      g.add(P(m_(B_(1.25, 0.1, 0.85), 0x8a5a3c), 0, 0.75, -0.05));
      g.children[1].rotation.x = -0.25;
      g.add(P(m_(B_(0.5, 0.3, 0.02), 0xfff4e6), 0, 0.45, 0.41));
    },
    label: '把东西卖掉',
    act: () => openShop('sell'),
  },
};
const PRICE = {
  fire: [300],
  record: [200],
  piano: [600, 3],
  easel: [150],
  tank: [250],
  tub: [300],
  rocker: [150],
  scope: [400, 2],
  photos: [120],
  plush: [120],
  hang: [350],
  lights: [150],
  musicbox: [180, 1],
  desk: [150],
  oven: [250],
  bbq: [280],
  hammock: [220],
  fountain: [400, 2],
  planter: [80],
  birdhouse: [90],
  globe: [160],
  pigtent: [180],
  pigbowl: [60],
  pigslide: [260],
  display: [200],
  mirror: [140],
  beanbag: [120],
  aquarium: [500, 3],
  shipbin: [0],
};
Object.keys(FURN).forEach((k) => {
  const p = PRICE[k] || [0];
  FURN[k].price = p[0];
  FURN[k].star = p[1] || 0;
});
const DEFAULT_HOME = [
  ['bed', -6, -4.8, 0],
  ['pigbed', -3.4, -5.4, 0],
  ['wardrobe', -8.2, -2, 1],
  ['stove', 5.8, -5.8, 0],
  ['fridge', 7.9, -5.8, 0],
  ['counter', 3.8, -5.9, 0],
  ['table', 5, -2.8, 0],
  ['chair', 4.2, -1.6, 2],
  ['chair', 5.8, -1.6, 2],
  ['sofa', -1, 3.5, 2],
  ['rug', -1, 1.6, 0],
  ['coffee', -1, 1.6, 0],
  ['shelf', 8.4, 1.5, 3],
  ['lamp', -3.2, 4.6, 0],
  ['plant', 8.3, 5.5, 0],
  ['toybox', 2.8, 5.4, 0],
  ['clock', -8.3, 1.4, 1],
  ['vase', 1.3, -5.8, 0],
  ['planter', -7.6, 4.8, 0],
  ['shipbin', -5.2, 4.3, 2],
];

/* ---------- placing items ---------- */
function footprint(type, r) {
  const f = FURN[type];
  return r % 2 ? [f.d, f.w] : [f.w, f.d];
}
function makeItemMesh(type) {
  const g = new THREE.Group();
  FURN[type].b(g);
  mergeGroup(g);
  hk.ink(g, 0.013);
  g.traverse((n) => {
    if (n.isMesh && !n.userData.isInk) {
      n.castShadow = !FURN[type].floor;
      n.receiveShadow = true;
    }
  });
  return g;
}
function addItem(type, x, z, r, s, d) {
  const it = { id: HOME.uid++, type, x, z, r, s: s || 0, d: d || null };
  it.g = makeItemMesh(type);
  it.g.position.set(x, 0, z);
  it.g.rotation.y = (-r * Math.PI) / 2;
  it.g.userData.item = it;
  HOME.root.add(it.g);
  if (FURN[type].light) {
    const pl = new THREE.PointLight(type === 'fire' ? 0xff9a4a : 0xffd28a, 0, type === 'fire' ? 9 : 7, 1.6);
    pl.position.set(0, type === 'fire' ? 0.8 : type === 'lamp' ? 1.9 : 1.2, type === 'fire' ? 0.6 : 0);
    it.g.add(pl);
    it.pl = pl;
    if (it.s == null) it.s = 0;
  }
  HOME.items.push(it);
  applyState(it);
  return it;
}
function applyState(it) {
  const g = it.g,
    s = it.s || 0;
  if (it.type === 'plant') {
    const lf = g.getObjectByName('leaves');
    if (lf) {
      lf.scale.setScalar(0.6 + s * 0.25);
      const bl = lf.getObjectByName('bloom');
      if (bl) bl.visible = s === 2;
    }
  }
  if (it.type === 'vase') {
    const b = g.getObjectByName('bouquet');
    if (b) {
      const c = [0xff8fb3, 0xffd23f, 0xb58cff, 0xffffff][s];
      b.children.forEach((m) => {
        if (m.material && !m.userData.isInk) m.material = hk.mat(c);
      });
    }
  }
  if (FURN[it.type].light && it.pl) {
    it.pl.intensity = s ? 1.2 : 0;
    const fl = g.getObjectByName('flame');
    if (fl) fl.visible = !!s;
  }
  if (it.type === 'photos') refreshPhotoWall();
}
function refreshPhotoWall() {
  HOME.items
    .filter((i) => i.type === 'photos')
    .forEach((it) => {
      for (let i = 0; i < 4; i++) {
        const m = it.g.getObjectByName('ph' + i);
        if (!m) continue;
        const p = save.photos[i];
        if (p && p.url) {
          const img = new Image();
          img.onload = () => {
            const t = new THREE.Texture(img);
            t.needsUpdate = true;
            if (m.material.map) m.material.map.dispose();
            m.material.map = t;
            m.material.color.set(0xffffff);
            m.material.needsUpdate = true;
          };
          img.src = p.url;
        }
      }
    });
}
window.refreshPhotoWall = refreshPhotoWall;
function removeItem(it) {
  HOME.root.remove(it.g);
  HOME.items.splice(HOME.items.indexOf(it), 1);
}
function saveHome() {
  save.home = HOME.items.map((i) => [i.type, +i.x.toFixed(2), +i.z.toFixed(2), i.r, i.s || 0, i.d || 0]);
  persist();
}
function loadHome() {
  (save.home || DEFAULT_HOME).forEach((a) => {
    if (FURN[a[0]]) addItem(a[0], a[1], a[2], a[3], a[4], a[5] || null);
  });
}
function rectOf(type, x, z, r) {
  const [w, d] = footprint(type, r);
  return [x - w / 2, z - d / 2, x + w / 2, z + d / 2];
}
function fits(type, x, z, r, ignore) {
  const [a, b, c, d] = rectOf(type, x, z, r);
  const rm = HOME.rooms.find((q) => a >= q.x0 + 0.2 && c <= q.x1 - 0.2 && b >= q.z0 + 0.2 && d <= q.z1 - 0.2);
  if (!rm) return false;
  if (c > -7.1 && a < -4.9 && d > 6.5 - 1.6 && b < 6.5) return false;
  if (FURN[type].floor) return true;
  for (const it of HOME.items) {
    if (it === ignore || FURN[it.type].floor) continue;
    const q = rectOf(it.type, it.x, it.z, it.r);
    if (a < q[2] - 0.02 && c > q[0] + 0.02 && b < q[3] - 0.02 && d > q[1] + 0.02) return false;
  }
  return true;
}
function homeResolve(p, rad) {
  const U = HOME.U;
  p.x = clamp(p.x, U.x0 + 0.3, U.x1 - 0.3);
  p.z = clamp(p.z, U.z0 + 0.3, U.z1 - 0.3);
  for (const [x1, z1, x2, z2] of HOME.segs) {
    const dx = x2 - x1,
      dz = z2 - z1,
      L = dx * dx + dz * dz || 1,
      q = clamp(((p.x - x1) * dx + (p.z - z1) * dz) / L, 0, 1),
      cx = x1 + dx * q,
      cz = z1 + dz * q,
      ex = p.x - cx,
      ez = p.z - cz,
      dd = Math.hypot(ex, ez),
      m = rad + 0.15;
    if (dd < m && dd > 1e-5) {
      p.x = cx + (ex / dd) * m;
      p.z = cz + (ez / dd) * m;
    }
  }
  for (const it of HOME.items) {
    if (FURN[it.type].floor) continue;
    const [a, b, c, d] = rectOf(it.type, it.x, it.z, it.r);
    const qx = clamp(p.x, a, c),
      qz = clamp(p.z, b, d),
      dx = p.x - qx,
      dz = p.z - qz,
      dd = Math.hypot(dx, dz);
    if (dd < rad) {
      if (dd > 1e-4) {
        p.x = qx + (dx / dd) * rad;
        p.z = qz + (dz / dd) * rad;
      } else {
        const m = [p.x - a, c - p.x, p.z - b, d - p.z],
          i = m.indexOf(Math.min(...m));
        if (i === 0) p.x = a - rad;
        else if (i === 1) p.x = c + rad;
        else if (i === 2) p.z = b - rad;
        else p.z = d + rad;
      }
    }
  }
}
function nearestItem(p) {
  let best = null,
    bd = 1.15;
  for (const it of HOME.items) {
    const [a, b, c, d] = rectOf(it.type, it.x, it.z, it.r);
    const dd = Math.hypot(p.x - clamp(p.x, a, c), p.z - clamp(p.z, b, d));
    if (dd < bd) {
      bd = dd;
      best = it;
    }
  }
  return best;
}

/* ---------- item actions ---------- */
function toggleLight(it) {
  it.s = it.s ? 0 : 1;
  applyState(it);
  AU.sfx(it.type === 'fire' ? (it.s ? 'fire' : 'thud') : 'switch');
  saveHome();
}
function sitItem(it) {
  const f = FURN[it.type],
    st = f.seat,
    a = (-it.r * Math.PI) / 2,
    fx = Math.sin(a),
    fz = Math.cos(a);
  sitOn('bench', {
    x: it.x + fx * st.z,
    y: st.y,
    z: it.z + fz * st.z,
    ry: a,
    sx: it.x + fx * (f.d / 2 + 0.6),
    sz: it.z + fz * (f.d / 2 + 0.6),
    rock: st.rock ? 0.25 : 0,
    lie: !!st.lie,
    it,
    line: rpick(['坐一会儿～', '好舒服。', '团子，过来一起坐！']),
  });
}
function sleepAt(it) {
  paused = true;
  const v = $('#veil');
  v.querySelector('span').textContent = 'Zzz……';
  v.classList.add('on');
  AU.sfx('lullaby');
  const pb = HOME.items.find((i) => i.type === 'pigbed');
  setTimeout(() => {
    nightTarget = nightTarget > 0.5 ? 0 : 1;
    nightT = nightTarget;
    applyEnv(nightT);
    if (pb) {
      pig.g.position.set(pb.x, 0.2, pb.z);
    }
    boy.g.position.set(it.x + 1.6, 0, it.z);
    v.querySelector('span').textContent = nightTarget ? '一觉睡到了晚上' : '一觉睡到了傍晚';
  }, 1400);
  setTimeout(() => {
    v.classList.remove('on');
    paused = false;
    say(nightTarget ? '晚上好！外面的星星出来了。' : '睡得好饱！', 2.6);
    gainLove(1);
    setTimeout(() => (v.querySelector('span').textContent = '正在进入花海'), 900);
  }, 3200);
}
function openBook() {
  const B = [
    '《会飞的鲸鱼》\n　　天鲸每一百年才绕花海游一圈。它背上的光点，是它吞下的萤火虫在睡觉。',
    '《蘑菇村的派》\n　　蘑菇村的派要用晨露和一点点月光来烤。最后一步，是对着派说一句「谢谢」。',
    '《团子的秘密》\n　　团子其实能听懂风说话。风告诉它哪里藏着种子，它就用鼻子拱一拱你的手。',
    '《巨树的年轮》\n　　巨树每开一次花，就多一圈金色的年轮。松鼠奶奶说，那一圈里住着那一年所有的笑声。',
    '《星星碎片》\n　　流星掉进花海，会碎成小小的星星碎片。收集起来，可以换来想要的东西——比如一架钢琴。',
  ];
  $('#bookTxt').textContent = pick(B);
  openModal('#bookBox');
  AU.sfx('paper');
}
$('#btnBookClose').onclick = () => closeModal('#bookBox');
function paint(it) {
  const cv = it.g.getObjectByName('canvas');
  if (!cv) return;
  const kind = (it.s = ((it.s || 0) + 1) % 4);
  const t = ctex(128, (g, s) => {
    const sky = [
      ['#ffd9a0', '#ff9e7a'],
      ['#9fd8ff', '#e0f4ff'],
      ['#2a2a5c', '#6b4f9a'],
      ['#fff4e2', '#ffe2a6'],
    ][kind];
    const gr = g.createLinearGradient(0, 0, 0, s);
    gr.addColorStop(0, sky[0]);
    gr.addColorStop(1, sky[1]);
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    if (kind === 0) {
      g.fillStyle = '#ffe066';
      g.beginPath();
      g.arc(90, 50, 16, 0, TAU);
      g.fill();
      g.fillStyle = '#6fbf5a';
      g.beginPath();
      g.arc(30, 110, 40, 0, TAU);
      g.fill();
      g.fillStyle = '#8a6a55';
      g.fillRect(26, 70, 8, 40);
    } else if (kind === 1) {
      g.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(30 + i * 30, 40 + i * 6, 14, 0, TAU);
        g.fill();
      }
      g.fillStyle = '#8fcf6a';
      g.fillRect(0, 96, s, 32);
      g.fillStyle = '#ff8fb3';
      for (let i = 0; i < 10; i++) {
        g.beginPath();
        g.arc(8 + i * 12, 100 + (i % 2) * 6, 4, 0, TAU);
        g.fill();
      }
    } else if (kind === 2) {
      g.fillStyle = '#fff8d0';
      for (let i = 0; i < 30; i++) g.fillRect((i * 37) % s, (i * 23) % 80, 2, 2);
      g.fillStyle = '#8fb8e8';
      g.beginPath();
      g.ellipse(64, 70, 40, 14, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#2e3a59';
      g.beginPath();
      g.arc(90, 66, 2.5, 0, TAU);
      g.fill();
    } else {
      g.fillStyle = '#ffa3b5';
      g.beginPath();
      g.arc(64, 72, 38, 0, TAU);
      g.fill();
      g.fillStyle = '#ff7f96';
      g.beginPath();
      g.ellipse(64, 80, 14, 10, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#2e3a59';
      for (const x of [50, 78]) {
        g.beginPath();
        g.arc(x, 62, 4, 0, TAU);
        g.fill();
      }
      g.fillStyle = '#ffd23f';
      g.beginPath();
      g.ellipse(64, 36, 34, 9, 0, 0, TAU);
      g.fill();
    }
  });
  t.userData = {};
  if (cv.material.map) cv.material.map.dispose();
  cv.material.map = t;
  cv.material.needsUpdate = true;
  AU.sfx('brush');
  say(['画了一棵大树。', '画了花海和白云。', '画了夜里的天鲸！', '画了……团子！像不像？'][kind], 2.6);
  gainLove(kind === 3 ? 2 : 0);
}

/* ---------- cooking & eating ---------- */
const RECIPES = [
  { id: 'toast', n: '煎蛋吐司', need: {}, c: 0xffe08a, love: 1 },
  { id: 'pie', n: '蜜桃派', need: { peach: 2, honey: 1 }, c: 0xffa27a, love: 3 },
  { id: 'soup', n: '蘑菇浓汤', need: { mush: 2 }, c: 0xe8d2a0, love: 3 },
  { id: 'cake', n: '草莓蛋糕', need: { berry: 2, honey: 1 }, c: 0xff8fb3, love: 4 },
  { id: 'tea', n: '一壶花茶', need: { tea: 1 }, c: 0xc8e8a0, love: 2 },
  { id: 'ball', n: '团子特制饭团', need: { berry: 1, mush: 1 }, c: 0xfff4e6, love: 6 },
];
let cookAt = null;
function openCook(it) {
  cookAt = it;
  const box = $('#recipes');
  box.innerHTML = '';
  $('#invTxt').textContent =
    '冰箱里：' +
    Object.entries(save.inv)
      .map(([k, v]) => INV_N[k] + ' ' + v)
      .join('　') +
    '　鱼 ' +
    fishCount();
  RECIPES.forEach((r) => {
    const ok = Object.entries(r.need).every(([k, v]) => haveIng(k, v));
    const d = document.createElement('div');
    d.className = 'recipe' + (ok ? '' : ' off');
    const need =
      Object.entries(r.need)
        .map(([k, v]) => INV_N[k] + '×' + v)
        .join('、') || '不需要材料';
    d.innerHTML = `<div><b>${r.n}</b><small>${need}</small></div>`;
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = ok ? '做这个' : '材料不够';
    b.disabled = !ok;
    b.onclick = () => cook(r);
    d.appendChild(b);
    box.appendChild(d);
  });
  openModal('#cookBox');
}
$('#btnCookClose').onclick = () => closeModal('#cookBox');
function cook(r) {
  closeModal('#cookBox');
  Object.entries(r.need).forEach(([k, v]) => useIng(k, v));
  save.stats.cook++;
  task('cook');
  persist();
  HOME.cooking = { t: 0, r, it: cookAt };
  AU.sfx('sizzle');
  say('咕嘟咕嘟……好香！', 2.2);
}
function serveDish(kind) {
  const r = typeof kind === 'string' ? { id: kind, n: '水果拼盘', c: 0xffa27a, love: 2 } : kind;
  const tb =
    HOME.items.find((i) => FURN[i.type].table && !HOME.dishes.some((d) => d.it === i)) ||
    HOME.items.find((i) => FURN[i.type].table);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.04, 18), hk.mat(0xffffff)));
  if (r.id === 'tea') {
    g.add(
      P(
        new THREE.Mesh(
          lathe(
            [
              [0.001, 0],
              [0.13, 0],
              [0.16, 0.12],
              [0.1, 0.24],
              [0.001, 0.26],
            ],
            12,
          ),
          hk.mat(0xd8e8e0),
        ),
        0,
        0.02,
        0,
      ),
    );
  } else if (r.id === 'soup') {
    g.add(
      P(
        new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8, 0, TAU, Math.PI / 2, Math.PI / 2), hk.mat(0xffffff)),
        0,
        0.2,
        0,
      ),
    );
    g.add(P(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 14), hk.mat(r.c)), 0, 0.18, 0));
  } else if (r.id === 'cake' || r.id === 'pie') {
    g.add(P(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 16), hk.mat(r.c)), 0, 0.1, 0));
    g.add(P(new THREE.Mesh(hk.sphere(0.05), hk.mat(0xe8304a)), 0, 0.21, 0));
  } else
    for (let i = 0; i < 5; i++)
      g.add(
        P(
          new THREE.Mesh(hk.sphere(0.07), hk.mat(i % 2 ? r.c : 0xfff4e6)),
          Math.cos(i * 1.3) * 0.1,
          0.07,
          Math.sin(i * 1.3) * 0.1,
        ),
      );
  hk.ink(g, 0.012);
  const y = tb ? (tb.type === 'coffee' ? 0.5 : 0.87) : 1.1;
  const px = tb ? tb.x : HOME.cooking && HOME.cooking.it ? HOME.cooking.it.x : 0,
    pz = tb ? tb.z : HOME.cooking && HOME.cooking.it ? HOME.cooking.it.z : 0;
  g.position.set(px + rnd(-0.3, 0.3), y, pz + rnd(-0.2, 0.2));
  HOME.root.add(g);
  HOME.dishes.push({ g, r, it: tb });
  AU.sfx('ding');
  say(
    trMark(
      tr('{dish}做好了！', { dish: tr(r.n) }) +
        (LANG === 'en' ? ' ' : '') +
        tr(tb ? '放在桌上啦。' : '……可是家里没有桌子，先放这儿吧。'),
    ),
    2.8,
  );
}
function eatAt(it) {
  const d = HOME.dishes.find((q) => q.it === it) || HOME.dishes[0];
  if (!d) {
    say(rpick(['桌上空空的……去灶台做点吃的吧！', '先做饭，再开饭！']), 2.4);
    return;
  }
  sitItem2(it);
  HOME.dishes.splice(HOME.dishes.indexOf(d), 1);
  AU.sfx('munch');
  let k = 0;
  const iv = setInterval(() => {
    k++;
    d.g.scale.setScalar(Math.max(0.01, 1 - k / 6));
    if (k >= 6) {
      clearInterval(iv);
      HOME.root.remove(d.g);
      hearts(6);
      gainLove(d.r.love || 1);
      say(
        d.r.id === 'ball'
          ? '团子特制饭团！团子高兴得转圈圈！'
          : rpick(['好好吃！', '团子吃得脸上都是。', '吃饱饱，想睡觉……']),
        3,
      );
      if (d.r.id === 'ball') {
        AI.state = 'dance';
        AI.timer = 2;
      }
    }
  }, 350);
}
function sitItem2(it) {
  const [w, d] = footprint(it.type, it.r);
  const b = boy.g.position;
  boy.g.rotation.y = Math.atan2(it.x - b.x, it.z - b.z);
  pigGoDo(it.x + w / 2 + 0.4, it.z, () => {
    pig.vy = 3;
  });
}

/* ---------- entering / leaving ---------- */
function goHome() {
  if (HOME.on || !started) return;
  if (PL.state !== 'free') {
    say('先下来再回家吧。', 2);
    return;
  }
  closePigMenu();
  veilShow('回家啦');
  AU.sfx('sparkle');
  paused = true;
  setTimeout(() => {
    HOME.ret = { x: boy.g.position.x, z: boy.g.position.z, level: PL.level };
    HOME.on = true;
    world.remove(boy.g, pig.g);
    if (ball && ball.g.parent) ball.g.parent.remove(ball.g);
    HOME.root.add(boy.g, pig.g);
    PL.level = 'home';
    PL.carry = false;
    boy.g.position.set(-6, 0, -4.6);
    pig.g.position.set(-5, 0, -4.2);
    boy.g.rotation.y = pig.g.rotation.y = 0;
    cam.target.set(-6, 1, -4);
    cam.yaw = 0.5;
    cam.pitch = 0.55;
    cam.tDist = 12;
    AI.state = 'follow';
    document.body.classList.add('home');
    setZone('小家');
    scene.visible = false;
    veilHide();
    paused = false;
    say(rpick(['到家啦！', '我的小窝！', '家里好暖和。']), 2.4);
  }, 650);
}
function leaveHome() {
  if (!HOME.on) return;
  if (HOME.build) endBuild();
  veilShow('出门啦');
  AU.sfx('sparkle');
  paused = true;
  setTimeout(() => {
    HOME.on = false;
    HOME.root.remove(boy.g, pig.g);
    if (ball && ball.g.parent) ball.g.parent.remove(ball.g);
    world.add(boy.g, pig.g);
    const r = HOME.ret || { x: 0, z: 28, level: 'ground' };
    PL.level = r.level === 'deck' ? 'deck' : 'ground';
    PL.state = 'free';
    boy.g.position.set(r.x, gY(r.x, r.z, PL.level), r.z);
    pig.g.position.set(r.x + 1, gY(r.x + 1, r.z, PL.level), r.z + 0.5);
    cam.target.set(r.x, 1, r.z);
    cam.pitch = 0.2;
    cam.tDist = 10;
    document.body.classList.remove('home');
    scene.visible = true;
    veilHide();
    paused = false;
  }, 650);
}
$('#btnHome').onclick = goHome;
$('#btnOut').onclick = leaveHome;

/* ---------- build mode ---------- */
function startBuild() {
  if (!HOME.on || HOME.build) return;
  if (PL.state !== 'free') standUp();
  HOME.build = true;
  document.body.classList.add('build');
  $('#buildUI').classList.remove('hidden');
  cam.save = { yaw: cam.yaw, pitch: cam.pitch, d: cam.tDist };
  cam.pitch = 1.0;
  cam.tDist = 21;
  renderTabs();
  renderItems();
  AU.sfx('paper');
}
function endBuild() {
  cancelGhost();
  selectItem(null);
  HOME.build = false;
  document.body.classList.remove('build');
  $('#buildUI').classList.add('hidden');
  if (cam.save) {
    cam.pitch = cam.save.pitch;
    cam.tDist = cam.save.d;
  }
  saveHome();
}
$('#btnBuild').onclick = () => (HOME.build ? endBuild() : startBuild());
$('#btnBuildDone').onclick = endBuild;
function shardsLeft() {
  const spent =
    save.unlock.reduce((s, id) => s + (FURN[id] ? FURN[id].star : 0), 0) +
    Object.entries(save.ext).reduce((s, [k, v]) => s + SLOTS[k].opts[v].star, 0);
  return save.shards.length - spent;
}
function renderTabs() {
  const t = $('#bTabs');
  t.innerHTML = '';
  CAT.forEach(([id, n]) => {
    const b = document.createElement('button');
    b.textContent = n;
    b.className = HOME.tab === id ? 'on' : '';
    b.onclick = () => {
      HOME.tab = id;
      renderTabs();
      renderItems();
    };
    t.appendChild(b);
  });
}
function card(html, cls, fn) {
  const b = document.createElement('button');
  b.className = 'bItem ' + (cls || '');
  b.innerHTML = html;
  b.onclick = fn;
  $('#bItems').appendChild(b);
  return b;
}
function costTxt(price, star) {
  return [price ? price + ' 花币' : '', star ? '★' + star : ''].filter(Boolean).join(' + ') || '免费';
}
function renderItems() {
  const box = $('#bItems');
  box.innerHTML = '';
  $('#bShard').textContent = '花币 ' + save.coins + '　·　星星碎片 ' + shardsLeft();
  if (HOME.tab === 'room') {
    const rm =
      HOME.styleRoom && save.rooms[HOME.styleRoom]
        ? HOME.styleRoom
        : (roomAt(boy.g.position.x, boy.g.position.z) || { id: 'main' }).id;
    HOME.styleRoom = rm;
    HOME.rooms.forEach((r) =>
      card(
        `<div class="sw" style="background:#fff4e6;display:flex;align-items:center;justify-content:center;font-size:18px">⌂</div>${ROOM_N[r.id]}<small>${r.id === rm ? '正在布置' : '点击选择'}</small>`,
        r.id === rm ? 'on' : '',
        () => {
          HOME.styleRoom = r.id;
          renderItems();
        },
      ),
    );
    const st = save.rooms[rm];
    WALLS.forEach((w, i) =>
      card(
        `<div class="sw" style="background:${w.c}"></div>墙纸<small>${w.n}</small>`,
        st.wall === i ? 'on' : '',
        () => {
          st.wall = i;
          styleRoom(rm);
          persist();
          renderItems();
          AU.sfx('paper');
        },
      ),
    );
    FLOORS.forEach((f, i) =>
      card(
        `<div class="sw" style="background:${f.c}"></div>地板<small>${f.n}</small>`,
        st.floor === i ? 'on' : '',
        () => {
          st.floor = i;
          styleRoom(rm);
          persist();
          renderItems();
          AU.sfx('thud');
        },
      ),
    );
    return;
  }
  if (HOME.tab === 'ext') {
    Object.entries(SLOTS).forEach(([k, sl]) => {
      const built = save.ext[k];
      if (built != null) {
        card(
          `<div class="sw" style="background:#cfe8c0"></div>${sl.n}<small>已建成（${built ? '大' : '小'}）</small>`,
          'on',
          () => note(sl.n + '已经建好啦'),
        );
        return;
      }
      sl.opts.forEach((o, i) =>
        card(
          `<div class="sw" style="background:#f4ecdc"></div>${sl.n}·${i ? '大' : '小'}<small>${o.w}×${o.d}　${costTxt(o.price, o.star)}</small>`,
          '',
          () => {
            if (save.coins < o.price) {
              note(tr('花币不够，还差 {n}', { n: o.price - save.coins }));
              return;
            }
            if (shardsLeft() < o.star) {
              note(tr('星星碎片不够，还差 {n} 颗', { n: o.star - shardsLeft() }));
              return;
            }
            if (!confirm(tr('确定扩建「{n}」吗？', { n: tr(sl.n) }))) return;
            spendCoins(o.price);
            save.ext[k] = i;
            persist();
            buildShell();
            AU.sfx('harp');
            toast('小家', '扩建完成', tr(sl.n) + ' ' + o.w + '×' + o.d, 2600);
            ach('build1');
            renderItems();
          },
        ),
      );
    });
    return;
  }
  Object.entries(FURN).forEach(([id, f]) => {
    if (HOME.tab !== 'all' && f.cat !== HOME.tab) return;
    const locked = (f.price || f.star) && !save.unlock.includes(id);
    card(
      `<div class="sw" style="background:#${new THREE.Color(f.c).getHexString()}"></div>${f.n}<small>${locked ? costTxt(f.price, f.star) : '已拥有'}</small>`,
      (locked ? 'lock' : '') + (HOME.ghost && HOME.ghost.type === id ? ' on' : ''),
      () => {
        if (locked) {
          if (save.coins < f.price) {
            note(tr('花币不够，还差 {n}', { n: f.price - save.coins }));
            return;
          }
          if (shardsLeft() < f.star) {
            note(tr('星星碎片不够，还差 {n} 颗', { n: f.star - shardsLeft() }));
            return;
          }
          spendCoins(f.price);
          save.unlock.push(id);
          persist();
          AU.sfx('coin');
          note(tr('买下了「{x}」', { x: tr(f.n) }));
          renderItems();
          return;
        }
        startGhost(id, 0);
      },
    );
  });
}
function startGhost(type, r, moving) {
  cancelGhost();
  selectItem(null);
  const g = makeItemMesh(type);
  g.traverse((n) => {
    if (n.isMesh && !n.userData.isInk) {
      n.material = n.material.clone();
      n.material.transparent = true;
      n.material.opacity = 0.7;
    }
  });
  HOME.root.add(g);
  const tint = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x7cc85e, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  tint.rotation.x = -Math.PI / 2;
  tint.position.y = 0.04;
  HOME.root.add(tint);
  HOME.ghost = { type, r, g, tint, x: cam.target.x, z: cam.target.z, moving };
  moveGhost(boy.g.position.x + 1.5, boy.g.position.z);
  showTools(true);
  renderItems();
}
function moveGhost(x, z) {
  const G = HOME.ghost;
  if (!G) return;
  const snap = (v) => Math.round(v * 4) / 4;
  G.x = snap(x);
  G.z = snap(z);
  const [w, d] = footprint(G.type, G.r);
  G.g.position.set(G.x, 0, G.z);
  G.g.rotation.y = (-G.r * Math.PI) / 2;
  G.tint.position.set(G.x, 0.04, G.z);
  G.tint.scale.set(w, d, 1);
  G.ok = fits(G.type, G.x, G.z, G.r, G.moving);
  G.tint.material.color.set(G.ok ? 0x7cc85e : 0xe84a5f);
}
function placeGhost() {
  const G = HOME.ghost;
  if (!G) return;
  if (!G.ok) {
    note('这里放不下，换个地方吧');
    AU.sfx('thud');
    return;
  }
  const s = G.moving ? G.moving.s : 0,
    dd = G.moving ? G.moving.d : null;
  if (G.moving) removeItem(G.moving);
  addItem(G.type, G.x, G.z, G.r, s, dd);
  task('place');
  AU.sfx('place');
  for (let i = 0; i < 10; i++)
    spark(new V3(G.x + rnd(-0.6, 0.6), 0.3, G.z + rnd(-0.6, 0.6)), TEX.dot, 0xfff4c0, {
      add: true,
      v: new V3(0, rnd(0.5, 1.5), 0),
      life: 0.8,
      size: 0.25,
    });
  const t = G.type;
  cancelGhost();
  saveHome();
  if (!G.moving && FURN[t].cost === 0) {
  }
}
function cancelGhost() {
  const G = HOME.ghost;
  if (!G) return;
  if (G.moving) G.moving.g.visible = true;
  HOME.root.remove(G.g, G.tint);
  HOME.ghost = null;
  showTools(!!HOME.sel);
  if (HOME.build) renderItems();
}
function selectItem(it) {
  if (HOME.sel) HOME.sel.g.scale.setScalar(1);
  HOME.sel = it;
  showTools(!!it || !!HOME.ghost);
}
function showTools(on) {
  const T = $('#bTools');
  T.classList.toggle('hidden', !on);
  const gh = !!HOME.ghost;
  T.querySelector('[data-b=place]').style.display = gh ? '' : 'none';
  T.querySelector('[data-b=move]').style.display = !gh && HOME.sel ? '' : 'none';
  T.querySelector('[data-b=store]').style.display = !gh && HOME.sel ? '' : 'none';
  $('#bHint').textContent = gh
    ? isTouch
      ? '点地板移动，再点「放这里」'
      : '移动鼠标选位置，点击放下'
    : HOME.sel
      ? FURN[HOME.sel.type].n
      : '';
}
$('#bTools')
  .querySelectorAll('button')
  .forEach(
    (b) =>
      (b.onclick = () => {
        const a = b.dataset.b;
        if (a === 'place') placeGhost();
        else if (a === 'cancel') {
          cancelGhost();
          selectItem(null);
        } else if (a === 'rot') {
          if (HOME.ghost) {
            HOME.ghost.r = (HOME.ghost.r + 1) % 4;
            moveGhost(HOME.ghost.x, HOME.ghost.z);
          } else if (HOME.sel) {
            const it = HOME.sel,
              nr = (it.r + 1) % 4;
            if (fits(it.type, it.x, it.z, nr, it)) {
              it.r = nr;
              it.g.rotation.y = (-nr * Math.PI) / 2;
              saveHome();
              AU.sfx('place');
            } else note('转不开，旁边太挤了');
          }
        } else if (a === 'move' && HOME.sel) {
          const it = HOME.sel;
          it.g.visible = false;
          selectItem(null);
          startGhost(it.type, it.r, it);
          moveGhost(it.x, it.z);
        } else if (a === 'store' && HOME.sel) {
          removeItem(HOME.sel);
          selectItem(null);
          saveHome();
          AU.sfx('paper');
        }
      }),
  );
const hray = new THREE.Raycaster(),
  floorPlane = new THREE.Plane(new V3(0, 1, 0), 0),
  hv = new V3();
function homeFloorAt(cx, cy) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  hray.setFromCamera(ndc, camera);
  return hray.ray.intersectPlane(floorPlane, hv) ? hv.clone() : null;
}
function homeTap(cx, cy) {
  if (HOME.ghost) {
    const p = homeFloorAt(cx, cy);
    if (p) {
      const same = Math.hypot(p.x - HOME.ghost.x, p.z - HOME.ghost.z) < 0.6;
      moveGhost(p.x, p.z);
      if (!isTouch || same) placeGhost();
    }
    return true;
  }
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  hray.setFromCamera(ndc, camera);
  const hits = hray.intersectObjects(
    HOME.items.map((i) => i.g),
    true,
  );
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.item) o = o.parent;
    if (o) {
      selectItem(o.userData.item);
      AU.sfx('pop');
      return true;
    }
  }
  selectItem(null);
  return true;
}
canvas.addEventListener('pointermove', (e) => {
  if (HOME.build && HOME.ghost && !isTouch && ptrs.size === 0) {
    const p = homeFloorAt(e.clientX, e.clientY);
    if (p) moveGhost(p.x, p.z);
  }
});
/* keys while decorating (called by the keyboard router in game.js) */
function homeBuildKey(k) {
  if (k === 'r') $('#bTools [data-b=rot]').click();
  else if (k === 'delete' || k === 'backspace') {
    if (HOME.sel) $('#bTools [data-b=store]').click();
  } else if (k === 'b') endBuild();
}
function homeEscape() {
  if (HOME.ghost || HOME.sel) {
    cancelGhost();
    selectItem(null);
  } else endBuild();
}

/* ---------- per-frame ---------- */
function updHome(dt) {
  const n = nightT;
  HOME.hemi.intensity = 0.6 - 0.3 * n;
  HOME.sun.intensity = 0.5 * (1 - n) + 0.06;
  HOME.skyM.color.setRGB(0.75 - 0.6 * n, 0.88 - 0.7 * n, 0.94 - 0.55 * n);
  HOME.scene.background.setRGB(0.95 - 0.7 * n, 0.86 - 0.66 * n, 0.72 - 0.45 * n);
  HOME.motes.userData.update(t, dt);
  // hide the walls between the camera and the room
  const cp = camera.position,
    tg = cam.target;
  HOME.walls.forEach((w) => {
    const s1 = (cp.x - w.x) * w.nx + (cp.z - w.z) * w.nz,
      s2 = (tg.x - w.x) * w.nx + (tg.z - w.z) * w.nz;
    let hide = s1 > 0 && !w.inner;
    if (w.inner && s1 * s2 < 0) {
      const f = s2 / (s2 - s1),
        ix = tg.x + (cp.x - tg.x) * f,
        iz = tg.z + (cp.z - tg.z) * f,
        u = w.ax === 'x' ? ix : iz;
      hide = u > w.a0 - 3 && u < w.a1 + 3;
    }
    w.g.visible = !hide;
  });
  HOME.items.forEach((it) => {
    const g = it.g;
    if (it.type === 'fire' && it.s) {
      const f = g.getObjectByName('flame');
      f.children.forEach((c, i) => c.scale.set(1, 0.8 + 0.3 * Math.sin(t * 12 + i * 2), 1));
      it.pl.intensity = 1.1 + 0.3 * Math.sin(t * 15);
    }
    if (it.type === 'clock') {
      const pd = g.getObjectByName('pend');
      if (pd) pd.rotation.z = Math.sin(t * 2.5) * 0.25;
    }
    if (it.type === 'hang') {
      const pd = g.getObjectByName('pod');
      if (pd) pd.rotation.x = Math.sin(t * 1.2) * (PL.seat && PL.seat.it === it ? 0.15 : 0.04);
    }
    if (it.type === 'tank') {
      const fs = g.getObjectByName('fish');
      if (fs)
        fs.children.forEach((f, i) => {
          const a = t * (0.6 + i * 0.2) + i * 2;
          f.position.set(
            Math.sin(a) * 0.4,
            (HOME.fishFeed > 0 ? 1.3 : 1 + i * 0.08) + Math.sin(t * 2 + i) * 0.03,
            Math.cos(a * 0.7) * 0.12,
          );
          f.rotation.y = a + Math.PI / 2;
        });
    }
    if (it.type === 'musicbox') {
      const d = g.getObjectByName('dancer');
      if (d && it.spin > 0) {
        it.spin -= dt;
        d.rotation.y += dt * 3;
      }
    }
    if (it.type === 'stove') {
      const pan = g.getObjectByName('pan');
      if (pan) pan.position.y = 1.16 + (HOME.cooking && HOME.cooking.it === it ? Math.abs(Math.sin(t * 14)) * 0.04 : 0);
    }
    if (it.type === 'lights' && it.s) {
      g.children.forEach((c, i) => {
        if (c.isMesh && c.material.emissive) c.material.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 4 + i);
      });
    }
  });
  if (HOME.fishFeed > 0) HOME.fishFeed -= dt;
  if (HOME.cooking) {
    const C = HOME.cooking;
    C.t += dt;
    if (Math.random() < dt * 6)
      spark(new V3(C.it.x + rnd(-0.3, 0.3), 1.4, C.it.z), TEX.glow, 0xffffff, {
        v: new V3(0, 0.8, 0),
        life: 1.4,
        size: 0.5,
      });
    if (C.t > 3.5) {
      HOME.cooking = null;
      serveDish(C.r);
    }
  }
  if (HOME.sel) {
    HOME.sel.g.scale.setScalar(1 + Math.sin(t * 6) * 0.03);
  }
  if (HOME.build) {
    const U = HOME.U;
    cam.target.lerp(tmp.set((U.x0 + U.x1) / 2, 0, (U.z0 + U.z1) / 2), damp(3, dt));
  }
}
buildRoom();
loadHome();
