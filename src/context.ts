/**
 * Context API for OakScriptJS
 * Allows setting implicit chart data to match PineScript's API style.
 *
 * @example
 * ```typescript
 * // Setup context once with your chart data
 * const { ta, math, str } = createContext({
 *   chart: { high, low, close, open, volume }
 * });
 *
 * // Now use ta functions without repeating chart data
 * const [supertrend, direction] = ta.supertrend(3, 10);
 * const atr14 = ta.atr(14);
 * const trueRange = ta.tr();
 *
 * // Other namespaces work as normal
 * const sma20 = ta.sma(close, 20);
 * const rounded = math.round(value, 2);
 * ```
 *
 * @remarks
 * - Only functions requiring implicit chart data are wrapped
 * - Functions with explicit parameters work unchanged
 * - Multiple contexts can coexist (no global state)
 * - TypeScript provides full type safety
 *
 * @version 6
 */

import { Source, simple_float, simple_int, simple_bool, series_float, series_int, float } from './types';
import * as taFunctions from './ta';
import * as mathFunctions from './math';
import * as strFunctions from './str';
import * as colorFunctions from './color';
import * as arrayFunctions from './array';

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
 */
export interface ContextConfig {
  /** Chart data (OHLCV) for technical analysis functions */
  chart?: ChartData;
  /** Symbol information for price-related functions */
  syminfo?: SymbolInfo;
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
export function createContext(config: ContextConfig = {}) {
  const { chart, syminfo } = config;

  return {
    /**
     * Technical Analysis namespace with context-aware functions.
     *
     * Functions requiring implicit chart data (supertrend, atr, tr) are wrapped.
     * All other functions are passed through unchanged.
     */
    ta: {
      // ===== WRAPPED FUNCTIONS (need implicit chart data) =====

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
      supertrend: (
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
      },

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
      stoch: (source: Source, length: simple_int): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.stoch(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.stoch(source, chart.high, chart.low, length);
      },

      /**
       * Pivot High - now uses implicit high data from context.
       *
       * @param leftbars - Left bars
       * @param rightbars - Right bars
       * @returns Pivot high series
       */
      pivothigh: (leftbars: simple_int, rightbars: simple_int): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.pivothigh(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.pivothigh(leftbars, rightbars, undefined, chart.high);
      },

      /**
       * Pivot Low - now uses implicit low data from context.
       *
       * @param leftbars - Left bars
       * @param rightbars - Right bars
       * @returns Pivot low series
       */
      pivotlow: (leftbars: simple_int, rightbars: simple_int): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.pivotlow(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.pivotlow(leftbars, rightbars, undefined, chart.low);
      },

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

      // ===== PASS-THROUGH FUNCTIONS (already have explicit parameters) =====
      // These functions don't need wrapping - they already require explicit source data

      sma: taFunctions.sma,
      ema: taFunctions.ema,
      rsi: taFunctions.rsi,
      macd: taFunctions.macd,
      bb: taFunctions.bb,
      bbw: taFunctions.bbw,
      stdev: taFunctions.stdev,
      crossover: taFunctions.crossover,
      crossunder: taFunctions.crossunder,
      change: taFunctions.change,
      cci: taFunctions.cci,
      cmo: taFunctions.cmo,
      hma: taFunctions.hma,
      tsi: taFunctions.tsi,
      barssince: taFunctions.barssince,
      valuewhen: taFunctions.valuewhen,
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
  };
}

/**
 * Type helper to extract the return type of createContext.
 * Useful for TypeScript users who want to type their context variables.
 *
 * @example
 * ```typescript
 * const ctx: OakContext = createContext({ chart });
 * ```
 */
export type OakContext = ReturnType<typeof createContext>;
