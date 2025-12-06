/**
 * SMA Calculation Logic
 * Contains the core calculation using oakscriptjs
 */

import {Series, ta, type Bar} from 'oakscriptjs';

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
  // Offset shifts the indicator line horizontally:
  // - Positive offset: shifts line forward (into the future)
  // - Negative offset: shifts line backward (into the past)
  const smaArray = smaValues.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    // Apply offset to determine which bar's timestamp to use for this value
    const offsetIndex = i + offset;
    if (offsetIndex >= 0 && offsetIndex < bars.length) {
      const value = smaArray[i];
      const offsetBar = bars[offsetIndex];
      if (offsetBar && value !== undefined && !Number.isNaN(value)) {
        data.push({ time: offsetBar.time, value });
      }
    }
  }

  return data;
}
