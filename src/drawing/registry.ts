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
 * - an object that a `var` variable of the drawing type refers to is never deleted by this rule, and it still counts
 *   (measured for lines, labels and boxes: with 9 held boxes and a maximum of 50, 9 held + 46 others stay). Only
 *   the variable itself protects: an object in a `var` array, in a field of a user type or in a variable that got
 *   another object or `na` later is deleted like any other. JavaScript has no `var` declaration to observe, so the
 *   script says it: {@link varDrawing} (a variable), or {@link holdDrawing} / {@link releaseDrawing}
 * - linefills have the limit of `max_lines_count` with another rule for the held ones (measured on one script, two
 *   long runs): a fill is skipped when a `var` variable holds it or released it less than 5,000 bars ago (the bar
 *   of {@link setDrawingBar}); when the count is still above the maximum + 5 after that, the oldest fills are
 *   deleted until the maximum remain, the held ones too
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

/**
 * Marks an object as held by a `var` variable (PineScript `var line l = ...` or `l := line.new(...)` on a `var`
 * variable): the maximum count never deletes it, and it still counts. Returns the object.
 */
export function holdDrawing<T extends object>(obj: T): T {
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

/**
 * Tells the drawing functions which bar is being calculated (`bar_index`), so that a bar index more than 10,000
 * bars back throws as in PineScript; `null` turns the check off. `eachBar` of the script API calls it.
 */
export function setDrawingBar(barIndex: number | null): void {
  currentBar = barIndex;
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

/** Records a new object and deletes the oldest objects of its kind when the count is too high. */
export function register<K extends DrawingKind>(kind: K, obj: DrawingTypes[K]): DrawingTypes[K] {
  const list = live[kind];
  list.push(obj);
  if (kind === 'table') return obj; // tables have no maximum count
  const max = limits[kind === 'linefill' ? 'line' : (kind as keyof DrawingLimits)];
  if (list.length > max + SLACK) {
    // the oldest first; an object held by a `var` variable is skipped and still counts
    const kept: Array<DrawingTypes[K]> = [];
    let excess = list.length - max;
    for (const old of list) {
      if (excess > 0 && old !== obj && !(kind === 'linefill' ? fillProtected(old) : held.has(old))) {
        excess--;
        markDeleted(kind, old, false);
      } else kept.push(old);
    }
    // linefills: still above the maximum + 5, the oldest go, the held ones too
    if (kind === 'linefill' && kept.length > max + SLACK) {
      for (const old of kept.splice(0, kept.length - max)) markDeleted(kind, old, false);
    }
    list.length = 0;
    list.push(...kept);
  }
  return obj;
}

/** Deletes an object (no effect when it is already deleted). */
export function remove<K extends DrawingKind>(kind: K, obj: DrawingTypes[K]): void {
  const list = live[kind];
  const index = list.indexOf(obj);
  if (index !== -1) list.splice(index, 1);
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
  currentBar = null;
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
