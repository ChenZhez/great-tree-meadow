/* =================== gameplay systems ===================
   coins · fishing · bug catching · journal & achievements · daily tasks · garden · shop (小卖部) · settings */
save.coins = save.coins || 0;
save.fishBag = save.fishBag || {};
save.bugBag = save.bugBag || {};
save.fishLog = save.fishLog || {};
save.bugLog = save.bugLog || {};
save.seedBag = save.seedBag || {};
save.ach = save.ach || [];
save.stats = Object.assign(
  { fish: 0, bug: 0, cook: 0, photo: 0, sold: 0, earned: 0, harvest: 0, wish: 0 },
  save.stats || {},
);
Object.assign(INV_N, { pumpkin: '南瓜', carrot: '胡萝卜', sunflower: '向日葵' });
['pumpkin', 'carrot', 'sunflower'].forEach((k) => {
  if (save.inv[k] == null) save.inv[k] = 0;
});
function updCoinHUD() {
  const e = $('#coinCount');
  if (e) e.textContent = save.coins;
}
function addCoins(n) {
  save.coins += n;
  save.stats.earned += Math.max(0, n);
  persist();
  updCoinHUD();
}
function spendCoins(n) {
  save.coins = Math.max(0, save.coins - n);
  persist();
  updCoinHUD();
}

/* ---------- data ---------- */
const FISH = [
  { id: 'minnow', n: '小银鱼', p: 20, rar: 1, d: 0.25, z: [], tm: 'any', s: [4, 9], c: 0xc8d8e0 },
  {
    id: 'crucian',
    n: '鲫鱼',
    p: 35,
    rar: 1,
    d: 0.35,
    z: ['pond', 'lake', 'tree', 'open'],
    tm: 'any',
    s: [10, 25],
    c: 0x9aa878,
  },
  { id: 'goldfish', n: '金鱼', p: 60, rar: 2, d: 0.4, z: ['pond', 'lake', 'cot'], tm: 'day', s: [6, 14], c: 0xff9a3a },
  { id: 'koi', n: '锦鲤', p: 200, rar: 3, d: 0.6, z: ['pond', 'shrine'], tm: 'any', s: [30, 60], c: 0xffffff },
  { id: 'rainbow', n: '彩虹鱼', p: 150, rar: 2, d: 0.55, z: ['rainbow', 'shoals'], tm: 'day', s: [6, 12], c: 0x74c0fc },
  { id: 'sakura', n: '樱花鲑', p: 180, rar: 2, d: 0.55, z: ['sakura'], tm: 'any', s: [25, 50], c: 0xffb3c6 },
  { id: 'lantern', n: '灯笼鱼', p: 160, rar: 2, d: 0.5, z: ['lake', 'mirror'], tm: 'night', s: [8, 16], c: 0xffd070 },
  {
    id: 'starscale',
    n: '星鳞鱼',
    p: 260,
    rar: 3,
    d: 0.7,
    z: ['shoals', 'mirror'],
    tm: 'night',
    s: [20, 40],
    c: 0xb69cff,
  },
  { id: 'bamboo', n: '竹叶鱼', p: 120, rar: 2, d: 0.45, z: ['bamboo'], tm: 'any', s: [12, 22], c: 0x7cbf5a },
  { id: 'maple', n: '枫叶鳟', p: 140, rar: 2, d: 0.5, z: ['maple', 'mill'], tm: 'any', s: [20, 40], c: 0xf0a030 },
  { id: 'mirror', n: '镜面鲤', p: 220, rar: 3, d: 0.6, z: ['mirror'], tm: 'day', s: [30, 55], c: 0xd8e8f0 },
  {
    id: 'sturgeon',
    n: '瀑布鲟',
    p: 320,
    rar: 3,
    d: 0.8,
    z: ['skyfalls', 'fall'],
    tm: 'any',
    s: [60, 120],
    c: 0x6a7a8a,
  },
  {
    id: 'yabby',
    n: '小龙虾',
    p: 90,
    rar: 1,
    d: 0.4,
    z: ['pond', 'berry', 'tulip', 'dand'],
    tm: 'any',
    s: [8, 15],
    c: 0xd84a2a,
  },
  {
    id: 'bighead',
    n: '胖头鱼',
    p: 70,
    rar: 1,
    d: 0.4,
    z: ['open', 'hills', 'giant'],
    tm: 'any',
    s: [30, 70],
    c: 0x8a9a9a,
  },
  { id: 'puffer', n: '河豚', p: 110, rar: 2, d: 0.6, z: ['rainbow', 'open'], tm: 'any', s: [10, 25], c: 0xffe066 },
  { id: 'eel', n: '月光鳗', p: 240, rar: 3, d: 0.75, z: [], tm: 'night', s: [50, 90], c: 0xc8f4ff },
  {
    id: 'golden',
    n: '金色锦鲤王',
    p: 1000,
    rar: 4,
    d: 0.95,
    z: ['tree', 'shrine', 'mirror'],
    tm: 'night',
    s: [80, 120],
    c: 0xffd23f,
  },
  { id: 'boot', n: '旧靴子', p: 1, rar: 1, d: 0.1, z: [], tm: 'any', s: [25, 30], c: 0x7a5a48, junk: true },
];
const BUGS = [
  { id: 'b0', n: '柠檬黄蝶', p: 40, c: 0xffd23f },
  { id: 'b1', n: '橘红蛱蝶', p: 50, c: 0xff8a5b },
  { id: 'b2', n: '天蓝灰蝶', p: 60, c: 0x8fb8ff },
  { id: 'b3', n: '白粉蝶', p: 30, c: 0xffffff },
  { id: 'b4', n: '樱粉凤蝶', p: 80, c: 0xff9ec4 },
  { id: 'b5', n: '紫闪蝶', p: 120, c: 0xb58cff },
  { id: 'fly', n: '萤火虫', p: 90, c: 0xe6ff8a },
  { id: 'beetle', n: '金龟子', p: 150, c: 0x7cc85e },
];
const SEEDS = [
  { id: 'berry', n: '草莓种子', p: 20, T: 240, crop: 'berry', y: [2, 4], c: 0xe8304a },
  { id: 'carrot', n: '胡萝卜种子', p: 25, T: 300, crop: 'carrot', y: [2, 3], c: 0xff8a3a },
  { id: 'pumpkin', n: '南瓜种子', p: 35, T: 480, crop: 'pumpkin', y: [1, 2], c: 0xff9a3a },
  { id: 'mush', n: '蘑菇菌包', p: 30, T: 360, crop: 'mush', y: [2, 4], c: 0xe8d2a0 },
  { id: 'sunflower', n: '向日葵种子', p: 15, T: 180, crop: 'sunflower', y: [1, 1], c: 0xffd23f },
];
const SELLP = { peach: 15, mush: 15, berry: 20, honey: 30, tea: 20, pumpkin: 45, carrot: 25, sunflower: 35 };
RECIPES.push(
  { id: 'psoup', n: '南瓜浓汤', need: { pumpkin: 1, mush: 1 }, c: 0xffa040, love: 4 },
  { id: 'ccake', n: '胡萝卜蛋糕', need: { carrot: 2, honey: 1 }, c: 0xff8a3a, love: 4 },
  { id: 'fish', n: '香烤鱼', need: { fish: 1 }, c: 0xd9a86a, love: 3 },
  { id: 'fishchips', n: '炸鱼薯条', need: { fish: 1, carrot: 1 }, c: 0xffd070, love: 5 },
);
const fishCount = () =>
  Object.entries(save.fishBag).reduce((s, [k, v]) => s + (FISH.find((f) => f.id === k && !f.junk) ? v : 0), 0);
