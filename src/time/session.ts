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
 * - a run that ends at 0000 ("2000-0000") ends at 24:00 of the day it starts and belongs to that day
 *   ("2000-0000:6" is Friday 20:00 to midnight)
 * - a string that is empty or does not start with a digit ("regular", "extended") is the symbol's own session
 * - a malformed string ("1100 -1400", "0930-16", ":8") is an error, as the PineScript runtime error
 */

import { zoneOffset, zonedFields } from './timezone.js';

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

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
/** A clock change is looked for this far on each side of the tested time. */
const CHANGE_WINDOW = 36 * MS_PER_HOUR;

/** The clock change of `timezone` within 36 hours of `time`: its UNIX time and the offsets (ms) around it. */
function clockChangeNear(time: number, timezone: string): { at: number; before: number; after: number } | null {
  let lo = time - CHANGE_WINDOW;
  let hi = time + CHANGE_WINDOW;
  const before = zoneOffset(lo, timezone);
  const after = zoneOffset(hi, timezone);
  if (before === after) return null;
  while (hi - lo > MS_PER_MINUTE) {
    const mid = Math.floor((lo + hi) / 2 / MS_PER_MINUTE) * MS_PER_MINUTE;
    if (zoneOffset(mid, timezone) === before) lo = mid;
    else hi = mid;
  }
  return { at: hi, before, after };
}

/**
 * True when `time` falls inside `session`, with the session hours read in `timezone`.
 * A run includes its start minute and excludes its end minute.
 *
 * On the days around a clock change PineScript does not read the wall clock of each bar; it places each run of
 * each local day (measured on 15- and 5-minute bars, clocks going forward and back, four time zones):
 * - a wall time of the day is placed with the offset before the change when it is before the wall time of the
 *   change (02:00 for 02:00 -> 03:00, 03:00 for 03:00 -> 02:00), with the offset after it otherwise. Forward
 *   change: "0100-0300" lasts one hour and "0130-0230" is empty; back change: "0230-0330" lasts two hours
 * - a run that ends exactly on the wall time of the change is placed with the offset after the change at both ends
 *   (forward change: "0100-0200" is one hour earlier than the wall clock says)
 * - clocks going back: a run that ends inside the repeated hour also covers its second pass
 * - clocks going back, the day BEFORE the change: a run with a start or an end on the wall time of the change is
 *   also true one hour (the amount of the change) later, from one bar after its usual end. This needs the bar
 *   duration `barMs`; without it the rule is not applied
 *
 * @param barMs - Duration of the bars in ms (the chart timeframe); only used by the last rule
 * @throws Error for the symbol's own session ("regular", "extended", ""), which this function does not know: use
 * `time(timeframe, session)` in a script with the chart session
 */
export function inSession(time: number, session: string, timezone: string, barMs?: number): boolean {
  if (Number.isNaN(time)) return false;
  const ranges = parsePineSession(session);
  if (ranges === null) throw new Error(`Session "${session}" is the symbol session: it needs the chart session (time(timeframe, session) in a script)`);
  const change = clockChangeNear(time, timezone);
  const f = zonedFields(time, timezone);
  const minute = f.hour * 60 + f.minute;
  const nextDay = (f.dayOfWeek % 7) + 1;
  for (const { start, end: rawEnd, days } of ranges) {
    if (start === rawEnd) {
      // 24 hours: the run belongs to the day it ends ("0000-0000": the day itself)
      if (days.has(start === 0 || minute < start ? f.dayOfWeek : nextDay)) return true;
      continue;
    }
    // a run that ends at 0000 ends at 24:00 of the day it starts
    const end = rawEnd === 0 ? MINUTES_PER_DAY : rawEnd;
    const overnight = start > end;
    if (!change) {
      if (!overnight) {
        if (minute >= start && minute < end && days.has(f.dayOfWeek)) return true;
      } else {
        // the part from `start` belongs to the next day
        if (minute >= start && days.has(nextDay)) return true;
        if (minute < end && days.has(f.dayOfWeek)) return true;
      }
      continue;
    }
    // local days as naive instants (wall clock read as UTC)
    const changeWall = change.at + change.before;
    const place = (naive: number): number => (naive < changeWall ? naive - change.before : naive - change.after);
    const today = Math.floor((time + change.before) / MS_PER_DAY);
    for (let day = today - 1; day <= today + 1; day++) {
      if (!days.has(((day + 4) % 7) + 1)) continue; // 01/01/1970 is a Thursday (5)
      const from = day * MS_PER_DAY + (overnight ? start - MINUTES_PER_DAY : start) * MS_PER_MINUTE;
      const to = day * MS_PER_DAY + end * MS_PER_MINUTE;
      if (to === changeWall) {
        if (time >= from - change.after && time < to - change.after) return true;
        continue;
      }
      if (time >= place(from) && time < place(to)) return true;
      // clocks going back: the second pass of the repeated hour
      const repeated = change.at + change.after;
      if (change.after < change.before && to < changeWall && to > repeated) {
        if (time >= Math.max(from, repeated) - change.after && time < to - change.after) return true;
      }
    }
    // clocks going back, the day before: a run with an end on the wall time of the change is also true one change
    // later, from one bar after its usual end
    if (barMs !== undefined && change.after < change.before) {
      const day = Math.floor(changeWall / MS_PER_DAY) - 1;
      const wallMinute = (changeWall - (day + 1) * MS_PER_DAY) / MS_PER_MINUTE;
      if ((start === wallMinute || end === wallMinute) && days.has(((day + 4) % 7) + 1)) {
        const from = day * MS_PER_DAY + (overnight ? start - MINUTES_PER_DAY : start) * MS_PER_MINUTE - change.before;
        const to = day * MS_PER_DAY + end * MS_PER_MINUTE - change.before;
        const shift = change.before - change.after;
        if (time >= from + shift && time < to + shift && time >= to + barMs) return true;
      }
    }
  }
  return false;
}
