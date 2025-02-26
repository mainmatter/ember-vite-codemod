import { readFile } from 'node:fs/promises';

export default async function ensureNoUnsupportedDeps() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));

  const hasEmberFetch =
    packageJSON['dependencies']?.['ember-fetch'] ||
    packageJSON['devDependencies']?.['ember-fetch'];
  if (hasEmberFetch) {
    console.log(
      'Your app contains a dependency to ember-fetch. ember-fetch behaves a way that is incompatible with modern JavaScript tooling, including building with Vite.',
    );
    console.log(
      'Please remove ember-fetch dependency then run this codemod again. Check out https://github.com/emberjs/rfcs/pull/1065 to see recommended alternatives.',
    );
    process.exit(1);
  }

  // What if webpack is for @embroider/webpack?
  // const hasWebpack = packageJSON['dependencies']['ember-fetch'];
}
