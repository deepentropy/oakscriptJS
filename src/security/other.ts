/**
 * PineScript `request.security(symbol, timeframe, expression, gaps, lookahead)` of another symbol: which bar of the
 * other symbol each chart bar shows (#179). The bars of the other symbol are given by the caller, already on the
 * requested timeframe; the expression is computed on them and its values are mapped to the chart bars with the index
 * given here. The script API does this with the `bars` accessor of its chart context.
 *
 * PineScript rules (measured on stocks, crypto and an exchange whose trading day starts on the previous UTC day; the
 * chart timeframe, D, W and M on intraday and daily charts; the four gaps / lookahead combinations):
 * - lookahead off: the last bar of the other symbol whose close time is at or before the close time of the chart bar
 *   (a daily stock bar closes at the session end, a crypto daily bar at 00:00 UTC: a stock chart shows the crypto
 *   bar of the day before, a crypto chart the stock bar of the same day)
 * - lookahead on, intraday chart: the last bar of the other symbol that opened at or before the open of the chart bar
 * - lookahead on, D / W / M chart: the last bar of the other symbol whose period starts at or before the trading day
 *   of the chart bar: the trading day of a D bar, the Monday of a W bar, the first day of the month of an M bar, each
 *   in the exchange time zone of its symbol (a week that opens on a Tuesday after a holiday still starts on Monday)
 * - before the first bar of the other symbol: na; on chart bars where the other symbol has no bar (weekends,
 *   holidays, closed hours), gaps off repeats the last value
 * - gaps on: a value only on the chart bar where the shown bar changes (and on the first chart bar), na on the others
 * - the last bar while it is open (`lastBarConfirmed` false) with gaps off: the realtime update shows the bar given by
 *   lookahead on (the open bar of a higher timeframe), with lookahead off as well
 *
 * Close times, trading days and time zones come from the exchange calendars of the chart and of the other symbol
 * (time zone and session, read by the session functions). Without them:
 * - a symbol that trades every day (bars on Saturdays or Sundays; W bars at Monday 00:00 UTC; M bars on the first day
 *   at 00:00 UTC) is on the "24x7" UTC calendar
 * - another symbol whose bars open where the chart calendar starts its periods is on the calendar of the chart
 * - else the UTC rule: an intraday bar closes one bar interval after its open (or at the next bar), a D / W / M bar at
 *   the end of the last weekday (UTC) of its day / week / month; the trading day is the UTC date of the bar
 * The fallback is exact between symbols of the same calendar and with 24x7 symbols; between a stock and a 24x7 symbol,
 * or an exchange whose trading day starts on the previous UTC day, it needs the session of the stock.
 *
 * @module security/other
 */

import * as timeframe from '../timeframe/index.js';
import { chartSessions, periodClose, periodTime, tradingDayTime, type SessionContext } from '../session/context.js';
import type { SessionSpec } from '../session/calendar.js';

const DAY = 86_400_000;

/** Exchange calendar of a symbol: time zone and session (hours, corrections, holidays). */
export interface SymbolCalendar {
  timezone?: string;
  session?: SessionSpec | string;
}

/** Options of {@link securityOther}. */
export interface OtherSymbolOptions {
  /** PineScript `barmerge.lookahead_on`; default false */
  lookahead?: boolean;
  /** PineScript `barmerge.gaps_on`; default false */
  gaps?: boolean;
  /** Calendar of the other symbol; see the module notes for the fallback */
  other?: SymbolCalendar;
}

/** The chart: its timeframe, calendar, time unit and whether its last bar is closed. */
export interface OtherSymbolChart extends SymbolCalendar {
  /** Chart timeframe ("60", "1D"...) */
  timeframe: string;
  /** Unit of the bar times: 's' (default) or 'ms' */
  timeUnit?: 's' | 'ms';
  /** false: the last chart bar is still open (realtime rule) */
  lastBarConfirmed?: boolean;
}

