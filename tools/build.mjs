#!/usr/bin/env node
// Builds the game into a single self-contained HTML file.
//
//   node tools/build.mjs            -> dist/index.html  (release: fonts embedded, dev hooks removed)
//   node tools/build.mjs --dev      -> build/dev.html   (keeps window.__game for tests, system fonts)
//   node tools/build.mjs --dev --fonts   dev build with the embedded fonts
//
// The JavaScript sources share one scope: they are concatenated in SOURCES order and wrapped in a
// single IIFE. Function declarations are hoisted, so earlier files may call functions defined later,
// but top-level code may only use `const`/`let` values that were already declared above it.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildFontCss } from './lib/fonts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const DEV = args.has('--dev');
const WITH_FONTS = !DEV || args.has('--fonts');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

export const SOURCES = [
  'core.js',
  'i18n.js',
  'characters.js',
  'world-base.js',
  'world-inner.js',
  'world-assemble.js',
  'world-landmarks.js',
  'world-outer.js',
  'save.js',
  'game.js',
  'companion.js',
  'home.js',
  'systems.js',
  'settings.js',
  'main.js',
];
const THREE_FILES = [
  'build/three.min.js',
  'examples/js/shaders/CopyShader.js',
  'examples/js/shaders/LuminosityHighPassShader.js',
  'examples/js/postprocessing/EffectComposer.js',
  'examples/js/postprocessing/RenderPass.js',
  'examples/js/postprocessing/ShaderPass.js',
  'examples/js/postprocessing/UnrealBloomPass.js',
];

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/** Removes `// #if DEV` ... `// #endif` blocks from release builds. */
function preprocess(code) {
  if (DEV) return code;
  return code.replace(/^[ \t]*\/\/ #if DEV\n[\s\S]*?^[ \t]*\/\/ #endif\n?/gm, '');
}

export function loadLocales() {
  const out = {};
  for (const lang of ['en', 'ja']) out[lang] = JSON.parse(read(`src/locales/${lang}.json`));
  return out;
}

function bundleApp() {
  const locales = loadLocales();
  const parts = [
    '(function () {',
    "'use strict';",
    `const VERSION = ${JSON.stringify(pkg.version)};`,
    `const LOCALES = ${JSON.stringify(locales)};`,
  ];
  for (const f of SOURCES) parts.push(`/* ---- ${f} ---- */`, preprocess(read(`src/js/${f}`)));
  parts.push('})();');
  const code = parts.join('\n');
  new vm.Script(code, { filename: 'app.js' }); // syntax check
  return code;
}

function inlineScript(code) {
  // Keep the script element intact even if the code contains "</script".
  return '<script>' + code.replace(/<\/script/gi, '<\\/script') + '</script>';
}

async function main() {
  const t0 = Date.now();
  const app = bundleApp();
  const three = THREE_FILES.map((f) => fs.readFileSync(path.join(ROOT, 'node_modules/three', f), 'utf8'));
  let html = read('src/index.html');
  const css = read('src/styles.css');
  const fontCss = WITH_FONTS ? await buildFontCss(ROOT, html + app) : '';
  html = html
    .replace('/* @styles */', () => css)
    .replace('<!-- @fonts -->', () => (fontCss ? `<style>${fontCss}</style>` : ''))
    .replace('<!-- @scripts -->', () => three.map(inlineScript).join('\n') + '\n' + inlineScript(app));

  // Keep the component licenses with the standalone page, including on static hosts.
  const notices = [read('THIRD_PARTY_NOTICES.md')];
  for (const file of fs.readdirSync(path.join(ROOT, 'licenses')).sort()) notices.push(read(`licenses/${file}`));
  html += '\n<!--\n' + notices.join('\n\n').replace(/--/g, '&#45;&#45;') + '\n-->\n';

  if (!DEV) {
    if (/window\.__game/.test(html)) throw new Error('dev hook leaked into the release build');
    const ext = html.match(/(?:src|href)\s*=\s*["']https?:\/\/[^"']+/g);
    if (ext) throw new Error('release build references external resources: ' + ext.join(', '));
  }
  const out = DEV ? 'build/dev.html' : 'dist/index.html';
  fs.mkdirSync(path.join(ROOT, path.dirname(out)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, out), html);
  console.log(`${out}  ${(html.length / 1024 / 1024).toFixed(2)} MB  (${Date.now() - t0} ms)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
