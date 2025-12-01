import { PineParser } from './dist/index.js';

const source = `//@version=6
indicator(title="Momentum")
len = input.int(10, title="Length")
src = input(close, title="Source")`;

const parser = new PineParser();
const { ast, errors } = parser.parse(source);

function printNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const val = node.value !== undefined ? ` (${node.value})` : '';
  console.log(`${indent}${node.type}${val}`);
  if (node.children) {
    for (const child of node.children) {
      printNode(child, depth + 1);
    }
  }
}

console.log('=== AST Structure ===');
printNode(ast);
