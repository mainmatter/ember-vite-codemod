import { readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const blueprintPath = dirname(require.resolve('@embroider/app-blueprint'));

const files = [['vite.config.mjs', 'files-override/shared/vite.config.mjs']];

const jsFiles = [['babel.config.cjs', 'files/js/babel.config.cjs']];

async function writeIfMissing([destination, source]) {
  try {
    await stat(destination);
  } catch {
    return writeFile(destination, await readFile(join(blueprintPath, source)));
  }

  console.warn(`File '${destination}' already exists so we are skipping it.`);
}

// TODO add project type detection
export default async function addMissingFiles(
  { projectType } = { projectType: 'js' },
) {
  const filesToAdd = [...files];

  if (projectType === 'js') {
    filesToAdd.push(...jsFiles);
  }

  for (let file of filesToAdd) {
    await writeIfMissing(file);
  }
}
