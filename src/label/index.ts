/**
 * Label namespace
 * Functions for creating and manipulating label drawing objects.
 *
 * @remarks
 * Labels are primarily used for annotations and marking points on the chart.
 * They have limited computational value compared to lines and boxes, but getters
 * allow retrieving position and text for conditional logic.
 *
 * @version 6
 */

import { all as allDrawings, isDeleted, register, remove } from '../drawing/registry.js';
import type { ChartPoint, Label, color } from '../types/index.js';

type LabelXloc = 'bar_index' | 'bar_time';
type LabelYloc = 'price' | 'abovebar' | 'belowbar';
type LabelStyle = NonNullable<Label['style']>;

/**
 * Creates a new label (PineScript `label.new`), with a chart point or with coordinates:
 *
 * - `label.new(point, text?, xloc?, yloc?, color?, style?, textcolor?, size?, textalign?, tooltip?,
 *   text_font_family?, force_overlay?, text_formatting?)`
 * - `label.new(x, y, text?, xloc?, yloc?, color?, style?, textcolor?, size?, textalign?, tooltip?,
 *   text_font_family?, force_overlay?, text_formatting?)`
 *
 * With a chart point, x is `point.index` for `bar_index` labels and `point.time` for `bar_time` labels.
 *
 * @example
 * ```typescript
 * const signal = label.new(10, 105.5, 'BUY');
 * const atPoint = label.new(chartPoint.from_index(10, 105.5), 'BUY');
 * ```
 */
export function new_label(
  point: ChartPoint,
  text?: string,
  xloc?: LabelXloc,
  yloc?: LabelYloc,
  labelColor?: color,
  style?: LabelStyle,
  textcolor?: color,
  size?: string | number,
  textalign?: 'left' | 'center' | 'right',
  tooltip?: string,
  text_font_family?: 'default' | 'monospace',
  force_overlay?: boolean,
  text_formatting?: number
): Label;
export function new_label(
  x: number,
  y: number,
  text?: string,
  xloc?: LabelXloc,
  yloc?: LabelYloc,
  labelColor?: color,
  style?: LabelStyle,
  textcolor?: color,
  size?: string | number,
  textalign?: 'left' | 'center' | 'right',
  tooltip?: string,
  text_font_family?: 'default' | 'monospace',
  force_overlay?: boolean,
  text_formatting?: number
): Label;
export function new_label(...args: unknown[]): Label {
  let x: number, y: number, rest: unknown[];
  if (typeof args[0] === 'object' && args[0] !== null) {
    const point = args[0] as ChartPoint;
    rest = args.slice(1);
    x = pointX(point, (rest[1] as LabelXloc | undefined) ?? 'bar_index');
    y = point.price;
  } else {
    [x, y] = args as [number, number];
    rest = args.slice(2);
  }
  const [text, xloc, yloc, labelColor, style, textcolor, size, textalign, tooltip, text_font_family,
    force_overlay, text_formatting] = rest as [
    string?, LabelXloc?, LabelYloc?, color?, LabelStyle?, color?, (string | number)?,
    ('left' | 'center' | 'right')?, string?, ('default' | 'monospace')?, boolean?, number?,
  ];
  return register('label', {
    x,
    y,
    xloc: xloc ?? 'bar_index',
    yloc: yloc ?? 'price',
    // PineScript: a label without text has the text "" (label.get_text gives "")
    text: text ?? '',
    tooltip,
    color: labelColor,
    style,
    textcolor,
    size,
    textalign,
    text_font_family,
    force_overlay: force_overlay ?? false,
    text_formatting,
  });
}

/**
 * Returns the x coordinate.
 *
 * @param id - Label object
 * @returns X coordinate (bar index or timestamp)
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * const x = label.get_x(label); // Returns 50
 * ```
 */
export function get_x(id: Label): number {
  return id.x;
}

