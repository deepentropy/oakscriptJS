/**
 * Registry of the live drawing objects (lines, labels, boxes, polylines, linefills, tables), as PineScript
 * keeps them. PineScript rules:
 *
 * - `line.all`, `label.all`, ... list the live objects in creation order (a copy of the list)
 * - `delete` removes an object; the object becomes `na`: its getters return NaN and its setters
 *   do nothing. Deleting a line with `line.delete` also deletes the linefills that use it
 * - when a creation brings the count above `max_*_count + 5`, the oldest objects are deleted until
 *   `max_*_count` remain (default 50). Copies count as creations. Linefills follow the same rule with
 *   `max_lines_count`; lines deleted by this rule do not delete their linefills
 * - the object that was just created is never deleted by this rule
 * - an object that a `var` variable of the drawing type refers to is never deleted by this rule, and it still counts
 *   (measured for lines, labels and boxes: with 9 held boxes and a maximum of 50, 9 held + 46 others stay; with 8
 *   held lines and a maximum of 5, the 8 and the newest line stay). The protection starts on the bar after the
 *   assignment: 12 `var` lines created on the first bar with a maximum of 5 lose the first 6. Only
 *   the variable itself protects: an object in a `var` array, in a field of a user type or in a variable that got
 *   another object or `na` later is deleted like any other. JavaScript has no `var` declaration to observe, so the
 *   script says it: {@link varDrawing} (a variable), or {@link holdDrawing} / {@link releaseDrawing}
 * - linefills have the limit of `max_lines_count` with another rule for the held ones (measured on one script, two
 *   long runs): a fill is skipped when a `var` variable holds it or released it less than 5,000 bars ago (the bar
 *   of {@link setDrawingBar}); when the count is still above the maximum + 5 after that, the oldest fills are
 *   deleted until the maximum remain, the held ones too
 * - the script deletes count (`line.delete`, `label.delete`, ...): each kind has a number `P` of deleted objects. A
 *   delete adds 1; a creation first sets `P` to 0 when it is 5 or more (3 or more for polylines)
 * - polylines use `P` on every bar: a creation cuts when the count is above `max_polylines_count + 5 + P`, down to
 *   the maximum + `P`, and the polylines of the cut are added to `P`. A script that deletes and creates one polyline
 *   per bar therefore sees the cut 0, 1 or 2 bars late
 * - lines, labels and boxes use `P` on the last bar only, with its value at the start of that bar: there the cut is
 *   above the maximum + 5 + `P`, down to the maximum + `P` (up to 4 more objects)
 * - the last bar is calculated twice (measured for lines, labels and polylines, on a closed and on an open last bar;
 *   boxes are taken to do the same). The objects of the bars before that the maximum count deletes in the first
 *   calculation stay deleted, and such a line takes its linefills with it; the rest of the bar is undone and
 *   calculated again. With 10 lines and a maximum of 10, 13 lines on the last bar leave these 13 (one calculation
 *   would leave 11). For polylines `P` is not undone, and on the last bar only the first creation can set it to 0.
 *   A script function runs once per bar, so the registry replays the creations and deletions of the last bar when
 *   the bar is left ({@link setDrawingBar} with another bar or `null`); during the last bar `line.all` shows the
 *   first calculation
 *
 * - a bar index (`xloc.bar_index`) more than 10,000 bars before the current bar stops the script (runtime error
 *   RE10026) in `line.new`, `box.new`, `label.new`, `polyline.new` and the setters of x. The current bar is the one
 *   of `eachBar` in a script run; a port with its own bar loop gives it with {@link setDrawingBar}
 *
 * The script API (`executeScript`) resets the registry at the start of every run and applies the
 * `max_*_count` values of `indicator()`. Outside a script run the registry is global to the module.
 *
 * @module drawing/registry
 */

import type { Box, Label, Line, Linefill, Polyline, Table } from '../types/index.js';

export type DrawingKind = 'line' | 'label' | 'box' | 'polyline' | 'linefill' | 'table';

interface DrawingTypes {
  line: Line;
  label: Label;
  box: Box;
  polyline: Polyline;
  linefill: Linefill;
  table: Table;
}

/** Default `max_lines_count`, `max_labels_count`, `max_boxes_count`, `max_polylines_count`. */
export const DEFAULT_MAX_COUNT = 50;
/** Objects above the maximum that PineScript keeps before it deletes the oldest ones. */
const SLACK = 5;

export type DrawingLimits = Partial<Record<Exclude<DrawingKind, 'linefill' | 'table'>, number>>;

