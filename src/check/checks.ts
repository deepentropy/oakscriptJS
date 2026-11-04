/**
 * @fileoverview Behaviour checks of a script: the checks a spec cannot write as counts and ranges ("Buy only when the
 * RSI is below 30", "the signal line stays under the MACD", "the value on bar 100 is X"). A check function gets `t`, the
 * outputs of the run per bar, and records each check with `t.expect` / `t.everyBar`:
 *
 * ```js
 * const rsi = t.plot("RSI");
 * t.everyBar("RSI between 0 and 100", (i) => rsi.at(i) === null || (rsi.at(i) >= 0 && rsi.at(i) <= 100));
 * t.expect("Buy only when the RSI is below 30", t.signal("Buy").bars.every((i) => rsi.at(i) < 30));
 * ```
 *
 * @module check/checks
 */
import type { Bar } from '../types/index.js';
import type { ScriptRunResult, StrategyTrade } from '../script/index.js';

/** The bars of each signal output (shape, char, arrow, alert condition, background or bar colour). */
export interface SignalBars {
  kind: 'shape' | 'char' | 'arrow' | 'alertcondition' | 'bgcolor' | 'barcolor';
  id: string;
  title: string;
  /** Bar indexes with the signal, in order. */
  bars: number[];
}

const visible = (c: string | undefined): boolean =>
  !!c && c !== 'transparent' && !/^#[0-9a-f]{6}00$/i.test(c) && !/,\s*0\s*\)$/.test(c);

/** The bars of each signal output of a run. */
export function signalBars(run: ScriptRunResult, bars: readonly Bar[]): SignalBars[] {
  const index = new Map(bars.map((b, i) => [b.time, i]));
  const of = (times: number[]) =>
    [...new Set(times.map((t) => index.get(t)).filter((i): i is number => i !== undefined))].sort((a, b) => a - b);
  const r = run.result;
  const out: SignalBars[] = [];
  for (const s of run.shapeConfig) {
    out.push({ kind: s.kind === 'char' ? 'char' : 'shape', id: s.id, title: s.title ?? s.id, bars: of((r.markers ?? []).filter((m) => m.id === s.id).map((m) => m.time)) });
  }
  for (const a of run.arrowConfig) {
    const times = (r.arrows ?? []).filter((x) => x.id === a.id && x.value !== 0 && !Number.isNaN(x.value)).map((x) => x.time as number);
    out.push({ kind: 'arrow', id: a.id, title: a.title ?? a.id, bars: of(times) });
  }
  for (const b of run.barColorConfig) {
    const list = b.kind === 'bgcolor' ? (r.bgColors ?? []) : (r.barColors ?? []);
    const times = list.filter((x) => (x.id === undefined || x.id === b.id) && visible(x.color)).map((x) => x.time);
    out.push({ kind: b.kind, id: b.id, title: b.title ?? b.id, bars: of(times) });
  }
  for (const a of r.alerts ?? []) out.push({ kind: 'alertcondition', id: a.id, title: a.title ?? a.id, bars: of(a.times) });
  return out;
}

/** A plot of the run, per bar. */
export interface CheckPlot {
  id: string;
  title: string;
  /** Value per bar (null: na). */
  values: Array<number | null>;
  /** Colour per bar when the plot has per-bar colours (undefined otherwise). */
  colors?: Array<string | null>;
  /** The value on bar `i` (null: na or no such bar). */
  at(i: number): number | null;
}

/** A signal output of the run. */
export interface CheckSignal {
  kind: SignalBars['kind'];
  id: string;
  title: string;
  /** Bar indexes with the signal. */
  bars: number[];
  /** The signal is on bar `i`. */
  on(i: number): boolean;
}

