import { types, visit } from "recast";

const b = types.builders;

export default async function transformTestHelper(ast) {
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

  // Local ember-qunit.start is qunitStart to prevent conflict with the start function we define
  const imports = ast.program.body.filter((node) => {
    // Remove loadTests from imports
    return node.type === 'ImportDeclaration' &&
      node.source.value !== 'ember-qunit/test-loader'
  });
  const emberQunitImport = imports.find((node) => node.source.value === 'ember-qunit');
  if (emberQunitImport) {
    const startSpecifier = emberQunitImport.specifiers.find((specifier) => {
      return specifier.type === 'ImportSpecifier' &&
        specifier.imported.type === 'Identifier' &&
        specifier.imported.name === 'start';
    });
    if (startSpecifier) {
      startSpecifier.local = b.identifier('qunitStart')
    }
  }

  visit(ast, {
    visitCallExpression(path) {
      if (path.value.callee.type === 'Identifier') {
        const { name } = path.value.callee;
        if (name === 'start') {
          // Replace call to start with qunitStart
          path.value.callee = b.identifier('qunitStart');
        } else if (name === 'loadTests') {
          // Remove call to loadTests
          debugger
        }
      }
      return false;
    }
  });

  // Wrap everything that is not an import in the start function
  const nodesToWrap = ast.program.body.slice(imports.length);
  const exportStart = b.exportNamedDeclaration(
    b.functionDeclaration(
      b.identifier('start'), 
      [], 
      b.blockStatement(nodesToWrap)
    )
  );

  ast.program.body = [...imports, exportStart];

  return ast;
}
