/**
 * Same-symbol `request.security` by resampling the chart bars (issue #101).
 * Rules (30/09/2026, see security-check/doc/README.md):
 *
 * - `lookahead_off` (default): the value of a higher-timeframe period appears on the chart bar that
 *   completes the period; before that, the chart bars show the previous period's value
 * - `lookahead_on`: every chart bar of a period shows the value of that period
 * - `gaps_on`: only the bar where the value appears has it (the completing bar with lookahead off, the
 *   first bar of the period with lookahead on); the other bars are `na`
 * - the last loaded bar completes its period only if it closes at or after the end of the period (a
 *   period still trading keeps showing the previous completed value)
 * - D / W / M periods follow the regular hours: on extended-hours charts the premarket bars still show
 *   the previous period, which completes on the last bar of its trading day
 */

import type { Bar } from '../types';

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
 * Period index and completion of each chart bar.
 * @param starts - Period start of each chart bar (the higher-timeframe bar it belongs to)
 * @param dayPeriods - Period of the trading day of each chart bar in the loaded session: on extended-hours
 *   charts the premarket bars still belong to the previous daily period, but a new trading day completes it
 * @param lastComplete - True when the last chart bar completes its period
 */
export function periodsOf(starts: number[], dayPeriods: number[], lastComplete: boolean): { group: number[]; complete: boolean[] } {
  const n = starts.length;
  const group: number[] = [];
  starts.forEach((s, i) => group.push(i === 0 ? 0 : group[i - 1]! + (s !== starts[i - 1] ? 1 : 0)));
  // a period completes once: the premarket bars after it (same period) do not complete it again
  let done = -1;
  const complete = starts.map((s, i) => {
    const ends = i < n - 1 ? starts[i + 1] !== s || dayPeriods[i + 1] !== dayPeriods[i] : lastComplete;
    if (!ends || done === group[i]) return false;
    done = group[i]!;
    return true;
  });
  return { group, complete };
}

/**
 * Maps values computed on the higher-timeframe bars to the chart bars.
 * @param values - One value per higher-timeframe bar
 * @param group - Period index of each chart bar
 * @param complete - True on the chart bars that complete their period
 */
export function mapToChart(values: number[], group: number[], complete: boolean[], lookahead: boolean, gaps: boolean): number[] {
  let completed = -1;
  return group.map((g, i) => {
    const first = i === 0 || group[i - 1] !== g;
    if (lookahead) return gaps && !first ? NaN : (values[g] ?? NaN);
    if (complete[i]) {
      completed = g;
      return values[g] ?? NaN;
    }
    return gaps || completed < 0 ? NaN : (values[completed] ?? NaN);
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
