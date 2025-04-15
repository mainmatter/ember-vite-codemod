import { describe, it, beforeEach, expect, vi } from 'vitest';

import ensureEmberCli from './ensure-ember-cli.js';

let files;

vi.mock('node:fs/promises', () => {
  return {
    readFile: (filename) => {
      return files[filename];
    },
  };
});

vi.spyOn(process, 'exit');

describe('ensureEmberCli() function', () => {
  beforeEach(() => {
    files = {};
  });

  it('throws if ember-source < 3.28', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-source': '~3.8.0',
          'ember-cli': '~3.8.0',
        },
      }),
    };
    await expect(() => ensureEmberCli()).rejects.toThrowError(
      'ember-source ~3.8.0 (< 3.28) was detected. Vite support is available from Ember 3.28 onwards.',
    );
  });

  it('throws if ember-cli < 4.12', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          'ember-source': '~3.28.0',
          'ember-cli': '~3.28.0',
        },
      }),
    };
    await expect(() => ensureEmberCli()).rejects.toThrowError(
      'ember-cli ~3.28.0 (< 4.12) was detected. Vite support requires at least ember-cli 4.12. You can update ember-cli independently of ember-source, Vite support is available from ember-source 3.28 onwards.',
    );
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
    await ensureEmberCli();
  });
});
