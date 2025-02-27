import { exec } from 'node:child_process';
import { promisify } from 'node:util';

export default async function checkGitStatus() {
  const promiseExec = promisify(exec);

  try {
    const { stdout } = await promiseExec(`git status --porcelain`);
    if (stdout) {
      console.log(`The git repository is not clean.`);
      console.log(
        "This codemod will add, move and modify files in your Ember app. It's highly recommended to commit or stash your local changes before you run it. To skip this error and execute the codemod anyway, run it with the option --skip-git.",
      );
      process.exit(1);
    }
  } catch (e) {
    console.error(e);
    console.log(
      `Could not check if the git repository is clean. Are you running the script out of a git repository?`,
    );
    console.log(
      'This codemod will add, move and modify files in your Ember app. Make sure you can deal confidently with changes before running the script. To skip this error and execute the codemod, run it with the option --skip-git.',
    );
    process.exit(1);
  }
}
