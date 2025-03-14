import { execaNode, execa } from 'execa';
import { dirname, join } from 'path';
import { packageUp } from 'package-up';
import fixturify from 'fixturify';
import stripAnsi from 'strip-ansi';
import tmp from 'tmp';

export async function getCliPath(version) {
  const path = dirname(require.resolve(version));
  return join(dirname(await packageUp({ cwd: path })), 'bin', 'ember');
}

export async function generateEmberApp(
  tmpDir,
  version,
  packages,
  cliPath,
  cliOptions,
) {
  console.log(`🤖 generating ember app for version ${version} 🐹`);
  const cwd = join(tmpDir, 'test-app');

  await execaNode({
    cwd: tmpDir,
  })`${cliPath} new test-app ${cliOptions}`;
  await execa({ cwd })`pnpm i`;
  if (packages?.length) {
    await execa({ cwd })`pnpm i ${packages.join(' ')}`;
  }

  const fixture = fixturify.readSync('./tests/fixtures');
  fixturify.writeSync(cwd, fixture);
}

export async function testEmber(cwd, expect, testemPort) {
  console.log('🤖 testing ember app 🐹');
  await execa({
    cwd,
    env: {
      FORCE_BUILD_TESTS: true,
      EMBER_CLI_TEST_COMMAND: true, // this forces ember-cli to build test config
    },
    stdio: 'inherit',
  })`npm run build`;

  let { stdout: stdoutProduction } = await execa({
    cwd,
  })`npm run test:ember -- --test-port=${testemPort} --path dist`;
  console.log(stdoutProduction);

  expect(stdoutProduction).to.include('# fail  0');
  let { stdout } = await execa({
    cwd,
  })`npm run test:ember -- --test-port=${testemPort}`;
  console.log(stdout);

  expect(stdout).to.include('# fail  0');
}

export async function runCodemod(cwd) {
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

export async function testWithTestem(cwd, expect, testemPort) {
  console.log('🤖 running dev tests with testem 🐹');
  await execa({ cwd })`pnpm i --save-dev testem http-proxy`;

  const viteExecaProcess = execa({
    cwd,
  })`pnpm vite --force --clearScreen false`;
  viteExecaProcess.stdout.setEncoding('utf8');

  const HOST = await new Promise((resolve) => {
    viteExecaProcess.stdout.on('data', (chunk) => {
      const matches = /Local:\s+(https?:\/\/.*)\//g.exec(stripAnsi(chunk));

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
  })`pnpm testem --port ${testemPort} --file testem-dev.js ci`;

  expect(result.exitCode, result.output).to.equal(0);
  console.log(result.stdout);
}

export const testVersions = [
  // ['ember-cli-3.28'],
  // ['ember-cli-4.4'],
  // ['ember-cli-4.8'],
  ['ember-cli-4.12'],
  // // test helpers seems to be broken for most ember versions 😭
  ['ember-cli-5.4', ['@ember/test-helpers@latest']],
  ['ember-cli-5.8', ['@ember/test-helpers@latest']],
  ['ember-cli-5.12', ['@ember/test-helpers@latest']],
  ['ember-cli-latest'],
];

let port = 7357;
export function getPort() {
  return port++;
}

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
