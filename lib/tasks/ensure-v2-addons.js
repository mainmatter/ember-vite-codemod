import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';
import { packagesToAdd, packagesToRemove } from './update-package-json.js';
import { ExitError } from '../utils/exit.js';

// These addons are v1, but we know for sure Embroider can deal with it,
// because they are part of the "Vite app" blueprint or the Embroider ecosystem.
const v1CompatibleAddons = [
  '@ember/optional-features',
  '@embroider/macros',
  '@embroider/util',
  '@glimmer/tracking',
  'ember-auto-import',
  'ember-cli-babel',
  'ember-cli-htmlbars',
  'ember-template-imports',
  // ember-source latest is v2 but Vite support is available back to 3.28,
  // so it's not a problem if the currently installed version is v1.
  // The task ensure-ember-cli has a dedicated pre-check for the version.
  'ember-source',
];

export default async function ensureV2Addons(options = {}) {
  let shouldProcessExit = false;
  const v1Addons = await getV1Addons(options);

  for (let addon of v1Addons) {
    if (
      packagesToRemove.includes(addon) ||
      v1CompatibleAddons.includes(addon) ||
      packagesToAdd.some(([p]) => p === addon)
    ) {
      // don't report:
      // - v1 addons the codemod will remove from package.json
      // - v1 addons that are part of the default "Vite app" blueprint
      continue;
    }

    try {
      const { stdout } = await execa`npm view ${addon} ember-addon`;
      if (stdout) {
        // viewing ember-addon outputs something so it's still an ember-addon
        if (stdout.includes('version: 2')) {
          console.error(
            `${addon} latest version is a v2 addon, we highly recommend that you update it before running this codemod again. Sometimes Embroider can auto-fix v1 addons, but it's usually better to upgrade.\n`,
          );
          shouldProcessExit = true;
        } else {
          console.warn(
            `${addon} is a v1 addon that cannot be updated to v2 format. Sometimes Embroider can auto-fix v1 addons, but the success is not guarantee for every addon. If you notice an issue, consider removing this dependency, or contributing to the addon to make it v2.\n`,
          );
          console.log('\n');
        }
      } else {
        // viewing ember-addon doesn't output anything so it's now a basic npm package
        console.error(
          `${addon} latest version is no longer an ember-addon but a basic npm package, we highly recommend that you update it before running this codemod again. Sometimes Embroider can auto-fix v1 addons, but it's usually better to upgrade.\n`,
        );
        shouldProcessExit = true;
      }
    } catch (e) {
      console.warn(
        `${addon} was identified as a v1 addon, but it was not possible to check if a v2 format was released. Is this package private? Sometimes Embroider can auto-fix v1 addons, but the success is not guarantee for every addon. If you notice an issue, consider removing this dependency, or making it v2.`,
      );
      if (options.errorTrace) {
        console.error(e.message ?? e);
      }
    }
  }

  if (shouldProcessExit) {
    throw new ExitError(
      'If you want to skip ahead and try without upgrading the addons above, pass the option --skip-v2-addon when running this codemod.',
    );
  }
}

async function getV1Addons({ errorTrace = false } = {}) {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf8'));
  const deps = { ...packageJSON.devDependencies, ...packageJSON.dependencies };
  const v1packages = [];
  for (const [depName, version] of Object.entries(deps)) {
    let pkg;
    let pkgInfo;
    try {
      pkg = JSON.parse(
        await readFile(join('node_modules', depName, 'package.json'), 'utf8'),
      );
      if (pkg) {
        pkgInfo = pkg['ember-addon'];
      }
    } catch (e) {
      if (errorTrace) {
        console.warn(
          `The package ${depName} was found in the dependencies, but its package.json could not be read. Falling back to npm public information.`,
        );
        console.error(e.message ?? e);
      }
    }

    if (!pkg) {
      try {
        const { stdout } =
          await execa`npm view --json ${depName}@${version} ember-addon`;
        if (stdout) {
          pkgInfo = JSON.parse(stdout);
          if (pkgInfo.length) {
            // npm view will return all results matching the version based on semver (e.g ^6.0.0)
            pkgInfo = pkgInfo[pkgInfo.length - 1];
          }
        }
      } catch (e) {
        console.warn(
          `Could not look up information about ${depName}. You need to verify if this addon is a v2 addon manually.`,
        );
        if (errorTrace) {
          console.error(e.message ?? e);
        }
      }
    }

    if (pkgInfo && pkgInfo.version !== 2) {
      v1packages.push(depName);
    }
  }
  return v1packages;
}
