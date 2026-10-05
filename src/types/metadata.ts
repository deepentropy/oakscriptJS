/**
 * @fileoverview Type definitions for indicator metadata
 * These types define the structure of data returned by indicators
 * @module types/metadata
 */

/**
 * Plot style options
 */
export type PlotStyle = 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns' | 'cross' | 'areabr' | 'steplinebr' | 'linebr' | 'stepline_diamond';

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
  /** Line style (PineScript `linestyle`); default solid. A constant or an input value, not per bar */
  linestyle?: LineStyle;
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
  /** Draw the plot on the main chart pane even when the indicator is not an overlay; default false */
  force_overlay?: boolean;
}

/**
 * Options for a horizontal line
 */
export interface HLineOptions {
  /** Line title */
  title?: string;
  /** Line color */
  color?: string;
  /** Line style (PineScript default: dashed) */
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
  /** Fill gaps in data */
  fillgaps?: boolean;
}

/**
 * Input parameter type
 */
export type InputType = 'int' | 'float' | 'bool' | 'string' | 'source' | 'color' | 'timeframe' | 'session' | 'time';

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
  /** Per-bar color override */
  color?: string;
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
  /** Per-bar fill colors (overrides static options.color) */
  colors?: string[];
  /** Gradient fill (PineScript `fill(p1, p2, top_value, bottom_value, top_color, bottom_color)`) */
  gradient?: FillGradient;
}

/**
 * Gradient of a fill, one entry per bar. PineScript rules: the colour
 * changes with the price, `topColor` at `topValue` and `bottomColor` at `bottomValue`; outside that range the end
 * colour is kept; each bar has its own gradient (the part from bar i-1 to bar i uses the values of bar i).
 */
export interface FillGradient {
  /** Price of `topColor`, per bar */
  topValue: number[];
  /** Price of `bottomColor`, per bar */
  bottomValue: number[];
  /** Colour at `topValue`, per bar (null: na) */
  topColor: Array<string | null>;
  /** Colour at `bottomValue`, per bar (null: na) */
  bottomColor: Array<string | null>;
}

/**
 * Marker location on the chart (PineScript plotshape/plotchar `location.*`)
 */
export type MarkerLocation = 'abovebar' | 'belowbar' | 'top' | 'bottom' | 'absolute';

/**
 * PineScript size constant (`size.auto`, `size.tiny`, ...)
 */
export type PineSize = 'auto' | 'tiny' | 'small' | 'normal' | 'large' | 'huge';

/**
 * Marker size (PineScript size.* constants)
 */
export type MarkerSize = PineSize;

/**
 * Shape style (PineScript shape.* constants)
 */
export type ShapeStyle =
  | 'xcross'
  | 'cross'
  | 'triangleup'
  | 'triangledown'
  | 'flag'
  | 'circle'
  | 'arrowup'
  | 'arrowdown'
  | 'labelup'
  | 'labeldown'
  | 'square'
  | 'diamond';

/**
 * Position of a marker:
 * - aboveBar / belowBar / inBar: next to the bar (PineScript location.abovebar / location.belowbar)
 * - atPriceTop / atPriceBottom / atPriceMiddle: at `price` (PineScript location.absolute), with the meaning of the
 *   lightweight-charts price positions: atPriceTop has the shape above the price, its bottom (the tip of a label) on
 *   the price (shape.labeldown); atPriceBottom has the shape below the price, its top on the price (shape.labelup);
 *   atPriceMiddle centres the shape on the price (other shapes)
 * - top / bottom: at the top / bottom edge of the pane of the indicator (PineScript location.top / location.bottom),
 *   the price pane for an overlay indicator or with forceOverlay
 */
export type MarkerPosition =
  | 'aboveBar'
  | 'belowBar'
  | 'inBar'
  | 'atPriceTop'
  | 'atPriceBottom'
  | 'atPriceMiddle'
  | 'top'
  | 'bottom';

/**
 * Marker shape (PineScript shape.* in the lightweight-charts spelling)
 */
export type MarkerShape =
  | 'arrowUp'
  | 'arrowDown'
  | 'circle'
  | 'square'
  | 'labelUp'
  | 'labelDown'
  | 'triangleUp'
  | 'triangleDown'
  | 'cross'
  | 'xcross'
  | 'diamond'
  | 'flag';

/**
 * One marker: a plotshape()/plotchar() marker on a bar where the condition held, or a marker of a built-in indicator
 */
