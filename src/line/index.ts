/**
 * Line namespace
 * Functions for creating and manipulating line drawing objects.
 *
 * @remarks
 * While lines are primarily visual in PineScript, the line.get_price() function provides
 * computational value for algorithmic trading - calculating trend line breakouts,
 * support/resistance levels, and pattern recognition.
 *
 * @version 6
 */

import { all as allDrawings, checkBarIndex, isDeleted, register, remove } from '../drawing/registry.js';
import type { ChartPoint, Line, color } from '../types/index.js';

type LineXloc = 'bar_index' | 'bar_time';
type LineExtend = 'none' | 'left' | 'right' | 'both';
type LineStyle = 'solid' | 'dotted' | 'dashed' | 'arrow_left' | 'arrow_right' | 'arrow_both';

/**
 * Creates a new line (PineScript `line.new`), with two chart points or with coordinates:
 *
 * - `line.new(first_point, second_point, xloc?, extend?, color?, style?, width?, force_overlay?)`
 * - `line.new(x1, y1, x2, y2, xloc?, extend?, color?, style?, width?, force_overlay?)`
 *
 * With chart points, x is `point.index` for `bar_index` lines and `point.time` for `bar_time` lines.
 *
 * @example
 * ```typescript
 * // Create a trend line from bar 0 (price 100) to bar 50 (price 150)
 * const trendLine = line.new(0, 100, 50, 150, 'bar_index', 'right');
 * const fromPoints = line.new(chartPoint.from_index(0, 100), chartPoint.from_index(50, 150));
 *
 * // Calculate price at bar 75 (extrapolated)
 * const price = line.get_price(trendLine, 75); // Returns 175
 * ```
 */
export function new_line(
  first_point: ChartPoint,
  second_point: ChartPoint,
  xloc?: LineXloc,
  extend?: LineExtend,
  lineColor?: color,
  style?: LineStyle,
  width?: number,
  force_overlay?: boolean
): Line;
export function new_line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  xloc?: LineXloc,
  extend?: LineExtend,
  lineColor?: color,
  style?: LineStyle,
  width?: number,
  force_overlay?: boolean
): Line;
export function new_line(...args: unknown[]): Line {
  let x1: number, y1: number, x2: number, y2: number, rest: unknown[];
  if (typeof args[0] === 'object' && args[0] !== null) {
    const [p1, p2, ...others] = args as [ChartPoint, ChartPoint, ...unknown[]];
    const xloc = (others[0] as LineXloc | undefined) ?? 'bar_index';
    [x1, y1, x2, y2, rest] = [pointX(p1, xloc), p1.price, pointX(p2, xloc), p2.price, others];
  } else {
    [x1, y1, x2, y2] = args as [number, number, number, number];
    rest = args.slice(4);
  }
  const [xloc, extend, lineColor, style, width, force_overlay] = rest as [
    LineXloc?, LineExtend?, color?, LineStyle?, number?, boolean?,
  ];
  checkBarIndex('line.new', 'x1', x1, xloc);
  checkBarIndex('line.new', 'x2', x2, xloc);
  return register('line', {
    x1,
    y1,
    x2,
    y2,
    xloc: xloc ?? 'bar_index',
    extend: extend ?? 'none',
    color: lineColor,
    style: style || 'solid',
    width: width ?? 1,
    force_overlay: force_overlay ?? false,
  });
}

/**
 * Returns the price level of a line at a given bar index (PineScript `line.get_price`).
 *
 * @param id - Line object
 * @param x - Bar index to calculate price at
 * @returns Price level at the given bar index; NaN for a vertical line (x1 == x2) or a deleted line
 *
 * @remarks
 * As in PineScript (#174):
 * - the line is read as extended on both sides whatever its `extend`: a point before x1 or after x2 has a price
 * - the price is `y1 + (y2 - y1) * (x - x1) / (x2 - x1)`, in that order (bit for bit)
 * - a line placed with `xloc.bar_time` throws "'line.get_price' must be used with lines created using
 *   'xloc=xloc.bar_index'." (runtime error RE10119)
 *
 * @example
 * ```typescript
 * const trendLine = line.new(0, 100, 50, 150, 'bar_index', 'right');
 *
 * line.get_price(trendLine, 25);  // 125
 * line.get_price(trendLine, 100); // 200
 * line.get_price(trendLine, -10); // 90: extended to the left too
 * ```
 */
