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

import { Source, simple_float, simple_int, simple_bool, series_float, series_int } from './types';
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
       * @returns True range series
       *
       * @remarks
       * This wrapped version uses chart data from context, matching PineScript's API.
       *
       * @example
       * ```typescript
       * const { ta } = createContext({ chart: { high, low, close } });
       * const trueRange = ta.tr();
       * ```
       */
      tr: (): series_float => {
        if (!chart) {
          throw new Error(
            'Chart context required for ta.tr(). ' +
            'Call createContext({ chart: { high, low, close } }) first.'
          );
        }
        return taFunctions.tr(chart.high, chart.low, chart.close);
      },

      // ===== PASS-THROUGH FUNCTIONS (already have explicit parameters) =====
      // These functions don't need wrapping - they already require explicit source data

      sma: taFunctions.sma,
      ema: taFunctions.ema,
      rsi: taFunctions.rsi,
      macd: taFunctions.macd,
      bb: taFunctions.bb,
      stdev: taFunctions.stdev,
      crossover: taFunctions.crossover,
      crossunder: taFunctions.crossunder,
      change: taFunctions.change,
    },

    /**
     * Math namespace - all functions passed through.
     *
     * @remarks
     * Future: Could add round_to_mintick() that uses syminfo.mintick from context.
     */
    math: {
      ...mathFunctions,
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
