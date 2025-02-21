import { types, visit } from "recast";
import { getAppName } from '../utils/get-app-name.js';

const b = types.builders;

export default async function transformApp(ast) {
  const imports = ast.program.body.filter((node) => node.type === 'ImportDeclaration');
  const insertImportIndex = imports.length;

  // New location app/config/environment
  const configImport = imports.find((node) => node.source.value === `${getAppName()}/config/environment`);
  if (configImport) {
    configImport.source = b.literal('./config/environment');
  }

  // Add import @embroider/virtual/compat-modules
  b.importDeclaration(
    [b.importSpecifier(b.identifier('compatModules'))],
    b.literal('@embroider/virtual/compat-modules')
  )
  ast.program.body.splice(insertImportIndex, 0);

  visit(ast, {
    // Change Resolver value to Resolver.withModules(compatModules)
    visitClassProperty(path) {
      if (path.value.key.type === 'Identifier' &&
        path.value.key.name === 'Resolver'
      ) {
        path.value.value = b.callExpression(
          b.memberExpression(
            b.identifier('Resolver'),
            b.identifier('withModules')
          ),
          [b.identifier('compatModules')]
        )
      }
      return false;
    },

    // Add compatModules argument to loadInitializers
    visitCallExpression(path) {
      if (path.value.callee.type === 'Identifier' &&
        path.value.callee.name === 'loadInitializers'
      ) {
        path.value.arguments.push(b.identifier('compatModules'))
      }
    }
  })

  return ast
}