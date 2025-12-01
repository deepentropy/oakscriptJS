/**
 * @fileoverview OakScriptJS Runtime Module
 * Provides global context management, plot functions, and input handling
 * for transpiler-generated indicators
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
} from './runtime';

// Input function exports
export {
  input_int,
  input_float,
  input_bool,
  input_string,
  input_source,
  enableAutoRecalculate,
  disableAutoRecalculate,
  resetInputs,
} from './inputs';

// Type exports
export type {
  OakScriptContext,
  ChartAdapter,
  InputAdapter,
  SeriesHandle,
  SeriesOptions,
  InputConfig,
  InputOptions,
  OhlcvData,
} from './types';

// Adapter exports
export { LightweightChartsAdapter } from './adapters/LightweightChartsAdapter';
export { SimpleInputAdapter } from './adapters/SimpleInputAdapter';
