import { types, visit } from 'recast';

const b = types.builders;

export default async function transformTestHelper(ast) {
  let exportStart = ast.program.body.find((node) => {
    return (
      node.type === 'ExportNamedDeclaration' &&
      node.declaration.type === 'FunctionDeclaration' &&
      node.declaration.id.type === 'Identifier' &&
      node.declaration.id.name === 'start'
    );
  });
  if (exportStart) {
    console.log(
      "test-helper.js: found 'export function start' at the first level of test-helper.js; does the file already fit the new requirements?",
    );
    return ast;
  }

  const allImports = ast.program.body.filter(
    (node) => node.type === 'ImportDeclaration',
  );
  const imports = allImports.filter(
    (node) => node.source.value !== 'ember-qunit/test-loader',
  );

  // Local ember-qunit.start is qunitStart to prevent conflict with the start function we define
  const emberQunitImport = imports.find(
    (node) => node.source.value === 'ember-qunit',
  );
  if (emberQunitImport) {
    const startSpecifier = emberQunitImport.specifiers.find((specifier) => {
      return (
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.type === 'Identifier' &&
        specifier.imported.name === 'start'
      );
    });
    if (startSpecifier) {
      startSpecifier.local = b.identifier('qunitStart');
      // This instruction is a workaround to force recast reprint the specifier correctly,
      // related to https://github.com/benjamn/recast/issues/1171.
      // When this line is removed, we end up with 'qunitStart' instead of 'start as qunitStart'.
      startSpecifier.original = null;
    }
  } else {
    console.log(
      "tests/test-helper.js: No import from 'ember-qunit' was found. This is unexpected and it prevents this file to be transformed.",
    );
    return ast;
  }

  // Move all import declarations at the top
  ast.program.body.sort((a, b) => {
    const isImportA = a.type === 'ImportDeclaration';
    const isImportB = b.type === 'ImportDeclaration';
    if (isImportA && !isImportB) {
      return -1;
    } else if (!isImportA && isImportB) {
      return 1;
    }
    return 0;
  });

  visit(ast, {
    visitCallExpression(path) {
      if (path.value.callee.type === 'Identifier') {
        const { name } = path.value.callee;
        if (name === 'start') {
          // Replace call to start with qunitStart
          path.value.callee = b.identifier('qunitStart');
          return false;
        } else if (name === 'loadTests') {
          // Remove call to loadTests
          if (
            path.parentPath.value.type !== 'ExpressionStatement' ||
            path.parentPath.parentPath.name !== 'body'
          ) {
            console.log(
              'tests/test-helper.js: loadTests() seems to be called in an unexpected context. Please remove this call manually, it is no longer used when building with Vite.',
            );
          } else {
            const body = path.parentPath.parentPath.value;
            const indexToRemove = body.findIndex(
              (statement) => statement === path.parentPath.value,
            );
            body.splice(indexToRemove, 1);
          }
          return false;
        }
      }
      this.traverse(path);
    },
  });

  // Wrap everything that is not an import in the start function
  const nodesToWrap = ast.program.body.slice(allImports.length);
  exportStart = b.exportNamedDeclaration(
    b.functionDeclaration(
      b.identifier('start'),
      [],
      b.blockStatement(nodesToWrap),
    ),
  );
  ast.program.body = [...imports, exportStart];

  return ast;
}
