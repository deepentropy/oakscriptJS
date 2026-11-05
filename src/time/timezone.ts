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
      /** Offset at the start of each UTC day (`floor(time / 1 day)`) */
      readonly dayStarts: Map<number, number>;
      /** Offset of each UTC hour (`floor(time / 1 h)`) of a day with an offset change; null for an hour with the
       *  change inside */
      readonly hours: Map<number, number | null>;
    };

const MS_PER_HOUR = 3_600_000;
/** Cached hours per zone before the cache restarts (about 11 years of hours) */
const MAX_CACHED_HOURS = 100_000;
/** Cached days per zone before the cache restarts (about 270 years) */
const MAX_CACHED_DAYS = 100_000;

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
    zone = { kind: 'iana', format, dayStarts: new Map(), hours: new Map() };
  }
  zones.set(timezone, zone);
  return zone;
}

/** Days whose starts are read together (see `dayStartOffset`) */
const DAYS_PER_BLOCK = 3;
/** Last day whose block and the next one are inside the `Date` range (8.64e15 ms on each side of 1970) */
const LAST_BLOCK_DAY = 100_000_000 - DAYS_PER_BLOCK;

/** Offset of the zone at the start of UTC day `day`, from `Intl`, cached. */
function formattedDayStart(zone: Zone & { kind: 'iana' }, day: number): number {
  let offset = zone.dayStarts.get(day);
  if (offset === undefined) {
    offset = formattedOffset(zone.format, day * MS_PER_DAY);
    zone.dayStarts.set(day, offset);
  }
  return offset;
}

/**
 * Offset of the zone at the start of UTC day `day`, cached. The days are read by blocks of three: two offset changes
 * are always more than three days apart (167 hours at least, see `offsetAt`), so when the starts of a block and of
 * the next one have the same offset, no change happens in between and the days of the block have it: one `Intl`
 * call for three days instead of one per day.
 */
function dayStartOffset(zone: Zone & { kind: 'iana' }, day: number): number {
  const cached = zone.dayStarts.get(day);
  if (cached !== undefined) return cached;
  if (zone.dayStarts.size >= MAX_CACHED_DAYS) zone.dayStarts.clear();
  if (!(Math.abs(day) <= LAST_BLOCK_DAY)) return formattedDayStart(zone, day);
  const first = Math.floor(day / DAYS_PER_BLOCK) * DAYS_PER_BLOCK;
  const offset = formattedDayStart(zone, first);
  if (offset !== formattedDayStart(zone, first + DAYS_PER_BLOCK)) return formattedDayStart(zone, day);
  for (let d = first + 1; d < first + DAYS_PER_BLOCK; d++) zone.dayStarts.set(d, offset);
  return offset;
}

/**
 * Offset of the zone from UTC at instant `time`, in milliseconds (local = UTC + offset).
 *
 * Two offset changes of a zone are always more than a day apart (the closest ones of the time zone database are 167
 * hours apart), so when a UTC day starts with the offset of the next day, the whole day has it: daily bars cost one
 * lookup per day. In a day with a change, an hour whose first and last second have the same offset has it (an offset
 * change happens at most once in an hour): it is computed once and cached.
 */
function offsetAt(zone: Zone, time: number): number {
  if (zone.kind === 'fixed') return zone.offsetMs;
  const day = Math.floor(time / MS_PER_DAY);
  const start = dayStartOffset(zone, day);
  if (start === dayStartOffset(zone, day + 1)) return start;
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

/** Last valid `Date` time on each side of 01/01/1970 (ms) */
const MAX_DATE_MS = 8.64e15;

/**
 * Year, month (1-12) and day of the month of a day count since 01/01/1970, in the proleptic Gregorian calendar as
 * `Date` reads it, by integer arithmetic (years counted from March, the leap day last).
 */
export function civilFromDays(days: number): { year: number; month: number; day: number } {
  const z = days + 719_468;
  const era = Math.floor(z / 146_097);
  const dayOfEra = z - era * 146_097;
  const yearOfEra = Math.floor(
    (dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36_524) - Math.floor(dayOfEra / 146_096)) / 365
  );
  const dayOfYear = dayOfEra - (yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const mp = Math.floor((5 * dayOfYear + 2) / 153);
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: yearOfEra + era * 400 + (month <= 2 ? 1 : 0), month, day: dayOfYear - Math.floor((153 * mp + 2) / 5) + 1 };
}

/**
 * Splits a UNIX time (ms) into calendar fields in `timezone`: the fields `Date` gives for the wall clock (whole ms,
 * NaN outside its range), computed without one as every bar reads them.
 */
export function zonedFields(time: number, timezone: string): ZonedFields {
  const wall = time + offsetAt(resolveZone(timezone), time);
  if (!(Math.abs(wall) <= MAX_DATE_MS)) {
    return { year: NaN, month: NaN, day: NaN, hour: NaN, minute: NaN, second: NaN, dayOfWeek: NaN };
  }
  const ms = Math.trunc(wall);
  const days = Math.floor(ms / MS_PER_DAY);
  const inDay = ms - days * MS_PER_DAY;
  const { year, month, day } = civilFromDays(days);
  return {
    year,
    month,
    day,
    hour: Math.floor(inDay / MS_PER_HOUR),
    minute: Math.floor(inDay / 60_000) % 60,
    second: Math.floor(inDay / MS_PER_SECOND) % 60,
    // 01/01/1970 is a Thursday (5)
    dayOfWeek: ((((days + 4) % 7) + 7) % 7) + 1,
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
  // a month of a year after 1582 (and before the end of the Date range) is Gregorian whatever the day: no need to
  // normalize the date
  if (year >= 1583 && year < 275_760 && month >= 1 && month < 13) return gregorian;
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

/**
 * UNIX time (ms) of a wall-clock date in `timezone`. A wall time skipped by a clock change is read with the offset
 * before the change (02:30 on a 02:00 -> 03:00 night is 03:30 after it); a wall time that occurs twice gives the
 * later instant, or the earlier one with `earlier`.
 */
export function zonedToUnix(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0,
  earlier: boolean = false
): number {
  const zone = resolveZone(timezone);
  const local = civilToUnix(year, month, day, hour, minute, second);
  if (zone.kind === 'fixed') return local - zone.offsetMs;

  // At most one offset transition happens within a day of `local`: the offsets
  // one day before and one day after are the two candidates.
  const before = offsetAt(zone, local - MS_PER_DAY);
  const after = offsetAt(zone, local + MS_PER_DAY);
  // the same offset on both sides: no change near `local`, the wall time is read with it
  if (before === after) return local - before;
  const withBefore = local - before;
  const withAfter = local - after;
  const beforeFits = local - offsetAt(zone, withBefore) === withBefore;
  const afterFits = local - offsetAt(zone, withAfter) === withAfter;
  // a wall time that occurs twice: the later instant, or the earlier one with `earlier`
  if (beforeFits && afterFits) return earlier ? Math.min(withBefore, withAfter) : Math.max(withBefore, withAfter);
  return afterFits ? withAfter : withBefore;
}