export interface MarkerData {
  /** Time of the bar the marker is displayed on (offset already applied) */
  time: number;
  /** Where the marker is drawn */
  position: MarkerPosition;
  /** Price of the atPrice* positions (required with them) */
  price?: number;
  /** Shape. A plotchar marker also has `char`: the character is drawn in place of the shape */
  shape: MarkerShape;
  /**
   * Shape colour (the character colour of a plotchar marker). A fully transparent colour ('transparent',
   * '#rrggbb00', 'rgba(r, g, b, 0)') draws no shape, as PineScript `color = na`; the text is still drawn
   */
  color: string;
  /** Text; a line feed starts a new line */
  text?: string;
  /**
   * Text colour (PineScript textcolor). When omitted: white inside label shapes (labelUp / labelDown), the shape
   * colour for the other shapes
   */
  textColor?: string;
  /** Size multiplier (1 = default size) or a PineScript size */
  size?: number | PineSize;
  /** PineScript force_overlay = true: the marker of a non-overlay indicator is drawn on the price pane */
  forceOverlay?: boolean;
  /** Id of the plotshape/plotchar declaration that produced it (script markers) */
  id?: string;
  /** plotchar character, drawn in place of the shape */
  char?: string;
  /** Hover tooltip */
  tooltip?: string;
}

/**
 * Per-bar arrow from plotarrow(): up arrow for a positive value, down arrow for a negative value
 */
export interface ArrowData {
  /** Time of the bar the arrow is displayed on (offset already applied) */
  time: any;
  /** Id of the plotarrow declaration that produced it */
  id: string;
  /** Series value (non-zero): its sign gives the direction, its absolute value the height */
  value: number;
  /** Arrow color (colorup or colordown of that bar) */
  color: string;
}

/**
 * Per-bar candle color (barcolor() output)
 */
export interface BarColorData {
  /** Time of the colored bar (offset already applied) */
  time: number;
  /** Color */
  color: string;
}

/**
 * Per-bar background color (bgcolor() output)
 */
export interface BgColorData {
  /** Time of the colored bar (offset already applied) */
  time: number;
  /** Color (with its transparency) */
  color: string;
  /** PineScript bgcolor(..., force_overlay = true): drawn on the price pane even for a non-overlay indicator */
  forceOverlay?: boolean;
}

/**
 * One candle of plotcandle() (or of a built-in indicator that draws candles)
 */
export interface PlotCandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Body colour */
  color?: string;
  borderColor?: string;
  wickColor?: string;
  /** PineScript force_overlay = true: the candles of a non-overlay indicator are drawn on the price pane */
  forceOverlay?: boolean;
}

/**
 * One bar of plotbar(): an OHLC bar (a vertical line from low to high, the open tick on the left, the close tick on
 * the right)
 */
export interface PlotBarData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  color?: string;
  /** PineScript force_overlay = true: the bars of a non-overlay indicator are drawn on the price pane */
  forceOverlay?: boolean;
}

/** PineScript label style (`label.style_*` without the prefix) */
export type LabelStyle =
  | 'none'
  | 'xcross'
  | 'cross'
  | 'triangleup'
  | 'triangledown'
  | 'flag'
  | 'circle'
  | 'arrowup'
  | 'arrowdown'
  | 'label_up'
  | 'label_down'
  | 'label_left'
  | 'label_right'
  | 'label_lower_left'
  | 'label_lower_right'
  | 'label_upper_left'
  | 'label_upper_right'
  | 'label_center'
  | 'square'
  | 'diamond'
  | 'text_outline';

// Drawing outputs (labels, lines, boxes, linefills, polylines, tables). A field the script did not set is omitted and
// the renderer uses the PineScript default; a colour set to na is 'transparent'. A point on a bar after the last bar
// (PineScript bar_index + k) has the time of that future bar (see barTime). The same applies to markers and plots.

/**
 * A label (PineScript label.new)
 */
export interface LabelData {
  time: number;
  /** Price; not used with yloc 'abovebar' / 'belowbar' */
  price: number;
  text: string;
  /** Background, border and arrow colour */
  color?: string;
  textColor?: string;
  /** 'none': text only, no background (PineScript label.style_none) */
  style?: LabelStyle;
  size?: PineSize | number;
  /**
   * PineScript yloc: 'price' (default) places the label at `price`; 'abovebar' / 'belowbar' place it above the bar
   * high / below the bar low and ignore `price` (the renderer reads the bar at `time`).
   */
  yloc?: 'price' | 'abovebar' | 'belowbar';
  textAlign?: 'left' | 'center' | 'right';
  tooltip?: string;
  fontFamily?: 'default' | 'monospace';
  /** PineScript text.format_* flags: 0 none, 1 bold, 2 italic, 3 bold + italic */
  textFormatting?: number;
  /** PineScript force_overlay = true: the label of a non-overlay indicator is drawn on the price pane */
  forceOverlay?: boolean;
}

/**
 * A line (PineScript line.new)
 */
