/**
 * The session of a chart context, for code that does not run a whole script (a port with its own bar loop).
 *
 * The same values as the script API gives (`time(tf)`, `time_close(tf)`, `time_tradingday`, `session.*`, the periods
 * of `request.security`), from the session, corrections and holidays of the context. Bar times are in the unit of
 * the context (`timeUnit`, seconds by default, as `Bar.time`); PineScript time values are returned in ms.
 *
 * @module session/context
 */

import type { Bar } from '../types/index.js';
import { info, in_seconds } from '../timeframe/index.js';
import { afterCompletion, periodsOf, resample } from '../security/resample.js';
import { parsePineSession, sessionRun } from '../time/session.js';
import { SessionBars, sessionFlags, strayPeriods, type SessionFlags } from './bars.js';
import { TradingCalendar, type SessionSpec } from './calendar.js';

/** The part of a chart context that the session functions read (a `ChartContext` of the script API fits). */
export interface SessionContext {
  /** Chart timeframe: "5", "60", "1D"... */
  timeframe?: string;
  /** Exchange time zone: "America/New_York", "Etc/UTC"... */
  timezone?: string;
  /** Session of the loaded bars: hours, corrections, holidays */
  session?: SessionSpec | string;
  /** Regular trading hours when the bars include extended hours (default: `session`) */
  regularSession?: SessionSpec | string;
  /** Unit of the bar times: 's' (default) or 'ms' */
  timeUnit?: 's' | 'ms';
}

/** The session calendars of a context: the loaded bars and the regular hours. */
export interface ChartSessions {
  bars: SessionBars;
  regular: SessionBars;
  /** ms per unit of the bar times */
  unit: number;
}

const toSpec = (s: SessionSpec | string): SessionSpec => (typeof s === 'string' ? { session: s } : s);
const cache = new WeakMap<object, ChartSessions>();

/**
 * Session calendars of a chart context (cached per context object).
 * @throws Error when the context has no timeframe, time zone or session
 */
export function chartSessions(chart: SessionContext): ChartSessions {
  const cached = cache.get(chart);
  if (cached) return cached;
  const { timeframe, timezone, session } = chart;
  if (!timeframe || !timezone || !session) {
    throw new Error('The chart context needs timeframe, timezone and session for the session functions.');
  }
  const loaded = toSpec(session);
  const regular = chart.regularSession ? toSpec(chart.regularSession) : loaded;
  const out: ChartSessions = {
    bars: new SessionBars(new TradingCalendar(timezone, loaded), timeframe),
    regular: new SessionBars(new TradingCalendar(timezone, { holidays: loaded.holidays, ...regular }), timeframe),
    unit: chart.timeUnit === 'ms' ? 1 : 1000,
  };
  cache.set(chart, out);
  return out;
}

/** Open and close (ms) of the period that contains a bar opening at a time in ms; NaN outside the session. */
export interface SessionPeriods {
  open: (time: number) => number;
  close: (time: number) => number;
}

/**
 * Calendar for the `session` / `timezone` arguments of `time(tf, session, timezone)`. Without both: the loaded
 * session. As in PineScript, an explicit time zone reads the symbol session hours in that zone without corrections
 * and holidays, and an explicit session follows PineScript's session string rules.
 */
function calendarFor(
  bars: SessionBars,
  chart: SessionContext,
  session: string | undefined,
  timezone: string | undefined,
  dayPlacement: boolean
): { bars: SessionBars; test: boolean; inside?: (time: number) => boolean } {
  if (!session && !timezone) return { bars, test: false };
  const tz = timezone ?? chart.timezone!;
  // a session string that is empty or does not start with a digit is the symbol session: "regular" the regular
  // hours, "extended" and any other name the loaded hours (PineScript)
  if (session !== undefined && parsePineSession(session) === null) {
    const name = session.trim();
    const symbol = name === 'regular' && chart.regularSession ? chart.regularSession : chart.session!;
    return { bars: new SessionBars(new TradingCalendar(tz, { session: toSpec(symbol).session }, 'symbol'), bars.chart.period), test: true };
  }
  const spec = session ? { session } : { session: toSpec(chart.session!).session };
  return {
    bars: new SessionBars(new TradingCalendar(tz, spec, session ? 'pine' : 'symbol', dayPlacement), bars.chart.period),
    test: true,
    // a PineScript session string: the rules of time.inSession (runs ending at 0000, days around a clock change)
    inside: session ? (time) => sessionRun(time, session, tz, in_seconds(bars.chart.period) * 1000) !== null : undefined,
  };
}

