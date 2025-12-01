/**
 * Average Day Range (ADR) Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import { Series, ta, type Bar } from '@deepentropy/oakscriptjs';

/**
 * Calculate Average Day Range values using oakscriptjs
 * Formula: SMA(high - low, length)
 * @param bars - OHLCV bar data
 * @param length - SMA period length
 * @returns Array of time-value pairs
 */
export function calculateADR(
  bars: Bar[],
  length: number
): Array<{ time: number; value: number }> {
  // Get high and low series
  const high = Series.fromBars(bars, 'high');
  const low = Series.fromBars(bars, 'low');

  // Calculate range = high - low
  const range = high.sub(low);

  // Calculate ADR = SMA(range, length)
  const adrValues = ta.sma(range, length);

  // Convert to time-value pairs
  const adrArray = adrValues.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const value = adrArray[i];
    const bar = bars[i];
    if (bar && value !== undefined && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }

  return data;
}
