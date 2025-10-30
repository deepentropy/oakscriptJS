/**
 * Time namespace
 * Mirrors PineScript's time and timestamp functions
 *
 * TODO: Implement time and date functions
 */

import { int, simple_int, simple_string } from '../types';

/**
 * Returns the current time in milliseconds
 */
export function now(): int {
  return Date.now();
}

/**
 * Returns timestamp for a specific date/time
 */
export function timestamp(
  year: simple_int,
  month: simple_int,
  day: simple_int,
  hour?: simple_int,
  minute?: simple_int,
  second?: simple_int
): int {
  return new Date(
    year,
    month - 1,
    day,
    hour || 0,
    minute || 0,
    second || 0
  ).getTime();
}

// TODO: Add more time functions
// - year(), month(), dayofmonth(), dayofweek()
// - hour(), minute(), second()
// - weekofyear()
// - etc.
