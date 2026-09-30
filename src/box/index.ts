/**
 * Box namespace
 * Functions for creating and manipulating box drawing objects.
 *
 * @remarks
 * Box objects represent rectangular areas on the chart. The getter functions
 * (get_top, get_bottom, get_left, get_right) enable computational use cases like:
 * - Gap detection and tracking (detecting when price fills gaps)
 * - Range breakout analysis (detecting when price breaks out of consolidation)
 * - Rectangle pattern recognition
 *
 * @version 6
 */

import { all as allDrawings, isDeleted, register, remove } from '../drawing/registry';
import type { ChartPoint, Box, color } from '../types';

type BoxXloc = 'bar_index' | 'bar_time';
type BoxExtend = 'none' | 'left' | 'right' | 'both';

/**
 * Creates a new box (PineScript `box.new`), with two chart points or with coordinates, in PineScript's
 * parameter order:
 *
 * - `box.new(top_left, bottom_right, border_color?, border_width?, border_style?, extend?, xloc?, bgcolor?,
 *   text?, text_size?, text_color?, text_halign?, text_valign?, text_wrap?, text_font_family?,
 *   force_overlay?, text_formatting?)`
 * - `box.new(left, top, right, bottom, border_color?, border_width?, border_style?, extend?, xloc?, ...)`
 *
 * With chart points, x is `point.index` for `bar_index` boxes and `point.time` for `bar_time` boxes.
 *
 * @example
 * ```typescript
 * // Gap box from bar 10 to 20, between 100 and 105, extended to the right
 * const gap = box.new(10, 105, 20, 100, '#2196F3', 1, 'solid', 'right');
 * ```
 */
export function new_box(
  top_left: ChartPoint,
  bottom_right: ChartPoint,
  border_color?: color,
  border_width?: number,
  border_style?: 'solid' | 'dotted' | 'dashed',
  extend?: BoxExtend,
  xloc?: BoxXloc,
  bgcolor?: color,
  text?: string,
  text_size?: string | number,
  text_color?: color,
  text_halign?: 'left' | 'center' | 'right',
  text_valign?: 'top' | 'center' | 'bottom',
  text_wrap?: 'none' | 'auto',
  text_font_family?: 'default' | 'monospace',
  force_overlay?: boolean,
  text_formatting?: number
): Box;
export function new_box(
  left: number,
  top: number,
  right: number,
  bottom: number,
  border_color?: color,
  border_width?: number,
  border_style?: 'solid' | 'dotted' | 'dashed',
  extend?: BoxExtend,
  xloc?: BoxXloc,
  bgcolor?: color,
  text?: string,
  text_size?: string | number,
  text_color?: color,
  text_halign?: 'left' | 'center' | 'right',
  text_valign?: 'top' | 'center' | 'bottom',
  text_wrap?: 'none' | 'auto',
  text_font_family?: 'default' | 'monospace',
  force_overlay?: boolean,
  text_formatting?: number
): Box;
export function new_box(...args: unknown[]): Box {
  let left: number, top: number, right: number, bottom: number, rest: unknown[];
  if (typeof args[0] === 'object' && args[0] !== null) {
    const [tl, br, ...others] = args as [ChartPoint, ChartPoint, ...unknown[]];
    const xloc = (others[4] as BoxXloc | undefined) ?? 'bar_index';
    [left, top, right, bottom, rest] = [pointX(tl, xloc), tl.price, pointX(br, xloc), br.price, others];
  } else {
    [left, top, right, bottom] = args as [number, number, number, number];
    rest = args.slice(4);
  }
  const [border_color, border_width, border_style, extend, xloc, bgcolor, text, text_size, text_color,
    text_halign, text_valign, text_wrap, text_font_family, force_overlay, text_formatting] = rest as [
    color?, number?, ('solid' | 'dotted' | 'dashed')?, BoxExtend?, BoxXloc?, color?, string?,
    (string | number)?, color?, ('left' | 'center' | 'right')?, ('top' | 'center' | 'bottom')?,
    ('none' | 'auto')?, ('default' | 'monospace')?, boolean?, number?,
  ];
  return register('box', {
    left,
    top,
    right,
    bottom,
    xloc: xloc ?? 'bar_index',
    extend: extend ?? 'none',
    border_color,
    border_width: border_width || 1,
    border_style: border_style || 'solid',
    bgcolor,
    text,
    text_size,
    text_color,
    text_halign,
    text_valign,
    text_wrap,
    text_font_family,
    force_overlay: force_overlay ?? false,
    text_formatting,
  });
}

