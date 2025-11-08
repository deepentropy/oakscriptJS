/**
 * OakScriptJS - Simplified PineScript-like library for JavaScript
 *
 * This library provides Series-based lazy evaluation and technical analysis functions
 * for building trading indicators. Complexity is handled by the OakScriptEngine transpiler.
 *
 * Key features:
 * - Series class for lazy evaluation and operator chaining
 * - Core TA functions (array-based)
 * - TA-Series wrappers (Series-based)
 * - Native operator support via Babel plugin
 *
 * @packageDocumentation
 */

// Export all types
export * from './types';
export * from './types/metadata';

// Export core namespaces (array-based functions)
import * as taCore from './ta';
import * as math from './math';
import * as array from './array';
import * as str from './str';
import * as color from './color';
import * as time from './time';
import * as matrix from './matrix';
import * as line from './line';
import * as box from './box';
import * as label from './label';
import * as linefill from './linefill';

export { taCore, math, array, str, color, time, matrix, line, box, label, linefill };

// Export Series class (self-contained, no context)
export { Series } from './runtime/series';
export type { SeriesExtractor } from './runtime/series';

// Export TA-Series namespace (Series-based wrappers)
import * as ta from './ta-series';
export { ta };

// Export metadata types for indicator return values
export type {
  PlotOptions,
  HLineOptions,
  FillOptions,
  InputMetadata,
  PlotMetadata,
  IndicatorMetadata,
  TimeValue,
  PlotData,
  HLineData,
  FillData,
  IndicatorResult,
  IndicatorFactory,
  PlotStyle,
  LineStyle,
  PlotDisplay,
  InputType
} from './types/metadata';

// Re-export commonly used functions for convenience
export { sma, ema, rsi, macd, bb, stdev, crossover, crossunder, change, tr, atr } from './ta-series';
export { abs, ceil, floor, round, max, min, avg, sum, sqrt, pow, exp, log, sin, cos, tan } from './math';
export { rgb, from_hex as color_from_hex, new_color } from './color';

// Export chart data utilities
export { ohlcFromBars, getClose, getHigh, getLow, getOpen } from './utils';

// Version
export const VERSION = '0.2.0';

/**
 * Library information
 */
export const info = {
  name: 'OakScriptJS',
  version: VERSION,
  description: 'Simplified PineScript-like library - Series + TA functions',
  features: {
    series: 'Lazy evaluation with Series class',
    operators: 'Native operators with Babel plugin (high - low)',
    ta: 'Technical analysis functions (Series and array-based)',
    minimal: 'No DSL layer, no global context - complexity in transpiler'
  },
  namespaces: {
    core: ['ta', 'math', 'array', 'str', 'color', 'time', 'matrix'],
    drawing: ['line', 'box', 'label', 'linefill']
  }
};
