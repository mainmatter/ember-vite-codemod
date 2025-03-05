import { readFile } from 'node:fs/promises';

export default async function ensureNoUnsupportedDeps() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));
  let shouldExit = false;

  const hasEmberFetch =
    packageJSON['dependencies']?.['ember-fetch'] ||
    packageJSON['devDependencies']?.['ember-fetch'];
  if (hasEmberFetch) {
    console.log(
      'Your app contains a dependency to ember-fetch. ember-fetch behaves a way that is incompatible with modern JavaScript tooling, including building with Vite.',
    );
    console.log(
      'Please remove ember-fetch dependency then run this codemod again. Check out https://github.com/emberjs/rfcs/pull/1065 to see recommended alternatives.\n',
    );
    shouldExit = true;
  }

  const hasEmberComposableHelpers =
    packageJSON['dependencies']?.['ember-composable-helpers'] ||
    packageJSON['devDependencies']?.['ember-composable-helpers'];
  if (hasEmberComposableHelpers) {
    console.log(
      'Your app contains a dependency to ember-composable-helpers. ember-composable-helpers contains a "won\'t fix" Babel issue that makes it incompatible with Vite.',
    );
    console.log(
      "Please move from the original ember-composable-helpers to @nullvoxpopuli/ember-composable-helpers then run this codemod again. Checkout the first section of the repository's README: https://github.com/NullVoxPopuli/ember-composable-helpers\n",
    );
    shouldExit = true;
  }

  const hasEmberCliMirage =
    packageJSON['dependencies']?.['ember-cli-mirages'] ||
    packageJSON['devDependencies']?.['ember-cli-mirage'];
  if (hasEmberCliMirage) {
    console.log(
      "Your app contains a dependency to ember-cli-mirage. ember-cli-mirage doesn't work correctly with Vite.",
    );
    console.log(
      'Please move from ember-cli-mirage to ember-mirage then run this codemod again. Checkout https://github.com/bgantzler/ember-mirage/blob/main/docs/migration.md for guidance.\n',
    );
    shouldExit = true;
  }

  if (shouldExit) {
    process.exit(1);
  }

  // What if webpack is for @embroider/webpack?
  // const hasWebpack = packageJSON['dependencies']['ember-fetch'];
}
