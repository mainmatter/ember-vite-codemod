import { describe, it, beforeEach, expect, vi } from 'vitest';

import ensureNoUnsupportedDeps from './ensure-no-unsupported-deps';
import { ExitError } from '../utils/exit.js';

let files;

vi.mock('node:fs/promises', () => {
  return {
    readFile: (filename) => {
      return files[filename];
    },
  };
});

const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

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
        },
      }),
    };
    await ensureNoUnsupportedDeps();
  });

  it('detects unsupported dependency', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          'ember-fetch': '3.0.0',
        },
      }),
    };
    await expect(() => ensureNoUnsupportedDeps()).rejects.toThrowError(
      ExitError,
    );
  });

  it('detects unsupported dev dependency', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-cli-mirage': '3.0.0',
        },
      }),
    };
    await expect(() => ensureNoUnsupportedDeps()).rejects.toThrowError(
      ExitError,
    );
  });

  it('logs several messages at once', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-css-modules': '3.0.0',
          'ember-cli-mirage': '3.0.0',
        },
      }),
    };
    await expect(() => ensureNoUnsupportedDeps()).rejects.toThrowError(
      ExitError,
    );
    expect(consoleLog).toHaveBeenCalledTimes(2);
    expect(consoleLog).toHaveBeenCalledWith(
      `Your app contains a dependency to ember-cli-mirage. ember-cli-mirage doesn't work correctly with Vite.
Please move from ember-cli-mirage to ember-mirage then run this codemod again. Checkout https://github.com/bgantzler/ember-mirage/blob/main/docs/migration.md for guidance.
  `,
    );
    expect(consoleLog).toHaveBeenCalledWith(
      `Your app contains a dependency to ember-css-modules. ember-css-modules behavior is incompatible with Vite, you should migrate to a different solution to manage your CSS modules.
There is a recommended migration path that you can follow for a file by file migration to ember-scoped-css, which is compatible with Vite. Checkout https://github.com/BlueCutOfficial/css-modules-to-scoped-css
  `,
    );
  });
});
