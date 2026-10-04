/* =================== settings · title screen · intro · help · credits ===================
   All settings live in SET (i18n.js, saved separately from the game save).
   Controls in #setBox are bound generically: <input data-k="key"> / <div class="seg" data-k="key"><button data-v>. */
/* Quality profiles. Touch devices get a lighter profile at the same setting (smaller shadow map,
   lower pixel ratio, reflection refreshed every other frame). "auto" starts at mid and steps down to
   low once if the frame rate stays poor. */
let QB = true,
  autoLow = false;
function effQuality() {
  return SET.quality === 'auto' ? (autoLow ? 'low' : 'mid') : SET.quality;
}
function applyQuality() {
  const q = effQuality(),
    dpr = window.devicePixelRatio || 1,
    m = isTouch;
  PR = q === 'low' ? 1 : q === 'high' ? Math.min(dpr, 2) : Math.min(dpr, m ? 1.25 : 1.5);
  QB = q !== 'low';
  renderer.setPixelRatio(PR);
  REFLQ = q === 'low' ? 0.3 : q === 'high' ? 0.6 : m ? 0.4 : 0.5;
  REFL_EVERY = q === 'low' ? 2 : q === 'mid' && m ? 2 : 1;
  const sz = q === 'low' ? (m ? 512 : 1024) : q === 'high' ? 2048 : m ? 1024 : 2048;
  if (sun.shadow.mapSize.x !== sz) {
    sun.shadow.mapSize.set(sz, sz);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
  }
  FLORA_ON = q !== 'low';
  setFloraLayer();
  resize();
}
let perfT = 0,
  perfN = 0,
  perfSlow = 0;
