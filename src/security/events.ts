/**
 * Dividends, splits and earnings on the chart bars (`request.dividends`, `request.splits`, `request.earnings`).
 *
 * PineScript requests an event series on the chart timeframe in UTC: an event belongs to the period of that timeframe
 * that contains its time (its UTC day on a daily chart, its UTC week from Monday on a weekly one, its hour on a 60
 * chart). Measured on PineScript (AAPL, KO, NVDA, NSE:RELIANCE; 1D, 1W, 1M, 60):
 * - lookahead off: the value shows from the first chart bar that closes at or after the end of that period, so a
 *   dividend of a Monday shows on Tuesday's daily bar and on Monday's first hourly bar;
 * - lookahead on: from the first chart bar that closes after the period's start (Monday's daily bar);
 * - gaps off keeps the last value on the bars after it (an event before the first bar shows from the first bar);
 *   gaps on shows it on that bar only.
 */
import * as timeframeCore from '../timeframe/index.js';

const DAY = 86_400_000;
/** 1970-01-05, the first Monday of UNIX time. */
const FIRST_MONDAY = 4 * DAY;

/** `[start, end)` in ms of the period of `tf` that contains `time`, in UTC. */
export function utcPeriod(time: number, tf: string): [number, number] {
  const info = timeframeCore.info(tf);
  if (info.isticks) return [time, time];
  if (info.ismonthly) {
    const d = new Date(time);
    const months = d.getUTCFullYear() * 12 + d.getUTCMonth();
    const first = months - (((months % info.multiplier) + info.multiplier) % info.multiplier);
    return [Date.UTC(Math.floor(first / 12), first % 12, 1), Date.UTC(Math.floor((first + info.multiplier) / 12), (first + info.multiplier) % 12, 1)];
  }
  if (info.isweekly) {
    const span = 7 * DAY * info.multiplier;
    const start = Math.floor((time - FIRST_MONDAY) / span) * span + FIRST_MONDAY;
    return [start, start + span];
  }
  const span = timeframeCore.in_seconds(tf) * 1000;
  const start = Math.floor(time / span) * span;
  return [start, start + span];
}

/** An event's time and its value. */
export interface EventValue {
  time: number;
  value: number;
}

/**
 * The value of the events on each chart bar. `opens` / `closes`: open and close times of the chart bars in ms,
 * `events` oldest first.
 */
export function eventsOnBars(
  opens: number[],
  closes: number[],
  tf: string,
  events: EventValue[],
  options: { gaps?: boolean; lookahead?: boolean } = {}
): number[] {
  const n = opens.length;
  const out = new Array<number>(n).fill(NaN);
  if (!n) return out;
  // the bar each event shows on (n: after the last bar)
  const arrivals = events.map((e) => {
    const [start, end] = utcPeriod(e.time, tf);
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (options.lookahead ? closes[mid]! > start : closes[mid]! >= end) hi = mid;
      else lo = mid + 1;
    }
    // with gaps on, an event that the bar before the first one would have shown is not shown on the first one (that
    // bar closes about one bar length before the first one's open)
    const before = lo === 0 && (options.lookahead ? start : end) <= opens[0]! - (closes[0]! - opens[0]!);
    return { at: lo, before, value: e.value };
  });
  if (options.gaps) {
    for (const a of arrivals) if (a.at < n && !a.before) out[a.at] = a.value;
    return out;
  }
  let k = 0;
  let value = NaN;
  for (let i = 0; i < n; i++) {
    while (k < arrivals.length && arrivals[k]!.at <= i) value = arrivals[k++]!.value;
    out[i] = value;
  }
  return out;
}
