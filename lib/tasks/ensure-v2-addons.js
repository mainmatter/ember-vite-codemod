import { readFile } from 'node:fs/promises';
import { execa } from 'execa';
import { packagesToAdd, packagesToRemove } from './update-package-json.js';

// These addons are v1, but we know for sure Embroider can deal with it,
// because they are part of the "Vite app" blueprint.
const v1CompatibleAddons = [
  '@ember/optional-features',
  '@glimmer/tracking',
  'ember-auto-import',
  'ember-cli-babel',
  'ember-cli-htmlbars',
  'ember-template-imports',
];

export default async function ensureV2Addons(options) {
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
  }

  if (shouldProcessExit) {
    console.log(
      'If you want to skip ahead and try without upgrading the addons above, pass the option --skip-v2-addon when running this codemod.',
    );
    process.exit(1);
  }
}

async function getV1Addons({ errorTrace = false } = {}) {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf8'));
  const deps = { ...packageJSON.devDependencies, ...packageJSON.dependencies };
  const v1packages = [];
  for (const [depName, version] of Object.entries(deps)) {
    try {
      const { stdout } =
        await execa`npm view --json ${depName}@${version} ember-addon keywords`;
      const pkg = JSON.parse(stdout);
      if (
        pkg.keywords?.includes('ember-addon') &&
        pkg['ember-addon']?.version !== 2
      ) {
        v1packages.push(depName);
      }
    } catch (e) {
      if (e.message.includes('npm error code E404')) {
        console.warn(
          `We could not look up information about ${depName}. You need to verify if this addon is a v2 addon manually.`,
        );
      } else {
        console.warn(
          `We recieved an unexpected error looking up information about ${depName}.`,
        );
      }

      if (errorTrace) {
        console.error(e.message);
      }
    }
  }
  return v1packages;
}
