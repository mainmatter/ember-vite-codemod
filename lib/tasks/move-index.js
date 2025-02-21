
import { rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export default async function moveIndex() {
  if (existsSync('index.html')) {
    console.warn("File 'index.html' already exists so we are skipping it.");
    return;
  }
  await rename(
    'app/index.html',
    'index.html'
  );
}