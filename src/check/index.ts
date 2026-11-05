/**
 * @fileoverview Checks a script source: runs it like a host (a declaration run on zero bars, then a run on bars) and
 * returns a report an agent or a host can act on: what the script declares (inputs, outputs, strategy), what its outputs
 * contain (values, warm-up, ranges, signal counts, trades), warnings for the mistakes that give no error (an empty plot,
 * a signal on every bar or never, an input that changes nothing...), and the result of a spec (the expected inputs,
 * outputs and signals) and of a reference (expected values per bar). The `oakscript check` command prints it.
 *
 * ```ts
 * import { checkScript } from 'oakscriptjs/check';
 * const report = checkScript(source, { spec: { overlay: true, outputs: ['Fast', 'Slow'] } });
 * report.ok; report.errors; report.warnings; report.spec?.items;
 * ```
 *
 * @module check
 */
import type { Bar } from '../types/index.js';
import type { ScriptRunResult } from '../script/index.js';
import type { InputConfig } from '../runtime/types.js';
import {
  compileScript,
  inferTimeframe,
  runScript,
  incrementalReason,
  syntheticBars,
  timeframeSeconds,
  type ScriptRun,
  type TestChartOptions,
} from './harness.js';
import { runChecks, signalBars, type CheckContext, type CheckItem } from './checks.js';
import { validateSpec } from './spec.js';

export { validateSpec, specJsonSchema, SPEC_FIELDS, SPEC_FILE_FIELDS } from './spec.js';
export { runChecks, signalBars, type CheckContext, type CheckItem, type CheckPlot, type CheckSignal, type SignalBars } from './checks.js';
export { formatReport, assertCheck } from './format.js';

export {
  compileScript,
  inferTimeframe,
  rewriteImports,
  runScript,
  scriptArguments,
  syntheticBars,
  testChart,
  timeframeSeconds,
  LIBRARY_PARAMETER,
  SCRIPT_GLOBALS,
  SCRIPT_PREFIX,
  SCRIPT_SUFFIX,
  TestEngine,
  wrapSource,
  type RunScriptOptions,
  type ScriptRun,
  type TestChartOptions,
} from './harness.js';

// ── Spec, reference and report types ─────────────────────────────────────────

/** Expected count of a signal (a shape, character, arrow, alert condition, background or bar colour) over the bars. */
export interface SignalSpec {
  /** At least this many bars with the signal. */
  min?: number;
  /** At most this many bars with the signal. */
  max?: number;
  /** At least this share of the bars (0 to 1). */
  minShare?: number;
  /** At most this share of the bars (0 to 1). */
  maxShare?: number;
}

/** Expected values of a plot. */
export interface PlotSpec {
  /** Every value is at least this. */
  min?: number;
  /** Every value is at most this. */
  max?: number;
  /** The first value comes at this bar index or before (the warm-up). */
  warmup?: number;
}

/** Expected input: the keys are compared when given. */
export interface InputSpec {
  type?: InputConfig['type'];
  defval?: unknown;
  title?: string;
  min?: number;
  max?: number;
  options?: string[];
}

/**
 * What the user asked for, written before the script: each given entry is checked. Inputs, plots and signals are
 * found by id or title (case insensitive).
 */
export interface CheckSpec {
  kind?: 'indicator' | 'strategy';
  title?: string;
  overlay?: boolean;
  /** Inputs that must exist, with the expected type, default... */
  inputs?: Record<string, InputSpec>;
  /** Outputs that must exist (a title, or a title and a kind: plot, shape, char, arrow, candle, bar, hline, bgcolor, barcolor, alertcondition). */
  outputs?: Array<string | { title: string; kind?: string }>;
  /** Value checks per plot. */
  plots?: Record<string, PlotSpec>;
  /** Count checks per signal. */
  signals?: Record<string, SignalSpec>;
  /** Number of closed trades of a strategy. */
  trades?: { min?: number; max?: number };
}