export function get_price(id: Line, x: number): number {
  const { x1, y1, x2, y2, xloc } = id;
  if (xloc === 'bar_time') {
    throw new Error("'line.get_price' must be used with lines created using 'xloc=xloc.bar_index'.");
  }
  if (x2 === x1) return NaN;
  return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
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
 */
export function copy(id: Line): Line {
  return register('line', { ...id });
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
 */
export function set_x1(id: Line, x: number): Line {
  if (isDeleted(id)) return id;
  checkBarIndex('line.set_x***', 'x1', x, id.xloc);
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
 */
export function set_x2(id: Line, x: number): Line {
  if (isDeleted(id)) return id;
  checkBarIndex('line.set_x***', 'x2', x, id.xloc);
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
 */
export function set_y1(id: Line, y: number): Line {
  if (isDeleted(id)) return id;
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
 */
export function set_y2(id: Line, y: number): Line {
  if (isDeleted(id)) return id;
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
 */
export function set_xy1(id: Line, x: number, y: number): Line {
  if (isDeleted(id)) return id;
  checkBarIndex('line.set_x***', 'x1', x, id.xloc);
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
 */
export function set_xy2(id: Line, x: number, y: number): Line {
  if (isDeleted(id)) return id;
  checkBarIndex('line.set_x***', 'x2', x, id.xloc);
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
 */
export function set_xloc(id: Line, x1: number, x2: number, xloc: 'bar_index' | 'bar_time'): Line {
  if (isDeleted(id)) return id;
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
 */
export function set_extend(id: Line, extend: 'none' | 'left' | 'right' | 'both'): Line {
  if (isDeleted(id)) return id;
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
 */
export function set_color(id: Line, lineColor: color): Line {
  if (isDeleted(id)) return id;
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
 */
export function set_style(id: Line, style: 'solid' | 'dotted' | 'dashed' | 'arrow_left' | 'arrow_right' | 'arrow_both'): Line {
  if (isDeleted(id)) return id;
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
 */
export function set_width(id: Line, width: number): Line {
  if (isDeleted(id)) return id;
  id.width = width;
  return id;
}

/**
 * Deletes the line object.
 *
 * @param id - Line object to delete
 *
 * @remarks
 * Removes the line from `line.all()`. As in PineScript, the deleted line is `na`: its getters
 * return NaN and its setters do nothing. Deleting it twice has no effect. Deleting a line also deletes the linefills that use it.
 *
 * @example
 * ```typescript
 * const line = line.new(0, 100, 50, 150);
 * line.delete(line);
 * // line.all() no longer contains it
 * ```
 */
export function delete_line(id: Line): void {
  remove('line', id);
}

/** x coordinate of a chart point for an object's xloc (`na` when the point has no such coordinate). */
function pointX(point: ChartPoint, xloc: 'bar_index' | 'bar_time'): number {
  const x = xloc === 'bar_time' ? point.time : point.index;
  return x ?? NaN;
}

/**
 * All live lines, in creation order (PineScript `line.all`). A new array: later changes do not affect it.
 */
export function all(): Line[] {
  return allDrawings('line');
}

/**
 * Sets the first point of the line from a chart point: `point.index` for `bar_index` lines,
 * `point.time` for `bar_time` lines (`na` when the point does not have it), and `point.price`.
 */
export function set_first_point(id: Line, point: ChartPoint): Line {
  if (isDeleted(id)) return id;
  id.x1 = pointX(point, id.xloc);
  id.y1 = point.price;
  return id;
}

/**
 * Sets the second point of the line from a chart point (see {@link set_first_point}).
 */
export function set_second_point(id: Line, point: ChartPoint): Line {
  if (isDeleted(id)) return id;
  id.x2 = pointX(point, id.xloc);
  id.y2 = point.price;
  return id;
}

// Alias to match PineScript API
export { new_line as new };
export { delete_line as delete };
