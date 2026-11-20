import { globSync } from 'glob';

export function detectTypescript(cwd = process.cwd()) {
  // Workspace packages and root tool configs can use TS in a JS app.
  const typescriptFiles = globSync(
    '{tsconfig.json,{app,tests,types}/**/*.{ts,cts,mts,gts}}',
    {
      cwd,
      ignore: '**/node_modules/**',
    },
  );

  return typescriptFiles.length > 0;
}
