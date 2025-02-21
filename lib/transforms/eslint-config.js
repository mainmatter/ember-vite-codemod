import { visit } from "recast";

function removeNodeFromArray(toRemoveNode, elementsPath) {
  const { elements } = elementsPath.parentPath.value;
  const index = elements.findIndex(item => item === toRemoveNode);
  elements.splice(index, 1);

  if (elements.length === 0) {
    const propertyNode = elementsPath.parentPath.parent.value;
    const propertiesPath = elementsPath.parentPath.parentPath.parentPath;
    removePropertyFromObject(propertyNode, propertiesPath);
  }
}

function removePropertyFromObject(propertyNode, propertiesPath) {
  const objectExprNode = propertiesPath.parentPath.value;
  const { properties } = objectExprNode;
  const index = properties.findIndex(item => item === propertyNode);
  properties.splice(index, 1);
 
  if (properties.length === 0) {
    let parentPath = propertiesPath.parentPath.parentPath;
    if (parentPath.name && parentPath.name === 'elements') {
      removeNodeFromArray(objectExprNode, parentPath);
    } else if (parentPath.value.type === 'ObjectProperty') {
      removePropertyFromObject(parentPath.value, parentPath.parentPath);
    }
  }
}

// TODO: requireConfigFile

export default async function transformEslintConfig(ast) {
  visit(ast, {
    visitStringLiteral(path) {
      if (path.value.value === '@babel/plugin-proposal-decorators') {
        const literalNode = path.value;
        const parentPath = path.parentPath;
        const parentNode = path.parent.value;
        // If no options, plugins: ["@babel/plugin-proposal-decorators", ...otherPlugins]
        const isDefinedWithoutOptions = (parentPath.parentPath.parent.value.type === 'ObjectProperty')
        if (isDefinedWithoutOptions) {
          removeNodeFromArray(literalNode, parentPath, parentNode);
        } else {
          removeNodeFromArray(parentNode, parentPath.parentPath.parentPath);
        }
      }
      this.traverse(path);
    }
  });
  return ast;
}