import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const files = unzipSync(fs.readFileSync(path.join(root, 'release', `great-tree-meadow-${pkg.version}-web.zip`)));
assert.deepEqual(Object.keys(files).sort(), ['LICENSE.txt', 'README.txt', 'THIRD_PARTY_NOTICES.txt', 'index.html']);
assert.deepEqual(Buffer.from(files['index.html']), fs.readFileSync(path.join(root, 'dist/index.html')));
assert.equal(strFromU8(files['LICENSE.txt']), fs.readFileSync(path.join(root, 'LICENSE'), 'utf8'));
assert.ok(strFromU8(files['README.txt']).includes(`Great Tree Meadow ${pkg.version}`));

const notices = strFromU8(files['THIRD_PARTY_NOTICES.txt']);
const html = strFromU8(files['index.html']);
assert.ok(html.includes(`const VERSION = ${JSON.stringify(pkg.version)}`));
assert.ok(notices.includes(fs.readFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8')));
for (const license of fs.readdirSync(path.join(root, 'licenses'))) {
  const text = fs.readFileSync(path.join(root, 'licenses', license), 'utf8');
  assert.ok(notices.includes(text), `${license} missing from package`);
  assert.ok(html.includes(text.replace(/--/g, '&#45;&#45;')), `${license} missing from standalone HTML`);
}
assert.ok(html.includes('The MIT License'));
assert.ok(!html.includes('window.__game'));
assert.ok(!/(?:src|href)\s*=\s*["']https?:\/\//.test(html));
console.log('package checks passed: exact contents, build, version, licenses and standalone HTML');
