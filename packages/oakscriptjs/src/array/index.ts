/**
 * Array namespace
 * Mirrors PineScript's array.* functions
 */

import { PineArray, int, float, bool, simple_int, color, Line, Box, Label, Linefill } from '../types';
import * as ta from '../ta';

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

/**
 * Returns the element at the specified index
 */
export function get<T>(id: PineArray<T>, index: simple_int): T {
  return id[index]!;
}

/**
 * Sets the value of the element at the specified index
 */
export function set<T>(id: PineArray<T>, index: simple_int, value: T): void {
  id[index] = value;
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
 * Inserts a value at the specified index
 */
export function insert<T>(id: PineArray<T>, index: simple_int, value: T): void {
  id.splice(index, 0, value);
}

/**
 * Removes the element at the specified index
 */
export function remove<T>(id: PineArray<T>, index: simple_int): T {
  return id.splice(index, 1)[0]!;
}

/**
 * Returns true if the array contains the value
 */
export function includes<T>(id: PineArray<T>, value: T): bool {
  return id.includes(value);
}

/**
 * Returns the index of the first occurrence of the value
 */
export function indexof<T>(id: PineArray<T>, value: T): int {
  return id.indexOf(value);
}

/**
 * Returns the index of the last occurrence of the value
 */
export function lastindexof<T>(id: PineArray<T>, value: T): int {
  return id.lastIndexOf(value);
}

/**
 * Returns a shallow copy of the array
 */
export function copy<T>(id: PineArray<T>): PineArray<T> {
  return [...id] as PineArray<T>;
}

/**
 * Concatenates two arrays
 */
export function concat<T>(id1: PineArray<T>, id2: PineArray<T>): PineArray<T> {
  return [...id1, ...id2] as PineArray<T>;
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
 * Returns a slice of the array
 */
export function slice<T>(id: PineArray<T>, index_from: simple_int, index_to?: simple_int): PineArray<T> {
  return id.slice(index_from, index_to) as PineArray<T>;
}

/**
 * Sorts array elements (numeric)
 */
export function sort<T>(id: PineArray<T>, order: 'asc' | 'desc' = 'asc'): void {
  id.sort((a, b) => {
    if (order === 'asc') {
      return (a as any) - (b as any);
    } else {
      return (b as any) - (a as any);
    }
  });
}

/**
 * Returns the sum of all elements (numeric arrays only)
 */
export function sum(id: PineArray<float>): float {
  return id.reduce((acc, val) => acc + val, 0);
}

/**
 * Returns the average of all elements (numeric arrays only)
 */
export function avg(id: PineArray<float>): float {
  return sum(id) / size(id);
}

/**
 * Returns the minimum value (numeric arrays only)
 */
export function min(id: PineArray<float>): float {
  return Math.min(...id);
}

/**
 * Returns the maximum value (numeric arrays only)
 */
export function max(id: PineArray<float>): float {
  return Math.max(...id);
}

/**
 * Returns the median value (numeric arrays only)
 */
export function median(id: PineArray<float>): float {
  const sorted = [...id].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/**
 * Returns the mode (most frequent value)
 */
export function mode(id: PineArray<float>): float {
  const frequency: Map<float, int> = new Map();
  let maxFreq = 0;
  let mode = id[0]!;

  for (const val of id) {
    const freq = (frequency.get(val) || 0) + 1;
    frequency.set(val, freq);
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = val;
    }
  }

  return mode;
}

/**
 * Returns the standard deviation
 */
export function stdev(id: PineArray<float>): float {
  const mean = avg(id);
  const squareDiffs = id.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = sum(squareDiffs as PineArray<float>) / size(id);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Returns the variance
 */
export function variance(id: PineArray<float>): float {
  const mean = avg(id);
  const squareDiffs = id.map(value => Math.pow(value - mean, 2));
  return sum(squareDiffs as PineArray<float>) / size(id);
}

/**
 * Fills the array with the specified value
 */
export function fill<T>(id: PineArray<T>, value: T, index_from: simple_int = 0, index_to?: simple_int): void {
  const end = index_to ?? id.length;
  for (let i = index_from; i < end; i++) {
    id[i] = value;
  }
}

/**
 * Creates a new array from existing one (alias for copy)
 */
export function from<T>(id: PineArray<T>): PineArray<T> {
  return copy(id);
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.first | PineScript array.first}
 */
export function first<T>(id: PineArray<T>): T {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.last | PineScript array.last}
 */
export function last<T>(id: PineArray<T>): T {
  return id[id.length - 1]!;
}

/**
 * Tests whether at least one element in the array passes the test implemented by the provided function
 *
 * @param id - The array
 * @param predicate - Function to test for each element
 * @returns true if at least one element passes the test, false otherwise
 *
 * @remarks
 * - Similar to JavaScript's Array.prototype.some()
 * - Stops iterating once a matching element is found
 * - Returns false for empty arrays
 *
 * @example
 * ```typescript
 * const arr = [1, 2, 3, 4, 5];
 * const hasEven = array.some(arr, x => x % 2 === 0); // Returns: true
 * const hasNegative = array.some(arr, x => x < 0); // Returns: false
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.some | PineScript array.some}
 */
export function some<T>(id: PineArray<T>, predicate: (value: T) => bool): bool {
  return id.some(predicate);
}

/**
 * Tests whether all elements in the array pass the test implemented by the provided function
 *
 * @param id - The array
 * @param predicate - Function to test for each element
 * @returns true if all elements pass the test, false otherwise
 *
 * @remarks
 * - Similar to JavaScript's Array.prototype.every()
 * - Stops iterating once a failing element is found
 * - Returns true for empty arrays
 *
 * @example
 * ```typescript
 * const arr = [2, 4, 6, 8];
 * const allEven = array.every(arr, x => x % 2 === 0); // Returns: true
 * const allPositive = array.every(arr, x => x > 0); // Returns: true
 * const allLarge = array.every(arr, x => x > 5); // Returns: false
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.every | PineScript array.every}
 */
export function every<T>(id: PineArray<T>, predicate: (value: T) => bool): bool {
  return id.every(predicate);
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_bool | PineScript array.new_bool}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_float | PineScript array.new_float}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_int | PineScript array.new_int}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_string | PineScript array.new_string}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_color | PineScript array.new_color}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_line | PineScript array.new_line}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_box | PineScript array.new_box}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_label | PineScript array.new_label}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new_linefill | PineScript array.new_linefill}
 */
