import { existsSync, mkdirSync } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const blueprintPath = dirname(require.resolve('@embroider/app-blueprint'));

const files = [
  ['vite.config.mjs', 'files-override/shared/vite.config.mjs'],
  [
    'app/config/environment.js',
    'files-override/shared/app/config/environment.js',
  ],
];

const jsFiles = [['babel.config.cjs', 'files/js/babel.config.cjs']];

const tsFiles = [
  ['babel.config.cjs', 'files/ts/babel.config.cjs'],
  ['types/index.d.ts', 'files-override/ts/types/index.d.ts'],
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

  console.warn(`Skiping file '${destination}' since it already exists.`);
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
