import { readFile, writeFile } from 'node:fs/promises';
import semver from 'semver';
import { resolveVersion } from '../utils/resolve-version.js';
import blueprintPkg from '@ember/app-blueprint/files/package.json' with { type: 'json' };

/**
 * This litte helper function reads the package.json from the `@ember/app-blueprint` and
 * returns the version for the requested pacakge. This allows us to make sure that you are on the
 * correct version that is being provided from the app blueprint.
 *
 * This function also strips the EJS template format that the blueprint uses from any versions
 *
 * @param {string} packageName the package that you want the version from the package.json for
 */
function getBlueprintVersion(packageName) {
  return blueprintPkg.devDependencies[packageName].replace(/<%.*%>/, '');
}

/*
 * These packages are used in the latest classic app blueprint,
 * but they are no longer used in the Vite app blueprint so the
 * codemod should remove them.
 */
export const PACKAGES_TO_REMOVE = [
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
export const PACKAGES_TO_ADD = [
  '@babel/plugin-transform-runtime',
  '@ember/string',
  '@ember/test-helpers',
  '@embroider/compat',
  '@embroider/config-meta-loader',
  '@embroider/core',
  '@embroider/vite',
  '@rollup/plugin-babel',
  'babel-plugin-ember-template-compilation',
  'decorator-transforms',
  'ember-load-initializers',
  'ember-resolver',
  'ember-qunit',
  'vite',
];

export const PACKAGES_TO_ADD_TS = ['@babel/plugin-transform-typescript'];

/*
 * These packages are not requirements for the Vite app.
 * However, if they are used, then they have a minimum
 * required version, and the codemod will make sure it's
 * installed.
 */
export const PACKAGES_TO_UPDATE = [
  ['@embroider/router', '^3.0.1'],
  ['ember-page-title', '^8.0.0'],
];

export default async function updatePackageJson(options = { ts: false }) {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));

  removePackages(packageJSON, options);
  addPackages(packageJSON, options);
  updatePackages(packageJSON, options);

  packageJSON.exports = {
    './tests/*': './tests/*',
    './*': './app/*',
  };

  // Update commands
  packageJSON.scripts = {
    ...packageJSON.scripts,
    build: 'vite build',
    start: 'vite',
    'test:ember': 'vite build --mode development && ember test --path dist',
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
        ([dep]) => !PACKAGES_TO_REMOVE.includes(dep),
      ),
    );
  }
  if (packageJSON['dependencies']) {
    packageJSON['dependencies'] = Object.fromEntries(
      Object.entries(packageJSON['dependencies']).filter(
        ([dep]) => !PACKAGES_TO_REMOVE.includes(dep),
      ),
    );
  }
}

function mapPackagesWithVersions(packages) {
  return packages.map((pkg) => [pkg, getBlueprintVersion(pkg)]);
}

function addPackages(packageJSON, options = { ts: false }) {
  console.log('Adding new required dependencies.');

  const packagesToAdd = [
    ...mapPackagesWithVersions(PACKAGES_TO_ADD),
    ...(options.ts ? mapPackagesWithVersions(PACKAGES_TO_ADD_TS) : []),
  ];
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
  for (const [dep, version] of PACKAGES_TO_UPDATE) {
    updateVersion(packageJSON['dependencies'], dep, version) ||
      updateVersion(packageJSON['devDependencies'], dep, version);
  }
}

function updateVersion(deps, depToAdd, minimumVersion) {
  if (!deps || !depToAdd) return;
  if (deps[depToAdd]) {
    const version = resolveVersion(depToAdd);
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
