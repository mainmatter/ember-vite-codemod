import { get } from 'lodash-es';
import { parse as jsoncParse } from 'jsonc-parser';

import { modifyJsonc } from '../utils/jsonc.js';

export default async function transformTsConfig(tsconfig) {
  const before = jsoncParse(tsconfig);
  const types = get(before, 'compilerOptions.types') ?? [];
  const hasTypes =
    types.includes('@embroider/core/virtual') && types.includes('vite/client');

  if (hasTypes) {
    return tsconfig;
  }

  const after = modifyJsonc(tsconfig, 'compilerOptions.types', [
    ...new Set([...types, '@embroider/core/virtual', 'vite/client']),
  ]);

  return after;
}
