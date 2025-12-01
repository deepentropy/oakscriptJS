/**
 * Balance of Power (BOP) Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import { Series, type Bar } from '@deepentropy/oakscriptjs';

/**
 * Calculate Balance of Power values
 * Formula: (close - open) / (high - low)
 * @param bars - OHLCV bar data
 * @returns Array of time-value pairs
 */
export function calculateBOP(
  bars: Bar[]
): Array<{ time: number; value: number }> {
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar) {
      const range = bar.high - bar.low;
      // Avoid division by zero
      const value = range !== 0 ? (bar.close - bar.open) / range : 0;
      if (!Number.isNaN(value)) {
        data.push({ time: bar.time, value });
      }
    }
  }

  return data;
}
