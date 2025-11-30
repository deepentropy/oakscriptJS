/**
 * Polyline namespace
 * Functions for creating and manipulating polyline drawing objects.
 *
 * @remarks
 * Polylines allow connecting multiple points with line segments, enabling complex chart drawings
 * like trend channels, patterns, and custom shapes. This implementation focuses on basic
 * polylines (straight lines) - curved polylines can be added in a future iteration.
 *
 * @version 6
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_polyline.new | PineScript polyline.new}
 */

import { ChartPoint, Polyline, color } from '../types';

// Re-export the Polyline type for convenience
export type { Polyline };

// Internal counter for generating unique IDs
let polylineIdCounter = 0;

// Track all active polylines
const allPolylines: Polyline[] = [];

/**
 * Generates a unique ID for a polyline
 */
function generateId(): string {
  return `polyline_${++polylineIdCounter}`;
}

/**
 * Creates a new polyline connecting all points.
 *
 * @param points - Array of chart.point objects to connect
 * @param curved - If true, use curved line segments (default: false, NOT YET SUPPORTED)
 * @param closed - If true, connect first point to last point (default: false)
 * @param xloc - X-coordinate mode: 'bar_index' or 'bar_time' (default: 'bar_index')
 * @param line_color - Color of line segments (default: '#2196F3' - blue)
 * @param fill_color - Fill color for closed polylines (default: null)
 * @param line_style - Line style (default: 'solid')
 * @param line_width - Line width in pixels (default: 1)
 * @param force_overlay - Force display on main pane (default: false)
 * @returns New Polyline object
 *
 * @remarks
 * - The curved parameter is accepted but currently logs a warning as curved lines
 *   are not yet supported. Straight-line connections are used instead.
 * - For meaningful polylines, provide at least 2 points.
 * - Closed polylines can be filled with a color by setting fill_color.
 *
 * @example
 * ```typescript
 * import { chartPoint, polyline } from '@deepentropy/oakscriptjs';
 *
 * // Create points
 * const points = [
 *   chartPoint.from_index(0, 100),
 *   chartPoint.from_index(10, 120),
 *   chartPoint.from_index(20, 110)
 * ];
 *
 * // Create a basic polyline
 * const myPolyline = polyline.new(points);
 *
 * // Create a closed polygon with fill
 * const polygon = polyline.new(
 *   points,
 *   false,           // curved
 *   true,            // closed
 *   'bar_index',     // xloc
 *   '#FF5722',       // line_color
 *   'rgba(255, 87, 34, 0.3)'  // fill_color
 * );
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_polyline.new | PineScript polyline.new}
 */
export function new_polyline(
  points: ChartPoint[],
  curved: boolean = false,
  closed: boolean = false,
  xloc: 'bar_index' | 'bar_time' = 'bar_index',
  line_color: color = '#2196F3',
  fill_color: color | null = null,
  line_style: 'solid' | 'dotted' | 'dashed' = 'solid',
  line_width: number = 1,
  force_overlay: boolean = false
): Polyline {
  // Warn about curved polylines not being supported yet
  if (curved) {
    console.warn(
      'polyline.new(): curved polylines are not yet supported. Using straight-line connections.'
    );
  }

  // Validate line_width is positive
  if (line_width < 1) {
    console.warn('polyline.new(): line_width must be at least 1. Using 1.');
    line_width = 1;
  }

  const polyline: Polyline = {
    id: generateId(),
    points: [...points], // Create a copy of the points array
    curved,
    closed,
    xloc,
    line_color,
    fill_color,
    line_style,
    line_width,
    force_overlay,
  };

  // Track the polyline
  allPolylines.push(polyline);

  return polyline;
}

/**
 * Deletes a polyline.
 *
 * @param id - Polyline object to delete
 *
 * @remarks
 * Removes the polyline from the internal tracking array.
 * In a rendering context, this would also remove the polyline from the chart.
 *
 * @example
 * ```typescript
 * const myPolyline = polyline.new(points);
 * polyline.delete(myPolyline);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_polyline.delete | PineScript polyline.delete}
 */
export function delete_polyline(id: Polyline): void {
  const index = allPolylines.findIndex((p) => p.id === id.id);
  if (index !== -1) {
    allPolylines.splice(index, 1);
  }
}

/**
 * Gets all active polylines.
 *
 * @returns Array of all active polylines
 *
 * @remarks
 * Returns a copy of the internal polylines array to prevent external modification.
 *
 * @example
 * ```typescript
 * console.log('Total polylines:', polyline.all.length);
 *
 * for (const p of polyline.all) {
 *   console.log('Polyline ID:', p.id, 'Points:', p.points.length);
 * }
 * ```
 */
export function get_all(): readonly Polyline[] {
  return [...allPolylines];
}

/**
 * Clears all polylines from the internal tracking array.
 *
 * @remarks
 * This is useful for resetting state, especially in tests.
 * Not part of the PineScript API.
 */
export function clear_all(): void {
  allPolylines.length = 0;
}

/**
 * Resets the polyline ID counter.
 *
 * @remarks
 * This is useful for resetting state, especially in tests.
 * Not part of the PineScript API.
 */
export function reset_id_counter(): void {
  polylineIdCounter = 0;
}

// Aliases to match PineScript API
export { new_polyline as new };
export { delete_polyline as delete };
