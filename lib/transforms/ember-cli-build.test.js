import { parse, print } from 'recast';
import babelParser from 'recast/parsers/babel.js';
import { describe, it, expect } from 'vitest';
import transformEmberCliBuild from './ember-cli-build.js';

async function parseAndApply(input, isEmbroiderWebpack = false) {
  let ast = await parse(input, { parser: babelParser });
  ast = await transformEmberCliBuild(ast, isEmbroiderWebpack);
  return print(ast).code;
}

describe('ember-cli-build() function', () => {
  // Includes:
  // - it adds @embroider/compat import
  // - it adds @embroider/vite dynamic import
  // - if uses compatBuild and buildOnce in the return statement
  it('transforms a default ember-cli-build', async () => {
    expect(
      await parseAndApply(
        `
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
module.exports = function (defaults) {
  const app = new EmberApp(defaults, {});
  return app.toTree();
};`,
      ),
    ).toMatchInlineSnapshot(`
      "
      const EmberApp = require('ember-cli/lib/broccoli/ember-app');

      const {
        compatBuild
      } = require("@embroider/compat");

      module.exports = async function(defaults) {
        const {
          buildOnce
        } = await import("@embroider/vite");

        const app = new EmberApp(defaults, {});
        return compatBuild(app, buildOnce);
      };"
    `);
  });

  it('removes @embroider/webpack import at the top of the file (isEmbroiderWebpack)', async () => {
    expect(
      await parseAndApply(
        `
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { Webpack } = require('@embroider/webpack');`,
        true,
      ),
    ).toMatchInlineSnapshot(`
      "
      const EmberApp = require('ember-cli/lib/broccoli/ember-app');
      const {
        compatBuild
      } = require("@embroider/compat");"
    `);
  });

  it('removes @embroider/webpack import in the exported function (isEmbroiderWebpack)', async () => {
    expect(
      await parseAndApply(
        `
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
module.exports = function (defaults) {
  const { Webpack } = require('@embroider/webpack');
  return require('@embroider/compat').compatBuild(app, Webpack, {});
};`,
        true,
      ),
    ).toMatchInlineSnapshot(`
      "
      const EmberApp = require('ember-cli/lib/broccoli/ember-app');

      const {
        compatBuild
      } = require("@embroider/compat");

      module.exports = async function(defaults) {
        const {
          buildOnce
        } = await import("@embroider/vite");
        return compatBuild(app, buildOnce, {});
      };"
    `);
  });

  it('preserves build options, except skipBabel (isEmbroiderWebpack)', async () => {
    expect(
      await parseAndApply(
        `
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
module.exports = function (defaults) {
  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticEmberSource: true,
    staticAddonTrees: true,
    staticAddonTestSupportTrees: true,
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
  });
};`,
        true,
      ),
    ).toMatchInlineSnapshot(`
      "
      const EmberApp = require('ember-cli/lib/broccoli/ember-app');

      const {
        compatBuild
      } = require("@embroider/compat");

      module.exports = async function(defaults) {
        const {
          buildOnce
        } = await import("@embroider/vite");

        return compatBuild(app, buildOnce, {
          staticEmberSource: true,
          staticAddonTrees: true,
          staticAddonTestSupportTrees: true
        });
      };"
    `);
  });
});
