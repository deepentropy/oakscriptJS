/**
 * @fileoverview OakScriptJS Runtime Module
 * Provides global context management, plot functions, and input handling
 * for indicators that draw through a ChartAdapter
 * @module runtime
 */

// Core runtime exports
export {
  setContext,
  clearContext,
  getContext,
  registerCalculate,
  recalculate,
  plot,
  hline,
  clearPlots,
  getActivePlots,
} from './runtime.js';

// Input function exports
export {
  input_int,
  input_float,
  input_bool,
  input_string,
  input_source,
  input_timeframe,
  input_session,
  input_time,
  enableAutoRecalculate,
  disableAutoRecalculate,
  resetInputs,
} from './inputs.js';

// Type exports
export type {
  OakScriptContext,
  ChartAdapter,
  InputAdapter,
  SeriesHandle,
  SeriesOptions,
  InputConfig,
  InputCondition,
  InputOptions,
  OhlcvData,
    PlotConfig,
} from './types.js';

export { isInputActive } from './input-active.js';

// Adapter exports
export { LightweightChartsAdapter } from './adapters/LightweightChartsAdapter.js';
export type { LightweightSeriesDefinitions } from './adapters/LightweightChartsAdapter.js';
export { SimpleInputAdapter } from './adapters/SimpleInputAdapter.js';