/** Expected values per bar, e.g. the outputs of the Pine script a port follows, on the same bars. */
export interface CheckReference {
  /** Bar times (UNIX seconds). */
  times: number[];
  /** Expected values per plot id or title, aligned with `times` (NaN or null: na). */
  columns: Record<string, Array<number | null>>;
  /** Equal when |a - b| <= tolerance * max(1, |a|, |b|) (default 1e-10), or both na. */
  tolerance?: number;
  /** A column without a plot of that id or title is listed as ignored instead of failing (a chart export holds other columns). */
  ignoreUnknown?: boolean;
}

/** A run on edge-case bars (`scenarios: true`): a short history, daily bars, flat prices, no volume, a gap. */
export interface CheckScenario {
  name: string;
  description: string;
  timeframe: string;
  bars: () => Bar[];
}

export interface CheckOptions extends TestChartOptions {
  /** Bars of the run (default: 1,500 deterministic synthetic bars of the timeframe). */
  bars?: Bar[];
  /** Input values by id (default: the defaults). */
  inputs?: Record<string, unknown>;
  spec?: CheckSpec;
  reference?: CheckReference;
  /** Compiles the source (default: `new Function`; the CLI compiles with the file name for error lines). */
  compile?: (source: string) => () => void;
  /** Wraps each run (the CLI stops a run that takes too long). */
  run?: <T>(fn: () => T) => T;
  /** File name of the source, to read the error lines from the stack (`<file>:line:column`). */
  filename?: string;
  /** Re-run with each input changed to find inputs that change no output (default true). */
  inputSweep?: boolean;
  /** Behaviour checks: called with the outputs of the run per bar (see {@link CheckContext}); their results join the spec items. */
  checks?: (t: CheckContext) => void;
  /** Also run on the edge-case bars of {@link SCENARIOS} (or the given ones): their errors fail the check. */
  scenarios?: boolean | CheckScenario[];
}

export type CheckStage = 'syntax' | 'types' | 'declaration' | 'run' | 'timeout' | 'spec' | 'reference' | 'scenario';

export interface CheckError {
  stage: CheckStage;
  message: string;
  line?: number;
  column?: number;
  /** TypeScript error code (stage "types"). */
  code?: string;
}

export interface CheckWarning {
  code:
    | 'empty-plot'
    | 'constant-plot'
    | 'late-start'
    | 'signal-never'
    | 'signal-everywhere'
    | 'one-colour'
    | 'unused-input'
    | 'input-error'
    | 'no-trades'
    | 'no-output';
  message: string;
  /** Output or input title (or id). */
  target?: string;
}

export interface PlotSummary {
  id: string;
  title: string;
  /** Bars with a value (not na). */
  values: number;
  /** Bar index of the first value (-1: none). */
  firstBar: number;
  min: number | null;
  max: number | null;
  /** Values of the last 5 bars (null: na). */
  last: Array<number | null>;
  /** Distinct per-bar colours (0: the plot colour is the same on every bar). */
  colours: number;
}

export interface SignalSummary {
  kind: 'shape' | 'char' | 'arrow' | 'alertcondition' | 'bgcolor' | 'barcolor';
  id: string;
  title: string;
  /** Bars with the signal. */
  count: number;
  /** count / number of bars. */
  share: number;
  firstBar: number;
  lastBar: number;
}

export interface TradeSummary {
  entry: string;
  direction: 'long' | 'short';
  entryBar: number;
  entryPrice: number;
  exitBar: number | null;
  exitPrice: number | null;
  profit: number;
}

