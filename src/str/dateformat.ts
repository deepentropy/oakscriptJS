/**
 * Date patterns of `str.format_time` and `str.format("{0,date,...}")`, as formats them
 * (Java SimpleDateFormat letters, English names). (30/09/2026, see
 * partb-check/doc/README.md):
 *
 * y year, M month (M, MM, MMM, MMMM), d day, E weekday (EEE, EEEE), u weekday number (1 = Monday),
 * D day of year, w week of year (weeks start on Sunday, week 1 contains 1 January), H hour 0-23,
 * k hour 1-24, K hour 0-11, h hour 1-12, a AM/PM, m minute, s second, S millisecond,
 * Z offset (+0530), z time zone name, 'text' literal text ('' is a quote).
 *
 * `z` gives "UTC" for Etc/UTC, "GMT" for "UTC"/"GMT", "GMT+05:00" for other offsets, and the
 * host's short English name for IANA zones (names can differ, e.g. "IST" for Asia/Kolkata).
 */

import { zonedFields, zoneOffset } from '../time/timezone';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

function zoneName(time: number, timezone: string, offsetMs: number): string {
  if (timezone === 'Etc/UTC') return 'UTC';
  if (/^(UTC|GMT)/.test(timezone)) {
    if (offsetMs === 0) return 'GMT';
    const minutes = Math.abs(offsetMs) / 60000;
    return `GMT${offsetMs < 0 ? '-' : '+'}${pad(Math.floor(minutes / 60), 2)}:${pad(minutes % 60, 2)}`;
  }
  const part = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
    .formatToParts(time)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? timezone;
}

/** Week of year: weeks start on Sunday and week 1 is the week that contains 1 January. */
function weekOfYear(year: number, month: number, day: number): number {
  const date = Date.UTC(year, month - 1, day);
  const dow = new Date(date).getUTCDay();
  const weekStart = date - dow * 86_400_000;
  // the week that contains 1 January of the next year is week 1
  if (weekStart + 6 * 86_400_000 >= Date.UTC(year + 1, 0, 1)) return 1;
  const jan1 = Date.UTC(year, 0, 1);
  const jan1Dow = new Date(jan1).getUTCDay();
  return Math.floor((date - jan1 + jan1Dow * 86_400_000) / (7 * 86_400_000)) + 1;
}

/** Formats a UNIX time (ms) with a SimpleDateFormat pattern in `timezone`. */
export function formatDate(time: number, pattern: string, timezone: string): string {
  if (Number.isNaN(time)) return 'NaN';
  const f = zonedFields(time, timezone);
  const offset = zoneOffset(time, timezone);
  const ms = ((time % 1000) + 1000) % 1000;
  const dayOfYear = (Date.UTC(f.year, f.month - 1, f.day) - Date.UTC(f.year, 0, 1)) / 86_400_000 + 1;

  let out = '';
  for (let i = 0; i < pattern.length; ) {
    const ch = pattern[i]!;
    if (ch === "'") {
      const end = pattern.indexOf("'", i + 1);
      if (end === i + 1) {
        out += "'";
        i += 2;
      } else {
        out += pattern.slice(i + 1, end === -1 ? undefined : end);
        i = end === -1 ? pattern.length : end + 1;
      }
      continue;
    }
    if (!/[A-Za-z]/.test(ch)) {
      out += ch;
      i++;
      continue;
    }
    let n = 1;
    while (pattern[i + n] === ch) n++;
    i += n;
    const hour12 = f.hour % 12;
    switch (ch) {
      case 'y': out += n === 2 ? pad(f.year % 100, 2) : pad(f.year, n); break;
      case 'M': out += n >= 4 ? MONTHS[f.month - 1] : n === 3 ? MONTHS[f.month - 1]!.slice(0, 3) : pad(f.month, n); break;
      case 'd': out += pad(f.day, n); break;
      case 'E': out += n >= 4 ? DAYS[f.dayOfWeek - 1] : DAYS[f.dayOfWeek - 1]!.slice(0, 3); break;
      case 'u': out += pad(f.dayOfWeek === 1 ? 7 : f.dayOfWeek - 1, n); break;
      case 'D': out += pad(dayOfYear, n); break;
      case 'w': out += pad(weekOfYear(f.year, f.month, f.day), n); break;
      case 'H': out += pad(f.hour, n); break;
      case 'k': out += pad(f.hour === 0 ? 24 : f.hour, n); break;
      case 'K': out += pad(hour12, n); break;
      case 'h': out += pad(hour12 === 0 ? 12 : hour12, n); break;
      case 'a': out += f.hour < 12 ? 'AM' : 'PM'; break;
      case 'm': out += pad(f.minute, n); break;
      case 's': out += pad(f.second, n); break;
      case 'S': out += pad(ms, n); break;
      case 'Z': {
        const minutes = Math.abs(offset) / 60000;
        out += (offset < 0 ? '-' : '+') + pad(Math.floor(minutes / 60), 2) + pad(minutes % 60, 2);
        break;
      }
      case 'z': out += zoneName(time, timezone, offset); break;
      default: throw new SyntaxError(`Unsupported date pattern letter "${ch}" in "${pattern}"`);
    }
  }
  return out;
}
