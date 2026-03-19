import { describe, it, expect } from 'vitest';
import babelParser from 'recast/parsers/babel.js';
import { parse, print } from 'recast';
import transformTestHelper from './test-helper.js';

async function parseAndApply(input) {
  let ast = await parse(input, { parser: babelParser });
  ast = await transformTestHelper(ast);
  return print(ast).code;
}

describe('test-helper() function', () => {
  it('transforms a default test-helper', async () => {
    expect(
      await parseAndApply(`
        import Application from 'my-empty-classic-app/app';
        import config from 'my-empty-classic-app/config/environment';
        import * as QUnit from 'qunit';
        import { setApplication } from '@ember/test-helpers';
        import { setup } from 'qunit-dom';
        import { loadTests } from 'ember-qunit/test-loader';
        import { start, setupEmberOnerrorValidation } from 'ember-qunit';
        
        setApplication(Application.create(config.APP));
        
        setup(QUnit.assert);
        setupEmberOnerrorValidation();
        loadTests();
        start();
    `),
    ).toMatchInlineSnapshot(`
      "
              import Application from 'my-empty-classic-app/app';
              import config from 'my-empty-classic-app/config/environment';
              import * as QUnit from 'qunit';
              import { setApplication } from '@ember/test-helpers';
              import { setup } from 'qunit-dom';
              import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

              export function start() {
                      setApplication(Application.create(config.APP));

                      setup(QUnit.assert);
                      setupEmberOnerrorValidation();
                      qunitStart();
              }
          "
    `);
  });

  it('works when loadTests, setupEmberOnerrorValidation are not present', async () => {
    expect(
      await parseAndApply(`
        import Application from 'my-empty-classic-app/app';
        import config from 'my-empty-classic-app/config/environment';
        import * as QUnit from 'qunit';
        import { setApplication } from '@ember/test-helpers';
        import { setup } from 'qunit-dom';
        import { start } from 'ember-qunit';
        
        setApplication(Application.create(config.APP));
        
        setup(QUnit.assert);
        start();
    `),
    ).toMatchInlineSnapshot(`
      "
              import Application from 'my-empty-classic-app/app';
              import config from 'my-empty-classic-app/config/environment';
              import * as QUnit from 'qunit';
              import { setApplication } from '@ember/test-helpers';
              import { setup } from 'qunit-dom';
              import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

              export function start() {
                      setApplication(Application.create(config.APP));

                      setup(QUnit.assert);
                      setupEmberOnerrorValidation();
                      qunitStart();
              }
          "
    `);
  });

  it('works with classic ember-exam setup', async () => {
    expect(
      await parseAndApply(`
        import Application from 'my-empty-classic-app/app';
        import config from 'my-empty-classic-app/config/environment';
        import * as QUnit from 'qunit';
        import { setApplication } from '@ember/test-helpers';
        import { setup } from 'qunit-dom';
        import { setupEmberOnerrorValidation } from 'ember-qunit';
        import { start } from 'ember-exam/test-support';

        setApplication(Application.create(config.APP));

        setup(QUnit.assert);
        setupEmberOnerrorValidation();
        start();
    `),
    ).toMatchInlineSnapshot(`
      "
              import Application from 'my-empty-classic-app/app';
              import config from 'my-empty-classic-app/config/environment';
              import * as QUnit from 'qunit';
              import { setApplication } from '@ember/test-helpers';
              import { setup } from 'qunit-dom';
              import { setupEmberOnerrorValidation } from 'ember-qunit';
              import { start as startEmberExam } from "ember-exam/addon-test-support";

              export async function start() {
                      setApplication(Application.create(config.APP));

                      setup(QUnit.assert);
                      setupEmberOnerrorValidation();
                      await startEmberExam();
              }
          "
    `);
  });

  it('works with ember-exam default import', async () => {
    expect(
      await parseAndApply(`
        import Application from 'my-empty-classic-app/app';
        import config from 'my-empty-classic-app/config/environment';
        import * as QUnit from 'qunit';
        import { setApplication } from '@ember/test-helpers';
        import { setup } from 'qunit-dom';
        import { setupEmberOnerrorValidation } from 'ember-qunit';
        import start from 'ember-exam/test-support/start';

        setApplication(Application.create(config.APP));

        setup(QUnit.assert);
        setupEmberOnerrorValidation();
        start();
    `),
    ).toMatchInlineSnapshot(`
      "
              import Application from 'my-empty-classic-app/app';
              import config from 'my-empty-classic-app/config/environment';
              import * as QUnit from 'qunit';
              import { setApplication } from '@ember/test-helpers';
              import { setup } from 'qunit-dom';
              import { setupEmberOnerrorValidation } from 'ember-qunit';
              import { start as startEmberExam } from "ember-exam/addon-test-support";

              export async function start() {
                      setApplication(Application.create(config.APP));

                      setup(QUnit.assert);
                      setupEmberOnerrorValidation();
                      await startEmberExam();
              }
          "
    `);
  });
});
