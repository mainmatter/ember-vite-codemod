import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ExitError, isExit } from '../utils/exit.js';

export default async function checkGitStatus() {
  const promiseExec = promisify(exec);

  try {
    const { stdout } = await promiseExec(`git status --porcelain`);
    if (stdout) {
      throw new ExitError([
        'The git repository is not clean.',
        `This codemod will add, move and modify files in your Ember app. It's highly recommended to commit or stash your local changes before you run it. To skip this error and execute the codemod anyway, run it with the option --skip-git.`,
      ]);
    }
  } catch (e) {
    if (isExit(e)) {
      throw e;
    }

    throw new ExitError([
      e.message,
      `Could not check if the git repository is clean. Are you running the script out of a git repository?`,
      `This codemod will add, move and modify files in your Ember app. Make sure you can deal confidently with changes before running the script. To skip this error and execute the codemod, run it with the option --skip-git.`,
    ]);
  }
}
