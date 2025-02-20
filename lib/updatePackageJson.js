
// TODO: should we get this from the app/blueprint?

import { readFile, writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { console } from 'node:inspector';

const promiseExec = promisify(exec);

// These packages are used in the latest classic app blueprint,
// but they are no longer used in the Vite app blueprint so the
// codemod should remove them.
export const packagesToRemove = [
  '@babel/plugin-proposal-decorators',
  'broccoli-asset-rev',
  'ember-cli-app-version',
  'ember-cli-clean-css',
  'ember-cli-dependency-checker',
  'ember-cli-inject-live-reload',
  'ember-fetch', // used in the code?
  'ember-cli-sri',
  'ember-cli-terser',
  'loader.js',
  'webpack', // used to customize the build?
]

const packagesToAdd = [
  "@babel/plugin-transform-runtime@^7.26.9",
  "@ember/string@^4.0.0",
  "@embroider/compat@^4.0.0-alpha.0",
  "@embroider/config-meta-loader@^1.0.0-alpha.0",
  "@embroider/core@^4.0.0-alpha.0",
  "@embroider/vite@^1.0.0-alpha.0",
  "@rollup/plugin-babel@^6.0.4",
  "decorator-transforms@^2.3.0",
  "vite@^6.0.0"
]

export default async function updatePackageJson() {
  await removePackages();
  await addPackages();

  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));

  // Add app v2 meta
  packageJSON['ember-addon'] = {
    type: 'app',
    version: 2
  }
  packageJSON.exports = {
    './tests/*': './tests/*',
    './*': './app/*'
  }

  // Update commands
  packageJSON.scripts.build = 'vite build',
  packageJSON.scripts.lint = 'concurrently "pnpm:lint:*(!fix)" --names "lint:" --prefixColors auto',
  packageJSON.scripts['lint:css:fix'] = 'concurrently "pnpm:lint:css -- --fix"',
  packageJSON.scripts['lint:fix'] = 'concurrently "pnpm:lint:*:fix" --names "fix:" --prefixColors auto',
  packageJSON.scripts.start = 'vite',
  packageJSON.scripts.test = 'concurrently "pnpm:lint" "pnpm:test:*" --names "lint,test:" --prefixColors auto',
  packageJSON.scripts['test:ember'] = 'vite build --mode test && ember test --path dist'

  await writeFile('package.json', JSON.stringify(packageJSON, undefined, 2), 'utf-8');
}

async function removePackages() {
  console.log('uninstall dependencies that are no longer used.');
  await promiseExec(`pnpm remove ${packagesToRemove.join(' ')}`);
}

async function addPackages() {
  console.log('install new required dependencies.');
  await promiseExec(`pnpm add -D ${packagesToAdd.join(' ')}`);
}
