/**
 * Line namespace
 * Functions for creating and manipulating line drawing objects.
 *
 * @remarks
 * While lines are primarily visual in TradingView, the line.get_price() function provides
 * computational value for algorithmic trading - calculating trend line breakouts,
 * support/resistance levels, and pattern recognition.
 *
 * @version 6
 */

import { Line, color } from '../types';

/**
 * Creates a new line object.
 *
 * @param x1 - First point's bar index or UNIX timestamp
 * @param y1 - First point's price level
 * @param x2 - Second point's bar index or UNIX timestamp
 * @param y2 - Second point's price level
 * @param xloc - X-axis coordinate system (default: 'bar_index')
 * @param extend - Extension mode (default: 'none')
 * @param color - Line color (optional)
 * @param style - Line style (optional, default: 'solid')
 * @param width - Line width in pixels (optional, default: 1)
 * @returns New line object
 *
 * @remarks
 * - Coordinates can be bar indices or UNIX timestamps depending on xloc
 * - Extension modes: 'none', 'left', 'right', 'both'
 * - Styling properties are stored but not used for computational functions
 *
 * @example
 * ```typescript
 * // Create a trend line from bar 0 (price 100) to bar 50 (price 150)
 * const trendLine = line.new(0, 100, 50, 150, 'bar_index', 'right');
 *
 * // Calculate price at bar 75 (extrapolated)
 * const price = line.get_price(trendLine, 75); // Returns 175
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.new | PineScript line.new}
 */
export function new_line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  xloc: 'bar_index' | 'bar_time' = 'bar_index',
  extend: 'none' | 'left' | 'right' | 'both' = 'none',
  lineColor?: color,
  style?: 'solid' | 'dotted' | 'dashed' | 'arrow_left' | 'arrow_right' | 'arrow_both',
  width?: number
): Line {
  return {
    x1,
    y1,
    x2,
    y2,
    xloc,
    extend,
    color: lineColor,
    style: style || 'solid',
    width: width || 1
  };
}

/**
 * Returns the price level of a line at a given bar index.
 *
 * @param id - Line object
 * @param x - Bar index to calculate price at
 * @returns Price level at the given bar index, or NaN if outside bounds and not extended
 *
 * @remarks
 * - **CRITICAL COMPUTATIONAL FUNCTION** - Enables trend line breakout detection
 * - Uses linear interpolation: y = y1 + (y2 - y1) * (x - x1) / (x2 - x1)
 * - Respects extend mode:
 *   - 'none': Returns NaN if x is outside [x1, x2]
 *   - 'left': Extends infinitely to the left (x < x1)
 *   - 'right': Extends infinitely to the right (x > x2)
 *   - 'both': Extends infinitely in both directions
 * - Only works with xloc='bar_index' lines (not xloc='bar_time')
 * - In PineScript, this function treats all lines as if extend='both' regardless of actual setting
 *   For compatibility, we follow the actual extend setting
 *
 * @example
 * ```typescript
 * const trendLine = line.new(0, 100, 50, 150, 'bar_index', 'right');
 *
 * // Within segment
 * line.get_price(trendLine, 25);  // Returns 125
 *
 * // Extended right
 * line.get_price(trendLine, 100); // Returns 200
 *
 * // Not extended left (with extend='right')
 * line.get_price(trendLine, -10); // Returns NaN
 *
 * // Use for breakout detection
 * const currentPrice = close[close.length - 1];
 * const linePrice = line.get_price(trendLine, close.length - 1);
 * if (currentPrice > linePrice) {
 *   console.log('Breakout above trend line!');
 * }
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.get_price | PineScript line.get_price}
 */