const haveIng = (k, v) => (k === 'fish' ? fishCount() >= v : (save.inv[k] || 0) >= v);
function useIng(k, v) {
  if (k !== 'fish') {
    save.inv[k] -= v;
    return;
  }
  for (let i = 0; i < v; i++) {
    const e = Object.entries(save.fishBag)
      .filter(([id, n]) => n > 0 && !FISH.find((f) => f.id === id).junk)
      .sort((a, b) => FISH.find((f) => f.id === a[0]).p - FISH.find((f) => f.id === b[0]).p)[0];
    if (e) save.fishBag[e[0]]--;
  }
}
INV_N.fish = '鱼';

/* ---------- achievements ---------- */
const ACH = [
  { id: 'fish1', n: '第一条鱼', d: '钓到第一条鱼', r: 50, t: () => save.stats.fish >= 1 },
  { id: 'fish25', n: '钓鱼达人', d: '一共钓到 25 条鱼', r: 300, t: () => save.stats.fish >= 25 },
  {
    id: 'fishall',
    n: '水里的朋友',
    d: '集齐所有鱼类（不含旧靴子）',
    r: 2000,
    t: () => FISH.filter((f) => !f.junk).every((f) => save.fishLog[f.id]),
  },
  { id: 'bug1', n: '第一只虫子', d: '抓到第一只虫子', r: 50, t: () => save.stats.bug >= 1 },
  { id: 'bugall', n: '昆虫博士', d: '集齐所有昆虫', r: 1200, t: () => BUGS.every((b) => save.bugLog[b.id]) },
  { id: 'seeds', n: '巨树开花', d: '找回全部 12 颗光之种子', r: 800, t: () => save.seeds.length >= 12 },
  { id: 'zones', n: '走遍花海', d: '发现所有地点', r: 800, t: () => W.zones.every((z) => z.found) },
  { id: 'shard20', n: '捡星星的人', d: '捡到 20 颗星星碎片', r: 300, t: () => save.shards.length >= 20 },
  { id: 'cook5', n: '小厨师', d: '做 5 道菜', r: 200, t: () => save.stats.cook >= 5 },
  { id: 'love50', n: '好朋友', d: '团子好感达到 50', r: 200, t: () => save.love >= 50 },
  { id: 'love200', n: '最好的朋友', d: '团子好感达到 200', r: 800, t: () => save.love >= 200 },
  { id: 'photo5', n: '相册', d: '和团子合影 5 次', r: 150, t: () => save.stats.photo >= 5 },
  { id: 'harvest3', n: '小农夫', d: '收获 3 次菜地', r: 200, t: () => save.stats.harvest >= 3 },
  { id: 'rich', n: '小富翁', d: '一共赚到 3000 花币', r: 500, t: () => save.stats.earned >= 3000 },
  { id: 'build1', n: '新房间', d: '第一次扩建小家', r: 300, t: () => Object.keys(save.ext).length >= 1 },
  { id: 'furn30', n: '布置达人', d: '家里放满 30 件家具', r: 300, t: () => HOME.items.length >= 30 },
  { id: 'xylo', n: '水晶之歌', d: '敲出星光浅滩的旋律', r: 300, t: () => !!save.xylo },
  { id: 'wish10', n: '许愿的人', d: '许 10 个愿望', r: 150, t: () => (save.wish || 0) + save.stats.wish >= 10 },
];
function ach(id) {
  if (save.ach.includes(id)) return;
  const a = ACH.find((q) => q.id === id);
  if (!a) return;
  save.ach.push(id);
  addCoins(a.r);
  persist();
  AU.sfx('harp');
  toast('成就达成', a.n, a.d + '　+' + a.r + ' 花币', 3200);
}
let achT = 0;
function checkAch(dt) {
  achT -= dt;
  if (achT > 0) return;
  achT = 2;
  ACH.forEach((a) => {
    if (!save.ach.includes(a.id) && a.t()) ach(a.id);
  });
}

