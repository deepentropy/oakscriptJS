/**
 * Timeframe namespace
 * Mirrors PineScript's timeframe string functions.
 *
 * Timeframe strings: a multiplier and a unit letter, "S" seconds, "D" days,
 * "W" weeks, "M" months, "T" ticks, no letter for minutes ("60" is one hour, "1H" is not valid).
 * Without a multiplier, 1 is used ("D" is "1D").
 */

import type { int, simple_string } from '../types/index.js';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_WEEK = 604_800;
/** PineScript uses 365/12 days (30.4167) for one month. */
const SECONDS_PER_MONTH = 2_628_003;
/** From 365 days, `from_seconds` returns "12M". */
const SECONDS_365_DAYS = 365 * SECONDS_PER_DAY;

const UNIT_SECONDS: Record<string, number> = {
  S: 1,
  '': SECONDS_PER_MINUTE,
  D: SECONDS_PER_DAY,
  W: SECONDS_PER_WEEK,
  M: SECONDS_PER_MONTH,
};

/** Second-based timeframes that `from_seconds` can return. */
const SECOND_TIMEFRAMES = [1, 5, 10, 15, 30];

/**
 * Converts a timeframe string into seconds.
 *
 * As in PineScript: months count 2,628,003 seconds (365/12 days), any multiplier is
 * accepted ("13M", "1441", "7S"), and tick timeframes ("1T") give NaN.
 *
 * @param timeframe - Timeframe string, e.g. "1", "60", "1D", "W", "3M", "30S"
 * @returns Number of seconds in the timeframe
 * @throws RangeError for an empty string (the chart timeframe is not known here) and for
 *   strings that are not timeframes ("1H", "1d")
 *
 * @example
 * ```typescript
 * timeframe.in_seconds('60');  // 3600
 * timeframe.in_seconds('1D');  // 86400
 * timeframe.in_seconds('M');   // 2628003
 * ```
 */
export function in_seconds(timeframe: simple_string): int {
  const text = timeframe.trim();
  if (text === '') {
    throw new RangeError('timeframe.in_seconds() needs a timeframe: the chart timeframe is not known here');
  }
  // Multiplier before the unit ("30S"), or after it ("S30"), as PineScript accepts both.
  const before = /^(\d*)([SDWMT]?)$/.exec(text);
  const after = before ? null : /^([SDWMT])(\d+)$/.exec(text);
  if (!before && !after) throw new RangeError(`Invalid timeframe "${timeframe}"`);
  const [digits, unit] = before ? [before[1]!, before[2]!] : [after![2]!, after![1]!];
  if (unit === 'T') return NaN;
  const multiplier = digits === '' ? 1 : Number(digits);
  return multiplier * UNIT_SECONDS[unit]!;
}

/**
 * Converts a number of seconds into a valid timeframe string.
 *
 * PineScript rules:
 * - when no valid timeframe has exactly this duration, the next higher one is returned:
 *   1 second or less gives "1S", 2-5 seconds give "5S", 31-60 seconds give "1",
 *   604,799 seconds give "7D"
 * - when several timeframes have exactly this duration, the larger unit is used:
 *   604,800 seconds give "1W", not "7D"; months are used for exact multiples of 2,628,003 seconds
 * - from 31,536,000 seconds (365 days) the result is "12M"
 *
 * @param seconds - Number of seconds
 * @returns Timeframe string
 *
 * @example
 * ```typescript
 * timeframe.from_seconds(3600);    // "60"
 * timeframe.from_seconds(86400);   // "1D"
 * timeframe.from_seconds(604800);  // "1W"
 * ```
 */
export function from_seconds(seconds: int): simple_string {
  if (Number.isNaN(seconds)) throw new RangeError('timeframe.from_seconds() needs a number of seconds');
  if (seconds >= SECONDS_365_DAYS) return '12M';

  // Exact durations, larger unit first.
  if (seconds > 0) {
    if (seconds % SECONDS_PER_MONTH === 0) return `${seconds / SECONDS_PER_MONTH}M`;
    if (seconds % SECONDS_PER_WEEK === 0) return `${seconds / SECONDS_PER_WEEK}W`;
    if (seconds % SECONDS_PER_DAY === 0) return `${seconds / SECONDS_PER_DAY}D`;
    if (seconds % SECONDS_PER_MINUTE === 0 && seconds < SECONDS_PER_DAY) return `${seconds / SECONDS_PER_MINUTE}`;
  }

  // Next higher valid timeframe.
  const second = SECOND_TIMEFRAMES.find((m) => seconds <= m);
  if (second !== undefined) return `${second}S`;
  if (seconds < SECONDS_PER_DAY) return `${Math.ceil(seconds / SECONDS_PER_MINUTE)}`;
  return `${Math.ceil(seconds / SECONDS_PER_DAY)}D`;
}

/** Properties of a chart timeframe, as PineScript's `timeframe.*` variables give them. */
export interface TimeframeInfo {
  /** Timeframe string with its multiplier: "1D", "60", "1S" (PineScript `timeframe.period`) */
  period: string;
  multiplier: number;
  isintraday: boolean;
  isdaily: boolean;
  isweekly: boolean;
  ismonthly: boolean;
  isminutes: boolean;
  isseconds: boolean;
  isticks: boolean;
  isdwm: boolean;
}

/**
 * Describes a chart timeframe like PineScript's `timeframe.*` variables.
 * The period always carries its multiplier: "D" becomes "1D".
 *
 * @param timeframe - Chart timeframe string, e.g. "5", "60", "D", "1W", "30S"
 * @throws RangeError for strings that are not timeframes
 */
export function info(timeframe: simple_string): TimeframeInfo {
  const text = timeframe.trim();
  const m = /^(\d*)([SDWMT]?)$/.exec(text);
  if (!m || text === '') throw new RangeError(`Invalid timeframe "${timeframe}"`);
  const unit = m[2]!;
  const multiplier = m[1] === '' ? 1 : Number(m[1]);
  return {
    period: unit === '' ? String(multiplier) : `${multiplier}${unit}`,
    multiplier,
    isintraday: unit === '' || unit === 'S' || unit === 'T',
    isdaily: unit === 'D',
    isweekly: unit === 'W',
    ismonthly: unit === 'M',
    isminutes: unit === '',
    isseconds: unit === 'S',
    isticks: unit === 'T',
    isdwm: unit === 'D' || unit === 'W' || unit === 'M',
  };
}