export function get_price(id: Line, x: number): number {
  const { x1, y1, x2, y2, extend, xloc } = id;

  // Only works with bar_index xloc
  if (xloc === 'bar_time') {
    throw new Error('line.get_price() only works with xloc.bar_index lines, not xloc.bar_time');
  }

  // Avoid division by zero
  if (x2 === x1) {
    // Vertical line - return NaN or could return y1/y2
    return NaN;
  }

  // Linear interpolation formula: y = y1 + (y2 - y1) * (x - x1) / (x2 - x1)
  const slope = (y2 - y1) / (x2 - x1);
  const price = y1 + slope * (x - x1);

  // Check bounds based on extend mode
  if (extend === 'none') {
    // Only valid within the segment
    if (x < Math.min(x1, x2) || x > Math.max(x1, x2)) {
      return NaN;
    }
  } else if (extend === 'left') {
    // Valid to the left and within, but not to the right
    if (x > Math.max(x1, x2)) {
      return NaN;
    }
  } else if (extend === 'right') {
    // Valid to the right and within, but not to the left
    if (x < Math.min(x1, x2)) {
      return NaN;
    }
  }
  // extend === 'both': always valid

  return price;
}

/**
 * Returns the first point's x coordinate.
 *
 * @param id - Line object
 * @returns X coordinate of the first point
 *
 * @example
 * ```typescript
 * const line = line.new(10, 100, 50, 150);
 * const x1 = line.get_x1(line); // Returns 10
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.get_x1 | PineScript line.get_x1}
 */
export function get_x1(id: Line): number {
  return id.x1;
}

/**
 * Returns the second point's x coordinate.
 *
 * @param id - Line object
 * @returns X coordinate of the second point
 *
 * @example
 * ```typescript
 * const line = line.new(10, 100, 50, 150);
 * const x2 = line.get_x2(line); // Returns 50
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.get_x2 | PineScript line.get_x2}
 */
export function get_x2(id: Line): number {
  return id.x2;
}

/**
 * Returns the first point's y coordinate (price level).
 *
 * @param id - Line object
 * @returns Y coordinate (price) of the first point
 *
 * @example
 * ```typescript
 * const line = line.new(10, 100, 50, 150);
 * const y1 = line.get_y1(line); // Returns 100
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.get_y1 | PineScript line.get_y1}
 */
export function get_y1(id: Line): number {
  return id.y1;
}

/**
 * Returns the second point's y coordinate (price level).
 *
 * @param id - Line object
 * @returns Y coordinate (price) of the second point
 *
 * @example
 * ```typescript
 * const line = line.new(10, 100, 50, 150);
 * const y2 = line.get_y2(line); // Returns 150
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.get_y2 | PineScript line.get_y2}
 */
export function get_y2(id: Line): number {
  return id.y2;
}

/**
 * Creates a copy of the line object.
 *
 * @param id - Line object to copy
 * @returns New line object with same properties
 *
 * @remarks
 * Creates a shallow copy of the line. Modifications to the copy won't affect the original.
 *
 * @example
 * ```typescript
 * const originalLine = line.new(0, 100, 50, 150);
 * const copiedLine = line.copy(originalLine);
 *
 * // Modify copy without affecting original
 * copiedLine.y2 = 200;
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.copy | PineScript line.copy}
 */
export function copy(id: Line): Line {
  return { ...id };
}

/**
 * Sets the first point's x coordinate.
 *
 * @param id - Line object to modify
 * @param x - New x coordinate (bar index or timestamp)
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_x1(line, 10); // Move first point to bar 10
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_x1 | PineScript line.set_x1}
 */
export function set_x1(id: Line, x: number): Line {
  id.x1 = x;
  return id;
}

/**
 * Sets the second point's x coordinate.
 *
 * @param id - Line object to modify
 * @param x - New x coordinate (bar index or timestamp)
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_x2(line, 60); // Move second point to bar 60
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_x2 | PineScript line.set_x2}
 */
export function set_x2(id: Line, x: number): Line {
  id.x2 = x;
  return id;
}

/**
 * Sets the first point's y coordinate (price level).
 *
 * @param id - Line object to modify
 * @param y - New y coordinate (price)
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_y1(line, 110); // Move first point to price 110
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_y1 | PineScript line.set_y1}
 */
export function set_y1(id: Line, y: number): Line {
  id.y1 = y;
  return id;
}

