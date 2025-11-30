/**
 * Core types for OakScriptJS
 * These types mirror the PineScript type system
 */

// Basic types
export type int = number;
export type float = number;
export type bool = boolean;
//export type string = string;
export type color = string | number;

// Series types - In PineScript, series are time-series arrays
export type series<T> = T[];
export type series_int = series<int>;
export type series_float = series<float>;
export type series_bool = series<bool>;
export type series_string = series<string>;
export type series_color = series<color>;

// Simple types (non-series)
export type simple_int = int;
export type simple_float = float;
export type simple_bool = bool;
export type simple_string = string;
export type simple_color = color;

// Input types
export type input_int = int;
export type input_float = float;
export type input_bool = bool;
export type input_string = string;
export type input_color = color;

// Const types (compile-time constants)
export type const_int = int;
export type const_float = float;
export type const_bool = bool;
export type const_string = string;
export type const_color = color;

// Source types for indicators
export type Source = series_float;

// Array types
export interface PineArray<T> extends Array<T> {
  // PineScript arrays have specific methods
}

// Matrix types
export interface PineMatrix<T> {
  rows: int;
  columns: int;
  data: T[][];
}

// Drawing object types - Now implemented for computational use!
// While primarily used for visualization in PineScript, these objects have computational value:
// - line.get_price() for trend analysis
// - box getters for gap detection and range breakouts

/**
 * Line object - Represents a line on the chart
 * @remarks
 * While lines are visual in TradingView, line.get_price() provides computational value
 * for detecting trend line breakouts, calculating support/resistance levels, etc.
 */
export interface Line {
  /** First point's x coordinate (bar index or UNIX timestamp) */
  x1: number;
  /** First point's y coordinate (price level) */
  y1: number;
  /** Second point's x coordinate (bar index or UNIX timestamp) */
  x2: number;
  /** Second point's y coordinate (price level) */
  y2: number;
  /** X-axis coordinate system */
  xloc: 'bar_index' | 'bar_time';
  /** Extension mode */
  extend: 'none' | 'left' | 'right' | 'both';
  /** Line color (stored but not used for calculations) */
  color?: color;
  /** Line style (stored but not used for calculations) */
  style?: 'solid' | 'dotted' | 'dashed' | 'arrow_left' | 'arrow_right' | 'arrow_both';
  /** Line width in pixels (stored but not used for calculations) */
  width?: number;
}

/**
 * Box object - Represents a rectangular area on the chart
 * @remarks
 * Box getters (get_top, get_bottom, get_left, get_right) enable gap detection,
 * range breakout analysis, and consolidation zone identification.
 */
export interface Box {
  /** Left border x coordinate (bar index or UNIX timestamp) */
  left: number;
  /** Top border y coordinate (price level) */
  top: number;
  /** Right border x coordinate (bar index or UNIX timestamp) */
  right: number;
  /** Bottom border y coordinate (price level) */
  bottom: number;
  /** X-axis coordinate system */
  xloc: 'bar_index' | 'bar_time';
  /** Horizontal extension mode */
  extend: 'none' | 'left' | 'right' | 'both';
  /** Border color (stored but not used for calculations) */
  border_color?: color;
  /** Border width in pixels (stored but not used for calculations) */
  border_width?: number;
  /** Border style (stored but not used for calculations) */
  border_style?: 'solid' | 'dotted' | 'dashed';
  /** Background fill color (stored but not used for calculations) */
  bgcolor?: color;
  /** Text content displayed in the box */
  text?: string;
  /** Text size */
  text_size?: string | number;
  /** Text color */
  text_color?: color;
  /** Horizontal text alignment */
  text_halign?: 'left' | 'center' | 'right';
  /** Vertical text alignment */
  text_valign?: 'top' | 'center' | 'bottom';
  /** Text wrapping mode */
  text_wrap?: 'none' | 'auto';
  /** Text font family */
  text_font_family?: 'default' | 'monospace';
}

/**
 * Label object - Represents a label/annotation on the chart
 * @remarks
 * Labels have limited computational value. Primarily used for marking points and displaying text.
 */
export interface Label {
  /** X coordinate (bar index or UNIX timestamp) */
  x: number;
  /** Y coordinate (price level when yloc = 'price') */
  y: number;
  /** X-axis coordinate system */
  xloc: 'bar_index' | 'bar_time';
  /** Y-axis positioning mode */
  yloc: 'price' | 'abovebar' | 'belowbar';
  /** Label text content */
  text?: string;
  /** Tooltip text shown on hover */
  tooltip?: string;
  /** Border and arrow color */
  color?: color;
  /** Label style */
  style?: 'none' | 'xcross' | 'cross' | 'triangleup' | 'triangledown' | 'flag' | 'circle' |
          'arrowup' | 'arrowdown' | 'label_up' | 'label_down' | 'label_left' | 'label_right' |
          'label_lower_left' | 'label_lower_right' | 'label_upper_left' | 'label_upper_right' |
          'label_center' | 'square' | 'diamond' | 'text_outline';
  /** Text color */
  textcolor?: color;
  /** Label size */
  size?: string | number;
  /** Text alignment */
  textalign?: 'left' | 'center' | 'right';
  /** Text font family */
  text_font_family?: 'default' | 'monospace';
}

/**
 * Linefill object - Represents a filled area between two lines
 * @remarks
 * Minimal computational value. Used to fill channel areas visually.
 */
export interface Linefill {
  /** First line reference */
  line1: Line;
  /** Second line reference */
  line2: Line;
  /** Fill color */
  color?: color;
}

