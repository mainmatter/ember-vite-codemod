import { readFile } from 'node:fs/promises';
import { ExitError } from '../utils/exit.js';
import semver from 'semver';
import { resolveVersion } from '../utils/resolve-version.js';

function checkDependency(packageJSON, dep, message) {
  const hasDep =
    packageJSON['dependencies']?.[dep] || packageJSON['devDependencies']?.[dep];
  if (hasDep) {
    return message;
  }
}

export default async function ensureNoUnsupportedDeps() {
  const emberResults = await ensureEmberCli();
  const addonsResults = await ensureKnownAddons();
  const logs = [...emberResults, ...addonsResults];
  if (logs.length) {
    throw new ExitError([
      'Detected unsupported dependencies:',
      ...logs.map((log) => `\n* ${log}`),
    ]);
  }
}

export async function ensureKnownAddons() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));
  const logs = [
    checkDependency(
      packageJSON,
      'ember-fetch',
      `Your app contains a dependency to ember-fetch. ember-fetch behaves a way that is incompatible with modern JavaScript tooling, including building with Vite.
Please remove ember-fetch dependency then run this codemod again. Check out https://rfcs.emberjs.com/id/1065-remove-ember-fetch to see recommended alternatives.`,
    ),
    checkDependency(
      packageJSON,
      'ember-composable-helpers',
      `Your app contains a dependency to ember-composable-helpers. ember-composable-helpers contains a "won't fix" Babel issue that makes it incompatible with Vite.
Please move from the original ember-composable-helpers to @nullvoxpopuli/ember-composable-helpers then run this codemod again. Checkout the first section of the repository's README: https://github.com/NullVoxPopuli/ember-composable-helpers`,
    ),
    checkDependency(
      packageJSON,
      'ember-cli-mirage',
      `Your app contains a dependency to ember-cli-mirage. ember-cli-mirage doesn't work correctly with Vite.
Please move from ember-cli-mirage to ember-mirage then run this codemod again. Checkout https://github.com/bgantzler/ember-mirage/blob/main/docs/migration.md for guidance.`,
    ),
    checkDependency(
      packageJSON,
      'ember-css-modules',
      `Your app contains a dependency to ember-css-modules. ember-css-modules behavior is incompatible with Vite, you should migrate to a different solution to manage your CSS modules.
There is a recommended migration path that you can follow for a file by file migration to ember-scoped-css, which is compatible with Vite. Checkout https://github.com/BlueCutOfficial/css-modules-to-scoped-css`,
    ),
  ];

  return logs.filter((log) => Boolean(log));
}

export async function ensureEmberCli() {
  const emberSource = resolveVersion('ember-source');
  const logs = [];

  if (
    semver.lt(
      semver.coerce(emberSource, { includePrerelease: true }),
      semver.coerce('3.28.0', { includePrerelease: true }),
    )
  ) {
    logs.push(
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
    logs.push(
      `ember-cli ${emberCli} (< 4.12) was detected. Vite support requires at least ember-cli 4.12. You can update ember-cli independently of ember-source, Vite support is available from ember-source 3.28 onwards.`,
    );
  }

  return logs;
}
