import { existsSync, mkdirSync } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { removeTypes } from 'babel-remove-types';

const require = createRequire(import.meta.url);

const blueprintPath = dirname(require.resolve('@ember/app-blueprint'));

const files = [
  ['vite.config.mjs', 'files/vite.config.mjs'],
  ['.env.development', 'files/.env.development'],
];

const jsFiles = [
  ['babel.config.cjs', 'conditional-files/_js_babel.config.mjs'],
  ['app/config/environment.js', 'files/app/config/environment.ts'],
];

const tsFiles = [
  ['babel.config.cjs', 'conditional-files/_ts_babel.config.mjs'],
  ['app/config/environment.ts', 'files/app/config/environment.ts'],
];

async function writeIfMissing([destination, source], options = { ts: false }) {
  try {
    await stat(destination);
  } catch {
    if (!existsSync(dirname(destination))) {
      mkdirSync(dirname(destination));
    }

    let sourceContents = await readFile(join(blueprintPath, source), 'utf8');
    if (!options.ts && source.endsWith('.ts')) {
      sourceContents = await removeTypes(sourceContents);
    }
    return writeFile(destination, sourceContents);
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
    await writeIfMissing(file, options);
  }
}
