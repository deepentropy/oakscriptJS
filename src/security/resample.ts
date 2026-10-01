/**
 * Same-symbol `request.security` by resampling the chart bars (issue #101).
 * PineScript rules:
 *
 * - `lookahead_off` (default): the value of a higher-timeframe period appears on the chart bar that
 *   completes the period; before that, the chart bars show the previous period's value
 * - `lookahead_on`: every chart bar of a period shows the value of that period
 * - `gaps_on`: only the bar where the value appears has it (the completing bar with lookahead off, the
 *   first bar of the period with lookahead on); the other bars are `na`
 * - a bar completes its period only if it closes at or after the end of the period (a period still
 *   trading keeps showing the previous completed value); when the bars at the end of a period are missing
 *   (data gap, a day off not in the calendar), the period completes on the first bar of the next period
 * - D / W / M periods follow the regular hours: on extended-hours charts the premarket bars still show
 *   the previous period, which completes on the last bar of its trading day
 * - a higher-timeframe bar only holds the chart bars up to the bar that completes it: the premarket bars
 *   that still show the previous period are not part of its bar (no value from after the completion)
 */

import type { Bar } from '../types/index.js';

/** Higher-timeframe bars and the period index of each chart bar. */
export interface Resampled {
  bars: Bar[];
  /** Index in `bars` of the period of each chart bar */
  group: number[];
}

/**
 * Groups consecutive chart bars with the same period start into higher-timeframe bars.
 * @param bars - Chart bars (in order)
 * @param periodStart - Period start of each chart bar, in the unit of `Bar.time`
 */
export function resample(bars: Bar[], periodStart: number[]): Resampled {
  const out: Bar[] = [];
  const group: number[] = [];
  bars.forEach((b, i) => {
    const start = periodStart[i]!;
    const last = out[out.length - 1];
    if (!last || last.time !== start) {
      out.push({ time: start, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume ?? NaN });
    } else {
      last.high = Math.max(last.high, b.high);
      last.low = Math.min(last.low, b.low);
      last.close = b.close;
      last.volume = (last.volume ?? 0) + (b.volume ?? NaN);
    }
    group.push(out.length - 1);
  });
  return { bars: out, group };
}

/**
 * Period index of each chart bar, and the latest completed period at each chart bar.
 * @param starts - Period start of each chart bar (the higher-timeframe bar it belongs to)
 * @param dayPeriods - Period of the trading day of each chart bar in the loaded session: on extended-hours
 *   charts the premarket bars still belong to the previous daily period, but a new trading day completes it
 * @param reaches - True when the chart bar closes at or after the end of its period
 */
export function periodsOf(starts: number[], dayPeriods: number[], reaches: boolean[]): { group: number[]; latest: number[] } {
  const n = starts.length;
  const group: number[] = [];
  starts.forEach((s, i) => group.push(i === 0 ? 0 : group[i - 1]! + (s !== starts[i - 1] ? 1 : 0)));
  const latest: number[] = [];
  starts.forEach((s, i) => {
    let done = i === 0 ? -1 : latest[i - 1]!;
    // a new period completes all the earlier ones (their last bars may be missing)
    if (i > 0 && group[i] !== group[i - 1]) done = Math.max(done, group[i]! - 1);
    // the last bar of its period in the loaded session (the premarket bars after it do not complete it again)
    const ends = i < n - 1 ? starts[i + 1] !== s || dayPeriods[i + 1] !== dayPeriods[i] : true;
    if (ends && reaches[i]) done = Math.max(done, group[i]!);
    latest.push(done);
  });
  return { group, latest };
}

/**
 * True for the chart bars that come after the bar that completed their period: on extended-hours charts
 * the premarket bars of the next trading day still show the previous D / W / M period, but they are not
 * part of its higher-timeframe bar. A period's first bar is never after its completion.
 * @param group - Period index of each chart bar
 * @param latest - Latest completed period at each chart bar
 */
export function afterCompletion(group: number[], latest: number[]): boolean[] {
  return group.map((g, i) => i > 0 && group[i - 1] === g && latest[i - 1]! >= g);
}

/**
 * Maps values computed on the higher-timeframe bars to the chart bars.
 * @param values - One value per higher-timeframe bar
 * @param group - Period index of each chart bar
 * @param latest - Latest completed period at each chart bar (-1: none yet)
 */
export function mapToChart(values: number[], group: number[], latest: number[], lookahead: boolean, gaps: boolean): number[] {
  return group.map((g, i) => {
    if (lookahead) {
      const first = i === 0 || group[i - 1] !== g;
      return gaps && !first ? NaN : (values[g] ?? NaN);
    }
    const done = latest[i]!;
    if (done < 0 || (gaps && i > 0 && latest[i - 1] === done)) return NaN;
    return values[done] ?? NaN;
  });
}

/**
 * Heikin Ashi bars (PineScript `ticker.heikinashi`): close = (open + high + low + close) / 4, open = the
 * average of the previous Heikin Ashi open and close ((open + close) / 2 on the first bar),
 * high / low = the extremes of high / low and the Heikin Ashi open and close.
 */
export function heikinAshi(bars: Bar[]): Bar[] {
  const out: Bar[] = [];
  bars.forEach((b, i) => {
    const close = (b.open + b.high + b.low + b.close) / 4;
    const prev = out[i - 1];
    const open = prev ? (prev.open + prev.close) / 2 : (b.open + b.close) / 2;
    out.push({ time: b.time, open, high: Math.max(b.high, open, close), low: Math.min(b.low, open, close), close, volume: b.volume });
  });
  return out;
}
