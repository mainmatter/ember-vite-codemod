import { existsSync, mkdirSync } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const blueprintPath = dirname(require.resolve('@ember/app-blueprint'));

const files = [
  ['vite.config.mjs', 'files/vite.config.mjs'],
  [
    'app/config/environment.js',
    'files/app/config/environment.js',
  ],
];

const jsFiles = [['babel.config.cjs', 'files/_js_babel.config.cjs']];

const tsFiles = [
  ['babel.config.cjs', 'files/_ts_babel.config.cjs'],
];

async function writeIfMissing([destination, source]) {
  try {
    await stat(destination);
  } catch {
    if (!existsSync(dirname(destination))) {
      mkdirSync(dirname(destination));
    }
    return writeFile(destination, await readFile(join(blueprintPath, source)));
  }

  console.warn(`Skipping file '${destination}' since it already exists.`);
}

export default async function addMissingFiles(options = { ts: false }) {
  const filesToAdd = [...files];

  if (options.ts) {
    filesToAdd.push(...tsFiles);
  } else {
    filesToAdd.push(...jsFiles);
  }

  for (let file of filesToAdd) {
    await writeIfMissing(file);
  }
}
