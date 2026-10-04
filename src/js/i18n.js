/* =================== localisation: English · 中文 · 日本語 ===================
   The game text is authored in Chinese, the original script. LOCALES (injected by the build from
   src/locales/*.json) maps every source string to its English and Japanese translation.

   tr(s) looks a string up for the current language: exact match first; if there is none (text that the
   code builds by concatenation), every known fragment inside the string is translated, longest first,
   and the punctuation is converted. A MutationObserver translates DOM text, aria-label, title and
   placeholder automatically, so most code just assigns source strings. Canvas text must call tr().
   Elements with [data-notr] are left alone. */
const SETTINGS_KEY = 'great-tree-meadow-settings';
const LANGS = ['en', 'zh', 'ja'];
const LANG_META = {
  en: { html: 'en', name: 'English', title: 'Great Tree Meadow' },
  zh: { html: 'zh-CN', name: '中文', title: '巨树花海' },
  ja: { html: 'ja', name: '日本語', title: '大樹と花の海' },
};
const SET_DEFAULTS = {
  lang: 'en',
  music: 0.8,
  sfx: 0.9,
  quality: 'auto',
  sens: 1,
  mini: true,
  keys: true,
  ts: 'm',
  fps: false,
  bright: 1,
  bloom: 1,
  fov: 42,
  calm: false,
  nausea: false,
  autoRot: true,
  follow: 'soft',
  camD: 'mid',
  invX: false,
  invY: false,
  runMode: 'hold',
  hand: 'r',
};
const SET = Object.assign(
  {},
  SET_DEFAULTS,
  (() => {
    try {
      const o = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return o && typeof o === 'object' ? o : {};
    } catch (e) {
      return {};
    }
  })(),
);
if (!LANGS.includes(SET.lang)) SET.lang = 'en';
if (!['auto', 'low', 'mid', 'high'].includes(SET.quality)) SET.quality = 'auto';
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(SET));
  } catch (e) {}
}
let LANG = SET.lang;
const HAN = /[\u3400-\u9fff]/;
const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/;
const PUNC = {
  en: [
    ['……', '… '],
    ['——', ' — '],
    ['，', ', '],
    ['。', '. '],
    ['！', '! '],
    ['？', '? '],
    ['：', ': '],
    ['、', ', '],
    ['（', ' ('],
    ['）', ') '],
    ['「', '“'],
    ['」', '”'],
    ['～', '~'],
    ['—', ' — '],
    ['；', '; '],
    ['　', ' '],
    ['·', ' · '],
  ],
  ja: [
    ['～', '〜'],
    ['·', '・'],
    ['，', '、'],
  ],
};
const TRC = { en: new Map(), ja: new Map() },
  TRX = {},
  TROUT = {};
