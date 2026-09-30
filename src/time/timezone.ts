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
  | { readonly kind: 'iana'; readonly format: Intl.DateTimeFormat };

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
    zone = { kind: 'iana', format };
  }
  zones.set(timezone, zone);
  return zone;
}

/** Offset of the zone from UTC at instant `time`, in milliseconds (local = UTC + offset). */
function offsetAt(zone: Zone, time: number): number {
  if (zone.kind === 'fixed') return zone.offsetMs;
  const wholeSecond = Math.floor(time / 1000) * 1000;
  const f: Record<string, number> = {};
  for (const part of zone.format.formatToParts(wholeSecond)) {
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
  const local = Date.UTC(year, month - 1, day, hour, minute, second);
  if (zone.kind === 'fixed') return local - zone.offsetMs;

  // At most one offset transition happens within a day of `local`: the offsets
  // one day before and one day after are the two candidates.
  const before = offsetAt(zone, local - MS_PER_DAY);
  const after = offsetAt(zone, local + MS_PER_DAY);
  const candidates = [local - before, local - after].filter((t) => local - offsetAt(zone, t) === t);
  if (candidates.length) return Math.max(...candidates);
  return local - before;
}
