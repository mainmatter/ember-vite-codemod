import { types, visit } from 'recast';
import { getAppName } from '../utils/get-app-name.js';
import semver from 'semver';

const b = types.builders;

export default async function transformApp(ast, { emberVersion } = {}) {
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

  // add import for legacy inspector support
  const inspectorSupportImport = imports.find((node) =>
    node.source.value.startsWith('@embroider/legacy-inspector-support/'),
  );

  if (!inspectorSupportImport) {
    let legacyInspectorImportPath =
      '@embroider/legacy-inspector-support/ember-source-4.12';

    if (emberVersion && semver.lt(emberVersion, '4.8.0')) {
      legacyInspectorImportPath =
        '@embroider/legacy-inspector-support/ember-source-3.28';
    } else if (emberVersion && semver.lt(emberVersion, '4.12.0')) {
      legacyInspectorImportPath =
        '@embroider/legacy-inspector-support/ember-source-4.8';
    }

    const insertImportIndex = imports.length;
    ast.program.body.splice(
      insertImportIndex,
      0,
      b.importDeclaration(
        [b.importDefaultSpecifier(b.identifier('setupInspector'))],
        b.literal(legacyInspectorImportPath),
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

    // make sure that we add the inspector support to the application class
    visitClassDeclaration(path) {
      if (path.value.superClass.name === 'Application') {
        // find the inspector if it hasn't been deinfed already
        const inspectorProperty = path.value.body.body.find(
          (node) =>
            node.type === 'ClassProperty' && node.key.name === 'inspector',
        );

        if (!inspectorProperty) {
          path.value.body.body.push(
            b.classProperty(
              b.identifier('inspector'),
              b.callExpression(b.identifier('setupInspector'), [
                b.thisExpression(),
              ]),
            ),
          );
        }
      }
      return this.traverse(path);
    },
  });

  return ast;
}
