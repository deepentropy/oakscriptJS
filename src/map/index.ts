/**
 * Map namespace
 * Mirrors PineScript's map.* functions.
 *
 * A PineScript map is a JS `Map`. PineScript rules:
 * - `keys()` and `values()` follow insertion order; putting an existing key keeps its position,
 *   removing a key and putting it again moves it to the end
 * - keys are equal only when they are exactly equal (no float tolerance)
 * - `put()` and `remove()` return the previous value, or `na` (`undefined`) when there was none
 * - a map holds at most 50,000 key-value pairs
 */

import type { PineArray, PineMap, PineMapKey, bool, int } from '../types';

/** Maximum number of key-value pairs in a PineScript map. */
export const MAX_SIZE = 50_000;

function tooLarge(size: number): RangeError {
  return new RangeError(`A map cannot have more than ${MAX_SIZE} key-value pairs. The current size is ${size}.`);
}

/**
 * Creates an empty map (PineScript `map.new<keyType, valueType>()`).
 *
 * @example
 * ```typescript
 * const levels = map.new_map<string, number>();
 * map.put(levels, 'high', 105.2);
 * ```
 */
export function new_map<K extends PineMapKey, V>(): PineMap<K, V> {
  return new Map<K, V>();
}

/**
 * Puts a key-value pair in the map. An existing key keeps its position.
 * @returns The previous value of the key, or `undefined` (`na`) when the key was new
 * @throws RangeError when the map would hold more than 50,000 pairs
 */
export function put<K extends PineMapKey, V>(id: PineMap<K, V>, key: K, value: V): V | undefined {
  const previous = id.get(key);
  if (!id.has(key) && id.size >= MAX_SIZE) throw tooLarge(id.size + 1);
  id.set(key, value);
  return previous;
}

/**
 * Puts all pairs of `id2` in `id` (existing keys are overwritten and keep their position).
 * @throws RangeError when `id` would hold more than 50,000 pairs
 */
export function put_all<K extends PineMapKey, V>(id: PineMap<K, V>, id2: PineMap<K, V>): void {
  let size = id.size;
  for (const key of id2.keys()) if (!id.has(key)) size++;
  if (size > MAX_SIZE) throw tooLarge(size);
  for (const [key, value] of id2) id.set(key, value);
}

/**
 * Returns the value of `key`, or `undefined` (`na`) when the map does not contain it.
 */
export function get<K extends PineMapKey, V>(id: PineMap<K, V>, key: K): V | undefined {
  return id.get(key);
}

/**
 * Returns true when the map contains `key` (also when its value is `na`).
 */
export function contains<K extends PineMapKey, V>(id: PineMap<K, V>, key: K): bool {
  return id.has(key);
}

/**
 * Removes `key` from the map.
 * @returns The removed value, or `undefined` (`na`) when the map did not contain the key
 */
export function remove<K extends PineMapKey, V>(id: PineMap<K, V>, key: K): V | undefined {
  const value = id.get(key);
  id.delete(key);
  return value;
}

/**
 * Returns the number of key-value pairs.
 */
export function size<K extends PineMapKey, V>(id: PineMap<K, V>): int {
  return id.size;
}

/**
 * Removes all pairs.
 */
export function clear<K extends PineMapKey, V>(id: PineMap<K, V>): void {
  id.clear();
}

/**
 * Returns a new array of the keys, in insertion order.
 */
export function keys<K extends PineMapKey, V>(id: PineMap<K, V>): PineArray<K> {
  return [...id.keys()];
}

/**
 * Returns a new array of the values, in insertion order of their keys.
 */
export function values<K extends PineMapKey, V>(id: PineMap<K, V>): PineArray<V> {
  return [...id.values()];
}

/**
 * Returns a shallow copy of the map (same order; object values are shared).
 */
export function copy<K extends PineMapKey, V>(id: PineMap<K, V>): PineMap<K, V> {
  return new Map(id);
}