const I18N_MISS = new Set();
/* strings that are already final (templates filled in by tr, or marked with trMark) */
const TR_DONE = new Set();
function trMark(s) {
  if (LANG !== 'zh') {
    if (TR_DONE.size > 400) TR_DONE.clear();
    TR_DONE.add(s);
  }
  return s;
}
function trRegex(lang) {
  if (TRX[lang]) return TRX[lang];
  const D = LOCALES[lang];
  const ks = Object.keys(D)
    .filter((k) => k.length > 0 && D[k] != null)
    .sort((a, b) => b.length - a.length);
  return (TRX[lang] = ks.length
    ? new RegExp(ks.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g')
    : /(?!)/g);
}
function trOut(lang) {
  return TROUT[lang] || (TROUT[lang] = new Set(Object.values(LOCALES[lang])));
}
function trIn(lang, s) {
  const D = LOCALES[lang],
    C = TRC[lang];
  if (C.has(s)) return C.get(s);
  let r;
  if (D[s] != null) r = D[s];
  else if (trOut(lang).has(s) || TR_DONE.has(s))
    return s; // already translated
  else {
    let hole = false;
    r = s.replace(trRegex(lang), (m) => D[m]);
    if (HAN.test(s.replace(trRegex(lang), ''))) {
      hole = true;
      I18N_MISS.add(s);
    }
    for (const [a, b] of PUNC[lang]) r = r.split(a).join(b);
    if (lang === 'en')
      r = r
        .replace(/ +/g, ' ')
        .replace(/ ([,.!?:;)])/g, '$1')
        .replace(/\( /g, '(')
        .trim();
    if (hole && lang === 'en') r = r.trim();
  }
  C.set(s, r);
  return r;
}
function tr(s, v) {
  if (s == null) return '';
  s = String(s);
  let r = s;
  if (LANG !== 'zh' && CJK.test(s)) r = trIn(LANG, s);
  if (v) {
    r = r.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
    trMark(r);
  }
  return r;
}
/* DOM auto-translation. Every node remembers its source text and the text we last wrote, so switching
   language re-translates from the source and our own writes never trigger another round. */
const I18N_SKIP = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'TEXTAREA']);
const I18N_ATTRS = ['aria-label', 'title', 'placeholder'];
function trText(n) {
  if (!n.isConnected) return;
  const p = n.parentElement;
  if (p && p.closest('[data-notr]')) return;
  const cur = n.nodeValue;
  if (n.__out === undefined || cur !== n.__out) {
    if (!CJK.test(cur)) {
      n.__src = undefined;
      n.__out = undefined;
      return;
    }
    n.__src = cur;
  }
  const src = n.__src,
    lead = src.match(/^\s*/)[0],
    tail = src.match(/\s*$/)[0];
  const want = LANG === 'zh' ? src : lead + tr(src.trim().replace(/[ \t]*\n[ \t]+/g, ' ')) + tail;
  n.__out = want;
  if (cur !== want) n.nodeValue = want;
}
function trAttrs(n) {
  for (const a of I18N_ATTRS) {
    if (!n.hasAttribute(a)) continue;
    const st = n.__attr || (n.__attr = {});
    const cur = n.getAttribute(a);
    let o = st[a];
    if (!o || cur !== o.out) {
      if (!CJK.test(cur)) {
        delete st[a];
        continue;
      }
      o = st[a] = { src: cur, out: null };
    }
    const want = LANG === 'zh' ? o.src : tr(o.src);
    o.out = want;
    if (cur !== want) n.setAttribute(a, want);
  }
}
function trNode(n) {
  if (n.nodeType === 3) {
    trText(n);
    return;
  }
  if (n.nodeType !== 1 || I18N_SKIP.has(n.tagName) || n.hasAttribute('data-notr')) return;
  trAttrs(n);
  n.childNodes.forEach(trNode);
}
const i18nObs = new MutationObserver((ms) => {
  try {
    for (const m of ms) {
      if (m.type === 'characterData') trText(m.target);
      else if (m.type === 'attributes') {
        if (m.target.nodeType === 1 && !m.target.closest('[data-notr]')) trAttrs(m.target);
      } else m.addedNodes.forEach(trNode);
    }
  } catch (e) {
    console.warn('i18n', e);
  }
});
i18nObs.observe(document.body, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: I18N_ATTRS,
});
function applyLang(l) {
  if (l && LANGS.includes(l) && l !== LANG) {
    LANG = SET.lang = l;
    saveSettings();
  } else if (l && LANGS.includes(l)) {
    SET.lang = l;
    saveSettings();
  }
  document.documentElement.lang = LANG_META[LANG].html;
  trNode(document.body);
  document.title = LANG_META[LANG].title;
  ['en', 'zh', 'ja'].forEach((k) => document.body.classList.toggle('lang-' + k, LANG === k));
  if (window.onLangChange) window.onLangChange();
}
/* font stack for canvas text in the current language */
function uiFont(weight, px) {
  const f = { en: '"Nunito",sans-serif', zh: '"Noto Sans SC",sans-serif', ja: '"Noto Sans JP",sans-serif' }[LANG];
  return weight + ' ' + px + 'px ' + f;
}