const live: { [K in DrawingKind]: Array<DrawingTypes[K]> } = {
  line: [],
  label: [],
  box: [],
  polyline: [],
  linefill: [],
  table: [],
};
let limits: Required<DrawingLimits> = {
  line: DEFAULT_MAX_COUNT,
  label: DEFAULT_MAX_COUNT,
  box: DEFAULT_MAX_COUNT,
  polyline: DEFAULT_MAX_COUNT,
};
const deleted = new WeakSet<object>();
/** Objects held by a `var` variable, with the number of variables that hold them. */
let held = new WeakMap<object, number>();
/** Bar on which the last `var` variable released an object (linefill rule). */
let releasedAt = new WeakMap<object, number>();
/** Bars during which a released linefill is still skipped by the maximum count. */
const LINEFILL_RELEASE_BARS = 5000;
/** Bar on which a `var` variable got an object: the maximum count skips it from the next bar on. */
let heldAt = new WeakMap<object, number>();
/** Kinds with a maximum count of their own. */
type CountedKind = 'line' | 'label' | 'box' | 'polyline';
const COUNTED_KINDS: readonly CountedKind[] = ['line', 'label', 'box', 'polyline'];
const isCounted = (kind: DrawingKind): kind is CountedKind => (COUNTED_KINDS as readonly DrawingKind[]).includes(kind);
/** `P` of the module notes: objects deleted by the script (for polylines also by the maximum count). */
let pending: Record<CountedKind, number> = { line: 0, label: 0, box: 0, polyline: 0 };
/** A creation sets `P` to 0 from this value on. */
const PENDING_RESET: Record<CountedKind, number> = { line: 5, label: 5, box: 5, polyline: 3 };

/**
 * Marks an object as held by a `var` variable (PineScript `var line l = ...` or `l := line.new(...)` on a `var`
 * variable): the maximum count never deletes it, and it still counts. Returns the object.
 */
export function holdDrawing<T extends object>(obj: T): T {
  if (!held.has(obj)) {
    if (currentBar === null) heldAt.delete(obj);
    else heldAt.set(obj, currentBar);
  }
  held.set(obj, (held.get(obj) ?? 0) + 1);
  return obj;
}

/** The `var` variable no longer refers to the object (it got another object or `na`). */
export function releaseDrawing(obj: object | null | undefined): void {
  if (!obj) return;
  const count = held.get(obj) ?? 0;
  if (count > 1) held.set(obj, count - 1);
  else if (held.delete(obj) && currentBar !== null) releasedAt.set(obj, currentBar);
}

/** Held by a `var` variable since a bar before the current one (or outside a bar loop). */
function heldBefore(obj: object): boolean {
  if (!held.has(obj)) return false;
  const bar = heldAt.get(obj);
  return bar === undefined || currentBar === null || bar < currentBar;
}

/** Linefill rule: held, or released less than 5,000 bars ago. */
function fillProtected(obj: object): boolean {
  if (held.has(obj)) return true;
  const bar = releasedAt.get(obj);
  return bar !== undefined && currentBar !== null && currentBar - bar < LINEFILL_RELEASE_BARS;
}

/** A `var` variable of a drawing type: see {@link varDrawing}. */
export interface DrawingVariable<T extends object> {
  /** The object of the variable; setting it holds the new object and releases the one before */
  value: T | undefined;
}

/**
 * A PineScript `var` variable of a drawing type (`var line l = na`). The object it refers to is not deleted by the
 * maximum count; assigning another object (or `undefined` for `na`) releases the one before.
 *
 * @example
 * ```typescript
 * // Pine:  var line level = na
 * //        level := line.new(bar_index, close, bar_index + 1, close)
 * const level = varDrawing<Line>();
 * level.value = line.new(i, close, i + 1, close);
 * ```
 */
export function varDrawing<T extends object>(initial?: T): DrawingVariable<T> {
  let current: T | undefined = initial ? holdDrawing(initial) : undefined;
  return {
    get value() {
      return current;
    },
    set value(next: T | undefined) {
      if (next === current) return;
      releaseDrawing(current);
      current = next ? holdDrawing(next) : undefined;
    },
  };
}

/** Largest distance, in bars, of a bar index before the current bar (PineScript runtime error RE10026 above it). */
export const MAX_DRAWING_BARS_BACK = 10000;
let currentBar: number | null = null;

/** What happened on the last bar, to calculate it a second time. */
interface LastBar {
  bar: number;
  /** The live objects when the bar started */
  start: Record<CountedKind, object[]>;
  /** `P` of lines, labels and boxes when the bar started: their allowance for the whole bar */
  allowance: Record<CountedKind, number>;
  /** Creations and deletions by the script, in order */
  steps: Array<{ kind: CountedKind; create: boolean; obj: object }>;
  /** Objects of the bars before that the maximum count deleted */
  cut: Set<object>;
  /** Coordinates of the objects of this bar that the maximum count deleted */
  saved: Map<object, Record<string, unknown>>;
  /** A polyline was created on this bar (only the first one can set `P` to 0) */
  polyline: boolean;
  /** The second calculation is running */
  second: boolean;
}
let lastBar: LastBar | null = null;

