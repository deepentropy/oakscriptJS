/**
 * @fileoverview The `oakscript check` command (Node.js): checks a script file with {@link checkScript}, adding what
 * needs Node: the error lines of the file (the script is compiled with its file name), a time limit per run, a type
 * check with the TypeScript compiler of the project (when it is installed), bars, specs and references read from files,
 * and a text or JSON output. The exit code is 0 when the check is clean, 2 with warnings only, 1 with an error or a
 * failed spec / reference check.
 *
 * @module check/node
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import * as vm from 'node:vm';
import type { Bar } from '../types/index.js';
import { formatReport } from './format.js';
import {
  CHECK_BARS,
  checkScript,
  errorLocation,
  validateSpec,
  LIBRARY_PARAMETER,
  SCRIPT_GLOBALS,
  SCRIPT_PREFIX,
  scriptArguments,
  syntheticBars,
  timeframeSeconds,
  wrapSource,
  type CheckContext,
  type CheckError,
  type CheckReference,
  type CheckReport,
  type CheckSpec,
} from './index.js';

const USAGE = `Usage: oakscript check <script.js> [options]

Runs an OakScript script like a host (declarations, then a run on bars) and reports its inputs, outputs, values,
signals, trades, errors with their line, and warnings for the mistakes that give no error.

Options:
  --spec <file.json>        expected kind, title, overlay, inputs, outputs, plots, signals, trades (see the guide);
                            an unknown key is an error
  --checks <file.js>        behaviour checks: the body of a function of \`t\` (t.plot, t.signal, t.expect, t.everyBar)
  --scenarios               also run on edge-case bars (short history, daily, 1-minute, flat prices, no volume, a gap)
  --reference <file.csv>    expected values per bar: a time column and one column per plot title
  --export <file.csv>       a chart export: its bars (time, open, high, low, close, volume) are the bars of the run and
                            its other columns the expected plot values (columns without a plot are ignored)
  --tolerance <x>           relative tolerance of the reference values (default 1e-10)
  --bars <file.csv|json>    bars of the run (time, open, high, low, close, volume); default: synthetic bars
  --count <n>               number of synthetic bars (default ${CHECK_BARS})
  --timeframe <tf>          chart timeframe ("1", "60", "D"...; default: from the bars, else "60")
  --inputs <json>           input values by id, e.g. '{"length": 50}'
  --timeout <ms>            time limit of each run (default 10000)
  --no-types                skip the type check
  --no-sweep                skip the runs that look for unused inputs
  --json                    print the report as JSON

Exit code: 0 clean, 2 warnings only, 1 errors or failed checks.`;


export interface CheckFileOptions {
  spec?: CheckSpec;
  reference?: CheckReference;
  /** Behaviour checks (see {@link readChecks} for a file). */
  checks?: (t: CheckContext) => void;
  /** Also run on the edge-case bars. */
  scenarios?: boolean;
  bars?: Bar[];
  count?: number;
  timeframe?: string;
  inputs?: Record<string, unknown>;
  timeout?: number;
  types?: boolean;
  sweep?: boolean;
  /** Folder to resolve `typescript` and `oakscriptjs` from (default: the script's folder). */
  cwd?: string;
}

export interface CheckFileReport extends CheckReport {
  file: string;
  /** Why the type check did not run, when it did not. */
  typesSkipped?: string;
}

/** Compiles a script with its file name: the stack frames and syntax errors give `<file>:line:column`. */
export function compileFile(filename: string): (source: string) => () => void {
  return (source) => {
    const fn = vm.compileFunction(wrapSource(source), [...SCRIPT_GLOBALS, LIBRARY_PARAMETER], {
      filename,
    }) as (...args: unknown[]) => void;
    const values = scriptArguments();
    return () => fn(...values);
  };
}

/** Runs `fn` with a time limit (the run is stopped, even inside the library). */
export function withTimeLimit(ms: number): <T>(fn: () => T) => T {
  // the context only calls `fn`: the script and the library run in their own realm, under the context's time limit
  const context = vm.createContext({ run: undefined as unknown });
  const call = new vm.Script('run()');
  return <T>(fn: () => T): T => {
    context.run = fn;
    try {
      return call.runInContext(context, { timeout: ms }) as T;
    } finally {
      context.run = undefined;
    }
  };
}

/** Type-checks a script file with the globals of oakscriptjs/script; `skipped` when TypeScript or the types are missing. */
export function typecheckFile(file: string, cwd: string): { errors: CheckError[] } | { skipped: string } {
  const req = createRequire(path.join(cwd, 'oakscript-check.js'));
  let ts: typeof import('typescript');
  try {
    ts = req('typescript') as typeof import('typescript');
  } catch {
    return { skipped: 'typescript is not installed in the project (npm i -D typescript)' };
  }
  let globals: string;
  try {
    globals = req.resolve('oakscriptjs/script/globals').replace(/\.js$/, '.d.ts');
    if (!existsSync(globals)) throw new Error(globals);
  } catch {
    return { skipped: 'oakscriptjs/script/globals is not found from the script folder (npm i oakscriptjs)' };
  }
  const program = ts.createProgram([file, globals], {
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
    types: [],
    skipLibCheck: true,
  });
  const target = path.resolve(file);
  const errors = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file && path.resolve(d.file.fileName) === target && d.start !== undefined)
    .map((d): CheckError => {
      const { line, character } = d.file!.getLineAndCharacterOfPosition(d.start!);
      return {
        stage: 'types',
        message: ts.flattenDiagnosticMessageText(d.messageText, ' '),
        line: line + 1,
        column: character + 1,
        code: `TS${d.code}`,
      };
    });
  return { errors };
}