/* ---------- daily tasks ---------- */
const TASKP = [
  { k: 'fish', n: '钓 {n} 条鱼', a: [2, 4], r: 120 },
  { k: 'bug', n: '抓 {n} 只虫子', a: [1, 3], r: 120 },
  { k: 'cook', n: '做 {n} 道菜', a: [1, 2], r: 120 },
  { k: 'pet', n: '和团子互动 {n} 次', a: [4, 8], r: 80 },
  { k: 'shard', n: '捡 {n} 颗星星碎片', a: [1, 2], r: 150 },
  { k: 'sell', n: '卖掉 {n} 样东西', a: [3, 6], r: 100 },
  { k: 'harvest', n: '收获 {n} 次菜地', a: [1, 1], r: 150 },
  { k: 'photo', n: '和团子合影 {n} 次', a: [1, 1], r: 80 },
  { k: 'ingred', n: '采集 {n} 份食材', a: [3, 5], r: 100 },
  { k: 'birds', n: '给小鸟放 {n} 次鸟食', a: [1, 1], r: 60 },
  { k: 'place', n: '布置 {n} 件家具', a: [2, 3], r: 80 },
  { k: 'visit', n: '去「{z}」看看', a: [1, 1], r: 120 },
];
function dayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function ensureTasks() {
  if (save.tasks && save.tasks.day === dayKey()) return;
  let sd = dayKey()
    .split('-')
    .reduce((s, x) => s * 31 + +x, 7);
  const rnd_ = () => {
    sd = (sd * 16807) % 2147483647;
    return sd / 2147483647;
  };
  const pool = TASKP.slice(),
    list = [];
  while (list.length < 3) {
    const t = pool.splice(Math.floor(rnd_() * pool.length), 1)[0];
    const n = t.a[0] + Math.floor(rnd_() * (t.a[1] - t.a[0] + 1));
    const o = { k: t.k, n, c: 0, r: t.r + n * 10, done: false };
    if (t.k === 'visit') {
      const outs = W.zones.filter((z) =>
        ['hills', 'sakura', 'shoals', 'maple', 'mirror', 'bamboo', 'rainbow', 'giant', 'skyfalls', 'berry'].includes(
          z.id,
        ),
      );
      const z = outs[Math.floor(rnd_() * outs.length)];
      o.k = 'visit:' + z.id;
      o.z = z.name;
    }
    list.push(o);
  }
  save.tasks = { day: dayKey(), list };
  persist();
}
function taskText(o) {
  const t = TASKP.find((q) => q.k === o.k.split(':')[0]);
  return tr(t.n, { n: o.n, z: tr(o.z || '') });
}
function task(k, n = 1) {
  ensureTasks();
  save.tasks.list.forEach((o) => {
    if (o.done || o.k !== k) return;
    o.c = Math.min(o.n, o.c + n);
    if (o.c >= o.n) {
      o.done = true;
      addCoins(o.r);
      AU.sfx('coin');
      toast('每日委托', '完成！', taskText(o) + '　+' + o.r + ' 花币', 3000);
    }
  });
  persist();
  if (!$('#taskBox').classList.contains('hidden')) renderTasks();
}
function renderTasks() {
  ensureTasks();
  const box = $('#taskList');
  box.innerHTML = '';
  save.tasks.list.forEach((o) => {
    const d = document.createElement('div');
    d.className = 'recipe' + (o.done ? ' off' : '');
    d.innerHTML = `<div><b>${taskText(o)}</b><small>${o.done ? '已完成' : o.c + ' / ' + o.n}</small></div><span class="coinTag">+${o.r}</span>`;
    box.appendChild(d);
  });
}
function openTasks() {
  if (!started) return;
  renderTasks();
  openModal('#taskBox');
  AU.sfx('paper');
}

