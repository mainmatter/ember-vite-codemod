# ember-vite-codemod

Migrate your Ember app to build with Vite.

## Usage

// TO BE WRITEN

## Steps

The codemod executes a sequence of several ordered tasks. At the end of the process, reinstall your dependencies; if your app follows the standards the codemod expects, it should now builds correctly using Vite. If something went wrong, the sections below detail what the codemod expectations are and what it tries to output so you can figure out how to complete the migration manually.

### Checking for unsupported dependencies

This is a verification task, it doesn't change your code.

The codemod will first check there are no know dependency that is incompatible with the way Vite works. `ember-fetch` needs to go.

### Checking addons are v2

This is a verification task, it doesn't change your code.

The codemod will look at all your Ember dependencies and will advise you for updates.

When you use Embroider in an app that depends on v1 addons, Embroider will try to auto-fix the v1 addons a way that make them compatible with Vite. This approach works for a number of known addons, but we cannot guarantee it will work for any v1 addon you use. The best way to avoid issues is that your classic app already relies only on v2 addons, and the codemod will guide you in that direction:

- If one of your addons is v1 but the latest version on npm is v2, it's recommended to update.
- If one of your addons is v1 and no v2 format is available, it's recommended to look to a different alternative or make the addon v2.
- If one of your addons is v1 but it's known as being correctly rewriten by Embroider, the codemod won't notice you about it.
- If one of your addons is v1 comes from Ember app blueprint and is no longer used in Embroider+Vite world, the codemod won't notice you about it.

### Creating new required files

From this step, the codemod is done with verifications and starts modifying your code.

