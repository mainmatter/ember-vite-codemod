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

let port = 7357;
function getPort() {
  return port++;
}

describe('Test on all Ember versions', function () {
  for (let [version, packages] of testVersions) {
    it.concurrent(
      `should work for ember version ${version}`,
      async function ({ expect }) {
        await executeTest(
          expect,
          version,
          packages,
          '--skip-npm --pnpm',
          getPort(),
        );
      },
    );
  }
});

describe('Test on Ember versions with typescript', function () {
  it.concurrent(
    `should work for ember version ember-cli-latest with typescript`,
    async function ({ expect }) {
      await executeTest(
        expect,
        'ember-cli-latest',
        undefined,
        '--typescript --skip-npm --pnpm',
        getPort(),
      );
    },
  );
});

describe('Test on Ember versions with Embroider+Webpack', function () {
  it.concurrent(
    `should work for ember version ember-cli-latest with Embroider+Webpack`,
    async function ({ expect }) {
      await executeTest(
        expect,
        'ember-cli-latest',
        undefined,
        '-embroider --skip-npm --pnpm',
        getPort(),
      );
    },
  );
});

async function executeTest(expect, version, packages, cliOptions, testemPort) {
  let tmpobj = tmp.dirSync({ unsafeCleanup: true });
  const cwd = join(tmpobj.name, 'test-app');
  const cliPath = await getCliPath(version);

  await generateEmberApp(tmpobj.name, version, packages, cliPath, cliOptions);
  await testEmber(cwd, expect, testemPort);
  await runCodemod(cwd);
  await testEmber(cwd, expect, testemPort);
  await testWithTestem(cwd, expect, testemPort);
}
