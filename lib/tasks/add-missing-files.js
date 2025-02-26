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

const tsFiles = [['babel.config.cjs', 'files/ts/babel.config.cjs']];

async function writeIfMissing([destination, source]) {
  try {
    await stat(destination);
  } catch {
    return writeFile(destination, await readFile(join(blueprintPath, source)));
  }

  console.warn(`Skiping file '${destination}' since it already exists.`);
}

export default async function addMissingFiles(
  { projectType } = { projectType: 'js' },
) {
  const filesToAdd = [...files];

  if (projectType === 'js') {
    filesToAdd.push(...jsFiles);
  } else if (projectType === 'ts') {
    filesToAdd.push(...tsFiles);
  }

  for (let file of filesToAdd) {
    await writeIfMissing(file);
  }
}
