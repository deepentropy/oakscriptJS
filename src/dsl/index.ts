/**
 * @fileoverview PineScript DSL main exports
 * @module dsl
 */

// DSL functions
export { indicator } from './indicator';
export { plot } from './plot';
export { hline } from './hline';
export { fill } from './fill';
export { compile } from './compile';
export { input } from './input';

// Color and format constants
export { color, format } from './color';

// Technical analysis (wrapped for Series)
export { ta } from './ta';
export * from './ta';

// Built-in series
export {
  close,
  open,
  high,
  low,
  volume,
  hl2,
  hlc3,
  ohlc4,
  hlcc4,
  time,
  bar_index,
} from '../runtime/builtins';

// Runtime types (for advanced usage)
export { Series } from '../runtime/series';
export { getContext, resetContext, createIsolatedContext } from '../runtime/context';

// Type exports
export type { IndicatorOptions } from './indicator';
export type { PlotOptions } from './plot';
export type { HLineOptions } from './hline';
export type { FillOptions } from './fill';
export type { CompiledIndicator, IndicatorMetadata, InputMetadata } from './compile';
export type { Color } from './color';
