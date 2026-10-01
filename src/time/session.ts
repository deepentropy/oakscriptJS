/**
 * Session strings ("0930-1600", "0930-1600:23456", "1000-1100,1400-1500:23456", "24x7").
 *
 * Format `<periods>[:<days>]`:
 * - a period is "HHmm-HHmm"; several periods are separated by commas
 * - days are digits 1 (Sunday) to 7 (Saturday). Without days, a single period covers every
 *   day, and several periods cover Monday to Friday ("23456"), as in PineScript
 * - an end before the start is an overnight period that ends on the next day, and it
 *   belongs to the day it ends: "1700-1700:23456" starts Sunday 17:00 and covers Monday
 * - "0000-0000" and "24x7" are the 24-hour session of every day
 */

import { zonedFields } from './timezone.js';

interface Period {
  /** Minutes after midnight, 0-1439 */
  start: number;
  end: number;
}

interface ParsedSession {
  periods: Period[];
  /** Included days, indexed 1 (Sunday) to 7 (Saturday) */
  days: boolean[];
}

const PERIOD = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/;

const sessions = new Map<string, ParsedSession>();

function parseSession(session: string): ParsedSession {
  let parsed = sessions.get(session);
  if (parsed) return parsed;

  const invalid = () => new SyntaxError(`Invalid session "${session}": expected "HHmm-HHmm[,HHmm-HHmm...][:days]"`);
  const text = session.trim() === '24x7' ? '0000-0000' : session.replace(/\s+/g, '');
  const [periodText = '', dayText, extra] = text.split(':');
  if (extra !== undefined || periodText === '') throw invalid();

  const periods = periodText.split(',').map((p) => {
    const m = PERIOD.exec(p);
    if (!m) throw invalid();
    const [h1, m1, h2, m2] = [m[1], m[2], m[3], m[4]].map(Number) as [number, number, number, number];
    if (h1 > 23 || h2 > 23 || m1 > 59 || m2 > 59) throw invalid();
    return { start: h1 * 60 + m1, end: h2 * 60 + m2 };
  });

  const dayDigits = dayText ?? (periods.length > 1 ? '23456' : '1234567');
  if (!/^[1-7]+$/.test(dayDigits)) throw invalid();
  const days = new Array<boolean>(8).fill(false);
  for (const d of dayDigits) days[Number(d)] = true;

  parsed = { periods, days };
  sessions.set(session, parsed);
  return parsed;
}

/**
 * True when `time` falls inside `session`, with the session hours read in `timezone`.
 * A period includes its start minute and excludes its end minute.
 */
export function inSession(time: number, session: string, timezone: string): boolean {
  if (Number.isNaN(time)) return false;
  const { periods, days } = parseSession(session);
  const f = zonedFields(time, timezone);
  const minute = f.hour * 60 + f.minute;
  const nextDay = (f.dayOfWeek % 7) + 1;

  for (const { start, end } of periods) {
    if (start < end || (start === 0 && end === 0)) {
      if (minute >= start && (minute < end || end === 0) && days[f.dayOfWeek]) return true;
    } else {
      // Overnight (24 hours when start === end): the part from `start` belongs to the next day.
      if (minute >= start && days[nextDay]) return true;
      if (minute < end && days[f.dayOfWeek]) return true;
    }
  }
  return false;
}
