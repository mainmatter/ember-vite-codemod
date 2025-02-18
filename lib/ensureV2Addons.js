import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { packagesToRemove } from './updatePackageJson.js';

export default async function ensureV2Addons(skipV2Addon) {
  const v1Addons = await getV1Addons();
  for( let addon of v1Addons) {
    if (packagesToRemove.includes(addon)) {
      // don't report v1 addons the codemod will remove from package.json
      continue;
    }
    const promiseExec = promisify(exec);
    const { stdout } = await promiseExec(`npm view ${addon} ember-addon`);
    if (stdout && stdout.includes('version: 2')) {
      if(!skipV2Addon) {
        console.error(`${addon} latest version is a v2 addon, we highly recommend that you update it before running this codemod again.`)
        console.log('Sometimes Embroider can auto-fix v1 addons, but it\'s usually better to upgrade. If you want to skip ahead and try without upgrading, pass the option --skip-v2-addon when running this codemod.\n')
        process.exit(1);
      } else {
        console.log(`--skip-v2-addon: pursuing with ${addon} as a v1 addon\n`);
      }
    } else {
      console.warn(`${addon} is a v1 addon that cannot be updated to v2 format.`);
      console.log('Sometimes Embroider can auto-fix v1 addons, but it\'s usually better to upgrade. Consider removing or replacing this dependency, or contributing to the addon to make it v2.\n')
      continue;
    }
  }
}

async function getV1Addons() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf8'));
  const deps = {...packageJSON.devDependencies, ...packageJSON.dependencies};
  const v1packages = [];
  for (const depName in deps) {
    try {
      const pkg = JSON.parse(await readFile(join('node_modules', depName, 'package.json'), 'utf8'));
      if (pkg.keywords?.includes('ember-addon') && pkg['ember-addon']?.version !== 2) {
        v1packages.push(depName);
      }
    } catch(e) {
      console.warn(`The package ${depName} was found in the dependencies, but its package.json was not found. Is the package correctly installed? Error: ${e}`);
    }
  }
  return v1packages;
}