First, it creates new files that are now required for Embroider+Vite. These files are copied direclty from the [embroider-build/app-blueprint](https://github.com/embroider-build/app-blueprint), so you can refer to this repository to see the expected content:

- [app/config/environment.js](https://github.com/embroider-build/app-blueprint/blob/main/files-override/shared/app/config/environment.js)
- [vite.config.mjs](https://github.com/embroider-build/app-blueprint/blob/main/files-override/shared/vite.config.mjs)
- [babel.config.cjs](https://github.com/embroider-build/app-blueprint/blob/main/files/js/babel.config.cjs)

### Moving `index.html` at the root

Vite expects the `index.html` to be at the root of the app. The codemod will move your existing `app/index.html` at the root rather than creating a new file, this way it keeps all the customizations you added.

### Running code replacements on... `index.html`

When running the Vite dev server, the files `vendor.js` and `vendor.css` are no longer physical files, it's Embroider that generates their content and returns it to Vite. To let Vite identify these _virtual_ files the source is changed to the following:

```diff
- <link integrity="" rel="stylesheet" href="{{rootURL}}assets/vendor.css">
- <link integrity="" rel="stylesheet" href="{{rootURL}}assets/my-classic-app.css">
+ <link integrity="" rel="stylesheet" href="/@embroider/virtual/vendor.css">
+ <link integrity="" rel="stylesheet" href="/@embroider/virtual/app.css">

- <script src="{{rootURL}}assets/vendor.js"></script>
+ <script src="/@embroider/virtual/vendor.js"></script>
```

Additionaly, we no longer import an assets `my-classic-app.js`. Instead, the script that boots the app is defined directly inline with a script of type module. If you use any v1 addon implementing a content-for "app-boot" and you want to keep its behavior, this is where the implementation should go. The default content is the following:

```diff
- <script src="{{rootURL}}assets/my-classic-app.js"></script>
+ <script type="module">
+   import Application from './app/app';
+   import environment from './app/config/environment';
+
+   Application.create(environment.APP);
+ </script>
```

### Running code replacements on... `tests/index.html`

The changes in `tests/index.html` follow the same principle as for `index.html`. Additionally, we remove `{{content-for "test-body-footer"}}` because it checks tests are loaded at a time they are not loaded yet.

```diff
- <link integrity="" rel="stylesheet" href="{{rootURL}}assets/vendor.css">
- <link integrity="" rel="stylesheet" href="{{rootURL}}assets/my-classic-app.css">
- <link integrity="" rel="stylesheet" href="{{rootURL}}assets/test-support.css">
+ <link integrity="" rel="stylesheet" href="/@embroider/virtual/vendor.css">
+ <link integrity="" rel="stylesheet" href="/@embroider/virtual/app.css">
+ <link integrity="" rel="stylesheet" href="/@embroider/virtual/test-support.css">

- <script src="{{rootURL}}assets/vendor.js"></script>
- <script src="{{rootURL}}assets/test-support.js"></script>
+ <script src="/@embroider/virtual/vendor.js"></script>
+ <script src="/@embroider/virtual/test-support.js"></script>

- <script src="{{rootURL}}assets/my-classic-app.js"></script>
- <script src="{{rootURL}}assets/tests.js"></script>
+ <script type="module">
+  import { start } from './test-helper';
+   import.meta.glob("./**/*.{js,ts,gjs,gts}", { eager: true });
+   start();
+ </script>

- {{content-for "test-body-footer"}}
```

### Running code replacements on... `app/config/environment.js`

Since the file `app/config/environment.js` is created out of the app blueprint, it has a placeholder `<%= name %>` for your app name. Replace it with the name of your app. The name to use can be read in `ENV.modulePrefix` in your `config/environment.js`.

### Running code replacements on... `ember-cli-build.js`

Instead of building the app directly with Broccoli, we use `@embroider/compat`, a module that essentially serves as a bridge between classic apps and modern Vite apps. The Broccoli app instance is still there, but it's passed in argument to Embroider.

Considering an empty 6.2 Ember app, the codemod does the following:

```diff
 'use strict';

  const EmberApp = require('ember-cli/lib/broccoli/ember-app');
+ const { compatBuild } = require('@embroider/compat');

  module.exports = function (defaults) {
+   const { buildOnce } = await import('@embroider/vite');
    const app = new EmberApp(defaults, {
      // Add options here
    });

-   return app.toTree();
+   return compatBuild(app, buildOnce);
  };
```

### Running code replacements on... `testem.js`

The change in this file introduces a new way to prevent its execution when tests run directly in the browser.

The codemod will look for the `module.exports` and wraps it in a conditional that checks the `module` existence.

```diff
  'use strict';

+ if (typeof module !== 'undefined') {
    module.exports = { ... }
+ }
```

### Running code replacements on... `tests/test-helper.js`

If you go back to the modifications done in `tests/index.html`, you can see the new script imports ` { start } from './test-helper`, regirsters the test file then call `start`. The `start` function is the one the codemod creates at the present step.

Instead of loading the tests then calling `start` from `ember-qunit` directly, we rather export a `start` function that we are able to call whenever we want.

Considering an empty 6.2 Ember app, the codemod does the following:

```diff
  import Application from 'my-empty-classic-app/app';
  import config from 'my-empty-classic-app/config/environment';
  import * as QUnit from 'qunit';
  import { setApplication } from '@ember/test-helpers';
  import { setup } from 'qunit-dom';
- import { loadTests } from 'ember-qunit/test-loader';
- import { start, setupEmberOnerrorValidation } from 'ember-qunit';
+ import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

+ export function start() {
    setApplication(Application.create(config.APP));

    setup(QUnit.assert);
    setupEmberOnerrorValidation();
-   loadTests();
-   start();
+   qunitStart();
+ }
```

### Running replacements on... `package.json`

Last but not least, the codemod will modify three sorts of things in the `package.json`:

- It will replace the build and test commands to use Vite instead of the legacy Ember commands.
- It will add meta that identify your app as v2 Ember app.
- It will remove and add a bunch of dependencies.

The codemod looks for the commands `build`, `start`, and `test:ember`, and will rewrite them as:

```json
"build": "vite build",
"start": "vite",
"test:ember": "vite build --mode test && ember test --path dist"
```

It will create the following fields with the following content:

```json
"ember-addon": {
  "type": "app",
  "version": 2
},
"exports": {
  "./tests/*": "./tests/*",
  "./*": "./app/*"
}
```

The list of packages that are removed and add can be found in the codemod source:

- [Packages the codemod adds](https://github.com/mainmatter/ember-vite-codemod/blob/main/lib/tasks/update-package-json.js#L18).
- [Packages the codemod removes](https://github.com/mainmatter/ember-vite-codemod/blob/main/lib/tasks/update-package-json.js#L6).

### Linter

The codemod won't touch anything about your linter configuration, as we don't want to presume what it looks like. Depending on the plugins you use, you may encounter issues to solve manually.

For instance, the codemod adds a dependency to `decorator-transforms` which is used in the new Babel config `babel.config.cjs`. If `'@babel/plugin-proposal-decorators'` was included in your `eslint.config.mjs`, then your linter will throw a parsing error "Cannot use the decorators and decorators-legacy plugin together".