/**
 * Table object - Represents a table for displaying data
 * @remarks
 * Tables have NO computational value (no getter functions in PineScript).
 * Purely for display/visualization purposes.
 */
export interface Table {
  /** Table position on chart */
  position: 'top_left' | 'top_center' | 'top_right' |
            'middle_left' | 'middle_center' | 'middle_right' |
            'bottom_left' | 'bottom_center' | 'bottom_right';
  /** Number of columns */
  columns: number;
  /** Number of rows */
  rows: number;
  /** Outer frame color */
  frame_color?: color;
  /** Outer frame width */
  frame_width?: number;
  /** Cell border color */
  border_color?: color;
  /** Cell border width */
  border_width?: number;
  /** Table background color */
  bgcolor?: color;
  /** Cell data (internal storage) */
  cells?: Map<string, TableCell>;
}

/**
 * Table cell data
 */
export interface TableCell {
  /** Cell text content */
  text?: string;
  /** Cell width as percentage */
  width?: number;
  /** Cell height as percentage */
  height?: number;
  /** Text color */
  text_color?: color;
  /** Horizontal text alignment */
  text_halign?: 'left' | 'center' | 'right';
  /** Vertical text alignment */
  text_valign?: 'top' | 'center' | 'bottom';
  /** Text size */
  text_size?: string | number;
  /** Cell background color */
  bgcolor?: color;
  /** Cell tooltip */
  tooltip?: string;
  /** Text font family */
  text_font_family?: 'default' | 'monospace';
}

// Series types for drawing objects
export type series_line = series<Line>;
export type series_box = series<Box>;
export type series_label = series<Label>;
export type series_linefill = series<Linefill>;
export type series_table = series<Table>;

/**
 * Plot object - Represents a plot instance created by plot() function
 * @remarks
 * In PineScript, plot() returns a reference to a plot instance that can be used with fill().
 * This ID is used to reference the plot for filling between plots.
 */
export interface Plot {
  /** Unique identifier for this plot */
  id: string;
  /** Series being plotted */
  series: any;
  /** Plot title */
  title?: string;
  /** Plot color */
  color?: any;
  /** Line width */
  linewidth?: number;
  /** Plot style */
  style?: 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns';
  /** Track price on y-axis */
  trackprice?: boolean;
  /** Histogram base level */
  histbase?: number;
  /** Offset in bars */
  offset?: number;
  /** Join gaps */
  join?: boolean;
  /** Editable in chart */
  editable?: boolean;
  /** Display mode */
  display?: 'all' | 'none';
}

/**
 * HLine object - Represents a horizontal line instance created by hline() function
 * @remarks
 * In PineScript, hline() returns a reference to an hline instance that can be used with fill().
 * This ID is used to reference the horizontal line for filling between levels.
 */
export interface HLine {
  /** Unique identifier for this hline */
  id: string;
  /** Price level for the horizontal line */
  price: number;
  /** Line title */
  title?: string;
  /** Line color */
  color?: any;
  /** Line style */
  linestyle?: 'solid' | 'dashed' | 'dotted';
  /** Line width */
  linewidth?: number;
  /** Editable in chart */
  editable?: boolean;
}

// Series types for plot and hline (always series qualifier in PineScript)
export type series_plot = Plot;
export type series_hline = HLine;

// Excluded types (StrategyEntry, StrategyExit) - not used in calculation-only library

// Bar data
export interface Bar {
  time: int;
  open: float;
  high: float;
  low: float;
  close: float;
  volume?: float;
}

// OHLC data type
export interface OHLC {
  open: series_float;
  high: series_float;
  low: series_float;
  close: series_float;
}

// Constants
export const na = null;
export type na = null;

/**
 * X-axis location constants
 * Used to specify whether x-coordinates are bar indices or timestamps
 */
export const xloc = {
  /** X-coordinates are bar indices */
  bar_index: 'bar_index' as const,
  /** X-coordinates are UNIX timestamps in milliseconds */
  bar_time: 'bar_time' as const,
};

/**
 * ChartPoint interface - Represents a point on the chart
 * @remarks
 * A chart point can have time, index, and price coordinates.
 * At least one of time or index should be provided for x-coordinate positioning.
 */
export interface ChartPoint {
  /** UNIX timestamp in milliseconds (null if using bar index) */
  readonly time: number | null;
  /** Bar index (null if using time) */
  readonly index: number | null;
  /** Y-axis price value */
  readonly price: number;
}

/**
 * Polyline interface - Represents a polyline on the chart
 * @remarks
 * A polyline connects multiple chart points with line segments.
 * When closed, it forms a polygon that can be filled with color.
 */
export interface Polyline {
  /** Unique identifier for this polyline */
  readonly id: string;
  /** Array of chart points that define the polyline */
  readonly points: readonly ChartPoint[];
  /** If true, use curved line segments (not yet supported - uses straight lines) */
  readonly curved: boolean;
  /** If true, connect the first point to the last point */
  readonly closed: boolean;
  /** X-coordinate mode: 'bar_index' or 'bar_time' */
  readonly xloc: 'bar_index' | 'bar_time';
  /** Color of line segments */
  readonly line_color: color;
  /** Fill color for closed polylines (null for no fill) */
  readonly fill_color: color | null;
  /** Line style */
  readonly line_style: 'solid' | 'dotted' | 'dashed';
  /** Line width in pixels */
  readonly line_width: number;
  /** Force display on main pane */
  readonly force_overlay: boolean;
}

// Series types for chart point and polyline
export type series_chartpoint = series<ChartPoint>;
export type series_polyline = series<Polyline>;
