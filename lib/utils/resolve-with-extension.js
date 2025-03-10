import { existsSync } from 'node:fs';

const extensions = ['.js', '.ts', '.cjs', '.mjs'];

/**
 * @param {string} filePath
 */
export function resolveWithExt(filePath) {
  for (let ext of extensions) {
    let candidate = filePath + ext;

    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Could not find ${filePath} with any of the extensions: ${extensions.join(', ')}`,
  );
}
