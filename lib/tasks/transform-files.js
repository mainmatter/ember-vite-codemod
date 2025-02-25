import { parse, print } from 'recast';
import babelParser from 'recast/parsers/babel.js';
import { readFile, writeFile } from 'node:fs/promises';
import transformEmberCliBuild from '../transforms/ember-cli-build.js';
import transformEnvironment from '../transforms/environment.js';
import transformIndexHTML from '../transforms/index-html.js';
import transformTestem from '../transforms/testem.js';
import transformTestHelper from '../transforms/test-helper.js';
import transformApp from '../transforms/app.js';

export default async function modifyFiles(showErrorTrace) {
  await transformWithReplace('index.html', transformIndexHTML, {
    isTest: false,
  });
  await transformWithReplace('tests/index.html', transformIndexHTML, {
    isTest: true,
  });
  await transformWithReplace('app/config/environment.js', transformEnvironment);

  await transformWithAst(
    'ember-cli-build.js',
    transformEmberCliBuild,
    showErrorTrace,
  );
  await transformWithAst('testem.js', transformTestem, showErrorTrace);
  await transformWithAst('app/app.js', transformApp, showErrorTrace);
  await transformWithAst(
    'tests/test-helper.js',
    transformTestHelper,
    showErrorTrace,
  );
}

async function transformWithReplace(file, transformFunction, options) {
  let code = await readFile(file, 'utf-8');
  code = await transformFunction(code, options);
  await writeFile(file, code, 'utf-8');
}

async function transformWithAst(
  file,
  transformFunction,
  showErrorTrace = false,
) {
  try {
    let ast = await getAst(file);
    ast = await transformFunction(ast);
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
