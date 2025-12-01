/**
 * Triple EMA (TEMA) Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import { Series, ta, type Bar } from '@deepentropy/oakscriptjs';
import { getSourceSeries } from '../sma/sma-calculation';

/**
 * Calculate Triple EMA values using oakscriptjs
 * Formula: 3 * (EMA1 - EMA2) + EMA3
 * where EMA1 = EMA(close, length), EMA2 = EMA(EMA1, length), EMA3 = EMA(EMA2, length)
 * @param bars - OHLCV bar data
 * @param length - EMA period length
 * @param source - Source data (open, high, low, close, etc.)
 * @returns Array of time-value pairs
 */
export function calculateTEMA(
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

  // Calculate EMA3 = EMA(EMA2, length)
  const ema3 = ta.ema(ema2, length);

  // Calculate TEMA = 3 * (EMA1 - EMA2) + EMA3
  const tema = ema1.sub(ema2).mul(3).add(ema3);

  // Convert to time-value pairs
  const temaArray = tema.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const value = temaArray[i];
    const bar = bars[i];
    if (bar && value !== undefined && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }

  return data;
}
