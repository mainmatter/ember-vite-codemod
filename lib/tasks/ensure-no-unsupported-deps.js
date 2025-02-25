import { readFile } from 'node:fs/promises';

export default async function ensureNoUnsupportedDeps() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));

  const hasEmberFetch = packageJSON['dependencies']['ember-fetch'] || packageJSON['devDependencies']['ember-fetch'];
  if (hasEmberFetch) {
    console.log('Your app contains a dependency to ember-fetch. The way ember-fetch requires to import fetch from \'fetch\' cannot make sense in Vite world. ember-fetch should be removed in favor of using the browser\' Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API.');
    console.log('Please remove ember-fetch dependency then run this codemod again. Check out https://github.com/emberjs/rfcs/pull/1065 to see recommended alternative.')
    process.exit(1);
  }

  // What if webpack is for @embroider/webpack?
  // const hasWebpack = packageJSON['dependencies']['ember-fetch'];
}