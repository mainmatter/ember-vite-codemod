import { types, visit } from 'recast';

const b = types.builders;

export default async function transformEmberCliBuild(ast, { isEmbroiderWebpack }) {
  if (isEmbroiderWebpack) {
    ast = removeWebpackImport(ast);
  }

  ast = addEmbroiderCompatImport(ast);

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

        // Add "const { buildOnce } = await import('@embroider/vite');"
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
          let optionsNode;
          // Retrieve options to pass them to the new return statement
          if (
            isEmbroiderWebpack &&
            path.value.argument.type === 'CallExpression' &&
            path.value.argument.arguments.length === 3
          ) {
            optionsNode = removeSkipBabelQunit(
              path.value.argument.arguments[2],
            );
          }
          path.value.argument = b.callExpression(b.identifier('compatBuild'), [
            b.identifier('app'),
            b.identifier('buildOnce'),
          ]);
          if (optionsNode) {
            path.value.argument.arguments.push(optionsNode);
          }
          return false;
        },
      });
    },
  });

  return ast;
}

// Add "const { compatBuild } = require('@embroider/compat');"
function addEmbroiderCompatImport(ast) {
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
  return ast;
}

// Remove "const { Webpack } = require('@embroider/webpack');"
// Only for apps building with @embroider/webpack
function removeWebpackImport(ast) {
  visit(ast, {
    visitVariableDeclaration(path) {
      if (
        path.value.declarations[0].init.type === 'CallExpression' &&
        path.value.declarations[0].init.arguments.length === 1 &&
        path.value.declarations[0].init.arguments[0].type === 'StringLiteral' &&
        path.value.declarations[0].init.arguments[0].value ===
          '@embroider/webpack'
      ) {
        // Expect parent.path to be a "body" array
        let body = path.parentPath;
        if (body.value.length) {
          let propWebpackIndex = body.value.findIndex(
            (node) => node === path.value,
          );
          body.value.splice(propWebpackIndex, 1);
        }
      }
      return false;
    },
  });
  return ast;
}

/*
 * The transform generally preserves build options when moving from Webpack to Vite,
 * but we do one exception for skipBabel on qunit package. This option is present in
 * the default --embroider app blueprint but needs to be removed. Additionally, this
 * codemod updates ember-qunit to a minimum required version that no longer need the
 * skip Babel on qunit.
 * Any other package in skipBabel is preserved, so it's up to the developer to ignore
 * them it using the new Babel config after the codemod has run.
 */
function removeSkipBabelQunit(optionsNode) {
  const { properties } = optionsNode;
  const skipBabelOptionIndex = properties.findIndex((propertyNode) => {
    return (
      propertyNode.key.type === 'Identifier' &&
      propertyNode.key.name === 'skipBabel'
    );
  });
  const skipBabelOption = properties[skipBabelOptionIndex];

  if (skipBabelOption) {
    const { elements } = skipBabelOption.value;
    let qunitIndex = elements.findIndex((elm) => {
      return (
        elm.type === 'ObjectExpression' &&
        elm.properties.some((skipProperty) => {
          return (
            skipProperty.key.name === 'package' &&
            skipProperty.value.type === 'StringLiteral' &&
            skipProperty.value.value === 'qunit'
          );
        })
      );
    });

    if (qunitIndex >= 0) {
      elements.splice(qunitIndex, 1);
      if (elements.length === 0) {
        properties.splice(skipBabelOptionIndex, 1);
      }
    }
  }
  return optionsNode;
}
