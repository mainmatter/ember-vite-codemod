import { describe, it, beforeEach, expect, vi } from 'vitest';

import ensureV2Addons from './ensure-v2-addons';
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

const consoleWarn = vi
  .spyOn(console, 'warn')
  .mockImplementation(() => undefined);

describe('ensureV2Addons() function', () => {
  beforeEach(() => {
    files = {};
    consoleLog.mockClear();
    consoleWarn.mockClear();
  });

  it('wont error with an empty package.json', async () => {
    files = {
      'package.json': '{}',
    };

    await ensureV2Addons();
  });

  it('shows no error when you have a dependency that does not use ember-addon meta', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          '@babel/eslint-parser': '^7.26.10',
        },
      }),
    };

    await ensureV2Addons();
  });

  it('shows no error when you have a dependency that was upgraded to v2', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          'ember-welcome-page': '^6.0.0',
        },
      }),
    };

    await ensureV2Addons();
  });

  it('notifies and stops when you have a dependency that was not yet upgraded to v2', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-welcome-page': '^5.0.0',
        },
      }),
    };

    await expect(() => ensureV2Addons()).rejects.toThrowError(ExitError);
    expect(consoleLog).toBeCalledTimes(1);
    expect(consoleLog).toBeCalledWith(
      expect.stringMatching(
        /addon\(s\) whose latest version is now a .*v2 addon.*\..*ember-welcome-page/s,
      ),
    );
  });

  it('notifies and continues when you have a dependency that is still a v1 addon', async () => {
    /*
     * ember-test-selectors is a relatively safe case to use because it will remain a v1 addon.
     * The way to move to "v2" is to configure strip-test-selectors plugins in the Babel config
     * directly. This test may have to change if we want to figure out a way to notify users
     * about this, but that could be an overkill.
     */
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-test-selectors': '^7.1.0',
        },
      }),
    };

    await ensureV2Addons();

    expect(consoleLog).toBeCalledTimes(1);
    expect(consoleLog).toBeCalledWith(
      expect.stringMatching(
        /addon\(s\) which are .*v1 only.*and cannot be updated to v2 format\..*ember-test-selectors/s,
      ),
    );
  });

  it('notifies and continues when you have a package that can not be looked up publically', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          '@mainmatter/super-private-does-really-exist-i-promise': '^5.0.0',
        },
      }),
    };

    await ensureV2Addons();

    expect(consoleWarn).toBeCalledTimes(1);
    expect(consoleWarn).toBeCalledWith(
      'Could not look up information about "@mainmatter/super-private-does-really-exist-i-promise". You need to verify if this addon is a v2 addon manually.',
    );
  });

  it('looks into local package.json first', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          '@mainmatter/super-private-does-really-exist-i-promise': '^5.0.0',
        },
      }),
      'node_modules/@mainmatter/super-private-does-really-exist-i-promise/package.json':
        JSON.stringify({
          'ember-addon': {
            configPath: 'tests/dummy/config',
          },
        }),
    };

    await ensureV2Addons();

    expect(consoleLog).toBeCalledTimes(1);
    expect(consoleLog).toBeCalledWith(
      expect.stringMatching(
        /Is this package private\?.*@mainmatter\/super-private-does-really-exist-i-promise/s,
      ),
    );
  });
});
