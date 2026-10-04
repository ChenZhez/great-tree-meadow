/* =================== loop =================== */
addEventListener('resize', resize);
resize();
if (save.done) save.doneShown = true;
applyEnv(0);
updSeedHUD();
updShardHUD();
updCoinHUD();
ensureTasks();
applyUIToggles();
applyQuality();
applyLang();
langLabel();
renderer.info.autoReset = false;
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  renderer.info.reset();
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;
  waterU.time.value = t;
  WIND.value = t;
  FALLU.time.value = t;
  ripples.forEach((r) => {
    if (r.w > 0) {
      r.z += dt;
      if (r.z > 4) r.w = 0;
    }
  });
  if (Math.abs(nightT - nightTarget) > 0.001) {
    nightT += clamp(nightTarget - nightT, -dt * 0.4, dt * 0.4);
    applyEnv(nightT);
  }
  if (!paused) {
    updBoy(dt);
    updSystems(dt);
    updPig(dt);
    updBall(dt);
    if (HOME.on) {
      updHome(dt);
      updSparks(dt);
    } else {
      updWorld(dt);
      updFinale(dt);
      updOuter(dt);
    }
  } else if (HOME.on) updHome(0);
  updCamera(dt);
  updHUD(dt);
  renderTree();
  updFps(dt);
  if (wantPhoto > 0) {
    wantPhoto -= dt;
    if (wantPhoto <= 0) {
      wantPhoto = 0;
      snapPhoto();
    }
  }
}
frame();
if (save.outfit) dress(save.outfit, true);
setTimeout(() => veil.classList.remove('on'), 400);
if (save.seeds.length || save.coins || save.home) {
  $('#btnGo').textContent = '继续游戏';
}
document.querySelectorAll('#verTxt,.verTxt').forEach((e) => (e.textContent = 'v' + VERSION));
if (!storageOK) storageWarn();
$('#btnStorageOk').onclick = () => $('#storageWarn').classList.add('hidden');
/* pause audio in the background, save when the page is hidden or closed */
document.addEventListener('visibilitychange', () => {
  if (AU.ctx) {
    if (document.hidden) AU.ctx.suspend();
    else if (!AU.muted) AU.ctx.resume();
  }
  if (document.hidden && started) persist();
});
addEventListener('pagehide', () => {
  if (started) persist();
});
// #if DEV
window.__game = {
  startGame,
  showTitle,
  openHelp,
  openCredits,
  camera,
  scene,
  world,
  gY,
  AUTO,
  solidAt,
  FS,
  FISH,
  startFish,
  fishPress,
  catchFish,
  catchBug,
  openShop,
  openJournal,
  openTasks,
  openSettings,
  gardenAct,
  applyLang,
  applyQuality,
  buildShell,
  SET,
  FURN,
  addItem,
  task,
  get info() {
    return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
  },
  W,
  PL,
  HOME,
  get boy() {
    return boy;
  },
  get pig() {
    return pig;
  },
  AI,
  get seeds() {
    return seedsFound;
  },
  tp: (x, z, l) => {
    PL.level = l || 'ground';
    boy.g.position.set(x, gY(x, z, PL.level), z);
    pig.g.position.set(x + 1, gY(x + 1, z, PL.level), z);
    cam.target.set(x, 1, z);
  },
  start: () => $('#btnGo').click(),
  cheat: () =>
    W.seeds.forEach((s) => {
      if (!s.found) {
        s.hidden = false;
        collectSeed(s);
      }
    }),
  openWardrobe,
  rideBalloon,
  goHome,
  leaveHome,
  startBuild,
  endBuild,
  startGhost,
  placeGhost,
  moveGhost,
  pigAct,
  openPigMenu,
  openMap,
  get nightT() {
    return nightT;
  },
  setNight: (v) => {
    nightT = nightTarget = v;
    applyEnv(v);
  },
  use: () => doUse(),
  shadowSize: () => sun.shadow.mapSize.x,
  canFish,
  I18N_MISS,
  tr,
  get LANG() {
    return LANG;
  },
  topModal,
  get paused() {
    return paused;
  },
  get started() {
    return started;
  },
  sellables,
  renderShop,
  doJump,
  stopFish,
  dress,
  disposeGeometry,
  applyEnv,
  get bloom() {
    return bloom;
  },
  renderer,
  seedsF: () => W.seeds.map((s) => s.id + ':' + (s.found ? 'F' : s.hidden ? 'H' : 'V')).join(' '),
  toggleNight,
  cam,
  save,
};
// #endif
