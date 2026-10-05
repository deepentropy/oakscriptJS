/**
 * Array namespace
 * Mirrors PineScript's array.* functions
 */

import type { PineArray, int, float, bool, simple_int, color, Line, Box, Label, Linefill, Table } from '../types/index.js';

/**
 * Creates a new array with initial size and default value
 */
export function new_array<T>(size: simple_int = 0, initial_value?: T): PineArray<T> {
  const arr: PineArray<T> = [];
  for (let i = 0; i < size; i++) {
    arr.push(initial_value as T);
  }
  return arr;
}

/**
 * Returns the number of elements in an array
 */
export function size<T>(id: PineArray<T>): int {
  return id.length;
}

/** True for a PineScript `na` element: NaN, null or undefined. */
function isNa(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'number' && Number.isNaN(v));
}

/** The `na` of the array's element type: NaN for a numeric (or empty) array, undefined otherwise. */
function naOf<T>(id: PineArray<T>): T {
  return (id.length === 0 || typeof id[0] === 'number' ? NaN : undefined) as T;
}

/**
 * Position addressed by a PineScript index: truncated, a negative index counts from the end. An index outside
 * `-size .. size - 1 + extra` is a runtime error.
 */
function position(name: string, id: PineArray<unknown>, index: number, extra = 0): number {
  const i = Math.trunc(index);
  const n = id.length;
  if (i < -n || i >= n + extra) {
    throw new Error(`array.${name}: index ${i} is out of bounds, array size is ${n}`);
  }
  return i < 0 ? i + n : i;
}

/**
 * Returns the element at the specified index.
 *
 * PineScript rules: a negative index counts from the end (`get(a, -1)` is the last element); an index outside
 * `-size .. size - 1` is a runtime error (throws); an `na` index gives `na`.
 */
export function get<T>(id: PineArray<T>, index: simple_int): T {
  if (Number.isNaN(index)) return naOf(id);
  return id[position('get', id, index)]!;
}

/**
 * Sets the value of the element at the specified index.
 *
 * PineScript rules: a negative index counts from the end; an index outside `-size .. size - 1` is a runtime error
 * (throws); an `na` index does nothing.
 */
export function set<T>(id: PineArray<T>, index: simple_int, value: T): void {
  if (Number.isNaN(index)) return;
  id[position('set', id, index)] = value;
}

/**
 * Appends a value to the end of the array
 */
export function push<T>(id: PineArray<T>, value: T): void {
  id.push(value);
}

/**
 * Removes and returns the last element of the array
 */
export function pop<T>(id: PineArray<T>): T {
  return id.pop() as T;
}

/**
 * Inserts a value at the beginning of the array
 */
export function unshift<T>(id: PineArray<T>, value: T): void {
  id.unshift(value);
}

/**
 * Removes and returns the first element of the array
 */
export function shift<T>(id: PineArray<T>): T {
  return id.shift() as T;
}

/**
 * Removes all elements from the array
 */
export function clear<T>(id: PineArray<T>): void {
  id.length = 0;
}

/**
 * Inserts a value at the specified index.
 *
 * PineScript rules: a negative index counts from the end and `size` appends, so `-size .. size` is valid; any other
 * index is a runtime error (throws); an `na` index appends.
 */
export function insert<T>(id: PineArray<T>, index: simple_int, value: T): void {
  if (Number.isNaN(index)) {
    id.push(value);
    return;
  }
  id.splice(position('insert', id, index, 1), 0, value);
}

/**
 * Removes the element at the specified index and returns it.
 *
 * PineScript rules: a negative index counts from the end; an index outside `-size .. size - 1` is a runtime error
 * (throws); an `na` index removes nothing and gives `na`.
 */
export function remove<T>(id: PineArray<T>, index: simple_int): T {
  if (Number.isNaN(index)) return naOf(id);
  return id.splice(position('remove', id, index), 1)[0]!;
}

/** PineScript `==` of two elements: numbers are equal when |a - b| <= 1e-10; `na` never equals anything. */
function pineEqual(a: unknown, b: unknown): boolean {
  if (isNa(a) || isNa(b)) return false;
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') {
    const d = a - b;
    return -1e-10 <= d && d <= 1e-10;
  }
  return false;
}

/**
 * Returns true if the array contains the value.
 *
 * PineScript rules: numbers are compared with a 1e-10 tolerance (|a - b| <= 1e-10); `na` is never found.
 */
export function includes<T>(id: PineArray<T>, value: T): bool {
  return indexof(id, value) >= 0;
}

/**
 * Returns the index of the first occurrence of the value, -1 when not found.
 *
 * PineScript rules: numbers are compared with a 1e-10 tolerance (|a - b| <= 1e-10); `na` is never found.
 */
export function indexof<T>(id: PineArray<T>, value: T): int {
  for (let i = 0; i < id.length; i++) {
    if (pineEqual(id[i], value)) return i;
  }
  return -1;
}

/**
 * Returns the index of the last occurrence of the value, -1 when not found.
 *
 * PineScript rules: numbers are compared with a 1e-10 tolerance (|a - b| <= 1e-10); `na` is never found.
 */