export interface LineDrawingData {
  time1: number;
  price1: number;
  time2: number;
  price2: number;
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted' | 'arrow_left' | 'arrow_right' | 'arrow_both';
  extend?: 'none' | 'left' | 'right' | 'both';
  /** PineScript force_overlay = true: the line of a non-overlay indicator is drawn on the price pane */
  forceOverlay?: boolean;
}

/**
 * A rectangle (PineScript box.new): time1 / price1 are the left / top, time2 / price2 the right / bottom
 */
export interface BoxData {
  time1: number;
  price1: number;
  time2: number;
  price2: number;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  text?: string;
  textColor?: string;
  textSize?: PineSize | number;
  textHAlign?: 'left' | 'center' | 'right';
  textVAlign?: 'top' | 'center' | 'bottom';
  textWrap?: 'none' | 'auto';
  fontFamily?: 'default' | 'monospace';
  /** PineScript text.format_* flags: 0 none, 1 bold, 2 italic, 3 bold + italic */
  textFormatting?: number;
  /** PineScript box extend: the box continues to the left / right edge of the chart */
  extend?: 'none' | 'left' | 'right' | 'both';
  /** PineScript force_overlay = true: the box of a non-overlay indicator is drawn on the price pane */
  forceOverlay?: boolean;
}

/**
 * The area between two lines (PineScript linefill.new), with the two lines as drawn (their extend included)
 */
export interface LinefillData {
  line1: LineDrawingData;
  line2: LineDrawingData;
  color?: string;
}

/**
 * A polyline (PineScript polyline.new)
 */
export interface PolylineData {
  points: Array<{ time: number; price: number }>;
  /** Curved segments between the points */
  curved?: boolean;
  /** The last point is connected to the first */
  closed?: boolean;
  lineColor?: string;
  /** Fill of the area inside the polyline */
  fillColor?: string;
  lineStyle?: 'solid' | 'dotted' | 'dashed' | 'arrow_left' | 'arrow_right' | 'arrow_both';
  lineWidth?: number;
  /** PineScript force_overlay = true: the polyline of a non-overlay indicator is drawn on the price pane */
  forceOverlay?: boolean;
}

/** Table position (PineScript position.*) */
export type TablePosition =
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'middle_left'
  | 'middle_center'
  | 'middle_right'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right';

/**
 * A table cell (PineScript table.cell)
 */
export interface TableCellData {
  row: number;
  column: number;
  text: string;
  bgColor?: string;
  textColor?: string;
  textSize?: PineSize | number;
  /** Width in % of the chart width; 0 fits the text */
  width?: number;
  /** Height in % of the chart height; 0 fits the text */
  height?: number;
  textHAlign?: 'left' | 'center' | 'right';
  textVAlign?: 'top' | 'center' | 'bottom';
  tooltip?: string;
  fontFamily?: 'default' | 'monospace';
  /** PineScript text.format_* flags: 0 none, 1 bold, 2 italic, 3 bold + italic */
  textFormatting?: number;
}

/**
 * Merged cells of a table (PineScript table.merge_cells): the cell at the start column / row covers the range and
 * gives its content
 */
export interface TableMergeData {
  startColumn: number;
  startRow: number;
  endColumn: number;
  endRow: number;
}

/**
 * A table (PineScript table.new)
 */
export interface TableData {
  position: TablePosition;
  columns: number;
  rows: number;
  cells: TableCellData[];
  merges?: TableMergeData[];
  bgColor?: string;
  frameColor?: string;
  frameWidth?: number;
  borderColor?: string;
  borderWidth?: number;
  /** PineScript force_overlay = true: the table of a non-overlay indicator is drawn on the price pane */
  forceOverlay?: boolean;
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
  /** Markers from plotshape()/plotchar() */
  markers?: MarkerData[];
  /** Arrows from plotarrow() */
  arrows?: ArrowData[];
  /** Background colors from bgcolor() */
  bgColors?: BgColorData[];
  /** Bar colors from barcolor() */
  barColors?: BarColorData[];
  /** Candles from plotcandle(), keyed by plotcandle id */
  plotCandles?: Record<string, PlotCandleData[]>;
  /** OHLC bars from plotbar(), keyed by plotbar id */
  plotBars?: Record<string, PlotBarData[]>;
  /** Labels alive after the last bar */
  labels?: LabelData[];
  /** Lines alive after the last bar */
  lines?: LineDrawingData[];
  /** Boxes alive after the last bar */
  boxes?: BoxData[];
  /** Linefills alive after the last bar */
  linefills?: LinefillData[];
  /** Polylines alive after the last bar */
  polylines?: PolylineData[];
  /** Tables alive after the last bar */
  tables?: TableData[];
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