/**
 * Tells the drawing functions which bar is being calculated (`bar_index`), so that a bar index more than 10,000
 * bars back throws as in PineScript; `null` turns the check off. `eachBar` of the script API calls it.
 *
 * The bar also dates the objects held by a `var` variable (protected from the next bar on). `last` says that it is
 * the last bar of the data, which PineScript calculates twice: the registry records the bar and replays it when the
 * bar is left (another bar, or `null`).
 */
export function setDrawingBar(barIndex: number | null, last: boolean = false): void {
  if (lastBar && !(last && barIndex === lastBar.bar)) replayLastBar();
  currentBar = barIndex;
  if (barIndex !== null && last && !lastBar) {
    const start = (kind: CountedKind): number => (pending[kind] >= PENDING_RESET[kind] ? 0 : pending[kind]);
    lastBar = {
      bar: barIndex,
      start: { line: [...live.line], label: [...live.label], box: [...live.box], polyline: [...live.polyline] },
      allowance: { line: start('line'), label: start('label'), box: start('box'), polyline: 0 },
      steps: [],
      cut: new Set(),
      saved: new Map(),
      polyline: false,
      second: false,
    };
  }
}

/**
 * Second calculation of the last bar: the objects of the bars before that the maximum count deleted stay deleted,
 * the creations and deletions of the bar are applied again.
 */
function replayLastBar(): void {
  const pass = lastBar;
  if (!pass || pass.second) return;
  if (pass.cut.size === 0 && pass.saved.size === 0) {
    lastBar = null; // no cut on this bar: the second calculation gives the same objects
    return;
  }
  pass.second = true;
  for (const kind of COUNTED_KINDS) {
    const list = pass.start[kind].filter((obj) => !pass.cut.has(obj)) as Array<DrawingTypes[typeof kind]>;
    for (const step of pass.steps) {
      if (step.kind !== kind) continue;
      const obj = step.obj as DrawingTypes[typeof kind];
      if (step.create) {
        list.push(obj);
        const cut = cutOldest(kind, list, obj);
        if (kind === 'polyline') pending.polyline += cut.length;
      } else {
        const index = list.indexOf(obj);
        if (index !== -1) {
          list.splice(index, 1);
          if (kind === 'polyline') pending.polyline++;
        }
      }
    }
    const kept = new Set<object>(list);
    for (const obj of live[kind]) if (!kept.has(obj)) markDeleted(kind, obj, false);
    for (const obj of list) {
      const coordinates = pass.saved.get(obj);
      if (deleted.has(obj) && coordinates) {
        deleted.delete(obj);
        Object.assign(obj, coordinates);
      }
    }
    (live[kind] as object[]).length = 0;
    (live[kind] as object[]).push(...list);
  }
  lastBar = null;
}

/**
 * Throws the PineScript runtime error RE10026 when `x` is a bar index more than 10,000 bars before the current bar.
 * `method` and `variable` are the names of the PineScript message ("line.new", "x1").
 */
export function checkBarIndex(method: string, variable: string, x: number, xloc: string | undefined): void {
  if (currentBar === null || (xloc ?? 'bar_index') !== 'bar_index') return;
  if (currentBar - x > MAX_DRAWING_BARS_BACK) {
    throw new Error(
      `Error on bar ${currentBar}: Bar index value of the \`${variable}\` argument (${x}) in \`${method}()\` is too far ` +
        'from the current bar index. Try using `time` instead.'
    );
  }
}

/** Numeric fields that become NaN when an object is deleted, so that its getters return `na`. */
const COORDINATES: { [K in DrawingKind]: Array<keyof DrawingTypes[K]> } = {
  line: ['x1', 'y1', 'x2', 'y2'],
  label: ['x', 'y'],
  box: ['left', 'top', 'right', 'bottom'],
  polyline: [],
  linefill: [],
  table: [],
};

function markDeleted<K extends DrawingKind>(kind: K, obj: DrawingTypes[K], explicit: boolean): void {
  deleted.add(obj);
  for (const field of COORDINATES[kind]) (obj as unknown as Record<string, unknown>)[field as string] = NaN;
  if (kind === 'line' && explicit) {
    for (const fill of live.linefill.filter((f) => f.line1 === obj || f.line2 === obj)) remove('linefill', fill);
  }
}

/** Objects above the maximum that the rule allows for, besides the 5: `P` of the module notes. */
function allowance(kind: DrawingKind): number {
  if (kind === 'polyline') return pending.polyline;
  return lastBar && isCounted(kind) ? lastBar.allowance[kind] : 0;
}