function parseTime(v: string): number {
  const s = v.trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    return n > 1e12 ? Math.round(n / 1000) : n;
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) throw new Error(`Invalid time "${v}"`);
  return Math.round(t / 1000);
}

function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  const split = (l: string) => l.split(/[,;\t]/).map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
  return { header: split(lines[0] ?? ''), rows: lines.slice(1).map(split) };
}

const TIME_COLUMNS = ['time', 'timestamp', 'date', 'datetime'];
const BAR_COLUMNS = ['open', 'high', 'low', 'close', 'volume'];

/** Bars from a CSV (time, open, high, low, close[, volume]) or a JSON array of bars, oldest first. */
export function readBars(file: string): Bar[] {
  const text = readFileSync(file, 'utf8');
  let bars: Bar[];
  if (/\.json$/i.test(file)) {
    const raw = JSON.parse(text) as Array<Record<string, unknown>> | { bars: Array<Record<string, unknown>> };
    const list = Array.isArray(raw) ? raw : raw.bars;
    bars = list.map((b) => ({
      time: parseTime(String(b.time)),
      open: Number(b.open),
      high: Number(b.high),
      low: Number(b.low),
      close: Number(b.close),
      volume: b.volume === undefined ? NaN : Number(b.volume),
    }));
  } else {
    const { header, rows } = parseCsv(text);
    const col = (names: string[]) => header.findIndex((h) => names.includes(h.toLowerCase()));
    const [t, o, h, l, c, v] = [col(TIME_COLUMNS), col(['open']), col(['high']), col(['low']), col(['close']), col(['volume'])];
    if ([t, o, h, l, c].some((k) => k < 0)) throw new Error(`${file}: the columns time, open, high, low, close are needed (found ${header.join(', ')})`);
    bars = rows.map((r) => ({
      time: parseTime(r[t]!),
      open: Number(r[o]),
      high: Number(r[h]),
      low: Number(r[l]),
      close: Number(r[c]),
      volume: v >= 0 ? Number(r[v]) : NaN,
    }));
  }
  return bars.sort((a, b) => a.time - b.time);
}

/** A reference CSV: a time column and one column per plot (id or title); empty, "na" or "NaN": na. The bar columns
 *  (open, high, low, close, volume) are skipped. */
export function readReference(file: string, tolerance?: number): CheckReference {
  const { header, rows } = parseCsv(readFileSync(file, 'utf8'));
  const t = header.findIndex((h) => TIME_COLUMNS.includes(h.toLowerCase()));
  if (t < 0) throw new Error(`${file}: a time column is needed (found ${header.join(', ')})`);
  const columns: Record<string, Array<number | null>> = {};
  header.forEach((name, k) => {
    // the bar columns of a chart export are the bars, not expected values
    if (k === t || BAR_COLUMNS.includes(name.toLowerCase())) return;
    columns[name] = rows.map((r) => {
      const s = (r[k] ?? '').trim();
      return s === '' || /^(na|nan|null)$/i.test(s) ? null : Number(s);
    });
  });
  return { times: rows.map((r) => parseTime(r[t]!)), columns, ...(tolerance !== undefined ? { tolerance } : {}) };
}

/**
 * Behaviour checks from a file: its source is the body of a function of `t` (no import or export), e.g.
 * `t.everyBar("RSI in 0..100", (i) => t.plot("RSI").at(i) <= 100);`. An error in the file names its line.
 */
export function readChecks(file: string): (t: CheckContext) => void {
  const filename = path.resolve(file);
  const fn = vm.compileFunction(readFileSync(filename, 'utf8'), ['t'], { filename }) as (t: CheckContext) => void;
  return (t) => {
    try {
      fn(t);
    } catch (e) {
      const { line, column } = errorLocation(e, filename);
      const m = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : String(e);
      throw new Error(line ? `${m} (${file}:${line}${column ? `:${column}` : ''})` : m, { cause: e });
    }
  };
}

