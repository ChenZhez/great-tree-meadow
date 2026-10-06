/* Validate both imported and stored progress before it reaches game state. */
function migrateSave(input) {
  const bad = () => {
    throw new TypeError('Invalid save');
  };
  const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const number = (v, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  const count = (v, max = Number.MAX_SAFE_INTEGER) => number(v, 0, max) && Number.isInteger(v);
  const id = (v) =>
    typeof v === 'string' &&
    /^[a-z][a-z0-9_-]{0,63}$/.test(v) &&
    !['constructor', 'prototype', '__proto__'].includes(v);
  const text = (v) => typeof v === 'string' && v.length <= 256;
  const array = (v, test, max = 1024) => Array.isArray(v) && v.length <= max && v.every(test);
  const record = (v, test) => object(v) && Object.entries(v).every(([k, x]) => id(k) && test(x, k));
  const style = (v) =>
    object(v) && count(v.wall, 4) && count(v.floor, 3) && Object.keys(v).every((k) => ['wall', 'floor'].includes(k));
  if (!object(input)) bad();
  const version = input.saveVersion === undefined ? 0 : input.saveVersion;
  if (!count(version, 1) || !Array.isArray(input.seeds)) bad();
  const schema = {
    saveVersion: (v) => count(v, 1),
    seeds: (v) => array(v, id, 12),
    zones: (v) => array(v, id, 64),
    wps: (v) => array(v, id),
    shards: (v) => array(v, (x) => count(x)),
    unlock: (v) => array(v, id),
    ach: (v) => array(v, id),
    done: (v) => typeof v === 'boolean',
    doneShown: (v) => typeof v === 'boolean',
    xylo: (v) => typeof v === 'boolean',
    coins: count,
    love: count,
    wish: count,
    outfit: (v) => count(v, 2),
    inv: (v) => record(v, (x) => count(x)),
    fishBag: (v) => record(v, (x) => count(x)),
    bugBag: (v) => record(v, (x) => count(x)),
    seedBag: (v) => record(v, (x) => count(x)),
    bugLog: (v) => record(v, (x) => count(x)),
    stats: (v) => record(v, (x) => count(x)),
    fishLog: (v) =>
      record(
        v,
        (x) => object(x) && count(x.n) && number(x.max) && Object.keys(x).every((k) => ['n', 'max'].includes(k)),
      ),
    room: style,
    rooms: (v) => record(v, (x, k) => ['main', 'west', 'east', 'north'].includes(k) && style(x)),
    ext: (v) => record(v, (x, k) => ['west', 'east', 'north'].includes(k) && count(x, 1)),
    home: (v) =>
      v === null ||
      array(
        v,
        (a) =>
          Array.isArray(a) &&
          a.length >= 4 &&
          a.length <= 6 &&
          id(a[0]) &&
          number(a[1], -100, 100) &&
          number(a[2], -100, 100) &&
          count(a[3], 3) &&
          (a.length < 5 || count(a[4], 3)) &&
          (a.length < 6 ||
            a[5] === 0 ||
            a[5] === null ||
            (object(a[5]) &&
              ['berry', 'carrot', 'pumpkin', 'mush', 'sunflower'].includes(a[5].crop) &&
              count(a[5].t0) &&
              count(a[5].w, 3) &&
              Object.keys(a[5]).every((k) => ['crop', 't0', 'w'].includes(k)))),
      ),
    photos: (v) =>
      array(
        v,
        (p) =>
          object(p) &&
          text(p.cap) &&
          typeof p.url === 'string' &&
          p.url.length <= 2000000 &&
          (p.url === '' || /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(p.url)) &&
          Object.keys(p).every((k) => ['url', 'cap'].includes(k)),
        4,
      ),
    tasks: (v) =>
      object(v) &&
      typeof v.day === 'string' &&
      /^\d{4}-\d{1,2}-\d{1,2}$/.test(v.day) &&
      array(
        v.list,
        (o) =>
          object(o) &&
          typeof o.k === 'string' &&
          /^(fish|bug|cook|pet|shard|sell|harvest|photo|ingred|birds|place|visit:[a-z][a-z0-9_-]*)$/.test(o.k) &&
          count(o.n) &&
          o.n > 0 &&
          count(o.c, o.n) &&
          count(o.r) &&
          typeof o.done === 'boolean' &&
          (o.z === undefined || text(o.z)) &&
          Object.keys(o).every((k) => ['k', 'n', 'c', 'r', 'done', 'z'].includes(k)),
        3,
      ) &&
      Object.keys(v).every((k) => ['day', 'list'].includes(k)),
  };
  for (const [k, v] of Object.entries(input)) {
    if (!Object.hasOwn(schema, k) || !schema[k](v)) bad();
  }
  const result = { ...input, saveVersion: 1, zones: input.zones || [] };
  for (const k of ['seeds', 'zones', 'wps', 'shards', 'unlock', 'ach']) {
    if (result[k]) result[k] = [...new Set(result[k])];
  }
  return result;
}
