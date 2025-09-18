import { globSync } from 'glob';

export function detectTypescript() {
  const typescriptFiles = globSync('{tsconfig.json,**/*.{ts,cts,mts,gts}}', {
    cwd: process.cwd(),
    ignore: 'node_modules/**',
  });

  return typescriptFiles.length > 0;
}
