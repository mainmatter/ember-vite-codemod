import { types, visit } from 'recast';
import { getAppName } from '../utils/get-app-name.js';

const b = types.builders;

export default async function transformApp(ast) {
  const imports = ast.program.body.filter(
    (node) => node.type === 'ImportDeclaration',
  );
  const modulePrefix = await getAppName();

  // New location app/config/environment
  const configImport = imports.find(
    (node) => node.source.value === `${modulePrefix}/config/environment`,
  );
  if (configImport) {
    configImport.source = b.literal('./config/environment');
  }

  // Add import @embroider/virtual/compat-modules
  const compatModulesImport = imports.find(
    (node) => node.source.value === '@embroider/virtual/compat-modules',
  );
  if (!compatModulesImport) {
    const insertImportIndex = imports.length;
    ast.program.body.splice(
      insertImportIndex,
      0,
      b.importDeclaration(
        [b.importDefaultSpecifier(b.identifier('compatModules'))],
        b.literal('@embroider/virtual/compat-modules'),
      ),
    );
  }

  visit(ast, {
    // Change Resolver value to Resolver.withModules(compatModules)
    visitClassProperty(path) {
      if (
        path.value.key.type === 'Identifier' &&
        path.value.key.name === 'Resolver'
      ) {
        path.value.value = b.callExpression(
          b.memberExpression(
            b.identifier('Resolver'),
            b.identifier('withModules'),
          ),
          [b.identifier('compatModules')],
        );
      }
      return false;
    },

    // Add compatModules argument to loadInitializers
    visitCallExpression(path) {
      if (
        path.value.callee.type === 'Identifier' &&
        path.value.callee.name === 'loadInitializers' &&
        !path.value.arguments.find(
          (arg) => arg.type === 'Identifier' && arg.name === 'compatModules',
        )
      ) {
        path.value.arguments.push(b.identifier('compatModules'));
      }
      return false;
    },
  });

  return ast;
}
