/**
 * @fileoverview Runs a script source the way a host app runs a script written in its editor: the source is the body
 * of the script, with every value export of `oakscriptjs/script` but `executeScript` as an implicit global, on
 * deterministic synthetic bars (or given bars), with a chart context and, for a strategy, a small order engine.
 * Used by {@link checkScript}, the `oakscript check` command and the tests of the agent guide.
 *
 * @module check/harness
 */
import * as lib from '../index.js';
import * as api from '../script/index.js';
import {
  createScriptRun,
  executeScript,
  type ChartContext,
  type ScriptRunResult,
  type StrategyCloseOptions,
  type StrategyDirection,
  type StrategyEngine,
  type StrategyEntryOptions,
  type StrategyExitOptions,
  type StrategyRiskRule,
  type StrategySetup,
  type StrategyTrade,
  type StrategyVariable,
} from '../script/index.js';
import type { Bar } from '../types/index.js';

/** The implicit globals of a script: every value export of the script API but the host entry. */
export const SCRIPT_GLOBALS: readonly string[] = Object.keys(api).filter(
  (k) => k !== 'default' && k !== 'executeScript' && /^[A-Za-z_$][\w$]*$/.test(k)
);

/** Name of the parameter that receives the `oakscriptjs` module in a compiled script (its `import` statements). */
export const LIBRARY_PARAMETER = '__oakscriptjs';

/** The values of {@link SCRIPT_GLOBALS}, then the `oakscriptjs` module, in the order of the compiled parameters. */
export function scriptArguments(): unknown[] {
  return [...SCRIPT_GLOBALS.map((k) => (api as Record<string, unknown>)[k]), lib];
}

/**
 * Rewrites the `import { a, b as c } from "oakscriptjs"` statements of a script into `const { a, b: c } = ...` on the
 * same lines (the line numbers of the source do not change). Throws on an import of another module: a script runs
 * self-contained.
 */
export function rewriteImports(source: string): string {
  return source.replace(/^([ \t]*)import\s*(\{[^}]*\}|\*\s+as\s+[A-Za-z_$][\w$]*)\s*from\s*(['"])([^'"]+)\3\s*;?/gm, (all, indent, what, _q, from) => {
    if (from !== 'oakscriptjs' && from !== 'oakscriptjs/script') {
      throw new SyntaxError(`A script can only import from "oakscriptjs" (found "${from}").`);
    }
    const lines = all.split('\n').length - 1;
    const binding = what.startsWith('*')
      ? what.replace(/^\*\s+as\s+/, '')
      : what.replace(/\s+as\s+/g, ': ').replace(/\s+/g, ' ');
    return `${indent}const ${binding} = ${LIBRARY_PARAMETER};${'\n'.repeat(lines)}`;
  });
}

/**
 * Start and end of the function the script source is wrapped in. The globals are the parameters of an outer function
 * and the source is the body of an inner one, so a script can declare a name of a global (`const size = 2`), as in an
 * app that imports the globals at the top of a module. The start goes on the first line of the source.
 */
export const SCRIPT_PREFIX = '"use strict"; return (function () { ';
export const SCRIPT_SUFFIX = '\n})();';

/** The source of the function body of a compiled script (imports rewritten, lines kept). */
export function wrapSource(source: string): string {
  return SCRIPT_PREFIX + rewriteImports(source) + SCRIPT_SUFFIX;
}

/** Compiles a script source into a body for executeScript(); throws a SyntaxError on invalid code. */
export function compileScript(source: string): () => void {
  const fn = new Function(...SCRIPT_GLOBALS, LIBRARY_PARAMETER, wrapSource(source)) as (...args: unknown[]) => void;
  const values = scriptArguments();
  return () => fn(...values);
}

const HOUR = 3600;
/** 2024-01-01 00:00 UTC, in seconds. */
const START = 1704067200;