export interface CheckReport {
  /** No error, no failed spec or reference check. Warnings do not change it. */
  ok: boolean;
  bars: { count: number; first: number | null; last: number | null; timeframe: string; synthetic: boolean };
  errors: CheckError[];
  warnings: CheckWarning[];
  declaration?: {
    kind: 'indicator' | 'strategy';
    title: string;
    shortTitle?: string;
    overlay: boolean;
    inputs: Array<Pick<InputConfig, 'id' | 'type' | 'defval' | 'title' | 'min' | 'max' | 'options'>>;
    outputs: Array<{ kind: string; id: string; title: string }>;
    strategy?: Record<string, unknown>;
  };
  plots: PlotSummary[];
  signals: SignalSummary[];
  drawings: { labels: number; lines: number; boxes: number; tables: number; polylines: number; linefills: number };
  /** alert() calls of the script (all bars). */
  alertCalls: number;
  /**
   * Live updates on a chart that runs the script with createScriptRun (#196): resumed (the newest bars only) or full
   * runs, with the reason (state outside persist(), drawings in two blocks, request.security...). Not a warning: the
   * results are the same.
   */
  liveUpdates?: { resumed: boolean; reason: string | null };
  strategy?: { closedTrades: number; openTrade: boolean; netProfit: number; wins: number; first: TradeSummary[] };
  /** Spec items and behaviour checks. */
  spec?: { passed: number; failed: number; items: CheckItem[] };
  reference?: Array<{
    column: string;
    output?: string;
    /** No plot of this id or title, and `ignoreUnknown` is set. */
    ignored?: boolean;
    equal: number;
    total: number;
    firstMismatch?: { bar: number; time: number; expected: number | null; actual: number | null };
  }>;
  /** Runs on edge-case bars: their errors (also in `errors`, stage "scenario") and the plots with no value the main run does not have. */
  scenarios?: Array<{ name: string; description: string; bars: number; errors: CheckError[]; warnings: CheckWarning[] }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const lower = (s: string | undefined): string => (s ?? '').trim().toLowerCase();

/** Line and column of a script error, from `error.scriptLine` or the `<filename>:line:column` frames of its stack. */
export function errorLocation(error: unknown, filename?: string): { line?: number; column?: number } {
  const e = error as { scriptLine?: number; scriptColumn?: number; stack?: string } | undefined;
  if (e && typeof e.scriptLine === 'number') return { line: e.scriptLine, column: e.scriptColumn };
  if (!filename || typeof e?.stack !== 'string') return {};
  const name = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`${name}:(\\d+)(?::(\\d+))?`).exec(e.stack);
  return m ? { line: Number(m[1]), column: m[2] ? Number(m[2]) : undefined } : {};
}

function messageOf(error: unknown): string {
  // an error of another realm (the time limit of the CLI) is not `instanceof Error`
  const e = error as { name?: unknown; message?: unknown } | null;
  if (e && typeof e === 'object' && typeof e.message === 'string') {
    return `${!e.name || e.name === 'Error' ? '' : `${String(e.name)}: `}${e.message}`;
  }
  return String(error);
}

function isTimeout(error: unknown): boolean {
  return /Script execution timed out/i.test(messageOf(error));
}

/** An input value different from the default, valid for the input (undefined: not tried). */
function alternative(input: InputConfig): unknown {
  const inRange = (v: number) => (input.min === undefined || v >= input.min) && (input.max === undefined || v <= input.max);
  switch (input.type) {
    case 'int': {
      const d = Number(input.defval);
      return [d + 1, d - 1, d * 2, d + 10].find((v) => Number.isFinite(v) && v !== d && inRange(v));
    }
    case 'float': {
      const d = Number(input.defval);
      return [d * 1.5, d + 1, d / 2, d - 1].find((v) => Number.isFinite(v) && v !== d && inRange(v));
    }
    case 'bool':
      return !input.defval;
    case 'string':
      return input.options?.find((o) => o !== input.defval);
    case 'source':
      return input.defval === 'open' ? 'close' : 'open';
    case 'color':
      return input.defval === '#123456' ? '#654321' : '#123456';
    default:
      return undefined;
  }
}

/** Everything a run draws or signals, to compare two runs. */
function fingerprint(run: ScriptRunResult, engine: ScriptRun['engine']): string {
  return JSON.stringify([run.result, engine ? [engine.closed, engine.openTradeNow] : null]);
}