export function lastindexof<T>(id: PineArray<T>, value: T): int {
  for (let i = id.length - 1; i >= 0; i--) {
    if (pineEqual(id[i], value)) return i;
  }
  return -1;
}

/**
 * Returns a shallow copy of the array
 */
export function copy<T>(id: PineArray<T>): PineArray<T> {
  return [...id] as PineArray<T>;
}

/**
 * Appends the elements of `id2` to `id1` and returns `id1` (PineScript `array.concat` changes `id1`).
 */
export function concat<T>(id1: PineArray<T>, id2: PineArray<T>): PineArray<T> {
  for (const v of Array.from(id2)) id1.push(v);
  return id1;
}

/**
 * Joins all elements into a string
 */
export function join(id: PineArray<any>, separator: string = ','): string {
  return id.join(separator);
}

/**
 * Reverses the array in place
 */
export function reverse<T>(id: PineArray<T>): void {
  id.reverse();
}

/**
 * Returns the elements from `index_from` (included) to `index_to` (excluded, default: the size) as a live view of
 * the array (PineScript `array.slice`).
 *
 * PineScript rules:
 * - the slice shares the elements of the original array: a change of an element of the slice changes the original
 *   array, and adding / removing elements of the slice adds / removes them in the original array, inside the slice
 *   bounds (a push to the slice inserts at the end of the slice)
 * - `index_from` must address an element (`0 .. size - 1`) and `index_to` may be `size`; other bounds, or
 *   `index_from > index_to`, are a runtime error (throws); an `na` bound means the start / the end of the array
 */
export function slice<T>(id: PineArray<T>, index_from: simple_int, index_to?: simple_int): PineArray<T> {
  const n = id.length;
  const start = Number.isNaN(index_from) ? 0 : Math.trunc(index_from);
  const stop = index_to === undefined || Number.isNaN(index_to) ? n : Math.trunc(index_to);
  if (start < 0 || start >= n) throw new Error(`array.slice: index ${start} is out of bounds, array size is ${n}`);
  if (stop < 0 || stop > n) throw new Error(`array.slice: index ${stop} is out of bounds, array size is ${n}`);
  if (start > stop) throw new Error(`array.slice: index_from ${start} is greater than index_to ${stop}`);
  return sliceView(id, start, stop - start);
}

/** Index of a property key that is an array index, -1 otherwise. */
function indexKey(p: string | symbol): number {
  if (typeof p !== 'string') return -1;
  const i = Number(p);
  return Number.isInteger(i) && i >= 0 && String(i) === p ? i : -1;
}

/**
 * Live view of `size` elements of `parent` from `start`: an array (a Proxy) whose element reads and writes go to
 * `parent`, and whose size changes insert / remove elements in `parent` at the end of the view.
 */
function sliceView<T>(parent: PineArray<T>, start: number, size: number): PineArray<T> {
  const resize = (target: number): void => {
    if (target > size) parent.splice(start + size, 0, ...Array<T>(target - size).fill(undefined as T));
    else if (target < size) parent.splice(start + target, size - target);
    size = target;
  };
  return new Proxy<T[]>([], {
    get(target, p, receiver) {
      const i = indexKey(p);
      if (i >= 0) return i < size ? parent[start + i] : undefined;
      if (p === 'length') return size;
      return Reflect.get(target, p, receiver);
    },
    set(target, p, value, receiver) {
      const i = indexKey(p);
      if (i >= 0) {
        if (i >= size) resize(i + 1);
        parent[start + i] = value;
        return true;
      }
      if (p === 'length') {
        resize(Number(value));
        return true;
      }
      return Reflect.set(target, p, value, receiver);
    },
    has(target, p) {
      const i = indexKey(p);
      return i >= 0 ? i < size : Reflect.has(target, p);
    },
    // Array methods delete the slots past the new end before they set the length, which does the removal.
    deleteProperty(target, p) {
      return indexKey(p) >= 0 ? true : Reflect.deleteProperty(target, p);
    },
    ownKeys(target) {
      return [...Array.from({ length: size }, (_, i) => String(i)), ...Reflect.ownKeys(target)];
    },
    getOwnPropertyDescriptor(target, p) {
      const i = indexKey(p);
      if (i >= 0) {
        return i < size ? { value: parent[start + i], writable: true, enumerable: true, configurable: true } : undefined;
      }
      if (p === 'length') return { value: size, writable: true, enumerable: false, configurable: false };
      return Reflect.getOwnPropertyDescriptor(target, p);
    },
  });
}

/** Sort order of array.sort / array.sort_indices (PineScript `order.ascending` / `order.descending`). */
export type SortOrder = 'asc' | 'desc' | 'ascending' | 'descending';

/**
 * Positions of the elements in PineScript sorted order: ascending values, `na` after the numbers (before the
 * strings of a string array), stable; descending is the ascending result reversed.
 */
