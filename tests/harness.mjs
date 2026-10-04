// Shared Playwright setup for the test scripts. WebGL runs on SwiftShader, so no GPU is needed
// (it is slow: allow several seconds per rendered frame on CI machines).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SHOTS = path.join(ROOT, 'build', 'shots');

export async function launch() {
  return chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
}

/** Opens a build and waits until the game object is ready. Collects page errors. */
export async function openGame(
  browser,
  { file = 'build/dev.html', viewport = { width: 960, height: 600 }, touch = false, settings = null, save = null } = {},
) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  if (settings || save) {
    await page.addInitScript(
      ([s, v]) => {
        if (s) localStorage.setItem('great-tree-meadow-settings', JSON.stringify(s));
        if (v) localStorage.setItem('great-tree-meadow-v1', JSON.stringify(v));
      },
      [settings, save],
    );
  }
  await page.goto('file://' + path.join(ROOT, file), { waitUntil: 'load', timeout: 180000 });
  if (file.includes('dev')) await page.waitForFunction(() => !!window.__game, null, { timeout: 120000 });
  else await page.waitForTimeout(4000);
  return { ctx, page, errors };
}

export async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name) });
}

export function check(results, name, ok, info = '') {
  results.push({ name, ok: !!ok, info });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
}