function findByName<T extends { id: string; title?: string }>(items: T[], name: string): T | undefined {
  const n = lower(name);
  return items.find((x) => lower(x.id) === n) ?? items.find((x) => lower(x.title) === n);
}

// ── Report parts ─────────────────────────────────────────────────────────────

function summarizePlots(run: ScriptRunResult, bars: Bar[]): PlotSummary[] {
  const index = new Map(bars.map((b, i) => [b.time, i]));
  return run.plotConfig.map((p) => {
    const points = (run.result.plots[p.id] ?? []) as Array<{ time: number; value: number; color?: string }>;
    const byTime = new Map(points.map((pt) => [pt.time, pt.value]));
    let min = Infinity;
    let max = -Infinity;
    const colours = new Set<string>();
    for (const pt of points) {
      if (pt.value < min) min = pt.value;
      if (pt.value > max) max = pt.value;
      if (pt.color !== undefined) colours.add(String(pt.color));
    }
    return {
      id: p.id,
      title: p.title ?? p.id,
      values: points.length,
      firstBar: points.length ? (index.get(points[0]!.time) ?? -1) : -1,
      min: points.length ? min : null,
      max: points.length ? max : null,
      last: bars.slice(-5).map((b) => byTime.get(b.time) ?? null),
      colours: colours.size,
    };
  });
}

function summarizeSignals(run: ScriptRunResult, bars: Bar[]): SignalSummary[] {
  const n = Math.max(1, bars.length);
  return signalBars(run, bars).map((x) => ({
    kind: x.kind,
    id: x.id,
    title: x.title,
    count: x.bars.length,
    share: x.bars.length / n,
    firstBar: x.bars[0] ?? -1,
    lastBar: x.bars[x.bars.length - 1] ?? -1,
  }));
}

function summarizeStrategy(engine: NonNullable<ScriptRun['engine']>): NonNullable<CheckReport['strategy']> {
  const trades = engine.closed;
  const first = trades.slice(0, 3).map(
    (t): TradeSummary => ({
      entry: t.entry_id,
      direction: t.size >= 0 ? 'long' : 'short',
      entryBar: t.entry_bar_index,
      entryPrice: t.entry_price,
      exitBar: t.exit_bar_index ?? null,
      exitPrice: t.exit_price ?? null,
      profit: t.profit,
    })
  );
  return {
    closedTrades: trades.length,
    openTrade: engine.openTradeNow !== null,
    netProfit: trades.reduce((s, t) => s + t.profit, 0),
    wins: trades.filter((t) => t.profit > 0).length,
    first,
  };
}

function warningsOf(report: CheckReport, bars: Bar[]): CheckWarning[] {
  const w: CheckWarning[] = [];
  const n = bars.length;
  const outputs = report.declaration?.outputs ?? [];
  const drawings = Object.values(report.drawings).reduce((a, b) => a + b, 0);
  if (!outputs.length && !drawings && !report.strategy && !report.alertCalls) {
    w.push({ code: 'no-output', message: 'The script declares no output (plot, shape, colour, drawing, alert): it shows nothing.' });
  }
  for (const p of report.plots) {
    if (p.values === 0) {
      w.push({
        code: 'empty-plot',
        target: p.title,
        message: `Plot "${p.title}" has no value on any bar (na everywhere): a ta.* Series returned from a bar loop, a division by zero, a NaN input or a length longer than the bars?`,
      });
      continue;
    }
    if (p.values > 1 && p.min === p.max) {
      w.push({ code: 'constant-plot', target: p.title, message: `Plot "${p.title}" has the same value (${p.min}) on every bar: check that it is meant (a level is an hline()).` });
    }
    if (n >= 20 && p.firstBar > n / 2) {
      w.push({ code: 'late-start', target: p.title, message: `Plot "${p.title}" starts on bar ${p.firstBar} of ${n}: a long warm-up (long lengths, or a higher timeframe).` });
    }
    if (p.colours === 1 && p.values >= 20) {
      w.push({ code: 'one-colour', target: p.title, message: `Plot "${p.title}" has per-bar colours but the same colour on every bar: is the colour condition ever false?` });
    }
  }
  if (n >= 20) {
    for (const s of report.signals) {
      if (s.count === 0) {
        w.push({ code: 'signal-never', target: s.title, message: `${s.kind} "${s.title}" is never true on the ${n} bars: check the condition (or test on more bars).` });
      } else if (s.share > 0.5 && s.kind !== 'bgcolor' && s.kind !== 'barcolor') {
        w.push({
          code: 'signal-everywhere',
          target: s.title,
          message: `${s.kind} "${s.title}" is true on ${Math.round(s.share * 100)} % of the bars: a Series used as a JavaScript boolean (always true), or a condition that is not a cross?`,
        });
      }
    }
  }
  if (report.strategy && report.strategy.closedTrades === 0 && !report.strategy.openTrade) {
    w.push({ code: 'no-trades', message: `The strategy makes no trade on the ${n} bars: check the entry conditions (plot them with plotshape) and where the orders are placed.` });
  }
  return w;
}

