import { getAppName } from '../utils/get-app-name.js';

export default async function transformIndexHTML(code, { isTest }) {
  const sharedReplacements = [
    {
      before: '{{rootURL}}assets/vendor.css',
      after: '/@embroider/virtual/vendor.css',
    },
    {
      before: '{{rootURL}}assets/${MODULE_PREFIX}.css',
      after: '/@embroider/virtual/app.css',
    },
    {
      before: `{{rootURL}}assets/vendor.js`,
      after: `/@embroider/virtual/vendor.js`,
    },
  ];

  const appReplacements = [
    {
      before: '<script src="{{rootURL}}assets/${MODULE_PREFIX}.js"></script>',
      after: `<script type="module">
      import Application from './app/app';
      import environment from './app/config/environment';

      Application.create(environment.APP);
    </script>`,
    },
  ];

  const testReplacements = [
    {
      before: '{{rootURL}}assets/test-support.css',
      after: '/@embroider/virtual/test-support.css',
    },
    {
      before: '{{rootURL}}assets/test-support.js',
      after: '/@embroider/virtual/test-support.js',
    },
    {
      before: '<script src="{{rootURL}}assets/${MODULE_PREFIX}.js"></script>',
      after: '',
    },
    {
      before: '<script src="{{rootURL}}assets/tests.js"></script>',
      after: `<script type="module">import "ember-testing";</script>
    <script type="module">
      import { start } from './test-helper';
      import.meta.glob("./**/*.{js,ts,gjs,gts}", { eager: true });
      start();
    </script>`,
    },
    {
      before: '{{content-for "test-body-footer"}}',
      after: '',
    },
  ];

  const replacements = isTest
    ? [...sharedReplacements, ...testReplacements]
    : [...sharedReplacements, ...appReplacements];

  const modulePrefix = await getAppName();
  for (const replacement of replacements) {
    code = code.replaceAll(
      replacement.before.replace('${MODULE_PREFIX}', modulePrefix),
      replacement.after.replace('${MODULE_PREFIX}', modulePrefix),
    );
  }
  return code;
}
