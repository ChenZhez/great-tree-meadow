import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../src/js/save.js', import.meta.url), 'utf8'), context);
const validate = (value) => context.migrateSave(JSON.parse(JSON.stringify(value)));
const valid = {
  seeds: ['runes'],
  zones: ['hills'],
  coins: 42,
  outfit: 2,
  room: { wall: 4, floor: 3 },
  rooms: { main: { wall: 0, floor: 0 } },
  ext: { west: 1 },
  home: [['planter', -7.6, 4.8, 0, 0, { crop: 'berry', t0: 1720000000000, w: 2 }]],
  fishLog: { koi: { n: 2, max: 40.5 } },
  inv: { peach: 3 },
  photos: [{ url: 'data:image/jpeg;base64,/9j/AA==', cap: 'A day in the meadow' }],
  tasks: {
    day: '2026-10-6',
    list: [{ k: 'visit:hills', z: '<img src=x onerror=alert(1)>', n: 1, c: 0, r: 130, done: false }],
  },
};
assert.equal(validate(valid).saveVersion, 1);
assert.equal(JSON.stringify(validate(validate(valid))), JSON.stringify(validate(valid)));
assert.equal(JSON.stringify(validate({ seeds: ['runes', 'runes'] }).seeds), '["runes"]');
for (const value of [null, [], {}, 'save', { seeds: [], saveVersion: 2 }, { seeds: [], saveVersion: '1' }]) {
  assert.throws(() => validate(value));
}
for (const [field, value] of [
  ['zones', {}],
  ['coins', '42'],
  ['coins', -1],
  ['coins', null],
  ['outfit', 3],
  ['home', {}],
  ['home', [['bed', 0, '1', 0]]],
  ['home', [['constructor', 0, 0, 0]]],
  ['home', [['planter', 0, 0, 0, 0, { crop: 'unknown', t0: 0, w: 0 }]]],
  ['ext', { west: 2 }],
  ['ext', { unknown: 0 }],
  ['room', { wall: 5, floor: 0 }],
  ['fishBag', { koi: '<img src=x>' }],
  ['fishLog', { koi: { n: 1, max: '40' } }],
  ['stats', { constructor: 1 }],
  ['tasks', { day: '2026-10-6', list: [null] }],
  ['photos', [{ url: 'https://example.com/photo.jpg', cap: '' }]],
  ['photos', [{ url: 'data:image/svg+xml;base64,PHN2Zz4=', cap: '' }]],
  ['unknown', true],
  ['done', 'false'],
  ['seeds', [null]],
])
  assert.throws(() => validate({ ...valid, [field]: value }), field);
assert.throws(() => validate(JSON.parse('{"seeds":[],"__proto__":{"polluted":true}}')));
assert.throws(() => validate(JSON.parse('{"seeds":[],"inv":{"__proto__":1}}')));
assert.equal({}.polluted, undefined);
console.log('Save schema: legacy round-trip, nested types, ranges, versions, URL policy and prototype keys passed');
