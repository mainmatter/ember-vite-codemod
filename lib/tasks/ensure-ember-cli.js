import semver from 'semver';
import { ExitError } from '../utils/exit.js';
import { resolveVersion } from '../utils/resolve-version.js';

export default async function ensureEmberCli() {
  const emberSource = resolveVersion('ember-source');

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

  const emberCli = resolveVersion('ember-cli');

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
