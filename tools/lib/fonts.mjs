// Fonts: downloaded from a pinned google/fonts commit (checked by SHA-256), subset to the characters
// the game actually uses, and embedded as WOFF2 so the build runs offline and loads nothing remotely.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import subsetFont from 'subset-font';

const COMMIT = '9710da1eacb3be272583c3224dcb70f9da6eadbb';
const BASE = `https://raw.githubusercontent.com/google/fonts/${COMMIT}/ofl`;

export const FONT_FILES = [
  {
    file: 'Nunito[wght].ttf',
    url: `${BASE}/nunito/Nunito%5Bwght%5D.ttf`,
    sha256: 'bb55a5ca5c2042335b3991af27c4d0705d0ef41cac6164ac737fd8f2a1e85207',
  },
  {
    file: 'ZCOOLXiaoWei-Regular.ttf',
    url: `${BASE}/zcoolxiaowei/ZCOOLXiaoWei-Regular.ttf`,
    sha256: 'a42b620140f493db42f741351dfbf343c0936d58588ee8004b8b2a218d997ff1',
  },
  {
    file: 'NotoSansSC[wght].ttf',
    url: `${BASE}/notosanssc/NotoSansSC%5Bwght%5D.ttf`,
    sha256: 'a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da',
  },
  {
    file: 'NotoSansJP[wght].ttf',
    url: `${BASE}/notosansjp/NotoSansJP%5Bwght%5D.ttf`,
    sha256: 'c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f',
  },
  {
    file: 'KiwiMaru-Medium.ttf',
    url: `${BASE}/kiwimaru/KiwiMaru-Medium.ttf`,
    sha256: 'b2659f300a7d48c3f29eb273ffc5e1b26cc416ac8c37ff6bb2f3e43c2f4d235a',
  },
];

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

export async function ensureFonts(root) {
  const dir = path.join(root, 'fonts');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of FONT_FILES) {
    const p = path.join(dir, f.file);
    if (fs.existsSync(p) && sha256(fs.readFileSync(p)) === f.sha256) continue;
    process.stdout.write(`downloading ${f.file} ... `);
    const res = await fetch(f.url);
    if (!res.ok) throw new Error(`could not download ${f.url} (HTTP ${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (sha256(buf) !== f.sha256) throw new Error(`checksum mismatch for ${f.file}`);
    fs.writeFileSync(p, buf);
    console.log(`${(buf.length / 1048576).toFixed(1)} MB`);
  }
  return dir;
}

/** Characters each font has to cover, taken from the page source and the locale tables. */
function charSets(root, source) {
  const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
  const en = Object.values(readJson('src/locales/en.json')).join('');
  const ja = Object.values(readJson('src/locales/ja.json')).join('');
  const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
  const wide = (c) => c.codePointAt(0) >= 0x2e80;
  const uniq = (s) => [...new Set(s)].join('');
  return {
    latin: uniq(ascii + '’‘“”…—–·•×♥★☆→←°é' + [...en].filter((c) => !wide(c)).join('')),
    zh: uniq([...(source + '，。！？…「」：、（）—～·♥★☆中文')].filter(wide).join('')),
    ja: uniq([...(ja + '日本語、。「」『』！？（）・ー〜…：♥★☆')].filter(wide).join('')),
  };
}

export async function buildFontCss(root, source) {
  const dir = await ensureFonts(root);
  const cs = charSets(root, source);
  const faces = [
    ['Nunito', 'Nunito[wght].ttf', cs.latin, [400, 600, 800]],
    ['ZCOOL XiaoWei', 'ZCOOLXiaoWei-Regular.ttf', cs.zh, [400]],
    ['Noto Sans SC', 'NotoSansSC[wght].ttf', cs.zh, [400, 500]],
    ['Noto Sans JP', 'NotoSansJP[wght].ttf', cs.ja, [400, 500]],
    ['Kiwi Maru', 'KiwiMaru-Medium.ttf', cs.ja, [500]],
  ];
  let css = '';
  for (const [family, file, text, weights] of faces) {
    const buf = fs.readFileSync(path.join(dir, file));
    for (const w of weights) {
      const opts = { targetFormat: 'woff2' };
      if (file.includes('[wght]')) opts.variationAxes = { wght: w };
      const out = await subsetFont(buf, text, opts);
      css +=
        `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:block;` +
        `src:url(data:font/woff2;base64,${out.toString('base64')}) format('woff2')}\n`;
    }
  }
  return css;
}
