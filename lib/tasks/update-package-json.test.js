import { describe, it, beforeEach, expect, vi } from 'vitest';

import updatePackageJson from './update-package-json';

let files;

vi.mock('node:fs/promises', () => {
  return {
    readFile: (filename) => {
      return files[filename];
    },
    writeFile: (filename, content) => {
      files[filename] = JSON.parse(content);
    },
  };
});

describe('updatePackageJson() function', () => {
  beforeEach(() => {
    files = {};
  });

  it('does not error with an empty package.json', async () => {
    files = {
      'package.json': '{}',
    };
    await updatePackageJson();
  });

  it('updates the scripts', async () => {
    files = {
      'package.json': JSON.stringify({
        scripts: {
          build: 'ember build --environment=production',
          lint: 'concurrently "pnpm:lint:*(!fix)" --names "lint:" --prefixColors auto',
          'lint:hbs': 'ember-template-lint .',
          'lint:js': 'eslint . --cache',
          start: 'ember serve',
          test: 'concurrently "pnpm:lint" "pnpm:test:*" --names "lint,test:" --prefixColors auto',
          'test:ember': 'ember test',
        },
      }),
    };
    await updatePackageJson();
    expect(files['package.json'].scripts).toMatchInlineSnapshot(`
      {
        "build": "vite build",
        "lint": "concurrently "pnpm:lint:*(!fix)" --names "lint:" --prefixColors auto",
        "lint:hbs": "ember-template-lint .",
        "lint:js": "eslint . --cache",
        "start": "vite",
        "test": "concurrently "pnpm:lint" "pnpm:test:*" --names "lint,test:" --prefixColors auto",
        "test:ember": "vite build --mode test && ember test --path dist",
      }
    `);
  });

  it('adds the expected meta', async () => {
    files = {
      'package.json': '{}',
    };
    await updatePackageJson();
    expect(files['package.json']['ember-addon']).toMatchInlineSnapshot(`
      {
        "type": "app",
        "version": 2,
      }
    `);
    expect(files['package.json']['exports']).toMatchInlineSnapshot(`
      {
        "./*": "./app/*",
        "./tests/*": "./tests/*",
      }
    `);
  });

  it('adds missing dependencies in devDependencies', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {},
      }),
    };

    await updatePackageJson();
    expect(files['package.json']['devDependencies']).toMatchInlineSnapshot(`
      {
        "@babel/plugin-transform-runtime": "^7.26.9",
        "@ember/string": "^4.0.0",
        "@ember/test-helpers": "^4.0.0",
        "@embroider/compat": "^4.0.3",
        "@embroider/config-meta-loader": "^1.0.0",
        "@embroider/core": "^4.0.3",
        "@embroider/vite": "^1.1.1",
        "@rollup/plugin-babel": "^6.0.4",
        "babel-plugin-ember-template-compilation": "^2.3.0",
        "decorator-transforms": "^2.3.0",
        "ember-load-initializers": "^3.0.0",
        "ember-qunit": "^9.0.0",
        "ember-resolver": "^13.0.0",
        "vite": "^6.0.0",
      }
    `);
  });

  it('removes dependencies', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          'loader.js': 'x.x.x',
          webpack: 'x.x.x',
        },
        devDependencies: {
          '@embroider/webpack': 'x.x.x',
          'broccoli-asset-rev': 'x.x.x',
        },
      }),
    };
    await updatePackageJson();
    const pck = files['package.json'];
    expect(pck['dependencies']).toStrictEqual({});
    expect(pck['devDependencies']).not.toHaveProperty('@embroider/webpack');
    expect(pck['devDependencies']).not.toHaveProperty('broccoli-asset-rev');
    expect(pck['devDependencies']).toHaveProperty('vite');
  });

  // Note: the snapshot approach also asserts the absence of duplicated deps between dependencies and devDependencies
  it('updates dependencies to the minimum required version (packagesToAdd)', async () => {
    files = {
      'package.json': JSON.stringify({
        dependencies: {
          '@ember/string': '^3.0.0',
          vite: '100.0.0', // make sure the test always go through a case where the current version is bigger
        },
        devDependencies: {
          '@embroider/compat': '^4.0.0',
          '@embroider/core': '100.0.0', // make sure the test always go through a case where the current version is bigger
        },
      }),
    };
    await updatePackageJson();
    expect(files['package.json']['dependencies']).toMatchInlineSnapshot(`
      {
        "@ember/string": "^4.0.0",
        "vite": "100.0.0",
      }
    `);
    expect(files['package.json']['devDependencies']).toMatchInlineSnapshot(`
      {
        "@babel/plugin-transform-runtime": "^7.26.9",
        "@ember/test-helpers": "^4.0.0",
        "@embroider/compat": "^4.0.3",
        "@embroider/config-meta-loader": "^1.0.0",
        "@embroider/core": "100.0.0",
        "@embroider/vite": "^1.1.1",
        "@rollup/plugin-babel": "^6.0.4",
        "babel-plugin-ember-template-compilation": "^2.3.0",
        "decorator-transforms": "^2.3.0",
        "ember-load-initializers": "^3.0.0",
        "ember-qunit": "^9.0.0",
        "ember-resolver": "^13.0.0",
      }
    `);
  });

  it('updates dependencies to the minimum required version (packagesToUpdate)', async () => {
    files = {
      'package.json': JSON.stringify({
        devDependencies: {
          '@embroider/router': '2.1.8',
        },
      }),
    };
    await updatePackageJson();
    let pck = files['package.json'];
    expect(pck['devDependencies']).toHaveProperty(
      '@embroider/router',
      '^3.0.1',
    );

    files = {
      'package.json': JSON.stringify({
        dependencies: {
          '@embroider/router': '2.1.8',
        },
      }),
    };
    await updatePackageJson();
    pck = files['package.json'];
    expect(pck['dependencies']).toHaveProperty('@embroider/router', '^3.0.1');
  });
});