/* ---------- fishing ---------- */
const FS = { on: false };
function curZoneId() {
  const b = boy.g.position;
  let best = 'open',
    bd = 1e9;
  W.zones.forEach((z) => {
    const d = Math.hypot(z.x - b.x, z.z - b.z);
    if (d < z.r + 14 && d < bd) {
      bd = d;
      best = z.id;
    }
  });
  return best;
}
function waterAhead() {
  const b = boy.g.position,
    r = boy.g.rotation.y;
  for (const d of [2.5, 3.5, 4.5]) {
    const x = b.x + Math.sin(r) * d,
      z = b.z + Math.cos(r) * d;
    if (raisedH(x, z) < 0.02 && !solidAt(x, z, 0.3, 'ground') && Math.hypot(x, z) < 299) return { x, z };
  }
  return null;
}
function canFish() {
  return (
    started &&
    !paused &&
    !HOME.on &&
    PL.level === 'ground' &&
    PL.state === 'free' &&
    !PL.carry &&
    !FS.on &&
    !!waterAhead()
  );
}
function rollFish() {
  const zid = curZoneId(),
    night = nightT > 0.5;
  let pool = FISH.filter((f) => (f.tm === 'any' || (f.tm === 'night') === night) && (!f.z.length || f.z.includes(zid)));
  const w = pool.map((f) => [1, 60, 25, 8, 2][f.rar] * (f.junk ? 0.25 : 1) * (FS.bait ? (f.rar >= 3 ? 3 : 1) : 1));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= w[i];
    if (r <= 0) return pool[i];
  }
  return pool[0];
}
let bobber = null;
function startFish() {
  if (!canFish()) {
    if (started && !HOME.on) say('要面朝水边才能钓鱼哦。', 2);
    return;
  }
  const wa = waterAhead();
  AU.init();
  if (!bobber) {
    bobber = new THREE.Group();
    bobber.add(
      P(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 8),
          new THREE.MeshToonMaterial({ color: 0xe84a5f, gradientMap: toonGrad }),
        ),
        0,
        0,
        0,
      ),
    );
    bobber.add(
      P(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 8, 0, TAU, 0, Math.PI / 2),
          new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad }),
        ),
        0,
        0.01,
        0,
      ),
    );
    kit.ink(bobber, 0.012);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]),
      new THREE.LineBasicMaterial({ color: 0xffffff }),
    );
    line.frustumCulled = false;
    bobber.userData.line = line;
  }
  world.add(bobber, bobber.userData.line);
  bobber.position.set(wa.x, 0.05, wa.z);
  addRipple(wa.x, wa.z, 0.8);
  AU.sfx('plop');
  FS.on = true;
  FS.ph = 'wait';
  FS.t = rnd(2, 6.5);
  FS.fish = rollFish();
  FS.bait = false;
  if ((save.seedBag.bait || 0) > 0) {
    save.seedBag.bait--;
    FS.bait = true;
    FS.fish = rollFish();
  }
  PL.state = 'fish';
  boy.speed = 0;
  $('#fishUI').classList.remove('hidden');
  $('#fishMsg').textContent = '等鱼上钩……';
  $('#fishBar').classList.add('hidden');
  task('fishcast');
}
function stopFish(msg) {
  FS.on = false;
  PL.state = 'free';
  if (bobber) {
    world.remove(bobber, bobber.userData.line);
  }
  $('#fishUI').classList.add('hidden');
  if (msg) say(msg, 2.4);
}
function fishPress(down) {
  if (!FS.on) return;
  if (FS.ph === 'wait') {
    if (down) stopFish('收竿了。');
    return;
  }
  if (FS.ph === 'bite' && down) {
    FS.ph = 'reel';
    FS.prog = 0.3;
    FS.pos = 0.5;
    FS.v = 0;
    FS.fy = 0.5;
    FS.ft = 0;
    FS.hold = true;
    $('#fishBar').classList.remove('hidden');
    $('#fishMsg').textContent = isTouch ? '按住按钮让绿框跟住鱼！' : '按住空格/F 让绿框跟住鱼！';
    return;
  }
  FS.hold = down;
}
function updFish(dt) {
  if (!FS.on) return;
  const b = boy.g.position;
  boy.arms[0].rotation.x = -1.9;
  boy.arms[1].rotation.x = -1.6;
  if (bobber) {
    const la = bobber.userData.line.geometry.attributes.position;
    boy.arms[0].userData.hand.updateMatrixWorld();
    tmp.setFromMatrixPosition(boy.arms[0].userData.hand.matrixWorld);
    la.setXYZ(0, tmp.x, tmp.y + 0.9, tmp.z);
    la.setXYZ(1, bobber.position.x, bobber.position.y, bobber.position.z);
    la.needsUpdate = true;
  }
  if (FS.ph === 'wait') {
    FS.t -= dt;
    bobber.position.y = 0.05 + Math.sin(t * 3) * 0.02;
    if (FS.t <= 0) {
      FS.ph = 'bite';
      FS.t = 1.1;
      AU.sfx('plop');
      AU.sfx('chimeTap', 9);
      addRipple(bobber.position.x, bobber.position.z, 1);
      $('#fishMsg').textContent = isTouch ? '上钩了！快点按钮！' : '上钩了！快按 F / 空格！';
    }
  } else if (FS.ph === 'bite') {
    FS.t -= dt;
    bobber.position.y = -0.08 + Math.sin(t * 30) * 0.03;
    if (FS.t <= 0) stopFish('鱼跑掉了……');
  } else if (FS.ph === 'reel') {
    const f = FS.fish,
      sp = 0.25 + f.d * 1.1;
    FS.ft -= dt;
    if (FS.ft <= 0) {
      FS.ft = rnd(0.3, 1.2) / (0.6 + f.d);
      FS.tgt = Math.random();
    }
    FS.fy += (FS.tgt - FS.fy) * Math.min(1, dt * sp * 3);
    FS.v += (FS.hold ? 2.6 : -2.2) * dt;
    FS.v = clamp(FS.v, -1.4, 1.4);
    FS.pos += FS.v * dt;
    if (FS.pos < 0) {
      FS.pos = 0;
      FS.v = 0;
    }
    if (FS.pos > 1) {
      FS.pos = 1;
      FS.v = 0;
    }
    const zone = 0.26 - f.d * 0.08,
      inZ = Math.abs(FS.fy - FS.pos) < zone / 2 + 0.03;
    FS.prog += (inZ ? 0.32 : -0.22 - f.d * 0.1) * dt;
    bobber.position.y = -0.05 + Math.sin(t * 18) * 0.04;
    if (Math.random() < dt * 4) addRipple(bobber.position.x + rnd(-0.3, 0.3), bobber.position.z + rnd(-0.3, 0.3), 0.5);
    const H = $('#fishBar').clientHeight || 180;
    $('#fbZone').style.height = zone * 100 + '%';
    $('#fbZone').style.bottom = (FS.pos - zone / 2) * 100 + '%';
    $('#fbFish').style.bottom = FS.fy * 100 - 4 + '%';
    $('#fbProg').style.height = clamp(FS.prog, 0, 1) * 100 + '%';
    $('#fbZone').classList.toggle('hit', inZ);
    if (FS.prog >= 1) catchFish();
    else if (FS.prog <= 0) stopFish('线松了，鱼跑掉了……');
  }
}
function catchFish() {
  const f = FS.fish,
    size = Math.round(rnd(f.s[0], f.s[1]));
  stopFish();
  save.fishBag[f.id] = (save.fishBag[f.id] || 0) + 1;
  const L = save.fishLog[f.id] || { n: 0, max: 0 };
  const isNew = !L.n;
  L.n++;
  L.max = Math.max(L.max, size);
  save.fishLog[f.id] = L;
  if (!f.junk) {
    save.stats.fish++;
    task('fish');
  }
  persist();
  AU.sfx(f.rar >= 3 ? 'harp' : 'coin');
  showCatch(
    f.junk ? '……钓到了' : '钓到了！',
    f.n,
    f.junk
      ? '谁把它扔到水里的？'
      : size + ' 厘米　·　' + ['', '常见', '少见', '稀有', '传说'][f.rar] + (isNew ? '　·　新发现！' : ''),
    f.c,
    'fish',
  );
  gainLove(0);
  if (!f.junk) hearts(3);
}
function showCatch(k, name, sub, color, kind) {
  $('#catchIco').innerHTML = icoSVG(kind, color);
  $('#catchK').textContent = k;
  $('#catchN').textContent = name;
  $('#catchS').textContent = sub;
  const e = $('#catchCard');
  e.classList.remove('hidden');
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.add('hidden'), 3200);
}
function icoSVG(kind, c, unknown) {
  const col = unknown ? '#c9c2b4' : '#' + new THREE.Color(c).getHexString();
  if (kind === 'fish')
    return `<svg viewBox="0 0 60 36"><path d="M6 18c8-12 26-14 38-4l10-8v24l-10-8C32 32 14 30 6 18z" fill="${col}" stroke="#2e3a59" stroke-width="2.5" stroke-linejoin="round"/>${unknown ? '' : '<circle cx="16" cy="16" r="2.6" fill="#2e3a59"/>'}</svg>`;
  return `<svg viewBox="0 0 60 40"><path d="M30 20C22 4 6 4 8 16c1 8 14 8 22 4C38 24 51 24 52 16 54 4 38 4 30 20z" fill="${col}" stroke="#2e3a59" stroke-width="2.5"/><path d="M30 20c-6 4-12 14-6 16 4 1 6-8 6-16 0 8 2 17 6 16 6-2 0-12-6-16z" fill="${col}" stroke="#2e3a59" stroke-width="2.5"/><path d="M30 12v18" stroke="#2e3a59" stroke-width="3" stroke-linecap="round"/></svg>`;
}