/**
 * Returns the y coordinate (price level).
 *
 * @param id - Label object
 * @returns Y coordinate (price)
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * const y = label.get_y(label); // Returns 155.5
 * ```
 */
export function get_y(id: Label): number {
  return id.y;
}

/**
 * Returns the label text content.
 *
 * @param id - Label object
 * @returns Text content (or undefined if no text)
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot High');
 * const text = label.get_text(label); // Returns 'Pivot High'
 * ```
 */
export function get_text(id: Label): string | undefined {
  return id.text;
}

/**
 * Creates a copy of the label object.
 *
 * @param id - Label object to copy
 * @returns New label object with same properties
 *
 * @remarks
 * Creates a shallow copy of the label. Modifications to the copy won't affect the original.
 *
 * @example
 * ```typescript
 * const original = label.new(50, 155.5, 'Pivot');
 * const copied = label.copy(original);
 *
 * // Modify copy without affecting original
 * copied.text = 'New Text';
 * ```
 */
export function copy(id: Label): Label {
  return register('label', { ...id });
}

// =============================================================================
// POSITION SETTERS
// =============================================================================

/**
 * Sets the x coordinate.
 *
 * @param id - Label object to modify
 * @param x - New x coordinate
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_x(label, 55); // Move to bar 55
 * ```
 */
export function set_x(id: Label, x: number): Label {
  if (isDeleted(id)) return id;
  id.x = x;
  return id;
}

/**
 * Sets the y coordinate (price level).
 *
 * @param id - Label object to modify
 * @param y - New y coordinate
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_y(label, 160); // Move to price 160
 * ```
 */
export function set_y(id: Label, y: number): Label {
  if (isDeleted(id)) return id;
  id.y = y;
  return id;
}

/**
 * Sets both x and y coordinates.
 *
 * @param id - Label object to modify
 * @param x - New x coordinate
 * @param y - New y coordinate
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_xy(label, 60, 160); // Move to (60, 160)
 * ```
 */
export function set_xy(id: Label, x: number, y: number): Label {
  if (isDeleted(id)) return id;
  id.x = x;
  id.y = y;
  return id;
}

/**
 * Sets the x-axis coordinate system.
 *
 * @param id - Label object to modify
 * @param x - New x coordinate
 * @param xloc - New coordinate system
 * @returns Modified label object
 *
 * @remarks
 * When changing xloc, you must provide an appropriate x coordinate for the new system.
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_xloc(label, 1609459200000, 'bar_time'); // Change to timestamp
 * ```
 */
export function set_xloc(id: Label, x: number, xloc: 'bar_index' | 'bar_time'): Label {
  if (isDeleted(id)) return id;
  id.x = x;
  id.xloc = xloc;
  return id;
}

/**
 * Sets the y-location mode of the label (PineScript `label.set_yloc(id, yloc)`): `price` uses the
 * label's y, `abovebar` / `belowbar` place it above / below the bar.
 */
export function set_yloc(id: Label, yloc: 'price' | 'abovebar' | 'belowbar'): Label {
  if (isDeleted(id)) return id;
  id.yloc = yloc;
  return id;
}

// =============================================================================
// CONTENT SETTERS
// =============================================================================

/**
 * Sets the text content.
 *
 * @param id - Label object to modify
 * @param text - New text content
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_text(label, 'Updated Text');
 * ```
 */
export function set_text(id: Label, text: string): Label {
  if (isDeleted(id)) return id;
  id.text = text;
  return id;
}

/**
 * Sets the tooltip text.
 *
 * @param id - Label object to modify
 * @param tooltip - New tooltip text
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_tooltip(label, 'Resistance level formed at 155.5');
 * ```
 */
export function set_tooltip(id: Label, tooltip: string): Label {
  if (isDeleted(id)) return id;
  id.tooltip = tooltip;
  return id;
}

// =============================================================================
// STYLING SETTERS
// =============================================================================

