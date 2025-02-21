import { join } from 'node:path';

export async function getAppName() {
  const ENV = await import(join(process.cwd(), 'config/environment.js'));
  return ENV.default().modulePrefix;
}