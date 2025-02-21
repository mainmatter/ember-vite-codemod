import { parse, print } from 'recast';
import babylonParser from 'recast/parsers/babylon.js';
import { readFile, writeFile } from 'node:fs/promises';
import transformEmberCliBuild from '../transforms/ember-cli-build.js';
import transformEslintConfig from '../transforms/eslint-config.js'
import transformIndexHTML from '../transforms/index-html.js';
import transformTestem from '../transforms/testem.js';
import transformTestHelper from '../transforms/test-helper.js';
import transformApp from '../transforms/app.js';

export default async function modifyFiles() {
  let file = 'index.html';
  let code = await readFile(file, 'utf-8');
  code = await transformIndexHTML(code, false);
  await writeFile(file, code, 'utf-8');

  file = 'tests/index.html';
  code = await readFile(file, 'utf-8');
  code = await transformIndexHTML(code, true);
  await writeFile(file, code, 'utf-8');

  await transformWithAst('ember-cli-build.js', transformEmberCliBuild);
  await transformWithAst('testem.js', transformTestem);
  await transformWithAst('app/app.js', transformApp);
  await transformWithAst('tests/test-helper.js', transformTestHelper);
  // Use a different parser because Esprima doesn't handle spread attributes correctly here
  await transformWithAst('eslint.config.mjs', transformEslintConfig, babylonParser);
}

async function transformWithAst(file, transformFunction, parser) {
  let ast = await getAst(file, parser);
  ast = await transformFunction(ast);
  await setCode(file, ast);
}

async function getAst(file, parser) {
  const code = await readFile(file, 'utf-8');
  const options = parser ? { parser } : undefined;
  return parse(code, options);
}

async function setCode(file, ast) {
  const output = print(ast).code;
  await writeFile(file, output, 'utf-8');
}