export function new_linefill(size: simple_int = 0, initial_value?: Linefill): PineArray<Linefill> {
  return new_array<Linefill>(size, initial_value);
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.abs | PineScript array.abs}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.range | PineScript array.range}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.binary_search | PineScript array.binary_search}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.binary_search_leftmost | PineScript array.binary_search_leftmost}
 */
export function binary_search_leftmost(id: PineArray<float>, val: float): int {
  let left = 0;
  let right = id.length - 1;
  let result = -1;
  let found = false;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (id[mid]! < val) {
      if (!found) {
        result = mid; // Track the last element smaller than val (only if not found)
      }
      left = mid + 1;
    } else if (id[mid]! === val) {
      result = mid;
      found = true;
      // Continue searching to the left for leftmost occurrence
      right = mid - 1;
    } else {
      // id[mid] > val
      right = mid - 1;
    }
  }

  return result;
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.binary_search_rightmost | PineScript array.binary_search_rightmost}
 */
export function binary_search_rightmost(id: PineArray<float>, val: float): int {
  let left = 0;
  let right = id.length - 1;
  let result = -1;
  let found = false;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (id[mid]! <= val) {
      if (id[mid]! === val) {
        result = mid;
        found = true;
      }
      // Continue searching to the right for rightmost occurrence
      left = mid + 1;
    } else {
      // id[mid] > val
      if (!found) {
        result = mid; // Track the first element greater than val (only if not found)
      }
      right = mid - 1;
    }
  }

  return result;
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
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.covariance | PineScript array.covariance}
 */
export function covariance(id1: PineArray<float>, id2: PineArray<float>, biased: bool = true): float {
  if (id1.length === 0 || id2.length === 0) {
    return NaN;
  }

  if (id1.length !== id2.length) {
    return NaN;
  }

  const n = id1.length;
  const mean1 = avg(id1);
  const mean2 = avg(id2);

  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (id1[i]! - mean1) * (id2[i]! - mean2);
  }

  // Biased: divide by n, Unbiased: divide by n-1
  const divisor = biased ? n : n - 1;
  return sum / divisor;
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
 * - Includes NaN values (will return NaN if any present)
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.percentile_linear_interpolation | PineScript array.percentile_linear_interpolation}
 */
