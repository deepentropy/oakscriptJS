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
 * - on intraday charts the "W" / "M" (and "nD") close is the session start of the next period's first
 *   trading day; on D / W / M charts it is the session end of the last trading day of the week / month
 * - on D / W / M charts, intraday timeframes give the chart bar's time, and the end of the session
 *   period that contains the bar open as close
 * - `time_tradingday` is 00:00 UTC of the trading day (on W / M charts, of the last trading day)
 *
 * Multipliers above one day (issue #100 follow-up, multiperiod-check/doc/README.md): periods restart each
 * calendar year. "nD" groups n trading days from the first trading day of the year; "nW" groups n weeks from
 * the first week whose Monday is in the year; "nM" groups n months from January. The last group of a year
 * can be shorter.
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

type Unit = 'D' | 'W' | 'M';

function unitOf(tf: TimeframeInfo): { unit: Unit; n: number } {
  return { unit: tf.isdaily ? 'D' : tf.isweekly ? 'W' : 'M', n: tf.multiplier };
}

const yearOf = (date: DateNum): number => Math.floor(date / 10000);

/** Monday of the first week of `year` (the first Monday on or after 1 January). */
const firstMonday = (year: number): DateNum => {
  const jan1 = year * 10000 + 101;
  const monday = weekStart(jan1);
  return monday === jan1 ? jan1 : addDays(monday, 7);
};

/** Values of the bars of one chart, for a trading calendar. */
export class SessionBars {
  readonly chart: TimeframeInfo;

  private readonly yearDays = new Map<number, DateNum[]>();

  constructor(
    readonly calendar: TradingCalendar,
    chartTimeframe: string
  ) {
    this.chart = info(chartTimeframe);
  }

  /** Trading days of a calendar year, in order. */
  private tradingDaysOf(year: number): DateNum[] {
    let days = this.yearDays.get(year);
    if (!days) {
      days = [];
      for (let date = year * 10000 + 101; yearOf(date) === year; date = addDays(date, 1)) {
        if (this.calendar.isTradingDay(date)) days.push(date);
      }
      this.yearDays.set(year, days);
    }
    return days;
  }

  /**
   * Dates [from, to] of the `n`-`unit` period that contains `date` (for "D": its first and last trading days).
   * Periods restart each calendar year.
   */
  private periodRange(date: DateNum, unit: Unit, n: number): [DateNum, DateNum] {
    if (unit === 'D') {
      if (n === 1) return [date, date];
      const days = this.tradingDaysOf(yearOf(date));
      let k = days.findIndex((d) => d >= date);
      if (k === -1) return this.periodRange(yearOf(date) * 10000 + 10000 + 101, unit, n);
      k -= k % n;
      return [days[k]!, days[Math.min(k + n, days.length) - 1]!];
    }
    if (unit === 'W') {
      const monday = weekStart(date);
      const year = yearOf(monday);
      const first = firstMonday(year);
      const next = firstMonday(year + 1);
      const k = Math.round((dateUtcMs(monday) - dateUtcMs(first)) / (7 * 86_400_000));
      const from = addDays(first, (k - (k % n)) * 7);
      const to = addDays(from, n * 7 - 1);
      return [from, to < next ? to : addDays(next, -1)];
    }
    const year = yearOf(date);
    const month = Math.floor(date / 100) % 100;
    const firstMonth = month - ((month - 1) % n);
    const lastMonth = Math.min(firstMonth + n - 1, 12);
    return [monthStart(year * 10000 + firstMonth * 100 + 1), monthEnd(year * 10000 + lastMonth * 100 + 1)];
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
    const { unit, n } = unitOf(tf);
    const [from, to] = this.periodRange(at.date, unit, n);
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
    const { unit, n } = unitOf(tf);
    const [from, to] = this.periodRange(at.date, unit, n);
    // intraday charts: the start of the next period, except "1D" (the session end)
    if (this.chart.isintraday && (unit !== 'D' || n > 1)) {
      const [nextFrom, nextTo] = this.periodRange(addDays(to, 1), unit, n);
      const first = this.calendar.firstTradingDay(nextFrom, addDays(nextTo, 31));
      return first === null ? NaN : this.dayStart(first);
    }
    const last = this.calendar.lastTradingDay(from, to);
    return last === null ? NaN : this.dayEnd(last);
  }

  /** Trading day of a bar: on D / W / M charts the last trading day of the chart period. */
  tradingDay(time: number): DateNum | null {
    const at = this.calendar.locate(time);
    if (!at) return null;
    if (this.chart.isdwm) {
      const { unit, n } = unitOf(this.chart);
      const [from, to] = this.periodRange(at.date, unit, n);
      return this.calendar.lastTradingDay(from, to);
    }
    return at.date;
  }

  /**
   * End of the `timeframe` period that contains `time`: the intraday close, the session end of the day,
   * or the session end of the last trading day of the period. Used to know whether the last loaded
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
    const { unit, n } = unitOf(tf);
    const [from, to] = this.periodRange(at.date, unit, n);
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
