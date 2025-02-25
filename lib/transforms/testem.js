import { types } from 'recast';

const b = types.builders;

export default async function transformTestem(ast) {
  // Add: if (typeof module !== 'undefined')
  const moduleExportsIndex = ast.program.body.findIndex((node) => {
    return (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'AssignmentExpression' &&
      node.expression.left.type === 'MemberExpression' &&
      node.expression.left.object.type === 'Identifier' &&
      node.expression.left.object.name === 'module' &&
      node.expression.left.property.type === 'Identifier' &&
      node.expression.left.property.name === 'exports'
    );
  });

  if (moduleExportsIndex < 0) {
    console.log(
      "testem.js: 'module.export = {...}' expression was not found at the first level of testem.js; does the file already fit the new requirements?",
    );
    return ast;
  }

  const moduleExport = ast.program.body[moduleExportsIndex];

  const ifStatement = b.ifStatement(
    b.binaryExpression(
      '!==',
      b.unaryExpression('typeof', b.identifier('module')),
      b.literal('undefined'),
    ),
    b.blockStatement([moduleExport]),
  );

  ast.program.body[moduleExportsIndex] = ifStatement;

  return ast;
}
