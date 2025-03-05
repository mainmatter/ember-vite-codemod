import { describe, it } from 'vitest';
import { createRequire } from 'node:module';
import { execaNode, execa } from 'execa';
import tmp from 'tmp';
import { dirname, join } from 'path';
import { packageUp } from 'package-up';
import fixturify from 'fixturify';

const require = createRequire(import.meta.url);

import { fileURLToPath } from 'node:url';
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

async function generateEmberApp(tmpDir, version, packages) {
  console.log(`🤖 generating ember app for version ${version} 🐹`);

  const path = dirname(require.resolve(version));
  const cliPath = join(dirname(await packageUp({ cwd: path })), 'bin', 'ember');
  const cwd = join(tmpDir, 'test-app');

  await execaNode({
    cwd: tmpDir,
  })`${cliPath} new test-app --skip-npm --pnpm`;
  await execa({ cwd })`pnpm i`;
  if (packages?.length) {
    await execa({ cwd })`pnpm i ${packages.join(' ')}`;
  }

  const fixture = fixturify.readSync('./tests/fixtures');
  fixturify.writeSync(cwd, fixture);
}

async function testEmber(cwd, expect) {
  console.log('🤖 testing ember app 🐹');
  await execa({ cwd, stdio: 'inherit' })`npm run build`;
  let { stdout } = await execa({ cwd })`npm run test:ember`;
  console.log(stdout);

  expect(stdout).to.include('# fail  0');
}

async function runCodemod(cwd) {
  console.log('🤖 running ember-vite-codemod 🐹');
  // ember-fetch is part of the classic app blueprint, but
  // removing it is a prerequisite to running the codemod.
  await execa({ cwd })`pnpm uninstall ember-fetch`;

  const updateScriptPath = join(__dirname, '../index.js');
  await execaNode({
    cwd,
    stdio: 'inherit',
  })`${updateScriptPath} --skip-git --skip-v2-addon`;

  await execa({ cwd, stdio: 'inherit' })`pnpm i --no-frozen-lockfile`;
}

async function testWithTestem(cwd, expect) {
  console.log('🤖 running dev tests with testem 🐹');
  await execa({ cwd })`pnpm i --save-dev testem http-proxy`;

  const viteExecaProcess = execa({
    cwd,
  })`pnpm vite --force --clearScreen false`;
  viteExecaProcess.stdout.setEncoding('utf8');

  const HOST = await new Promise((resolve) => {
    viteExecaProcess.stdout.on('data', (chunk) => {
      const matches = /Local:\s+(https?:\/\/.*)\//g.exec(chunk);

      if (matches) {
        resolve(matches[1]);
      }
    });
  });

  let result = await execa({
    cwd,
    env: {
      HOST,
    },
  })`pnpm testem --file testem-dev.js ci`;

  expect(result.exitCode, result.output).to.equal(0);
  console.log(result.stdout);

  viteExecaProcess.kill();
}

describe('Test on all Ember versions', function () {
  for (let [version, packages] of testVersions) {
    it(`should work for ember version ${version}`, async function ({ expect }) {
      let tmpobj = tmp.dirSync({ unsafeCleanup: true });
      const cwd = join(tmpobj.name, 'test-app');

      await generateEmberApp(tmpobj.name, version, packages);
      await testEmber(cwd, expect);
      await runCodemod(cwd);
      await testEmber(cwd, expect);
      await testWithTestem(cwd, expect);
    });
  }
});