function checkSpec(spec: CheckSpec, report: CheckReport, run: ScriptRunResult | undefined): NonNullable<CheckReport['spec']> {
  const items: NonNullable<CheckReport['spec']>['items'] = [];
  const item = (check: string, ok: boolean, expected?: unknown, actual?: unknown) => items.push({ check, ok, expected, actual });
  const d = report.declaration;
  if (spec.kind !== undefined) item('kind', d?.kind === spec.kind, spec.kind, d?.kind);
  if (spec.title !== undefined) item('title', d?.title === spec.title, spec.title, d?.title);
  if (spec.overlay !== undefined) item('overlay', d?.overlay === spec.overlay, spec.overlay, d?.overlay);
  const inputs = run?.inputConfig ?? [];
  for (const [name, want] of Object.entries(spec.inputs ?? {})) {
    const got = findByName(inputs, name);
    if (!got) {
      item(`input "${name}" exists`, false, name, inputs.map((i) => i.id));
      continue;
    }
    for (const key of ['type', 'defval', 'title', 'min', 'max', 'options'] as const) {
      if (want[key] === undefined) continue;
      item(`input "${name}" ${key}`, JSON.stringify(got[key]) === JSON.stringify(want[key]), want[key], got[key]);
    }
  }
  const all = [
    ...(d?.outputs ?? []),
    ...(run?.hlineConfig ?? []).map((h) => ({ kind: 'hline', id: h.id, title: h.title ?? h.id })),
    ...(run?.barColorConfig ?? []).map((b) => ({ kind: b.kind, id: b.id, title: b.title ?? b.id })),
    ...(run?.alertConfig ?? []).map((a) => ({ kind: 'alertcondition', id: a.id, title: a.title ?? a.id })),
  ];
  for (const o of spec.outputs ?? []) {
    const { title, kind } = typeof o === 'string' ? { title: o, kind: undefined } : o;
    const got = all.filter((x) => lower(x.title) === lower(title) || lower(x.id) === lower(title));
    const match = kind ? got.find((x) => x.kind === kind) : got[0];
    item(`output "${title}"${kind ? ` (${kind})` : ''} exists`, !!match, kind ? `${kind} "${title}"` : title, got.length ? got.map((x) => `${x.kind} "${x.title}"`) : all.map((x) => `${x.kind} "${x.title}"`));
  }
  for (const [name, want] of Object.entries(spec.plots ?? {})) {
    const p = findByName(report.plots, name);
    if (!p) {
      item(`plot "${name}" exists`, false, name, report.plots.map((x) => x.title));
      continue;
    }
    if (want.min !== undefined) item(`plot "${name}" min`, p.min !== null && p.min >= want.min, `>= ${want.min}`, p.min);
    if (want.max !== undefined) item(`plot "${name}" max`, p.max !== null && p.max <= want.max, `<= ${want.max}`, p.max);
    if (want.warmup !== undefined) item(`plot "${name}" first value`, p.firstBar >= 0 && p.firstBar <= want.warmup, `bar <= ${want.warmup}`, p.firstBar);
  }
  for (const [name, want] of Object.entries(spec.signals ?? {})) {
    const s = findByName(report.signals, name);
    if (!s) {
      item(`signal "${name}" exists`, false, name, report.signals.map((x) => x.title));
      continue;
    }
    if (want.min !== undefined) item(`signal "${name}" count`, s.count >= want.min, `>= ${want.min}`, s.count);
    if (want.max !== undefined) item(`signal "${name}" count`, s.count <= want.max, `<= ${want.max}`, s.count);
    if (want.minShare !== undefined) item(`signal "${name}" share`, s.share >= want.minShare, `>= ${want.minShare}`, Number(s.share.toFixed(4)));
    if (want.maxShare !== undefined) item(`signal "${name}" share`, s.share <= want.maxShare, `<= ${want.maxShare}`, Number(s.share.toFixed(4)));
  }
  if (spec.trades) {
    const t = report.strategy?.closedTrades;
    if (t === undefined) item('trades', false, 'a strategy', d?.kind);
    else {
      if (spec.trades.min !== undefined) item('closed trades', t >= spec.trades.min, `>= ${spec.trades.min}`, t);
      if (spec.trades.max !== undefined) item('closed trades', t <= spec.trades.max, `<= ${spec.trades.max}`, t);
    }
  }
  const failed = items.filter((i) => !i.ok).length;
  return { passed: items.length - failed, failed, items };
}

