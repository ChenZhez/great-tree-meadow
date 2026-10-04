/* =================== 团子: companion interactions =================== */
save.love = save.love || 0;
save.photos = save.photos || [];
const pigMenuEl = $('#pigMenu');
let pigMenuOpen = false;
function gainLove(n) {
  save.love += n;
  persist();
  if (n > 0) task('pet');
  $('#loveTxt').textContent = '♥ ' + save.love;
}
function hearts(n = 5) {
  const p = pig.g.position;
  for (let i = 0; i < n; i++)
    spark(p.clone().add(new V3(rnd(-0.3, 0.3), 1.1, rnd(-0.3, 0.3))), TEX.heart, 0xff7f9e, {
      v: new V3(rnd(-0.4, 0.4), rnd(0.8, 1.4), rnd(-0.4, 0.4)),
      life: 1.5,
      size: rnd(0.22, 0.36),
    });
}
function openPigMenu() {
  if (PL.state !== 'free' && !PL.carry) return;
  pigMenuOpen = true;
  pigMenuEl.classList.remove('hidden');
  $('#loveTxt').textContent = '♥ ' + save.love;
  $('#carryTxt').textContent = PL.carry ? '放下来' : '抱起来';
  AU.snort();
}
function closePigMenu() {
  pigMenuOpen = false;
  pigMenuEl.classList.add('hidden');
}
pigMenuEl.querySelectorAll('button').forEach((b) =>
  b.addEventListener('click', () => {
    pigAct(b.dataset.p);
  }),
);
function pigAct(a) {
  closePigMenu();
  AU.init();
  if (a === 'close') return;
  if (PL.carry && a !== 'carry' && a !== 'photo') {
    say('先把我放下来嘛～', 2);
    return;
  }
  if (a === 'pet') {
    pet();
    gainLove(1);
  } else if (a === 'feed') {
    const c = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14),
      new THREE.MeshToonMaterial({ color: 0xe8b060, gradientMap: toonGrad }),
    );
    charRoot().add(c);
    boy.wave = 0.8;
    AI.state = 'feed';
    AI.timer = 0;
    AI.cookie = c;
    AU.sfx('pop');
  } else if (a === 'ball') throwBall();
  else if (a === 'carry') {
    PL.carry = !PL.carry;
    AI.state = 'follow';
    if (PL.carry) {
      AU.sfx('boing');
      say('抱抱！嘿嘿，好高～', 2.4);
      gainLove(1);
    } else {
      const b = boy.g.position,
        r = boy.g.rotation.y;
      pig.g.position.set(b.x + Math.sin(r) * 0.9, b.y, b.z + Math.cos(r) * 0.9);
      pig.y = 0;
      pig.vy = 2;
      AU.sfx('plop');
      say('落地！', 1.4);
    }
  } else if (a === 'dance') {
    AI.state = 'dance';
    AI.timer = 0;
    PL.dance = 6.5;
    AU.sfx('dance');
    say('转圈圈～跳起来～', 2.6);
    gainLove(2);
  } else if (a === 'trick') {
    AI.state = 'trick';
    AI.timer = 0;
    say('握手！', 1.6);
    boy.wave = 1.2;
    setTimeout(() => {
      hearts(4);
      AU.sfx('chimeTap', 7);
      gainLove(1);
    }, 900);
  } else if (a === 'photo') takePhoto();
}
/* ball */
let ball = null;
function ensureBall() {
  if (ball) return ball;
  const g = new THREE.Group();
  g.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12),
      new THREE.MeshToonMaterial({ color: 0xe84a5f, gradientMap: toonGrad }),
    ),
  );
  const st = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.03, 6, 20),
    new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad }),
  );
  g.add(st);
  ckit.ink(g, 0.012);
  ball = { g, v: new V3(), state: 'idle', t: 0 };
  return ball;
}
function throwBall() {
  const B = ensureBall();
  if (B.g.parent !== charRoot()) {
    if (B.g.parent) B.g.parent.remove(B.g);
    charRoot().add(B.g);
  }
  const r = boy.g.rotation.y,
    b = boy.g.position,
    sp = PL.level === 'home' ? 4 : 7.5;
  B.g.position.set(b.x + Math.sin(r) * 0.4, b.y + 1.3, b.z + Math.cos(r) * 0.4);
  B.v.set(Math.sin(r) * sp, PL.level === 'home' ? 3.5 : 5.5, Math.cos(r) * sp);
  B.state = 'fly';
  boy.wave = 0.6;
  AU.sfx('whoosh');
  AI.state = 'fetch';
  AI.timer = 0;
  AI.hasBall = false;
  say('我去捡！', 1.4);
}
function updBall(dt) {
  if (!ball || !ball.g.parent) return;
  const B = ball;
  if (B.state === 'fly') {
    B.v.y -= 14 * dt;
    B.g.position.addScaledVector(B.v, dt);
    const p = B.g.position;
    resolve(p, 0.16, PL.level);
    const gy = gY(p.x, p.z, PL.level) + 0.16;
    B.g.rotation.x += dt * 8;
    if (p.y < gy) {
      p.y = gy;
      const water = PL.level === 'ground' && gy < 0.2;
      if (water) {
        addRipple(p.x, p.z, 0.9);
        AU.sfx('plop');
        B.state = 'float';
      } else if (Math.abs(B.v.y) > 1.5) {
        B.v.y *= -0.5;
        B.v.x *= 0.7;
        B.v.z *= 0.7;
        AU.sfx('thud');
      } else B.state = 'rest';
    }
  } else if (B.state === 'float') {
    B.g.position.y = 0.12 + Math.sin(t * 3) * 0.03;
  } else if (B.state === 'carried') {
    pig.head.updateMatrixWorld();
    B.g.position.set(0, -0.12, 0.42).applyMatrix4(pig.head.matrixWorld);
    if (PL.level !== 'home') {
    }
  }
}
/* photo */
let wantPhoto = 0;
function takePhoto() {
  closePigMenu();
  document.body.classList.add('clean');
  boy.g.rotation.y = Math.atan2(camera.position.x - boy.g.position.x, camera.position.z - boy.g.position.z);
  pig.g.rotation.y = boy.g.rotation.y;
  pig.vy = 4;
  boy.wave = 1.5;
  wantPhoto = 0.7;
}
function snapPhoto() {
  const src = renderer.domElement,
    w = 480,
    h = Math.round((w * src.height) / src.width),
    c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0, w, h);
  g.strokeStyle = '#fff6e2';
  g.lineWidth = 14;
  g.strokeRect(0, 0, w, h);
  const url = c.toDataURL('image/jpeg', 0.72);
  const place_ = PL.level === 'home' ? '小家' : (W.zones.find((z) => z.cur) || {}).name || '花海',
    cap = tr('小夏和团子 · {p}', { p: tr(place_) });
  save.photos.unshift({ url: w > 0 ? url : '', cap });
  save.photos = save.photos.slice(0, 4);
  save.stats.photo++;
  task('photo');
  try {
    localStorage.setItem(SAVE, JSON.stringify(save));
  } catch (e) {
    save.photos = save.photos.slice(0, 2);
    persist();
  }
  if (!(SET.calm || SET.nausea)) {
    $('#flash').style.transition = 'none';
    $('#flash').style.opacity = 1;
  }
  requestAnimationFrame(() => {
    $('#flash').style.transition = 'opacity .6s';
    $('#flash').style.opacity = 0;
  });
  AU.sfx('shutter');
  document.body.classList.remove('clean');
  $('#photoImg').src = url;
  $('#photoCap').textContent = cap;
  openModal('#photoBox');
  gainLove(1);
  if (window.refreshPhotoWall) refreshPhotoWall();
}
$('#btnPhotoClose').onclick = () => closeModal('#photoBox');
/* Save the photo: the share sheet where files can be shared (mobile), otherwise a normal download.
   On browsers that block both (some in-app/embedded views) the photo can still be long-pressed. */
