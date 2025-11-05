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
