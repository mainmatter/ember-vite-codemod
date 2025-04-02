import { describe, it, expect } from "vitest";
import { parse, print } from 'recast';
import babelParser from 'recast/parsers/babel.js';
import transformTypesAppIndex from "./types-app-index";

async function getTransformedCode(code) {
  let ast = parse(code, { parser: babelParser });
  ast = await transformTypesAppIndex(ast);
  return print(ast).code;
}

describe('transform types/MODULE_PREFIX/index.d', () => {
  it('inserts the import in an empty file', async () => {
    let code = ``;
    code = await getTransformedCode(code);
    expect(code).toStrictEqual(`import "@embroider/core/types/virtual";`);
  });

  it('inserts the import after other imports', async () => {
    let code = `import someFile from 'somewhere';`;
    code = await getTransformedCode(code);
    expect(code).toStrictEqual(`import someFile from 'somewhere';
import "@embroider/core/types/virtual";`);
  });

  it('does not duplicate preexisting import', async () => {
    let code = `import '@embroider/core/types/virtual';`;
    code = await getTransformedCode(code);
    expect(code).toStrictEqual(`import '@embroider/core/types/virtual';`);
  });
});