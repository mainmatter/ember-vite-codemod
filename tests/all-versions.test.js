import { describe, it } from 'vitest';
import { createRequire } from 'node:module';
import { execaNode, execa } from 'execa';
import tmp from 'tmp';
import { dirname, join } from 'path';
import { packageUp } from 'package-up';

const require = createRequire(import.meta.url);

import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const __dirname = dirname(fileURLToPath(import.meta.url));

const testVersions = [
  // ['ember-cli-3.28'],
  // ['ember-cli-4.12'],
  // ['ember-cli-4.4'],
  // ['ember-cli-4.8'],
  // // test helpers seems to be broken for most ember versions 😭
  // ['ember-cli-5.4', ['@ember/test-helpers@latest']],
  // ['ember-cli-5.8', ['@ember/test-helpers@latest']],
  ['ember-cli-5.12', ['@ember/test-helpers@latest']],
  ['ember-cli-latest'],
];

describe('Test on all Ember versions', function () {
  for (let [version, packages] of testVersions) {
    it(`should work for ember version ${version}`, async function ({ expect }) {
      let tmpobj = tmp.dirSync({ unsafeCleanup: true });

      const path = dirname(require.resolve(version));
      const cliPath = join(
        dirname(await packageUp({ cwd: path })),
        'bin',
        'ember',
      );

      await execaNode({
        cwd: tmpobj.name,
      })`${cliPath} new test-app --skip-npm --pnpm`;

      const cwd = join(tmpobj.name, 'test-app');

      await execa({ cwd })`pnpm i`;

      if (packages?.length) {
        await execa({ cwd })`pnpm i ${packages.join(' ')}`;
      }

      // write out a basic acceptance test
      await mkdir(join(cwd, 'tests/acceptance'));
      await writeFile(
        join(cwd, 'tests/acceptance/index-test.js'),
        await readFile('./tests/fixtures/index-test.js', 'utf-8'),
      );

      await execa({ cwd, stdio: 'inherit' })`${cliPath} build`;
      let { stdout } = await execa({ cwd })`${cliPath} test --path dist`;
      console.log(stdout);

      expect(stdout).to.include('# fail  0');

      // this prevents the script from erroring because of this
      await execa({ cwd })`pnpm uninstall ember-fetch`;

      const updateScriptPath = join(__dirname, '../index.js');
      await execaNode({
        cwd,
        stdio: 'inherit',
      })`${updateScriptPath} --skip-git --skip-v2-addon`;

      await execa({ cwd, stdio: 'inherit' })`pnpm i --no-frozen-lockfile`;

      await execa({ cwd, stdio: 'inherit' })`./node_modules/.bin/vite build`;
      let result = await execa({ cwd })`${cliPath} test`;
      console.log(result.stdout);

      expect(result.stdout).to.include('# fail  0');
    });
  }
});
