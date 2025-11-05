/**
 * Linefill namespace
 * Functions for creating and manipulating linefill drawing objects.
 *
 * @remarks
 * Linefill objects fill the area between two lines with a color.
 * They have minimal computational value but automatically follow line movements
 * and provide a way to retrieve the underlying line references.
 *
 * @version 6
 */

import { Linefill, Line, color } from '../types';

/**
 * Creates a new linefill object that fills the area between two lines.
 *
 * @param line1 - First line object
 * @param line2 - Second line object
 * @param fillColor - Fill color (optional)
 * @returns New linefill object
 *
 * @remarks
 * - Automatically follows line movements (if lines are updated, fill updates too)
 * - Automatically deleted if either line is deleted
 * - If both lines extend in same direction, fill extends too
 * - Purely visual in TradingView, but getters allow retrieving line references
 *
 * @example
 * ```typescript
 * import { line, linefill } from 'oakscriptjs';
 *
 * // Create channel lines
 * const upperLine = line.new(0, 160, 50, 170, 'bar_index', 'right');
 * const lowerLine = line.new(0, 140, 50, 150, 'bar_index', 'right');
 *
 * // Fill channel with color
 * const channelFill = linefill.new(upperLine, lowerLine, '#0000FF20'); // Transparent blue
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_linefill.new | PineScript linefill.new}
 */
export function new_linefill(line1: Line, line2: Line, fillColor?: color): Linefill {
  return {
    line1,
    line2,
    color: fillColor
  };
}

/**
 * Returns the first line reference.
 *
 * @param id - Linefill object
 * @returns First line object
 *
 * @remarks
 * Can be used to retrieve and manipulate the first line.
 *
 * @example
 * ```typescript
 * const channelFill = linefill.new(upperLine, lowerLine);
 *
 * // Later, retrieve and update the first line
 * const line1 = linefill.get_line1(channelFill);
 * line.set_y2(line1, 175); // Update upper line's second point
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_linefill.get_line1 | PineScript linefill.get_line1}
 */
export function get_line1(id: Linefill): Line {
  return id.line1;
}

/**
 * Returns the second line reference.
 *
 * @param id - Linefill object
 * @returns Second line object
 *
 * @remarks
 * Can be used to retrieve and manipulate the second line.
 *
 * @example
 * ```typescript
 * const channelFill = linefill.new(upperLine, lowerLine);
 *
 * // Later, retrieve and update the second line
 * const line2 = linefill.get_line2(channelFill);
 * line.set_y2(line2, 145); // Update lower line's second point
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_linefill.get_line2 | PineScript linefill.get_line2}
 */
export function get_line2(id: Linefill): Line {
  return id.line2;
}

/**
 * Sets the fill color.
 *
 * @param id - Linefill object to modify
 * @param fillColor - New fill color
 * @returns Modified linefill object
 *
 * @remarks
 * Useful for dynamically changing channel colors based on conditions.
 *
 * @example
 * ```typescript
 * const channelFill = linefill.new(upperLine, lowerLine, '#0000FF20');
 *
 * // Change color based on trend
 * if (bullish) {
 *   linefill.set_color(channelFill, '#00FF0020'); // Green
 * } else {
 *   linefill.set_color(channelFill, '#FF000020'); // Red
 * }
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_linefill.set_color | PineScript linefill.set_color}
 */
export function set_color(id: Linefill, fillColor: color): Linefill {
  id.color = fillColor;
  return id;
}

/**
 * Deletes the linefill object.
 *
 * @param id - Linefill object to delete
 *
 * @remarks
 * In this implementation, deletion is a no-op since we don't maintain a global linefill registry.
 * Users should simply stop referencing the linefill object to allow garbage collection.
 * This function exists for API compatibility with PineScript.
 *
 * @example
 * ```typescript
 * const channelFill = linefill.new(upperLine, lowerLine);
 * linefill.delete(channelFill);
 * // Linefill object can now be garbage collected if no other references exist
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_linefill.delete | PineScript linefill.delete}
 */
export function delete_linefill(_id: Linefill): void {
  // No-op in this implementation
  // In TradingView, this removes the linefill from the chart
  // In our calculation-only library, users manage object lifecycle
}

// Alias to match PineScript API
export { new_linefill as new };
