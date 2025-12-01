#!/usr/bin/env node

/**
 * pine2ts - PineScript to TypeScript transpiler CLI
 * 
 * Usage:
 *   pine2ts <input.pine> [output.ts]
 *   pine2ts --help
 *   pine2ts --version
 * 
 * Examples:
 *   pine2ts script.pine           # Outputs to stdout
 *   pine2ts script.pine output.ts # Outputs to file
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package.json for version
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
pine2ts v${packageJson.version} - PineScript to TypeScript transpiler

Usage:
  pine2ts <input.pine> [output.ts]   Transpile PineScript to TypeScript
  pine2ts --help                     Show this help message
  pine2ts --version                  Show version number

Arguments:
  input.pine    PineScript source file to transpile
  output.ts     Output TypeScript file (optional, defaults to stdout)

Examples:
  pine2ts script.pine                Outputs transpiled code to stdout
  pine2ts script.pine output.ts      Outputs transpiled code to file
  pine2ts indicators/rsi.pine        Transpile from a subdirectory

Note:
  This CLI is part of @deepentropy/oakscript-engine
  For more information, see: https://github.com/deepentropy/oakscriptJS
`);
}

function printVersion() {
  console.log(`pine2ts v${packageJson.version}`);
}

// Handle flags
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  printVersion();
  process.exit(0);
}

const inputFile = args[0];
const outputFile = args[1];

if (!inputFile) {
  console.error('Error: No input file specified');
  printHelp();
  process.exit(1);
}

if (!existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  process.exit(1);
}

// Read the input file
let pineSource;
try {
  pineSource = readFileSync(inputFile, 'utf-8');
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
  process.exit(1);
}

// Import the transpiler
try {
  const { transpile } = await import('../dist/index.mjs');
  
  const result = transpile(pineSource, {
    filename: basename(inputFile),
  });
  
  if (outputFile) {
    writeFileSync(outputFile, result, 'utf-8');
    console.log(`Transpiled ${inputFile} -> ${outputFile}`);
  } else {
    console.log(result);
  }
} catch (err) {
  console.error(`Transpilation error: ${err.message}`);
  process.exit(1);
}
