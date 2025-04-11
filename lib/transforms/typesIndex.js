export default async function transformTypesIndex(code) {
  if (!code.includes('vite/client')) {
    code = `/// <reference types="vite/client" />\n${code}`;
  }
  if (
    !code.includes('@embroider/core/virtual') &&
    !code.includes('@embroider/core/types/virtual')
  ) {
    code = `/// <reference types="@embroider/core/virtual" />\n${code}`;
  }
  return code;
}
