import { types, visit } from "recast";

const b = types.builders;

export default async function transformEmberCliBuild(ast) {
  // Add: const { compatBuild } = require('@embroider/compat');
  const lastDeclarationIndex = ast.program.body.findLastIndex(node => node.type === 'VariableDeclaration')
  const propCompatBuild = b.objectProperty(
    b.identifier('compatBuild'),
    b.identifier('compatBuild')
  );
  propCompatBuild.shorthand = true;
  const requireCompat = b.variableDeclaration('const', [
    b.variableDeclarator(
      b.objectPattern([propCompatBuild]),
      b.callExpression(b.identifier('require'), [
        b.literal('@embroider/compat')
      ])
    )
  ]);
  ast.program.body.splice(lastDeclarationIndex + 1, 0, requireCompat);

  visit(ast, {
    // Replace: module.exports function is async
    visitAssignmentExpression(path) {
      if (path.value.left.type === 'MemberExpression' &&
        path.value.left.object.type === 'Identifier' &&
        path.value.left.object.name === 'module' &&
        path.value.left.property.type === 'Identifier' &&
        path.value.left.property.name === 'exports'
      ) {
        path.value.right.async = true;

        // Add: const { buildOnce } = await import('@embroider/vite');
        const propBuildOnce = b.objectProperty(
          b.identifier('buildOnce'),
          b.identifier('buildOnce')
        );
        propBuildOnce.shorthand = true;
        path.value.right.body.body.unshift(
          b.variableDeclaration('const', [
            b.variableDeclarator(
              b.objectPattern([propBuildOnce]),
              b.awaitExpression(b.callExpression(
                b.import(),
                [b.literal('@embroider/vite')]
              ))
            )
          ])
        )
      }
      // Replace: return compatBuild(app, buildOnce);
      this.traverse(
        path, {
          visitReturnStatement(path) {
            path.value.argument = b.callExpression(
              b.identifier('compatBuild'), [
                b.identifier('app'),
                b.identifier('buildOnce')
              ]
            )
            return false;
          }
        }
      );
    },
  });

  return ast;
}