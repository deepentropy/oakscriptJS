/**
 * Time zone resolution for the calendar functions.
 *
 * PineScript accepts two time zone notations:
 * - UTC/GMT offset notation: "UTC", "UTC-5", "UTC+05:30", "GMT+0530", "GMT+05:30:00", up to ±18:00
 * - IANA time zone database names, case-sensitive: "America/New_York", "Etc/UTC", "US/Eastern", "CET"
 *
 * "utc+2", "america/new_york", "UTC+5:3", "UTC+5:30:15", "GMT+18:01", "EST", "MST" and "HST" are
 * errors in PineScript, and so here.
 *
 * Offsets of IANA zones (daylight saving time and historical changes included)
 * come from the host's `Intl.DateTimeFormat`, so no time zone data ships with the library.
 */

const MS_PER_SECOND = 1000;
const MS_PER_DAY = 86_400_000;
const MAX_OFFSET_SECONDS = 18 * 3600;

const OFFSET_NOTATION = /^(?:UTC|GMT)(?:([+-])(\d{1,2})(?::?(\d{2})(?::?(\d{2}))?)?)?$/;

/** Time zone database names that PineScript rejects although `Intl` accepts them. */
const REJECTED_NAMES = new Set(['EST', 'MST', 'HST']);

let canonicalNames: Map<string, string> | undefined;

/** False when `name` is a wrong-case spelling of a time zone name (`Intl` matches names case-insensitively). */
function hasTimeZoneCase(name: string): boolean {
  if (name.split('/').some((segment) => !/^[A-Z]/.test(segment))) return false;
  canonicalNames ??= new Map(Intl.supportedValuesOf('timeZone').map((n) => [n.toLowerCase(), n]));
  const canonical = canonicalNames.get(name.toLowerCase());
  return canonical === undefined || canonical === name;
}

type Zone =
  | { readonly kind: 'fixed'; readonly offsetMs: number }
  | {
      readonly kind: 'iana';
      readonly format: Intl.DateTimeFormat;
      /** Offset of each UTC hour (`floor(time / 1 h)`); null for an hour with an offset change inside */
      readonly hours: Map<number, number | null>;
    };

const MS_PER_HOUR = 3_600_000;
/** Cached hours per zone before the cache restarts (about 11 years of hours) */
const MAX_CACHED_HOURS = 100_000;

const zones = new Map<string, Zone>();

function resolveZone(timezone: string): Zone {
  let zone = zones.get(timezone);
  if (zone) return zone;

  const invalid = () =>
    new RangeError(
      `Invalid time zone "${timezone}": use UTC/GMT offset notation ("UTC-5", "GMT+0530") or an IANA name ("America/New_York")`
    );
  const m = OFFSET_NOTATION.exec(timezone);
  if (m) {
    const [, sign, h = '0', mi = '0', s] = m;
    const minutes = Number(mi);
    const seconds = s === undefined ? 0 : Number(s);
    if (minutes > 59 || seconds > 59 || (s !== undefined && h.length !== 2)) throw invalid();
    const offsetSeconds = Number(h) * 3600 + minutes * 60 + seconds;
    if (offsetSeconds > MAX_OFFSET_SECONDS) throw invalid();
    zone = { kind: 'fixed', offsetMs: (sign === '-' ? -offsetSeconds : offsetSeconds) * MS_PER_SECOND };
  } else {
    if (REJECTED_NAMES.has(timezone) || !hasTimeZoneCase(timezone)) throw invalid();
    let format: Intl.DateTimeFormat;
    try {
      format = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      });
    } catch {
      throw invalid();
    }
    zone = { kind: 'iana', format, hours: new Map() };
  }
  zones.set(timezone, zone);
  return zone;
}

/**
 * Offset of the zone from UTC at instant `time`, in milliseconds (local = UTC + offset).
 * An offset change happens at most once in a UTC hour, so when the first and the last second of the hour have the
 * same offset, the whole hour has it: it is computed once and cached.
 */
