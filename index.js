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

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await readFile(join(__dirname, 'package.json'), 'utf8'));

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
      'indicate the app to migrate uses JavaScript (default: false when no TypeScript files are detected)',
    ).conflicts('ts'),
  )
  .option('--error-trace', 'print the whole error trace when available', false)
  .version(pkg.version)
  .action((options) => {
    options.ts ??= !options.js && detectTypescript();
    options.js ??= !options.ts && !detectTypescript();
  });

program.parse();
const options = program.opts();

if (options.embroiderWebpack) {
  console.warn(
    '--embroider-webpack option ignored. The codemod now adapts automatically if @embroider/webpack is found.\n',
  );
}

// Tasks order is important
if (!options.skipGit) {
  await checkGitStatus();
}

await checkModulePrefixMisMatch();

console.log('Checking for Ember version...\n');
await ensureEmberCli();

console.log('Checking for unsupported dependencies...\n');
await ensureNoUnsupportedDeps();

if (!options.skipV2Addon) {
  console.log('\nChecking addons are v2...\n');
  await ensureV2Addons(options);
}

console.log('\nCreating new required files...\n');
const projectType = options.ts ? 'ts' : 'js';
await addMissingFiles({ projectType });
await moveIndex();

// Add an automatic option when @embroider/webpack is detected
const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));
options.embroiderWebpack =
  packageJSON['dependencies']?.['@embroider/webpack'] ||
  packageJSON['devDependencies']?.['@embroider/webpack'];

console.log('\nRunning code replacements...\n');
await transformFiles(options);
await updatePackageJson();

console.log('\nAll set! Re-install the app dependencies then run your linter');