function checkReference(ref: CheckReference, run: ScriptRunResult, bars: Bar[]): NonNullable<CheckReport['reference']> {
  const tol = ref.tolerance ?? 1e-10;
  const index = new Map(bars.map((b, i) => [b.time, i]));
  const na = (v: number | null | undefined) => v === null || v === undefined || Number.isNaN(v);
  return Object.entries(ref.columns).map(([column, expected]) => {
    const plot = findByName(
      run.plotConfig.map((p) => ({ id: p.id, title: p.title ?? p.id })),
      column
    );
    if (!plot) return ref.ignoreUnknown ? { column, ignored: true, equal: 0, total: 0 } : { column, equal: 0, total: expected.length };
    const values = new Map(((run.result.plots[plot.id] ?? []) as Array<{ time: number; value: number }>).map((p) => [p.time, p.value]));
    let equal = 0;
    let total = 0;
    let firstMismatch: { bar: number; time: number; expected: number | null; actual: number | null } | undefined;
    ref.times.forEach((time, k) => {
      const bar = index.get(time);
      if (bar === undefined) return;
      total++;
      const e = expected[k];
      const a = values.get(time);
      const same = na(e) && na(a) ? true : na(e) || na(a) ? false : Math.abs(a! - e!) <= tol * Math.max(1, Math.abs(a!), Math.abs(e!));
      if (same) equal++;
      else firstMismatch ??= { bar, time, expected: na(e) ? null : e!, actual: na(a) ? null : a! };
    });
    return { column, output: plot.title, equal, total, ...(firstMismatch ? { firstMismatch } : {}) };
  });
}

// ── checkScript ──────────────────────────────────────────────────────────────

/** Default number of synthetic bars of a check. */
export const CHECK_BARS = 1500;

const HOUR = 3600;

