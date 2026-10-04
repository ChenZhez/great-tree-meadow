#!/usr/bin/env node
// Checks the translation tables against the source text.
//   - every Chinese string literal in src/js and every visible text in src/index.html needs an entry
//     in src/locales/en.json and src/locales/ja.json (exact entry, or fully covered by fragments)
//   - entries that no longer appear anywhere are reported as unused
// Exit code 1 when something is missing.  `--list` prints the missing strings.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/;
const HAN = /[\u3400-\u9fff]/;
const KANA = /[\u3040-\u30ff]/; // already Japanese (language names etc.)

/** Same whitespace rule as the game: an indented line break in markup counts as one space. */
const normSpace = (s) => s.replace(/[ \t]*\n[ \t]+/g, ' ').trim();

export function sourceStrings() {
  const out = new Set();
  const add = (s) => {
    s = normSpace(s.replace(/\\n/g, '\n'));
    if (s && CJK.test(s) && !KANA.test(s)) out.add(s);
  };
  for (const f of fs.readdirSync(path.join(ROOT, 'src/js'))) {
    if (f === 'i18n.js') continue; // language names only
    let t = fs.readFileSync(path.join(ROOT, 'src/js', f), 'utf8');
    t = t
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/([;{}),])\s*\/\/[^\n'"`]*$/gm, '$1');
    const re = /'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`|"((?:[^"\\\n]|\\.)*)"/g;
    let m;
    while ((m = re.exec(t))) {
      if (m[2] != null) {
        for (const e of m[2].matchAll(/\$\{([^{}]*)\}/g)) for (const q of e[1].matchAll(/'([^']*)'/g)) add(q[1]);
        for (const part of m[2].split(/\$\{[^}]*\}|<[^>]+>/)) add(part);
      } else add(m[1] ?? m[3] ?? '');
    }
  }
  let h = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
  h = h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  // drop elements marked data-notr (they are never translated)
  h = stripNoTranslate(h);
  for (const m of h.matchAll(/>([^<]+)</g)) add(m[1].replace(/&amp;/g, '&'));
  for (const m of h.matchAll(/(?:aria-label|title|placeholder)="([^"]+)"/g)) add(m[1]);
  return [...out];
}

/** Removes every element carrying data-notr, including nested children of the same tag. */
function stripNoTranslate(h) {
  for (;;) {
    const m = /<(\w+)\b[^>]*\bdata-notr\b[^>]*>/.exec(h);
    if (!m) return h;
    const tag = m[1],
      re = new RegExp(`<${tag}\\b[^>]*>|<\\/${tag}\\s*>`, 'g');
    re.lastIndex = m.index + m[0].length;
    let depth = 1,
      end = h.length,
      t;
    while ((t = re.exec(h))) {
      depth += t[0][1] === '/' ? -1 : 1;
      if (!depth) {
        end = re.lastIndex;
        break;
      }
    }
    h = h.slice(0, m.index) + h.slice(end);
  }
}

function covered(dict, s) {
  if (dict[s] != null) return true;
  const keys = Object.keys(dict)
    .filter((k) => k)
    .sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  return !HAN.test(s.replace(re, ''));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const src = sourceStrings();
  const list = process.argv.includes('--list');
  let bad = 0;
  for (const lang of ['en', 'ja']) {
    const dict = JSON.parse(fs.readFileSync(path.join(ROOT, `src/locales/${lang}.json`), 'utf8'));
    const missing = src.filter((s) => !covered(dict, s));
    const exactMissing = src.filter((s) => dict[s] == null);
    const all = src.join('\n');
    const unused = Object.keys(dict).filter((k) => !all.includes(k));
    console.log(
      `${lang}: ${Object.keys(dict).length} entries, ${missing.length} missing, ${exactMissing.length} built from fragments, ${unused.length} unused`,
    );
    if (list) {
      for (const s of missing) console.log('  - ' + JSON.stringify(s));
      for (const s of unused) console.log('  ? unused ' + JSON.stringify(s));
    }
    bad += missing.length;
  }
  console.log(`source strings: ${src.length}`);
  process.exit(bad ? 1 : 0);
}
