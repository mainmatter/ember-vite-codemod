import { parse, print } from 'recast';
import babelParser from 'recast/parsers/babel.js';
import { describe, it, expect, vi } from 'vitest';
import transformApp from './app.js';

vi.mock('../utils/get-app-name', async () => {
  return {
    getAppName: () => 'fancy-app',
  };
});

async function parseAndApply(input) {
  let ast = await parse(input, { parser: babelParser });
  ast = await transformApp(ast);
  return print(ast).code;
}

describe('transformApp() function', () => {
  it('transforms a default app.js', async () => {
    expect(
      await parseAndApply(
        `
import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'my-app/config/environment';
import { importSync, isDevelopingApp, macroCondition } from '@embroider/macros';

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow');
}

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);`,
      ),
    ).toMatchInlineSnapshot(`
      "
      import Application from '@ember/application';
      import Resolver from 'ember-resolver';
      import loadInitializers from 'ember-load-initializers';
      import config from 'my-app/config/environment';
      import { importSync, isDevelopingApp, macroCondition } from '@embroider/macros';

      import compatModules from "@embroider/virtual/compat-modules";

      if (macroCondition(isDevelopingApp())) {
        importSync('./deprecation-workflow');
      }

      export default class App extends Application {
        modulePrefix = config.modulePrefix;
        podModulePrefix = config.podModulePrefix;
        Resolver = Resolver.withModules(compatModules);
      }

      loadInitializers(App, config.modulePrefix, compatModules);"
    `);
  });
});