/**
 * `time(tf, session, timezone)` / `time_close(tf, session, timezone)` of a bar, as PineScript computes them (#173):
 * an intraday timeframe tests the bar with the session rules of time.inSession and aligns its periods on the start
 * of the run that contains the bar; "D" tests the bar against the day's session period (the calendar; the time
 * between two runs of a day is inside it, #182); a timeframe of more than one day ("2D", "W", "M") has no test and
 * keeps the period's time. `bars` is the calendar of the loaded session (`chartSessions(chart).bars`).
 */
export function sessionPeriods(
  bars: SessionBars,
  chart: SessionContext,
  timeframe: string,
  session?: string,
  timezone?: string
): SessionPeriods {
  const tf = info(timeframe);
  const { bars: calendar, test, inside } = calendarFor(bars, chart, session, timezone, !tf.isintraday);
  const open = (t: number): number => calendar.timeOf(t, timeframe);
  const close = (t: number): number => calendar.closeOf(t, timeframe);
  if (!test) return { open, close };
  if (tf.isintraday) {
    if (session !== undefined && parsePineSession(session) !== null && !calendar.chart.isdwm) {
      const tz = timezone ?? chart.timezone!;
      const barMs = in_seconds(calendar.chart.period) * 1000;
      const ms = in_seconds(tf.period) * 1000;
      const run = (t: number) => sessionRun(t, session, tz, barMs);
      const start = (t: number, r: [number, number]) => r[0] + Math.floor((t - r[0]) / ms) * ms;
      return {
        open: (t) => { const r = run(t); return r ? start(t, r) : NaN; },
        close: (t) => { const r = run(t); return r ? Math.min(start(t, r) + ms, r[1]) : NaN; },
      };
    }
    const isIn = (t: number) => (inside ? inside(t) : calendar.inside(t));
    return { open: (t) => (isIn(t) ? open(t) : NaN), close: (t) => (isIn(t) ? close(t) : NaN) };
  }
  if (tf.isdaily && tf.multiplier === 1) {
    return { open: (t) => (calendar.inside(t) ? open(t) : NaN), close: (t) => (calendar.inside(t) ? close(t) : NaN) };
  }
  return { open, close };
}

const periodCache = new WeakMap<object, Map<string, SessionPeriods>>();

function periodsOfChart(chart: SessionContext, timeframe: string, session?: string, timezone?: string): { s: ChartSessions; p: SessionPeriods } {
  const s = chartSessions(chart);
  let byKey = periodCache.get(chart);
  if (!byKey) periodCache.set(chart, (byKey = new Map()));
  const key = `${timeframe}|${session ?? ''}|${timezone ?? ''}`;
  let p = byKey.get(key);
  if (!p) byKey.set(key, (p = sessionPeriods(s.bars, chart, timeframe, session, timezone)));
  return { s, p };
}

/**
 * PineScript `time(timeframe, session, timezone)` (ms) of a bar that opens at `time`: the start of its period; NaN
 * without one or outside `session` (#182). Without `session` and `timezone`, the periods of the loaded session.
 */
export function periodTime(time: number, timeframe: string, chart: SessionContext, session?: string, timezone?: string): number {
  const { s, p } = periodsOfChart(chart, timeframe, session, timezone);
  return p.open(time * s.unit);
}

/** PineScript `time_close(timeframe, session, timezone)` (ms) of a bar that opens at `time` (#182). */
export function periodClose(time: number, timeframe: string, chart: SessionContext, session?: string, timezone?: string): number {
  const { s, p } = periodsOfChart(chart, timeframe, session, timezone);
  return p.close(time * s.unit);
}

/** PineScript `time_tradingday` (ms, 00:00 UTC of the trading day) of a bar that opens at `time`. */
export function tradingDayTime(time: number, chart: SessionContext): number {
  const s = chartSessions(chart);
  return s.bars.tradingDayTime(time * s.unit);
}

