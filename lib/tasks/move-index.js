import { rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export default async function moveIndex() {
  if (existsSync('index.html')) {
    console.warn("Skiping file 'index.html' since it already exists.");
    return;
  }
  await rename('app/index.html', 'index.html');
}
