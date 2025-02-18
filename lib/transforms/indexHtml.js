import { join } from 'node:path';

export default async function transformIndexHTML(code) {
  const replacements = [{
    before: '{{rootURL}}assets/vendor.css',
    after: '/@embroider/virtual/vendor.css'
  }, {
    before: '{{rootURL}}assets/${MODULE_PREFIX}.css',
    after: '/@embroider/virtual/${MODULE_PREFIX}.css'
  }, {
    before: `{{rootURL}}assets/vendor.js`,
    after: `/@embroider/virtual/vendor.js`
  }, {
    before: '<script src="{{rootURL}}assets/${MODULE_PREFIX}.js"></script>',
    after: `<script type="module">
      import Application from './app/app';
      import environment from './app/config/environment';

      Application.create(environment.APP);
    </script>`
  }];

  const modulePrefix = await getAppName();
  for (const replacement of replacements) {
    code = code.replaceAll(
      replacement.before.replace('${MODULE_PREFIX}', modulePrefix), 
      replacement.after.replace('${MODULE_PREFIX}', modulePrefix),
    );
  }
  return code;
}

async function getAppName() {
  const ENV = await import(join(process.cwd(), 'config/environment.js'));
  return ENV.default().modulePrefix;
}