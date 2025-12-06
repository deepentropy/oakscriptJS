/**
 * Hull Moving Average (HMA) Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import {Series, ta, type Bar} from 'oakscriptjs';
import { getSourceSeries } from '../sma/sma-calculation';

/**
 * Calculate Hull Moving Average values using oakscriptjs
 * Formula: wma(2*wma(src, length/2) - wma(src, length), sqrt(length))
 * @param bars - OHLCV bar data
 * @param length - Period length (minimum 2)
 * @param source - Source data (open, high, low, close, etc.)
 * @returns Array of time-value pairs
 */
export function calculateHMA(
  bars: Bar[],
  length: number,
  source: string
): Array<{ time: number; value: number }> {
  // Get source series
  const src = getSourceSeries(bars, source);

  // Calculate half length (rounded down)
  const halfLength = Math.max(1, Math.floor(length / 2));

  // Calculate sqrt length (rounded down)
  const sqrtLength = Math.max(1, Math.floor(Math.sqrt(length)));

  // Calculate WMA(src, length/2)
  const wmaHalf = ta.wma(src, halfLength);

  // Calculate WMA(src, length)
  const wmaFull = ta.wma(src, length);

  // Calculate 2 * WMA(half) - WMA(full)
  const diff = wmaHalf.mul(2).sub(wmaFull);

  // Calculate HMA = WMA(diff, sqrt(length))
  const hma = ta.wma(diff, sqrtLength);

  // Convert to time-value pairs
  const hmaArray = hma.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const value = hmaArray[i];
    const bar = bars[i];
    if (bar && value !== undefined && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }

  return data;
}
