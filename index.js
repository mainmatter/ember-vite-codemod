#!/usr/bin/env node
import { program, Option } from 'commander';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import addMissingFiles from './lib/tasks/add-missing-files.js';
import checkGitStatus from './lib/tasks/check-git-status.js';
import ensureEmberCli from './lib/tasks/ensure-ember-cli.js';
import ensureNoUnsupportedDeps from './lib/tasks/ensure-no-unsupported-deps.js';
import ensureV2Addons from './lib/tasks/ensure-v2-addons.js';
import moveIndex from './lib/tasks/move-index.js';
import transformFiles from './lib/tasks/transform-files.js';
import updatePackageJson from './lib/tasks/update-package-json.js';
import { checkModulePrefixMisMatch } from './lib/tasks/check-modulePrefix-mismatch.js';
import { detectTypescript } from './lib/utils/detect-typescript.js';
import { isExit } from './lib/utils/exit.js';
import { run } from './lib/utils/run.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await readFile(join(__dirname, 'package.json'), 'utf8'));
const appPkg = JSON.parse(await readFile('package.json', 'utf-8'));

program
  .option(
    '--skip-v2-addon',
    'pursue the execution even when an upgradable v1 addon is detected',
    false,
  )
  .option(
    '--skip-git',
    'pursue the execution even when not working in a clean git repository',
    false,
  )
  .option(
    '--embroider-webpack',
    'indicate the app to migrate uses @embroider/webpack to build',
    false,
  )
  .addOption(
    new Option(
      '--ts',
      'indicate the app to migrate uses TypeScript (default: true when TypeScript files are detected)',
    ).conflicts('js'),
  )
  .addOption(
    new Option(
      '--js',
      'indicate the app to migrate uses JavaScript (default: true when no TypeScript files are detected)',
    ).conflicts('ts'),
  )
  .option('--error-trace', 'print the whole error trace when available', false)
  .version(pkg.version)
  .action(async (options) => {
    options.ts ??= !options.js && detectTypescript();
    delete options.js;

    if (options.embroiderWebpack) {
      console.warn(
        '--embroider-webpack option ignored. The codemod now adapts automatically if @embroider/webpack is found.\n',
      );
    }
    // Add an automatic option when @embroider/webpack is detected
    options.embroiderWebpack =
      appPkg['dependencies']?.['@embroider/webpack'] ||
      appPkg['devDependencies']?.['@embroider/webpack'] ||
      false;
  });

await program.parseAsync();

const options = program.opts();

try {
  console.log(`\n🐹 Moving ${appPkg.name} to Vite\n`);

  // Tasks order is important
  if (!options.skipGit) {
    await run('Checking Git status', checkGitStatus);
  }

  await run('Checking modulePrefix', checkModulePrefixMisMatch);
  await run('Checking for Ember version', ensureEmberCli);
  await run('Checking for unsupported dependencies', ensureNoUnsupportedDeps);

  if (!options.skipV2Addon) {
    await run('Checking for v2 addons', ensureV2Addons, options);
  }

  await run('Creating new required files...', addMissingFiles, options);
  await run('Moving index.html', moveIndex);

  await run('Running code replacements...', transformFiles, options);
  await run('Updating package.json', updatePackageJson, options);

  console.log(
    '\nAll set! Re-install the app dependencies then run your linter',
  );
} catch (error) {
  if (!isExit(error)) {
    throw error;
  }
}
