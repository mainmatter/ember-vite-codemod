import { describe, it, beforeEach, expect, vi } from 'vitest';

import ensureV2Addons from './ensure-v2-addons';

let files;

vi.mock('node:fs/promises', () => {
  return {
    readFile: (filename) => {
      return files[filename];
    },
  };
});

vi.spyOn(process, 'exit').mockImplementation((number) => {
  throw new Error('process.exit: ' + number);
});

const consoleWarn = vi
  .spyOn(console, 'warn')
  .mockImplementation(() => undefined);

describe('ensureV2Addons() function', () => {
  beforeEach(() => {
    files = {};
  });

  it('wont error with an empty package.json', async () => {
    files = {
      'package.json': '{}',
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

    await expect(() => ensureV2Addons()).rejects.toThrowError(
      'process.exit: 1',
    );
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
});