/* ---------- bug catching ---------- */
function nearBug() {
  if (PL.level !== 'ground' || HOME.on) return null;
  const b = boy.g.position;
  let best = null,
    bd = 2.4;
  W.dyn.bfs.forEach((o) => {
    if (o.caught) return;
    const d = Math.hypot(o.b.position.x - b.x, o.b.position.z - b.z);
    if (d < bd && Math.abs(o.b.position.y - b.y) < 3) {
      bd = d;
      best = o;
    }
  });
  return best;
}
function catchBug(o, id) {
  boy.wave = 0.7;
  AU.sfx('whoosh');
  const net = Math.random() < 0.75;
  setTimeout(() => {
    if (!net) {
      say(rpick(['差一点点！', '它飞走啦～', '再轻一点……']), 1.8);
      if (o) {
        o.cx += rnd(-3, 3);
        o.cz += rnd(-3, 3);
      }
      return;
    }
    const B = BUGS.find((q) => q.id === (id || 'b' + (o ? o.ci || 0 : 0)));
    if (o) {
      o.caught = true;
      o.b.visible = false;
      setTimeout(() => {
        o.caught = false;
        o.b.visible = true;
      }, 45000);
    }
    save.bugBag[B.id] = (save.bugBag[B.id] || 0) + 1;
    const isNew = !save.bugLog[B.id];
    save.bugLog[B.id] = (save.bugLog[B.id] || 0) + 1;
    save.stats.bug++;
    persist();
    task('bug');
    AU.sfx('coin');
    showCatch('抓到了！', B.n, isNew ? '新发现！' : tr('已经抓过 {n} 只', { n: save.bugLog[B.id] }), B.c, 'bug');
  }, 320);
}

