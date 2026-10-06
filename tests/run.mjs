#!/usr/bin/env node
// Regression tests. Run `npm run build:dev && npm run build` first.
//   node tests/run.mjs            all tests
//   node tests/run.mjs lang touch only tests whose name contains one of the words
// WebGL runs on SwiftShader, so every rendered frame is slow; the suite takes a few minutes.
import path from 'node:path';
import { launch, openGame, shot, check, ROOT } from './harness.mjs';

const only = process.argv.slice(2);
const results = [];
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const G = (page, fn, arg) => page.evaluate(fn, arg);
const settle = (page, ms = 600) => page.waitForTimeout(ms);
/** true if the page still answers quickly (an endless microtask loop would hang it) */
const responsive = (page) =>
  Promise.race([page.evaluate(() => 1).then(() => true), new Promise((r) => setTimeout(() => r(false), 5000))]);

test('boot: English by default, no errors, HUD seed count', async (b) => {
  const { page, errors, ctx } = await openGame(b);
  await settle(page, 1500);
  const s = await G(page, () => ({
    lang: document.documentElement.lang,
    title: document.title,
    logo: document.getElementById('logoMain').textContent,
    seeds: document.getElementById('seedCount').textContent,
  }));
  check(results, 'html lang is en', s.lang === 'en', s.lang);
  check(
    results,
    'title is Great Tree Meadow',
    s.title === 'Great Tree Meadow' && s.logo === 'Great Tree Meadow',
    s.logo,
  );
  check(results, 'seed counter shows 0 / 12', s.seeds === '0 / 12', s.seeds);
  await shot(page, 'boot-title.png');
  check(results, 'no page errors on boot', errors.length === 0, errors.join(' | '));
  await ctx.close();
});

test('lang: switching languages on the title screen never freezes', async (b) => {
  const { page, errors, ctx } = await openGame(b);
  let ok = true;
  for (const l of ['zh', 'ja', 'en', 'zh']) {
    await page.evaluate((l) => document.querySelector(`#langSeg button[data-lang="${l}"]`).click(), l);
    await settle(page, 300);
    for (const btn of ['#btnTSet', '#btnTHelp', '#btnTCred']) {
      await page.evaluate((s) => document.querySelector(s).click(), btn);
      await settle(page, 200);
      if (!(await responsive(page))) {
        ok = false;
        break;
      }
      await page.keyboard.press('Escape');
      await settle(page, 200);
    }
    if (!(await responsive(page))) ok = false;
  }
  const st = await G(page, () => ({
    lang: __game.LANG,
    html: document.documentElement.lang,
    go: document.getElementById('btnGo').textContent,
    open: !!__game.topModal(),
  }));
  check(results, 'page stays responsive after language switches', ok);
  check(
    results,
    'Chinese UI after switching back',
    st.lang === 'zh' && st.html === 'zh-CN' && st.go === '开始游戏',
    JSON.stringify(st),
  );
  check(results, 'Escape closed every dialog', !st.open);
  await page.evaluate(() => document.getElementById('btnGo').click());
  await settle(page, 800);
  check(results, 'game starts after switching languages', await G(page, () => __game.started && !__game.paused));
  check(results, 'no errors while switching languages', errors.length === 0, errors.join(' | '));
  await ctx.close();
});

