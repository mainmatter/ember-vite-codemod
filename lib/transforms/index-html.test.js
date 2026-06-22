import { describe, it, expect, vi } from 'vitest';
import transformIndexHTML from './index-html.js';

vi.mock('../utils/get-app-name', async () => {
  return {
    getAppName: () => 'fancy-app',
  };
});

async function parseAndApply(
  code,
  options = { isTest: false, emberExam: false },
) {
  return await transformIndexHTML(code, options);
}

describe('index.html', () => {
  it('transforms a default index.html', async () => {
    expect(
      await parseAndApply(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>MyApp</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{content-for "head"}}

    <link integrity="" rel="stylesheet" href="{{rootURL}}assets/vendor.css">
    <link integrity="" rel="stylesheet" href="{{rootURL}}assets/fancy-app.css">

    {{content-for "head-footer"}}
  </head>
  <body>
    {{content-for "body"}}

    <script src="{{rootURL}}assets/vendor.js"></script>
    <script src="{{rootURL}}assets/fancy-app.js"></script>

    {{content-for "body-footer"}}
  </body>
</html>
    `),
    ).toMatchInlineSnapshot(`
      "
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>MyApp</title>
          <meta name="description" content="">
          <meta name="viewport" content="width=device-width, initial-scale=1">

          {{content-for "head"}}

          <link integrity="" rel="stylesheet" href="/@embroider/virtual/vendor.css">
          <link integrity="" rel="stylesheet" href="/@embroider/virtual/app.css">

          {{content-for "head-footer"}}
        </head>
        <body>
          {{content-for "body"}}

          <script src="/@embroider/virtual/vendor.js"></script>
          <script type="module">
            import Application from './app/app';
            import environment from './app/config/environment';

            Application.create(environment.APP);
          </script>

          {{content-for "body-footer"}}
        </body>
      </html>
          "
    `);
  });
});

describe('tests/index.html', () => {
  it('transforms a default tests/index.html', async () => {
    expect(
      await parseAndApply(
        `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>MyApp Tests</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{content-for "head"}}
    {{content-for "test-head"}}

    <link rel="stylesheet" href="{{rootURL}}assets/vendor.css">
    <link rel="stylesheet" href="{{rootURL}}assets/fancy-app.css">
    <link rel="stylesheet" href="{{rootURL}}assets/test-support.css">

    {{content-for "head-footer"}}
    {{content-for "test-head-footer"}}
  </head>
  <body>
    {{content-for "body"}}
    {{content-for "test-body"}}

    <div id="qunit"></div>
    <div id="qunit-fixture">
      <div id="ember-testing-container">
        <div id="ember-testing"></div>
      </div>
    </div>

    <script src="/testem.js" integrity="" data-embroider-ignore></script>
    <script src="{{rootURL}}assets/vendor.js"></script>
    <script src="{{rootURL}}assets/test-support.js"></script>
    <script src="{{rootURL}}assets/fancy-app.js"></script>
    <script src="{{rootURL}}assets/tests.js"></script>

    {{content-for "body-footer"}}
    {{content-for "test-body-footer"}}
  </body>
</html>
    `,
        { isTest: true },
      ),
    ).toMatchInlineSnapshot(`
      "
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>MyApp Tests</title>
          <meta name="description" content="">
          <meta name="viewport" content="width=device-width, initial-scale=1">

          {{content-for "head"}}
          {{content-for "test-head"}}

          <link rel="stylesheet" href="/@embroider/virtual/vendor.css">
          <link rel="stylesheet" href="/@embroider/virtual/app.css">
          <link rel="stylesheet" href="/@embroider/virtual/test-support.css">

          {{content-for "head-footer"}}
          {{content-for "test-head-footer"}}
        </head>
        <body>
          {{content-for "body"}}
          {{content-for "test-body"}}

          <div id="qunit"></div>
          <div id="qunit-fixture">
            <div id="ember-testing-container">
              <div id="ember-testing"></div>
            </div>
          </div>

          <script src="/testem.js" integrity="" data-embroider-ignore></script>
          <script src="/@embroider/virtual/vendor.js"></script>
          <script src="/@embroider/virtual/test-support.js"></script>
          
          <script type="module">import "ember-testing";</script>
          <script type="module">
            import { start } from './test-helper';
            import.meta.glob("./**/*.{js,ts,gjs,gts}", { eager: true });
            start();
          </script>

          {{content-for "body-footer"}}
          
        </body>
      </html>
          "
    `);
  });

  it('transforms a tests/index.html with ember-exam support', async () => {
    expect(
      await parseAndApply(
        `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>MyApp Tests</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{content-for "head"}}
    {{content-for "test-head"}}

    <link rel="stylesheet" href="{{rootURL}}assets/vendor.css">
    <link rel="stylesheet" href="{{rootURL}}assets/fancy-app.css">
    <link rel="stylesheet" href="{{rootURL}}assets/test-support.css">

    {{content-for "head-footer"}}
    {{content-for "test-head-footer"}}
  </head>
  <body>
    {{content-for "body"}}
    {{content-for "test-body"}}

    <div id="qunit"></div>
    <div id="qunit-fixture">
      <div id="ember-testing-container">
        <div id="ember-testing"></div>
      </div>
    </div>

    <script src="/testem.js" integrity="" data-embroider-ignore></script>
    <script src="{{rootURL}}assets/vendor.js"></script>
    <script src="{{rootURL}}assets/test-support.js"></script>
    <script src="{{rootURL}}assets/fancy-app.js"></script>
    <script src="{{rootURL}}assets/tests.js"></script>

    {{content-for "body-footer"}}
    {{content-for "test-body-footer"}}
  </body>
</html>
    `,
        { isTest: true, emberExam: true },
      ),
    ).toMatchInlineSnapshot(`
      "
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>MyApp Tests</title>
          <meta name="description" content="">
          <meta name="viewport" content="width=device-width, initial-scale=1">

          {{content-for "head"}}
          {{content-for "test-head"}}

          <link rel="stylesheet" href="/@embroider/virtual/vendor.css">
          <link rel="stylesheet" href="/@embroider/virtual/app.css">
          <link rel="stylesheet" href="/@embroider/virtual/test-support.css">

          {{content-for "head-footer"}}
          {{content-for "test-head-footer"}}
        </head>
        <body>
          {{content-for "body"}}
          {{content-for "test-body"}}

          <div id="qunit"></div>
          <div id="qunit-fixture">
            <div id="ember-testing-container">
              <div id="ember-testing"></div>
            </div>
          </div>

          <script src="/testem.js" integrity="" data-embroider-ignore></script>
          <script src="/@embroider/virtual/vendor.js"></script>
          <script src="/@embroider/virtual/test-support.js"></script>
          
          <script type="module">import "ember-testing";</script>
          <script type="module">
            import { start } from './test-helper';
            const availableModules = import.meta.glob("./**/*.{js,ts,gjs,gts}");
            start({ availableModules });
          </script>

          {{content-for "body-footer"}}
          
        </body>
      </html>
          "
    `);
  });
});