/**
 * Sets the second point's y coordinate (price level).
 *
 * @param id - Line object to modify
 * @param y - New y coordinate (price)
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_y2(line, 160); // Move second point to price 160
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_y2 | PineScript line.set_y2}
 */
export function set_y2(id: Line, y: number): Line {
  id.y2 = y;
  return id;
}

/**
 * Sets both coordinates of the first point.
 *
 * @param id - Line object to modify
 * @param x - New x coordinate
 * @param y - New y coordinate
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_xy1(line, 5, 105); // Move first point to (5, 105)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_xy1 | PineScript line.set_xy1}
 */
export function set_xy1(id: Line, x: number, y: number): Line {
  id.x1 = x;
  id.y1 = y;
  return id;
}

/**
 * Sets both coordinates of the second point.
 *
 * @param id - Line object to modify
 * @param x - New x coordinate
 * @param y - New y coordinate
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_xy2(line, 60, 160); // Move second point to (60, 160)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_xy2 | PineScript line.set_xy2}
 */
export function set_xy2(id: Line, x: number, y: number): Line {
  id.x2 = x;
  id.y2 = y;
  return id;
}

/**
 * Sets the coordinate system for the line.
 *
 * @param id - Line object to modify
 * @param x1 - New first point x coordinate
 * @param x2 - New second point x coordinate
 * @param xloc - New coordinate system ('bar_index' or 'bar_time')
 * @returns Modified line object
 *
 * @remarks
 * When changing xloc, you must provide appropriate x coordinates for the new system.
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * // Change to timestamp-based coordinates
 * line.set_xloc(line, 1609459200000, 1609545600000, 'bar_time');
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_xloc | PineScript line.set_xloc}
 */
export function set_xloc(id: Line, x1: number, x2: number, xloc: 'bar_index' | 'bar_time'): Line {
  id.x1 = x1;
  id.x2 = x2;
  id.xloc = xloc;
  return id;
}

/**
 * Sets the extension mode of the line.
 *
 * @param id - Line object to modify
 * @param extend - New extension mode
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_extend(line, 'right'); // Extend line to the right
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_extend | PineScript line.set_extend}
 */
export function set_extend(id: Line, extend: 'none' | 'left' | 'right' | 'both'): Line {
  id.extend = extend;
  return id;
}

/**
 * Sets the line color.
 *
 * @param id - Line object to modify
 * @param color - New line color
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_color(line, '#FF0000'); // Change to red
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_color | PineScript line.set_color}
 */
export function set_color(id: Line, lineColor: color): Line {
  id.color = lineColor;
  return id;
}

/**
 * Sets the line style.
 *
 * @param id - Line object to modify
 * @param style - New line style
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_style(line, 'dashed'); // Change to dashed line
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_style | PineScript line.set_style}
 */
export function set_style(id: Line, style: 'solid' | 'dotted' | 'dashed' | 'arrow_left' | 'arrow_right' | 'arrow_both'): Line {
  id.style = style;
  return id;
}

/**
 * Sets the line width.
 *
 * @param id - Line object to modify
 * @param width - New line width in pixels
 * @returns Modified line object
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.set_width(line, 3); // Make line thicker
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.set_width | PineScript line.set_width}
 */
export function set_width(id: Line, width: number): Line {
  id.width = width;
  return id;
}

/**
 * Deletes the line object.
 *
 * @param id - Line object to delete
 *
 * @remarks
 * In this implementation, deletion is a no-op since we don't maintain a global line registry.
 * Users should simply stop referencing the line object to allow garbage collection.
 * This function exists for API compatibility with PineScript.
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.delete(line);
 * // Line object can now be garbage collected if no other references exist
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_line.delete | PineScript line.delete}
 */
export function delete_line(_id: Line): void {
  // No-op in this implementation
  // In TradingView, this removes the line from the chart
  // In our calculation-only library, users manage object lifecycle
}

// Alias to match PineScript API
export { new_line as new };