$('#btnPhotoSave').onclick = async () => {
  const src = $('#photoImg').src,
    name = tr('小夏和团子') + '.jpg';
  let blob = null;
  try {
    blob = await (await fetch(src)).blob();
  } catch (e) {}
  if (blob && isTouch && navigator.canShare) {
    try {
      const f = new File([blob], name, { type: 'image/jpeg' });
      if (navigator.canShare({ files: [f] })) {
        await navigator.share({ files: [f] });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  try {
    const a = document.createElement('a');
    const url = blob ? URL.createObjectURL(blob) : src;
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (blob) setTimeout(() => URL.revokeObjectURL(url), 4000);
    note('照片已保存');
  } catch (e) {
    note('长按照片就可以保存');
  }
};
/* go somewhere then do something */
function pigGoDo(x, z, fn) {
  PL.carry = false;
  AI.state = 'goto';
  AI.target = { x, z };
  AI.timer = 0;
  AI.onArrive = fn;
}
/* pig state machine additions; returns [tx,tz,sp] or null */
function pigExtra(dt, p, b, dist) {
  const S = AI.state;
  if (S === 'goto') {
    const T = AI.target,
      d = Math.hypot(T.x - p.x, T.z - p.z);
    AI.timer += dt;
    if (d > 1.1 && AI.timer < 12) return [T.x, T.z, Math.min(6.5, 1.5 + d * 1.5)];
    AI.state = 'follow';
    const f = AI.onArrive;
    AI.onArrive = null;
    if (f) f();
    return [p.x, p.z, 0];
  }
  if (S === 'fetch') {
    const B = ball;
    AI.timer += dt;
    if (!B || AI.timer > 16) {
      AI.state = 'follow';
      return null;
    }
    if (!AI.hasBall) {
      if (B.state === 'fly') return [B.g.position.x, B.g.position.z, 5.5];
      const d = Math.hypot(B.g.position.x - p.x, B.g.position.z - p.z);
      if (d > 0.6) return [B.g.position.x, B.g.position.z, Math.min(6.5, 2 + d * 2)];
      AI.hasBall = true;
      B.state = 'carried';
      AU.snort();
      pig.vy = 2.5;
      return [p.x, p.z, 0];
    }
    if (dist > 1.3) return [b.x, b.z, Math.min(6.5, 2 + dist * 2)];
    B.state = 'rest';
    B.g.position.set(p.x + (b.x - p.x) * 0.5, gY(p.x, p.z, PL.level) + 0.16, p.z + (b.z - p.z) * 0.5);
    AI.state = 'happy';
    AI.timer = 1.4;
    hearts(4);
    gainLove(1);
    say(rpick(['捡回来啦！再扔一次！', '汪！……啊不对，哼哼！', '我跑得快吧？']), 2.2);
    return [p.x, p.z, 0];
  }
  if (S === 'feed') {
    AI.timer += dt;
    const c = AI.cookie;
    if (c) {
      boy.arms[0].userData.hand.updateMatrixWorld();
      c.position.setFromMatrixPosition(boy.arms[0].userData.hand.matrixWorld);
    }
    if (dist > 1.1) return [b.x, b.z, 3];
    if (AI.timer > 1) {
      if (c) {
        c.parent.remove(c);
        AI.cookie = null;
      }
      AU.sfx('munch');
      hearts(5);
      gainLove(1);
      AI.state = 'happy';
      AI.timer = 1.2;
      say(rpick(['饼干！咔嚓咔嚓～', '还有吗还有吗？', '好好吃！']), 2.2);
    }
    return [p.x, p.z, 0];
  }
  if (S === 'dance') {
    AI.timer += dt;
    const a = AI.timer * 2.2;
    if (pig.y <= 0) pig.vy = 3.2;
    if (AI.timer > 6.5) {
      AI.state = 'follow';
      hearts(6);
    }
    return [b.x + Math.cos(a) * 1.4, b.z + Math.sin(a) * 1.4, 3.2];
  }
  if (S === 'trick') {
    AI.timer += dt;
    if (AI.timer > 2.6) AI.state = 'follow';
    pig.g.rotation.y = lerpAngle(pig.g.rotation.y, Math.atan2(b.x - p.x, b.z - p.z), 0.2);
    return [p.x, p.z, 0];
  }
  if (S === 'nap') {
    if (boy.speed > 0.5 && (AI.napAny !== true || Math.hypot(b.x - p.x, b.z - p.z) > 7)) {
      AI.state = 'follow';
      AI.napAny = false;
      AI.napY = 0;
      pig.vy = 3;
      say('唔……我醒啦！', 1.6);
      return null;
    }
    AI.timer += dt;
    if (Math.random() < dt * 0.8)
      spark(p.clone().add(new V3(rnd(-0.1, 0.2), 0.85 + (AI.napY || 0), rnd(-0.1, 0.1))), ZTEX, 0xffffff, {
        normal: true,
        v: new V3(0.25, 0.45, 0),
        life: 2.2,
        size: rnd(0.22, 0.34),
      });
    if (AI.napUntil && AI.timer > AI.napUntil) {
      AI.state = 'follow';
      AI.napAny = false;
      AI.napY = 0;
    }
    return [p.x, p.z, 0];
  }
  if (S === 'slide') {
    const it = AI.slide,
      a = (-it.r * Math.PI) / 2,
      ux = Math.cos(a),
      uz = -Math.sin(a),
      T = (AI.timer += dt);
    let u, y;
    if (T < 0.8) {
      u = -0.9;
      y = (T / 0.8) * 1.25;
    } else if (T < 1.6) {
      const q = (T - 0.8) / 0.8;
      u = -0.9 + q * 1.9;
      y = 1.25 * (1 - q) * (1 - q * 0.15);
    } else {
      AI.state = 'happy';
      AI.timer = 1.2;
      AI.slideY = 0;
      hearts(4);
      say('呜呼——再来一次！', 1.8);
      return [p.x, p.z, 0];
    }
    p.x = it.x + ux * u;
    p.z = it.z + uz * u;
    AI.slideY = y;
    pig.g.rotation.y = Math.atan2(ux, uz);
    return [p.x, p.z, 0];
  }
  if (S === 'roll') {
    AI.timer += dt;
    if (AI.timer > 1.6) {
      AI.state = 'follow';
      hearts(3);
    }
    return [p.x, p.z, 0];
  }
  if (S === 'splash') {
    AI.timer += dt;
    if (pig.y <= 0 && AI.timer < 2.4) {
      pig.vy = 4;
      addRipple(p.x, p.z, 1);
      AU.sfx('plop');
      for (let i = 0; i < 8; i++)
        spark(p.clone().setY(0.2), TEX.dot, 0xe8f7ff, {
          v: new V3(rnd(-1.5, 1.5), rnd(1, 2.5), rnd(-1.5, 1.5)),
          g: -6,
          life: 0.7,
          size: rnd(0.1, 0.2),
        });
    }
    if (AI.timer > 2.6) AI.state = 'follow';
    return [p.x, p.z, 0];
  }
  if (S === 'chase') {
    AI.timer += dt;
    const o = AI.bf;
    if (!o || AI.timer > 5) {
      AI.state = 'follow';
      return null;
    }
    if (pig.y <= 0 && Math.random() < dt * 2) pig.vy = 3.5;
    return [o.b.position.x, o.b.position.z, 4];
  }
  return null;
}
/* idle life: what 团子 does when you stand still */
let idleT = 0;
function pigIdle(dt, p, b) {
  if (AI.state !== 'follow' || (PL.state !== 'free' && PL.state !== 'bench') || PL.carry) {
    idleT = 0;
    return;
  }
  if (boy.speed > 0.3) {
    idleT = 0;
    return;
  }
  idleT += dt;
  if (idleT > 45 && AI.state === 'follow') {
    AI.state = 'nap';
    AI.timer = 0;
    AI.napUntil = 0;
    say('呼……呼……', 2.4);
    idleT = -999;
    return;
  }
  if (idleT > 9 && Math.random() < dt * 0.18) {
    idleT = 0;
    const onLand = gY(p.x, p.z, PL.level) > 0.08 || PL.level !== 'ground';
    const r = Math.random();
    const bf = PL.level === 'ground' && W.dyn.bfs.find((o) => o.b.position.distanceTo(p) < 7);
    if (bf && r < 0.35) {
      AI.state = 'chase';
      AI.bf = bf;
      AI.timer = 0;
      say('蝴蝶！等等我！', 1.8);
    } else if (!onLand && r < 0.7) {
      AI.state = 'splash';
      AI.timer = 0;
      say('踩水花！', 1.4);
    } else if (onLand && r < 0.7) {
      AI.state = 'roll';
      AI.timer = 0;
      AU.sfx('rustle');
      say('打个滚～', 1.4);
    } else {
      pig.vy = 3;
      AU.snort();
    }
  }
}
/* pose overrides after animPig */
function pigPose(dt) {
  const S = AI.state;
  if (S === 'trick') {
    pig.body.rotation.x = -0.45;
    pig.body.position.y = -0.08;
    pig.legs[0].rotation.x = -1.6 + Math.sin(t * 10) * 0.2;
    pig.legs[2].rotation.x = pig.legs[3].rotation.x = 1.2;
  } else if (S === 'nap') {
    AI.lay = Math.min(1, (AI.lay || 0) + dt * 1.5);
    layPig(1.42 * AI.lay, 0.4);
    pig.legs.forEach((l) => (l.rotation.x = 0.35));
    pig.head.rotation.x = 0.15;
    pig.tail.rotation.z = 0;
  } else if (S === 'roll') {
    layPig(Math.min(1, AI.timer * 3) * AI.timer * TAU * 0.9, 0.42);
    pig.legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 14 + i) * 0.6));
  } else {
    AI.lay = 0;
    pig.body.rotation.x *= 0.8;
    pig.body.rotation.z *= 0.8;
    if (Math.abs(pig.body.rotation.z) < 0.01) pig.body.position.x *= 0.7;
  }
  if (PL.carry) {
    pig.legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 3 + i) * 0.3));
    pig.body.rotation.x = -0.2;
  }
}
/* rotate the pig around its belly (0,.5,0) instead of its feet so it never sinks into the ground */
function layPig(a, r) {
  pig.body.rotation.z = a;
  pig.body.position.x = 0.5 * Math.sin(a);
  pig.body.position.y =
    Math.max(0, r - 0.5 * Math.cos(a)) * Math.min(1, Math.abs(Math.sin(a)) * 3 + (Math.cos(a) < 0 ? 1 : 0));
}
const ZTEX = (() => {
  const t = ctex(64, (g, s) => {
    g.font = 'bold 46px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 7;
    g.strokeStyle = '#2e3a59';
    g.strokeText('Z', s / 2, s / 2 + 2);
    g.fillStyle = '#fff8e0';
    g.fillText('Z', s / 2, s / 2 + 2);
  });
  t.userData = {};
  return t;
})();
function carryPig() {
  const b = boy.g.position,
    r = boy.g.rotation.y;
  pig.g.position.set(b.x + Math.sin(r) * 0.42, b.y + 0.55 + boy.body.position.y, b.z + Math.cos(r) * 0.42);
  pig.g.rotation.y = r + Math.PI / 2;
  pig.speed = 0;
  animPig(pig, t, 0);
  pigPose(0);
  boy.arms.forEach((a) => {
    a.rotation.x = -1.2;
  });
}