/**
 * Sets the label color (border and arrow).
 *
 * @param id - Label object to modify
 * @param labelColor - New color
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_color(label, '#FF0000'); // Red label
 * ```
 */
export function set_color(id: Label, labelColor: color): Label {
  if (isDeleted(id)) return id;
  id.color = labelColor;
  return id;
}

/**
 * Sets the text color.
 *
 * @param id - Label object to modify
 * @param textColor - New text color
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_textcolor(label, '#FFFFFF'); // White text
 * ```
 */
export function set_textcolor(id: Label, textColor: color): Label {
  if (isDeleted(id)) return id;
  id.textcolor = textColor;
  return id;
}

/**
 * Sets the label style.
 *
 * @param id - Label object to modify
 * @param style - New label style
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_style(label, 'label_down'); // Arrow pointing down
 * ```
 */
export function set_style(
  id: Label,
  style: 'none' | 'xcross' | 'cross' | 'triangleup' | 'triangledown' | 'flag' | 'circle' |
        'arrowup' | 'arrowdown' | 'label_up' | 'label_down' | 'label_left' | 'label_right' |
        'label_lower_left' | 'label_lower_right' | 'label_upper_left' | 'label_upper_right' |
        'label_center' | 'square' | 'diamond' | 'text_outline'
): Label {
  if (isDeleted(id)) return id;
  id.style = style;
  return id;
}

/**
 * Sets the label size.
 *
 * @param id - Label object to modify
 * @param size - New size
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_size(label, 'large'); // Larger label
 * ```
 */
export function set_size(id: Label, size: string | number): Label {
  if (isDeleted(id)) return id;
  id.size = size;
  return id;
}

/**
 * Sets the text alignment.
 *
 * @param id - Label object to modify
 * @param align - New text alignment
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_textalign(label, 'center'); // Center-aligned text
 * ```
 */
export function set_textalign(id: Label, align: 'left' | 'center' | 'right'): Label {
  if (isDeleted(id)) return id;
  id.textalign = align;
  return id;
}

/**
 * Sets the text font family.
 *
 * @param id - Label object to modify
 * @param font - New font family
 * @returns Modified label object
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_text_font_family(label, 'monospace');
 * ```
 */
export function set_text_font_family(id: Label, font: 'default' | 'monospace'): Label {
  if (isDeleted(id)) return id;
  id.text_font_family = font;
  return id;
}

/**
 * Deletes the label object.
 *
 * @param id - Label object to delete
 *
 * @remarks
 * Removes the label from `label.all()`. As in PineScript, the deleted label is `na`: its getters
 * return NaN and its setters do nothing. Deleting it twice has no effect.
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.delete(label);
 * // label.all() no longer contains it
 * ```
 */
export function delete_label(id: Label): void {
  remove('label', id);
}

/** x coordinate of a chart point for an object's xloc (`na` when the point has no such coordinate). */
function pointX(point: ChartPoint, xloc: 'bar_index' | 'bar_time'): number {
  const x = xloc === 'bar_time' ? point.time : point.index;
  return x ?? NaN;
}

/**
 * All live labels, in creation order (PineScript `label.all`). A new array.
 */
export function all(): Label[] {
  return allDrawings('label');
}

/**
 * Sets the label position from a chart point: `point.index` for `bar_index` labels, `point.time`
 * for `bar_time` labels, and `point.price`.
 */
export function set_point(id: Label, point: ChartPoint): Label {
  if (isDeleted(id)) return id;
  id.x = pointX(point, id.xloc);
  id.y = point.price;
  return id;
}

/**
 * Sets the text formatting: `text.format_none`, `text.format_bold`, `text.format_italic`,
 * or `text.format_bold + text.format_italic`.
 */
export function set_text_formatting(id: Label, formatting: number): Label {
  if (isDeleted(id)) return id;
  id.text_formatting = formatting;
  return id;
}

// Alias to match PineScript API
export { new_label as new };
export { delete_label as delete };
