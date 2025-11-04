/**
 * Utility functions for OakScriptJS
 * These are internal helpers and not part of the PineScript API
 */

import { series_float, int, float, Source, Bar, OHLC } from '../types';
import { sma, ema, wma, rma } from '../ta';

/**
 * Validates that a series has sufficient data for a given length
 */
export function validateSeriesLength(source: Source, length: int, functionName: string): void {
  if (source.length < length) {
    console.warn(`${functionName}: Source length (${source.length}) is less than required length (${length})`);
  }
}

/**
 * Creates a series filled with NaN values
 */
export function createNaNSeries(length: int): series_float {
  return new Array(length).fill(NaN);
}

/**
 * Checks if a value is NaN or null
 */
export function isNA(value: any): boolean {
  return value === null || value === undefined || Number.isNaN(value);
}

/**
 * Returns the value or a default if it's NA
 */
export function nz(value: any, defaultValue: any = 0): any {
  return isNA(value) ? defaultValue : value;
}

/**
 * Ensures a value is within bounds
 */
export function clamp(value: float, min: float, max: float): float {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: float, end: float, t: float): float {
  return start + (end - start) * t;
}

/**
 * Normalize a value from one range to another
 */
export function normalize(value: float, min: float, max: float, newMin: float = 0, newMax: float = 1): float {
  return newMin + ((value - min) * (newMax - newMin)) / (max - min);
}

// ===== Chart Data Utilities =====
// These functions help convert between bar arrays and OHLC data structures

/**
 * Creates OHLC data from bar array
 * @param bars - Array of bar data
 * @returns OHLC data structure
 */
export function ohlcFromBars(bars: Bar[]): OHLC {
  return {
    open: bars.map(b => b.open),
    high: bars.map(b => b.high),
    low: bars.map(b => b.low),
    close: bars.map(b => b.close),
  };
}

/**
 * Gets close prices from OHLC
 * @param ohlc - OHLC data
 * @returns Close price series
 */
export function getClose(ohlc: OHLC): series_float {
  return ohlc.close;
}

/**
 * Gets high prices from OHLC
 * @param ohlc - OHLC data
 * @returns High price series
 */
export function getHigh(ohlc: OHLC): series_float {
  return ohlc.high;
}

/**
 * Gets low prices from OHLC
 * @param ohlc - OHLC data
 * @returns Low price series
 */
export function getLow(ohlc: OHLC): series_float {
  return ohlc.low;
}

/**
 * Gets open prices from OHLC
 * @param ohlc - OHLC data
 * @returns Open price series
 */
export function getOpen(ohlc: OHLC): series_float {
  return ohlc.open;
}

// ===== Source Extraction Utilities =====

/**
 * Extract a specific source from OHLC data or bar array
 *
 * @param data - Bar array or OHLC data
 * @param source - Source type: 'close', 'open', 'high', 'low', 'hl2', 'hlc3', 'ohlc4'
 * @returns Series of the requested source
 *
 * @example
 * ```typescript
 * const bars = [{ open: 100, high: 105, low: 98, close: 102 }, ...];
 * const closes = getSource(bars, 'close'); // [102, ...]
 * const hl2 = getSource(bars, 'hl2'); // [(105+98)/2, ...]
 * ```
 */
export function getSource(
  data: Bar[] | OHLC,
  source: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4' = 'close'
): series_float {
  // Check if data is OHLC structure
  const isOHLC = 'open' in data && Array.isArray(data.open);

  if (isOHLC) {
    const ohlc = data as OHLC;
    switch (source) {
      case 'close': return ohlc.close;
      case 'open': return ohlc.open;
      case 'high': return ohlc.high;
      case 'low': return ohlc.low;
      case 'hl2': return ohlc.high.map((h, i) => (h + ohlc.low[i]) / 2);
      case 'hlc3': return ohlc.high.map((h, i) => (h + ohlc.low[i] + ohlc.close[i]) / 3);
      case 'ohlc4': return ohlc.open.map((o, i) => (o + ohlc.high[i] + ohlc.low[i] + ohlc.close[i]) / 4);
      case 'hlcc4': return ohlc.high.map((h, i) => (h + ohlc.low[i] + ohlc.close[i] + ohlc.close[i]) / 4);
    }
  } else {
    const bars = data as Bar[];
    switch (source) {
      case 'close': return bars.map(b => b.close);
      case 'open': return bars.map(b => b.open);
      case 'high': return bars.map(b => b.high);
      case 'low': return bars.map(b => b.low);
      case 'hl2': return bars.map(b => (b.high + b.low) / 2);
      case 'hlc3': return bars.map(b => (b.high + b.low + b.close) / 3);
      case 'ohlc4': return bars.map(b => (b.open + b.high + b.low + b.close) / 4);
      case 'hlcc4': return bars.map(b => (b.high + b.low + b.close + b.close) / 4);
    }
  }
}

// ===== Series Manipulation Utilities =====

/**
 * Shift (offset) a series forward or backward in time
 *
 * @param series - Series to shift
 * @param offset - Number of bars to shift (positive = forward/right, negative = backward/left)
 * @returns Shifted series with NaN padding
 *
 * @example
 * ```typescript
 * const values = [1, 2, 3, 4, 5];
 * shift(values, 2);  // [NaN, NaN, 1, 2, 3]  (shift forward)
 * shift(values, -2); // [3, 4, 5, NaN, NaN]  (shift backward)
 * ```
 */
export function shift(series: series_float, offset: int): series_float {
  if (offset === 0) return series;

  if (offset > 0) {
    // Shift forward: add NaN at start, remove from end
    return Array(offset).fill(NaN).concat(series.slice(0, -offset));
  } else {
    // Shift backward: remove from start, add NaN at end
    return series.slice(-offset).concat(Array(-offset).fill(NaN));
  }
}

/**
 * Apply smoothing to a series using a specified method
 *
 * @param series - Series to smooth
 * @param method - Smoothing method: 'SMA', 'EMA', 'WMA', 'RMA'
 * @param length - Smoothing length
 * @returns Smoothed series
 *
 * @example
 * ```typescript
 * const values = [10, 11, 12, 13, 14];
 * const smoothed = smooth(values, 'EMA', 3);
 * ```
 *
 * @remarks
 * This is a convenience function that delegates to the appropriate ta function.
 * Import this from utils, not from ta namespace.
 */
export function smooth(
  series: series_float,
  method: 'SMA' | 'EMA' | 'WMA' | 'RMA',
  length: int
): series_float {
  switch (method.toUpperCase()) {
    case 'SMA': return sma(series, length);
    case 'EMA': return ema(series, length);
    case 'WMA': return wma(series, length);
    case 'RMA': return rma(series, length);
    default:
      throw new Error(`Unknown smoothing method: ${method}`);
  }
}

/**
 * Format series values with timestamps for output
 *
 * @param values - Series of values to format
 * @param timestamps - Array of timestamps (optional)
 * @returns Array of objects with time and value properties
 *
 * @example
 * ```typescript
 * const values = [100, 101, NaN, 103];
 * const times = [1, 2, 3, 4];
 * const formatted = formatOutput(values, times);
 * // [{ time: 1, value: 100 }, { time: 2, value: 101 }, { time: 3, value: null }, { time: 4, value: 103 }]
 * ```
 */
export function formatOutput(
  values: series_float,
  timestamps?: number[]
): Array<{ time: number; value: number | null }> {
  return values.map((value, index) => ({
    time: timestamps ? timestamps[index] : index,
    value: isNaN(value) ? null : value
  }));
}
