import { describe, it, expect } from 'vitest';
import transformTypesIndex from './typesIndex';

describe('transformTypesIndex() function', () => {
  it('does not add the code for @embroider/core/virtual if already found', async () => {
    let code = `/// <reference types="@embroider/core/virtual" />`;
    code = await transformTypesIndex(code);
    expect(code).toMatchInlineSnapshot(`
      "/// <reference types="vite/client" />
      /// <reference types="@embroider/core/virtual" />"
    `);
  });

  it('does not add the code for @embroider/core/virtual if @embroider/core/types/virtual is found', async () => {
    let code = `import '@embroider/core/types/virtual';`;
    code = await transformTypesIndex(code);
    expect(code).toMatchInlineSnapshot(`
      "/// <reference types="vite/client" />
      import '@embroider/core/types/virtual';"
    `);
  });

  it('does not add the code for vite/client if already found', async () => {
    let code = `/// <reference types="vite/client" />`;
    code = await transformTypesIndex(code);
    expect(code).toMatchInlineSnapshot(`
      "/// <reference types="@embroider/core/virtual" />
      /// <reference types="vite/client" />"
    `);
  });

  it('adds the code for @embroider/core/virtual and vite/client', async () => {
    let code = ``;
    code = await transformTypesIndex(code);
    expect(code).toMatchInlineSnapshot(`
      "/// <reference types="@embroider/core/virtual" />
      /// <reference types="vite/client" />
      "
    `);
  });
});
