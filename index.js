#!/usr/bin/env node
import { program } from 'commander';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import addMissingFiles from './lib/addMissingFiles.js';
import ensureV2Addons from './lib/ensureV2Addons.js'
import moveIndex from './lib/moveIndex.js';
import modifyFiles from './lib/modifyFiles.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await readFile(join(__dirname, 'package.json'), 'utf8'));

program.option('--skip-v2-addon').version(pkg.version);

program.parse();

const options = program.opts();

await ensureV2Addons(options.skipV2Addon);
await addMissingFiles();
await moveIndex();
await modifyFiles();
// TODO
// await updatePackageJson();