/**
 * The maximum count after the creation of `obj`: removes the objects to delete from `list` (the oldest first; the new
 * object and an object held by a `var` variable are skipped and still count) and returns them.
 */
function cutOldest<K extends DrawingKind>(kind: K, list: Array<DrawingTypes[K]>, obj: DrawingTypes[K]): Array<DrawingTypes[K]> {
  if (kind === 'table') return []; // tables have no maximum count
  const max = limits[kind === 'linefill' ? 'line' : (kind as keyof DrawingLimits)] + allowance(kind);
  if (list.length <= max + SLACK) return [];
  const kept: Array<DrawingTypes[K]> = [];
  const cut: Array<DrawingTypes[K]> = [];
  let excess = list.length - max;
  for (const old of list) {
    if (excess > 0 && old !== obj && !(kind === 'linefill' ? fillProtected(old) : heldBefore(old))) {
      excess--;
      cut.push(old);
    } else kept.push(old);
  }
  // linefills: still above the maximum + 5, the oldest go, the held ones too
  if (kind === 'linefill' && kept.length > max + SLACK) cut.push(...kept.splice(0, kept.length - max));
  list.length = 0;
  list.push(...kept);
  return cut;
}

/** Records a new object and deletes the oldest objects of its kind when the count is too high. */
export function register<K extends DrawingKind>(kind: K, obj: DrawingTypes[K]): DrawingTypes[K] {
  const list = live[kind];
  const replay = lastBar && isCounted(kind) ? lastBar : null;
  if (isCounted(kind)) {
    // on the last bar only the first polyline can set P to 0 (the other kinds took their P when the bar started)
    const reset = !replay || (kind === 'polyline' && !replay.polyline);
    if (reset && pending[kind] >= PENDING_RESET[kind]) pending[kind] = 0;
    if (replay) {
      if (kind === 'polyline') replay.polyline = true;
      replay.steps.push({ kind, create: true, obj });
    }
  }
  list.push(obj);
  const cut = cutOldest(kind, list, obj);
  if (kind === 'polyline') pending.polyline += cut.length;
  for (const old of cut) {
    if (!replay) markDeleted(kind, old, false);
    else if (replay.start[kind as CountedKind].includes(old)) {
      // last bar, an object of the bars before: it stays deleted, and the linefills of a line go with it
      replay.cut.add(old);
      markDeleted(kind, old, true);
    } else {
      // last bar, an object of this bar: the second calculation may keep it
      const coordinates: Record<string, unknown> = {};
      for (const field of COORDINATES[kind]) coordinates[field as string] = (old as unknown as Record<string, unknown>)[field as string];
      replay.saved.set(old, coordinates);
      markDeleted(kind, old, false);
    }
  }
  return obj;
}

/** Deletes an object (no effect when it is already deleted). */
export function remove<K extends DrawingKind>(kind: K, obj: DrawingTypes[K]): void {
  const list = live[kind];
  const index = list.indexOf(obj);
  if (index !== -1) {
    list.splice(index, 1);
    if (isCounted(kind)) pending[kind]++;
  }
  if (lastBar && isCounted(kind)) lastBar.steps.push({ kind, create: false, obj });
  if (!deleted.has(obj)) markDeleted(kind, obj, true);
}

/** True when the object was deleted (by `delete` or by the maximum count). */
export function isDeleted(obj: unknown): boolean {
  return typeof obj === 'object' && obj !== null && deleted.has(obj);
}

/** The live objects of a kind, in creation order (a new array). */
export function all<K extends DrawingKind>(kind: K): Array<DrawingTypes[K]> {
  return [...live[kind]] as Array<DrawingTypes[K]>;
}

/** Forgets all objects (without deleting them) and sets the maximum counts (default 50). */
export function resetDrawings(newLimits: DrawingLimits = {}): void {
  for (const kind of Object.keys(live) as DrawingKind[]) live[kind].length = 0;
  held = new WeakMap();
  releasedAt = new WeakMap();
  heldAt = new WeakMap();
  pending = { line: 0, label: 0, box: 0, polyline: 0 };
  currentBar = null;
  lastBar = null;
  limits = {
    line: newLimits.line ?? DEFAULT_MAX_COUNT,
    label: newLimits.label ?? DEFAULT_MAX_COUNT,
    box: newLimits.box ?? DEFAULT_MAX_COUNT,
    polyline: newLimits.polyline ?? DEFAULT_MAX_COUNT,
  };
}

/** Changes the maximum counts without forgetting the objects (PineScript `indicator(max_*_count)`). */
export function setDrawingLimits(newLimits: DrawingLimits): void {
  limits = { ...limits, ...Object.fromEntries(Object.entries(newLimits).filter(([, v]) => v !== undefined)) };
}
