/**
 * @fileoverview Type definitions for OakScriptJS runtime
 * These types define the adapter interfaces and context structure for the runtime system
 * @module runtime/types
 */

/**
 * Handle returned by ChartAdapter.addSeries
 * Represents a series on the chart with ability to update data
 */
export interface SeriesHandle {
  /** Set the data for this series */
  setData(data: Array<{ time: number; value: number }>): void;
}

/**
 * Options for creating a series on the chart
 */
export interface SeriesOptions {
  /** Series color */
  color?: string;
  /** Line width */
  lineWidth?: number;
  /** Line style (0 = solid, 1 = dotted, 2 = dashed, etc.) */
  lineStyle?: number;
  /** Price scale ID */
  priceScaleId?: string;
  /** Pane index */
  pane?: number;
}

/**
 * Chart adapter interface
 * Implementations translate library calls into chart library operations
 */
export interface ChartAdapter {
  /** Add a new series to the chart */
  addSeries(type: string, options?: SeriesOptions): SeriesHandle;
  /** Remove a series from the chart */
  removeSeries(series: SeriesHandle): void;
  /** Get the main price series (optional, may return undefined) */
  getMainSeries?(): SeriesHandle | undefined;
  /** Create a new pane and return its index (optional) */
  createPane?(): number;
}

/**
 * Configuration for registering an input
 */
export interface InputConfig {
  /** Unique identifier for the input */
  id: string;
  /** Type of input */
  type: 'int' | 'float' | 'bool' | 'string' | 'source';
  /** Default value */
  defval: unknown;
  /** Display title */
  title?: string;
  /** Minimum value (for numeric inputs) */
  min?: number;
  /** Maximum value (for numeric inputs) */
  max?: number;
  /** Step size (for numeric inputs) */
  step?: number;
  /** Options for dropdown selection (for string inputs) */
  options?: string[];
}

/**
 * Options for numeric inputs
 */
export interface InputOptions {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step size */
  step?: number;
}

/**
 * Input adapter interface
 * Implementations handle input registration and value management
 */
export interface InputAdapter {
  /** Register an input, returns current value (possibly user-updated) */
  registerInput(config: InputConfig): unknown;
  /** Get current value of an input */
  getValue(id: string): unknown;
  /** Set value of an input */
  setValue(id: string, value: unknown): void;
  /** Register callback for input changes */
  onInputChange(callback: (id: string, value: unknown) => void): void;
}

/**
 * OHLCV data structure
 * Provides access to price and volume time series
 */
export interface OhlcvData {
  /** Timestamps for each bar */
  time: number[];
  /** Open prices */
  open: number[];
  /** High prices */
  high: number[];
  /** Low prices */
  low: number[];
  /** Close prices */
  close: number[];
  /** Volume data */
  volume: number[];
}

/**
 * Global context object for OakScriptJS runtime
 * Must be set by host application before calling any indicator calculate function
 */
export interface OakScriptContext {
  /** Chart adapter for plot operations */
  chart: ChartAdapter;
  /** Input adapter for managing indicator inputs */
  inputs: InputAdapter;
  /** OHLCV data for the current symbol/timeframe */
  ohlcv: OhlcvData;
  /** Current bar index (typically the last bar) */
  bar_index: number;
}
