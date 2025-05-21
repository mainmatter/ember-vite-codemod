import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function getAppName() {
  const ENV = await import(
    pathToFileURL(join(process.cwd(), 'config/environment.js'))
  );
  return ENV.default().modulePrefix;
}
