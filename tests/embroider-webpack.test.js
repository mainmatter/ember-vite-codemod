import { describe, it } from 'vitest';
import tmp from 'tmp';
import { join } from 'path';
import {
  generateEmberApp,
  runCodemod,
  testEmber,
  testWithTestem,
} from './test-helpers';

const testVersions = [['ember-cli-latest']];

describe('Test on ember-cli-latest with Embroider+Webpack', function () {
  for (let [version, packages] of testVersions) {
    it(`should work for ember version ${version}`, async function ({ expect }) {
      let tmpobj = tmp.dirSync({ unsafeCleanup: true });
      const cwd = join(tmpobj.name, 'test-app');

      await generateEmberApp(
        tmpobj.name,
        version,
        packages,
        '--skip-npm --pnpm --embroider',
      );
      await testEmber(cwd, expect);
      await runCodemod(cwd);
      await testEmber(cwd, expect);
      await testWithTestem(cwd, expect);
    });
  }
});
