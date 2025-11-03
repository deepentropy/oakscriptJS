/**
 * Chart namespace
 * Chart-related functions and data structures
 *
 * TODO: Implement chart data management
 */

import { Bar, OHLC, series_float } from '../types';

/**
 * Chart data structure
 */
export interface ChartData {
  symbol: string;
  timeframe: string;
  bars: Bar[];
}

/**
 * Creates OHLC data from bars
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
 */
export function getClose(ohlc: OHLC): series_float {
  return ohlc.close;
}

/**
 * Gets high prices from OHLC
 */
export function getHigh(ohlc: OHLC): series_float {
  return ohlc.high;
}

/**
 * Gets low prices from OHLC
 */
export function getLow(ohlc: OHLC): series_float {
  return ohlc.low;
}

/**
 * Gets open prices from OHLC
 */
export function getOpen(ohlc: OHLC): series_float {
  return ohlc.open;
}

// TODO: Add more chart functions
// - point data structures
// - line drawing
// - shape drawing
// - etc.
