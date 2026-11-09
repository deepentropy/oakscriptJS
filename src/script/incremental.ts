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
import { isDrawingObject, setDrawingRunHooks, type DrawingCheckpoint, type DrawingKind, type DrawingRunHooks } from '../drawing/registry.js';

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
  /** The drawing registry and its objects (the block that draws puts it back) */
  drawings: DrawingCheckpoint | null;
  /** State the block keeps besides the script's (the strategy engine of strategy.eachBar()) */
  extra?: unknown;
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
  /** Drawing objects created in the script body (outside the callbacks), by creation order */
  bodyDrawings: Array<{ kind: DrawingKind; obj: object } | undefined>;
  /** The eachBar() block that uses the drawings (one per script), undefined when none */
  drawingBlock: number | undefined;
}

export function emptyMemory(n: number): RunMemory {
  return { n, series: [], kept: new WeakMap(), ta: [], blocks: [], plots: [], boxOwner: [], bodyDrawings: [], drawingBlock: undefined };
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
  drawSlot: number;
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
    // also a Series of the body first read in an eachBar() callback (its values do not depend on the bar running, #206)
    const run = active;
    if (!run) return;
    const slot = slotOf(series);
    if (slot !== undefined) run.next.series[slot] = values;
    else run.next.kept.set(series, values);
  },
};

/**
 * Drawings in an incremental run: one eachBar() block uses them (its checkpoint holds the registry and the state of
 * the objects); the objects created in the script body before the blocks are the same objects on each run (matched by
 * creation order), set again to their new state. Drawings used by two blocks, or in the body after a block, are not
 * resumed.
 */
const drawingHooks: DrawingRunHooks = {
  access() {
    const run = active;
    if (!run) return;
    if (run.block < 0) {
      if (run.blockSlot > 0) nonIncremental('drawings in the script body after an eachBar() block');
      return;
    }
    if (run.next.drawingBlock === undefined) run.next.drawingBlock = run.block;
    else if (run.next.drawingBlock !== run.block) nonIncremental('drawings in two eachBar() blocks');
  },
  reuse(kind, obj) {
    const run = active;
    if (!run || run.block >= 0) return null;
    const slot = run.drawSlot++;
    if (run.mode === 'record') {
      run.next.bodyDrawings[slot] = { kind, obj };
      return null;
    }
    const old = run.prev?.bodyDrawings[slot];
    if (!old || old.kind !== kind) nonIncremental('a new drawing in the script body');
    run.next.bodyDrawings[slot] = old;
    return old!.obj;
  },
};

/** Starts an incremental run (the script body runs next); returns the run to give to {@link endRun}. */
export function beginRun(run: ActiveRun): ActiveRun | null {
  const outer = active;
  active = run;
  setSeriesRunHooks(hooks);
  setDrawingRunHooks(drawingHooks);
  return outer;
}

/** Ends the run started by {@link beginRun}, putting back the outer one (a nested run) or none. */
export function endRun(outer: ActiveRun | null): void {
  active = outer;
  setSeriesRunHooks(outer ? hooks : null);
  setDrawingRunHooks(outer ? drawingHooks : null);
}

/** The script body has run: the run builds its outputs (they read the drawings without being part of the script). */
export function bodyDone(): void {
  setDrawingRunHooks(null);
}

/** No incremental run inside (a nested executeScript, e.g. other symbols): the outer one is put back by endRun(). */
export function suspendRun(): ActiveRun | null {
  const outer = active;
  active = null;
  setSeriesRunHooks(null);
  setDrawingRunHooks(null);
  return outer;
}

/**
 * A copy of a persist() value for a checkpoint: the forming bar may change an array or an object in place after it was
 * taken. Plain data is copied (structuredClone); a value that cannot be copied (a function, a class instance such as
 * a drawing) is kept as it is and marks the run as not resumable.
 */
export function copyValue(value: unknown): unknown {
  // a drawing object is shared: the checkpoint of the registry puts its state back
  if (isDrawingObject(value)) return value;
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

/** {@link plainCopy} of a value that is not plain data. */
export const NOT_COPIED: unique symbol = Symbol('not copied');

/** A deep copy of plain data (numbers, strings, booleans, arrays, plain objects, Map, Set), else {@link NOT_COPIED}. */
export function plainCopy(value: unknown): unknown {
  if (typeof value === 'function') return NOT_COPIED;
  if (value === null || typeof value !== 'object') return value;
  const all = (items: unknown[]): unknown[] | typeof NOT_COPIED => {
    const out = items.map(plainCopy);
    return out.includes(NOT_COPIED) ? NOT_COPIED : out;
  };
  if (Array.isArray(value)) return all(value);
  if (value instanceof Map) {
    const entries = all([...value].flat());
    if (entries === NOT_COPIED) return NOT_COPIED;
    const m = new Map();
    for (let k = 0; k < entries.length; k += 2) m.set(entries[k], entries[k + 1]);
    return m;
  }
  if (value instanceof Set) {
    const items = all([...value]);
    return items === NOT_COPIED ? NOT_COPIED : new Set(items);
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return NOT_COPIED;
  const keys = Object.keys(value);
  const values = all(keys.map((k) => (value as Record<string, unknown>)[k]));
  if (values === NOT_COPIED) return NOT_COPIED;
  const out: Record<string, unknown> = {};
  keys.forEach((k, j) => (out[k] = values[j]));
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
