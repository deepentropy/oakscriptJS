/**
 * McGinley Dynamic Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import { Series, ta, type Bar } from '@deepentropy/oakscriptjs';

/**
 * Calculate McGinley Dynamic values
 * Recursive formula: mg := na(mg[1]) ? ta.ema(source, length) : mg[1] + (source - mg[1]) / (length * math.pow(source/mg[1], 4))
 * @param bars - OHLCV bar data
 * @param length - Period length
 * @returns Array of time-value pairs
 */
export function calculateMcGinleyDynamic(
  bars: Bar[],
  length: number
): Array<{ time: number; value: number }> {
  // Get close series
  const close = Series.fromBars(bars, 'close');
  const closeArray = close.toArray();

  // Calculate initial EMA for seed value
  const emaValues = ta.ema(close, length);
  const emaArray = emaValues.toArray();

  const data: Array<{ time: number; value: number }> = [];
  let mg: number | undefined = undefined;

  for (let i = 0; i < bars.length; i++) {
    const source = closeArray[i];
    const bar = bars[i];

    if (source === undefined || Number.isNaN(source) || !bar) {
      continue;
    }

    if (mg === undefined || Number.isNaN(mg)) {
      // Initialize with EMA
      mg = emaArray[i];
      if (mg !== undefined && !Number.isNaN(mg)) {
        data.push({ time: bar.time, value: mg });
      }
    } else {
      // McGinley Dynamic formula
      const ratio = source / mg;
      const adjustment = Math.pow(ratio, 4);
      mg = mg + (source - mg) / (length * adjustment);

      if (!Number.isNaN(mg)) {
        data.push({ time: bar.time, value: mg });
      }
    }
  }

  return data;
}
