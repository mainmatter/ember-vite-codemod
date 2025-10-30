import shared from '@embroider/shared-internals';
const packageCache = new shared.PackageCache(process.cwd());
const app = packageCache.get(packageCache.appRoot);

export function resolveVersion(packageName) {
  try {
    return packageCache.resolve(packageName, app).version;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return undefined;
    }
    throw err;
  }
}
