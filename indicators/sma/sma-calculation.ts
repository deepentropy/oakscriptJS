/**
 * SMA Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import { Series, ta, type Bar } from '@deepentropy/oakscriptjs';

/**
 * Get source series based on source name
 */
export function getSourceSeries(bars: Bar[], sourceName: string): Series {
  switch (sourceName) {
    case 'open':
      return Series.fromBars(bars, 'open');
    case 'high':
      return Series.fromBars(bars, 'high');
    case 'low':
      return Series.fromBars(bars, 'low');
    case 'close':
      return Series.fromBars(bars, 'close');
    case 'hl2': {
      const high = Series.fromBars(bars, 'high');
      const low = Series.fromBars(bars, 'low');
      return high.add(low).div(2);
    }
    case 'hlc3': {
      const high = Series.fromBars(bars, 'high');
      const low = Series.fromBars(bars, 'low');
      const close = Series.fromBars(bars, 'close');
      return high.add(low).add(close).div(3);
    }
    case 'ohlc4': {
      const open = Series.fromBars(bars, 'open');
      const high = Series.fromBars(bars, 'high');
      const low = Series.fromBars(bars, 'low');
      const close = Series.fromBars(bars, 'close');
      return open.add(high).add(low).add(close).div(4);
    }
    default:
      return Series.fromBars(bars, 'close');
  }
}

/**
 * Calculate SMA values using oakscriptjs
 * @param bars - OHLCV bar data
 * @param length - SMA period length
 * @param source - Source data (open, high, low, close, etc.)
 * @param offset - Offset for the output values
 * @returns Array of time-value pairs
 */
export function calculateSMA(
  bars: Bar[],
  length: number,
  source: string,
  offset: number
): Array<{ time: number; value: number }> {
  // Get source series
  const src = getSourceSeries(bars, source);

  // Calculate SMA using oakscriptjs ta.sma
  const smaValues = ta.sma(src, length);

  // Convert to time-value pairs with offset applied
  const smaArray = smaValues.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const targetIndex = i + offset;
    if (targetIndex >= 0 && targetIndex < bars.length) {
      const value = smaArray[i];
      const targetBar = bars[targetIndex];
      if (targetBar && value !== undefined && !Number.isNaN(value)) {
        data.push({ time: targetBar.time, value });
      }
    }
  }

  return data;
}
