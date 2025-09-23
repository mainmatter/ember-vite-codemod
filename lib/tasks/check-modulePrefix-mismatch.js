import { ExitError } from '../utils/exit.js';
import { getAppName } from '../utils/get-app-name.js';
import { readFile } from 'node:fs/promises';

export async function checkModulePrefixMisMatch() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));
  const modulePrefix = await getAppName();

  if (packageJSON.name === modulePrefix) return;

  throw new ExitError(
    `Unexpected modulePrefix mismatch! package.json#name is ${packageJSON.name}, but modulePrefix is ${modulePrefix}. These two values should match`,
  );
}
