/**
 * OakScriptJS - JavaScript mirror of the PineScript API
 *
 * This library provides the exact same API signatures as PineScript,
 * allowing you to write indicator and strategy logic in JavaScript/TypeScript
 * that matches PineScript syntax and behavior.
 *
 * Focus: Calculation and indicator functions only.
 * This library does NOT include rendering (plot, line, label, box, table),
 * UI (input), strategy execution, or data fetching (request) functions.
 *
 * @packageDocumentation
 */

// Export all types
export * from './types';

// Export namespaces
import * as ta from './ta';
import * as math from './math';
import * as array from './array';
import * as str from './str';
import * as color from './color';
import * as time from './time';
import * as matrix from './matrix';

export { ta, math, array, str, color, time, matrix };

// Export context API
export { createContext } from './context';
export type { ChartData, SymbolInfo, ContextConfig, OakContext } from './context';

// Re-export commonly used functions for convenience
export { sma, ema, rsi, macd, bb, stdev, crossover, crossunder, change, tr, atr } from './ta';
export { abs, ceil, floor, round, max, min, avg, sum, sqrt, pow, exp, log, sin, cos, tan } from './math';
export { rgb, from_hex as color_from_hex, new_color } from './color';

// Export chart data utilities (previously in chart namespace)
export { ohlcFromBars, getClose, getHigh, getLow, getOpen } from './utils';

// Version
export const VERSION = '0.1.1';

/**
 * Library information
 */
export const info = {
  name: 'OakScriptJS',
  version: VERSION,
  description: 'JavaScript mirror of the PineScript API (calculation/indicator functions only)',
  namespaces: ['ta', 'math', 'array', 'str', 'color', 'time', 'matrix'],
  excludedNamespaces: ['plot', 'line', 'label', 'box', 'table', 'input', 'strategy', 'request', 'alert'],
};
