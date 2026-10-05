/**
 * OakScriptJS - Simplified PineScript-like library for JavaScript
 *
 * This library provides Series-based lazy evaluation and technical analysis functions
 * for building trading indicators. The PineScript-style script API is in `oakscriptjs/script`.
 *
 * Key features:
 * - Series class for lazy evaluation and method chaining
 * - Core TA functions (array-based)
 * - TA-Series wrappers (Series-based)
 *
 * @packageDocumentation
 */

// Export all types
export * from './types/index.js';
export * from './types/metadata.js';

// Export core namespaces (array-based functions)
import * as taCore from './ta/index.js';
import * as math from './math/index.js';
import * as array from './array/index.js';
import * as map from './map/index.js';
import * as str from './str/index.js';
import * as color from './color/index.js';
import * as time from './time/index.js';
import * as timeframe from './timeframe/index.js';
import * as matrix from './matrix/index.js';
import * as line from './line/index.js';
import * as box from './box/index.js';
import * as label from './label/index.js';
import * as linefill from './linefill/index.js';
import * as chartPoint from './chartpoint/index.js';
import * as polyline from './polyline/index.js';
import * as text from './text/index.js';
import * as compare from './compare/index.js';
import * as callsite from './callsite/index.js';

export { taCore, math, array, map, str, color, time, timeframe, matrix, line, box, label, linefill, chartPoint, polyline, text, compare, callsite };

// Export Series class (self-contained, no context)
export { Series, BarData } from './runtime/series.js';
export type { SeriesExtractor } from './runtime/series.js';

// Export TA-Series namespace (Series-based wrappers)
import * as ta from './ta-series.js';
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
  FillGradient,
  IndicatorResult,
  IndicatorFactory,
  PlotStyle,
  LineStyle,
  PlotDisplay,
  InputType
} from './types/metadata.js';

// Re-export commonly used functions for convenience
export { sma, ema, rsi, macd, bb, stdev, crossover, crossunder, change, tr, atr, cum, vwap } from './ta-series.js';
export { abs, ceil, floor, round, max, min, avg, sum, sqrt, pow, exp, log, sin, cos, tan } from './math/index.js';
export { rgb, from_hex as color_from_hex, new_color } from './color/index.js';

// Export chart data utilities
export { ohlcFromBars, getClose, getHigh, getLow, getOpen, getSource, getSourceSeries, at, div } from './utils/index.js';

// Export libraries (ZigZag, etc.)
export * from './lib/index.js';

// Export helper functions for generated indicators (PineScript compatibility)
export {isNA as na, nz, fixnan} from './utils/index.js';

// Export indicator infrastructure
export {
  indicator,
  type IndicatorMetadataConfig,
  type InputDefinition,
  type IndicatorContext,
  type IndicatorInstance,
  type IndicatorConstructor,
} from './indicator.js';

export {
  input,
  type InputValue,
  type IntInputOptions,
  type FloatInputOptions,
  type SourceInputOptions,
  type BoolInputOptions,
  type StringInputOptions,
  type TimeInputOptions,
  type SourceType,
} from './input.js';

export {
  plot as plotHelper,
  createPlot,
  type Time,
  type TimeValuePair,
  type PlotOptions as PlotHelperOptions,
  type PlotResult,
} from './plot.js';

// Runtime exports - global context runtime (setContext, plot, hline) drawing through a ChartAdapter
export {
  setContext,
  clearContext,
  getContext,
  registerCalculate,
  recalculate,
  plot,
  hline,
  clearPlots,
} from './runtime/runtime.js';

export {
  input_int,
  input_float,
  input_bool,
  input_string,
  input_source,
  input_timeframe,
  input_session,
  input_time,
} from './runtime/inputs.js';

export type {
  OakScriptContext,
  ChartAdapter,
  InputAdapter,
  SeriesHandle,
  SeriesOptions,
  InputConfig,
  InputOptions,
  OhlcvData,
  PlotConfig,
  HLineConfig,
  FillConfig,
  ArrowConfig,
} from './runtime/types.js';

// Strategy types and constants (the script API forwards strategy.* calls to a host engine)
export {
  STRATEGY_CONSTANTS,
  STRATEGY_DEFAULTS,
  STRATEGY_NUMBER_VARIABLES,
  STRATEGY_TEXT_VARIABLES,
} from './strategy/index.js';
export type * from './strategy/index.js';

export { LightweightChartsAdapter } from './runtime/adapters/LightweightChartsAdapter.js';
export type { LightweightSeriesDefinitions } from './runtime/adapters/LightweightChartsAdapter.js';
export { SimpleInputAdapter } from './runtime/adapters/SimpleInputAdapter.js';

// Version
export const VERSION = '0.9.6';

/**
 * Library information
 */
export const info = {
  name: 'OakScriptJS',
  version: VERSION,
  description: 'Simplified PineScript-like library - Series + TA functions',
  features: {
    series: 'Lazy evaluation with Series class',
    ta: 'Technical analysis functions (Series and array-based)',
    script: 'PineScript-style script API (oakscriptjs/script): indicator, strategy, inputs, plots, request.security',
    runtime: 'Global context runtime drawing through a ChartAdapter',
    indicator: 'Indicator function with automatic pane management'
  },
  namespaces: {
    core: ['ta', 'math', 'array', 'map', 'str', 'color', 'time', 'timeframe', 'matrix'],
    drawing: ['line', 'box', 'label', 'linefill', 'chartPoint', 'polyline', 'text'],
    runtime: ['setContext', 'plot', 'hline', 'input_*'],
    indicator: ['indicator', 'input', 'plotHelper', 'createPlot']
  }
};

// PineScript compatibility stubs - functions that have no runtime effect
// These are no-ops so that PineScript-style code runs without modification

/**
 * alertcondition() - Stub for PineScript alert configuration
 * In PineScript, this registers an alert condition. In oakscriptjs, it's a no-op
 * since alert configuration is handled by the host application.
 */
export function alertcondition(_condition: unknown, _title?: string, _message?: string): void {
  // No-op: Alert conditions are handled by the host application
}
