#!/usr/bin/env node
import { program } from 'commander';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import addMissingFiles from './lib/tasks/add-missing-files.js';
import checkGitStatus from './lib/tasks/check-git-status.js';
import ensureNoUnsupportedDeps from './lib/tasks/ensure-no-unsupported-deps.js';
import ensureV2Addons from './lib/tasks/ensure-v2-addons.js';
import moveIndex from './lib/tasks/move-index.js';
import transformFiles from './lib/tasks/transform-files.js';
import updatePackageJson from './lib/tasks/update-package-json.js';

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
  .option('--ts', 'indicate the app to migrate uses TypeScript', false)
  .option('--error-trace', 'print the whole error trace when available', false)
  .version(pkg.version);

program.parse();
const options = program.opts();

// Tasks order is important
if (!options.skipGit) {
  await checkGitStatus();
}

console.log('Checking for unsupported dependencies...\n');
await ensureNoUnsupportedDeps();

if (!options.skipV2Addon) {
  console.log('\nChecking addons are v2...\n');
  await ensureV2Addons();
}

console.log('\nCreating new required files...\n');
const projectType = options.ts ? 'ts' : 'js';
await addMissingFiles({ projectType });
await moveIndex();

console.log('\nRunning code replacements...\n');
await transformFiles({
  isEmbroiderWebpack: options.embroiderWebpack,
  showErrorTrace: options.errorTrace,
});
await updatePackageJson();

console.log('\nAll set! Re-install the app dependencies then run your linter');
