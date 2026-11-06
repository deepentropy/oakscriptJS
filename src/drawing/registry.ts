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
 * - the last bar has rules of its own (measured from the count after each creation, on a closed and on an open last
 *   bar): a cut deletes the objects of the bars before first, at most those (a line takes its linefills with it);
 *   once none is left, a cut deletes objects of the last bar as on any bar. With 10 lines and a maximum of 10, 13
 *   lines on the last bar leave these 13: the cut at the 16th line deletes the 10 old ones only. Lines, labels and
 *   boxes: equal to PineScript, count after every operation and objects alive at the end, on 72 of 72 runs checked
 *   after the rule was written (and 218 of 218 end states before)
 * - polylines on the last bar: the `P` carried from the bar before is counted twice (the first creation adds it once
 *   more, unless it sets `P` to 0), later creations do not set `P` to 0, and the polylines of the bars before that a
 *   cut deletes are added to `P`. Once none is
 *   left, `P` is at least the number of polylines of the bars before deleted on the last bar (by the count or by
 *   the script) and a cut deletes polylines of the last bar: a script that deletes its 100 polylines and creates 200
 *   on the last bar keeps them all (#176). Equal to PineScript for the polylines alive at the end on 271 of
 *   281 probe runs; the count inside the bar can differ when the script deletes polylines of the last bar
 *
 * - a bar index (`xloc.bar_index`) more than 10,000 bars before the current bar stops the script (runtime error
 *   RE10026) in `line.new`, `box.new`, `label.new`, `polyline.new` and the setters of x. The current bar is the one
 *   of `eachBar` in a script run; a port with its own bar loop gives it with {@link setDrawingBar}
 *
 * The script API (`executeScript`) resets the registry at the start of every run and applies the
 * `max_*_count` values of `indicator()`. Outside a script run the registry is global to the module.
 *
 * A port with its own bar loop resumes a live update with {@link saveDrawingCheckpoint} (at the end of the last
 * confirmed bar) and {@link restoreDrawingCheckpoint} (before the forming bar is calculated again).
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

/**
 * The live objects of a kind, in creation order. The maximum count deletes the oldest ones: they leave by moving the
 * head, and the array drops its dead front once it is as long as the live part, so a creation at the maximum costs
 * O(1) amortised instead of a move of the whole list on every cut.
 */
class LiveList<T> {
  private items: T[] = [];
  private head = 0;

  get length(): number {
    return this.items.length - this.head;
  }

  /** The `k`-th live object (0: the oldest) */
  at(k: number): T {
    return this.items[this.head + k]!;
  }

  push(obj: T): void {
    this.items.push(obj);
  }

  /** Position of `obj` among the live objects, -1 when it is not one */
  lastIndexOf(obj: T): number {
    const index = this.items.lastIndexOf(obj);
    return index >= this.head ? index - this.head : -1;
  }

  removeAt(k: number): void {
    if (k === 0) this.dropFront(1);
    else this.items.splice(this.head + k, 1);
  }

  /** Removes the live objects at positions `gone` (increasing); the others keep their order */
  removeAll(gone: readonly number[]): void {
    if (gone.length === 0) return;
    if (gone[0] === 0 && gone[gone.length - 1] === gone.length - 1) {
      this.dropFront(gone.length);
      return;
    }
    const items = this.items;
    let to = this.head + gone[0]!;
    for (let from = to, g = 0; from < items.length; from++) {
      if (from - this.head === gone[g]) g++;
      else items[to++] = items[from]!;
    }
    items.length = to;
  }

  /** Removes the `n` oldest objects and returns them */
  takeFront(n: number): T[] {
    const out = this.items.slice(this.head, this.head + n);
    this.dropFront(n);
    return out;
  }

  private dropFront(n: number): void {
    this.head += n;
    if (this.head >= this.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
  }

  toArray(): T[] {
    return this.items.slice(this.head);
  }

  replace(objs: readonly T[]): void {
    this.items = [...objs];
    this.head = 0;
  }
}

const live: { [K in DrawingKind]: LiveList<DrawingTypes[K]> } = {
  line: new LiveList(),
  label: new LiveList(),
  box: new LiveList(),
  polyline: new LiveList(),
  linefill: new LiveList(),
  table: new LiveList(),
};
let limits: Required<DrawingLimits> = {
  line: DEFAULT_MAX_COUNT,
  label: DEFAULT_MAX_COUNT,
  box: DEFAULT_MAX_COUNT,
  polyline: DEFAULT_MAX_COUNT,
};
/**
 * Base of the classes that add a private field to an existing object (their constructor returns the object they are
 * given). Such a field replaces a WeakMap entry: a study that creates hundreds of thousands of objects spends most of
 * its drawing time adding WeakMap keys. The field is invisible (not a key, not copied by a spread) and stays for the
 * life of the object, as the entry did.
 */
export class Stamped {
  constructor(obj: object) {
    return obj;
  }
}

/** The deleted objects (an incremental run can bring one back when it puts the registry back, #196). */
class Deleted extends Stamped {
  #deleted = true;
  static mark(obj: object): void {
    if (#deleted in obj) (obj as Deleted).#deleted = true;
    else new Deleted(obj);
  }
  static unmark(obj: object): void {
    if (#deleted in obj) (obj as Deleted).#deleted = false;
  }
  static has(obj: object): boolean {
    return #deleted in obj && (obj as Deleted).#deleted;
  }
}

/** The objects the registry recorded (drawing objects, kept as references by the copies of an incremental run). */
const registered = new WeakSet<object>();

/** True for a drawing object of the registry (a line, a label, a box, a polyline, a linefill or a table). */
export function isDrawingObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && registered.has(value);
}

/** Hooks of an incremental script run (#196, set by the script runtime during a run only). @internal */
export interface DrawingRunHooks {
  /** A drawing function read or changed the registry or an object */
  access(): void;
  /** A creation: the object of the previous run to use instead of `obj` (its fields are set to those of `obj`) */
  reuse(kind: DrawingKind, obj: object): object | null;
}

let runHooks: DrawingRunHooks | null = null;

/** @internal */
export function setDrawingRunHooks(hooks: DrawingRunHooks | null): void {
  runHooks = hooks;
}

/** The `var` records of a run: a reset starts new ones, a nested run saves and puts back those of its run. */
interface Holds {
  /** The records of the objects whose private record belongs to another run */
  readonly others: WeakMap<object, HoldRecord>;
  /** Records made in the run. None: no object has one, nothing to look up for each object the maximum count may
   *  delete */
  records: number;
  /** The {@link varDrawing} variables made in the run: a checkpoint puts their objects back with the records */
  readonly variables: Array<{ current: object | undefined }>;
}

/** What the `var` variables of a run did with an object. */
interface HoldRecord {
  readonly run: Holds;
  /** Number of `var` variables that hold the object (0: not held) */
  count: number;
  /** Bar on which a `var` variable got the object: on that bar the maximum count deletes it only when no other object
   *  can go; from the next bar on, never. Undefined outside a bar loop */
  heldAt: number | undefined;
  /** Bar on which the last `var` variable released the object (linefill rule) */
  releasedAt: number | undefined;
}
let holds: Holds = { others: new WeakMap(), records: 0, variables: [] };

/**
 * The record of the first run that holds an object, on the object itself (a study holding a new object on every bar
 * would otherwise add a WeakMap key per bar); the records of other runs go to their {@link Holds.others}.
 */
class Held extends Stamped {
  #record: HoldRecord;
  private constructor(obj: object, record: HoldRecord) {
    super(obj);
    this.#record = record;
  }
  /** The record of `obj` in the current run, if any. */
  static get(obj: object): HoldRecord | undefined {
    if (holds.records === 0) return undefined;
    const own = #record in obj ? (obj as Held).#record : undefined;
    return own?.run === holds ? own : holds.others.get(obj);
  }
  /** A new record of `obj` in the current run (it has none). */
  static create(obj: object): HoldRecord {
    const record: HoldRecord = { run: holds, count: 0, heldAt: undefined, releasedAt: undefined };
    holds.records++;
    if (#record in obj) holds.others.set(obj, record);
    else new Held(obj, record);
    return record;
  }
}
/** Bars during which a released linefill is still skipped by the maximum count. */
const LINEFILL_RELEASE_BARS = 5000;
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
  const record = Held.get(obj) ?? Held.create(obj);
  if (record.count === 0) record.heldAt = currentBar ?? undefined;
  record.count++;
  return obj;
}

/** The `var` variable no longer refers to the object (it got another object or `na`). */
export function releaseDrawing(obj: object | null | undefined): void {
  if (!obj) return;
  const record = Held.get(obj);
  if (!record || record.count === 0) return;
  record.count--;
  if (record.count === 0 && currentBar !== null) record.releasedAt = currentBar;
}

/** Held by a `var` variable since a bar before the current one (or outside a bar loop). */
function heldBefore(obj: object): boolean {
  const record = Held.get(obj);
  if (!record || record.count === 0) return false;
  const bar = record.heldAt;
  return bar === undefined || currentBar === null || bar < currentBar;
}

/**
 * Held by a `var` variable since the current bar, or released by its last variable on the current bar: the maximum
 * count deletes such an object only when the objects it may delete are not enough (#193; 12 `var` lines made on the
 * first bar with a maximum of 5 lose the first 6, #158).
 */
function heldOnThisBar(obj: object): boolean {
  if (currentBar === null) return false;
  const record = Held.get(obj);
  if (!record) return false;
  return record.count > 0 ? record.heldAt === currentBar : record.releasedAt === currentBar;
}

/** Linefill rule: held, or released less than 5,000 bars ago. */
function fillProtected(obj: object): boolean {
  const record = Held.get(obj);
  if (!record) return false;
  if (record.count > 0) return true;
  const bar = record.releasedAt;
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
  const slot: { current: T | undefined } = { current: initial ? holdDrawing(initial) : undefined };
  // kept by the run: a drawing checkpoint puts the variable back without holding or releasing again
  holds.variables.push(slot);
  return {
    get value() {
      return slot.current;
    },
    set value(next: T | undefined) {
      if (next === slot.current) return;
      releaseDrawing(slot.current);
      slot.current = next ? holdDrawing(next) : undefined;
    },
  };
}

/** Largest distance, in bars, of a bar index before the current bar (PineScript runtime error RE10026 above it). */
export const MAX_DRAWING_BARS_BACK = 10000;
/** Largest distance, in bars, of a bar index after the last bar of the data (PineScript runtime error RE10020 above it). */
export const MAX_DRAWING_BARS_FORWARD = 500;
let currentBar: number | null = null;
let lastBarIndex: number | null = null;

/** Kinds whose allowance on the last bar is the `P` they had when the bar started. */
type AllowanceKind = 'line' | 'label' | 'box';
const isAllowanceKind = (kind: DrawingKind): kind is AllowanceKind => kind === 'line' || kind === 'label' || kind === 'box';

/** State of the last bar (see the module notes). */
interface LastBar {
  bar: number;
  /** The objects alive when the bar started (the objects of the bars before) */
  old: Set<object>;
  /** `P` of lines, labels and boxes when the bar started: their allowance for the whole bar */
  allowance: Record<AllowanceKind, number>;
  /** `P` of polylines when the bar started */
  carried: number;
  /** A polyline was created on this bar */
  polyline: boolean;
  /** Polylines of the bars before deleted on this bar (by the count or by the script) */
  oldPolylinesGone: number;
}
let lastBar: LastBar | null = null;

/**
 * Tells the drawing functions which bar is being calculated (`bar_index`), so that a bar index more than 10,000
 * bars back throws as in PineScript; `null` turns the check off. `eachBar` of the script API calls it.
 *
 * The bar also dates the objects held by a `var` variable (on that bar deleted only when no other object can go,
 * never after). `last` says that it is the last bar of the data, which has rules of its own for the maximum count. `lastIndex` is the bar index of the
 * last bar of the data (PineScript `last_bar_index`): with it, a bar index more than 500 bars after it throws, also
 * on the bars before the last one (RE10020).
 */
export function setDrawingBar(barIndex: number | null, last: boolean = false, lastIndex?: number): void {
  if (lastBar && !(last && barIndex === lastBar.bar)) lastBar = null;
  currentBar = barIndex;
  lastBarIndex = barIndex === null ? null : (lastIndex ?? (last ? barIndex : null));
  if (barIndex !== null && last && !lastBar) {
    const start = (kind: AllowanceKind): number => (pending[kind] >= PENDING_RESET[kind] ? 0 : pending[kind]);
    lastBar = {
      bar: barIndex,
      old: new Set<object>([...live.line.toArray(), ...live.label.toArray(), ...live.box.toArray(), ...live.polyline.toArray()]),
      allowance: { line: start('line'), label: start('label'), box: start('box') },
      carried: pending.polyline,
      polyline: false,
      oldPolylinesGone: 0,
    };
  }
}

/**
 * Throws the PineScript runtime error RE10026 when `x` is a bar index more than 10,000 bars before the current bar,
 * and RE10020 when it is more than 500 bars after the last bar of the data (when {@link setDrawingBar} knows it).
 * `method` and `variable` are the names of the PineScript message ("line.new", "x1").
 *
 * Returns `x`, truncated when it is a bar index: PineScript's x is an int (a box from 5537.94 starts on bar 5537,
 * #176).
 */
export function checkBarIndex(method: string, variable: string, x: number, xloc: string | undefined): number {
  if ((xloc ?? 'bar_index') !== 'bar_index') return x;
  x = Math.trunc(x);
  if (currentBar === null) return x;
  if (lastBarIndex !== null && x - lastBarIndex > MAX_DRAWING_BARS_FORWARD) {
    throw new Error(
      `Error on bar ${currentBar}: Objects positioned using xloc.bar_index cannot be drawn further than ` +
        `${MAX_DRAWING_BARS_FORWARD} bars into the future.`
    );
  }
  if (currentBar - x > MAX_DRAWING_BARS_BACK) {
    throw new Error(
      `Error on bar ${currentBar}: Bar index value of the \`${variable}\` argument (${x}) in \`${method}()\` is too far ` +
        'from the current bar index. Try using `time` instead.'
    );
  }
  return x;
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

/** The live linefills of each line, in creation order: deleting a line or making a fill does not scan all the fills. */
let fillsOfLine = new Map<Line, Linefill[]>();

function trackFill(fill: Linefill): void {
  for (const l of fill.line1 === fill.line2 ? [fill.line1] : [fill.line1, fill.line2]) {
    const fills = fillsOfLine.get(l);
    if (fills) fills.push(fill);
    else fillsOfLine.set(l, [fill]);
  }
}

function untrackFill(fill: Linefill): void {
  for (const l of fill.line1 === fill.line2 ? [fill.line1] : [fill.line1, fill.line2]) {
    const fills = fillsOfLine.get(l);
    if (!fills) continue;
    const k = fills.indexOf(fill);
    if (k !== -1) fills.splice(k, 1);
    if (fills.length === 0) fillsOfLine.delete(l);
  }
}

/** The live linefills that use `line`, in creation order (do not modify). */
export function liveFillsOf(line: Line): readonly Linefill[] {
  return fillsOfLine.get(line) ?? [];
}

function markDeleted<K extends DrawingKind>(kind: K, obj: DrawingTypes[K], explicit: boolean): void {
  Deleted.mark(obj);
  for (const field of COORDINATES[kind]) (obj as unknown as Record<string, unknown>)[field as string] = NaN;
  if (kind === 'line' && explicit) {
    const fills = fillsOfLine.get(obj as Line);
    if (fills) for (const fill of [...fills]) remove('linefill', fill);
  }
}

/** Objects above the maximum that the rule allows for, besides the 5: `P` of the module notes. */
function allowance(kind: DrawingKind): number {
  if (kind === 'polyline') return pending.polyline;
  return lastBar && isAllowanceKind(kind) ? lastBar.allowance[kind] : 0;
}

/**
 * The maximum count after the creation of `obj`: removes the objects to delete from `list` (the oldest first; the new
 * object and an object held by a `var` variable are skipped and still count) and returns them.
 */
function cutOldest<K extends DrawingKind>(
  kind: K,
  list: LiveList<DrawingTypes[K]>,
  obj: DrawingTypes[K],
  only?: (old: object) => boolean
): Array<DrawingTypes[K]> {
  if (kind === 'table') return []; // tables have no maximum count
  const max = limits[kind === 'linefill' ? 'line' : (kind as keyof DrawingLimits)] + allowance(kind);
  if (list.length <= max + SLACK) return [];
  let excess = list.length - max;
  const fill = kind === 'linefill';
  // positions of the objects to delete. The oldest first; the objects a `var` variable got (or released) on this bar
  // only when the others are not enough (the two passes pick different objects)
  const gone: number[] = [];
  for (let pass = 0; pass < (fill ? 1 : 2); pass++) {
    const before = gone.length;
    for (let k = 0; k < list.length && excess > 0; k++) {
      const old = list.at(k);
      if (old === obj || (only && !only(old))) continue;
      if (fill ? fillProtected(old) : heldBefore(old) || heldOnThisBar(old) !== (pass === 1)) continue;
      excess--;
      gone.push(k);
    }
    if (before > 0 && gone.length > before) gone.sort((a, b) => a - b);
  }
  const cut = gone.map((k) => list.at(k));
  // the others keep their order; usually the cut is the oldest run of objects, which leaves by moving the head
  list.removeAll(gone);
  // linefills: still above the maximum + 5, the oldest go, the held ones too
  if (fill && list.length > max + SLACK) cut.push(...list.takeFront(list.length - max));
  return cut;
}

/** Kinds of the objects created since the last reset (a table counts too), in no order. */
const created = new Set<DrawingKind>();

/** The kinds of drawing objects created since the last {@link resetDrawings}, even when none is alive any more. */
export function createdDrawingKinds(): DrawingKind[] {
  return [...created];
}

/** Records a new object and deletes the oldest objects of its kind when the count is too high. */
export function register<K extends DrawingKind>(kind: K, obj: DrawingTypes[K]): DrawingTypes[K] {
  if (runHooks) {
    runHooks.access();
    const old = runHooks.reuse(kind, obj);
    if (old && old !== obj) {
      // the same object as in the previous run, with the fields of the new one
      for (const key of Object.keys(old)) if (!(key in obj)) delete (old as Record<string, unknown>)[key];
      Object.assign(old, obj);
      Deleted.unmark(old);
      obj = old as DrawingTypes[K];
    }
  }
  registered.add(obj);
  const list = live[kind];
  created.add(kind);
  if (lastBar && isCounted(kind)) return registerLast(lastBar, kind, obj);
  if (isCounted(kind) && pending[kind] >= PENDING_RESET[kind]) pending[kind] = 0;
  list.push(obj);
  if (kind === 'linefill') trackFill(obj as Linefill);
  const cut = cutOldest(kind, list, obj);
  if (kind === 'polyline') pending.polyline += cut.length;
  for (const old of cut) {
    if (kind === 'linefill') untrackFill(old as Linefill);
    markDeleted(kind, old, false);
  }
  return obj;
}

/** An object created on the last bar (see the module notes). */
function registerLast<K extends DrawingKind>(bar: LastBar, kind: K, obj: DrawingTypes[K]): DrawingTypes[K] {
  if (kind === 'polyline' && !bar.polyline) {
    bar.polyline = true;
    if (pending.polyline >= PENDING_RESET.polyline) pending.polyline = 0;
    else pending.polyline += bar.carried; // counted twice
  }
  const list = live[kind];
  list.push(obj);
  const isOld = (old: object): boolean => bar.old.has(old);
  let oldCandidate = false;
  for (let k = 0; k < list.length && !oldCandidate; k++) {
    const old = list.at(k);
    oldCandidate = old !== obj && isOld(old) && !heldBefore(old) && !heldOnThisBar(old);
  }
  if (oldCandidate) {
    // the objects of the bars before only; a line takes its linefills with it
    const cut = cutOldest(kind, list, obj, isOld);
    if (kind === 'polyline') {
      pending.polyline += cut.length;
      bar.oldPolylinesGone += cut.length;
    }
    for (const old of cut) markDeleted(kind, old, true);
  } else {
    // the polylines of the bars before deleted on this bar count before the cut (#176)
    if (kind === 'polyline' && pending.polyline < bar.oldPolylinesGone) pending.polyline = bar.oldPolylinesGone;
    const cut = cutOldest(kind, list, obj);
    if (kind === 'polyline' && cut.length > 0) pending.polyline = bar.oldPolylinesGone;
    for (const old of cut) markDeleted(kind, old, false);
  }
  return obj;
}

/** Deletes an object (no effect when it is already deleted). */
export function remove<K extends DrawingKind>(kind: K, obj: DrawingTypes[K]): void {
  runHooks?.access();
  const list = live[kind];
  // from the end: an object is in the list once, and scripts mostly delete their newest objects
  const index = list.lastIndexOf(obj);
  if (index !== -1) {
    list.removeAt(index);
    if (kind === 'linefill') untrackFill(obj as Linefill);
    if (isCounted(kind)) pending[kind]++;
    if (kind === 'polyline' && lastBar?.old.has(obj)) lastBar.oldPolylinesGone++;
  }
  if (!Deleted.has(obj)) markDeleted(kind, obj, true);
}

/** True when the object was deleted (by `delete` or by the maximum count). */
export function isDeleted(obj: unknown): boolean {
  // the setters and getters of the drawing objects start here
  runHooks?.access();
  return typeof obj === 'object' && obj !== null && Deleted.has(obj);
}

/** The live objects of a kind, in creation order (a new array). */
export function all<K extends DrawingKind>(kind: K): Array<DrawingTypes[K]> {
  runHooks?.access();
  return live[kind].toArray() as Array<DrawingTypes[K]>;
}

/** Forgets all objects (without deleting them) and sets the maximum counts (default 50). */
export function resetDrawings(newLimits: DrawingLimits = {}): void {
  for (const kind of Object.keys(live) as DrawingKind[]) live[kind].replace([]);
  fillsOfLine = new Map();
  created.clear();
  holds = { others: new WeakMap(), records: 0, variables: [] };
  pending = { line: 0, label: 0, box: 0, polyline: 0 };
  currentBar = null;
  lastBarIndex = null;
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

/** The registry state of a run, saved around a nested run (see {@link restoreDrawingState}). */
export interface DrawingState {
  live: { [K in DrawingKind]: Array<DrawingTypes[K]> };
  created: DrawingKind[];
  holds: Holds;
  pending: Record<CountedKind, number>;
  currentBar: number | null;
  lastBarIndex: number | null;
  lastBar: LastBar | null;
  limits: Required<DrawingLimits>;
}

/** Saves the registry of the current run before a nested run (an intrabar run of a strategy). */
export function saveDrawingState(): DrawingState {
  return {
    live: {
      line: live.line.toArray(),
      label: live.label.toArray(),
      box: live.box.toArray(),
      polyline: live.polyline.toArray(),
      linefill: live.linefill.toArray(),
      table: live.table.toArray(),
    },
    created: [...created],
    holds,
    pending: { ...pending },
    currentBar,
    lastBarIndex,
    lastBar,
    limits: { ...limits },
  };
}

/**
 * The registry and the state of its objects at the end of a bar (see {@link saveDrawingCheckpoint}): the live objects,
 * the fields of each one (arrays, maps and plain objects copied; other drawing objects kept as references), their `var`
 * records, the objects of the {@link varDrawing} variables, and the counters. Its fields are internal.
 */
export interface DrawingCheckpoint {
  state: DrawingState;
  fields: Map<object, Record<string, unknown>>;
  records: Map<object, { count: number; heldAt: number | undefined; releasedAt: number | undefined } | null>;
  /** The object of each variable of the run, in the order they were made */
  variables: Array<object | undefined>;
}

/** A copy of a field value of a drawing object: plain data copied, drawing objects (and other instances) shared. */
function copyField(v: unknown): unknown {
  if (v === null || typeof v !== 'object' || registered.has(v)) return v;
  if (Array.isArray(v)) return v.map(copyField);
  if (v instanceof Map) return new Map([...v].map(([k, x]) => [k, copyField(x)]));
  if (v instanceof Set) return new Set([...v].map(copyField));
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) out[k] = copyField(x);
  return out;
}

function copyFields(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = copyField(v);
  return out;
}

/**
 * The drawings at the end of a bar, for a live update of a study with its own bar loop: save it at the end of the last
 * confirmed bar, and put it back with {@link restoreDrawingCheckpoint} before the forming bar is calculated again. The
 * drawings then are those of a full run on the same bars: the objects created, changed or deleted on the forming bar
 * are undone, the objects keep their identity and creation order, and the maximum counts, the `var` holds (also of
 * {@link varDrawing} variables), the linefills and the rules of the last bar ({@link setDrawingBar}) go on as in a full
 * run. The incremental script runs use it too (#196, #203).
 *
 * The checkpoint holds the whole registry of the study: other studies on the same chart may reset and use the registry
 * between two updates, putting it back makes it the study's again (call it where a full run calls
 * {@link resetDrawings}). The study keeps its own variables (the objects it refers to, its arrays of objects) with the
 * checkpoint and puts them back as plain values.
 *
 * @example
 * ```typescript
 * // full run: resetDrawings({ line: 500 }) ... for each bar i: setDrawingBar(i, i === n - 1); draw(i);
 * //           and after the bar n - 2: checkpoint = saveDrawingCheckpoint()
 * // live update of the forming bar n - 1 (or new bars after it):
 * restoreDrawingCheckpoint(checkpoint);
 * for (let i = n - 1; i < bars.length; i++) {
 *   setDrawingBar(i, i === bars.length - 1);
 *   draw(i);
 *   if (i === bars.length - 2) checkpoint = saveDrawingCheckpoint();
 * }
 * setDrawingBar(null);
 * ```
 */
export function saveDrawingCheckpoint(): DrawingCheckpoint {
  const state = saveDrawingState();
  // the state of the last bar changes during the bar: a checkpoint taken on it keeps a copy
  if (state.lastBar) state.lastBar = copyLastBar(state.lastBar);
  const fields = new Map<object, Record<string, unknown>>();
  const records: DrawingCheckpoint['records'] = new Map();
  for (const kind of Object.keys(state.live) as DrawingKind[]) {
    for (const obj of state.live[kind] as object[]) {
      fields.set(obj, copyFields(obj));
      const r = Held.get(obj);
      records.set(obj, r ? { count: r.count, heldAt: r.heldAt, releasedAt: r.releasedAt } : null);
    }
  }
  return { state, fields, records, variables: holds.variables.map((v) => v.current) };
}

function copyLastBar(bar: LastBar): LastBar {
  return { ...bar, old: new Set(bar.old), allowance: { ...bar.allowance } };
}

/**
 * Puts back a {@link saveDrawingCheckpoint}: the registry becomes the one of the checkpoint, the objects alive then get
 * their fields and `var` records back, the variables their objects. It can be put back again later (on each update of
 * the forming bar).
 */
export function restoreDrawingCheckpoint(cp: DrawingCheckpoint): void {
  restoreDrawingState(cp.state);
  if (cp.state.lastBar) lastBar = copyLastBar(cp.state.lastBar);
  for (const [obj, saved] of cp.fields) {
    for (const key of Object.keys(obj)) if (!(key in saved)) delete (obj as Record<string, unknown>)[key];
    Object.assign(obj, copyFields(saved));
    Deleted.unmark(obj);
  }
  for (const [obj, saved] of cp.records) {
    const r = Held.get(obj);
    if (saved) {
      const record = r ?? Held.create(obj);
      record.count = saved.count;
      record.heldAt = saved.heldAt;
      record.releasedAt = saved.releasedAt;
    } else if (r) {
      r.count = 0;
      r.heldAt = undefined;
      r.releasedAt = undefined;
    }
  }
  // the variables made after the checkpoint belong to the calculation being undone
  holds.variables.length = cp.variables.length;
  cp.variables.forEach((obj, k) => {
    holds.variables[k]!.current = obj;
  });
}

/** Puts back the registry saved by {@link saveDrawingState} after the nested run. */
export function restoreDrawingState(s: DrawingState): void {
  for (const kind of Object.keys(live) as DrawingKind[]) (live[kind] as LiveList<object>).replace(s.live[kind]);
  fillsOfLine = new Map();
  for (const fill of s.live.linefill) trackFill(fill);
  created.clear();
  for (const kind of s.created) created.add(kind);
  holds = s.holds;
  pending = { ...s.pending };
  currentBar = s.currentBar;
  lastBarIndex = s.lastBarIndex;
  lastBar = s.lastBar;
  limits = { ...s.limits };
}
