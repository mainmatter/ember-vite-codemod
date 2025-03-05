import { parse, print } from 'recast';
import babelParser from 'recast/parsers/babel.js';
import { readFile, writeFile } from 'node:fs/promises';
import transformEmberCliBuild from '../transforms/ember-cli-build.js';
import transformEnvironment from '../transforms/environment.js';
import transformIndexHTML from '../transforms/index-html.js';
import transformTestem from '../transforms/testem.js';
import transformTestHelper from '../transforms/test-helper.js';
import transformApp from '../transforms/app.js';

export default async function modifyFiles(options) {
  await transformWithReplace('index.html', transformIndexHTML, {
    isTest: false,
  });
  await transformWithReplace('tests/index.html', transformIndexHTML, {
    isTest: true,
  });
  await transformWithReplace('app/config/environment.js', transformEnvironment);

  await transformWithAst('ember-cli-build.js', transformEmberCliBuild, options);
  await transformWithAst('testem.js', transformTestem, options);
  await transformWithAst('app/app.js', transformApp, options);
  await transformWithAst('tests/test-helper.js', transformTestHelper, options);

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
  { isEmbroiderWebpack, showErrorTrace },
) {
  try {
    let ast = await getAst(file);
    ast = await transformFunction(ast, isEmbroiderWebpack);
    await setCode(file, ast);
  } catch (e) {
    console.error(
      `${file}: Could not parse and transform. Use the option --error-trace to show the whole error.`,
    );
    if (showErrorTrace) {
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
