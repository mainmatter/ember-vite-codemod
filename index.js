#!/usr/bin/env node
import { program } from 'commander';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import addMissingFiles from './lib/tasks/add-missing-files.js';
import ensureV2Addons from './lib/tasks/ensure-v2-addons.js';
import moveIndex from './lib/tasks/move-index.js';
import transformFiles from './lib/tasks/transform-files.js';
import updatePackageJson from './lib/tasks/update-package-json.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await readFile(join(__dirname, 'package.json'), 'utf8'));

program
  .option('--skip-v2-addon', 'pursue the execution even when an upgradable v1 addon is detected', false)
  .option('--ts', 'indicate the app to migrate uses TypeScript', false)
  .version(pkg.version);

program.parse();

const options = program.opts();
const projectType = options.ts ? 'ts' : 'js';

// Tasks order is important
await ensureV2Addons(options.skipV2Addon);
await addMissingFiles({ projectType });
await moveIndex();
await transformFiles();
await updatePackageJson();