/** What a check function gets. */
export interface CheckContext {
  bars: readonly Bar[];
  /** Number of bars. */
  n: number;
  /** A plot by id or title; throws when there is none. */
  plot(name: string): CheckPlot;
  /** A signal (shape, char, arrow, alert condition, background or bar colour) by id or title; throws when there is none. */
  signal(name: string): CheckSignal;
  /** Closed trades of a strategy (empty for an indicator). */
  trades: readonly StrategyTrade[];
  /** The value of an input in the run, by id or title. */
  input(name: string): unknown;
  /** Records a check: `ok` false fails it; `detail` is shown when it fails. */
  expect(check: string, ok: boolean, detail?: unknown): void;
  /** Records a check true on every bar from `from` (default 0) to `to` (default the last bar); fails on the first bar where `predicate(i)` is false. */
  everyBar(check: string, predicate: (i: number) => boolean, options?: { from?: number; to?: number }): void;
}

export interface CheckItem {
  check: string;
  ok: boolean;
  expected?: unknown;
  actual?: unknown;
}

const lower = (s: string | undefined): string => (s ?? '').trim().toLowerCase();

/** Runs a check function on a run; returns its items (an exception is a failed item). */
export function runChecks(
  fn: (t: CheckContext) => void,
  run: ScriptRunResult,
  bars: readonly Bar[],
  inputs: Record<string, unknown>,
  trades: readonly StrategyTrade[],
  label = 'checks'
): CheckItem[] {
  const items: CheckItem[] = [];
  const index = new Map(bars.map((b, i) => [b.time, i]));
  const signals = signalBars(run, bars);
  const plots = new Map<string, CheckPlot>();
  const find = <T extends { id: string; title?: string }>(list: T[], name: string): T | undefined =>
    list.find((x) => lower(x.id) === lower(name)) ?? list.find((x) => lower(x.title) === lower(name));
  const t: CheckContext = {
    bars,
    n: bars.length,
    trades,
    plot(name) {
      const p = find(run.plotConfig, name);
      if (!p) throw new Error(`t.plot("${name}"): no plot with this id or title (plots: ${run.plotConfig.map((x) => `"${x.title ?? x.id}"`).join(', ') || 'none'})`);
      const cached = plots.get(p.id);
      if (cached) return cached;
      const values: Array<number | null> = new Array(bars.length).fill(null);
      let colors: Array<string | null> | undefined;
      for (const pt of (run.result.plots[p.id] ?? []) as Array<{ time: number; value: number; color?: string }>) {
        const i = index.get(pt.time);
        if (i === undefined) continue;
        values[i] = pt.value;
        if (pt.color !== undefined) (colors ??= new Array(bars.length).fill(null))[i] = pt.color;
      }
      const plot: CheckPlot = { id: p.id, title: p.title ?? p.id, values, ...(colors ? { colors } : {}), at: (i) => values[i] ?? null };
      plots.set(p.id, plot);
      return plot;
    },
    signal(name) {
      const s = find(signals, name);
      if (!s) throw new Error(`t.signal("${name}"): no signal with this id or title (signals: ${signals.map((x) => `"${x.title}"`).join(', ') || 'none'})`);
      const on = new Set(s.bars);
      return { kind: s.kind, id: s.id, title: s.title, bars: s.bars, on: (i) => on.has(i) };
    },
    input(name) {
      const i = find(run.inputConfig, name);
      if (!i) throw new Error(`t.input("${name}"): no input with this id or title`);
      return i.id in inputs ? inputs[i.id] : i.defval;
    },
    expect(check, ok, detail) {
      items.push({ check, ok: !!ok, ...(ok || detail === undefined ? {} : { actual: detail }) });
    },
    everyBar(check, predicate, options = {}) {
      const from = Math.max(0, options.from ?? 0);
      const to = Math.min(bars.length - 1, options.to ?? bars.length - 1);
      for (let i = from; i <= to; i++) {
        if (!predicate(i)) {
          items.push({ check, ok: false, expected: 'true on every bar', actual: `false on bar ${i}` });
          return;
        }
      }
      items.push({ check, ok: true });
    },
  };
  try {
    fn(t);
  } catch (e) {
    const m = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : String(e);
    items.push({ check: `${label} (stopped)`, ok: false, actual: m });
  }
  return items;
}
