/**
 * PineScript values that depend on the chart timeframe and the symbol session (issue #100):
 * `time(tf)`, `time_close(tf)`, `timeframe.change(tf)`, `time_tradingday`, `session.*`.
 * Rules (30/09/2026, see context-check/doc/README.md):
 *
 * - intraday periods are aligned on the start of the session period of the trading day: 240 minutes from
 *   09:30 gives 09:30, 13:30; `time(tf)` is the start of the period that contains the bar open
 * - "D" is the session start of the trading day; "W" / "M" the session start of the first trading day
 *   of the week (Monday to Sunday) / month
 * - intraday closes are cut at the end of the session period; the "D" close is the session end
 * - on intraday charts the "W" / "M" close is the session start of the next week's / month's first
 *   trading day; on D / W / M charts it is the session end of the last trading day of the week / month
 * - on D / W / M charts, intraday timeframes give the chart bar's time, and the end of the session
 *   period that contains the bar open as close
 * - `time_tradingday` is 00:00 UTC of the trading day (on W / M charts, of the last trading day)
 */

import { info, in_seconds, type TimeframeInfo } from '../timeframe';
import {
  TradingCalendar,
  addDays,
  dateUtcMs,
  monthEnd,
  monthStart,
  weekStart,
  type DateNum,
} from './calendar';

function periodLimit(tf: TimeframeInfo): 'D' | 'W' | 'M' {
  if (tf.multiplier !== 1) {
    throw new RangeError(`Timeframe "${tf.period}": only 1D, 1W and 1M are supported above one day`);
  }
  return tf.isdaily ? 'D' : tf.isweekly ? 'W' : 'M';
}

function periodRange(date: DateNum, unit: 'W' | 'M'): [DateNum, DateNum] {
  return unit === 'W' ? [weekStart(date), addDays(weekStart(date), 6)] : [monthStart(date), monthEnd(date)];
}

/** Values of the bars of one chart, for a trading calendar. */
export class SessionBars {
  readonly chart: TimeframeInfo;

  constructor(
    readonly calendar: TradingCalendar,
    chartTimeframe: string
  ) {
    this.chart = info(chartTimeframe);
  }

  private dayStart(date: DateNum): number {
    return this.calendar.periods(date)[0]![0];
  }

  private dayEnd(date: DateNum): number {
    const p = this.calendar.periods(date);
    return p[p.length - 1]![1];
  }

  /** PineScript `time(tf)` for a bar that opens at `time`; NaN when no trading day is found. */
  timeOf(time: number, timeframe: string): number {
    const tf = info(timeframe);
    const at = this.calendar.locate(time);
    if (!at) return NaN;
    if (tf.isintraday) {
      if (this.chart.isdwm) return time;
      const [start] = this.calendar.periods(at.date)[at.index]!;
      const ms = in_seconds(tf.period) * 1000;
      return start + Math.floor((time - start) / ms) * ms;
    }
    const unit = periodLimit(tf);
    if (unit === 'D') return this.dayStart(at.date);
    const [from, to] = periodRange(at.date, unit);
    const first = this.calendar.firstTradingDay(from, to);
    return first === null ? NaN : this.dayStart(first);
  }

  /** PineScript `time_close(tf)` for a bar that opens at `time`. */
  closeOf(time: number, timeframe: string): number {
    const tf = info(timeframe);
    const at = this.calendar.locate(time);
    if (!at) return NaN;
    if (tf.isintraday) {
      const [, end] = this.calendar.periods(at.date)[at.index]!;
      // on D / W / M charts: the end of the session period that contains the bar open
      if (this.chart.isdwm) return end;
      return Math.min(this.timeOf(time, timeframe) + in_seconds(tf.period) * 1000, end);
    }
    const unit = periodLimit(tf);
    if (unit === 'D') return this.dayEnd(at.date);
    const [from, to] = periodRange(at.date, unit);
    if (this.chart.isintraday) {
      const next = addDays(to, 1);
      const [nextFrom, nextTo] = periodRange(next, unit);
      const first = this.calendar.firstTradingDay(nextFrom, addDays(nextTo, 31));
      return first === null ? NaN : this.dayStart(first);
    }
    const last = this.calendar.lastTradingDay(from, to);
    return last === null ? NaN : this.dayEnd(last);
  }