/**
 * Returns the left border x coordinate.
 *
 * @param id - Box object
 * @returns Left border coordinate (bar index or timestamp)
 *
 * @remarks
 * **COMPUTATIONAL USE**: Calculate gap duration, validate range timeframes
 *
 * @example
 * ```typescript
 * const gap = box.new(10, 105, 20, 100);
 * const currentBar = 30;
 * const duration = currentBar - box.get_left(gap); // Returns 20
 *
 * if (duration > 50) {
 *   console.log('Gap has been open for 50+ bars');
 * }
 * ```
 */
export function get_left(id: Box): number {
  return id.left;
}

/**
 * Returns the right border x coordinate.
 *
 * @param id - Box object
 * @returns Right border coordinate (bar index or timestamp)
 *
 * @remarks
 * **COMPUTATIONAL USE**: Calculate gap duration, update trailing edges
 *
 * @example
 * ```typescript
 * const range = box.new(100, 155, 150, 145);
 * const width = box.get_right(range) - box.get_left(range); // Returns 50 bars
 * ```
 */
export function get_right(id: Box): number {
  return id.right;
}

/**
 * Returns the top border price level.
 *
 * @param id - Box object
 * @returns Top border price
 *
 * @remarks
 * **COMPUTATIONAL USE**: Detect breakouts above resistance, check gap fills
 *
 * @example
 * ```typescript
 * const gap = box.new(10, 105, 20, 100);  // Bearish gap
 *
 * // Check if price has filled gap from below
 * const high = 106;
 * if (high > box.get_top(gap)) {
 *   console.log('Gap completely filled!');
 * }
 * ```
 */
export function get_top(id: Box): number {
  return id.top;
}

/**
 * Returns the bottom border price level.
 *
 * @param id - Box object
 * @returns Bottom border price
 *
 * @remarks
 * **COMPUTATIONAL USE**: Detect breakouts below support, check gap fills
 *
 * @example
 * ```typescript
 * const gap = box.new(10, 105, 20, 100);  // Bearish gap
 *
 * // Check if price has touched gap from above
 * const low = 104;
 * if (low < box.get_top(gap) && low > box.get_bottom(gap)) {
 *   console.log('Price entered the gap!');
 * }
 * ```
 */
export function get_bottom(id: Box): number {
  return id.bottom;
}

/**
 * Creates a copy of the box object.
 *
 * @param id - Box object to copy
 * @returns New box object with same properties
 *
 * @remarks
 * Creates a shallow copy of the box. Modifications to the copy won't affect the original.
 *
 * @example
 * ```typescript
 * const originalBox = box.new(10, 105, 20, 100);
 * const copiedBox = box.copy(originalBox);
 *
 * // Modify copy without affecting original
 * copiedBox.top = 110;
 * ```
 */
export function copy(id: Box): Box {
  return register('box', { ...id });
}

// =============================================================================
// COORDINATE SETTERS
// =============================================================================

/**
 * Sets the left border x coordinate.
 *
 * @param id - Box object to modify
 * @param left - New left border coordinate
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_left(box, 15); // Move left edge to bar 15
 * ```
 */
export function set_left(id: Box, left: number): Box {
  if (isDeleted(id)) return id;
  id.left = left;
  return id;
}

/**
 * Sets the right border x coordinate.
 *
 * @param id - Box object to modify
 * @param right - New right border coordinate
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_right(box, 25); // Move right edge to bar 25
 * ```
 */
export function set_right(id: Box, right: number): Box {
  if (isDeleted(id)) return id;
  id.right = right;
  return id;
}

/**
 * Sets the top border price level.
 *
 * @param id - Box object to modify
 * @param top - New top border price
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_top(box, 110); // Move top edge to price 110
 * ```
 */