/** Deterministic synthetic bars: two waves, a slow trend and seeded noise. `step`: seconds between bars. */
export function syntheticBars(count: number, step = HOUR, seed = 1): Bar[] {
  let s = seed >>> 0 || 1;
  const rand = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  const scale = Math.sqrt(step / HOUR);
  const bars: Bar[] = [];
  let prev = 100;
  for (let i = 0; i < count; i++) {
    const t = (i * step) / HOUR;
    const close = 100 + 12 * Math.sin(t / 60) + 4 * Math.sin(t / 11) + t * 0.004 + (rand() - 0.5) * 1.5 * scale;
    const open = prev;
    const high = Math.max(open, close) + rand() * 0.8 * scale;
    const low = Math.min(open, close) - rand() * 0.8 * scale;
    bars.push({ time: START + i * step, open, high, low, close, volume: Math.round(1000 + rand() * 4000) });
    prev = close;
  }
  return bars;
}

/** Seconds of a timeframe string ("1", "60", "240", "D", "1D", "W", "M"); NaN when it is not one. */
export function timeframeSeconds(timeframe: string): number {
  const m = /^(\d*)([SDWM]?)$/.exec(timeframe.trim().toUpperCase());
  if (!m) return NaN;
  const n = m[1] ? Number(m[1]) : 1;
  const unit = { '': 60, S: 1, D: 86400, W: 7 * 86400, M: 30 * 86400 }[m[2] as '' | 'S' | 'D' | 'W' | 'M'];
  return n * unit;
}

