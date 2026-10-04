# Architecture

This document describes how the game is put together. It is meant for anyone
reading or changing the code.

## Build and module structure

The game is plain JavaScript without a module bundler. `tools/build.mjs`
concatenates the files in `src/js/` in a fixed order (listed in `SOURCES`),
wraps them in one function scope, injects the version and the translation
tables, and inlines the result, three.js, the CSS and the subset fonts into a
single HTML page.

Because everything shares one scope:

- function declarations are hoisted, so earlier files may call functions that
  are defined in later files (`buildWorld` in `game.js` calls `buildStall` in
  `systems.js`, for example);
- top-level code may only use `const`/`let` values declared above it.

Code between `// #if DEV` and `// #endif` exists only in the development build.
It exposes `window.__game`, which the tests use to drive the game.

## World registry (`world-base.js`)

All areas register what they need in the object `W`:

| Field | Purpose |
|---|---|
| `W.cols.ground`, `W.cols.deck` | circle colliders per walkable level |
| `W.raised`, `W.hills` | raised ground (discs, rectangles, path segments) and domed hills |
| `W.zones` | named areas, used for discovery, the map and fishing tables |
| `W.inter` | interaction points: `{ id, x, z, r, label, act, enabled, level }` |
| `W.seeds`, `W.wps`, `W.shards` | glow seeds, teleport stones, star shards |
| `W.lod` | groups hidden beyond a distance from the camera |
| `W.camCols` | spheres the camera avoids |
| `W.upd` | per-frame callbacks for animated scenery |
| `W.dyn` | named handles to animated objects |

Ground height is `raisedH(x, z)`, the highest of all raised shapes and hills,
with the lake surface at 0. The player can be on three levels: `ground`, the
tree-top `deck`, and `home`, which is a separate scene.

Each area is built by a function wrapped with `wrap(builder, x, z, far)`, which
puts it in its own group for distance culling. Static meshes are merged per
material with `mergeGroup()`; anything that moves is marked
`userData.dynamic = true` so it is left alone.

## Collisions

Colliders are circles (`col`) and lines of circles (`colLine`). Most of them
are generated: after the world is built, `autoCols()` walks the merged
geometry, looks at each object's bounding box in the body-height band
(0.5–1.45 m above its ground) and adds a circle for compact objects or a line
for long thin ones. Large structures carry hand-placed colliders instead.
Objects marked `userData.walk = true` can be walked through.

Queries go through an 8 m grid (`colsNear`). `solidAt` and `clearLine` are
used by the player, the companion and the camera.

## The companion

Dumpling's behavior is a small state machine (`AI.state`): follow, sniff,
call, happy, eat, fetch, feed, dance, trick, nap, roll, splash, chase, slide
and goto. `pigExtra()` in `companion.js` returns a target and speed for the
states defined there.

Following uses breadcrumbs: the player drops a point every 0.7 m. When the
straight line to the player is blocked, the companion walks to the newest
breadcrumb it can see. If it is stuck for 2.5 s or falls far behind, it is
moved to a safe breadcrumb behind the player.

## Rendering

- Toon shading with a three-step gradient map and inverted-hull outlines whose
  width stays constant on screen. Outlines and instanced plants share a wind
  sway in the vertex shader.
- The lake is one large plane. Each frame the world is rendered mirrored into
  a lower-resolution target that the water shader samples with small
  distortions, ripples and sparkles. On the low quality profile and on touch
  devices the mirror image is refreshed every other frame.
- Bloom (UnrealBloomPass) is applied with a high threshold so that only small
  light sources glow. Day and night are interpolated by `applyEnv(n)`, which
  sets the sky, fog, lights, water, bloom and anything registered as a night
  glow.
- Waterfalls are two curved sheets with a scrolling streak shader that is lit
  by the day/night value, plus foam, spray and mist.

Quality profiles (`applyQuality` in `settings.js`) set the pixel ratio, shadow
map size, mirror resolution and refresh rate, bloom and the instanced plant
layer. On "auto", the game starts at the middle profile and drops to "low"
once if the frame rate stays below about 26 fps.

## The house (`home.js`)

The house is a separate scene. The characters are moved into it when you go
home. Rooms are rectangles: the living room plus optional west, east and north
extensions in two sizes. `buildShell()` computes the outer walls, shared walls
with door openings, windows and the wall colliders from the room rectangles.
Walls between the camera and the player are hidden.

Furniture types live in `FURN` (`name`, category, footprint, build function,
interaction). A placed item is stored as `[type, x, z, rotation, state, data]`.
`fits()` checks that an item lies inside one room, does not overlap other
furniture (rugs excepted) and keeps the front door clear.

## Systems (`systems.js`)

Coins, fishing (a timing mini-game), bug catching, the field guide,
achievements (conditions checked every two seconds), daily tasks (three per
day, chosen with the date as a seed), the vegetable patch (grows in real time,
also while the game is closed) and the shop.

## Localization

Game text is written in Chinese in the source. `src/locales/en.json` and
`src/locales/ja.json` map every source string to its translation.

`tr(s, vars)` returns the translation for the current language. Strings with
numbers or names use templates such as `tr('钓 {n} 条鱼', { n })`. For text
that is still assembled from pieces, any known fragments inside the string are
translated. A MutationObserver translates DOM text, `aria-label`, `title` and
`placeholder`, so most code assigns source strings directly; canvas text calls
`tr()` itself. Elements marked `data-notr` are never translated.

`npm run i18n` lists strings that have no translation. In the development
build, `__game.I18N_MISS` collects strings that could not be fully translated
at runtime, and the tests fail if any appear.

To add text: write the Chinese string in the code, add the English and
Japanese entries to the two locale files, then run `npm run i18n`.

## Save data

Progress is stored in `localStorage` under `great-tree-meadow-v1`, settings
under `great-tree-meadow-settings`. The save object carries a `saveVersion`;
`migrateSave()` upgrades older data step by step and is also applied to
imported saves. If the browser refuses to store data, the game shows a notice
once and keeps running. Saves can be exported and imported as text from the
settings.

## Input

All keyboard input goes through one handler at the end of `game.js`. While a
dialog is open only `Esc` is handled; fishing and decorating get their own key
sets. Dialogs are opened and closed through `openModal()`/`closeModal()`,
which keep a stack so the newest dialog is on top, move focus, and pause or
resume the game.

Touch controls act on `pointerdown`. A following `click` is ignored, so a tap
never triggers an action twice; a `click` without a recent pointer press comes
from the keyboard and is handled normally.
