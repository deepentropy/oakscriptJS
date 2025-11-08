/**
 * OakScriptJS - JavaScript mirror of the PineScript API
 *
 * This library provides the exact same API signatures as PineScript,
 * allowing you to write indicator and strategy logic in JavaScript/TypeScript
 * that matches PineScript syntax and behavior.
 *
 * Focus: Calculation and indicator functions.
 *
 * **NEW**: Drawing objects (line, box, label, linefill) are now supported!
 * While primarily visual in TradingView, these objects have computational value:
 * - line.get_price() for trend line breakout detection
 * - box getters for gap detection and range analysis
 *
 * This library does NOT include rendering (plot), UI (input), strategy execution,
 * or data fetching (request) functions.
 *
 * @packageDocumentation
 */

// Export all types
export * from './types';

// Export namespaces
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

// Export DSL ta as main ta namespace (handles Series expressions)
import * as ta from './dsl/ta';

export { ta, taCore, math, array, str, color, time, matrix, line, box, label, linefill };

// Export indicator controller (internal - used by DSL compile())
// Note: These are low-level APIs. Users should use the DSL instead.
export {
  IndicatorController,
  createIndicator,
  type PlotMetadata,
  type IndicatorMetadata,
  type IndicatorControllerInterface,
  type IChartApi,
  type ISeriesApi
} from './indicator';

// Export PineScript DSL (high-level API)
export {
  // DSL functions
  indicator,
  plot,
  hline,
  fill,
  compile,
  input,
  // Built-in series (note: 'time' is renamed to avoid conflict with time namespace)
  close,
  open,
  high,
  low,
  volume,
  hl2,
  hlc3,
  ohlc4,
  hlcc4,
  bar_index,
  // Runtime
  Series,
  getContext as getDSLContext,
  resetContext as resetDSLContext,
  // Types
  type IndicatorOptions,
  type PlotOptions,
  type HLineOptions,
  type FillOptions,
  type CompiledIndicator,
  type InputMetadata,
  type Color,
} from './dsl';

// Re-export IndicatorMetadata from DSL with clearer name to avoid conflict with indicator controller's IndicatorMetadata
export type { IndicatorMetadata as DSLIndicatorMetadata } from './dsl/compile';

// Export time series separately to avoid name conflict
export { time as timeSeriesDSL } from './runtime/builtins';

// Re-export DSL modules for namespace access
import * as dslTa from './dsl/ta';
import * as dslColor from './dsl/color';
export { dslTa as taDSL, dslColor as colorDSL };

// Export context API
export { createContext } from './context';
export type { ChartData, SymbolInfo, ContextConfig, OakContext } from './context';

// Re-export commonly used functions for convenience (DSL versions for Series support)
export { sma, ema, rsi, macd, bb, stdev, crossover, crossunder, change, tr, atr } from './dsl/ta';
export { abs, ceil, floor, round, max, min, avg, sum, sqrt, pow, exp, log, sin, cos, tan } from './math';
export { rgb, from_hex as color_from_hex, new_color } from './color';

// Export chart data utilities (previously in chart namespace)
export { ohlcFromBars, getClose, getHigh, getLow, getOpen } from './utils';

// Version
export const VERSION = '0.1.3';

/**
 * Library information
 */
export const info = {
  name: 'OakScriptJS',
  version: VERSION,
  description: 'JavaScript mirror of the PineScript API (calculation/indicator functions only)',
  namespaces: ['ta', 'math', 'array', 'str', 'color', 'time', 'matrix', 'line', 'box', 'label', 'linefill', 'input'],
  excludedNamespaces: ['plot', 'table', 'strategy', 'request', 'alert'],
  drawingObjects: {
    highValue: ['line', 'box'], // High computational value
    lowValue: ['label', 'linefill'], // Low computational value, mainly for annotations
  },
  features: {
    dsl: 'PineScript DSL with indicator(), plot(), compile(), input.*',
    nativeOperators: 'Native operators with Babel plugin (close - open)',
    lightweightCharts: 'Integrated with Lightweight Charts v5'
  }
};