/* ---------- garden (planters at home) ---------- */
function cropStage(d) {
  if (!d || !d.crop) return -1;
  const S = SEEDS.find((q) => q.id === d.crop);
  const p = (Date.now() - d.t0) / 1000 / S.T + (d.w || 0) * 0.25;
  return p >= 1 ? 3 : p > 0.6 ? 2 : p > 0.25 ? 1 : 0;
}
function gardenAct(it) {
  const d = it.d;
  const st = cropStage(d);
  if (st < 0) {
    const own = SEEDS.filter((s) => (save.seedBag[s.id] || 0) > 0);
    if (!own.length) {
      say('没有种子……去小卖部买一点吧！', 2.6);
      return;
    }
    pickList(
      '种点什么？',
      own.map((s) => ({
        t: s.n + ' ×' + save.seedBag[s.id],
        fn: () => {
          save.seedBag[s.id]--;
          it.d = { crop: s.id, t0: Date.now(), w: 0 };
          saveHome();
          AU.sfx('rustle');
          say('种下去啦！浇浇水会长得更快。', 2.4);
          cropMesh(it, true);
        },
      })),
    );
    return;
  }
  if (st === 3) {
    const S = SEEDS.find((q) => q.id === d.crop),
      n = S.y[0] + Math.floor(Math.random() * (S.y[1] - S.y[0] + 1));
    it.d = null;
    saveHome();
    giveItem(S.crop, n);
    save.stats.harvest++;
    task('harvest');
    AU.sfx('pluck');
    hearts(3);
    cropMesh(it, true);
    return;
  }
  if ((d.w || 0) < 3) {
    d.w = (d.w || 0) + 1;
    saveHome();
    AU.sfx('pour');
    for (let i = 0; i < 10; i++)
      spark(new V3(it.x + rnd(-0.5, 0.5), 0.9, it.z + rnd(-0.3, 0.3)), TEX.dot, 0x9fe0ff, {
        v: new V3(0, -1, 0),
        life: 0.6,
        size: 0.15,
      });
    say(['刚发芽，再等等。', '长出叶子了！', '快要熟了！'][st] + '（浇了水，长得更快）', 2.4);
    cropMesh(it, true);
  } else say(['刚发芽，再等等。', '长出叶子了！', '快要熟了！'][st] + '今天水浇够啦。', 2.4);
}
function cropMesh(it, force) {
  const g = it.g.getObjectByName('crop');
  if (!g) return;
  const st = cropStage(it.d);
  if (!force && g.userData.st === st) return;
  g.userData.st = st;
  while (g.children.length) {
    const c = g.children.pop();
    disposeTree(c);
  }
  if (st < 0) return;
  const S = SEEDS.find((q) => q.id === it.d.crop);
  for (let i = 0; i < 6; i++) {
    const x = -0.5 + (i % 3) * 0.5,
      z = -0.22 + Math.floor(i / 3) * 0.44,
      q = new THREE.Group();
    q.position.set(x, 0.38, z);
    if (st === 0) q.add(P(hk.mesh(new THREE.ConeGeometry(0.04, 0.15, 5), 0x7cc85e), 0, 0.07, 0));
    else {
      q.add(P(hk.mesh(hk.sphere(0.08 + st * 0.04), 0x6fbf5a), 0, 0.1 + st * 0.04, 0));
      if (st === 3) {
        const c = S.c;
        if (S.id === 'pumpkin' && i % 2 === 0) {
          const m = hk.mesh(hk.sphere(0.18), c);
          m.scale.y = 0.75;
          m.position.y = 0.14;
          q.add(m);
        } else if (S.id === 'carrot') {
          const m = hk.mesh(new THREE.ConeGeometry(0.06, 0.25, 8), c);
          m.rotation.x = Math.PI;
          m.position.y = 0.06;
          q.add(m);
        } else if (S.id === 'sunflower') {
          q.add(P(hk.mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 5), 0x6aa84f), 0, 0.4, 0));
          q.add(P(hk.mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 12), c), 0, 0.78, 0));
        } else if (S.id === 'mush') {
          q.add(P(hk.mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, TAU, 0, Math.PI / 2), c), 0, 0.12, 0));
        } else q.add(P(hk.mesh(hk.sphere(0.06), c), 0.06, 0.12, 0.05));
      }
    }
    hk.ink(q, 0.01);
    g.add(q);
  }
}

