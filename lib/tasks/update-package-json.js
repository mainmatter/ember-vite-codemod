
import { readFile, writeFile } from 'node:fs/promises';
import { console } from 'node:inspector';

// These packages are used in the latest classic app blueprint,
// but they are no longer used in the Vite app blueprint so the
// codemod should remove them.
export const packagesToRemove = [
  'broccoli-asset-rev',
  'ember-cli-app-version',
  'ember-cli-clean-css',
  'ember-cli-dependency-checker',
  'ember-cli-inject-live-reload',
  'ember-cli-sri',
  'ember-cli-terser',
  'loader.js',
  'webpack', // used to customize the build?
]

const packagesToAdd = [
  ["@babel/plugin-transform-runtime", "^7.26.9"],
  ["@ember/string", "^4.0.0"],
  ["@embroider/compat", "^4.0.0-alpha.0"],
  ["@embroider/config-meta-loader", "^1.0.0-alpha.0"],
  ["@embroider/core", "^4.0.0-alpha.0"],
  ["@embroider/vite", "^1.0.0-alpha.0"],
  ["@rollup/plugin-babel", "^6.0.4"],
  ["decorator-transforms", "^2.3.0"],
  ["vite", "6.0.0"]
]

export default async function updatePackageJson() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));
  modifyPackages(packageJSON);

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
  packageJSON.scripts.start = 'vite',
  packageJSON.scripts['test:ember'] = 'vite build --mode test && ember test --path dist'

  await writeFile('package.json', JSON.stringify(packageJSON, undefined, 2), 'utf-8');
}

function modifyPackages(packageJSON) {
  removePackages(packageJSON);
  addPackages(packageJSON);
  packageJSON['dependencies'] = sortDependencies(packageJSON['dependencies']);
  packageJSON['devDependencies'] = sortDependencies(packageJSON['devDependencies']);
}

function sortDependencies(field) {
  return Object.keys(field)
    .sort()
    .reduce((Obj, key) => {
        Obj[key] = field[key];
        return Obj;
    }, {});
}

function removePackages(packageJSON) {
  console.log('remove dependencies that are no longer used.');
  const devDeps = {};
  for (const dep in packageJSON['devDependencies']) {
    if (!packagesToRemove.includes(dep)) {
      devDeps[dep] = packageJSON['devDependencies'][dep];
    }
  }
  packageJSON['devDependencies'] = devDeps;

  const deps = {};
  for (const dep in packageJSON['dependencies']) {
    if (!packagesToRemove.includes(dep)) {
      deps[dep] = packageJSON['dependencies'][dep];
    }
  }
  packageJSON['dependencies'] = deps;
}

function addPackages(packageJSON) {
  console.log('add new required dependencies.');
  for (const [dep, version] in packagesToAdd) {
    if (packageJSON['dependencies'][dep]) {
      packageJSON['dependencies'][dep] = version;
    }
    else {
      packageJSON['devDependencies'][dep] = version
    }
  }
}