  /** Trading day of a bar: on W / M charts the last trading day of the week / month. */
  tradingDay(time: number): DateNum | null {
    const at = this.calendar.locate(time);
    if (!at) return null;
    if (this.chart.isweekly || this.chart.ismonthly) {
      const [from, to] = periodRange(at.date, this.chart.isweekly ? 'W' : 'M');
      return this.calendar.lastTradingDay(from, to);
    }
    return at.date;
  }

  /**
   * End of the `timeframe` period that contains `time`: the intraday close, the session end of the day,
   * or the session end of the last trading day of the week / month. Used to know whether the last loaded
   * bar completes a higher-timeframe period (request.security).
   */
  periodEnd(time: number, timeframe: string): number {
    const tf = info(timeframe);
    const at = this.calendar.locate(time);
    if (!at) return NaN;
    if (tf.isintraday) {
      const [, end] = this.calendar.periods(at.date)[at.index]!;
      return Math.min(this.timeOf(time, timeframe) + in_seconds(tf.period) * 1000, end);
    }
    const unit = periodLimit(tf);
    if (unit === 'D') return this.dayEnd(at.date);
    const [from, to] = periodRange(at.date, unit);
    const last = this.calendar.lastTradingDay(from, to);
    return last === null ? NaN : this.dayEnd(last);
  }

  /** PineScript `time_tradingday`: 00:00 UTC of the trading day. */
  tradingDayTime(time: number): number {
    const day = this.tradingDay(time);
    return day === null ? NaN : dateUtcMs(day);
  }

  /** True when the bar at `time` is inside the session. */
  inside(time: number): boolean {
    return this.calendar.locate(time)?.inside ?? false;
  }

  /** Session start and end of the trading day of `time`, or null. */
  dayBounds(time: number): { date: DateNum; start: number; end: number } | null {
    const at = this.calendar.locate(time);
    return at ? { date: at.date, start: this.dayStart(at.date), end: this.dayEnd(at.date) } : null;
  }
}

/** PineScript `session.*` flags of each bar. */
export interface SessionFlags {
  isfirstbar: boolean[];
  islastbar: boolean[];
  ismarket: boolean[];
  ispremarket: boolean[];
  ispostmarket: boolean[];
  isfirstbar_regular: boolean[];
  islastbar_regular: boolean[];
}

/**
 * `session.*` flags for bars that open at `times` (in order). `regular` gives the regular trading
 * hours when the bars include extended hours. Rules: flags use the bar open
 * time; first and last bars are per session period (a trading day can have two periods, e.g. after a
 * futures holiday); pre / post market compare with the regular hours of the same trading day; on
 * D / W / M charts every bar is its own session (first, last, market, first and last regular).
 */
export function sessionFlags(times: number[], bars: SessionBars, regular: SessionBars): SessionFlags {
  const n = times.length;
  const flag = () => new Array<boolean>(n).fill(false);
  const out: SessionFlags = {
    isfirstbar: flag(), islastbar: flag(), ismarket: flag(), ispremarket: flag(), ispostmarket: flag(),
    isfirstbar_regular: flag(), islastbar_regular: flag(),
  };
  const chart = bars.chart;
  let previousPeriod = '';
  let previousRegular = '';
  for (let i = 0; i < n; i++) {
    const t = times[i]!;
    if (chart.isdwm) {
      for (const k of ['isfirstbar', 'islastbar', 'ismarket', 'isfirstbar_regular', 'islastbar_regular'] as const) out[k][i] = true;
      continue;
    }
    const at = bars.calendar.locate(t);
    if (!at) {
      previousPeriod = previousRegular = '';
      continue;
    }
    const close = bars.closeOf(t, chart.period);
    const [, end] = bars.calendar.periods(at.date)[at.index]!;
    const period = `${at.date}/${at.index}`;
    out.isfirstbar[i] = period !== previousPeriod;
    out.islastbar[i] = close >= end;
    const regularPeriods = regular.calendar.periods(at.date);
    const r = regularPeriods.findIndex(([s, e]) => s <= t && t < e);
    const market = r !== -1;
    out.ismarket[i] = market;
    if (!market && regularPeriods.length) {
      out.ispremarket[i] = t < regularPeriods[0]![0];
      out.ispostmarket[i] = t >= regularPeriods[regularPeriods.length - 1]![1];
    }
    const regularPeriod = market ? `${at.date}/${r}` : '';
    out.isfirstbar_regular[i] = market && regularPeriod !== previousRegular;
    out.islastbar_regular[i] = market && close >= regularPeriods[r]![1];
    previousPeriod = period;
    previousRegular = regularPeriod;
  }
  return out;
}
