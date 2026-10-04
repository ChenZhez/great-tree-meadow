#!/usr/bin/env node
// Renders a set of reference screenshots into build/shots (used for visual review and the README).
// Build with `node tools/build.mjs --dev --fonts` first so the embedded fonts are used.
import { launch, openGame, shot } from './harness.mjs';

const SCENES = {
  title: { lang: 'en', title: true },
  phone: { lang: 'en', at: [-30, -20], yaw: 0.8, pitch: 0.25, dist: 11, touch: true, hud: true },
  'title-zh': { lang: 'zh', title: true },
  'meadow-day': { lang: 'en', at: [-34, -14], yaw: 0.9, pitch: 0.3, dist: 16 },
  'waterfall-day': { lang: 'en', at: [0, -36], yaw: 0, pitch: 0.2, dist: 17 },
  'waterfall-night': { lang: 'en', at: [0, -36], yaw: 0, pitch: 0.2, dist: 17, night: 1 },
  'tree-night': { lang: 'en', at: [0, 40], yaw: 0, pitch: 0.12, dist: 26, night: 1 },
  'waterfall-close-night': { lang: 'en', at: [3, -48], yaw: 0.6, pitch: 0.12, dist: 10, night: 1 },
};
const only = process.argv.slice(2);
const b = await launch();
for (const [name, s] of Object.entries(SCENES)) {
  if (only.length && !only.includes(name)) continue;
  const { page, errors, ctx } = await openGame(b, {
    viewport: s.touch ? { width: 390, height: 844 } : { width: 1280, height: 720 },
    touch: !!s.touch,
    settings: { lang: s.lang },
    file: 'build/dev.html',
  });
  if (!s.title) {
    await page.evaluate((s) => {
      const g = __game;
      g.start();
      document.getElementById('intro').click();
      if (!s.hud) document.body.classList.add('clean');
      g.tp(s.at[0], s.at[1]);
      Object.assign(g.cam, { yaw: s.yaw, pitch: s.pitch, tDist: s.dist, dist: s.dist });
      if (s.night) g.setNight(1);
    }, s);
  }
  await page.waitForTimeout(5000);
  await shot(page, name + '.png');
  console.log(name, errors.length ? errors : 'ok');
  await ctx.close();
}
await b.close();
