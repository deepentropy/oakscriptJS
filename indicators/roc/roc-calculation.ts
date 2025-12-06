/**
 * Rate of Change (ROC) Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import {Series, ta, type Bar} from 'oakscriptjs';
import { getSourceSeries } from '../sma/sma-calculation';

/**
 * Calculate Rate of Change values using oakscriptjs
 * Formula: 100 * (source - source[length]) / source[length]
 * @param bars - OHLCV bar data
 * @param length - Lookback period
 * @param source - Source data (open, high, low, close, etc.)
 * @returns Array of time-value pairs
 */
export function calculateROC(
  bars: Bar[],
  length: number,
  source: string
): Array<{ time: number; value: number }> {
  // Get source series
  const src = getSourceSeries(bars, source);

  // Calculate ROC using oakscriptjs ta.roc
  const rocValues = ta.roc(src, length);

  // Convert to time-value pairs
  const rocArray = rocValues.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const value = rocArray[i];
    const bar = bars[i];
    if (bar && value !== undefined && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }

  return data;
}
