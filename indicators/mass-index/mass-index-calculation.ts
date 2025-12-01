/**
 * Mass Index Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import { Series, ta, math, type Bar } from '@deepentropy/oakscriptjs';

/**
 * Calculate Mass Index values
 * Formula: sum(ema(span, 9) / ema(ema(span, 9), 9), length)
 * where span = high - low
 * @param bars - OHLCV bar data
 * @param length - Summation length
 * @returns Array of time-value pairs
 */
export function calculateMassIndex(
  bars: Bar[],
  length: number
): Array<{ time: number; value: number }> {
  // Get high and low series
  const high = Series.fromBars(bars, 'high');
  const low = Series.fromBars(bars, 'low');

  // Calculate span = high - low
  const span = high.sub(low);

  // Calculate EMA of span with period 9
  const ema1 = ta.ema(span, 9);

  // Calculate EMA of EMA1 with period 9
  const ema2 = ta.ema(ema1, 9);

  // Calculate ratio = ema1 / ema2
  const ratio = ema1.div(ema2);

  // Calculate rolling sum of ratio over length bars
  const ratioArray = ratio.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    if (i < length - 1) {
      continue; // Not enough data for sum
    }

    let sum = 0;
    let hasNaN = false;

    for (let j = 0; j < length; j++) {
      const val = ratioArray[i - j];
      if (val === undefined || Number.isNaN(val)) {
        hasNaN = true;
        break;
      }
      sum += val;
    }

    const bar = bars[i];
    if (bar && !hasNaN) {
      data.push({ time: bar.time, value: sum });
    }
  }

  return data;
}
