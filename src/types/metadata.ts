/**
 * @fileoverview Type definitions for indicator metadata
 * These types define the structure of data returned by indicators
 * @module types/metadata
 */

/**
 * Plot style options
 */
export type PlotStyle = 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns' | 'cross' | 'areabr' | 'steplinebr' | 'linebr';

/**
 * Line style options
 */
export type LineStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Plot display options
 */
export type PlotDisplay = 'all' | 'none' | 'data_window' | 'status_line' | 'pane';

/**
 * Options for a plot
 */
export interface PlotOptions {
  /** Plot title */
  title?: string;
  /** Plot color (hex string or named color) */
  color?: string;
  /** Line width */
  linewidth?: number;
  /** Plot style */
  style?: PlotStyle;
  /** Track price on price scale */
  trackprice?: boolean;
  /** Histogram base value */
  histbase?: number;
  /** Offset from current bar */
  offset?: number;
  /** Join gaps in data */
  join?: boolean;
  /** User can edit */
  editable?: boolean;
  /** Display mode */
  display?: PlotDisplay;
  /** Transparency (0-100) */
  transp?: number;
}

/**
 * Options for a horizontal line
 */
export interface HLineOptions {
  /** Line title */
  title?: string;
  /** Line color */
  color?: string;
  /** Line style */
  linestyle?: LineStyle;
  /** Line width */
  linewidth?: number;
  /** User can edit */
  editable?: boolean;
}

/**
 * Options for a fill
 */
export interface FillOptions {
  /** Fill color */
  color?: string;
  /** Transparency (0-100) */
  transp?: number;
  /** Fill title */
  title?: string;
  /** User can edit */
  editable?: boolean;
}

/**
 * Input parameter type
 */
export type InputType = 'int' | 'float' | 'bool' | 'string' | 'source' | 'color' | 'timeframe' | 'session';

/**
 * Input parameter metadata
 */
export interface InputMetadata {
  /** Input type */
  type: InputType;
  /** Internal name (snake_case) */
  name: string;
  /** Display title */
  title: string;
  /** Default value */
  defval: any;
  /** Minimum value (for numeric inputs) */
  minval?: number;
  /** Maximum value (for numeric inputs) */
  maxval?: number;
  /** Step size (for numeric inputs) */
  step?: number;
  /** Tooltip text */
  tooltip?: string;
  /** Inline group */
  inline?: string;
  /** Parameter group */
  group?: string;
  /** Options for dropdown (for string/source inputs) */
  options?: any[];
  /** Confirm before changing */
  confirm?: boolean;
}

/**
 * Plot metadata
 */
export interface PlotMetadata {
  /** Variable name for the plot */
  varName: string;
  /** Plot title */
  title: string;
  /** Plot color */
  color: string;
  /** Line width */
  linewidth: number;
  /** Plot style */
  style: PlotStyle;
}

/**
 * Indicator metadata
 */
export interface IndicatorMetadata {
  /** Indicator title */
  title: string;
  /** Short title */
  shorttitle?: string;
  /** Overlay on main chart */
  overlay: boolean;
  /** Number format precision */
  precision?: number;
  /** Number format */
  format?: string;
  /** Timeframe */
  timeframe?: string;
  /** Show gaps in timeframes */
  timeframe_gaps?: boolean;
  /** Input parameters */
  inputs?: InputMetadata[];
  /** Plots */
  plots?: PlotMetadata[];
}

/**
 * Time-value pair for charting
 */
export interface TimeValue {
  /** Time (timestamp or string) */
  time: any;
  /** Value */
  value: number;
}

/**
 * Plot data with options
 */
export interface PlotData {
  /** Time-value pairs */
  data: TimeValue[];
  /** Plot options */
  options?: PlotOptions;
}

/**
 * Horizontal line data
 */
export interface HLineData {
  /** Y-axis value */
  value: number;
  /** Line options */
  options?: HLineOptions;
}

/**
 * Fill data (area between two plots)
 */
export interface FillData {
  /** First plot index or name */
  plot1: number | string;
  /** Second plot index or name */
  plot2: number | string;
  /** Fill options */
  options?: FillOptions;
}

/**
 * Complete indicator calculation result
 */
export interface IndicatorResult {
  /** Indicator metadata */
  metadata: IndicatorMetadata;
  /** Plot data as Record mapping plot IDs to TimeValue arrays */
  plots: Record<string, TimeValue[]>;
  /** Horizontal lines */
  hlines?: HLineData[];
  /** Fills */
  fills?: FillData[];
}

/**
 * Indicator factory function type
 */
export type IndicatorFactory = (options?: Record<string, any>) => {
  /** Indicator metadata */
  metadata: IndicatorMetadata;
  /** Calculate function */
  calculate: (bars: any[]) => PlotData[] | TimeValue[];
};
