/**
 * Runs agent-guide scripts (skills/oakscript) the way a host app runs a script written in its editor: the source
 * is the body of the script, with every value export of `oakscriptjs/script` as an implicit global (no import).
 */
import * as api from '../../src/script';
import {
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
} from '../../src/script';
import type { Bar } from '../../src/types';

/** The implicit globals of a script: every value export of the script API but the host entry. */
const GLOBALS = Object.keys(api).filter((k) => k !== 'default' && k !== 'executeScript' && /^[A-Za-z_$][\w$]*$/.test(k));

/** Compiles a script source into a body for executeScript(); throws a SyntaxError on invalid code. */
export function compileScript(source: string): () => void {
  const fn = new Function(...GLOBALS, `"use strict";\n${source}`) as (...args: unknown[]) => void;
  const values = GLOBALS.map((k) => (api as Record<string, unknown>)[k]);
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

/** Chart context of the test runs: hourly bars of a 24x7 symbol; other symbols get bars of their own. */
export function testChart(bars: Bar[]): ChartContext {
  const span = bars.length ? bars[bars.length - 1]!.time - bars[0]!.time + HOUR : 0;
  const steps: Record<string, number> = { '15': 900, '60': HOUR, '240': 4 * HOUR, '1D': 86400, '1W': 7 * 86400 };
  return {
    tickerid: 'TEST:SYN',
    timeframe: '60',
    timezone: 'Etc/UTC',
    session: '24x7',
    mintick: 0.01,
    pointvalue: 1,
    mincontract: 1,
    currency: 'USD',
    bars: (symbol, timeframe) => {
      const step = steps[timeframe];
      if (!step) return [];
      // a run on zero bars (the declaration run of a host) gets one empty bar: no bars at all is an invalid symbol
      if (!bars.length) return [{ time: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 }];
      return syntheticBars(Math.ceil(span / step), step, symbol.length + 7);
    },
    symbolInfo: () => ({ timezone: 'Etc/UTC', session: '24x7', mintick: 0.01, currency: 'USD' }),
  };
}

/**
 * A small order engine for the tests (the library does not fill orders). Market entries and closes fill at the
 * next bar open; `strategy.exit` stop / limit levels are checked inside each bar (stop first when both are hit).
 * Entry limit / stop prices, pyramiding and process_orders_on_close are not simulated.
 */
export class TestEngine implements StrategyEngine {
  readonly closed: StrategyTrade[] = [];
  private open: StrategyTrade | null = null;
  private pendingEntry: { id: string; direction: StrategyDirection; qty?: number } | null = null;
  private pendingClose = false;
  private exits = new Map<string, StrategyExitOptions>();
  private net = 0;
  private bar = 0;

  constructor(readonly setup: StrategySetup) {}

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

/** Runs a script source on `bars` with the test chart context and, for a strategy, the test engine. */
export function runScript(source: string, bars: Bar[], inputs: Record<string, unknown> = {}): ScriptRun {
  let engine: TestEngine | undefined;
  const run = executeScript(compileScript(source), bars, inputs, testChart(bars), {
    strategyEngine: (setup) => (engine = new TestEngine(setup)),
  });
  return { run, engine };
}
