/**
 * State of an incremental script run (#196, createScriptRun).
 *
 * A run executes the script body again on each update, but what the body creates (Series, ta.* calls, eachBar()
 * blocks, plots, persist() boxes) is matched by creation order with the previous run, and keeps the values of the bars
 * before the first bar to calculate (`from`, the forming bar of the previous run). Only the bars from `from` on are
 * calculated:
 * - a Series: its values before `from` are those of the previous run, the others are computed
 * - a ta.* call with a {@link taStep} machine: the machine holds the state of the last confirmed bar and steps the newest
 *   bars only
 * - an eachBar() block: its callback runs from `from` on, its persist() boxes and history buffers put back to their
 *   state at the end of the last confirmed bar
 * - a plot: the points of the bars before `from` are kept
 *
 * A feature that is not resumed (drawings, other symbols, strategies, varip, values that depend on the bar count)
 * calls {@link nonIncremental}: a recorded (full) run marks the run so that the next updates are full runs, a resumed
 * run stops ({@link ResumeAborted}) and the host runs it in full.
 *
 * @internal
 */
import { Series, setSeriesRunHooks, type SeriesRunHooks } from '../runtime/series.js';
import type { Bar } from '../types/index.js';
import type { BarStep } from '../ta/step.js';

/** A resumed run met a feature it does not resume: the update is calculated by a full run. */
export class ResumeAborted extends Error {
  constructor(readonly reason: string) {
    super(`incremental run stopped: ${reason}`);
  }
}

/** History buffer state of one source of an eachBar() block (RE10008). */
export interface BufferState {
  size: number;
  previous: number;
  barMax: number;
}

/** State of an eachBar() block at the end of the last confirmed bar. */
export interface BlockCheckpoint {
  /** Values of the persist() boxes the block owns, by box slot */
  boxes: Map<number, unknown>;
  /** History buffers by source key (Series slot, or the Series of the chart) */
  buffers: Map<unknown, BufferState>;
  pendingError: { bar: number; barsBack: number } | null;
}

export interface BlockMemory {
  out: number[];
  checkpoint: BlockCheckpoint;
}

/** A ta.* call with a machine: its machines (state of the last confirmed bar) and output values. */
export interface TaMemory {
  kind: string;
  machine: BarStep<unknown[], unknown>;
  outs: number[][];
}

/** A plot's points and, for each bar j, the number of points before it. */
export interface PlotMemory {
  data: Array<{ time: number; value: number; color?: string }>;
  pos: number[];
  /** Offset and colour kind of the plot: the points are kept only for the same */
  sig: string;
}

/** What a run keeps for the next update. */
export interface RunMemory {
  /** Bars of that run */
  n: number;
  /** Values of the Series the script created, by slot */
  series: Array<number[] | undefined>;
  /** Values of the Series that live across runs (the chart's open, close, bar_index...) */
  kept: WeakMap<Series, number[]>;
  ta: Array<TaMemory | undefined>;
  blocks: Array<BlockMemory | undefined>;
  plots: Array<PlotMemory | undefined>;
  /** Block slot that owns each persist() box */
  boxOwner: Array<number | undefined>;
}

export function emptyMemory(n: number): RunMemory {
  return { n, series: [], kept: new WeakMap(), ta: [], blocks: [], plots: [], boxOwner: [] };
}

export interface ActiveRun {
  mode: 'record' | 'resume';
  /** First bar calculated (0 when recording) */
  from: number;
  bars: readonly Bar[];
  prev: RunMemory | null;
  next: RunMemory;
  seriesSlot: number;
  taSlot: number;
  blockSlot: number;
  plotSlot: number;
  boxSlot: number;
  /** The eachBar() block running (its slot), -1 outside */
  block: number;
  /** Getters and setters of the persist() boxes of this run, by slot */
  boxes: Array<{ get(): unknown; set(v: unknown): void }>;
  /** Why the next updates are full runs (null: they can be resumed) */
  blocked: string | null;
}

/** The incremental run being executed (null outside createScriptRun or in a plain executeScript). */
export let active: ActiveRun | null = null;

const SLOT = Symbol('series slot');

/** Slot of a Series created by the script in this run, or undefined (a chart Series, or one made inside eachBar) */
export function slotOf(series: Series): number | undefined {
  return (series as unknown as Record<symbol, number | undefined>)[SLOT];
}

const hooks: SeriesRunHooks = {
  created(series) {
    const run = active;
    // A Series made in an eachBar() callback is made again on each bar: it is not matched with the previous run.
    if (!run || run.block >= 0) return;
    (series as unknown as Record<symbol, number>)[SLOT] = run.seriesSlot++;
  },
  prefix(series, bars) {
    const run = active;
    if (!run || run.mode !== 'resume' || bars !== run.bars || !run.prev) return null;
    const slot = slotOf(series);
    const values = slot !== undefined ? run.prev.series[slot] : run.prev.kept.get(series);
    return values && values.length >= run.from ? { values, from: run.from } : null;
  },
  computed(series, values) {
    const run = active;
    if (!run || run.block >= 0) return;
    const slot = slotOf(series);
    if (slot !== undefined) run.next.series[slot] = values;
    else run.next.kept.set(series, values);
  },
};

/** Starts an incremental run (the script body runs next); returns the run to give to {@link endRun}. */
export function beginRun(run: ActiveRun): ActiveRun | null {
  const outer = active;
  active = run;
  setSeriesRunHooks(hooks);
  return outer;
}

/** Ends the run started by {@link beginRun}, putting back the outer one (a nested run) or none. */
export function endRun(outer: ActiveRun | null): void {
  active = outer;
  setSeriesRunHooks(outer ? hooks : null);
}

/** No incremental run inside (a nested executeScript, e.g. other symbols): the outer one is put back by endRun(). */
export function suspendRun(): ActiveRun | null {
  const outer = active;
  active = null;
  setSeriesRunHooks(null);
  return outer;
}

/**
 * A copy of a persist() value for a checkpoint: the forming bar may change an array or an object in place after it was
 * taken. Plain data is copied (structuredClone); a value that cannot be copied (a function, a class instance such as
 * a drawing) is kept as it is and marks the run as not resumable.
 */
export function copyValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function') nonIncremental('a function in persist()');
    return value;
  }
  if (Array.isArray(value)) return value.map(copyValue);
  if (value instanceof Map) return new Map([...value].map(([k, v]) => [copyValue(k), copyValue(v)]));
  if (value instanceof Set) return new Set([...value].map(copyValue));
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    nonIncremental('a class instance in persist()');
    return value;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = copyValue(v);
  return out;
}

/**
 * A feature an incremental run does not resume: a recorded run keeps its result (it is a full run) and marks the next
 * updates as full runs; a resumed run stops.
 */
export function nonIncremental(reason: string): void {
  const run = active;
  if (!run) return;
  if (run.mode === 'resume') throw new ResumeAborted(reason);
  run.blocked ??= reason;
}
