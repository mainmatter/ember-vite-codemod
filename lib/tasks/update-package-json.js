import { readFile, writeFile } from 'node:fs/promises';
import semver from 'semver';

/*
 * These packages are used in the latest classic app blueprint,
 * but they are no longer used in the Vite app blueprint so the
 * codemod should remove them.
 */
export const packagesToRemove = [
  '@embroider/webpack',
  'broccoli-asset-rev',
  'ember-cli-app-version',
  'ember-cli-clean-css',
  'ember-cli-dependency-checker',
  'ember-cli-inject-live-reload',
  'ember-cli-sri',
  'ember-cli-terser',
  'ember-template-imports',
  'loader.js',
  'webpack',
];

/*
 * These packages are new requirements for the Vite app.
 * The version is the minimum required version. Depending
 * on the context, the codemod can: install the package,
 * change its version to the minimum required version, or
 * keep it as it is.
 */
export const packagesToAdd = [
  ['@babel/plugin-transform-runtime', '^7.26.9'],
  ['@ember/string', '^4.0.0'],
  ['@ember/test-helpers', '^4.0.0'],
  ['@embroider/compat', '^4.0.3'],
  ['@embroider/config-meta-loader', '^1.0.0'],
  ['@embroider/core', '^4.0.3'],
  ['@embroider/vite', '^1.1.1'],
  ['@rollup/plugin-babel', '^6.0.4'],
  ['babel-plugin-ember-template-compilation', '^2.3.0'],
  ['decorator-transforms', '^2.3.0'],
  ['ember-load-initializers', '^3.0.0'],
  ['ember-resolver', '^13.0.0'],
  ['ember-qunit', '^9.0.0'],
  ['vite', '^6.0.0'],
];

/*
 * These packages are not requirements for the Vite app.
 * However, if they are used, then they have a minimum
 * required version, and the codemod will make sure it's
 * installed.
 */
export const packagesToUpdate = [['@embroider/router', '^3.0.1']];

export default async function updatePackageJson() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));

  removePackages(packageJSON);
  addPackages(packageJSON);
  updatePackages(packageJSON);

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
  packageJSON.scripts = {
    ...packageJSON.scripts,
    build: 'vite build',
    start: 'vite',
    'test:ember': 'vite build --mode test && ember test --path dist',
  };

  await writeFile(
    'package.json',
    JSON.stringify(packageJSON, undefined, 2),
    'utf-8',
  );
}

function removePackages(packageJSON) {
  console.log('Removing dependencies that are no longer used.');
  if (packageJSON['devDependencies']) {
    packageJSON['devDependencies'] = Object.fromEntries(
      Object.entries(packageJSON['devDependencies']).filter(
        ([dep]) => !packagesToRemove.includes(dep),
      ),
    );
  }
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
  let hasNewDevDep = false;
  for (const [dep, version] of packagesToAdd) {
    let isUpdated =
      updateVersion(packageJSON['dependencies'], dep, version) ||
      updateVersion(packageJSON['devDependencies'], dep, version);
    if (!isUpdated) {
      packageJSON['devDependencies'] = packageJSON['devDependencies'] ?? {};
      addNewDependency(packageJSON['devDependencies'], dep, version);
      hasNewDevDep = true;
    }
  }
  if (hasNewDevDep) {
    packageJSON['devDependencies'] = sortDependencies(
      packageJSON['devDependencies'],
    );
  }
}

function updatePackages(packageJSON) {
  console.log('Updating optional dependencies.');
  for (const [dep, version] of packagesToUpdate) {
    updateVersion(packageJSON['dependencies'], dep, version) ||
      updateVersion(packageJSON['devDependencies'], dep, version);
  }
}

function updateVersion(deps, depToAdd, minimumVersion) {
  if (!deps || !depToAdd) return;
  if (deps[depToAdd]) {
    const version = deps[depToAdd];
    if (
      semver.lt(
        semver.coerce(version, { includePrerelease: true }),
        semver.coerce(minimumVersion, { includePrerelease: true }),
      )
    ) {
      deps[depToAdd] = minimumVersion;
    }
    return true;
  }
  return false;
}

function addNewDependency(deps, depToAdd, minimumVersion) {
  if (!deps || !depToAdd) return;
  deps[depToAdd] = minimumVersion;
}

function sortDependencies(field) {
  return Object.keys(field)
    .sort()
    .reduce((Obj, key) => {
      Obj[key] = field[key];
      return Obj;
    }, {});
}
