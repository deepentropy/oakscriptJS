/**
 * Least Squares Moving Average (LSMA) Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import { Series, taCore, type Bar } from '@deepentropy/oakscriptjs';
import { getSourceSeries } from '../sma/sma-calculation';

/**
 * Calculate Least Squares Moving Average values using oakscriptjs
 * Uses linear regression (linreg) to compute the LSMA
 * @param bars - OHLCV bar data
 * @param length - Period length
 * @param offset - Offset value
 * @param source - Source data (open, high, low, close, etc.)
 * @returns Array of time-value pairs
 */
export function calculateLSMA(
  bars: Bar[],
  length: number,
  offset: number,
  source: string
): Array<{ time: number; value: number }> {
  // Get source series
  const src = getSourceSeries(bars, source);
  const srcArray = src.toArray();

  // Calculate LSMA using core ta.linreg
  const lsmaValues = taCore.linreg(srcArray, length, offset);

  // Convert to time-value pairs
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const value = lsmaValues[i];
    const bar = bars[i];
    if (bar && value !== undefined && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }

  return data;
}
