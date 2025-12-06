/**
 * Momentum (MOM) Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import {Series, ta, type Bar} from 'oakscriptjs';
import { getSourceSeries } from '../sma/sma-calculation';

/**
 * Calculate Momentum values using oakscriptjs
 * @param bars - OHLCV bar data
 * @param length - Lookback period
 * @param source - Source data (open, high, low, close, etc.)
 * @returns Array of time-value pairs
 */
export function calculateMomentum(
  bars: Bar[],
  length: number,
  source: string
): Array<{ time: number; value: number }> {
  // Get source series
  const src = getSourceSeries(bars, source);

  // Calculate Momentum using oakscriptjs ta.mom
  const momValues = ta.mom(src, length);

  // Convert to time-value pairs
  const momArray = momValues.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const value = momArray[i];
    const bar = bars[i];
    if (bar && value !== undefined && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }

  return data;
}
