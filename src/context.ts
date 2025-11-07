/**
 * Context API for OakScriptJS
 * Allows setting implicit chart data to match PineScript's API style.
 *
 * @example
 * ```typescript
 * // Setup context once with your chart data
 * const { ta, math, str, line, box } = createContext({
 *   chart: { high, low, close, open, volume }
 * });
 *
 * // Now use ta functions without repeating chart data
 * const [supertrend, direction] = ta.supertrend(3, 10);
 * const atr14 = ta.atr(14);
 * const trueRange = ta.tr();
 *
 * // Drawing objects with implicit current bar
 * const trendLine = line.new(0, 100, 50, 150);
 * const currentPrice = line.get_price(trendLine); // Uses current bar implicitly
 *
 * // Other namespaces work as normal
 * const sma20 = ta.sma(close, 20);
 * const rounded = math.round(value, 2);
 * ```
 *
 * @remarks
 * - Only functions requiring implicit chart data are wrapped
 * - line.get_price() can use implicit current bar index
 * - Functions with explicit parameters work unchanged
 * - Multiple contexts can coexist (no global state)
 * - TypeScript provides full type safety
 *
 * @version 6
 */

import { Source, simple_float, simple_int, simple_bool, series_float, series_int, float, Bar, Line, Box as _Box, Label as _Label, Linefill as _Linefill, color as _color } from './types';
import * as taFunctions from './ta';
import * as mathFunctions from './math';
import * as strFunctions from './str';
import * as colorFunctions from './color';
import * as arrayFunctions from './array';
import * as lineFunctions from './line';
import * as boxFunctions from './box';
import * as labelFunctions from './label';
import * as linefillFunctions from './linefill';
import { getSource as utilGetSource, formatOutput, ohlcFromBars } from './utils';

/**
 * Chart data required for technical analysis functions.
 */
export interface ChartData {
  /** High prices for each bar */
  high: Source;
  /** Low prices for each bar */
  low: Source;
  /** Close prices for each bar */
  close: Source;
  /** Open prices for each bar (optional) */
  open?: Source;
  /** Volume for each bar (optional) */
  volume?: Source;
}

/**
 * Symbol information that can be used by various functions.
 */
export interface SymbolInfo {
  /** Minimum tick size (e.g., 0.01 for penny stocks) */
  mintick: number;
  /** Ticker symbol (e.g., "AAPL") */
  ticker?: string;
  /** Price scale (e.g., 100 for 0.01 mintick) */
  pricescale?: number;
}

/**
 * Configuration for creating a context with implicit data.
 * Can accept either explicit ChartData or an array of Bars.
 */
export interface ContextConfig {
  /** Chart data (OHLCV) for technical analysis functions */
  chart?: ChartData;
  /** Symbol information for price-related functions */
  syminfo?: SymbolInfo;
  /** Optional: Raw bar data (alternative to chart) */
  data?: Bar[];
}

/**
 * Creates a context with implicit data for cleaner function calls.
 *
 * @param config - Context configuration with chart data and symbol info
 * @returns Object containing all namespaces with context-aware functions
 *
 * @remarks
 * - Pass the returned object to destructure namespaces: `const { ta, math } = createContext(...)`
 * - Functions requiring implicit data are wrapped automatically
 * - Functions with explicit parameters are passed through unchanged
 * - Multiple contexts can exist simultaneously
 *
 * @example
 * ```typescript
 * const { ta, math, str } = createContext({
 *   chart: { high, low, close, open, volume },
 *   syminfo: { mintick: 0.01, ticker: 'AAPL' }
 * });
 *
 * // Clean API - matches PineScript style
 * const [st, dir] = ta.supertrend(3, 10);
 * const atr14 = ta.atr(14);
 *
 * // Functions with explicit params work as before
 * const sma20 = ta.sma(close, 20);
 * ```
 */
