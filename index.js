#!/usr/bin/env node
import { program } from 'commander';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import addMissingFiles from './lib/addMissingFiles.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await readFile(join(__dirname, 'package.json'), 'utf8'));

program.option('--skip-v2-addon').version(pkg.version);

program.parse();

// const options = program.opts();

// TODO - psuedo code
// function ensureV2Addons() {
//   const allAddons = getAllAddons();
//   const allV1Addons = allAddons.filter(a => a.version === 1);

//   for( let addon of allV1Addons) {
//     if(getLatestVersion(addon).version === 2) {
//       console.log(`You can update ${addon.name} because its latest version is a v2 and that will help you very much.`)

//       if(!options.skipV2Addon) {
//         console.log('Sometimes Embroider can auto-fix your addons, but it\'s usually better to upgrade. If you want to skip ahead and try without upgrading pass --skip-v2-addon-check')
//         process.exit(1);
//       } else {
//         console.log('I hope you know what you\'re doing 🙈');
//       }
//     }
//   }
// }

// await ensureV2Addons();
await addMissingFiles();
// TODO
// await updatePackageJson();
