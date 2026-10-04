/**
 * Time namespace
 * Mirrors PineScript's time and calendar functions.
 *
 * Every function takes an explicit time zone: UTC/GMT offset notation ("UTC-5",
 * "GMT+0530", "UTC+05:30") or an IANA name ("America/New_York"). The PineScript
 * default time zone (the exchange time zone, `syminfo.timezone`) is not known here.
 */

import type { int, simple_int } from '../types/index.js';
import { zonedFields, zonedToUnix } from './timezone.js';
import { parseDateString } from './datestring.js';
import { inSession as sessionContains } from './session.js';

/**
 * Returns the current time in milliseconds
 */
export function now(): int {
  return Date.now();
}

/**
 * Returns the UNIX time (ms) of a date and time.
 *
 * - `timestamp(dateString)`: RFC 2822 or ISO 8601 date string ("20 Feb 2020",
 *   "2020-02-20T14:48:00", "2024-01-01 09:30 +0000", "04 Dec 1995 00:12:00 GMT+5").
 *   Without a time the time is 00:00; without a time zone the time zone is GMT+0.
 * - `timestamp(timezone, year, month, day, hour?, minute?, second?)`: calendar fields in `timezone`.
 *   A wall-clock time that occurs twice resolves to the later instant; a missing one is
 *   shifted forward by the gap (as in PineScript).
 * - `timestamp(year, month, day, hour?, minute?, second?)`: calendar fields in the time zone
 *   of the host. PineScript reads them in the exchange time zone, which is not known here:
 *   use the `timezone` form for PineScript values.
 *
 * Out-of-range fields roll over (month 13 is January of the next year).
 *
 * @example
 * ```typescript
 * time.timestamp('2024-01-02');                                // 1704153600000
 * time.timestamp('America/New_York', 2024, 1, 2, 9, 30);       // 1704205800000
 * ```
 */
export function timestamp(dateString: string): int;
export function timestamp(
  timezone: string,
  year: simple_int,
  month: simple_int,
  day: simple_int,
  hour?: simple_int,
  minute?: simple_int,
  second?: simple_int
): int;
export function timestamp(
  year: simple_int,
  month: simple_int,
  day: simple_int,
  hour?: simple_int,
  minute?: simple_int,
  second?: simple_int
): int;
export function timestamp(first: string | simple_int, ...rest: Array<simple_int | undefined>): int {
  if (typeof first === 'string') {
    if (rest.length === 0) return parseDateString(first);
    // PineScript: an na field counts as 0 (day na of January 2020 is 2019-12-31)
    const f = (v: number | undefined) => (v === undefined || v === null || Number.isNaN(v) ? 0 : v);
    const [year, month, day, hour, minute, second] = rest as [number, number, number, number?, number?, number?];
    return zonedToUnix(first, f(year), f(month), f(day), f(hour), f(minute), f(second));
  }
  const [month, day, hour, minute, second] = rest as [number, number, number?, number?, number?];
  return new Date(first, month - 1, day, hour || 0, minute || 0, second || 0).getTime();
}

// ── Calendar fields ──────────────────────────────────────────────────────────

function field(time: number, timezone: string, pick: (f: ReturnType<typeof zonedFields>) => number): int {
  return Number.isNaN(time) ? NaN : pick(zonedFields(time, timezone));
}

/**
 * Year of a UNIX time (ms) in `timezone`.
 */
export function year(time: int, timezone: string): int {
  return field(time, timezone, (f) => f.year);
}

/**
 * Month (1-12) of a UNIX time (ms) in `timezone`.
 */
export function month(time: int, timezone: string): int {
  return field(time, timezone, (f) => f.month);
}

/**
 * Day of the month (1-31) of a UNIX time (ms) in `timezone`.
 */
export function dayofmonth(time: int, timezone: string): int {
  return field(time, timezone, (f) => f.day);
}

/**
 * Day of the week of a UNIX time (ms) in `timezone`: 1 = Sunday, 2 = Monday ... 7 = Saturday
 * (PineScript `dayofweek.sunday` ... `dayofweek.saturday`).
 */
export function dayofweek(time: int, timezone: string): int {
  return field(time, timezone, (f) => f.dayOfWeek);
}

/**
 * Week number of the year of a UNIX time (ms) in `timezone`.
 *
 * Weeks start on Monday and follow ISO 8601: week 1 is the week that contains the
 * first Thursday of the year, so the first days of January can be in week 52 or 53
 * of the previous year. The PineScript reference does not define the rule.
 */
export function weekofyear(time: int, timezone: string): int {
  return field(time, timezone, (f) => {
    const date = Date.UTC(f.year, f.month - 1, f.day);
    const mondayBased = (f.dayOfWeek + 5) % 7; // Monday = 0 ... Sunday = 6
    const thursday = new Date(date + (3 - mondayBased) * 86_400_000);
    const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
    return 1 + Math.floor((thursday.getTime() - yearStart) / (7 * 86_400_000));
  });
}

/**
 * Hour (0-23) of a UNIX time (ms) in `timezone`.
 */
export function hour(time: int, timezone: string): int {
  return field(time, timezone, (f) => f.hour);
}

/**
 * Minute (0-59) of a UNIX time (ms) in `timezone`.
 */
export function minute(time: int, timezone: string): int {
  return field(time, timezone, (f) => f.minute);
}

/**
 * Second (0-59) of a UNIX time (ms) in `timezone`.
 */
export function second(time: int, timezone: string): int {
  return field(time, timezone, (f) => f.second);
}

// ── Sessions ─────────────────────────────────────────────────────────────────

/**
 * True when a bar opening at `time` is inside `session`, with the session hours read in `timezone`.
 *
 * This is the session test of PineScript `time(timeframe, session, timezone)`, which returns
 * `na` for bars outside the session: `na(time("1", "0930-1600", "America/New_York"))` is
 * `!time.inSession(barTime, "0930-1600", "America/New_York")`.
 *
 * Session format: "HHmm-HHmm", several periods separated by commas, optional days after
 * ":" (1 = Sunday ... 7 = Saturday), e.g. "0930-1600:23456" or "1000-1100,1400-1500".
 * Without days, one period covers every day and several periods cover Monday to Friday.
 * A period includes its start and excludes its end. An overnight period ("1800-0930")
 * belongs to the day it ends. "0000-0000" and "24x7" cover the whole day.
 */
export function inSession(time: int, session: string, timezone: string): boolean {
  return sessionContains(time, session, timezone);
}