export function percentile_linear_interpolation(id: PineArray<float>, percentage: float): float {
  if (id.length === 0) {
    return NaN;
  }

  // Use the TA function by passing the array as a series
  // The TA function calculates percentile over the last 'length' values
  const result = ta.percentile_linear_interpolation(id, id.length, percentage);

  // The result is a series, return the last value
  return result[result.length - 1]!;
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
 * - Ignores NaN values
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.percentile_nearest_rank | PineScript array.percentile_nearest_rank}
 */
export function percentile_nearest_rank(id: PineArray<float>, percentage: float): float {
  if (id.length === 0) {
    return NaN;
  }

  // Use the TA function by passing the array as a series
  const result = ta.percentile_nearest_rank(id, id.length, percentage);

  // The result is a series, return the last value
  return result[result.length - 1]!;
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
 * // Returns: 40 (40% of values <= 3)
 * ```
 *
 * @remarks
 * - Returns percentage of elements <= the value at given index
 * - Range: 0 to 100
 * - Returns NaN if array is empty or index out of bounds
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.percentrank | PineScript array.percentrank}
 */
export function percentrank(id: PineArray<float>, index: int): float {
  if (id.length === 0 || index < 0 || index >= id.length) {
    return NaN;
  }

  const value = id[index]!;

  if (isNaN(value)) {
    return NaN;
  }

  // Count elements less than or equal to the value
  let count = 0;
  for (let i = 0; i < id.length; i++) {
    if (!isNaN(id[i]!) && id[i]! <= value) {
      count++;
    }
  }

  // Calculate percentage
  return (count / id.length) * 100;
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.sort_indices | PineScript array.sort_indices}
 */
export function sort_indices(id: PineArray<float>, order: 'asc' | 'desc' = 'asc'): PineArray<int> {
  // Create array of indices
  const indices: PineArray<int> = Array.from({ length: id.length }, (_, i) => i) as PineArray<int>;

  // Sort indices based on values in original array
  indices.sort((a, b) => {
    if (order === 'asc') {
      return id[a]! - id[b]!;
    } else {
      return id[b]! - id[a]!;
    }
  });

  return indices;
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
 * - Returns array of NaN if standard deviation is 0
 * - Useful for comparing values on different scales
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.standardize | PineScript array.standardize}
 */
export function standardize(id: PineArray<float>): PineArray<float> {
  if (id.length === 0) {
    return [] as PineArray<float>;
  }

  const mean = avg(id);
  const stdDev = stdev(id);

  // If stddev is 0, all values are the same - return array of 0s or NaN
  if (stdDev === 0) {
    return id.map(() => NaN) as PineArray<float>;
  }

  // Calculate z-score for each element
  return id.map(value => (value - mean) / stdDev) as PineArray<float>;
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_array.new%3Ctype%3E | PineScript array.new<type>}
 */
export function newtype<T>(size: simple_int = 0, initial_value?: T): PineArray<T> {
  // For now, this is just an alias for new_array
  // Full UDT support requires implementing the type system
  return new_array<T>(size, initial_value);
}

/**
 * ⚠️ RENDERING FUNCTIONS NOT IMPLEMENTED
 *
 * The following array constructor functions are intentionally excluded
 * because they create arrays for rendering objects, which are outside
 * the scope of this calculation-focused library:
 *
 * - `new_box()` - Creates arrays of box drawing objects
 * - `new_label()` - Creates arrays of label objects
 * - `new_line()` - Creates arrays of line drawing objects
 * - `new_linefill()` - Creates arrays of line fill objects
 * - `new_table()` - Creates arrays of table layout objects
 *
 * **Design Constraint**: This library focuses on calculation and indicator
 * functions only. Rendering, visualization, and UI functions require a
 * rendering engine and are not included.
 *
 * If you need these functions, consider:
 * 1. Using PineScript directly on TradingView
 * 2. Implementing a rendering layer separately
 * 3. Using this library for calculations and another library for visualization
 */
