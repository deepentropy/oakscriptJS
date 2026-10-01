/**
 * @fileoverview Type definitions for OakScriptJS runtime
 * These types define the adapter interfaces and context structure for the runtime system
 * @module runtime/types
 */

import type { FillGradient } from '../types/metadata';

/**
 * Handle returned by ChartAdapter.addSeries
 * Represents a series on the chart with ability to update data
 */
export interface SeriesHandle {
  /** Set the data for this series */
  setData(data: Array<{ time: number; value: number; color?: string }>): void;
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
  /**
   * Type of input. `timeframe` and `session` values are strings ("60", "1D", "0930-1600:23456";
   * an empty timeframe means the chart timeframe), `time` values are UNIX times in milliseconds.
   */
  type: 'int' | 'float' | 'bool' | 'string' | 'source' | 'color' | 'timeframe' | 'session' | 'time';
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
  /** Options for dropdown selection (for string, timeframe and session inputs) */
  options?: string[];
  /** Settings group header (PineScript `group`) */
  group?: string;
  /** Inputs with the same `inline` id are shown on one line (PineScript `inline`) */
  inline?: string;
  /** Info tooltip of the input (PineScript `tooltip`) */
  tooltip?: string;
  /** Ask for the value when the script is added to a chart (PineScript `confirm`) */
  confirm?: boolean;
  /**
   * Where the input value is shown (PineScript `display`); not set means the PineScript default: 'all', except
   * color inputs: 'none'
   */
  display?: 'all' | 'none' | 'data_window' | 'status_line';
}

/**
 * Configuration for plot outputs in generated indicators
 */
export interface PlotConfig {
    /** Unique identifier for the plot */
    id: string;
    /** Display title */
    title: string;
    /** Plot color */
    color: string;
    /** Line width in pixels */
    lineWidth?: number;
    /** Plot style */
    style?: 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns' | 'cross' | 'areabr' | 'steplinebr' | 'linebr' | 'stepline_diamond';
    /** Whether the plot is visible (can be boolean or expression string for dynamic visibility) */
    visible?: boolean | string;
    /** Display mode: 'all', 'none', 'data_window', 'status_line', 'pane' */
    display?: 'all' | 'none' | 'data_window' | 'status_line' | 'pane';
    /** Offset in bars (positive = future, negative = past) */
    offset?: number;
    /** Histogram base value */
    histbase?: number;
    /** Line style (PineScript `linestyle`); default solid. A constant or an input value, not per bar */
    linestyle?: 'solid' | 'dashed' | 'dotted';
    /** Drawn on the main chart pane even when the script is not an overlay (PineScript `force_overlay`); default false */
    forceOverlay?: boolean;
}

/**
 * Configuration of a PineScript `plotarrow()` declaration: an up arrow (below the bar) for a positive value, a down
 * arrow (above the bar) for a negative value, nothing for 0 / na. The arrow height scales with the absolute value
 * between `minheight` and `maxheight` pixels (drawn by the renderer).
 */
export interface ArrowConfig {
    /** Unique identifier (key of the arrow data in the result) */
    id: string;
    /** Display title */
    title?: string;
    /** Color of the up arrows (PineScript default #00FF00) */
    colorup: string;
    /** Color of the down arrows (PineScript default #FF0000) */
    colordown: string;
    /** Minimal arrow height in pixels (PineScript default 5) */
    minheight: number;
    /** Maximal arrow height in pixels (PineScript default 100) */
    maxheight: number;
    /** Offset in bars (applied to the emitted arrow times) */
    offset?: number;
    /** Display mode */
    display?: 'all' | 'none' | 'data_window' | 'status_line' | 'pane';
    /** Drawn on the main chart pane even when the script is not an overlay (PineScript `force_overlay`); default false */
    forceOverlay?: boolean;
}

/**
 * Configuration for horizontal line outputs in generated indicators
 * Matches PineScript hline() function parameters
 */
export interface HLineConfig {
    /** Unique identifier for the hline */
    id: string;
    /** Price level for the horizontal line */
    price: number;
    /** Display title */
    title?: string;
    /** Line color */
    color?: string;
    /** Line style: solid, dashed, or dotted (PineScript default: dashed) */
    linestyle?: 'solid' | 'dashed' | 'dotted';
    /** Line width in pixels */
    linewidth?: number;
    /** Display mode */
    display?: 'all' | 'none' | 'data_window' | 'status_line' | 'pane';
}

/**
 * Configuration for fill between plots or hlines in generated indicators
 * Matches PineScript fill() function parameters
 */
export interface FillConfig {
    /** Unique identifier for the fill */
    id: string;
    /** ID of the first plot or hline */
    plot1: string;
    /** ID of the second plot or hline */
    plot2: string;
    /** Fill color */
    color?: string;
    /** Per-bar fill colors (overrides static color) */
    colors?: string[];
    /** Gradient fill (PineScript `fill(hline1, hline2, top_value, bottom_value, top_color, bottom_color)`) */
    gradient?: FillGradient;
    /** Display title */
    title?: string;
    /** Whether the fill is visible (can be boolean or expression string for dynamic visibility) */
    visible?: boolean | string;
}

/**
 * Configuration for plotshape/plotchar outputs in generated indicators
 * Matches PineScript plotshape()/plotchar() declarative parameters
 */
export interface ShapeConfig {
    /** Unique identifier for the shape declaration */
    id: string;
    /** 'shape' for plotshape, 'char' for plotchar */
    kind: 'shape' | 'char';
    /** Display title */
    title?: string;
    /** Shape style (plotshape only) */
    style?: 'xcross' | 'cross' | 'triangleup' | 'triangledown' | 'flag' | 'circle' | 'arrowup' | 'arrowdown' | 'labelup' | 'labeldown' | 'square' | 'diamond';
    /** Character (plotchar only) */
    char?: string;
    /** Marker location relative to the bar */
    location: 'abovebar' | 'belowbar' | 'top' | 'bottom' | 'absolute';
    /** Marker color */
    color?: string;
    /** Text shown near the marker */
    text?: string;
    /** Text color */
    textcolor?: string;
    /** Marker size */
    size?: 'auto' | 'tiny' | 'small' | 'normal' | 'large' | 'huge';
    /** Offset in bars (applied to the emitted marker times) */
    offset?: number;
    /** Drawn on the main chart pane even when the script is not an overlay (PineScript `force_overlay`); default false */
    forceOverlay?: boolean;
}

/**
 * Configuration for bgcolor/barcolor outputs in generated indicators
 */
export interface BarColorConfig {
    /** Unique identifier */
    id: string;
    /** 'bgcolor' or 'barcolor' */
    kind: 'bgcolor' | 'barcolor';
    /** Display title */
    title?: string;
    /** Offset in bars (bgcolor only, already baked into emitted data) */
    offset?: number;
    /** bgcolor only: drawn on the main chart pane even when the script is not an overlay (PineScript
     *  `force_overlay`); default false */
    forceOverlay?: boolean;
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
