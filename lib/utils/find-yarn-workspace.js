import fs from 'fs';
import path from 'path';

/**
 * Recursively finds the Yarn workspace root.
 * Starts at cwd and walks upward until it finds a package.json with "workspaces".
 *
 * @param {string} [cwd=process.cwd()] - Starting directory
 * @returns {string|null} Absolute path to workspace root or null if not found
 */
export function findYarnWorkspaceRoot(cwd = process.cwd()) {
  let current = cwd;

  while (true) {
    const pkgPath = path.join(current, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkgJson.workspaces) {
          return current;
        }
      } catch (err) {
        break;
        // ignore malformed JSON
      }
    }

    const parent = path.dirname(current);
    if (parent === current) break; // reached filesystem root
    current = parent;
  }

  return '';
}