#!/usr/bin/env node
// Pre-release hygiene checks on the source tree and the built page:
//   - no debug hooks, `debugger`, stray console.log, TODO/FIXME left in the game code
//   - no absolute local paths, localhost or file:// URLs anywhere in what we publish
//   - the release page loads nothing from the network
// Exit code 1 when something needs fixing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const SKIP_DIRS = new Set(['node_modules', '.git', 'build', 'dist', 'release', 'fonts']);
const TEXT = /\.(js|mjs|json|html|css|md|yml|yaml|txt)$/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out);
    } else if (TEXT.test(e.name) && e.name !== 'package-lock.json') out.push(path.join(dir, e.name));
  }
  return out;
}

const localPath = /(?:\/home\/[a-z]|\/Users\/[A-Za-z]|[A-Z]:\\\\Users|\/mnt\/[a-z]|localhost:\d|127\.0\.0\.1)/;
for (const f of walk(ROOT)) {
  const rel = path.relative(ROOT, f);
  if (rel === 'tools/release-audit.mjs') continue;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    const at = `${rel}:${i + 1}`;
    if (localPath.test(l)) problems.push(`${at}  local path or host`);
    if (rel.startsWith('src/')) {
      if (/\bdebugger\b/.test(l)) problems.push(`${at}  debugger statement`);
      if (/console\.log\(/.test(l)) problems.push(`${at}  console.log`);
      if (/\b(TODO|FIXME|XXX|HACK)\b/.test(l)) problems.push(`${at}  unfinished-work marker`);
    }
  });
}

const dist = path.join(ROOT, 'dist/index.html');
if (!fs.existsSync(dist)) problems.push('dist/index.html is missing (run npm run build)');
else {
  const html = fs.readFileSync(dist, 'utf8');
  if (html.includes('window.__game')) problems.push('dist: debug hook present');
  if (/file:\/\//.test(html)) problems.push('dist: file:// URL');
  const ext = html.match(/(?:src|href)\s*=\s*["']https?:\/\/[^"']+/g);
  if (ext) problems.push('dist: external resources ' + ext.join(', '));
  const mb = fs.statSync(dist).size / 1048576;
  if (mb > 8) problems.push(`dist: page is ${mb.toFixed(1)} MB, more than expected`);
}

if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log('release audit: clean');