export function set_top(id: Box, top: number): Box {
  if (isDeleted(id)) return id;
  id.top = top;
  return id;
}

/**
 * Sets the bottom border price level.
 *
 * @param id - Box object to modify
 * @param bottom - New bottom border price
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_bottom(box, 95); // Move bottom edge to price 95
 * ```
 */
export function set_bottom(id: Box, bottom: number): Box {
  if (isDeleted(id)) return id;
  id.bottom = bottom;
  return id;
}

/**
 * Sets the left and top coordinates.
 *
 * @param id - Box object to modify
 * @param left - New left border coordinate
 * @param top - New top border price
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_lefttop(box, 12, 108); // Move top-left corner
 * ```
 */
export function set_lefttop(id: Box, left: number, top: number): Box {
  if (isDeleted(id)) return id;
  id.left = left;
  id.top = top;
  return id;
}

/**
 * Sets the right and bottom coordinates.
 *
 * @param id - Box object to modify
 * @param right - New right border coordinate
 * @param bottom - New bottom border price
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_rightbottom(box, 25, 98); // Move bottom-right corner
 * ```
 */
export function set_rightbottom(id: Box, right: number, bottom: number): Box {
  if (isDeleted(id)) return id;
  id.right = right;
  id.bottom = bottom;
  return id;
}

/**
 * Sets the coordinate system for the box.
 *
 * @param id - Box object to modify
 * @param left - New left border coordinate
 * @param right - New right border coordinate
 * @param xloc - New coordinate system ('bar_index' or 'bar_time')
 * @returns Modified box object
 *
 * @remarks
 * When changing xloc, you must provide appropriate x coordinates for the new system.
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * // Change to timestamp-based coordinates
 * box.set_xloc(box, 1609459200000, 1609545600000, 'bar_time');
 * ```
 */
export function set_xloc(id: Box, left: number, right: number, xloc: 'bar_index' | 'bar_time'): Box {
  if (isDeleted(id)) return id;
  id.left = left;
  id.right = right;
  id.xloc = xloc;
  return id;
}

/**
 * Sets the horizontal extension mode.
 *
 * @param id - Box object to modify
 * @param extend - New extension mode
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_extend(box, 'right'); // Extend box to the right
 * ```
 */
export function set_extend(id: Box, extend: 'none' | 'left' | 'right' | 'both'): Box {
  if (isDeleted(id)) return id;
  id.extend = extend;
  return id;
}

// =============================================================================
// STYLING SETTERS
// =============================================================================

/**
 * Sets the border color.
 *
 * @param id - Box object to modify
 * @param borderColor - New border color
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_border_color(box, '#FF0000'); // Red border
 * ```
 */
export function set_border_color(id: Box, borderColor: color): Box {
  if (isDeleted(id)) return id;
  id.border_color = borderColor;
  return id;
}

/**
 * Sets the border width.
 *
 * @param id - Box object to modify
 * @param width - New border width in pixels
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_border_width(box, 2); // Thicker border
 * ```
 */
export function set_border_width(id: Box, width: number): Box {
  if (isDeleted(id)) return id;
  id.border_width = width;
  return id;
}

/**
 * Sets the border style.
 *
 * @param id - Box object to modify
 * @param style - New border style
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_border_style(box, 'dashed'); // Dashed border
 * ```
 */
export function set_border_style(id: Box, style: 'solid' | 'dotted' | 'dashed'): Box {
  if (isDeleted(id)) return id;
  id.border_style = style;
  return id;
}

/**
 * Sets the background fill color.
 *
 * @param id - Box object to modify
 * @param bgColor - New background color
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_bgcolor(box, '#00FF0030'); // Transparent green fill
 * ```
 */
export function set_bgcolor(id: Box, bgColor: color): Box {
  if (isDeleted(id)) return id;
  id.bgcolor = bgColor;
  return id;
}

// =============================================================================
// TEXT SETTERS
// =============================================================================

/**
 * Sets the text content.
 *
 * @param id - Box object to modify
 * @param text - New text content
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_text(box, 'Gap Filled'); // Update text
 * ```
 */