/* ---------- shop ---------- */
function openShop(tab) {
  FS.tab = tab || 'buy';
  renderShop();
  openModal('#shopBox');
  AU.sfx('ding');
}
function sellables() {
  const L = [];
  Object.entries(save.fishBag).forEach(([id, n]) => {
    const f = FISH.find((q) => q.id === id);
    if (n > 0 && f) L.push({ k: 'fish', id, n, name: f.n, p: f.p, c: f.c, ico: 'fish' });
  });
  Object.entries(save.bugBag).forEach(([id, n]) => {
    const b = BUGS.find((q) => q.id === id);
    if (n > 0 && b) L.push({ k: 'bug', id, n, name: b.n, p: b.p, c: b.c, ico: 'bug' });
  });
  Object.entries(save.inv).forEach(([id, n]) => {
    if (n > 0 && SELLP[id]) L.push({ k: 'inv', id, n, name: INV_N[id], p: SELLP[id] });
  });
  return L;
}
function sellOne(e, all) {
  const n = all ? e.n : 1;
  if (e.k === 'fish') save.fishBag[e.id] -= n;
  else if (e.k === 'bug') save.bugBag[e.id] -= n;
  else save.inv[e.id] -= n;
  addCoins(e.p * n);
  save.stats.sold += n;
  task('sell', n);
  AU.sfx('coin');
  renderShop();
}
function renderShop() {
  const box = $('#shopList');
  box.innerHTML = '';
  $('#shopCoins').textContent = save.coins;
  document.querySelectorAll('#shopTabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === FS.tab));
  if (FS.tab === 'buy') {
    [
      ...SEEDS.map((s) => ({ id: s.id, n: s.n, p: s.p, sub: '种在家里的小菜地', have: save.seedBag[s.id] || 0 })),
      { id: 'bait', n: '香香鱼饵', p: 12, sub: '下一次钓鱼更容易钓到稀有鱼', have: save.seedBag.bait || 0 },
    ].forEach((o) => {
      const d = document.createElement('div');
      d.className = 'recipe';
      d.innerHTML = `<div><b>${o.n}</b><small>${o.sub}　·　有 ${o.have}</small></div>`;
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = o.p + ' 花币';
      b.disabled = save.coins < o.p;
      b.onclick = () => {
        spendCoins(o.p);
        save.seedBag[o.id] = (save.seedBag[o.id] || 0) + 1;
        persist();
        AU.sfx('coin');
        renderShop();
      };
      d.appendChild(b);
      box.appendChild(d);
    });
    return;
  }
  const L = sellables();
  if (!L.length) {
    box.innerHTML = '<p class="sub">背包里没有可以卖的东西。去钓鱼、抓虫、采集吧！</p>';
    return;
  }
  const bulk = L.filter((e) => !(e.k === 'fish' && FISH.find((f) => f.id === e.id).rar >= 4));
  if (bulk.length) {
    const all = document.createElement('button');
    all.className = 'btn';
    all.style.marginBottom = '8px';
    const tot = bulk.reduce((s, e) => s + e.p * e.n, 0);
    all.textContent = tr('全部卖掉（{n} 花币）', { n: tot });
    all.onclick = () => {
      bulk.forEach((e) => sellOne(e, true));
    };
    box.appendChild(all);
    if (bulk.length < L.length) {
      const p = document.createElement('p');
      p.className = 'sub';
      p.textContent = '传说中的鱼不会被一起卖掉。';
      box.appendChild(p);
    }
  }
  L.forEach((e) => {
    const d = document.createElement('div');
    d.className = 'recipe';
    d.innerHTML = `<div style="display:flex;gap:8px;align-items:center">${e.ico ? '<span class="ico">' + icoSVG(e.ico, e.c) + '</span>' : ''}<div><b>${e.name} ×${e.n}</b><small>每个 ${e.p} 花币</small></div></div>`;
    const r = document.createElement('div');
    r.style.display = 'flex';
    r.style.gap = '6px';
    const b1 = document.createElement('button');
    b1.className = 'btn ghost';
    b1.textContent = '卖 1 个';
    b1.onclick = () => sellOne(e, false);
    const b2 = document.createElement('button');
    b2.className = 'btn';
    b2.textContent = '全卖';
    b2.onclick = () => sellOne(e, true);
    r.append(b1, b2);
    d.appendChild(r);
    box.appendChild(d);
  });
}
document.querySelectorAll('#shopTabs button').forEach(
  (b) =>
    (b.onclick = () => {
      FS.tab = b.dataset.t;
      renderShop();
    }),
);

/* ---------- journal ---------- */
let jTab = 'fish';
function openJournal() {
  if (!started) return;
  renderJournal();
  openModal('#journalBox');
  AU.sfx('paper');
}
function renderJournal() {
  document.querySelectorAll('#jTabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === jTab));
  const box = $('#jGrid');
  box.innerHTML = '';
  let got = 0,
    tot = 0;
  const cell = (ico, name, sub, known) => {
    const d = document.createElement('div');
    d.className = 'jCell' + (known ? '' : ' unk');
    d.innerHTML = `<div class="ico">${ico}</div><b>${known ? name : '？？？'}</b><small>${sub}</small>`;
    box.appendChild(d);
  };
  if (jTab === 'fish')
    FISH.forEach((f) => {
      const L = save.fishLog[f.id];
      tot++;
      if (L) got++;
      cell(
        icoSVG('fish', f.c, !L),
        f.n,
        L
          ? tr('最大 {s} 厘米 · 钓到 {n} 次', { s: L.max, n: L.n })
          : (f.tm === 'night' ? '夜里出没' : f.tm === 'day' ? '白天出没' : '') +
              (f.z.length && f.z[0] !== 'open'
                ? ' · ' +
                  f.z
                    .map((z) => (W.zones.find((q) => q.id === z) || { name: '' }).name)
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('、')
                : ''),
        !!L,
      );
    });
  else if (jTab === 'bug')
    BUGS.forEach((b) => {
      const n = save.bugLog[b.id];
      tot++;
      if (n) got++;
      cell(
        icoSVG('bug', b.c, !n),
        b.n,
        n ? tr('抓到 {n} 只', { n }) : b.id === 'fly' ? '夜晚的萤火林' : b.id === 'beetle' ? '摇一摇果树' : '花丛附近',
        !!n,
      );
    });
  else if (jTab === 'zone')
    W.zones.forEach((z) => {
      tot++;
      if (z.found) got++;
      cell(
        `<div style="width:40px;height:40px;border-radius:50%;margin:auto;background:${z.found ? z.color || '#9ccf6a' : '#c9c2b4'};border:2.5px solid #2e3a59"></div>`,
        z.name,
        z.found ? '已发现' : '',
        z.found,
      );
    });
  else
    ACH.forEach((a) => {
      const ok = save.ach.includes(a.id);
      tot++;
      if (ok) got++;
      cell(
        `<div style="font-size:30px;line-height:40px">${ok ? '★' : '☆'}</div>`,
        a.n,
        a.d + ' · ' + a.r + ' 花币',
        true,
      );
      if (!ok) box.lastChild.classList.add('dim');
    });
  $('#jCount').textContent = got + ' / ' + tot;
}
document.querySelectorAll('#jTabs button').forEach(
  (b) =>
    (b.onclick = () => {
      jTab = b.dataset.t;
      renderJournal();
    }),
);

/* ---------- pick list modal ---------- */
function pickList(title, opts) {
  $('#pickT').textContent = title;
  const box = $('#pickL');
  box.innerHTML = '';
  opts.forEach((o) => {
    const b = document.createElement('button');
    b.className = 'btn ghost';
    b.style.cssText = 'display:block;width:100%;margin-bottom:6px;text-align:left';
    b.textContent = o.t;
    b.onclick = () => {
      closeModal('#pickBox');
      o.fn();
    };
    box.appendChild(b);
  });
  openModal('#pickBox');
}
['#taskBox', '#journalBox', '#shopBox', '#pickBox', '#setBox', '#helpBox', '#credBox'].forEach((sel) => {
  const c = $(sel + ' [data-close]');
  if (c) c.onclick = () => closeModal(sel);
});
function fountainWish(it) {
  if (save.coins < 1) {
    say('一枚花币都没有了……', 2);
    return;
  }
  spendCoins(1);
  save.stats.wish++;
  AU.sfx('plop');
  AU.sfx('chimeTap', 12);
  const r = Math.random();
  if (r < 0.12) {
    addCoins(30);
    say('喷泉里冒出了 30 枚花币！今天运气真好！', 3);
  } else if (r < 0.3) {
    gainLove(2);
    hearts(5);
    say('团子许的愿好像实现了，它好开心！', 2.8);
  } else say(rpick(['叮——硬币沉到水底，闪了一下。', '希望明天能钓到大鱼。', '希望菜地快快长大。']), 2.6);
}

/* ---------- world: shop stall near the dock + extra catch spots ---------- */
function buildStall(k, root) {
  const x = 9,
    z = 36,
    g = P(new THREE.Group(), x, raisedH(x, z), z);
  g.add(P(k.mesh(new THREE.BoxGeometry(3, 1, 1.2), 0xc08a58), 0, 0.5, 0));
  g.add(P(k.mesh(new THREE.BoxGeometry(3.2, 0.1, 1.4), 0xfff4e6), 0, 1.05, 0));
  for (const s of [-1, 1])
    for (const q of [-1, 1])
      g.add(P(k.mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), 0x8a5a3c), s * 1.4, 1.3, q * 0.55));
  for (let i = 0; i < 6; i++) {
    const st = k.mesh(new THREE.BoxGeometry(3.4 / 6, 0.12, 1.7), i % 2 ? 0xffffff : 0xe84a5f);
    st.position.set(-1.43 + i * 0.57, 2.65, 0);
    st.rotation.x = -0.18;
    g.add(st);
  }
  for (let i = 0; i < 5; i++)
    g.add(P(k.mesh(k.sphere(0.13), [0xffd23f, 0xe8304a, 0xff9a3a, 0x7cc85e, 0xb58cff][i]), -1 + i * 0.5, 1.2, 0.2));
  g.add(P(k.mesh(new THREE.BoxGeometry(1.4, 0.5, 0.06), 0xfff4e6), 0, 2.1, 0.62));
  g.rotation.y = Math.PI;
  mergeGroup(g);
  root.add(k.ink(g, 0.012));
  col(x, z, 1.5);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.42), new THREE.MeshBasicMaterial({ transparent: true }));
  sign.position.set(x, raisedH(x, z) + 2.1, z - 0.66);
  sign.rotation.y = Math.PI;
  root.add(sign);
  W.dyn.stallSign = sign;
  drawStallSign();
  inter({ id: 'shop', x, z: z - 1.9, r: 2.2, label: '小卖部（买种子 · 卖东西）', act: () => openShop('buy') });
  inter({
    id: 'catchfly',
    x: GROVE_C.x - 3,
    z: GROVE_C.z + 4,
    r: 3,
    label: '用网子捉萤火虫',
    enabled: () => nightT > 0.5,
    act: () => catchBug(null, 'fly'),
  });
  W.mapShapes.push({ t: 'c', x, z, r: 1.6, c: 0xe84a5f });
}
function drawStallSign() {
  const s = W.dyn.stallSign;
  if (!s) return;
  const t = ctex(128, (g, S) => {
    g.clearRect(0, 0, S, S);
    g.fillStyle = '#fff4e6';
    g.fillRect(0, 32, S, 64);
    g.fillStyle = '#2e3a59';
    g.font = uiFont('bold', LANG === 'en' ? 28 : 26);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(tr('小卖部'), S / 2, S / 2);
  });
  t.userData = {};
  if (s.material.map) s.material.map.dispose();
  s.material.map = t;
  s.material.needsUpdate = true;
}

