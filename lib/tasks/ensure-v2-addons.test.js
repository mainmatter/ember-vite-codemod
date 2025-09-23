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

const consoleWarn = vi
  .spyOn(console, 'warn')
  .mockImplementation(() => undefined);

describe('ensureV2Addons() function', () => {
  beforeEach(() => {
    files = {};
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

  it('shows an error when you have a dependency that was not yet upgraded to v2', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-welcome-page': '^5.0.0',
        },
      }),
    };

    await expect(() => ensureV2Addons()).rejects.toThrowError(ExitError);
  });

  it('warns but does not error when you have a package that can not be looked up publically', async () => {
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
      'Could not look up information about @mainmatter/super-private-does-really-exist-i-promise. You need to verify if this addon is a v2 addon manually.',
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

    expect(consoleWarn).toBeCalledTimes(1);
    expect(consoleWarn).toBeCalledWith(
      '@mainmatter/super-private-does-really-exist-i-promise was identified as a v1 addon, but it was not possible to check if a v2 format was released. Is this package private? Sometimes Embroider can auto-fix v1 addons, but the success is not guarantee for every addon. If you notice an issue, consider removing this dependency, or making it v2.',
    );
  });
});
