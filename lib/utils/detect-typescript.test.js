import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectTypescript } from './detect-typescript.js';

let cwd;

function addFile(path) {
  mkdirSync(dirname(join(cwd, path)), { recursive: true });
  writeFileSync(join(cwd, path), '');
}

describe('detectTypescript() function', () => {
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'detect-typescript-'));
    addFile('app/app.js');
    addFile('tests/test-helper.js');
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('returns false for a JavaScript app', () => {
    expect(detectTypescript(cwd)).toBe(false);
  });

  it('returns true when tsconfig.json exists', () => {
    addFile('tsconfig.json');
    expect(detectTypescript(cwd)).toBe(true);
  });

  it('returns true when the app has TypeScript files', () => {
    addFile('app/components/foo.gts');
    expect(detectTypescript(cwd)).toBe(true);
  });

  it('returns true when the tests have TypeScript files', () => {
    addFile('tests/unit/foo-test.ts');
    expect(detectTypescript(cwd)).toBe(true);
  });

  it('ignores TypeScript files outside of the app folders', () => {
    addFile('playwright.config.ts');
    addFile('e2e/acceptance/foo.spec.ts');
    addFile('svelte/src/lib/foo.ts');
    addFile('packages/foo/index.ts');
    addFile('node_modules/foo/index.d.ts');
    addFile('app/node_modules/foo/index.d.ts');
    expect(detectTypescript(cwd)).toBe(false);
  });
});
