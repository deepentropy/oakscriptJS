/**
 * Chart Point namespace
 * Functions for creating and manipulating chart point objects.
 *
 * @remarks
 * Chart points represent specific locations on a chart with time, index, and price coordinates.
 * They are primarily used with polylines and other drawing objects that require multiple points.
 *
 * @version 6
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#type_chart.point | PineScript chart.point}
 */

import { ChartPoint } from '../types';

// Re-export the ChartPoint type for convenience
export type { ChartPoint };

/**
 * Creates a new chart point with all coordinates.
 *
 * @param time - UNIX timestamp in milliseconds (or null if using bar index)
 * @param index - Bar index (or null if using time)
 * @param price - Y-axis price value
 * @returns New ChartPoint object
 *
 * @remarks
 * Creates a chart point that can be used with polylines and other multi-point drawing objects.
 * Typically, you would provide either time or index, not both, depending on the xloc mode.
 *
 * @example
 * ```typescript
 * // Create a point with both time and index
 * const point = chartPoint.new(1609459200000, 100, 150.5);
 *
 * // Create a point with only index
 * const indexPoint = chartPoint.new(null, 50, 200);
 *
 * // Create a point with only time
 * const timePoint = chartPoint.new(1609459200000, null, 175);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_chart.point.new | PineScript chart.point.new}
 */
export function new_point(
  time: number | null,
  index: number | null,
  price: number
): ChartPoint {
  return {
    time,
    index,
    price,
  };
}

/**
 * Creates a chart point from time and price.
 *
 * @param time - UNIX timestamp in milliseconds
 * @param price - Y-axis price value
 * @returns New ChartPoint object with index set to null
 *
 * @remarks
 * Convenience function for creating points when using xloc.bar_time mode.
 *
 * @example
 * ```typescript
 * // Create a point using timestamp
 * const point = chartPoint.from_time(1609459200000, 150.5);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_chart.point.from_time | PineScript chart.point.from_time}
 */
export function from_time(time: number, price: number): ChartPoint {
  return {
    time,
    index: null,
    price,
  };
}

/**
 * Creates a chart point from bar index and price.
 *
 * @param index - Bar index
 * @param price - Y-axis price value
 * @returns New ChartPoint object with time set to null
 *
 * @remarks
 * Convenience function for creating points when using xloc.bar_index mode.
 *
 * @example
 * ```typescript
 * // Create a point using bar index
 * const point = chartPoint.from_index(50, 150.5);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_chart.point.from_index | PineScript chart.point.from_index}
 */
export function from_index(index: number, price: number): ChartPoint {
  return {
    time: null,
    index,
    price,
  };
}

/**
 * Creates a copy of a chart point.
 *
 * @param point - ChartPoint to copy
 * @returns New ChartPoint object with same values
 *
 * @remarks
 * Creates a shallow copy of the chart point. Since ChartPoint is immutable (readonly properties),
 * this creates an independent copy.
 *
 * @example
 * ```typescript
 * const original = chartPoint.from_index(10, 100);
 * const copied = chartPoint.copy(original);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_chart.point.copy | PineScript chart.point.copy}
 */
export function copy(point: ChartPoint): ChartPoint {
  return {
    time: point.time,
    index: point.index,
    price: point.price,
  };
}

// Alias to match PineScript API (chart.point.new)
export { new_point as new };