export function createContext(config: ContextConfig = {}): OakContext {
  let { chart, syminfo, data } = config;

  // If data array is provided, convert to chart format
  if (data && !chart) {
    const ohlc = ohlcFromBars(data);
    chart = {
      open: ohlc.open,
      high: ohlc.high,
      low: ohlc.low,
      close: ohlc.close,
      volume: data[0]?.volume !== undefined ? data.map(b => b.volume || 0) : undefined
    };
  }

  return {
    /**
     * Technical Analysis namespace with context-aware functions.
     *
     * Functions requiring implicit chart data (supertrend, atr, tr) are wrapped.
     * All other functions are passed through unchanged.
     */
    ta: {
      // ===== PASS-THROUGH ALL FUNCTIONS FIRST =====
      // Spread all ta functions to make them available
      ...taFunctions,

      // ===== THEN OVERRIDE WITH WRAPPED FUNCTIONS (need implicit chart data) =====

      /**
       * SuperTrend indicator - now uses implicit chart data from context.
       *
       * @param factor - The multiplier by which the ATR will get multiplied
       * @param atrPeriod - Length of ATR
       * @param wicks - Whether to use wicks for trend reversal (default: false)
       * @returns Tuple of [supertrend, direction]
       *
       * @remarks
       * This wrapped version uses chart data from context, matching PineScript's API.
       *
       * @example
       * ```typescript
       * const { ta } = createContext({ chart: { high, low, close } });
       * const [supertrend, direction] = ta.supertrend(3, 10);
       * ```
       */
      supertrend: ((
        factor: simple_float,
        atrPeriod: simple_int,
        wicks: simple_bool = false
      ): [series_float, series_int] => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.supertrend(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.supertrend(factor, atrPeriod, chart.high, chart.low, chart.close, wicks);
      }) as any,

      /**
       * Average True Range - now uses implicit chart data from context.
       *
       * @param length - Number of bars for averaging
       * @returns Average true range series
       *
       * @remarks
       * This wrapped version uses chart data from context, matching PineScript's API.
       *
       * @example
       * ```typescript
       * const { ta } = createContext({ chart: { high, low, close } });
       * const atr14 = ta.atr(14);
       * ```
       */
      atr: (length: simple_int): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.atr(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.atr(length, chart.high, chart.low, chart.close);
      },

      /**
       * True Range - now uses implicit chart data from context.
       *
       * @param handle_na - Defines how the function calculates when previous close is na (default: false)
       * @returns True range series
       *
       * @remarks
       * This wrapped version uses chart data from context, matching PineScript's API.
       *
       * @example
       * ```typescript
       * const { ta } = createContext({ chart: { high, low, close } });
       * const trueRange = ta.tr();
       * const trueRangeHandleNa = ta.tr(true);
       * ```
       */
      tr: (handle_na: simple_bool = false): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.tr(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.tr(handle_na, chart.high, chart.low, chart.close);
      },

      /**
       * Parabolic SAR - now uses implicit chart data from context.
       *
       * @param start - Acceleration factor start
       * @param inc - Acceleration factor increment
       * @param max - Maximum acceleration factor
       * @returns SAR series
       */
      sar: (start: simple_float, inc: simple_float, max: simple_float): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.sar(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.sar(start, inc, max, chart.high, chart.low, chart.close);
      },

      /**
       * Money Flow Index - now uses implicit volume data from context.
       *
       * @param source - Source series
       * @param length - Number of bars
       * @returns MFI series
       */
      mfi: (source: Source, length: simple_int): series_float => {
        if (!chart || !chart.volume) {
          throw new Error(
            'Chart context with volume required for ta.mfi(). ' +
            'Call createContext({ chart: { ..., volume } }) first.'
          );
        }
        return taFunctions.mfi(source, length, chart.volume);
      },

      /**
       * Stochastic Oscillator - now uses implicit high/low data from context.
       *
       * @param source - Source series (typically close)
       * @param length - Number of bars
       * @returns Stochastic %K series
       */
      stoch: ((source: Source, length: simple_int): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.stoch(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.stoch(source, chart.high, chart.low, length);
      }) as any,

      /**
       * Pivot High - now uses implicit high data from context.
       *
       * @param leftbars - Left bars
       * @param rightbars - Right bars
       * @returns Pivot high series
       */
      pivothigh: ((leftbars: simple_int, rightbars: simple_int): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.pivothigh(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.pivothigh(leftbars, rightbars, undefined, chart.high);
      }) as any,

      /**
       * Pivot Low - now uses implicit low data from context.
       *
       * @param leftbars - Left bars
       * @param rightbars - Right bars
       * @returns Pivot low series
       */
      pivotlow: ((leftbars: simple_int, rightbars: simple_int): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.pivotlow(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.pivotlow(leftbars, rightbars, undefined, chart.low);
      }) as any,

      /**
       * Directional Movement Index - now uses implicit chart data from context.
       *
       * @param diLength - DI averaging length
       * @param adxSmoothing - ADX smoothing length
       * @returns Tuple of [plusDI, minusDI, ADX]
       */
      dmi: (diLength: simple_int, adxSmoothing: simple_int): [series_float, series_float, series_float] => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.dmi(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.dmi(diLength, adxSmoothing, chart.high, chart.low, chart.close);
      },

      /**
       * Keltner Channels - now uses implicit chart data from context.
       *
       * @param source - Source series
       * @param length - Number of bars
       * @param mult - Multiplier
       * @param useTrueRange - Use True Range (default: true)
       * @returns Tuple of [middle, upper, lower]
       */
      kc: (
        source: Source,
        length: simple_int,
        mult: simple_float,
        useTrueRange: simple_bool = true
      ): [series_float, series_float, series_float] => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.kc(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.kc(source, length, mult, useTrueRange, chart.high, chart.low, chart.close);
      },

    },

    /**
     * Math namespace with context-aware functions.
     *
     * @remarks
     * round_to_mintick() uses syminfo.mintick from context when available.
     */
    math: {
      ...mathFunctions,

      /**
       * Rounds a value to the nearest mintick - now uses implicit syminfo from context.
       *
       * @param number - The number to round
       * @returns The number rounded to tick precision
       *
       * @remarks
       * This wrapped version uses syminfo.mintick from context, matching PineScript's API.
       *
       * @example
       * ```typescript
       * const { math } = createContext({ syminfo: { mintick: 0.01 } });
       * const rounded = math.round_to_mintick(1.2345); // Returns: 1.23
       * ```
       */
      round_to_mintick: (number: float): float => {
        if (!syminfo || syminfo.mintick === undefined) {
          throw new Error(
            'Syminfo context with mintick required for math.round_to_mintick(). ' +
            'Call createContext({ syminfo: { mintick: 0.01 } }) first.'
          );
        }
        return mathFunctions.round_to_mintick(number, syminfo.mintick);
      },
    },

    /**
     * String namespace - all functions passed through.
     */
    str: {
      ...strFunctions,
    },

    /**
     * Color namespace - all functions passed through.
     */
    color: {
      ...colorFunctions,
    },

    /**
     * Array namespace - all functions passed through.
     */
    array: {
      ...arrayFunctions,
    },

    /**
     * Line namespace with context-aware functions.
     *
     * @remarks
     * line.get_price() can use implicit current bar index when not provided.
     */
    line: {
      ...lineFunctions,

      /**
       * Gets the price level of the line at a given bar index.
       * Now uses implicit current bar from context when x is not provided.
       *
       * @param id - Line object
       * @param x - Bar index (optional, defaults to current bar from context)
       * @returns Price value at that bar index, or NaN if outside line bounds
       *
       * @example
       * ```typescript
       * const { line } = createContext({ data: bars });
       * const trendLine = line.new(0, 100, 50, 150);
       *
       * // Get price at current bar (implicit)
       * const currentPrice = line.get_price(trendLine);
       *
       * // Get price at specific bar
       * const priceAt25 = line.get_price(trendLine, 25);
       * ```
       */
      get_price: (id: Line, x?: number): number => {
        // If x not provided and we have chart data, use current bar index
        if (x === undefined) {
          if (!chart) {
            throw new Error(
              'Chart context required for implicit bar index in line.get_price(). ' +
              'Either provide x parameter or call createContext({ chart }) first.'
            );
          }
          x = chart.close.length - 1;
        }
        return lineFunctions.get_price(id, x);
      }
    },

    /**
     * Box namespace - all functions passed through.
     *
     * @remarks
     * Box functions work with explicit coordinates and don't need context wrappers.
     */
    box: {
      ...boxFunctions,
    },

    /**
     * Label namespace - all functions passed through.
     *
     * @remarks
     * Label functions work with explicit coordinates and don't need context wrappers.
     */
    label: {
      ...labelFunctions,
    },

    /**
     * Linefill namespace - all functions passed through.
     *
     * @remarks
     * Linefill functions work with line references and don't need context wrappers.
     */
    linefill: {
      ...linefillFunctions,
    },

    // ===== UTILITY FUNCTIONS =====

    /**
     * Get a specific source from the context's chart data
     *
     * @param source - Source type: 'close', 'open', 'high', 'low', 'hl2', 'hlc3', 'ohlc4'
     * @returns Series of the requested source
     *
     * @example
     * ```typescript
     * const { getSource, ta } = createContext({ data: bars });
     * const closes = getSource('close');
     * const hl2 = getSource('hl2');
     * const sma = ta.sma(getSource('close'), 20);
     * ```
     */
    getSource: (source: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4' = 'close'): series_float => {
      if (!chart) {
        throw new Error('Chart context required for getSource(). Call createContext({ data: bars }) first.');
      }
      // Convert ChartData to OHLC format for utilGetSource
      const ohlc = {
        open: chart.open || [],
        high: chart.high,
        low: chart.low,
        close: chart.close
      };
      return utilGetSource(ohlc, source);
    },

    /**
     * Format series values with timestamps for output
     *
     * @param values - Series of values to format
     * @param timestamps - Optional array of timestamps (uses data timestamps if available)
     * @returns Array of objects with time and value properties
     *
     * @example
     * ```typescript
     * const { ta, format } = createContext({ data: bars });
     * const smaValues = ta.sma(getSource('close'), 20);
     * const output = format(smaValues);
     * ```
     */
    format: (values: series_float, timestamps?: number[]): Array<{ time: number; value: number | null }> => {
      // If timestamps not provided and we have bar data, use those timestamps
      if (!timestamps && data) {
        timestamps = data.map(b => b.time);
      }
      return formatOutput(values, timestamps);
    },
  };
}

