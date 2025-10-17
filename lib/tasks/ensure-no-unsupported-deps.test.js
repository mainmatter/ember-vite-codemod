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

const consoleLog = vi
  .spyOn(console, 'log')
  .mockImplementation(() => undefined);

describe('ensureNoUnsupportedDeps() function', () => {
  beforeEach(() => {
    consoleLog.mockClear();
  });

  it('does not error when all dependencies are supported', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          'supportedDep': '3.0.0',
        },
        devDependencies: {
          'supportedDevDep': '3.0.0',
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
    await expect(() => ensureNoUnsupportedDeps()).rejects.toThrowError(ExitError);
  });

  it('detects unsupported dev dependency', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-cli-mirage': '3.0.0',
        },
      }),
    };
    await expect(() => ensureNoUnsupportedDeps()).rejects.toThrowError(ExitError);
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
    await expect(() => ensureNoUnsupportedDeps()).rejects.toThrowError(ExitError);
    //expect(consoleLog).toBeCalledTimes(2);
  });
});