interface Zone {
  timezone: string;
  session: SessionSpec | string;
}

const calendars = new Map<string, SessionContext | null>();

/** The session context of a zone and a timeframe (bar times in ms); null when the session cannot be read. */
function calendarOf(zone: Zone | null, tf: string): SessionContext | null {
  if (!zone) return null;
  const key = `${zone.timezone}|${typeof zone.session === 'string' ? zone.session : JSON.stringify(zone.session)}|${tf}`;
  let context = calendars.get(key);
  if (context === undefined) {
    context = { timeframe: tf, timezone: zone.timezone, session: zone.session, timeUnit: 'ms' };
    try {
      chartSessions(context);
    } catch {
      context = null;
    }
    if (calendars.size > 64) calendars.clear();
    calendars.set(key, context);
  }
  return context;
}

const UTC_24X7: Zone = { timezone: 'Etc/UTC', session: '24x7' };

/** True when bars of timeframe `tf` opening at `times` (ms) are those of a symbol that trades every day in UTC. */
function tradesEveryDay(times: number[], tf: string): boolean {
  if (times.length === 0) return false;
  const info = timeframe.info(tf);
  if (info.isweekly) return times.every((t) => t % DAY === 0 && new Date(t).getUTCDay() === 1);
  if (info.ismonthly) return times.every((t) => t % DAY === 0 && new Date(t).getUTCDate() === 1);
  return times.some((t) => {
    const wd = new Date(t).getUTCDay();
    return wd === 0 || wd === 6;
  });
}

/** True when most of the last bars open at the start of a period of `tf` on the calendar `zone`. */
function onCalendar(times: number[], tf: string, zone: Zone | null): boolean {
  const calendar = calendarOf(zone, tf);
  if (!calendar || times.length === 0) return false;
  const last = times.slice(-50);
  return last.filter((t) => periodTime(t, tf, calendar) === t).length >= 0.9 * last.length;
}

const utcDay = (t: number): number => Math.floor(t / DAY) * DAY;
/** Monday 00:00 UTC of the week of the day `day` (00:00 UTC, ms). */
const weekStart = (day: number): number => day - ((new Date(day).getUTCDay() + 6) % 7) * DAY;
const monthStart = (day: number): number => {
  const d = new Date(day);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
};

/** 00:00 UTC after the last weekday before `end` (00:00 UTC, ms): the end of a period of a Monday-to-Friday symbol. */
function afterLastWeekday(end: number): number {
  let day = end - DAY;
  while (new Date(day).getUTCDay() % 6 === 0) day -= DAY;
  return day + DAY;
}

/** Close time (ms) of each bar of timeframe `tf` opening at `times` (ms). */
function closeTimes(times: number[], tf: string, zone: Zone | null): number[] {
  const calendar = calendarOf(zone, tf);
  const info = timeframe.info(tf);
  const len = timeframe.in_seconds(tf) * 1000;
  return times.map((t, i) => {
    if (calendar) {
      const c = periodClose(t, tf, calendar);
      if (!Number.isNaN(c)) return c;
    }
    if (info.isintraday) return i + 1 < times.length ? Math.min(t + len, times[i + 1]!) : t + len;
    const day = utcDay(t);
    if (info.isweekly) return afterLastWeekday(weekStart(day) + 7 * DAY * info.multiplier);
    if (info.ismonthly) {
      const d = new Date(day);
      return afterLastWeekday(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + info.multiplier, 1));
    }
    return day + DAY * info.multiplier;
  });
}

/** Trading day (00:00 UTC, ms) of each bar opening at `times` (ms): its date in the exchange time zone. */
function tradingDays(times: number[], zone: Zone | null): number[] {
  const calendar = calendarOf(zone, '1D');
  return times.map((t) => {
    const d = calendar ? tradingDayTime(t, calendar) : NaN;
    return Number.isNaN(d) ? utcDay(t) : d;
  });
}

