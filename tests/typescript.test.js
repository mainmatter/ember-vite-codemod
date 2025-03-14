import { describe, it } from 'vitest';

import { testVersions, executeTest, getPort } from './test-helpers';

describe.concurrent('Test typescript blueprint on Ember', function () {
  it.for(testVersions)(
    'should work for ember version %s with typescript',
    async function ([version, packages], { expect }) {
      await executeTest(
        expect,
        version,
        packages,
        '--typescript --skip-npm --pnpm',
        getPort(),
      );
    },
  );
});
