/**
 * Times of bars after the last bar.
 *
 * PineScript draws on future bars: `line.new(..., bar_index + 15, ...)`, box edges after the last bar,
 * `plot(..., offset = k)`. These points get the time of the future bar: the last bar time plus k times the bar
 * interval. The bar interval is the most frequent gap between two consecutive bars (1 day on daily bars even with
 * weekends and holidays). A renderer that adds the same future bar slots to the chart draws a point at
 * `barTime(bars, n - 1 + k)` k bars after the last bar.
 *
 * @module drawing/bar-time
 */

/** Most frequent positive gap between consecutive bar times (in the unit of the bar times); 0 with fewer than 2 bars. */
export function barInterval(bars: ReadonlyArray<{ time: number }>): number {
  const counts = new Map<number, number>();
  let best = 0;
  let bestCount = 0;
  for (let i = 1; i < bars.length; i++) {
    const d = bars[i]!.time - bars[i - 1]!.time;
    if (!(d > 0)) continue;
    const c = (counts.get(d) ?? 0) + 1;
    counts.set(d, c);
    // ties: the smaller gap
    if (c > bestCount || (c === bestCount && d < best)) {
      best = d;
      bestCount = c;
    }
  }
  return best;
}

/**
 * Time of bar `index`: the bar time for 0 <= index < bars.length, the time of a future bar for
 * index >= bars.length (last bar time + (index - last index) * barInterval(bars)). NaN for a negative or non-integer
 * index, or no bar. `interval` can be passed to avoid recomputing it.
 */
export function barTime(bars: ReadonlyArray<{ time: number }>, index: number, interval?: number): number {
  const n = bars.length;
  if (n === 0 || index < 0 || !Number.isInteger(index)) return NaN;
  if (index < n) return bars[index]!.time;
  return bars[n - 1]!.time + (index - (n - 1)) * (interval ?? barInterval(bars));
}
