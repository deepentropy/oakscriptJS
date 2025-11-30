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

import { Box, color } from '../types';

/**
 * Creates a new box object.
 *
 * @param left - Left border bar index or UNIX timestamp
 * @param top - Top border price level
 * @param right - Right border bar index or UNIX timestamp
 * @param bottom - Bottom border price level
 * @param xloc - X-axis coordinate system (default: 'bar_index')
 * @param extend - Horizontal extension mode (default: 'none')
 * @param border_color - Border color (optional)
 * @param border_width - Border width in pixels (optional, default: 1)
 * @param border_style - Border style (optional, default: 'solid')
 * @param bgcolor - Background fill color (optional)
 * @param text - Text content (optional)
 * @param text_size - Text size (optional)
 * @param text_color - Text color (optional)
 * @param text_halign - Horizontal text alignment (optional)
 * @param text_valign - Vertical text alignment (optional)
 * @param text_wrap - Text wrapping mode (optional)
 * @param text_font_family - Text font family (optional)
 * @returns New box object
 *
 * @remarks
 * - Defines a rectangular area from (left, bottom) to (right, top)
 * - Styling properties are stored but not used for computational functions
 * - Use getters to extract boundaries for gap detection and breakout analysis
 *
 * @example
 * ```typescript
 * // Create a gap box from bar 10-20, price 100-105
 * const gap = box.new(10, 105, 20, 100);
 *
 * // Later, check if gap is filled
 * const currentBar = 25;
 * const high = 104;
 * const low = 99;
 *
 * if (high > box.get_bottom(gap) && low < box.get_top(gap)) {
 *   console.log('Gap partially filled!');
 * }
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.new | PineScript box.new}
 */
export function new_box(
  left: number,
  top: number,
  right: number,
  bottom: number,
  xloc: 'bar_index' | 'bar_time' = 'bar_index',
  extend: 'none' | 'left' | 'right' | 'both' = 'none',
  border_color?: color,
  border_width?: number,
  border_style?: 'solid' | 'dotted' | 'dashed',
  bgcolor?: color,
  text?: string,
  text_size?: string | number,
  text_color?: color,
  text_halign?: 'left' | 'center' | 'right',
  text_valign?: 'top' | 'center' | 'bottom',
  text_wrap?: 'none' | 'auto',
  text_font_family?: 'default' | 'monospace'
): Box {
  return {
    left,
    top,
    right,
    bottom,
    xloc,
    extend,
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
    text_font_family
  };
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.get_left | PineScript box.get_left}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.get_right | PineScript box.get_right}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.get_top | PineScript box.get_top}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.get_bottom | PineScript box.get_bottom}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.copy | PineScript box.copy}
 */
export function copy(id: Box): Box {
  return { ...id };
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_left | PineScript box.set_left}
 */
export function set_left(id: Box, left: number): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_right | PineScript box.set_right}
 */
export function set_right(id: Box, right: number): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_top | PineScript box.set_top}
 */
export function set_top(id: Box, top: number): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_bottom | PineScript box.set_bottom}
 */
export function set_bottom(id: Box, bottom: number): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_lefttop | PineScript box.set_lefttop}
 */
export function set_lefttop(id: Box, left: number, top: number): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_rightbottom | PineScript box.set_rightbottom}
 */
export function set_rightbottom(id: Box, right: number, bottom: number): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_xloc | PineScript box.set_xloc}
 */
export function set_xloc(id: Box, left: number, right: number, xloc: 'bar_index' | 'bar_time'): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_extend | PineScript box.set_extend}
 */
export function set_extend(id: Box, extend: 'none' | 'left' | 'right' | 'both'): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_border_color | PineScript box.set_border_color}
 */
export function set_border_color(id: Box, borderColor: color): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_border_width | PineScript box.set_border_width}
 */
export function set_border_width(id: Box, width: number): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_border_style | PineScript box.set_border_style}
 */
export function set_border_style(id: Box, style: 'solid' | 'dotted' | 'dashed'): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_bgcolor | PineScript box.set_bgcolor}
 */
export function set_bgcolor(id: Box, bgColor: color): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_text | PineScript box.set_text}
 */
export function set_text(id: Box, text: string): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_text_color | PineScript box.set_text_color}
 */
export function set_text_color(id: Box, textColor: color): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_text_size | PineScript box.set_text_size}
 */
export function set_text_size(id: Box, size: string | number): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_text_halign | PineScript box.set_text_halign}
 */
export function set_text_halign(id: Box, align: 'left' | 'center' | 'right'): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_text_valign | PineScript box.set_text_valign}
 */
export function set_text_valign(id: Box, align: 'top' | 'center' | 'bottom'): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_text_wrap | PineScript box.set_text_wrap}
 */
export function set_text_wrap(id: Box, wrap: 'none' | 'auto'): Box {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.set_text_font_family | PineScript box.set_text_font_family}
 */
export function set_text_font_family(id: Box, font: 'default' | 'monospace'): Box {
  id.text_font_family = font;
  return id;
}

/**
 * Deletes the box object.
 *
 * @param id - Box object to delete
 *
 * @remarks
 * In this implementation, deletion is a no-op since we don't maintain a global box registry.
 * Users should simply stop referencing the box object to allow garbage collection.
 * This function exists for API compatibility with PineScript.
 *
 * @example
 * ```typescript
 * const box = box.new(10, 105, 20, 100);
 * box.delete(box);
 * // Box object can now be garbage collected if no other references exist
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_box.delete | PineScript box.delete}
 */
export function delete_box(_id: Box): void {
  // No-op in this implementation
  // In TradingView, this removes the box from the chart
  // In our calculation-only library, users manage object lifecycle
}

// Alias to match PineScript API
export { new_box as new };