$('#btnJournal').onclick = openJournal;
$('#btnTasks').onclick = openTasks;
/* the fishing button has its own hold/release logic and is not one of the generic action buttons */
const fishBtn = $('#fishBtn');
let fishPD = 0;
fishBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  fishPD = performance.now();
  try {
    fishBtn.setPointerCapture(e.pointerId);
  } catch (_) {}
  fishBtn.classList.add('on');
  AU.init();
  if (FS.on) fishPress(true);
  else startFish();
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) =>
  fishBtn.addEventListener(ev, () => {
    fishBtn.classList.remove('on');
    fishPress(false);
  }),
);
fishBtn.addEventListener('click', (e) => {
  if (performance.now() - fishPD > 800) {
    /* keyboard activation only */ if (FS.on) {
      fishPress(true);
      setTimeout(() => fishPress(false), 120);
    } else startFish();
  }
});

/* ---------- per frame ---------- */
let sysT = 0;
function updSystems(dt) {
  updFish(dt);
  checkAch(dt);
  sysT -= dt;
  if (sysT <= 0) {
    sysT = 0.25;
    const cf = canFish() || FS.on;
    fishBtn.classList.toggle('hidden', !cf);
    fishBtn.querySelector('b').textContent = FS.on
      ? FS.ph === 'reel'
        ? '收线'
        : FS.ph === 'bite'
          ? '提竿！'
          : '收竿'
      : '钓鱼';
    if (!HOME.on) {
      const z = curZoneId();
      if (save.tasks) task('visit:' + z, 0 + (save.tasks.list.some((o) => o.k === 'visit:' + z && !o.done) ? 1 : 0));
    }
  }
  if (HOME.on) {
    HOME.items.forEach((it) => {
      if (it.type === 'planter') cropMesh(it, false);
      if (it.type === 'globe' && it.spin > 0) {
        it.spin -= dt;
        const b = it.g.getObjectByName('ball');
        if (b) b.rotation.y += dt * it.spin * 4;
      }
      if (it.type === 'aquarium') {
        const fs = it.g.getObjectByName('afish');
        if (fs) {
          const ids = Object.keys(save.fishLog)
            .filter((id) => !FISH.find((f) => f.id === id).junk)
            .slice(0, 6);
          if (fs.children.length !== ids.length) {
            while (fs.children.length) fs.remove(fs.children[0]);
            ids.forEach((id) => {
              const f = FISH.find((q) => q.id === id),
                m = hk.mesh(hk.sphere(0.09), f.c);
              m.scale.set(0.7, 1, 1.7);
              fs.add(m);
            });
          }
          fs.children.forEach((m, i) => {
            const a = t * (0.4 + i * 0.13) + i * 1.7;
            m.position.set(
              Math.sin(a) * 0.75,
              1 + ((i * 0.37) % 1) * 0.5 + Math.sin(t + i) * 0.05,
              Math.cos(a * 0.8) * 0.18,
            );
            m.rotation.y = a + Math.PI / 2;
          });
        }
      }
    });
  }
}
window.onLangChange = () => {
  drawStallSign();
  if (!$('#mapBox').classList.contains('hidden')) drawBigMap();
};