/** The edge-case bars of `scenarios: true`. */
export const SCENARIOS: readonly CheckScenario[] = [
  { name: 'short', description: '30 hourly bars (a short history)', timeframe: '60', bars: () => syntheticBars(30) },
  { name: 'daily', description: '800 daily bars', timeframe: 'D', bars: () => syntheticBars(800, 86400) },
  { name: 'minute', description: '1,000 one-minute bars', timeframe: '1', bars: () => syntheticBars(1000, 60) },
  {
    name: 'flat',
    description: '200 bars with the same price and no volume (zero ranges)',
    timeframe: '60',
    bars: () => syntheticBars(200).map((b) => ({ ...b, open: 100, high: 100, low: 100, close: 100, volume: 0 })),
  },
  {
    name: 'no-volume',
    description: '500 bars without volume (na)',
    timeframe: '60',
    bars: () => syntheticBars(500).map((b) => ({ ...b, volume: NaN })),
  },
  {
    name: 'gap',
    description: '500 hourly bars with a 3-day gap in the middle',
    timeframe: '60',
    bars: () => syntheticBars(500).map((b, i) => (i >= 250 ? { ...b, time: b.time + 72 * HOUR } : b)),
  },
];

/**
 * Checks a script source (the body of a script, as a host runs it): compiles it, runs it on zero bars (the
 * declarations) and on the bars, and reports its declarations, outputs, warnings and the spec / reference results.
 * Never throws for a script error: the errors are in the report.
 */
