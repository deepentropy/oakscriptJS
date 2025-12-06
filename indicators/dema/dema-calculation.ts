/**
 * Double EMA (DEMA) Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import {Series, ta, type Bar} from 'oakscriptjs';
import { getSourceSeries } from '../sma/sma-calculation';

/**
 * Calculate Double EMA values using oakscriptjs
 * Formula: 2 * EMA(src, length) - EMA(EMA(src, length), length)
 * @param bars - OHLCV bar data
 * @param length - EMA period length
 * @param source - Source data (open, high, low, close, etc.)
 * @returns Array of time-value pairs
 */
export function calculateDEMA(
  bars: Bar[],
  length: number,
  source: string
): Array<{ time: number; value: number }> {
  // Get source series
  const src = getSourceSeries(bars, source);

  // Calculate EMA1 = EMA(src, length)
  const ema1 = ta.ema(src, length);

  // Calculate EMA2 = EMA(EMA1, length)
  const ema2 = ta.ema(ema1, length);

  // Calculate DEMA = 2 * EMA1 - EMA2
  const dema = ema1.mul(2).sub(ema2);

  // Convert to time-value pairs
  const demaArray = dema.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const value = demaArray[i];
    const bar = bars[i];
    if (bar && value !== undefined && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }

  return data;
}
