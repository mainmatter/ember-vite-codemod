import { readFile } from 'node:fs/promises';

const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));

function checkDependency(dep, message) {
  const hasDep =
    packageJSON['dependencies']?.[dep] || packageJSON['devDependencies']?.[dep];
  if (hasDep) {
    console.log(message);
    return true;
  }
  return false;
}

export default async function ensureNoUnsupportedDeps() {
  const shouldExit =
    checkDependency(
      'ember-fetch',
      `Your app contains a dependency to ember-fetch. ember-fetch behaves a way that is incompatible with modern JavaScript tooling, including building with Vite.
Please remove ember-fetch dependency then run this codemod again. Check out https://github.com/emberjs/rfcs/pull/1065 to see recommended alternatives.
    `,
    ) ||
    checkDependency(
      'ember-composable-helpers',
      `Your app contains a dependency to ember-composable-helpers. ember-composable-helpers contains a "won't fix" Babel issue that makes it incompatible with Vite.
Please move from the original ember-composable-helpers to @nullvoxpopuli/ember-composable-helpers then run this codemod again. Checkout the first section of the repository's README: https://github.com/NullVoxPopuli/ember-composable-helpers
    `,
    ) ||
    checkDependency(
      'ember-cli-mirage',
      `Your app contains a dependency to ember-cli-mirage. ember-cli-mirage doesn't work correctly with Vite.
Please move from ember-cli-mirage to ember-mirage then run this codemod again. Checkout https://github.com/bgantzler/ember-mirage/blob/main/docs/migration.md for guidance.
    `,
    ) ||
    checkDependency(
      'ember-css-modules',
      `Your app contains a dependency to ember-css-modules. ember-css-modules behavior is incompatible with Vite, you should migrate to a different solution to manage your CSS modules.
There is a recommended migration path that you can follow for a file by file migration to ember-scoped-css, which is compatible with Vite. Checkout https://github.com/BlueCutOfficial/css-modules-to-scoped-css
    `,
    );

  if (shouldExit) {
    process.exit(1);
  }
}
