# Third-party notices

Great Tree Meadow includes the following third-party software. The released
game (`dist/index.html`) embeds three.js and subsets of the fonts listed below.

## three.js r128

- Source: https://github.com/mrdoob/three.js (npm package `three@0.128.0`)
- Files used: `build/three.min.js` and, from `examples/js`, `CopyShader`,
  `LuminosityHighPassShader`, `EffectComposer`, `RenderPass`, `ShaderPass`
  and `UnrealBloomPass`
- License: MIT

```
The MIT License

Copyright © 2010-2021 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Fonts

All fonts are licensed under the SIL Open Font License, Version 1.1. The build
embeds subsets that contain only the characters the game uses. The full
license text for each font is in `licenses/`.

| Font | Used for | Copyright | License file |
|---|---|---|---|
| Nunito | English text | Copyright 2014 The Nunito Project Authors | `licenses/OFL-nunito.txt` |
| ZCOOL XiaoWei | Chinese titles | Copyright 2018 The ZCOOL XiaoWei Project Authors | `licenses/OFL-zcoolxiaowei.txt` |
| Noto Sans SC | Chinese text | Copyright 2014-2021 Adobe, with Reserved Font Name 'Source' | `licenses/OFL-notosanssc.txt` |
| Noto Sans JP | Japanese text | Copyright 2014-2021 Adobe, with Reserved Font Name 'Source' | `licenses/OFL-notosansjp.txt` |
| Kiwi Maru | Japanese titles | Copyright 2020 The Kiwi Maru Project Authors | `licenses/OFL-kiwimaru.txt` |

The fonts are downloaded at build time from the google/fonts repository at a
fixed commit and verified by SHA-256 (see `tools/lib/fonts.mjs`).

## Build and test tools (not shipped)

`subset-font`, `fflate`, `playwright` and `prettier` are used only for building,
packaging, testing and formatting. Their licenses are listed in their npm
packages.