/** For each element of `at` (non-decreasing), the index of the last element of `keys` (non-decreasing) <= it; -1: none. */
function latestAtOrBefore(keys: number[], at: number[]): number[] {
  let j = -1;
  return at.map((x) => {
    while (j + 1 < keys.length && keys[j + 1]! <= x) j++;
    return j;
  });
}

const zoneOf = (c: SymbolCalendar | undefined): Zone | null =>
  c?.timezone && c.session ? { timezone: c.timezone, session: c.session } : null;

/**
 * PineScript `request.security` of another symbol: the index in `otherBars` of the bar shown on each chart bar, -1
 * for na (#179). `otherBars` are the bars of the other symbol on `tf` ("" for the chart timeframe, or a higher
 * timeframe: "D", "W", "240"...), with times in the unit of the chart bars. Rules in the module notes.
 * @throws RangeError when `tf` is lower than the chart timeframe
 */
export function securityOther(
  chartBars: ReadonlyArray<{ time: number }>,
  otherBars: ReadonlyArray<{ time: number }>,
  tf: string,
  chart: OtherSymbolChart,
  options: OtherSymbolOptions = {}
): number[] {
  const n = chartBars.length;
  if (n === 0) return [];
  const unit = chart.timeUnit === 'ms' ? 1 : 1000;
  const ct = chartBars.map((b) => b.time * unit);
  const ot = otherBars.map((b) => b.time * unit);
  const chartTf = timeframe.info(chart.timeframe).period;
  const otherTf = tf.trim() === '' ? chartTf : timeframe.info(tf).period;
  if (timeframe.info(otherTf).isticks || timeframe.in_seconds(otherTf) < timeframe.in_seconds(chartTf)) {
    throw new RangeError(`request.security: timeframe "${tf}" is lower than the chart timeframe "${chartTf}".`);
  }
  if (ot.length === 0) return new Array<number>(n).fill(-1);

  // exchange calendars: given, 24x7, the chart's, else the UTC rule
  const chartZone = zoneOf(chart) ?? (tradesEveryDay(ct, chartTf) ? UTC_24X7 : null);
  const otherZone =
    zoneOf(options.other) ??
    (tradesEveryDay(ot, otherTf) ? UTC_24X7 : chartZone && onCalendar(ot, otherTf, chartZone) ? chartZone : null);

  const daily = timeframe.info(chartTf).isdwm;
  const realtime = chart.lastBarConfirmed === false && !options.gaps;
  let on: number[] = [];
  if (options.lookahead || realtime) {
    if (daily) {
      const info = timeframe.info(otherTf);
      const starts = tradingDays(ot, otherZone).map((d) => (info.isweekly ? weekStart(d) : info.ismonthly ? monthStart(d) : d));
      on = latestAtOrBefore(starts, tradingDays(ct, chartZone));
    } else {
      on = latestAtOrBefore(ot, ct);
    }
  }
  const index = options.lookahead ? on : latestAtOrBefore(closeTimes(ot, otherTf, otherZone), closeTimes(ct, chartTf, chartZone));
  // realtime updates of the open last bar: lookahead off shows the bar of lookahead on
  if (realtime) index[n - 1] = on[n - 1]!;
  if (!options.gaps) return index;
  return index.map((j, i) => (i === 0 || j !== index[i - 1] ? j : -1));
}

/**
 * {@link securityOther} with the values of an expression: `values` has one value per bar of the other symbol; the
 * result has one value per chart bar, NaN for na.
 */
export function securityOtherValues(
  chartBars: ReadonlyArray<{ time: number }>,
  otherBars: ReadonlyArray<{ time: number }>,
  tf: string,
  values: ArrayLike<number>,
  chart: OtherSymbolChart,
  options: OtherSymbolOptions = {}
): number[] {
  return securityOther(chartBars, otherBars, tf, chart, options).map((j) => (j < 0 ? NaN : (values[j] ?? NaN)));
}
