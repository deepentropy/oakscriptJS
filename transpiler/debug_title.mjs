import { PineParser } from './dist/index.js';

const source = `//@version=6
indicator(title="Momentum", shorttitle="Mom")
len = input.int(10, title="Length")`;

const parser = new PineParser();
const { ast } = parser.parse(source);

function findIndicatorDeclaration(node) {
  if (node.type === 'IndicatorDeclaration') {
    console.log('Found IndicatorDeclaration:', JSON.stringify(node, null, 2));
  }
  if (node.children) {
    for (const child of node.children) {
      findIndicatorDeclaration(child);
    }
  }
}

findIndicatorDeclaration(ast);