test('lang: every string is translated (en, ja) across the UI', async (b) => {
  for (const lang of ['en', 'ja']) {
    const { page, errors, ctx } = await openGame(b, { settings: { lang } });
    await G(page, () => {
      __game.start();
    });
    await settle(page, 1200);
    await G(page, async () => {
      const g = __game,
        wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const tabs = async (sel) => {
        for (const b of document.querySelectorAll(sel + ' button')) {
          b.click();
          await wait(30);
        }
      };
      g.save.coins = 500;
      g.save.fishBag = { koi: 2, golden: 1, boot: 1 };
      g.save.bugBag = { b1: 1 };
      g.save.fishLog = { koi: { n: 2, max: 40 } };
      g.save.bugLog = { b1: 1 };
      g.openSettings();
      await tabs('#setTabs');
      document.getElementById('btnResume').click();
      g.openHelp();
      await tabs('#helpTabs');
      document.querySelector('#helpBox [data-close]').click();
      g.openCredits();
      document.querySelector('#credBox [data-close]').click();
      g.openJournal();
      await tabs('#jTabs');
      document.querySelector('#journalBox [data-close]').click();
      g.openShop('buy');
      await tabs('#shopTabs');
      document.querySelector('#shopBox [data-close]').click();
      g.openTasks();
      document.querySelector('#taskBox [data-close]').click();
      g.openWardrobe();
      document.getElementById('btnWearClose').click();
      g.openMap();
      document.getElementById('btnMapClose').click();
      g.openPigMenu();
      await wait(50);
      g.pigAct('close');
      g.toggleNight();
      g.task('fish', 1);
      g.catchBug(null, 'b2');
      g.save.inv.peach = 3;
    });
    await settle(page, 1500);
    await G(page, () => __game.goHome());
    await settle(page, 2500);
    await G(page, async () => {
      const g = __game,
        wait = (ms) => new Promise((r) => setTimeout(r, ms));
      g.startBuild();
      await wait(100);
      for (const b of document.querySelectorAll('#bTabs button')) {
        b.click();
        await wait(40);
      }
      g.endBuild();
    });
    await settle(page, 800);
    const miss = await G(page, () => [...__game.I18N_MISS]);
    const leftover = await G(page, () => {
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const p = n.parentElement;
        if (!p || p.closest('[data-notr],script,style,.hidden') || !n.nodeValue.trim()) continue;
        if (
          document.documentElement.lang === 'en'
            ? /[\u3400-\u9fff]/.test(n.nodeValue)
            : /[们这还来过样么为给让请说话里没现东钓鱼团买卖设图]/.test(n.nodeValue)
        )
          out.push(n.nodeValue.trim());
      }
      return out.slice(0, 10);
    });
    await shot(page, `ui-${lang}.png`);
    check(results, `[${lang}] no untranslated fragments at runtime`, miss.length === 0, miss.slice(0, 8).join(' / '));
    check(results, `[${lang}] no Chinese left in visible text`, leftover.length === 0, leftover.join(' / '));
    check(results, `[${lang}] no errors while visiting every screen`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
});

test('touch: phone layout shows the joystick and controls do not overlap', async (b) => {
  for (const vp of [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    const { page, errors, ctx } = await openGame(b, { touch: true, viewport: vp });
    await G(page, () => __game.start());
    await settle(page, 1200);
    await G(page, () => document.getElementById('fishBtn').classList.remove('hidden'));
    const r = await G(page, () => {
      const box = (s) => {
        const e = document.querySelector(s);
        const r = e.getBoundingClientRect();
        return { l: r.left, r: r.right, t: r.top, b: r.bottom, vis: getComputedStyle(e).display !== 'none' };
      };
      const acts = [...document.querySelectorAll('#actions .act')].map((e) => {
        const r = e.getBoundingClientRect();
        return { l: r.left, r: r.right, t: r.top, b: r.bottom };
      });
      return {
        touch: document.body.classList.contains('touch'),
        joy: box('#joy'),
        acts,
        tr: box('.tr'),
        W: innerWidth,
        H: innerHeight,
      };
    });
    const hit = (a, c) => a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b;
    const overlap =
      r.acts.some((a) => hit(a, r.joy)) || r.acts.some((a, i) => r.acts.some((c, j) => i < j && hit(a, c)));
    const inside = [r.joy, ...r.acts].every((a) => a.l >= 0 && a.r <= r.W && a.b <= r.H && a.t >= 0);
    const tag = `${vp.width}x${vp.height}`;
    check(results, `[${tag}] body.touch set and joystick visible`, r.touch && r.joy.vis);
    check(results, `[${tag}] joystick and buttons don't overlap and stay on screen`, !overlap && inside);
    check(results, `[${tag}] top-right HUD fits on screen`, r.tr.l >= 0, JSON.stringify(r.tr));
    await shot(page, `touch-${tag}.png`);
    check(results, `[${tag}] no errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
});

test('input: fishing button, balloon and dialogs do not leak actions', async (b) => {
  const { page, errors, ctx } = await openGame(b, { touch: true, viewport: { width: 800, height: 500 } });
  await G(page, () => __game.start());
  await settle(page, 1200);
  await G(page, () => document.getElementById('intro').click()); // skip the opening lines
  await settle(page, 1000);
  // face open water south of the dock
  const spot = await G(page, () => {
    const g = __game;
    for (let r = 30; r < 120; r += 4)
      for (let a = 0; a < 6.28; a += 0.4) {
        const x = Math.sin(a) * r,
          z = Math.cos(a) * r;
        g.tp(x, z);
        g.boy.g.rotation.y = a;
        if (g.canFish()) return [x, z, a];
      }
    return null;
  });
  const can = await page
    .waitForFunction(() => !document.getElementById('fishBtn').classList.contains('hidden'), null, { timeout: 30000 })
    .then(
      () => true,
      () => false,
    );
  check(results, 'fishing button appears when facing water', can, JSON.stringify(spot));
  const btn = await page.$('#fishBtn');
  const bb = await btn.boundingBox();
  await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForFunction(() => __game.FS.on, null, { timeout: 10000 }).catch(() => {});
  const st = await G(page, () => ({
    state: __game.PL.state,
    grounded: __game.PL.grounded,
    vy: __game.PL.vy,
    fs: __game.FS.on,
  }));
  check(
    results,
    'fishing button starts fishing without jumping',
    st.state === 'fish' && st.fs && st.grounded && st.vy === 0,
    JSON.stringify(st),
  );
  await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.keyboard.press('Space');
  await settle(page, 300);
  await G(page, () => {
    if (__game.FS.on) __game.stopFish();
  });
  // balloon: Space and the jump button while riding
  await G(page, () => __game.rideBalloon());
  await settle(page, 300);
  await page.keyboard.press('Space');
  await G(page, () => __game.doJump());
  await settle(page, 300);
  check(results, 'jumping during the balloon ride is ignored', await G(page, () => __game.PL.state === 'balloon'));
  await G(page, () => {
    __game.PL.state = 'free';
  });
  // a dialog blocks game shortcuts
  const n0 = await G(page, () => __game.nightT);
  await G(page, () => __game.openSettings());
  for (const k of ['n', 'm', 'c', 'g', 'j', 't', ' ']) await page.keyboard.press(k === ' ' ? 'Space' : k);
  await settle(page, 500);
  const leak = await G(
    page,
    (n) => ({
      night: __game.nightT !== n,
      map: !document.getElementById('mapBox').classList.contains('hidden'),
      wear: !document.getElementById('wardrobe').classList.contains('hidden'),
      home: __game.HOME.on,
    }),
    n0,
  );
  check(
    results,
    'shortcuts are blocked while settings are open',
    !leak.night && !leak.map && !leak.wear && !leak.home,
    JSON.stringify(leak),
  );
  // help opened from settings is drawn above it, Esc closes help first
  await G(page, () => document.getElementById('btnHowTo').click());
  const top = await G(page, () => __game.topModal().id);
  await page.keyboard.press('Escape');
  const after = await G(page, () => ({ top: __game.topModal() && __game.topModal().id, paused: __game.paused }));
  await page.keyboard.press('Escape');
  const done = await G(page, () => ({ open: !!__game.topModal(), paused: __game.paused }));
  check(
    results,
    'help opens above settings and Esc closes them one at a time',
    top === 'helpBox' && after.top === 'setBox' && !done.open && !done.paused,
    JSON.stringify({ top, after, done }),
  );
  check(results, 'no errors during input tests', errors.length === 0, errors.join(' | '));
  await ctx.close();
});

test('quality: low keeps flora hidden, mobile shadows stay small', async (b) => {
  const { page, errors, ctx } = await openGame(b, {
    touch: true,
    viewport: { width: 700, height: 420 },
    settings: { quality: 'low' },
  });
  await G(page, () => __game.start());
  await settle(page, 1500);
  const low = await G(page, () => ({ mask: __game.camera.layers.mask, shadow: __game.sun ? 0 : 0 }));
  check(results, 'low quality: flora layer stays off after rendering', (low.mask & 2) === 0, 'mask=' + low.mask);
  await G(page, () => {
    __game.SET.quality = 'mid';
    __game.applyQuality();
  });
  await settle(page, 800);
  const mid = await G(page, () => ({ mask: __game.camera.layers.mask, map: __game.shadowSize() }));
  check(
    results,
    'mid quality on touch: flora on, 1024 shadow map',
    (mid.mask & 2) === 2 && mid.map === 1024,
    JSON.stringify(mid),
  );
  check(results, 'no errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
});

test('economy, outfits and storage', async (b) => {
  const { page, errors, ctx } = await openGame(b);
  await G(page, () => __game.start());
  await settle(page, 1000);
  const sale = await G(page, () => {
    const g = __game;
    g.save.coins = 0;
    g.save.fishBag = { koi: 2, golden: 1 };
    g.save.bugBag = { b0: 3 };
    g.openShop('sell');
    const btn = document.querySelector('#shopList .btn');
    const shown = +btn.textContent.replace(/[^0-9]/g, '');
    btn.click();
    return { shown, got: g.save.coins, golden: g.save.fishBag.golden };
  });
  check(
    results,
    'sell-all amount matches the coins received',
    sale.shown === sale.got && sale.golden === 1,
    JSON.stringify(sale),
  );
  await G(page, () => document.querySelector('#shopBox [data-close]').click());
  const geo = await G(page, async () => {
    const g = __game,
      wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const m0 = g.renderer.info.memory.geometries;
    for (let i = 0; i < 9; i++) {
      g.dress(i % 3, true);
      await wait(60);
    }
    return { m0, m1: g.renderer.info.memory.geometries };
  });
  check(results, 'changing outfits does not leak geometry', geo.m1 <= geo.m0 + 40, JSON.stringify(geo));
  check(results, 'no errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
  // storage blocked
  const c2 = await b.newContext();
  const p2 = await c2.newPage();
  const e2 = [];
  p2.on('pageerror', (e) => e2.push(e.message));
  await p2.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('blocked', 'SecurityError');
    };
  });
  await p2.goto('file://' + path.join(ROOT, 'build/dev.html'));
  await p2.waitForFunction(() => !!window.__game, null, { timeout: 120000 });
  await p2.waitForTimeout(800);
  check(
    results,
    'blocked storage shows a warning instead of failing silently',
    await p2.evaluate(() => !document.getElementById('storageWarn').classList.contains('hidden')),
  );
  check(results, 'blocked storage causes no errors', e2.length === 0, e2.join(' | '));
  await c2.close();
});

test('save: import rejects malformed data without replacing progress', async (b) => {
  const { page, errors, ctx } = await openGame(b);
  await G(page, () => {
    __game.start();
    __game.openSettings();
    localStorage.setItem('great-tree-meadow-v1', JSON.stringify({ seeds: [], zones: [], coins: 57 }));
  });
  for (const value of [
    { seeds: [], zones: {} },
    { seeds: [], coins: '<img src=x>' },
    { seeds: [], saveVersion: 99 },
    { seeds: [], photos: [{ url: 'https://example.com/photo.jpg', cap: '' }] },
  ]) {
    await G(
      page,
      (value) => {
        const ta = document.querySelector('#saveTxt');
        ta.classList.remove('hidden');
        ta.value = btoa(unescape(encodeURIComponent(JSON.stringify(value))));
        document.querySelector('#btnImport').click();
      },
      value,
    );
    check(
      results,
      'invalid import preserves existing progress',
      await G(page, () => JSON.parse(localStorage.getItem('great-tree-meadow-v1')).coins === 57),
    );
  }
  const legacy = { seeds: ['runes'], zones: ['hills'], coins: 57 };
  page.once('dialog', (dialog) => dialog.accept());
  await Promise.all([
    page.waitForEvent('load'),
    G(
      page,
      (value) => {
        document.querySelector('#saveTxt').value = btoa(JSON.stringify(value));
        document.querySelector('#btnImport').click();
      },
      legacy,
    ),
  ]);
  await page.waitForFunction(() => !!window.__game);
  check(
    results,
    'legacy import restores progress after reload',
    await G(page, () => __game.save.coins === 57 && __game.save.seeds.includes('runes')),
  );
  await G(page, () => {
    __game.openSettings();
    document.querySelector('#btnExport').click();
  });
  const exported = await G(page, () =>
    JSON.parse(decodeURIComponent(escape(atob(document.querySelector('#saveTxt').value)))),
  );
  check(results, 'export retains imported progress and version', exported.saveVersion === 1 && exported.coins === 57);
  check(results, 'import/export has no page errors', errors.length === 0, errors.join(' | '));
  await G(page, () => {
    __game.start();
    __game.openSettings();
  });
  page.on('dialog', (dialog) => dialog.accept());
  await Promise.all([page.waitForEvent('load'), G(page, () => document.querySelector('#btnReset').click())]);
  await page.waitForFunction(() => !!window.__game);
  check(
    results,
    'reset is not undone by the leaving page',
    await G(page, () => __game.save.coins === 0 && __game.save.seeds.length === 0),
  );
  await ctx.close();
});

test('save: untrusted task labels render as text and stored data is validated', async (b) => {
  const d = new Date(),
    day = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  const { page, errors, ctx } = await openGame(b, {
    save: {
      seeds: [],
      zones: [],
      tasks: {
        day,
        list: [
          { k: 'visit:hills', z: '<img src=x onerror="window.saveInjected=true">', n: 1, c: 0, r: 130, done: false },
        ],
      },
    },
  });
  await G(page, () => {
    __game.start();
    __game.openTasks();
  });
  await settle(page);
  check(
    results,
    'task markup stays inert text',
    await G(
      page,
      () =>
        !window.saveInjected &&
        !document.querySelector('#taskList img') &&
        document.querySelector('#taskList').textContent.includes('<img'),
    ),
  );
  check(results, 'untrusted label causes no errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
  const invalid = await openGame(b, { save: { seeds: [], zones: 'broken', home: {} } });
  check(
    results,
    'malformed stored save boots with fresh state',
    (await G(invalid.page, () => __game.save.seeds.length === 0 && Array.isArray(__game.save.zones))) &&
      invalid.errors.length === 0,
  );
  await invalid.ctx.close();
});

test('release: dist/index.html is self-contained and runs', async (b) => {
  const ctx = await b.newContext({ viewport: { width: 900, height: 560 } });
  const page = await ctx.newPage();
  const errors = [],
    external = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) {
      external.push(u);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('file://' + path.join(ROOT, 'dist/index.html'));
  await page.waitForTimeout(6000);
  const st = await page.evaluate(() => ({
    hook: '__game' in window,
    fonts: [...document.fonts].filter((f) => f.status === 'loaded' || f.status === 'unloaded').length,
    title: document.title,
  }));
  await page.click('#langSeg button[data-lang="ja"]');
  await page.waitForTimeout(800);
  await shot(page, 'release-ja.png');
  await page.click('#btnGo');
  await page.waitForTimeout(3000);
  await shot(page, 'release-play.png');
  check(results, 'release build makes no network requests', external.length === 0, external.join(', '));
  check(results, 'release build has no debug hook', !st.hook);
  check(results, 'release build runs without errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
});

const browser = await launch();
for (const t of tests) {
  if (only.length && !only.some((w) => t.name.includes(w))) continue;
  console.log(`\n# ${t.name}`);
  try {
    await t.fn(browser);
  } catch (e) {
    check(results, t.name + ' (crashed)', false, e.message.split('\n')[0]);
  }
}
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
