/**
 * src/script/globals.ts types the script globals, so the TypeScript checker reports a script's mistakes before it
 * runs. Checked here: it declares every global of a script (the harness's list), the example scripts check without
 * errors, and the common mistakes give an error on their line.
 */
import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import ts from 'typescript';
import * as api from '../../src/script';

const GLOBALS_FILE = resolve(__dirname, '../../src/script/globals.ts');
const EXAMPLES = resolve(__dirname, '../../skills/oakscript/examples');

/** The options of the tsconfig given in globals.ts (types: the globals file is a root file here). */
const OPTIONS: ts.CompilerOptions = {
  allowJs: true,
  checkJs: true,
  noEmit: true,
  strict: true,
  noImplicitAny: false,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  moduleDetection: ts.ModuleDetectionKind.Force,
  lib: ['lib.es2022.d.ts'],
  types: ['node'],
  skipLibCheck: true,
};

/** Type-checks script sources (file name -> source); returns "file:line TScode" for each error in a script. */
function check(scripts: Record<string, string>): string[] {
  const host = ts.createCompilerHost(OPTIONS);
  const virtual = new Map(Object.entries(scripts).map(([name, source]) => [resolve(name), source]));
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, version, onError, create) => {
    const source = virtual.get(resolve(name));
    return source !== undefined ? ts.createSourceFile(name, source, version, true) : getSourceFile(name, version, onError, create);
  };
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (name) => virtual.has(resolve(name)) || fileExists(name);
  const program = ts.createProgram([GLOBALS_FILE, ...virtual.keys()], OPTIONS, host);
  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file && virtual.has(resolve(d.file.fileName)))
    .map((d) => {
      const line = d.file!.getLineAndCharacterOfPosition(d.start!).line + 1;
      return `${d.file!.fileName.split(/[\\/]/).pop()}:${line} TS${d.code}`;
    });
}

describe('script globals typings', () => {
  it('declare every global of a script', () => {
    const declared = [...readFileSync(GLOBALS_FILE, 'utf8').matchAll(/^ {2}const (\w+): typeof S\.\1;$/gm)].map((m) => m[1]);
    const globals = Object.keys(api).filter((k) => k !== 'default' && k !== 'executeScript');
    expect(declared.sort()).toEqual(globals.sort());
  });

  it('the example scripts check without errors', () => {
    const files = readdirSync(EXAMPLES).filter((f) => f.endsWith('.js'));
    const scripts = Object.fromEntries(files.map((f) => [join(EXAMPLES, f), readFileSync(join(EXAMPLES, f), 'utf8')]));
    expect(check(scripts)).toEqual([]);
  });

  it('report the common mistakes on their line', () => {
    const source = [
      'indicator("Mistakes", { overlay: true });', //                                    1
      'const len = input.int(14, "Length");', //                                         2
      'const body = close - open;', //                                                   3 operator on a Series
      'const rsi = ta.rsi(close, len);', //                                              4
      'plot(rsi > 50 ? rsi : close, "Mixed");', //                                       5 comparison on a Series
      'plot(ta.smaa(close, len), "Typo");', //                                           6 unknown ta function
      'plotshape(ta.crossover(rsi, 50), "X", { style: "triangel" });', //                7 bad shape string
      'plot(ta.sma(close, len), "Colour", { colour: color.red });', //                   8 unknown option
      'plot(ta.vwma(close, 20), "Vwma");', //                                            9 missing argument
      'eachBar((c) => c.close > ta.sma(close, 5));', //                                  10 ta.* read as a number
      'const fine = close.sub(open);', //                                                11
      'plot(fine, "Fine", { color: color.when(fine.gt(0), color.green, color.red) });', // 12
    ].join('\n');
    expect(check({ 'mistakes.js': source })).toEqual([
      'mistakes.js:3 TS2362',
      'mistakes.js:3 TS2363',
      'mistakes.js:5 TS2365',
      'mistakes.js:6 TS2551',
      'mistakes.js:7 TS2322',
      'mistakes.js:8 TS2561',
      'mistakes.js:9 TS2554',
      'mistakes.js:10 TS2365',
    ]);
  });

  it('report TypeScript syntax in a script', () => {
    expect(check({ 'typed.js': 'indicator("T");\nconst n: number = 5;\nplot(ta.sma(close, n), "S");' })).toEqual(['typed.js:2 TS8010']);
  });
});
