import { readFile } from 'node:fs/promises';
import semver from 'semver';
import { ExitError } from '../utils/exit.js';

export default async function ensureEmberCli() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));

  const emberSource =
    packageJSON['devDependencies']?.['ember-source'] ||
    packageJSON['dependencies']?.['ember-source'];
  if (
    semver.lt(
      semver.coerce(emberSource, { includePrerelease: true }),
      semver.coerce('3.28.0', { includePrerelease: true }),
    )
  ) {
    throw new ExitError(
      `ember-source ${emberSource} (< 3.28) was detected. Vite support is available from Ember 3.28 onwards.`,
    );
  }

  const emberCli =
    packageJSON['devDependencies']?.['ember-cli'] ||
    packageJSON['dependencies']?.['ember-cli'];
  if (
    semver.lt(
      semver.coerce(emberCli, { includePrerelease: true }),
      semver.coerce('4.12.0', { includePrerelease: true }),
    )
  ) {
    throw new ExitError(
      `ember-cli ${emberCli} (< 4.12) was detected. Vite support requires at least ember-cli 4.12. You can update ember-cli independently of ember-source, Vite support is available from ember-source 3.28 onwards.`,
    );
  }
}
