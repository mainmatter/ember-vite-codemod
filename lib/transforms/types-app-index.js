import { types } from 'recast';

const b = types.builders;

export default async function transformTypesAppIndex(ast) {
  const imports = ast.program.body.filter(
    (node) => node.type === 'ImportDeclaration',
  );
  const embroiderTypesImport = imports.find(
    (node) => node.source.value === '@embroider/core/types/virtual',
  );
  if (!embroiderTypesImport) {
    const insertImportIndex = imports.length;
    ast.program.body.splice(
      insertImportIndex,
      0,
      b.importDeclaration(
        [],
        b.literal('@embroider/core/types/virtual'),
      ),
    );
  }
  return ast;
}