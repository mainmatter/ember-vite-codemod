import { parse, print } from 'recast';
import babelParser from 'recast/parsers/babel.js';
import { readFile, writeFile } from 'node:fs/promises';
import transformEmberCliBuild from '../transforms/ember-cli-build.js';
import transformEnvironment from '../transforms/environment.js';
import transformIndexHTML from '../transforms/index-html.js';
import transformTestem from '../transforms/testem.js';
import transformTestHelper from '../transforms/test-helper.js';
import transformApp from '../transforms/app.js';
import { resolveWithExt } from '../utils/resolve-with-extension.js';

export default async function modifyFiles(options) {
  await transformWithReplace('index.html', transformIndexHTML, {
    isTest: false,
  });
  await transformWithReplace('tests/index.html', transformIndexHTML, {
    isTest: true,
  });
  await transformWithReplace('app/config/environment.js', transformEnvironment);

  await transformWithAst(
    resolveWithExt('ember-cli-build'),
    transformEmberCliBuild,
    options,
  );
  await transformWithAst(resolveWithExt('testem'), transformTestem, options);
  await transformWithAst(resolveWithExt('app/app'), transformApp, options);
  await transformWithAst(
    resolveWithExt('tests/test-helper'),
    transformTestHelper,
    options,
  );

  try {
    let code = await readFile('.gitignore', 'utf-8');
    if (!code.match(/\/?tmp\/?[\n\r]/)) {
      await writeFile('.gitignore', `/tmp/\n\n${code}`, 'utf-8');
    }
  } catch (e) {
    console.log('Skiping file .gitignore since it was not found.');
    if (options.showErrorTrace) {
      console.log(e);
    }
  }
}

async function transformWithReplace(file, transformFunction, options) {
  let code = await readFile(file, 'utf-8');
  code = await transformFunction(code, options);
  await writeFile(file, code, 'utf-8');
}

async function transformWithAst(
  file,
  transformFunction,
  options,
) {
  try {
    let ast = await getAst(file);
    ast = await transformFunction(ast, options);
    await setCode(file, ast);
  } catch (e) {
    console.error(
      `${file}: Could not parse and transform. Use the option --error-trace to show the whole error.`,
    );
    if (options.showErrorTrace) {
      console.error(e);
    }
  }
}

async function getAst(file) {
  const code = await readFile(file, 'utf-8');
  return parse(code, { parser: babelParser });
}

async function setCode(file, ast) {
  const output = print(ast).code;
  await writeFile(file, output, 'utf-8');
}
