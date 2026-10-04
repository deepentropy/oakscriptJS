/**
 * Date strings of `timestamp(dateString)`: IETF RFC 2822 and ISO 8601.
 *
 * Accepted forms (case-insensitive), all with an optional time zone at the end:
 * - "2020-02-20", "2020-2-5", "2020/02/20", "2020-02-20 14:48", "2020-02-20 9:30:15"
 * - "2020-02-20T14:48:00", "2020-02-20T14:48:00.250", "2020-02-20T14:48:00+05:30"
 * - "20 Feb 2020", "5-Jan-2024", "Thu, 20 Feb 2020 14:48:00", "20 February 2020 14:48"
 * - "Feb 20 2020 14:48:05", "Jan 5, 2024 09:30"
 *
 * Time zones: "UT", "UTC", "GMT", "+0530", "-05:00", "GMT+5", "UTC-0300", and the RFC 2822
 * names EST, EDT, CST, CDT, MST, MDT, PST, PDT. After a "T" time, only numeric offsets.
 * Without a time the time is 00:00. Without a time zone the time zone is GMT+0.
 * "2025" and "2025-06" are the first day of the year / month. "01 Jan 2022 GMT+3" (a zone without a time) gives na.
 * "24:00" is midnight at the end of the day.
 *
 * "Z", "2024-01-01T09:30:00 GMT", "24:30" and "09:30:60" are compile errors in PineScript, and
 * errors here.
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const FULL_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** RFC 2822 obsolete zone names, in hours from UTC. */
const ZONE_NAMES: Record<string, number> = {
  ut: 0, utc: 0, gmt: 0,
  est: -5, edt: -4, cst: -6, cdt: -5, mst: -7, mdt: -6, pst: -8, pdt: -7,
};

const TIME = String.raw`(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?`;
const ZONE = String.raw`(ut|utc|gmt|[ecmp][sd]t|(?:utc|gmt)?\s*[+-]\d{1,2}(?::?\d{2})?)`;
const NUMERIC_ZONE = String.raw`([+-]\d{2}(?::?\d{2})?)`;
const DATE = String.raw`(\d{4})([-/])(\d{1,2})\2(\d{1,2})`;
const WEEKDAY = String.raw`(?:[a-z]{3,9},?\s+)?`;

const YEAR_MONTH = /^(\d{4})(?:-(\d{1,2}))?$/;
const ISO_T = new RegExp(String.raw`^${DATE}t${TIME}\s*${NUMERIC_ZONE}?$`, 'i');
const ISO = new RegExp(String.raw`^${DATE}(?:\s+${TIME})?\s*${ZONE}?$`, 'i');
const DAY_FIRST = new RegExp(String.raw`^${WEEKDAY}(\d{1,2})(?:\s+|-)([a-z]+)\.?,?(?:\s+|-)(\d{4})(?:,?\s+${TIME})?\s*${ZONE}?$`, 'i');
const MONTH_FIRST = new RegExp(String.raw`^${WEEKDAY}([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})(?:,?\s+${TIME})?\s*${ZONE}?$`, 'i');

/** Month number (1-12) of an English month name or its prefix of 3+ letters ("Sep", "Sept", "September"). */
function monthNumber(name: string): number {
  const lower = name.toLowerCase();
  const i = FULL_MONTHS.findIndex((full, k) => lower.startsWith(MONTHS[k]!) && full.startsWith(lower));
  return i + 1;
}

/** Zone offset in minutes from UTC. */
function zoneMinutes(zone: string | undefined): number {
  if (!zone) return 0;
  const lower = zone.toLowerCase().replace(/\s+/g, '');
  const named = ZONE_NAMES[lower];
  if (named !== undefined) return named * 60;
  const m = /^(?:utc|gmt)?([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(lower);
  if (!m) return NaN;
  const minutes = Number(m[2]) * 60 + (m[3] ? Number(m[3]) : 0);
  return m[1] === '-' ? -minutes : minutes;
}

/**
 * Parses a PineScript date string into a UNIX time in milliseconds.
 * @throws SyntaxError when the string is not in a supported form
 */
export function parseDateString(dateString: string): number {
  const text = dateString.trim();
  let year: string, month: number, day: string;
  let rest: Array<string | undefined>;

  let m: RegExpExecArray | null;
  // "2025" and "2025-06": the first day of the year / month, 00:00 UTC (PineScript)
  if ((m = YEAR_MONTH.exec(text))) {
    const mo = m[2] ? Number(m[2]) : 1;
    if (mo < 1 || mo > 12) throw new SyntaxError(`Invalid date string "${dateString}": a field is out of range`);
    return Date.UTC(Number(m[1]), mo - 1, 1);
  }
  if ((m = ISO_T.exec(text) ?? ISO.exec(text))) {
    [year, month, day] = [m[1]!, Number(m[3]), m[4]!];
    rest = m.slice(5);
  } else if ((m = DAY_FIRST.exec(text))) {
    [day, month, year] = [m[1]!, monthNumber(m[2]!), m[3]!];
    rest = m.slice(4);
    // a time zone without a time ("01 Jan 2022 GMT+3") gives na in PineScript
    if (rest[0] === undefined && rest[4] !== undefined) return NaN;
  } else if ((m = MONTH_FIRST.exec(text))) {
    [month, day, year] = [monthNumber(m[1]!), m[2]!, m[3]!];
    rest = m.slice(4);
  } else {
    throw new SyntaxError(`Invalid date string "${dateString}": use RFC 2822 or ISO 8601 ("20 Feb 2020", "2020-02-20T14:48:00")`);
  }

  const [hour = '0', minute = '0', second = '0', millis = '0', zone] = rest;
  const d = Number(day);
  const h = Number(hour);
  const mi = Number(minute);
  const s = Number(second);
  const offset = zoneMinutes(zone);
  const endOfDay = h === 24 && mi === 0 && s === 0 && Number(millis) === 0;
  if (month < 1 || month > 12 || d < 1 || d > 31 || (h > 23 && !endOfDay) || mi > 59 || s > 59 || Number.isNaN(offset)) {
    throw new SyntaxError(`Invalid date string "${dateString}": a field is out of range`);
  }
  const ms = Number(millis.padEnd(3, '0'));
  return Date.UTC(Number(year), month - 1, d, h, mi, s, ms) - offset * 60_000;
}