export function set_text(id: Box, text: string): Box {
  if (isDeleted(id)) return id;
  id.text = text;
  return id;
}

/**
 * Sets the text color.
 *
 * @param id - Box object to modify
 * @param textColor - New text color
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_text_color(box, '#FFFFFF'); // White text
 * ```
 */
export function set_text_color(id: Box, textColor: color): Box {
  if (isDeleted(id)) return id;
  id.text_color = textColor;
  return id;
}

/**
 * Sets the text size.
 *
 * @param id - Box object to modify
 * @param size - New text size
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_text_size(box, 'large'); // Larger text
 * ```
 */
export function set_text_size(id: Box, size: string | number): Box {
  if (isDeleted(id)) return id;
  id.text_size = size;
  return id;
}

/**
 * Sets the horizontal text alignment.
 *
 * @param id - Box object to modify
 * @param align - New horizontal alignment
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_text_halign(box, 'center'); // Center text horizontally
 * ```
 */
export function set_text_halign(id: Box, align: 'left' | 'center' | 'right'): Box {
  if (isDeleted(id)) return id;
  id.text_halign = align;
  return id;
}

/**
 * Sets the vertical text alignment.
 *
 * @param id - Box object to modify
 * @param align - New vertical alignment
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_text_valign(box, 'center'); // Center text vertically
 * ```
 */
export function set_text_valign(id: Box, align: 'top' | 'center' | 'bottom'): Box {
  if (isDeleted(id)) return id;
  id.text_valign = align;
  return id;
}

/**
 * Sets the text wrapping mode.
 *
 * @param id - Box object to modify
 * @param wrap - New text wrap mode
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_text_wrap(box, 'auto'); // Enable text wrapping
 * ```
 */
export function set_text_wrap(id: Box, wrap: 'none' | 'auto'): Box {
  if (isDeleted(id)) return id;
  id.text_wrap = wrap;
  return id;
}

/**
 * Sets the text font family.
 *
 * @param id - Box object to modify
 * @param font - New font family
 * @returns Modified box object
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.set_text_font_family(box, 'monospace'); // Monospace font
 * ```
 */
export function set_text_font_family(id: Box, font: 'default' | 'monospace'): Box {
  if (isDeleted(id)) return id;
  id.text_font_family = font;
  return id;
}

/**
 * Deletes the box object.
 *
 * @param id - Box object to delete
 *
 * @remarks
 * Removes the box from `box.all()`. As in PineScript, the deleted box is `na`: its getters
 * return NaN and its setters do nothing. Deleting it twice has no effect.
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.delete(box);
 * // box.all() no longer contains it
 * ```
 */
export function delete_box(id: Box): void {
  remove('box', id);
}

/** x coordinate of a chart point for an object's xloc (`na` when the point has no such coordinate). */
function pointX(point: ChartPoint, xloc: 'bar_index' | 'bar_time'): number {
  const x = xloc === 'bar_time' ? point.time : point.index;
  return x ?? NaN;
}

/**
 * All live boxes, in creation order (PineScript `box.all`). A new array.
 */
export function all(): Box[] {
  return allDrawings('box');
}

/**
 * Sets the left and top borders from a chart point (`point.index` or `point.time` by xloc, and `point.price`).
 */
export function set_top_left_point(id: Box, point: ChartPoint): Box {
  if (isDeleted(id)) return id;
  id.left = pointX(point, id.xloc);
  id.top = point.price;
  return id;
}

/**
 * Sets the right and bottom borders from a chart point (`point.index` or `point.time` by xloc, and `point.price`).
 */
export function set_bottom_right_point(id: Box, point: ChartPoint): Box {
  if (isDeleted(id)) return id;
  id.right = pointX(point, id.xloc);
  id.bottom = point.price;
  return id;
}

/**
 * Sets the text formatting: `text.format_none`, `text.format_bold`, `text.format_italic`,
 * or `text.format_bold + text.format_italic`.
 */
export function set_text_formatting(id: Box, formatting: number): Box {
  if (isDeleted(id)) return id;
  id.text_formatting = formatting;
  return id;
}

// Alias to match PineScript API
export { new_box as new };
export { delete_box as delete };
