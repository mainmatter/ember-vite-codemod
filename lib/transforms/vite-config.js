const mismatchedModulePrefixReplacements = [
  {
    before: `export default defineConfig({`,
    after: `export default defineConfig({
  resolve: {
    alias: {
      '\${FAKE_NAME}': '\${REAL_NAME}',
    }
  },`,
  },
];

export function addModulePrefixAlias(code, fakeName, realName) {
  const replacements = [...mismatchedModulePrefixReplacements];

  for (const replacement of replacements) {
    let after = replacement.after
      .replace('${REAL_NAME}', realName)
      .replace('${FAKE_NAME}', fakeName);

    code = code.replaceAll(replacement.before, after);
  }
  return code;
}
