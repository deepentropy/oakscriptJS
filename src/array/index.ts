/**
 * Array namespace
 * Mirrors PineScript's array.* functions
 */

import { PineArray, int, float, bool, simple_int } from '../types';

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
  return id[index];
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
  return id.splice(index, 1)[0];
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
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Returns the mode (most frequent value)
 */
export function mode(id: PineArray<float>): float {
  const frequency: Map<float, int> = new Map();
  let maxFreq = 0;
  let mode = id[0];

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
