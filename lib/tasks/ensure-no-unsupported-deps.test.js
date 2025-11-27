import { describe, it, beforeEach, expect, vi } from 'vitest';

import ensureNoUnsupportedDeps, {
  ensureKnownAddons,
  ensureEmberCli,
} from './ensure-no-unsupported-deps';

let files;
let mockedVersions = {};

vi.mock('../utils/resolve-version.js', () => {
  return {
    resolveVersion: function (packageName) {
      return mockedVersions[packageName];
    },
  };
});

vi.mock('node:fs/promises', () => {
  return {
    readFile: (filename) => {
      return files[filename];
    },
  };
});

const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

vi.spyOn(process, 'exit');

describe('ensureNoUnsupportedDeps() function', () => {
  beforeEach(() => {
    consoleLog.mockClear();
  });

  it('does not error when all dependencies are supported', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          supportedDep: '3.0.0',
        },
        devDependencies: {
          supportedDevDep: '3.0.0',
          'ember-source': '~3.28.0',
          'ember-cli': '~4.12.0',
        },
      }),
    };
    mockedVersions = {
      'ember-source': '3.28.0',
      'ember-cli': '4.12.0',
    };

    await ensureNoUnsupportedDeps();
  });

  it('throws when unsupported dependencies for Ember and addons', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-source': '~3.28.0',
          'ember-cli': '~3.28.0',
          'ember-fetch': '3.0.0',
        },
      }),
    };
    mockedVersions = {
      'ember-source': '3.28.0',
      'ember-cli': '3.28.0',
    };

    await expect(() => ensureNoUnsupportedDeps()).rejects.toThrowError(
      `Detected unsupported dependencies:

* ember-cli 3.28.0 (< 4.12) was detected. Vite support requires at least ember-cli 4.12. You can update ember-cli independently of ember-source, Vite support is available from ember-source 3.28 onwards.

* Your app contains a dependency to ember-fetch. ember-fetch behaves a way that is incompatible with modern JavaScript tooling, including building with Vite.
Please remove ember-fetch dependency then run this codemod again. Check out https://rfcs.emberjs.com/id/1065-remove-ember-fetch to see recommended alternatives.`,
    );
  });
});

describe('ensureKnownAddons() function', () => {
  it('does not error when all dependencies are supported', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          supportedDep: '3.0.0',
        },
        devDependencies: {
          supportedDevDep: '3.0.0',
        },
      }),
    };
    let output = await ensureKnownAddons();
    expect(output).toMatchInlineSnapshot(`[]`);
  });

  it('detects unsupported dependency', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          'ember-fetch': '3.0.0',
        },
      }),
    };
    let output = await ensureKnownAddons();
    expect(output).toMatchInlineSnapshot(`
      [
        "Your app contains a dependency to ember-fetch. ember-fetch behaves a way that is incompatible with modern JavaScript tooling, including building with Vite.
      Please remove ember-fetch dependency then run this codemod again. Check out https://rfcs.emberjs.com/id/1065-remove-ember-fetch to see recommended alternatives.",
      ]
    `);
  });

  it('detects unsupported dev dependency', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-cli-mirage': '3.0.0',
        },
      }),
    };
    let output = await ensureKnownAddons();
    expect(output).toMatchInlineSnapshot(`
      [
        "Your app contains a dependency to ember-cli-mirage. ember-cli-mirage doesn't work correctly with Vite.
      Please move from ember-cli-mirage to ember-mirage then run this codemod again. Checkout https://github.com/bgantzler/ember-mirage/blob/main/docs/migration.md for guidance.",
      ]
    `);
  });

  it('returns several messages at once', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-css-modules': '3.0.0',
          'ember-cli-mirage': '3.0.0',
        },
      }),
    };
    let output = await ensureKnownAddons();
    expect(output).toMatchInlineSnapshot(`
      [
        "Your app contains a dependency to ember-cli-mirage. ember-cli-mirage doesn't work correctly with Vite.
      Please move from ember-cli-mirage to ember-mirage then run this codemod again. Checkout https://github.com/bgantzler/ember-mirage/blob/main/docs/migration.md for guidance.",
        "Your app contains a dependency to ember-css-modules. ember-css-modules behavior is incompatible with Vite, you should migrate to a different solution to manage your CSS modules.
      There is a recommended migration path that you can follow for a file by file migration to ember-scoped-css, which is compatible with Vite. Checkout https://github.com/BlueCutOfficial/css-modules-to-scoped-css",
      ]
    `);
  });
});

describe('ensureEmberCli() function', () => {
  beforeEach(() => {
    files = {};
    mockedVersions = {};
  });

  it('detects if ember-source < 3.28', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-source': '~3.8.0',
          'ember-cli': '~3.8.0',
        },
      }),
    };
    mockedVersions = {
      'ember-source': '3.8.0',
      'ember-cli': '3.8.0',
    };

    let output = await ensureEmberCli();
    expect(output).toMatchInlineSnapshot(`
      [
        "ember-source 3.8.0 (< 3.28) was detected. Vite support is available from Ember 3.28 onwards.",
        "ember-cli 3.8.0 (< 4.12) was detected. Vite support requires at least ember-cli 4.12. You can update ember-cli independently of ember-source, Vite support is available from ember-source 3.28 onwards.",
      ]
    `);
  });

  it('detects if ember-cli < 4.12', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-source': '~3.28.0',
          'ember-cli': '~3.28.0',
        },
      }),
    };
    mockedVersions = {
      'ember-source': '3.28.0',
      'ember-cli': '3.28.0',
    };

    let output = await ensureEmberCli();
    expect(output).toMatchInlineSnapshot(`
      [
        "ember-cli 3.28.0 (< 4.12) was detected. Vite support requires at least ember-cli 4.12. You can update ember-cli independently of ember-source, Vite support is available from ember-source 3.28 onwards.",
      ]
    `);
  });

  it('ends without error when required versions are installed', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-source': '~3.28.0',
          'ember-cli': '~4.12.0',
        },
      }),
    };
    mockedVersions = {
      'ember-source': '3.28.0',
      'ember-cli': '4.12.0',
    };
    let output = await ensureEmberCli();
    expect(output).toMatchInlineSnapshot(`[]`);
  });
});