/**
 * Type representing the return value of createContext.
 * Useful for TypeScript users who want to type their context variables.
 *
 * @example
 * ```typescript
 * const ctx: OakContext = createContext({ chart });
 * ```
 */
export interface OakContext {
  ta: typeof taFunctions & {
    supertrend: (factor: simple_float, atrPeriod: simple_int, wicks?: simple_bool) => [series_float, series_int];
    atr: (length: simple_int) => series_float;
    tr: (handle_na?: simple_bool) => series_float;
    sar: (start: simple_float, inc: simple_float, max: simple_float) => series_float;
    mfi: (source: Source, length: simple_int) => series_float;
    stoch: (source: Source, length: simple_int) => series_float;
    pivothigh: (leftbars: simple_int, rightbars: simple_int) => series_float;
    pivotlow: (leftbars: simple_int, rightbars: simple_int) => series_float;
    dmi: (diLength: simple_int, adxSmoothing: simple_int) => [series_float, series_float, series_float];
    vwma: (source: Source, length: simple_int) => series_float;
  };
  math: typeof mathFunctions;
  str: typeof strFunctions;
  color: typeof colorFunctions;
  array: typeof arrayFunctions;
  line: typeof lineFunctions & {
    get_price: (id: Line, x?: number) => number;
  };
  box: typeof boxFunctions;
  label: typeof labelFunctions;
  linefill: typeof linefillFunctions;
  getSource: (source?: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4') => series_float;
  format: (values: series_float, timestamps?: number[]) => Array<{ time: number; value: number | null }>;
}