function watchPerf(dt) {
  if (SET.quality !== 'auto' || autoLow || !started || paused || document.hidden) return;
  perfT += dt;
  perfN++;
  if (perfT < 2) return;
  const fps = perfN / perfT;
  perfT = 0;
  perfN = 0;
  perfSlow = fps < 26 ? perfSlow + 1 : 0;
  if (perfSlow >= 3) {
    autoLow = true;
    applyQuality();
    note('画面已自动切换为「流畅」');
  }
}
function applyAudio() {
  if (!AU.ctx) return;
  AU.music.gain.value = 0.26 * SET.music;
  AU.bus.gain.value = 0.55 * SET.sfx;
}
function applyUIToggles() {
  const B = document.body;
  B.classList.toggle('noMini', !SET.mini);
  B.classList.toggle('noKeys', !SET.keys);
  B.classList.toggle('lefty', SET.hand === 'l');
  B.classList.remove('ts-s', 'ts-l');
  if (SET.ts !== 'm') B.classList.add('ts-' + SET.ts);
  $('#fps').classList.toggle('hidden', !SET.fps);
  renderer.domElement.style.filter = SET.bright === 1 ? '' : 'brightness(' + SET.bright + ')';
}
const CAMD = { near: 8, mid: 11, far: 15 };
function applySetting(k) {
  if (k === 'lang') applyLang(SET.lang);
  else if (k === 'quality') applyQuality();
  else if (k === 'music' || k === 'sfx') {
    applyAudio();
    if (k === 'sfx') {
      AU.init();
      AU.sfx('ding');
    }
  } else if (k === 'fov' || k === 'nausea') {
    resize();
    applyEnv(nightT);
  } else if (k === 'bloom' || k === 'calm') applyEnv(nightT);
  else if (k === 'camD') {
    cam.tDist = CAMD[SET.camD];
  }
  applyUIToggles();
}
function syncSettingsUI() {
  document.querySelectorAll('#setBox [data-k]').forEach((el) => {
    const k = el.dataset.k,
      v = SET[k];
    if (el.classList.contains('seg'))
      el.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
    else if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v;
  });
}
document.querySelectorAll('#setBox [data-k]').forEach((el) => {
  const k = el.dataset.k;
  if (el.classList.contains('seg'))
    el.querySelectorAll('button').forEach(
      (b) =>
        (b.onclick = () => {
          SET[k] = b.dataset.v;
          saveSettings();
          applySetting(k);
          syncSettingsUI();
          AU.init();
          AU.sfx('pop');
        }),
    );
  else
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
      SET[k] = el.type === 'checkbox' ? el.checked : +el.value;
      saveSettings();
      applySetting(k);
      if (k === 'nausea') syncSettingsUI();
    });
});
function tabs(boxSel, tabSel, paneSel) {
  document.querySelectorAll(tabSel + ' button').forEach(
    (b) =>
      (b.onclick = () => {
        document.querySelectorAll(tabSel + ' button').forEach((x) => x.classList.toggle('on', x === b));
        document
          .querySelectorAll(boxSel + ' ' + paneSel)
          .forEach((p) => p.classList.toggle('hidden', p.dataset.p !== b.dataset.t));
      }),
  );
}
tabs('#setBox', '#setTabs', '.sPane');
tabs('#helpBox', '#helpTabs', '.hPane');
function openSettings() {
  syncSettingsUI();
  $('#btnToTitle').style.display = started ? '' : 'none';
  $('#btnResume').textContent = started ? '继续游戏' : '返回';
  openModal('#setBox');
}
function openHelp() {
  openModal('#helpBox');
}
function openCredits() {
  openModal('#credBox');
}
$('#btnSet').onclick = openSettings;
$('#btnTSet').onclick = openSettings;
$('#btnTHelp').onclick = openHelp;
$('#btnTCred').onclick = openCredits;
$('#btnCred2').onclick = openCredits;
$('#btnHowTo').onclick = () => {
  openHelp();
};
$('#btnResume').onclick = () => closeModal('#setBox');
$('#btnToTitle').onclick = () => {
  closeModal('#setBox');
  showTitle();
};
/* Fullscreen: hidden where the browser (or the embedding page) doesn't allow it. */
{
  const d = document,
    de = d.documentElement,
    can =
      !!(d.fullscreenEnabled || d.webkitFullscreenEnabled) && !!(de.requestFullscreen || de.webkitRequestFullscreen);
  if (!can) $('#btnFull').style.display = 'none';
  $('#btnFull').onclick = () => {
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) {
        const p = (d.exitFullscreen || d.webkitExitFullscreen).call(d);
        if (p && p.catch) p.catch(() => {});
      } else {
        const p = (de.requestFullscreen || de.webkitRequestFullscreen).call(de);
        if (p && p.catch) p.catch(() => note('这里暂时不能全屏'));
      }
    } catch (e) {
      note('这里暂时不能全屏');
    }
  };
}
$('#btnReset').onclick = () => {
  if (!confirm(tr('真的要清空所有存档，从头开始吗？'))) return;
  if (!confirm(tr('再确认一次：种子、家具、图鉴都会消失。'))) return;
  try {
    localStorage.removeItem(SAVE);
  } catch (e) {}
  location.reload();
};
$('#btnExport').onclick = () => {
  const txt = btoa(unescape(encodeURIComponent(JSON.stringify(save))));
  const ta = $('#saveTxt');
  ta.classList.remove('hidden');
  ta.value = txt;
  ta.select();
  try {
    navigator.clipboard && navigator.clipboard.writeText(txt);
  } catch (e) {}
  note('存档已复制，保存好这段文字就行');
};
$('#btnImport').onclick = () => {
  const ta = $('#saveTxt');
  if (ta.classList.contains('hidden') || !ta.value.trim() || ta.value === ta.dataset.last) {
    ta.classList.remove('hidden');
    ta.value = '';
    ta.dataset.last = '';
    ta.placeholder = tr('把导出的存档文字粘贴到这里，再点一次「导入存档」');
    ta.focus();
    return;
  }
  try {
    const o = migrateSave(JSON.parse(decodeURIComponent(escape(atob(ta.value.trim())))));
    if (!o || !Array.isArray(o.seeds)) throw 0;
    if (!confirm(tr('导入会覆盖现在的进度，确定吗？'))) return;
    localStorage.setItem(SAVE, JSON.stringify(o));
    location.reload();
  } catch (e) {
    note('这段存档读不出来，检查一下有没有复制完整');
  }
};
/* language selector on the title screen; the subtitle shows the game's name in the other languages */
function langLabel() {
  document.querySelectorAll('#langSeg button').forEach((b) => b.classList.toggle('on', b.dataset.lang === LANG));
  $('#logoSub').textContent = LANG === 'en' ? '巨树花海 · 大樹と花の海' : 'GREAT TREE MEADOW';
  document.querySelectorAll('.gameName').forEach((e) => (e.textContent = LANG_META.en.title));
}
document.querySelectorAll('#langSeg button').forEach(
  (b) =>
    (b.onclick = () => {
      applyLang(b.dataset.lang);
      AU.init();
      AU.sfx('pop');
    }),
);
const _olc = window.onLangChange;
window.onLangChange = () => {
  if (_olc) _olc();
  langLabel();
  syncSettingsUI();
};
/* title screen */
function showTitle() {
  paused = true;
  if (FS.on) stopFish();
  MODALS.slice().forEach((m) => closeModal(m));
  sayEl.classList.remove('on');
  closePigMenu();
  $('#start').classList.remove('hidden');
  $('#hud').classList.add('hidden');
  $('#btnGo').textContent = started
    ? '继续游戏'
    : save.seeds.length || save.coins || save.home
      ? '继续游戏'
      : '开始游戏';
}
function hideTitle() {
  $('#start').classList.add('hidden');
}
let introT = null;
function startGame() {
  AU.init();
  applyAudio();
  hideTitle();
  paused = false;
  $('#hud').classList.remove('hidden');
  if (started) return;
  started = true;
  cam.tDist = CAMD[SET.camD] || 11;
  const fresh = !save.seeds.length && !save.coins;
  if (!fresh) {
    setTimeout(() => say(rpick(['回来啦！今天去哪儿？', '团子等你好久了！', '花海还是老样子，真好。']), 3), 700);
    return;
  }
  const I = $('#intro'),
    l1 = $('#introL1'),
    l2 = $('#introL2');
  l1.textContent = '水中央有一棵很老很老的巨树……';
  l2.textContent = '它的十二颗光之种子被风吹散了。和团子一起，把它们找回来吧。';
  I.classList.remove('hidden');
  setTimeout(() => l1.classList.add('on'), 300);
  setTimeout(() => l2.classList.add('on'), 1900);
  const end = () => {
    if (I.classList.contains('hidden')) return;
    clearTimeout(introT);
    l1.classList.remove('on');
    l2.classList.remove('on');
    setTimeout(() => {
      I.classList.add('hidden');
      say('那就是巨树！我们去找光之种子吧！', 3.6);
    }, 600);
    setTimeout(() => {
      const k_ = $('#keys');
      if (k_) k_.style.opacity = 0;
    }, 20000);
  };
  introT = setTimeout(end, 6800);
  I.onclick = end;
}
/* fps counter */
let fpsN = 0,
  fpsT = 0;
function updFps(dt) {
  watchPerf(dt);
  if (!SET.fps) return;
  fpsN++;
  fpsT += dt;
  if (fpsT >= 0.5) {
    $('#fps').textContent = Math.round(fpsN / fpsT) + ' FPS';
    fpsN = 0;
    fpsT = 0;
  }
}
langLabel();
