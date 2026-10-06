import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { firefox, webkit } from 'playwright';

const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url));
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
});
await new Promise((resolve) => server.listen(0, 'localhost', resolve));
const url = `http://localhost:${server.address().port}/`;
try {
  for (const engine of [firefox, webkit]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
      const errors = [],
        requests = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/*', (route) => {
        if (route.request().url() === url && route.request().isNavigationRequest()) return route.continue();
        requests.push(route.request().url());
        return route.abort();
      });
      await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
      await page.locator('#btnGo').waitFor();
      assert.equal(await page.title(), 'Great Tree Meadow');
      assert.equal(await page.evaluate(() => '__game' in window), false);
      await page.locator('#langSeg button[data-lang="ja"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
      await page.locator('#langSeg button[data-lang="en"]').click();
      await page.locator('#btnGo').click();
      await page.locator('#intro').click();
      await page.waitForFunction(() => document.querySelector('#intro').classList.contains('hidden'));
      await page.keyboard.press('m');
      await page.waitForFunction(() => !document.querySelector('#mapBox').classList.contains('hidden'));
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('#mapBox').classList.contains('hidden'));
      await page.keyboard.down('w');
      await page.waitForTimeout(500);
      await page.keyboard.up('w');
      const dayIcon = await page.locator('#timeIco').innerHTML();
      await page.keyboard.press('n');
      await page.waitForFunction((icon) => document.querySelector('#timeIco').innerHTML !== icon, dayIcon);
      assert.equal(await page.locator('#seedCount').textContent(), '0 / 12');
      assert.deepEqual(errors, []);
      assert.deepEqual(requests, []);
      fs.mkdirSync(new URL('../build/shots/', import.meta.url), { recursive: true });
      await page.screenshot({ path: new URL(`../build/shots/${engine.name()}-release.png`, import.meta.url).pathname });
      console.log(`${engine.name()}: release startup, language, play, map, input, no runtime requests/errors passed`);
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}
