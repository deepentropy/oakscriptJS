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
    for (const old of list.splice(0, list.length - max)) markDeleted(kind, old, false);
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
