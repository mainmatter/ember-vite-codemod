import { modify, applyEdits } from 'jsonc-parser';

/**
 *
 * @param {string} source
 * @param {string} propertyPath - eg. foo[2].bar.baz
 * @param {any} value
 * @returns {string}
 */
export function modifyJsonc(source, propertyPath, value) {
  const paths =
    typeof propertyPath === 'string'
      ? propertyPath.split(/[.[\]]+/).filter(Boolean)
      : propertyPath;
  const edits = modify(source, paths, value, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  });

  return applyEdits(source, edits);
}
