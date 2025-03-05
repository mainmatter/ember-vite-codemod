import { describe, it } from 'vitest';
import tmp from 'tmp';
import { join } from 'path';
import {
  generateEmberApp,
  runCodemod,
  testEmber,
  testWithTestem,
} from './test-helpers';

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
      const cwd = join(tmpobj.name, 'test-app');

      await generateEmberApp(
        tmpobj.name,
        version,
        packages,
        '--skip-npm --pnpm',
      );
      await testEmber(cwd, expect);
      await runCodemod(cwd);
      await testEmber(cwd, expect);
      await testWithTestem(cwd, expect);
    });
  }
});