/** Checks a script file: type check, then {@link checkScript} with file lines and a time limit. */
export function checkFile(file: string, options: CheckFileOptions = {}): CheckFileReport {
  const filename = path.resolve(file);
  const source = readFileSync(filename, 'utf8');
  const timeframe = options.timeframe;
  const bars =
    options.bars ??
    (options.count !== undefined ? syntheticBars(options.count, timeframeSeconds(timeframe ?? '60') || 3600) : undefined);
  const report = checkScript(source, {
    ...(bars ? { bars } : {}),
    ...(timeframe ? { timeframe } : {}),
    ...(options.inputs ? { inputs: options.inputs } : {}),
    ...(options.spec ? { spec: options.spec } : {}),
    ...(options.reference ? { reference: options.reference } : {}),
    ...(options.checks ? { checks: options.checks } : {}),
    ...(options.scenarios ? { scenarios: true } : {}),
    compile: compileFile(filename),
    run: withTimeLimit(options.timeout ?? 10000),
    filename,
    inputSweep: options.sweep !== false,
  }) as CheckFileReport;
  report.file = file;
  for (const e of report.errors) if (e.line === 1 && e.column !== undefined) e.column = Math.max(1, e.column - SCRIPT_PREFIX.length);
  if (options.types !== false) {
    const types = typecheckFile(filename, options.cwd ?? path.dirname(filename));
    if ('skipped' in types) report.typesSkipped = types.skipped;
    else if (types.errors.length) {
      report.errors.unshift(...types.errors);
      report.ok = false;
    }
  }
  return report;
}

/** Exit code of a report: 0 clean, 2 warnings only, 1 errors or failed checks. */
export function exitCode(r: CheckReport): number {
  return !r.ok ? 1 : r.warnings.length ? 2 : 0;
}

/** Command line entry: `oakscript check <file> [options]`; prints the report and returns the exit code. */
export function main(argv: string[], print: (text: string) => void = (t) => process.stdout.write(t + '\n')): number {
  const args = [...argv];
  if (args[0] === 'check') args.shift();
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    print(USAGE);
    return args.length ? 0 : 1;
  }
  let file: string | undefined;
  const o: CheckFileOptions = {};
  let json = false;
  let referenceFile: string | undefined;
  let exportFile: string | undefined;
  let checksFile: string | undefined;
  let tolerance: number | undefined;
  const specErrors: string[] = [];
  try {
    for (let k = 0; k < args.length; k++) {
      const a = args[k]!;
      const next = (): string => {
        const v = args[++k];
        if (v === undefined) throw new Error(`${a} needs a value`);
        return v;
      };
      if (a === '--spec') {
        const specFile = next();
        const spec = JSON.parse(readFileSync(specFile, 'utf8')) as CheckSpec & {
          $schema?: string;
          reference?: string;
          export?: string;
          tolerance?: number;
          checks?: string;
          scenarios?: boolean;
        };
        specErrors.push(...validateSpec(spec, { file: true }).map((m) => `${specFile}: ${m}`));
        const rel = (f: string) => path.resolve(path.dirname(specFile), f);
        if (typeof spec.reference === 'string') referenceFile ??= rel(spec.reference);
        if (typeof spec.export === 'string') exportFile ??= rel(spec.export);
        if (typeof spec.checks === 'string') checksFile ??= rel(spec.checks);
        if (typeof spec.tolerance === 'number') tolerance ??= spec.tolerance;
        if (spec.scenarios === true) o.scenarios = true;
        for (const k of ['$schema', 'reference', 'export', 'tolerance', 'checks', 'scenarios'] as const) delete spec[k];
        o.spec = spec;
      } else if (a === '--reference') referenceFile = next();
      else if (a === '--export') exportFile = next();
      else if (a === '--checks') checksFile = next();
      else if (a === '--scenarios') o.scenarios = true;
      else if (a === '--tolerance') tolerance = Number(next());
      else if (a === '--bars') o.bars = readBars(next());
      else if (a === '--count') o.count = Number(next());
      else if (a === '--timeframe') o.timeframe = next();
      else if (a === '--inputs') o.inputs = JSON.parse(next()) as Record<string, unknown>;
      else if (a === '--timeout') o.timeout = Number(next());
      else if (a === '--no-types') o.types = false;
      else if (a === '--no-sweep') o.sweep = false;
      else if (a === '--json') json = true;
      else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
      else if (file === undefined) file = a;
      else throw new Error(`One script file only (got ${file} and ${a})`);
    }
    if (!file) throw new Error('No script file');
    if (!existsSync(file)) throw new Error(`No file ${file}`);
    if (referenceFile) o.reference = readReference(referenceFile, tolerance);
    if (exportFile) {
      o.bars ??= readBars(exportFile);
      o.reference ??= { ...readReference(exportFile, tolerance), ignoreUnknown: true };
    }
    if (checksFile) o.checks = readChecks(checksFile);
  } catch (e) {
    print(`oakscript check: ${(e as Error).message}\n\n${USAGE}`);
    return 1;
  }
  const report = checkFile(file, o);
  if (specErrors.length) {
    // the keys of a spec file are checked here (checkScript sees the spec without them)
    report.errors = report.errors.filter((e) => e.stage !== 'spec');
    report.errors.push(...specErrors.map((message) => ({ stage: 'spec' as const, message })));
    report.ok = false;
  }
  print(json ? JSON.stringify(report, null, 2) : formatReport(report));
  return exitCode(report);
}

export { formatReport };
