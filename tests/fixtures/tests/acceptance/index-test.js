import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from '../helpers';

// FIXME: Remove once https://github.com/embroider-build/ember-auto-import/pull/667 is merged
import '@glimmer/component';

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /index', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/');
  });
});
