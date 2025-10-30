/**
 * OakScriptJS - JavaScript mirror of the PineScript API
 *
 * This library provides the exact same API signatures as PineScript,
 * allowing you to write indicator and strategy logic in JavaScript/TypeScript
 * that matches PineScript syntax and behavior.
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

export { ta, math, array, str, color };

// Re-export commonly used functions for convenience
export { sma, ema, rsi, macd, bb, stdev, crossover, crossunder, change, tr, atr } from './ta';
export { abs, ceil, floor, round, max, min, avg, sum, sqrt, pow, exp, log, sin, cos, tan } from './math';
export { rgb, from_hex as color_from_hex, new_color } from './color';

// Version
export const VERSION = '0.1.0';

/**
 * Library information
 */
export const info = {
  name: 'OakScriptJS',
  version: VERSION,
  description: 'JavaScript mirror of the PineScript API',
  namespaces: ['ta', 'math', 'array', 'str', 'color'],
};
