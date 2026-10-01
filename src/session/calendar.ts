/**
 * Trading calendar: the session periods of each trading day of a symbol, from the symbol session
 * information (issue #100).
 *
 * Session format (symbol session information, also PineScript session strings):
 * - periods "HHMM-HHMM", several separated by commas; "24x7" is the whole day, every day
 * - a period whose end is not after its start ("1700-1600", "1700-1700") starts the day before the
 *   trading day: the session that opens Sunday 17:00 is Monday's
 * - "HHMMF<n>" moves a time <n> days before the trading day ("1700F2-1200F1")
 * - optional days after ":" (1 = Sunday ... 7 = Saturday); without days a symbol session trades Monday to
 *   Friday ("24x7": every day), and a PineScript session string follows PineScript's rules (one period:
 *   every day; several periods: Monday to Friday)
 * - "#YYYYMMDD/<session>" changes the session from that date ("0900-1746#20251201/0800-2200")
 * - corrections ("session-correction"): "<session>:<dates>;dayoff:<dates>" replace the session of these
 *   dates (early closes, days off); holidays ("session_holidays") are dates without session
 */

import { zonedFields, zonedToUnix } from '../time/timezone.js';

/** Session information of a symbol (hours, corrections, holidays). */
export interface SessionSpec {
  /** Session hours: "0930-1600", "1700-1600", "24x7", "0400-2000" ... */
  session: string;
  /** Exceptions by date (symbol info "session-correction"): "0930-1300:20251128,20251224;dayoff:20250109" */
  corrections?: string;
  /** Exchange holidays as "YYYYMMDD" (symbol info "session_holidays"), comma-separated or as an array */
  holidays?: string | string[];
}

/** Date as YYYYMMDD. */
export type DateNum = number;

interface Period {
  /** Minutes after midnight */
  start: number;
  end: number;
  /** Days before the trading day */
  startOffset: number;
  endOffset: number;
}

interface Version {
  from: DateNum;
  periods: Period[];
  /** Index 1 (Sunday) to 7 (Saturday) */
  days: boolean[];
}

