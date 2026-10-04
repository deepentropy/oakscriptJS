/**
 * PineScript session strings ("0930-1600", "0930-1600:23456", "1000-1100,1400-1500:23456", "0930-1600|1000-1300:7",
 * "24x7").
 *
 * Grammar (measured on PineScript): `range[,range...][:days]`, several sections joined by "|".
 * - a range is exactly "HHMM-HHMM"; hours and minutes are minute counts taken modulo one day ("0930-2500" runs
 *   09:30 to 01:00, "0960-1600" 10:00 to 16:00); a start of 24:00 or later must open a run of at most a day
 * - days are digits 1 (Sunday) to 7 (Saturday), the day each run ends on
 * - a lone range without days runs every day; otherwise a section without days is the default section, which runs
 *   on the weekdays (2-6) no other section names, and a later section naming a day replaces the earlier ones on that
 *   day ("1100-1400|1200-1300:7": 11:00-14:00 Monday to Friday, 12:00-13:00 Saturday)
 * - a trailing ",", ":" or "|" ends its list ("1100-1400," is "1100-1400" Monday to Friday)
 * - an end before the start is an overnight run that belongs to the day it ends; equal ends are 24 hours;
 *   "0000-0000" and "24x7" are the whole day, every day
 * - a string that is empty or does not start with a digit ("regular", "extended") is the symbol's own session
 * - a malformed string ("1100 -1400", "0930-16", ":8") is an error, as the PineScript runtime error
 */

import { zonedFields } from './timezone.js';

const MINUTES_PER_DAY = 1440;
const WEEKDAYS = [2, 3, 4, 5, 6];
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** A run of a session: minutes after midnight (0-1439) and the days it ends on (1 = Sunday ... 7 = Saturday). */
export interface SessionRange {
  start: number;
  end: number;
  days: Set<number>;
}

function invalid(session: string): SyntaxError {
  return new SyntaxError(`Invalid session "${session}": expected "HHMM-HHMM[,HHMM-HHMM...][:days][|...]"`);
}

function parseRanges(text: string, session: string): Array<[number, number]> {
  if (!text) return [];
  const entries = text.split(',');
  if (entries.length > 1 && entries[entries.length - 1] === '') entries.pop();
  return entries.map((entry) => {
    if (!/^\d{4}-\d{4}$/.test(entry)) throw invalid(session);
    let start = Number(entry.slice(0, 2)) * 60 + Number(entry.slice(2, 4));
    let end = Number(entry.slice(5, 7)) * 60 + Number(entry.slice(7, 9));
    if (start >= MINUTES_PER_DAY) {
      const endOfRun = end || MINUTES_PER_DAY;
      if (!(start - MINUTES_PER_DAY < endOfRun && endOfRun <= start && start < 2 * MINUTES_PER_DAY)) throw invalid(session);
    }
    start %= MINUTES_PER_DAY;
    end %= MINUTES_PER_DAY;
    return [start, end];
  });
}

function parseDays(text: string, session: string): Set<number> {
  if (!/^[1-7]+$/.test(text)) throw invalid(session);
  return new Set([...text].map(Number));
}

const parsed = new Map<string, SessionRange[] | null>();

/**
 * Runs of a PineScript session string, or null for the symbol's own session (empty or not starting with a digit).
 * @throws SyntaxError when the string is malformed (a PineScript runtime error)
 */
export function parsePineSession(session: string): SessionRange[] | null {
  const cached = parsed.get(session);
  if (cached !== undefined) return cached;
  const spec = session.trim();
  let out: SessionRange[] | null;
  if (!spec || !/^\d/.test(spec)) {
    out = null;
  } else if (spec === '24x7') {
    out = [{ start: 0, end: 0, days: new Set(ALL_DAYS) }];
  } else if (!/[:,|]/.test(spec)) {
    out = parseRanges(spec, session).map(([start, end]) => ({ start, end, days: new Set(ALL_DAYS) }));
  } else {
    const sections = spec.split('|');
    if (sections.length > 1 && sections[sections.length - 1] === '') sections.pop();
    const items = sections.map((section) => {
      const parts = section.split(':');
      if (parts.length > 2) throw invalid(session);
      const ranges = parseRanges(parts[0]!, session);
      const days = parts.length === 1 || parts[1] === '' ? null : parseDays(parts[1]!, session);
      return { ranges, days };
    });
    if (items.filter((it) => it.days === null).length > 1) throw invalid(session);
    // a later section naming a day replaces the earlier ones on that day; the default section takes the weekdays
    // no other section names
    const own: Set<number>[] = items.map(() => new Set<number>());
    const claimed = new Set<number>();
    for (let i = items.length - 1; i >= 0; i--) {
      const days = items[i]!.days;
      if (days === null) continue;
      for (const d of days) if (!claimed.has(d)) own[i]!.add(d);
      for (const d of days) claimed.add(d);
    }
    items.forEach((it, i) => {
      if (it.days === null) for (const d of WEEKDAYS) if (!claimed.has(d)) own[i]!.add(d);
    });
    out = items.flatMap((it, i) => (own[i]!.size ? it.ranges.map(([start, end]) => ({ start, end, days: own[i]! })) : []));
  }
  parsed.set(session, out);
  return out;
}

/**
 * True when `time` falls inside `session`, with the session hours read in `timezone`.
 * A run includes its start minute and excludes its end minute.
 * @throws Error for the symbol's own session ("regular", "extended", ""), which this function does not know: use
 * `time(timeframe, session)` in a script with the chart session
 */
export function inSession(time: number, session: string, timezone: string): boolean {
  if (Number.isNaN(time)) return false;
  const ranges = parsePineSession(session);
  if (ranges === null) throw new Error(`Session "${session}" is the symbol session: it needs the chart session (time(timeframe, session) in a script)`);
  const f = zonedFields(time, timezone);
  const minute = f.hour * 60 + f.minute;
  const nextDay = (f.dayOfWeek % 7) + 1;
  for (const { start, end, days } of ranges) {
    if (start < end || (start === 0 && end === 0)) {
      if (minute >= start && (minute < end || end === 0) && days.has(f.dayOfWeek)) return true;
    } else {
      // Overnight (24 hours when start === end): the part from `start` belongs to the next day.
      if (minute >= start && days.has(nextDay)) return true;
      if (minute < end && days.has(f.dayOfWeek)) return true;
    }
  }
  return false;
}
