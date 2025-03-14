import { describe, it } from 'vitest';
import tmp from 'tmp';
import { join } from 'path';
import {
  generateEmberApp,
  getCliPath,
  runCodemod,
  testEmber,
  testWithTestem,
} from './test-helpers';

export const testVersions = [
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

let port = 7357;
export function getPort() {
  return port++;
}

describe.concurrent('Test standard blueprint on Ember', function () {
  it.for(testVersions)(
    'should work for ember version %s',
    async function ([version, packages], { expect }) {
      await executeTest(
        expect,
        version,
        packages,
        '--skip-npm --pnpm',
        getPort(),
      );
    },
  );
});

export async function executeTest(
  expect,
  version,
  packages,
  cliOptions,
  testemPort,
) {
  let tmpobj = tmp.dirSync({ unsafeCleanup: true });
  const cwd = join(tmpobj.name, 'test-app');
  const cliPath = await getCliPath(version);

  await generateEmberApp(tmpobj.name, version, packages, cliPath, cliOptions);
  await testEmber(cwd, expect, testemPort);
  await runCodemod(cwd);
  await testEmber(cwd, expect, testemPort);
  await testWithTestem(cwd, expect, testemPort);
}
