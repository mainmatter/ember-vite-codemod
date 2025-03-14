import { describe, it } from 'vitest';

import { testVersions, executeTest, getPort } from './standard.test';

describe.concurrent('Test webpack blueprint on Ember', function () {
  it.for(testVersions)(
    'should work for ember version %s with webpack',
    async function ([version, packages], { expect }) {
      await executeTest(
        expect,
        version,
        packages,
        '--embroider --skip-npm --pnpm',
        getPort(),
      );
    },
  );
});
