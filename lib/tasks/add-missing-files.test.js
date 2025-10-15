import { describe, beforeEach, it, expect, vi } from 'vitest';
import addMissingFiles from './add-missing-files';

let initialFiles;
let addedFiles;

vi.mock('node:fs', async () => {
  return {
    existsSync: () => {},
    mkdirSync: () => {},
  };
});

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    stat: (destination) => {
      if (!initialFiles[destination]) {
        throw Error('This file is not part of the initial files fixture.');
      }
      return initialFiles[destination];
    },
    writeFile: (filename, content) => {
      addedFiles[filename] = content;
    },
  };
});

const consoleWarn = vi
  .spyOn(console, 'warn')
  .mockImplementation(() => undefined);

describe('addMissingFiles() function', () => {
  beforeEach(() => {
    initialFiles = {};
    addedFiles = {};
    consoleWarn.mockClear();
  });

  it('it adds files that are not language-specific', async () => {
    await addMissingFiles();
    expect(addedFiles['vite.config.mjs']).toBeDefined();
    expect(addedFiles['.env.development']).toBeDefined();
  });

  it('it does not add files that are already present', async () => {
    initialFiles = {
      '.env.development': '# env content',
    };
    await addMissingFiles();

    expect(addedFiles['vite.config.mjs']).toBeDefined();
    expect(addedFiles['.env.development']).toBeUndefined();
    expect(consoleWarn).toBeCalledTimes(1);
    expect(consoleWarn).toBeCalledWith(
      "Skipping file '.env.development' since it already exists.",
    );
  });

  it('it adds JS-specific files with .js extension, but not TS-specific files', async () => {
    await addMissingFiles();
    expect(addedFiles['babel.config.cjs']).not.toMatch(
      /@babel\/plugin-transform-typescript/,
    );
    expect(addedFiles['app/config/environment.js']).toBeDefined();
    expect(addedFiles['app/config/environment.ts']).toBeUndefined();
  });

  it('it adds TS-specific files, but not JS-specific files', async () => {
    await addMissingFiles({ ts: true });
    expect(addedFiles['babel.config.cjs']).toMatch(
      /@babel\/plugin-transform-typescript/,
    );
    expect(addedFiles['app/config/environment.ts']).toBeDefined();
    expect(addedFiles['app/config/environment.js']).toBeUndefined();
  });
});
