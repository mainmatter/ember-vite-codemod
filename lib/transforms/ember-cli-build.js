// Known issue: the Esprima parser recast uses by default doesn't support the syntax
// 'import await' used in the output ember-cli-build.js, which means this file cannot
// be parsed twice if the codemod has to be re-run for some reason. Non blocking.

import { types, visit } from 'recast';

const b = types.builders;

export default async function transformEmberCliBuild(ast) {
  // const { compatBuild } = require('@embroider/compat');
  let propCompatBuild = ast.program.body.find((node) => {
    return (
      node.type === 'VariableDeclaration' &&
      node.declarations[0].id.type === 'ObjectPattern' &&
      node.declarations[0].id.properties[0].key.type === 'Identifier' &&
      node.declarations[0].id.properties[0].key.name === 'compatBuild'
    );
  });
  if (!propCompatBuild) {
    let lastDeclarationIndex = ast.program.body.findLastIndex(
      (node) => node.type === 'VariableDeclaration',
    );
    lastDeclarationIndex = Math.max(lastDeclarationIndex, 0);

    propCompatBuild = b.objectProperty(
      b.identifier('compatBuild'),
      b.identifier('compatBuild'),
    );
    propCompatBuild.shorthand = true;
    const requireCompat = b.variableDeclaration('const', [
      b.variableDeclarator(
        b.objectPattern([propCompatBuild]),
        b.callExpression(b.identifier('require'), [
          b.literal('@embroider/compat'),
        ]),
      ),
    ]);
    ast.program.body.splice(lastDeclarationIndex + 1, 0, requireCompat);
  }

  visit(ast, {
    visitAssignmentExpression(path) {
      if (
        path.value.left.type === 'MemberExpression' &&
        path.value.left.object.type === 'Identifier' &&
        path.value.left.object.name === 'module' &&
        path.value.left.property.type === 'Identifier' &&
        path.value.left.property.name === 'exports'
      ) {
        // module.exports function is async
        path.value.right.async = true;

        const statements = path.value.right.body.body;
        let propBuildOnce = statements.find((statement) => {
          return (
            statement.type === 'VariableDeclaration' &&
            statement.declarations[0].id.type === 'ObjectPattern' &&
            statement.declarations[0].id.properties[0].key.type ===
              'Identifier' &&
            statement.declarations[0].id.properties[0].key.name === 'buildOnce'
          );
        });

        // const { buildOnce } = await import('@embroider/vite');
        if (!propBuildOnce) {
          propBuildOnce = b.objectProperty(
            b.identifier('buildOnce'),
            b.identifier('buildOnce'),
          );
          propBuildOnce.shorthand = true;
          path.value.right.body.body.unshift(
            b.variableDeclaration('const', [
              b.variableDeclarator(
                b.objectPattern([propBuildOnce]),
                b.awaitExpression(
                  b.callExpression(b.import(), [b.literal('@embroider/vite')]),
                ),
              ),
            ]),
          );
        }
      }

      // return compatBuild(app, buildOnce);
      this.traverse(path, {
        visitReturnStatement(path) {
          path.value.argument = b.callExpression(b.identifier('compatBuild'), [
            b.identifier('app'),
            b.identifier('buildOnce'),
          ]);
          return false;
        },
      });
    },
  });

  return ast;
}
