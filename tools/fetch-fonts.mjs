#!/usr/bin/env node
// Downloads the fonts used by the build into fonts/ (checksummed). The build also does this on demand.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureFonts } from './lib/fonts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
ensureFonts(ROOT).then(
  () => console.log('fonts ready'),
  (e) => {
    console.error(e.message);
    process.exit(1);
  },
);
