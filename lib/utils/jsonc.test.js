import { describe, it, expect } from 'vitest';
import { modifyJsonc } from './jsonc.js';

describe('jsonc utils', () => {
  describe('modifyJsonc()', () => {
    it('modifies jsonc content without affecting commments', async () => {
      const after = modifyJsonc(
        `
				{
				  "aString": "foo",
				  "aNumber": 42,
				  // comment
				  "anArray": ["foo", "bar"],
				  "anObject": {
				    "foo": 1337,
				  },
				}
			`,
        'anArray',
        ['baz'],
      );

      expect(after).toMatchInlineSnapshot(`
				"
								{
								  "aString": "foo",
								  "aNumber": 42,
								  // comment
								  "anArray": [
				            "baz"
				          ],
								  "anObject": {
								    "foo": 1337,
								  },
								}
							"
			`);
    });
  });
});