/** PineScript `session.*` flags of bars that open at `times` (in order). */
export function chartSessionFlags(times: ArrayLike<number>, chart: SessionContext): SessionFlags {
  const s = chartSessions(chart);
  return sessionFlags(Array.from(times, (t) => t * s.unit), s.bars, s.regular);
}

/** Higher-timeframe bars of the chart bars and what `mapToChart` needs to bring values back to the chart. */
export interface SessionResample {
  /** Bars of `timeframe`, built from the chart bars */
  bars: Bar[];
  /** Period index of each chart bar */
  group: number[];
  /** Latest completed period at each chart bar */
  latest: number[];
}

/**
 * Same-symbol `request.security` on a timeframe equal to or higher than the chart's, with the session of the context:
 * D / W / M periods follow the regular hours, corrections and holidays; intraday periods the loaded session.
 * Compute on `bars`, then bring each value series back with `mapToChart(values, group, latest, lookahead, gaps)`.
 * @throws Error when `timeframe` is lower than the chart timeframe
 */
export function resampleSession(bars: Bar[], timeframe: string, chart: SessionContext): SessionResample {
  const s = chartSessions(chart);
  const chartTf = s.bars.chart;
  const tf = info(timeframe || chartTf.period);
  if (tf.period === chartTf.period) {
    const group = bars.map((_, i) => i);
    return { bars, group, latest: group };
  }
  if (in_seconds(tf.period) < in_seconds(chartTf.period)) {
    throw new Error(`resampleSession: timeframe "${tf.period}" is lower than the chart timeframe "${chartTf.period}".`);
  }
  const times = bars.map((b) => (b.time as number) * s.unit);
  const calendar = tf.isdwm ? s.regular : s.bars;
  const starts = times.map((t) => calendar.timeOf(t, tf.period));
  const dayPeriods = times.map((t, i) => {
    const at = s.bars.calendar.locate(t);
    const periods = at ? calendar.calendar.periods(at.date) : [];
    return periods.length ? calendar.timeOf(periods[0]![0], tf.period) : starts[i]!;
  });
  strayPeriods(starts, dayPeriods, times, s.bars, tf.isdwm ? null : in_seconds(tf.period) * 1000);
  const reaches = times.map((t) => s.bars.closeOf(t, chartTf.period) >= calendar.periodEnd(t, tf.period));
  const { group, latest } = periodsOf(starts, dayPeriods, reaches);
  // a higher-timeframe bar ends at the bar that completes it (no value from after the completion)
  const after = afterCompletion(group, latest);
  const kept = (_: unknown, i: number): boolean => !after[i];
  return { bars: resample(bars.filter(kept), starts.map((x) => x / s.unit).filter(kept)).bars, group, latest };
}

/**
 * Open time of the `count`-th bar after the bar that opens at `time`, on the trading calendar of the context: the
 * closed hours, weekends, holidays and days off are skipped. `count` 0 is the bar itself. For a drawing that ends
 * `count` bars after the last bar (PineScript `bar_index + count`).
 */
export function barTimeAfter(time: number, count: number, chart: SessionContext): number {
  const s = chartSessions(chart);
  let t = time * s.unit;
  for (let k = 0; k < count && !Number.isNaN(t); k++) t = s.bars.nextBarTime(t);
  return t / s.unit;
}

/**
 * Number of bars from the bar that opens at `from` to the bar that contains `to`, on the trading calendar of the
 * context (0 when `to` is in the bar of `from` or before it). For a drawing placed at a time after the last bar
 * (PineScript `time + n days` with `xloc.bar_time`): the chart shows it on the bar of that time, weekends and
 * holidays skipped. `to` is first rounded to the nearest second, a half second going up (#174: 15 ms before a bar
 * opens is on that bar, 501 ms before is on the bar before). NaN when no bar is found within 100,000 bars.
 */
export function barsUntil(from: number, to: number, chart: SessionContext): number {
  const s = chartSessions(chart);
  const target = Math.floor((to * s.unit) / 1000 + 0.5) * 1000;
  let t = from * s.unit;
  for (let k = 0; k < 100_000; k++) {
    const next = s.bars.nextBarTime(t);
    if (Number.isNaN(next)) return NaN;
    if (next > target) return k;
    t = next;
  }
  return NaN;
}