export const toDateNum = (y: number, m: number, d: number): DateNum => y * 10000 + m * 100 + d;
const utcOf = (date: DateNum): number => Date.UTC(Math.floor(date / 10000), Math.floor(date / 100) % 100 - 1, date % 100);
const fromUtc = (ms: number): DateNum => {
  const d = new Date(ms);
  return toDateNum(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
};
export const addDays = (date: DateNum, n: number): DateNum => fromUtc(utcOf(date) + n * 86_400_000);
/** 1 = Sunday ... 7 = Saturday */
export const weekdayOf = (date: DateNum): number => new Date(utcOf(date)).getUTCDay() + 1;
/** 00:00 UTC of the date, in ms (PineScript `time_tradingday`). */
export const dateUtcMs = utcOf;

function parseTime(token: string, spec: string): { minutes: number; offset?: number } {
  const m = /^(\d{2})(\d{2})(?:F(\d+))?$/.exec(token.trim());
  if (!m) throw new SyntaxError(`Invalid session "${spec}"`);
  return { minutes: Number(m[1]) * 60 + Number(m[2]), offset: m[3] === undefined ? undefined : Number(m[3]) };
}

function parsePeriods(text: string, spec: string): Period[] {
  if (text.trim() === '24x7') return [{ start: 0, end: 1440, startOffset: 0, endOffset: 0 }];
  return text.split(',').map((p) => {
    const [a = '', b = ''] = p.split('-');
    const s = parseTime(a, spec);
    const e = parseTime(b, spec);
    if (s.minutes === 0 && e.minutes === 0 && s.offset === undefined && e.offset === undefined) {
      return { start: 0, end: 1440, startOffset: 0, endOffset: 0 };
    }
    return {
      start: s.minutes,
      end: e.minutes,
      startOffset: s.offset ?? (e.minutes <= s.minutes ? 1 : 0),
      endOffset: e.offset ?? 0,
    };
  });
}

function parseVersion(text: string, from: DateNum, spec: string, rule: 'symbol' | 'pine'): Version {
  const [periodText = '', dayText] = text.trim().split(':');
  const periods = parsePeriods(periodText, spec);
  const allDays = periodText.trim() === '24x7' || (rule === 'pine' && periods.length === 1);
  const digits = dayText ?? (allDays ? '1234567' : '23456');
  if (!/^[1-7]+$/.test(digits)) throw new SyntaxError(`Invalid session days in "${spec}"`);
  const days = new Array<boolean>(8).fill(false);
  for (const d of digits) days[Number(d)] = true;
  return { from, periods, days };
}

/** Session periods of every trading day of a symbol, as UNIX times (ms). */
export class TradingCalendar {
  private readonly versions: Version[];
  private readonly corrections = new Map<DateNum, Period[] | null>();
  private readonly holidays: Set<DateNum>;
  private readonly cache = new Map<DateNum, Array<[number, number]>>();

  /**
   * @param timezone - Time zone of the session hours (the exchange time zone)
   * @param spec - Session information (hours, corrections, holidays)
   * @param rule - Days without ":days": 'symbol' (Monday to Friday) or 'pine' (PineScript session strings)
   */
  constructor(
    readonly timezone: string,
    spec: SessionSpec,
    rule: 'symbol' | 'pine' = 'symbol'
  ) {
    const [first = '', ...changes] = spec.session.split('#');
    this.versions = [parseVersion(first, 0, spec.session, rule)];
    for (const change of changes) {
      const m = /^(\d{8})\/(.+)$/.exec(change.trim());
      if (!m) throw new SyntaxError(`Invalid session change in "${spec.session}"`);
      this.versions.push(parseVersion(m[2]!, Number(m[1]), spec.session, rule));
    }
    for (const part of (spec.corrections ?? '').split(';').filter((p) => p.trim())) {
      const i = part.lastIndexOf(':');
      const text = part.slice(0, i).trim();
      const periods = text === 'dayoff' ? null : parsePeriods(text, part);
      for (const date of part.slice(i + 1).split(',')) this.corrections.set(Number(date), periods);
    }
    const holidays = Array.isArray(spec.holidays) ? spec.holidays : (spec.holidays ?? '').split(',');
    this.holidays = new Set(holidays.filter((h) => h.trim()).map(Number));
  }

  /** Session periods [start, end) of the trading day `date`; empty when the day has no session. */
  periods(date: DateNum): Array<[number, number]> {
    let out = this.cache.get(date);
    if (out) return out;
    let periods: Period[] = [];
    const correction = this.corrections.get(date);
    if (correction !== undefined) {
      periods = correction ?? [];
    } else if (!this.holidays.has(date)) {
      const version = [...this.versions].reverse().find((v) => v.from <= date)!;
      if (version.days[weekdayOf(date)]) periods = version.periods;
    }
    const y = Math.floor(date / 10000);
    const m = Math.floor(date / 100) % 100;
    const d = date % 100;
    out = periods.map((p) => [
      zonedToUnix(this.timezone, y, m, d - p.startOffset, Math.floor(p.start / 60), p.start % 60),
      zonedToUnix(this.timezone, y, m, d - p.endOffset, Math.floor(p.end / 60), p.end % 60),
    ]);
    this.cache.set(date, out);
    return out;
  }

  isTradingDay(date: DateNum): boolean {
    return this.periods(date).length > 0;
  }

  /**
   * Trading day and period of a time: the period that contains it, else the last period that started
   * before it. Null when no trading day is found near the time.
   */
  locate(time: number): { date: DateNum; index: number; inside: boolean } | null {
    const f = zonedFields(time, this.timezone);
    const local = toDateNum(f.year, f.month, f.day);
    for (let k = 0; k <= 5; k++) {
      const date = addDays(local, k);
      const index = this.periods(date).findIndex(([s, e]) => s <= time && time < e);
      if (index !== -1) return { date, index, inside: true };
    }
    for (let k = 5; k >= -7; k--) {
      const date = addDays(local, k);
      const periods = this.periods(date);
      let index = -1;
      periods.forEach(([s], i) => {
        if (s <= time) index = i;
      });
      if (index !== -1) return { date, index, inside: false };
    }
    return null;
  }

  /** First trading day in [from, to] (dates), or null. */
  firstTradingDay(from: DateNum, to: DateNum): DateNum | null {
    for (let date = from; date <= to; date = addDays(date, 1)) if (this.isTradingDay(date)) return date;
    return null;
  }

  /** Last trading day in [from, to] (dates), or null. */
  lastTradingDay(from: DateNum, to: DateNum): DateNum | null {
    for (let date = to; date >= from; date = addDays(date, -1)) if (this.isTradingDay(date)) return date;
    return null;
  }
}

/** Monday of the week of `date` (weeks run Monday to Sunday). */
export const weekStart = (date: DateNum): DateNum => addDays(date, -((weekdayOf(date) + 5) % 7));
/** First day of the month of `date`. */
export const monthStart = (date: DateNum): DateNum => Math.floor(date / 100) * 100 + 1;
/** Last day of the month of `date`. */
export const monthEnd = (date: DateNum): DateNum => addDays(monthStart(addDays(monthStart(date), 32)), -1);
