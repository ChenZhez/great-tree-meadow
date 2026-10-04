#!/usr/bin/env node
// Packs dist/index.html for distribution:
//   release/great-tree-meadow-<version>-web.zip   index.html at the root, ready for itch.io (HTML game)
//                                                 and for playing offline by opening index.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync, strToU8 } from 'fflate';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const dist = path.join(ROOT, 'dist/index.html');
if (!fs.existsSync(dist)) {
  console.error('dist/index.html not found, run npm run build first');
  process.exit(1);
}

const notices = [fs.readFileSync(path.join(ROOT, 'THIRD_PARTY_NOTICES.md'), 'utf8')];
for (const f of fs.readdirSync(path.join(ROOT, 'licenses')).sort())
  notices.push(`\n\n===== ${f} =====\n\n` + fs.readFileSync(path.join(ROOT, 'licenses', f), 'utf8'));
const readme = `Great Tree Meadow ${pkg.version}

Open index.html in a web browser (Chrome, Edge, Firefox or Safari) to play.
No installation or internet connection is needed. Progress is saved in the browser.

© 2026 Zhe. See THIRD_PARTY_NOTICES.txt for the open-source components it uses.
`;
const files = {
  'index.html': [new Uint8Array(fs.readFileSync(dist)), { level: 9 }],
  'README.txt': strToU8(readme),
  'LICENSE.txt': strToU8(fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8')),
  'THIRD_PARTY_NOTICES.txt': strToU8(notices.join('')),
};
const out = path.join(ROOT, 'release', `great-tree-meadow-${pkg.version}-web.zip`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, zipSync(files, { mtime: new Date('2026-01-01T00:00:00Z') }));
console.log(`${path.relative(ROOT, out)}  ${(fs.statSync(out).size / 1048576).toFixed(2)} MB`);
