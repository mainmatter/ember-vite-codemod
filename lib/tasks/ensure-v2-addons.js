import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';
import {
  PACKAGES_TO_ADD,
  PACKAGES_TO_ADD_TS,
  PACKAGES_TO_REMOVE,
} from './update-package-json.js';
import { ExitError } from '../utils/exit.js';
import { bold, cyan } from 'yoctocolors';
import inquirer from 'inquirer';

// These addons are v1, but we know for sure Embroider can deal with it,
// because they are part of the "Vite app" blueprint or the Embroider ecosystem.
const v1CompatibleAddons = [
  '@ember/optional-features',
  '@embroider/macros',
  '@embroider/util',
  '@glimmer/tracking',
  'ember-auto-import',
  'ember-cli-babel',
  'ember-cli-deprecation-workflow',
  'ember-cli-htmlbars',
  'ember-template-imports',
  // ember-source latest is v2 but Vite support is available back to 3.28,
  // so it's not a problem if the currently installed version is v1.
  // The task ensure-ember-cli has a dedicated pre-check for the version.
  'ember-source',
];

export default async function ensureV2Addons(
  options = { ts: false, nonInteractive: false },
  spinner = { success: () => {}, start: () => {} },
) {
  let shouldProcessExit = false;
  const v1Addons = await getV1Addons(options);
  const packagesToAdd = [
    ...PACKAGES_TO_ADD,
    ...(options.ts ? PACKAGES_TO_ADD_TS : []),
  ];

  const logs = {
    hasV2: [],
    doesNotHaveV2: [],
    hasBasicPackage: [],
    isPrivate: [],
  };

  for (let addon of v1Addons) {
    if (
      PACKAGES_TO_REMOVE.includes(addon) ||
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
          logs.hasV2.push(addon);
          shouldProcessExit = true;
        } else {
          logs.doesNotHaveV2.push(addon);
        }
      } else {
        // viewing ember-addon doesn't output anything so it's now a basic npm package
        logs.hasBasicPackage.push(addon);
        shouldProcessExit = true;
      }
    } catch (e) {
      logs.isPrivate.push(addon);
      if (options.errorTrace) {
        console.error(e.message ?? e);
      }
    }
  }

  spinner.success();
  printSummary(logs);

  if (shouldProcessExit) {
    if (options.nonInteractive) {
      spinner.start('Stopping the codemod');
      throw new ExitError(
        `Some addon(s) above can be updated. If you prefer to move to Vite now, and upgrade the addons above at a later time, pass the option ${bold('--skip-v2-addon')} when running this codemod.`,
      );
    }
    let { continueExec } = await inquirer.prompt([
      {
        type: 'rawlist',
        name: 'continueExec',
        message: 'Some addon(s) above can be updated. What do you want to do?',
        default: 0,
        choices: [
          'Continue the move to Vite (if you prefer to upgrade the addons at a later time)',
          'Stop the codemod (if you prefer to upgrade the addons and maximize the benifits you get from Vite now)',
        ],
      },
    ]);
    if (continueExec.includes('Stop the codemod')) {
      spinner.start('Stopping the codemod');
      throw new ExitError(`The codemod was stopped.`);
    }
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
          `The package "${depName}" was found in the dependencies, but its package.json could not be read. Falling back to npm public information.`,
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
          `Could not look up information about "${depName}". You need to verify if this addon is a v2 addon manually.`,
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

function printSummary(logs) {
  const { hasBasicPackage, hasV2, doesNotHaveV2, isPrivate } = logs;
  let summary = bold(`📝 Your Ember V1 addons summary\n`);

  if (
    !hasBasicPackage.length &&
    !hasV2.length &&
    !doesNotHaveV2.length &&
    !isPrivate.length
  ) {
    summary += 'Nothing to report.';
    console.log(summary);
    return;
  }
  summary += `Embroider generally auto-fixes v1 addons so they keep working with Vite. However:
* v2 addons are more performant, so we highly recommend to update everything that can be updated now.
* it might happen for some v1 addons that the auto-fix does not work; if you notice an issue when running your Vite app, you can refer to the list below to potentially spot an incompatible addon.\n\n`;

  if (doesNotHaveV2.length) {
    summary += `${cyan(bold(doesNotHaveV2.length))} addon(s) which are ${cyan(bold('v1 only'))} and cannot be updated to v2 format. If you notice an issue, consider replacing this dependency, or contributing to the addon to make it v2:\n`;
    summary += doesNotHaveV2.map((name) => `    * ${name}`).join('\n');
    summary += '\n\n';
  }
  if (hasBasicPackage.length) {
    summary += `${cyan(bold(hasBasicPackage.length))} addon(s) whose latest version is now a ${cyan(bold('basic npm package'))} (it's no longer an ember-addon). Update whenever you can:\n`;
    summary += hasBasicPackage.map((name) => `    * ${name}`).join('\n');
    summary += '\n\n';
  }
  if (hasV2.length) {
    summary += `${cyan(bold(hasV2.length))} addon(s) whose latest version is now a ${cyan(bold('v2 addon'))}. Update whenever you can:\n`;
    summary += hasV2.map((name) => `    * ${name}`).join('\n');
    summary += '\n\n';
  }
  if (isPrivate.length) {
    summary += `${cyan(bold(isPrivate.length))} addon(s) identified as a v1 addon, but it was ${cyan(bold('not possible to check'))} if a v2 format was released. Is this package private?\n`;
    summary += isPrivate.map((name) => `    * ${name}`).join('\n');
    summary += '\n\n';
  }
  console.log(summary);
}
