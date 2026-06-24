import { readFile } from 'node:fs/promises';

export async function detectEmberExam() {
  const packageJSON = JSON.parse(await readFile('package.json', 'utf-8'));

  return Boolean(
    packageJSON.dependencies?.['ember-exam'] ||
      packageJSON.devDependencies?.['ember-exam'],
  );
}