function sortedPositions<T>(id: PineArray<T>, order: SortOrder): number[] {
  const values: number[] = [];
  const nas: number[] = [];
  for (let i = 0; i < id.length; i++) (isNa(id[i]) ? nas : values).push(i);
  values.sort((a, b) => {
    const x = id[a] as unknown as number;
    const y = id[b] as unknown as number;
    return x < y ? -1 : x > y ? 1 : 0;
  });
  const naFirst = values.length > 0 && typeof id[values[0]!] === 'string';
  const positions = naFirst ? [...nas, ...values] : [...values, ...nas];
  if (order === 'desc' || order === 'descending') positions.reverse();
  return positions;
}

/**
 * Sorts the array in place.
 *
 * PineScript rules: `na` goes after the numbers in ascending order and before them in descending order (the
 * ascending result reversed); in a string array `na` goes first in ascending order.
 */
export function sort<T>(id: PineArray<T>, order: SortOrder = 'asc'): void {
  const sorted = sortedPositions(id, order).map((p) => id[p]!);
  for (let i = 0; i < sorted.length; i++) id[i] = sorted[i]!;
}

/**
 * Sum of the non-na elements (PineScript `array.sum(id)`), added from left to right; an array without values gives NaN.
 * As PineScript, the running sum is set to 0 after a step when its absolute value is <= 1e-10.
 */
export function sum(id: PineArray<float>): float {
  let total = 0;
  let count = 0;
  for (const v of id) {
    if (Number.isNaN(v)) continue;
    count++;
    total += v;
    if (Math.abs(total) <= 1e-10) total = 0;
  }
  return count ? total : NaN;
}

/**
 * Average of the non-na elements (PineScript `array.avg(id)`); an array without values gives NaN.
 */
export function avg(id: PineArray<float>): float {
  const values = id.filter((v) => !Number.isNaN(v));
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN;
}

/** The `nth` value of the non-na elements sorted with `compare` (array.min / array.max). */
function nthValue(name: string, id: PineArray<float>, nth: number, compare: (a: number, b: number) => number): float {
  const rank = Number.isNaN(nth) ? 0 : Math.trunc(nth);
  const values = id.filter((v) => !Number.isNaN(v));
  if (!values.length) return NaN;
  if (rank < 0 || rank >= id.length) {
    throw new Error(`array.${name}: nth ${rank} is out of bounds, array size is ${id.length}`);
  }
  values.sort(compare);
  return values[Math.min(rank, values.length - 1)]!;
}

/**
 * The `nth` smallest value (0 = the smallest) of the non-na elements (PineScript `array.min(id, nth)`).
 *
 * PineScript rules: an `nth` past the non-na values but inside the array size gives the greatest value; an `nth`
 * outside `0 .. size - 1` is a runtime error (throws); an `na` nth counts as 0; an array without values gives NaN.
 */
export function min(id: PineArray<float>, nth: simple_int = 0): float {
  return nthValue('min', id, nth, (a, b) => a - b);
}

/**
 * The `nth` greatest value (0 = the greatest) of the non-na elements (PineScript `array.max(id, nth)`).
 *
 * PineScript rules: an `nth` past the non-na values but inside the array size gives the smallest value; an `nth`
 * outside `0 .. size - 1` is a runtime error (throws); an `na` nth counts as 0; an array without values gives NaN.
 */
export function max(id: PineArray<float>, nth: simple_int = 0): float {
  return nthValue('max', id, nth, (a, b) => b - a);
}

/**
 * Median of the non-na elements (PineScript `array.median(id)`): the middle value, or the mean of the two middle
 * values for an even count; an array without values gives NaN.
 */