export function checkScript(source: string, options: CheckOptions = {}): CheckReport {
  const timeframe = options.timeframe ?? (options.bars ? inferTimeframe(options.bars) : '60');
  const step = timeframeSeconds(timeframe) || 3600;
  const bars = options.bars ?? syntheticBars(CHECK_BARS, step);
  const inputs = options.inputs ?? {};
  const wrap = options.run ?? (<T>(fn: () => T) => fn());
  const runOptions = { ...options, timeframe };
  const report: CheckReport = {
    ok: false,
    bars: { count: bars.length, first: bars[0]?.time ?? null, last: bars[bars.length - 1]?.time ?? null, timeframe, synthetic: !options.bars },
    errors: [],
    warnings: [],
    plots: [],
    signals: [],
    drawings: { labels: 0, lines: 0, boxes: 0, tables: 0, polylines: 0, linefills: 0 },
    alertCalls: 0,
  };
  const fail = (stage: CheckStage, error: unknown) =>
    report.errors.push({ stage: isTimeout(error) ? 'timeout' : stage, message: messageOf(error), ...errorLocation(error, options.filename) });
  // a misspelt key would be skipped and the check would pass without checking it
  if (options.spec) for (const message of validateSpec(options.spec)) report.errors.push({ stage: 'spec', message });

  // compile once to report syntax errors apart from the run errors
  try {
    (options.compile ?? compileScript)(source);
  } catch (e) {
    fail('syntax', e);
    return finish();
  }

  let main: ScriptRun | undefined;
  try {
    const decl = wrap(() => runScript(source, [], inputs, runOptions)).run;
    report.declaration = {
      kind: decl.strategyConfig ? 'strategy' : 'indicator',
      title: decl.metadata.title,
      ...(decl.metadata.shortTitle ? { shortTitle: decl.metadata.shortTitle } : {}),
      overlay: decl.metadata.overlay,
      inputs: decl.inputConfig.map(({ id, type, defval, title, min, max, options: opts }) => ({
        id,
        type,
        defval,
        ...(title !== undefined ? { title } : {}),
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
        ...(opts !== undefined ? { options: opts } : {}),
      })),
      outputs: decl.outputs.map((o) => ({ kind: o.kind, id: o.id, title: o.title ?? o.id })),
      ...(decl.strategyConfig ? { strategy: { ...decl.strategyConfig } } : {}),
    };
  } catch (e) {
    fail('declaration', e);
    return finish();
  }

  try {
    main = wrap(() => runScript(source, bars, inputs, runOptions));
  } catch (e) {
    fail('run', e);
    return finish();
  }

  const run = main.run;
  const r = run.result;
  report.plots = summarizePlots(run, bars);
  report.signals = summarizeSignals(run, bars);
  report.drawings = {
    labels: r.labels?.length ?? 0,
    lines: r.lines?.length ?? 0,
    boxes: r.boxes?.length ?? 0,
    tables: r.tables?.length ?? 0,
    polylines: r.polylines?.length ?? 0,
    linefills: r.linefills?.length ?? 0,
  };
  report.alertCalls = (r as { alertCalls?: unknown[] }).alertCalls?.length ?? 0;
  if (main.engine) report.strategy = summarizeStrategy(main.engine);
  report.warnings = warningsOf(report, bars);
  // a live chart (createScriptRun) calculates only the newest bars of a script whose state the runtime keeps (#196)
  if (!main.engine) {
    try {
      const reason = wrap(() => incrementalReason(source, bars, inputs, runOptions));
      report.liveUpdates = { resumed: reason === null, reason };
    } catch {
      // the main run already reports the errors of the script
    }
  }

  if (options.inputSweep !== false) {
    const base = fingerprint(run, main.engine);
    for (const input of run.inputConfig) {
      const value = alternative(input);
      if (value === undefined) continue;
      try {
        const other = wrap(() => runScript(source, bars, { ...inputs, [input.id]: value }, runOptions));
        if (fingerprint(other.run, other.engine) === base) {
          report.warnings.push({
            code: 'unused-input',
            target: input.title ?? input.id,
            message: `Input "${input.title ?? input.id}" changes no output (tried ${JSON.stringify(value)} instead of ${JSON.stringify(input.defval)}): is its value used?`,
          });
        }
      } catch (e) {
        report.warnings.push({
          code: 'input-error',
          target: input.title ?? input.id,
          message: `Input "${input.title ?? input.id}" = ${JSON.stringify(value)} stops the script: ${messageOf(e)}`,
        });
      }
    }
  }

  if (options.spec) report.spec = checkSpec(options.spec, report, run);
  if (options.checks) {
    const trades = main.engine?.closed ?? [];
    const items = wrapChecks(() => runChecks(options.checks!, run, bars, inputs, trades));
    const spec = (report.spec ??= { passed: 0, failed: 0, items: [] });
    spec.items.push(...items);
    spec.failed = spec.items.filter((i) => !i.ok).length;
    spec.passed = spec.items.length - spec.failed;
  }
  if (options.reference) report.reference = checkReference(options.reference, run, bars);
  if (options.scenarios) runScenarios(options.scenarios === true ? SCENARIOS : options.scenarios);
  return finish();

  function wrapChecks(fn: () => CheckItem[]): CheckItem[] {
    try {
      return wrap(fn);
    } catch (e) {
      return [{ check: 'checks (stopped)', ok: false, actual: messageOf(e) }];
    }
  }

  function runScenarios(list: readonly CheckScenario[]): void {
    const known = new Set(report.warnings.map((w) => `${w.code}:${w.target ?? ''}`));
    report.scenarios = list.map((sc) => {
      const b = sc.bars();
      const r = checkScript(source, {
        ...options,
        bars: b,
        timeframe: sc.timeframe,
        spec: undefined,
        reference: undefined,
        checks: undefined,
        scenarios: false,
        inputSweep: false,
      });
      for (const e of r.errors) report.errors.push({ ...e, stage: 'scenario', message: `[${sc.name}: ${sc.description}] ${e.message}` });
      return {
        name: sc.name,
        description: sc.description,
        bars: b.length,
        errors: r.errors,
        // only the na that leaks through (a division by a zero range...): other warnings follow from the bars
        warnings: r.warnings.filter((w) => w.code === 'empty-plot' && !known.has(`${w.code}:${w.target ?? ''}`)),
      };
    });
  }

  function finish(): CheckReport {
    if (options.spec && !report.spec) report.spec = checkSpec(options.spec, report, main?.run);
    report.ok =
      report.errors.length === 0 &&
      (report.spec?.failed ?? 0) === 0 &&
      (report.reference ?? []).every((c) => c.ignored || (c.equal === c.total && c.output !== undefined));
    return report;
  }
}