/** The timeframe of bars from the most common spacing of their times ("60", "D", "W"...); "60" for fewer than 2 bars. */
export function inferTimeframe(bars: readonly Bar[]): string {
  const counts = new Map<number, number>();
  for (let i = 1; i < bars.length; i++) {
    const d = bars[i]!.time - bars[i - 1]!.time;
    if (d > 0) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let step = 0;
  let best = 0;
  for (const [d, c] of counts) if (c > best) [step, best] = [d, c];
  if (!step) return '60';
  if (step >= 28 * 86400) return 'M';
  if (step >= 7 * 86400) return 'W';
  if (step >= 86400) return 'D';
  if (step < 60) return `${step}S`;
  return String(Math.round(step / 60));
}

export interface TestChartOptions {
  /** Chart timeframe (default "60"). */
  timeframe?: string;
  /** Chart ticker id (default "TEST:SYN"). */
  tickerid?: string;
  /** Time zone of the chart and of the other symbols (default "Etc/UTC"). */
  timezone?: string;
  /** Session of the chart and of the other symbols (default "24x7"). */
  session?: string;
}

/**
 * Chart context of the test runs: a 24x7 symbol in UTC. Higher timeframes of the chart symbol are resampled from the
 * chart bars by the library; other symbols get synthetic bars of their own (seeded by the symbol name).
 */
export function testChart(bars: Bar[], options: TestChartOptions = {}): ChartContext {
  const timezone = options.timezone ?? 'Etc/UTC';
  const session = options.session ?? '24x7';
  const chartStep = timeframeSeconds(options.timeframe ?? '60') || HOUR;
  const span = bars.length ? bars[bars.length - 1]!.time - bars[0]!.time + chartStep : 0;
  return {
    tickerid: options.tickerid ?? 'TEST:SYN',
    timeframe: options.timeframe ?? '60',
    timezone,
    session,
    mintick: 0.01,
    pointvalue: 1,
    mincontract: 1,
    currency: 'USD',
    bars: (symbol, timeframe) => {
      const step = timeframeSeconds(timeframe);
      if (!step) return [];
      // a run on zero bars (the declaration run of a host) gets one empty bar: no bars at all is an invalid symbol
      if (!bars.length) return [{ time: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 }];
      const first = bars[0]!.time;
      return syntheticBars(Math.ceil(span / step), step, symbol.length + 7).map((b) => ({
        ...b,
        time: first + (b.time - START),
      }));
    },
    symbolInfo: () => ({ timezone, session, mintick: 0.01, currency: 'USD' }),
  };
}

/**
 * A small order engine for checks and tests (the library does not fill orders). Market entries and closes fill at the
 * next bar open; `strategy.exit` stop / limit levels are checked inside each bar (stop first when both are hit).
 * Entry limit / stop prices, pyramiding and process_orders_on_close are not simulated.
 */
/** A saved state of {@link TestEngine} */
interface TestEngineState {
  closed: StrategyTrade[];
  open: StrategyTrade | null;
  pendingEntry: { id: string; direction: StrategyDirection; qty?: number } | null;
  pendingClose: boolean;
  exits: Map<string, StrategyExitOptions>;
  net: number;
  bar: number;
}

export class TestEngine implements StrategyEngine {
  readonly closed: StrategyTrade[] = [];
  private open: StrategyTrade | null = null;
  private pendingEntry: { id: string; direction: StrategyDirection; qty?: number } | null = null;
  private pendingClose = false;
  private exits = new Map<string, StrategyExitOptions>();
  private net = 0;
  private bar = 0;

  constructor(readonly setup: StrategySetup) {}

  /** The engine state at the end of a bar, for incremental runs (#196) */
  save(): TestEngineState {
    return {
      closed: this.closed.map((t) => ({ ...t })),
      open: this.open ? { ...this.open } : null,
      pendingEntry: this.pendingEntry ? { ...this.pendingEntry } : null,
      pendingClose: this.pendingClose,
      exits: new Map([...this.exits].map(([k, v]) => [k, { ...v }])),
      net: this.net,
      bar: this.bar,
    };
  }

  restore(state: unknown): void {
    const s = state as TestEngineState;
    this.closed.length = 0;
    for (const t of s.closed) this.closed.push({ ...t });
    this.open = s.open ? { ...s.open } : null;
    this.pendingEntry = s.pendingEntry ? { ...s.pendingEntry } : null;
    this.pendingClose = s.pendingClose;
    this.exits = new Map([...s.exits].map(([k, v]) => [k, { ...v }]));
    this.net = s.net;
    this.bar = s.bar;
  }

  private get bars(): readonly Bar[] {
    return this.setup.bars;
  }

  private equity(price: number): number {
    return this.setup.properties.initial_capital + this.net + this.openProfit(price);
  }

  private openProfit(price: number): number {
    return this.open ? (price - this.open.entry_price) * this.open.size : 0;
  }

  private commission(value: number): number {
    const p = this.setup.properties;
    return p.commission_type === 'percent' ? (Math.abs(value) * p.commission_value) / 100 : 0;
  }

  private closeAt(price: number, exitId: string): void {
    const t = this.open;
    if (!t) return;
    const commission = t.commission + this.commission(price * t.size);
    const profit = (price - t.entry_price) * t.size - commission;
    this.net += profit;
    this.closed.push({
      ...t,
      commission,
      profit,
      profit_percent: (profit / Math.abs(t.entry_price * t.size)) * 100,
      exit_id: exitId,
      exit_price: price,
      exit_bar_index: this.bar,
      exit_time: this.bars[this.bar]!.time * 1000,
    });
    this.open = null;
    this.exits.clear();
  }

  /** The open trade, if any. */
  get openTradeNow(): StrategyTrade | null {
    return this.open;
  }

  processBar(bar: number): void {
    this.bar = bar;
    const b = this.bars[bar]!;
    if (this.pendingClose) this.closeAt(b.open, 'Close');
    this.pendingClose = false;
    const e = this.pendingEntry;
    this.pendingEntry = null;
    if (e && !(this.open && Math.sign(this.open.size) === (e.direction === 'long' ? 1 : -1))) {
      if (this.open) this.closeAt(b.open, e.id);
      const p = this.setup.properties;
      const equity = this.equity(b.open);
      const qty =
        e.qty ??
        (p.default_qty_type === 'fixed'
          ? p.default_qty_value
          : p.default_qty_type === 'cash'
            ? p.default_qty_value / b.open
            : (equity * p.default_qty_value) / 100 / b.open);
      const size = e.direction === 'long' ? qty : -qty;
      this.open = {
        entry_id: e.id,
        entry_price: b.open,
        entry_bar_index: bar,
        entry_time: b.time * 1000,
        size,
        profit: 0,
        profit_percent: 0,
        commission: this.commission(b.open * size),
        max_runup: 0,
        max_runup_percent: 0,
        max_drawdown: 0,
        max_drawdown_percent: 0,
      };
    }
    const t = this.open;
    if (!t) return;
    for (const [id, x] of this.exits) {
      if (x.from_entry !== undefined && x.from_entry !== t.entry_id) continue;
      const long = t.size > 0;
      if (x.stop !== undefined && (long ? b.low <= x.stop : b.high >= x.stop)) {
        this.closeAt(long ? Math.min(b.open, x.stop) : Math.max(b.open, x.stop), id);
        return;
      }
      if (x.limit !== undefined && (long ? b.high >= x.limit : b.low <= x.limit)) {
        this.closeAt(long ? Math.max(b.open, x.limit) : Math.min(b.open, x.limit), id);
        return;
      }
    }
  }

  processClose(): void {}

  entry(id: string, direction: StrategyDirection, options: StrategyEntryOptions): void {
    this.pendingEntry = { id, direction, qty: options.qty };
  }

  order(id: string, direction: StrategyDirection, options: StrategyEntryOptions): void {
    this.entry(id, direction, options);
  }

  exit(id: string, options: StrategyExitOptions): void {
    this.exits.set(id, options);
  }

  close(id: string, _options: StrategyCloseOptions): void {
    if (this.open?.entry_id === id) this.pendingClose = true;
  }

  close_all(): void {
    if (this.open) this.pendingClose = true;
  }

  cancel(id: string): void {
    this.exits.delete(id);
    if (this.pendingEntry?.id === id) this.pendingEntry = null;
  }

  cancel_all(): void {
    this.exits.clear();
    this.pendingEntry = null;
  }

  readonly rules: StrategyRiskRule[] = [];

  risk(rule: StrategyRiskRule): void {
    this.rules.push(rule);
  }

  get(variable: StrategyVariable): number | string | undefined {
    const price = this.bars[this.bar]?.close ?? NaN;
    const wins = this.closed.filter((t) => t.profit > 0).length;
    const values: Partial<Record<StrategyVariable, number | string>> = {
      position_size: this.open?.size ?? 0,
      position_avg_price: this.open?.entry_price ?? NaN,
      initial_capital: this.setup.properties.initial_capital,
      equity: this.equity(price),
      netprofit: this.net,
      openprofit: this.openProfit(price),
      opentrades: this.open ? 1 : 0,
      closedtrades: this.closed.length,
      wintrades: wins,
      losstrades: this.closed.length - wins,
      account_currency: 'USD',
    };
    return values[variable];
  }

  openTrade(index: number): StrategyTrade | undefined {
    return index === 0 && this.open ? this.open : undefined;
  }

  closedTrade(index: number): StrategyTrade | undefined {
    return this.closed[index];
  }
}

export interface ScriptRun {
  run: ScriptRunResult;
  engine?: TestEngine;
}

export interface RunScriptOptions extends TestChartOptions {
  /** Compiles the source (default {@link compileScript}); the CLI compiles with file lines. */
  compile?: (source: string) => () => void;
}

/** Runs a script source on `bars` with the test chart context and, for a strategy, the test engine. */
export function runScript(
  source: string,
  bars: Bar[],
  inputs: Record<string, unknown> = {},
  options: RunScriptOptions = {}
): ScriptRun {
  let engine: TestEngine | undefined;
  const body = (options.compile ?? compileScript)(source);
  const run = executeScript(body, bars, inputs, testChart(bars, options), {
    strategyEngine: (setup) => (engine = new TestEngine(setup)),
  });
  return { run, engine };
}

/**
 * Why a live chart would calculate the script in full on every update (#196), or null when its updates are resumed:
 * the script runs as on a live chart, on the bars but the last one, then once more with the last bar (a resumed update,
 * compared with a full run).
 */
export function incrementalReason(
  source: string,
  bars: Bar[],
  inputs: Record<string, unknown> = {},
  options: RunScriptOptions = {}
): string | null {
  if (bars.length < 2) return null;
  const body = (options.compile ?? compileScript)(source);
  const chart = testChart(bars, options);
  const run = createScriptRun(body, inputs, chart, { strategyEngine: (setup) => new TestEngine(setup), verify: 1 });
  run.update(bars.slice(0, -1), chart);
  run.update(bars, chart);
  return run.fullRunReason;
}
