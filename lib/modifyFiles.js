import { parse, print } from 'recast';
import { readFile, writeFile } from 'node:fs/promises';
import transformEmberCliBuild from "./transforms/emberCliBuild.js";
import transformIndexHTML from './transforms/indexHtml.js';

export default async function modifyFiles() {
  let file;
  let ast;

  file = 'ember-cli-build.js';
  ast = await getAst(file);
  ast = await transformEmberCliBuild(ast);
  await setCode(file, ast);

  file = 'index.html';
  let code = await readFile(file, 'utf-8');
  code = await transformIndexHTML(code);
  await writeFile(file, code, 'utf-8');

  // testem.js

  // eslint.config.mjs
}

async function getAst(file) {
  const code = await readFile(file, 'utf-8');
  return parse(code);
}

async function setCode(file, ast) {
  const output = print(ast).code;
  await writeFile(file, output, 'utf-8');
}