function offsetAt(zone: Zone, time: number): number {
  if (zone.kind === 'fixed') return zone.offsetMs;
  const hour = Math.floor(time / MS_PER_HOUR);
  let offset = zone.hours.get(hour);
  if (offset === undefined) {
    const first = formattedOffset(zone.format, hour * MS_PER_HOUR);
    const last = formattedOffset(zone.format, hour * MS_PER_HOUR + MS_PER_HOUR - MS_PER_SECOND);
    offset = first === last ? first : null;
    if (zone.hours.size >= MAX_CACHED_HOURS) zone.hours.clear();
    zone.hours.set(hour, offset);
  }
  return offset ?? formattedOffset(zone.format, time);
}

/** Offset of the zone at instant `time` (whole second), from the host's `Intl` time zone data. */
function formattedOffset(format: Intl.DateTimeFormat, time: number): number {
  const wholeSecond = Math.floor(time / 1000) * 1000;
  const f: Record<string, number> = {};
  for (const part of format.formatToParts(wholeSecond)) {
    if (part.type !== 'literal') f[part.type] = Number(part.value);
  }
  const local = Date.UTC(f.year!, f.month! - 1, f.day!, f.hour!, f.minute!, f.second!);
  return local - wholeSecond;
}

/** Calendar fields of a UNIX time in a time zone. */
export interface ZonedFields {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 1 = Sunday ... 7 = Saturday (PineScript dayofweek numbering) */
  dayOfWeek: number;
}

/** Offset of `timezone` from UTC at `time`, in milliseconds (local = UTC + offset). */
export function zoneOffset(time: number, timezone: string): number {
  return offsetAt(resolveZone(timezone), time);
}

/** Splits a UNIX time (ms) into calendar fields in `timezone`. */
export function zonedFields(time: number, timezone: string): ZonedFields {
  const local = new Date(time + offsetAt(resolveZone(timezone), time));
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    second: local.getUTCSeconds(),
    dayOfWeek: local.getUTCDay() + 1,
  };
}

/**
 * Converts a wall-clock date and time in `timezone` to a UNIX time (ms).
 * Out-of-range fields roll over like `Date.UTC` (month 13 is January of the next year).
 *
 * As in PineScript: wall-clock times that occur twice (end of daylight saving time)
 * resolve to the later instant, and wall-clock times that do not exist (start of
 * daylight saving time) are shifted forward by the length of the gap.
 */
/**
 * UNIX time (ms) of a UTC wall-clock date: Gregorian calendar from 1582-10-15, Julian calendar before it (as
 * PineScript: 1582-10-05 is 1582-10-15). Out-of-range fields roll over like `Date.UTC`.
 */
export function civilToUnix(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  const gregorian = Date.UTC(year, month - 1, day, hour, minute, second);
  // normalized year / month / day of the Gregorian reading decides the calendar
  const d = new Date(Date.UTC(year, month - 1, 1));
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  if (y > 1582 || (y === 1582 && (m > 10 || (m === 10 && day >= 15)))) return gregorian;
  // Julian day number of y-m-1, then the day offset and the time of day
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jdn = 1 + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
  const days = jdn - 2440588 + (day - 1);
  return days * MS_PER_DAY + Date.UTC(1970, 0, 1, hour, minute, second);
}

export function zonedToUnix(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): number {
  const zone = resolveZone(timezone);
  const local = civilToUnix(year, month, day, hour, minute, second);
  if (zone.kind === 'fixed') return local - zone.offsetMs;

  // At most one offset transition happens within a day of `local`: the offsets
  // one day before and one day after are the two candidates.
  const before = offsetAt(zone, local - MS_PER_DAY);
  const after = offsetAt(zone, local + MS_PER_DAY);
  const candidates = [local - before, local - after].filter((t) => local - offsetAt(zone, t) === t);
  if (candidates.length) return Math.max(...candidates);
  return local - before;
}
