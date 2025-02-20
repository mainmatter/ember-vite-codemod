import { parse, print } from 'recast';
import babylonParser from 'recast/parsers/babylon.js';
import { readFile, writeFile } from 'node:fs/promises';
import transformEmberCliBuild from './transforms/emberCliBuild.js';
import transformEslintConfig from './transforms/eslintConfig.js'
import transformIndexHTML from './transforms/indexHtml.js';
import transformTestem from './transforms/testem.js';

export default async function modifyFiles() {
  const file = 'index.html';
  let code = await readFile(file, 'utf-8');
  code = await transformIndexHTML(code);
  await writeFile(file, code, 'utf-8');

  await transformWithAst('ember-cli-build.js', transformEmberCliBuild);
  await transformWithAst('testem.js', transformTestem);
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

