import { readFile, writeFile } from 'node:fs/promises';

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
  'webpack',
];

const packagesToAdd = [
  ['@babel/plugin-transform-runtime', '^7.26.9'],
  ['@ember/string', '^4.0.0'],
  ['@embroider/compat', '^4.0.0-alpha.0'],
  ['@embroider/config-meta-loader', '^1.0.0-alpha.0'],
  ['@embroider/core', '^4.0.0-alpha.0'],
  ['@embroider/vite', '^1.0.0-alpha.0'],
  ['@rollup/plugin-babel', '^6.0.4'],
  ['decorator-transforms', '^2.3.0'],
  ['vite', '6.0.0'],
];

export default async function updatePackageJson() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));
  removePackages(packageJSON);
  addPackages(packageJSON);

  // Add app v2 meta
  packageJSON['ember-addon'] = {
    type: 'app',
    version: 2,
  };
  packageJSON.exports = {
    './tests/*': './tests/*',
    './*': './app/*',
  };

  // Update commands
  (packageJSON.scripts.build = 'vite build'),
    (packageJSON.scripts.start = 'vite'),
    (packageJSON.scripts['test:ember'] =
      'vite build --mode test && ember test --path dist');

  await writeFile(
    'package.json',
    JSON.stringify(packageJSON, undefined, 2),
    'utf-8',
  );
}

function removePackages(packageJSON) {
  console.log('Removing dependencies that are no longer used.');
  packageJSON['devDependencies'] = Object.fromEntries(
    Object.entries(packageJSON['devDependencies']).filter(
      ([dep]) => !packagesToRemove.includes(dep),
    ),
  );
  if (packageJSON['dependencies']) {
    packageJSON['dependencies'] = Object.fromEntries(
      Object.entries(packageJSON['dependencies']).filter(
        ([dep]) => !packagesToRemove.includes(dep),
      ),
    );
  }
}

function addPackages(packageJSON) {
  console.log('Adding new required dependencies.');
  let wasDepChange = false;
  for (const [dep, version] of packagesToAdd) {
    if (packageJSON['dependencies'] && packageJSON['dependencies'][dep]) {
      wasDepChange = true;
      packageJSON['dependencies'][dep] = version;
    } else {
      packageJSON['devDependencies'][dep] = version;
    }
  }
  if (wasDepChange) {
    packageJSON['dependencies'] = sortDependencies(packageJSON['dependencies']);
  }
  packageJSON['devDependencies'] = sortDependencies(
    packageJSON['devDependencies'],
  );
}

function sortDependencies(field) {
  return Object.keys(field)
    .sort()
    .reduce((Obj, key) => {
      Obj[key] = field[key];
      return Obj;
    }, {});
}