export function median(id: PineArray<float>): float {
  const sorted = id.filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
  if (!sorted.length) return NaN;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/**
 * Most frequent non-na element (PineScript `array.mode(id)`), compared exactly.
 *
 * PineScript rules: with several values of the same frequency, the smallest one; an array without values gives NaN.
 */
export function mode(id: PineArray<float>): float {
  const frequency = new Map<float, int>();
  for (const v of id) {
    if (!Number.isNaN(v)) frequency.set(v, (frequency.get(v) ?? 0) + 1);
  }
  let best = NaN;
  let bestCount = 0;
  for (const [v, count] of frequency) {
    if (count > bestCount || (count === bestCount && v < best)) {
      best = v;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Standard deviation of the non-na elements (PineScript `array.stdev(id, biased)`): the square root of
 * `array.variance(id, biased)`.
 */
export function stdev(id: PineArray<float>, biased: bool = true): float {
  return Math.sqrt(variance(id, biased));
}

/** Sum of the values and sum of their squares, both added from the first to the last value. */
function moments(values: number[]): [number, number] {
  let p = 0;
  let q = 0;
  for (const v of values) p += v;
  for (const v of values) q += v * v;
  return [p, q];
}

/**
 * Variance of the non-na elements (PineScript `array.variance(id, biased)`).
 *
 * PineScript rule (moment form): with `p` the sum of the values, `q` the sum of their squares, `n` the count and
 * `m = p / n`: biased (default) `max(0, q / n - m * m)`, unbiased `max(0, q / (n - 1) - (p / (n - 1)) * m)`.
 * One value gives 0 biased and NaN unbiased; an array without values gives NaN.
 */
export function variance(id: PineArray<float>, biased: bool = true): float {
  const values = id.filter((v) => !Number.isNaN(v));
  const n = values.length;
  if (!n) return NaN;
  if (n < 2) return biased ? 0 : NaN;
  const [p, q] = moments(values);
  const mean = p / n;
  return biased ? Math.max(0, q / n - mean * mean) : Math.max(0, q / (n - 1) - (p / (n - 1)) * mean);
}

/**
 * Fills the array with the specified value
 */
export function fill<T>(id: PineArray<T>, value: T, index_from: simple_int = 0, index_to?: simple_int): void {
  // PineScript: an na bound is the start / the end; a bound past the end is a runtime error
  const start = index_from === undefined || index_from === null || Number.isNaN(index_from) ? 0 : index_from;
  const end = index_to === undefined || index_to === null || Number.isNaN(index_to) ? id.length : index_to;
  for (const i of [start, end]) {
    if (i < 0 || i > id.length) throw new Error(`array.fill: index ${i} is out of bounds, array size is ${id.length}`);
  }
  for (let i = start; i < end; i++) {
    id[i] = value;
  }
}

/**
 * Creates an array from its arguments (PineScript `array.from(arg0, arg1, ...)`).
 * `na` values are kept.
 *
 * @example
 * ```typescript
 * array.from(0.236, 0.382, 0.5, 0.618); // [0.236, 0.382, 0.5, 0.618]
 * ```
 */
export function from<T>(...values: T[]): PineArray<T> {
  return [...values];
}

/**
 * Returns the first element of the array
 *
 * @param id - The array
 * @returns The first element, or undefined if array is empty
 *
 * @remarks
 * - Equivalent to `array.get(id, 0)`
 * - Returns undefined for empty arrays
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, 4, 5];
 * const firstElement = array.first(arr); // Returns: 1
 * ```
 */
export function first<T>(id: PineArray<T>): T {
  // PineScript: a runtime error on an empty array
  if (id.length === 0) throw new Error('Cannot call array.first() if array is empty');
  return id[0]!;
}

/**
 * Returns the last element of the array
 *
 * @param id - The array
 * @returns The last element, or undefined if array is empty
 *
 * @remarks
 * - Equivalent to `array.get(id, array.size(id) - 1)`
 * - Returns undefined for empty arrays
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, 4, 5];
 * const lastElement = array.last(arr); // Returns: 5
 * ```
 */
export function last<T>(id: PineArray<T>): T {
  // PineScript: a runtime error on an empty array (as array.first)
  if (id.length === 0) throw new Error('Cannot call array.last() if array is empty');
  return id[id.length - 1]!;
}

/**
 * True when at least one element of a bool array is true (PineScript `array.some(id)`).
 * An empty array gives false.
 */
export function some(id: PineArray<bool>): bool {
  return id.some((v) => v === true);
}

/**
 * True when every element of a bool array is true (PineScript `array.every(id)`).
 * An empty array gives false, as in PineScript.
 */
export function every(id: PineArray<bool>): bool {
  return id.length > 0 && id.every((v) => v === true);
}

/**
 * Create new boolean array
 *
 * Creates a new array object of bool type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: false)
 * @returns New boolean array
 *
 * @example
 * ```typescript
 * const arr = array.new_bool(5, true);
 * // Creates: [true, true, true, true, true]
 * ```
 */
export function new_bool(size: simple_int = 0, initial_value: bool = false): PineArray<bool> {
  return new_array<bool>(size, initial_value);
}

/**
 * Create new float array
 *
 * Creates a new array object of float type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: NaN)
 * @returns New float array
 *
 * @example
 * ```typescript
 * const arr = array.new_float(5, 0.0);
 * // Creates: [0.0, 0.0, 0.0, 0.0, 0.0]
 * ```
 */
export function new_float(size: simple_int = 0, initial_value: float = NaN): PineArray<float> {
  return new_array<float>(size, initial_value);
}

/**
 * Create new integer array
 *
 * Creates a new array object of int type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: NaN)
 * @returns New integer array
 *
 * @example
 * ```typescript
 * const arr = array.new_int(5, 0);
 * // Creates: [0, 0, 0, 0, 0]
 * ```
 */
export function new_int(size: simple_int = 0, initial_value: int = NaN): PineArray<int> {
  return new_array<int>(size, initial_value);
}

/**
 * Create new string array
 *
 * Creates a new array object of string type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: undefined)
 * @returns New string array
 *
 * @example
 * ```typescript
 * const arr = array.new_string(5, "text");
 * // Creates: ["text", "text", "text", "text", "text"]
 * ```
 */
export function new_string(size: simple_int = 0, initial_value?: string): PineArray<string> {
  return new_array<string>(size, initial_value);
}

/**
 * Create new color array
 *
 * Creates a new array object of color type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: undefined)
 * @returns New color array
 *
 * @example
 * ```typescript
 * const arr = array.new_color(5, "#FF0000");
 * // Creates: ["#FF0000", "#FF0000", "#FF0000", "#FF0000", "#FF0000"]
 * ```
 */
export function new_color(size: simple_int = 0, initial_value?: color): PineArray<color> {
  return new_array<color>(size, initial_value);
}

/**
 * Create new line array
 *
 * Creates a new array object of line type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: undefined)
 * @returns New line array
 *
 * @example
 * ```typescript
 * import { array, line } from 'oakscriptjs';
 *
 * // Create array to store last 15 lines
 * const lines = array.new_line();
 * const trendLine = line.new(0, 100, 50, 150);
 * array.push(lines, trendLine);
 *
 * // Manage line count
 * if (array.size(lines) > 15) {
 *   const oldLine = array.shift(lines);
 * }
 * ```
 *
 * @remarks
 * Useful for managing collections of trend lines, support/resistance levels, or channel lines.
 * In PineScript, this is typically used with line.delete() to manage chart object limits.
 */
export function new_line(size: simple_int = 0, initial_value?: Line): PineArray<Line> {
  return new_array<Line>(size, initial_value);
}

/**
 * Create new box array
 *
 * Creates a new array object of box type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: undefined)
 * @returns New box array
 *
 * @example
 * ```typescript
 * import { array, box } from 'oakscriptjs';
 *
 * // Create array to store gap boxes
 * const gaps = array.new_box();
 * const gapBox = box.new(10, 120, 15, 110);
 * array.push(gaps, gapBox);
 *
 * // Track multiple gaps
 * for (let i = 0; i < array.size(gaps); i++) {
 *   const gap = array.get(gaps, i);
 *   const gapTop = box.get_top(gap);
 *   const gapBottom = box.get_bottom(gap);
 *   // Check if gap filled...
 * }
 * ```
 *
 * @remarks
 * Useful for tracking ranges, gaps, consolidation zones, or rectangle patterns.
 * Enables systematic analysis of multiple box objects.
 */
export function new_box(size: simple_int = 0, initial_value?: Box): PineArray<Box> {
  return new_array<Box>(size, initial_value);
}

/**
 * Create new label array
 *
 * Creates a new array object of label type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: undefined)
 * @returns New label array
 *
 * @example
 * ```typescript
 * import { array, label } from 'oakscriptjs';
 *
 * // Create array to store pivot labels
 * const pivotLabels = array.new_label();
 *
 * // Add labels for pivot highs
 * const pivotLabel = label.new(50, 155.5, 'PH', 'bar_index', 'abovebar');
 * array.push(pivotLabels, pivotLabel);
 *
 * // Limit number of labels shown
 * const maxLabels = 50;
 * if (array.size(pivotLabels) > maxLabels) {
 *   array.shift(pivotLabels);
 * }
 * ```
 *
 * @remarks
 * Useful for managing collections of annotations, pivot markers, or signal labels.
 * Helps limit the number of labels displayed by removing old ones.
 */
export function new_label(size: simple_int = 0, initial_value?: Label): PineArray<Label> {
  return new_array<Label>(size, initial_value);
}

/**
 * Create new linefill array
 *
 * Creates a new array object of linefill type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: undefined)
 * @returns New linefill array
 *
 * @example
 * ```typescript
 * import { array, line, linefill } from 'oakscriptjs';
 *
 * // Create array to store channel fills
 * const channels = array.new_linefill();
 *
 * // Create channel
 * const upperLine = line.new(0, 120, 50, 130);
 * const lowerLine = line.new(0, 100, 50, 110);
 * const channelFill = linefill.new(upperLine, lowerLine, '#0000FF15');
 *
 * array.push(channels, channelFill);
 * ```
 *
 * @remarks
 * Useful for managing collections of channel fills, Bollinger Band fills, or regression channel fills.
 * Enables dynamic color changes across multiple channels.
 */
export function new_linefill(size: simple_int = 0, initial_value?: Linefill): PineArray<Linefill> {
  return new_array<Linefill>(size, initial_value);
}

/**
 * Creates a new array of tables (PineScript `array.new_table`).
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements (default: undefined)
 * @returns New table array
 */
export function new_table(size: simple_int = 0, initial_value?: Table): PineArray<Table> {
  return new_array<Table>(size, initial_value);
}

/**
 * Absolute value of array elements
 *
 * Returns an array containing the absolute value of each element in the original array.
 *
 * @param id - Array of numeric values
 * @returns New array with absolute values
 *
 * @example
 * ```typescript
 * const arr = [-1, -2, 3, -4, 5];
 * const result = array.abs(arr);
 * // Returns: [1, 2, 3, 4, 5]
 * ```
 */
export function abs(id: PineArray<float>): PineArray<float> {
  return id.map(x => Math.abs(x)) as PineArray<float>;
}

/**
 * Range of array values
 *
 * Returns the difference between the maximum and minimum values in the array.
 *
 * @param id - Array of numeric values
 * @returns Difference between max and min (range)
 *
 * @example
 * ```typescript
 * const arr = [1, 5, 3, 9, 2];
 * const result = array.range(arr);
 * // Returns: 8 (9 - 1)
 * ```
 *
 * @remarks
 * Returns NaN if the array is empty.
 */
export function range(id: PineArray<float>): float {
  if (id.length === 0) {
    return NaN;
  }
  return max(id) - min(id);
}

/**
 * Binary Search
 *
 * Searches for a value in a sorted array using binary search algorithm.
 * Returns the index of the value if found, or -1 if not found.
 *
 * @param id - Sorted array (ascending order)
 * @param val - Value to search for
 * @returns Index of the value, or -1 if not found
 *
 * @example
 * ```typescript
 * const arr = [-2, 0, 1, 5, 9]; // Must be sorted
 * const index = array.binary_search(arr, 5);
 * // Returns: 3
 * ```
 *
 * @remarks
 * - Array must be sorted in ascending order
 * - Uses standard binary search algorithm
 * - Time complexity: O(log n)
 */
export function binary_search(id: PineArray<float>, val: float): int {
  let left = 0;
  let right = id.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (id[mid]! === val) {
      return mid;
    }

    if (id[mid]! < val) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1; // Not found
}

/**
 * Binary Search Leftmost
 *
 * Returns the index of the value if found. When not found, returns the index
 * of the next smallest element to the left of where the value would be.
 *
 * @param id - Sorted array (ascending order)
 * @param val - Value to search for
 * @returns Index of value or insertion point to the left
 *
 * @example
 * ```typescript
 * const arr = [-2, 0, 1, 5, 9];
 * const index = array.binary_search_leftmost(arr, 3);
 * // Returns: 2 (index of 1, which is left of where 3 would be)
 * ```
 *
 * @example
 * ```typescript
 * const arr = [4, 5, 5, 5];
 * const index = array.binary_search_leftmost(arr, 5);
 * // Returns: 1 (index of first instance of 5)
 * ```
 *
 * @remarks
 * - Array must be sorted in ascending order
 * - For duplicate values, returns leftmost occurrence
 * - When value not found, returns position of next smaller element
 * - PineScript rules: a value below every element gives 0; `na` counts as greater than every number (an array
 *   without na gives `size - 1`); the comparison is exact (no 1e-10 tolerance)
 */
export function binary_search_leftmost(id: PineArray<float>, val: float): int {
  if (id.length === 0) return -1;
  const at = searchBound(id, val, false);
  return at < id.length && compareSorted(id[at]!, val) === 0 ? at : Math.max(0, at - 1);
}

/**
 * Order of the PineScript binary searches: numbers in ascending order, na above every number (equal to na).
 */
function compareSorted(a: float, b: float): number {
  const an = Number.isNaN(a);
  const bn = Number.isNaN(b);
  if (an || bn) return an === bn ? 0 : an ? 1 : -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** First index whose element is >= `val` (`after` false) or > `val` (`after` true); `id.length` when none. */
function searchBound(id: PineArray<float>, val: float, after: boolean): int {
  let lo = 0;
  let hi = id.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const c = compareSorted(id[mid]!, val);
    if (c < 0 || (after && c === 0)) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Binary Search Rightmost
 *
 * Returns the index of the value if found. When not found, returns the index
 * of the element to the right of where the value would be.
 *
 * @param id - Sorted array (ascending order)
 * @param val - Value to search for
 * @returns Index of value or insertion point to the right
 *
 * @example
 * ```typescript
 * const arr = [-2, 0, 1, 5, 9];
 * const index = array.binary_search_rightmost(arr, 3);
 * // Returns: 3 (index of 5, which is right of where 3 would be)
 * ```
 *
 * @example
 * ```typescript
 * const arr = [4, 5, 5, 5];
 * const index = array.binary_search_rightmost(arr, 5);
 * // Returns: 3 (index of last instance of 5)
 * ```
 *
 * @remarks
 * - Array must be sorted in ascending order
 * - For duplicate values, returns rightmost occurrence
 * - When value not found, returns position of next larger element
 * - PineScript rules: a value above every element gives `size` (the position after the last element); `na` counts
 *   as greater than every number (an array without na gives `size`); the comparison is exact (no 1e-10 tolerance)
 */
export function binary_search_rightmost(id: PineArray<float>, val: float): int {
  if (id.length === 0) return -1;
  const at = searchBound(id, val, true);
  return at > 0 && compareSorted(id[at - 1]!, val) === 0 ? at - 1 : at;
}

/**
 * Covariance
 *
 * Returns the covariance between two arrays.
 *
 * @param id1 - First array
 * @param id2 - Second array
 * @param biased - If true, uses biased estimate (population). If false, uses unbiased estimate (sample). Default: true
 * @returns Covariance between the two arrays
 *
 * @example
 * ```typescript
 * const prices = [100, 102, 98, 105, 103];
 * const volume = [1000, 1200, 950, 1300, 1100];
 * const cov = array.covariance(prices, volume);
 * // Returns covariance between price and volume
 * ```
 *
 * @remarks
 * - Biased (true): divides by n (population covariance)
 * - Unbiased (false): divides by n-1 (sample covariance)
 * - Returns NaN if arrays are empty or have different lengths
 * - Formula: Cov(X,Y) = E[(X - μX)(Y - μY)]
 *
 * PineScript rules: a pair where either value is `na` is skipped and the count is the number of pairs kept; both
 * means first, then the sum of the products from the first to the last pair. One pair gives 0 biased, NaN unbiased.
 */
export function covariance(id1: PineArray<float>, id2: PineArray<float>, biased: bool = true): float {
  if (id1.length !== id2.length) {
    return NaN;
  }
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < id1.length; i++) {
    if (Number.isNaN(id1[i]!) || Number.isNaN(id2[i]!)) continue;
    xs.push(id1[i]!);
    ys.push(id2[i]!);
  }
  const n = xs.length;
  if (!n || (!biased && n < 2)) return NaN;
  let mean1 = 0;
  let mean2 = 0;
  for (let i = 0; i < n; i++) {
    mean1 += xs[i]!;
    mean2 += ys[i]!;
  }
  mean1 /= n;
  mean2 /= n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (xs[i]! - mean1) * (ys[i]! - mean2);
  }
  return sum / (biased ? n : n - 1);
}

/**
 * Percentile Linear Interpolation
 *
 * Returns the value for which the specified percentage of array values are
 * less than or equal to it, using linear interpolation.
 *
 * @param id - Array of numeric values
 * @param percentage - Percentage (0-100)
 * @returns Percentile value using linear interpolation
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, 4, 5];
 * const p50 = array.percentile_linear_interpolation(arr, 50);
 * // Returns: 3 (median)
 * ```
 *
 * @remarks
 * - Uses linear interpolation between adjacent values
 * - Result may not be a member of the array
 * - Returns NaN if array is empty
 *
 * PineScript rules:
 * - 1-based position in the sorted array: `size * percentage / 100 + 0.5` (snapped to an integer within 1e-9),
 *   clamped to the first / last value; between two values `lo * (1 - frac) + hi * frac`
 * - `na` values are sorted after all numbers; with an `na` in the array, a position between two values gives `na`
 * - an `na` percentage gives `na`; a percentage outside 0 .. 100 is a runtime error (throws)
 */
export function percentile_linear_interpolation(id: PineArray<float>, percentage: float): float {
  if (id.length === 0 || Number.isNaN(percentage)) {
    return NaN;
  }
  checkPercentage('percentile_linear_interpolation', percentage);
  const s = sortedNaLast(id);
  const n = s.length;
  let pos = (n * percentage) / 100 + 0.5;
  const nearest = Math.round(pos);
  if (Math.abs(pos - nearest) < 1e-9) pos = nearest;
  if (pos <= 1) return s[0]!;
  if (pos >= n) return s[n - 1]!;
  const lower = Math.floor(pos);
  const frac = pos - lower;
  if (frac === 0) return s[lower - 1]!;
  if (Number.isNaN(s[n - 1]!)) return NaN;
  return s[lower - 1]! * (1 - frac) + s[lower]! * frac;
}

/** Array values sorted ascending, `na` values after the numbers (array.percentile_*). */
function sortedNaLast(id: PineArray<float>): number[] {
  const numbers = id.filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
  return [...numbers, ...Array<number>(id.length - numbers.length).fill(NaN)];
}

/** A percentage outside 0 .. 100 is a PineScript runtime error. */
function checkPercentage(name: string, percentage: number): void {
  if (!(percentage >= 0 && percentage <= 100)) {
    throw new Error(`array.${name}: percentage ${percentage} must be between 0 and 100`);
  }
}

/**
 * Percentile Nearest Rank
 *
 * Returns the value for which the specified percentage of array values are
 * less than or equal to it, using the nearest-rank method.
 *
 * @param id - Array of numeric values
 * @param percentage - Percentage (0-100)
 * @returns Percentile value using nearest rank
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, 4, 5];
 * const p50 = array.percentile_nearest_rank(arr, 50);
 * // Returns: 3 (median, always a member of array)
 * ```
 *
 * @remarks
 * - Result is always a member of the array
 * - Uses nearest-rank method (no interpolation)
 * - Returns NaN if array is empty
 *
 * PineScript rules:
 * - the value at rank `ceil(percentage * size / 100)` (clamped to 1 .. size) of the sorted array
 * - `na` values are sorted after all numbers (na when that rank holds an `na`)
 * - an `na` percentage counts as 0; a percentage outside 0 .. 100 is a runtime error (throws)
 */
export function percentile_nearest_rank(id: PineArray<float>, percentage: float): float {
  if (id.length === 0) {
    return NaN;
  }
  const pct = Number.isNaN(percentage) ? 0 : percentage;
  checkPercentage('percentile_nearest_rank', pct);
  const s = sortedNaLast(id);
  const rank = Math.min(s.length, Math.max(1, Math.ceil((pct * s.length) / 100)));
  return s[rank - 1]!;
}

/**
 * Percent Rank
 *
 * Returns the percentile rank of the element at the specified index.
 * The percentile rank is the percentage of elements that are less than
 * or equal to the reference value.
 *
 * @param id - Array of numeric values
 * @param index - Index of element to rank
 * @returns Percentile rank (0-100)
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, 4, 5];
 * const rank = array.percentrank(arr, 2); // Value at index 2 is 3
 * // Returns: 50 ((3 - 1) * 100 / (5 - 1))
 * ```
 *
 * @remarks
 * - Range: 0 to 100
 *
 * PineScript rules:
 * - `(count - 1) * 100 / (size - 1)`, with `count` the number of non-na elements <= the element (exact
 *   comparison, no 1e-10 tolerance); `na` elements count in the size
 * - an `na` element, a one-element array or an empty array gives NaN
 * - an `na` index counts as 0; an index outside `0 .. size - 1` is a runtime error (throws)
 */
export function percentrank(id: PineArray<float>, index: int): float {
  const i = Number.isNaN(index) ? 0 : Math.trunc(index);
  if (id.length === 0) {
    return NaN;
  }
  if (i < 0 || i >= id.length) {
    throw new Error(`array.percentrank: index ${i} is out of bounds, array size is ${id.length}`);
  }
  if (id.length === 1) {
    return NaN;
  }
  const value = id[i]!;
  if (Number.isNaN(value)) {
    return NaN;
  }
  let count = 0;
  for (const v of id) {
    if (v <= value) count++;
  }
  return ((count - 1) * 100) / (id.length - 1);
}

/**
 * Sort Indices
 *
 * Returns an array of indices which, when used to index the original array,
 * will access its elements in their sorted order. Does not modify the original array.
 *
 * @param id - Array to get sorted indices from
 * @param order - Sort order: 'asc' or 'desc' (default: 'asc')
 * @returns Array of indices in sorted order
 *
 * @example
 * ```typescript
 * const arr = [5, -2, 0, 9, 1];
 * const indices = array.sort_indices(arr); // [1, 2, 4, 0, 3]
 * // arr[1] = -2 (smallest)
 * // arr[2] = 0
 * // arr[4] = 1
 * // arr[0] = 5
 * // arr[3] = 9 (largest)
 * ```
 *
 * @remarks
 * - Original array is not modified
 * - Returns indices that would sort the array
 * - Useful for maintaining correspondence with other arrays
 * - PineScript rule: the indices of `na` elements go where `array.sort` puts them (after the numbers in ascending
 *   order, in their original order: `sort_indices([na, na, 5, 1])` is `[3, 2, 0, 1]`)
 */
export function sort_indices<T>(id: PineArray<T>, order: SortOrder = 'asc'): PineArray<int> {
  return sortedPositions(id, order);
}

/**
 * Standardize
 *
 * Returns an array of standardized elements (z-score normalization).
 * Each element is transformed to (value - mean) / stddev.
 *
 * @param id - Array of numeric values
 * @returns Array of standardized values (z-scores)
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, 4, 5];
 * const standardized = array.standardize(arr);
 * // Mean = 3, StdDev ≈ 1.414
 * // Result ≈ [-1.414, -0.707, 0, 0.707, 1.414]
 * ```
 *
 * @remarks
 * - Formula: z = (x - μ) / σ
 * - Result has mean of 0 and standard deviation of 1
 * - Useful for comparing values on different scales
 *
 * PineScript rules:
 * - μ and σ are the population mean and standard deviation of the non-na elements, as `array.variance` (moment
 *   form); `na` elements stay `na`
 * - when σ is 0 (all values equal) every non-na element gives 1
 */
export function standardize(id: PineArray<float>): PineArray<float> {
  const values = id.filter((v) => !Number.isNaN(v));
  if (!values.length) {
    return id.map(() => NaN);
  }
  const [p, q] = moments(values);
  const mean = p / values.length;
  const stdDev = Math.sqrt(Math.max(0, q / values.length - mean * mean));
  if (stdDev === 0) {
    return id.map((v) => (Number.isNaN(v) ? NaN : 1));
  }
  return id.map((v) => (Number.isNaN(v) ? NaN : (v - mean) / stdDev));
}

/**
 * New Type (User-Defined Type Array)
 *
 * Creates a new array of user-defined type elements.
 *
 * @param size - Initial size of array (default: 0)
 * @param initial_value - Initial value for all elements
 * @returns New array of user-defined type
 *
 * @example
 * ```typescript
 * // NOTE: User-defined types (UDTs) are not fully supported yet
 * // This is a placeholder for future implementation
 * const arr = array.newtype<MyType>(5);
 * ```
 *
 * @remarks
 * - **⚠️ LIMITED SUPPORT**: User-defined types (UDTs) require a type system
 *   that is not yet fully implemented in this library
 * - This function currently works like `new_array<T>()` for basic types
 * - Full UDT support will be added in a future version
 * - See PineScript documentation for UDT usage patterns
 */
export function newtype<T>(size: simple_int = 0, initial_value?: T): PineArray<T> {
  // For now, this is just an alias for new_array
  // Full UDT support requires implementing the type system
  return new_array<T>(size, initial_value);
}

