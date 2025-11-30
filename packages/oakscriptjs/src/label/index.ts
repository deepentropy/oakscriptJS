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

import { Label, color } from '../types';

/**
 * Creates a new label object.
 *
 * @param x - Bar index or UNIX timestamp
 * @param y - Price level (when yloc = 'price')
 * @param text - Label text content (optional)
 * @param xloc - X-axis coordinate system (default: 'bar_index')
 * @param yloc - Y-axis positioning mode (default: 'price')
 * @param labelColor - Border and arrow color (optional)
 * @param style - Label style (optional)
 * @param textcolor - Text color (optional)
 * @param size - Label size (optional)
 * @param textalign - Text alignment (optional)
 * @param tooltip - Tooltip text (optional)
 * @param text_font_family - Font family (optional)
 * @returns New label object
 *
 * @remarks
 * - yloc modes: 'price' (at y coordinate), 'abovebar' (above bar), 'belowbar' (below bar)
 * - Label styles include: 'label_up', 'label_down', 'arrowup', 'arrowdown', 'circle', etc.
 * - Styling properties are stored but not used for computational functions
 *
 * @example
 * ```typescript
 * // Mark a pivot high
 * const label = label.new(50, 155.5, 'Pivot High', 'bar_index', 'price', '#FF0000', 'label_down');
 *
 * // Simple annotation
 * const note = label.new(100, 150, 'Breakout', 'bar_index', 'abovebar');
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.new | PineScript label.new}
 */
export function new_label(
  x: number,
  y: number,
  text?: string,
  xloc: 'bar_index' | 'bar_time' = 'bar_index',
  yloc: 'price' | 'abovebar' | 'belowbar' = 'price',
  labelColor?: color,
  style?: 'none' | 'xcross' | 'cross' | 'triangleup' | 'triangledown' | 'flag' | 'circle' |
          'arrowup' | 'arrowdown' | 'label_up' | 'label_down' | 'label_left' | 'label_right' |
          'label_lower_left' | 'label_lower_right' | 'label_upper_left' | 'label_upper_right' |
          'label_center' | 'square' | 'diamond' | 'text_outline',
  textcolor?: color,
  size?: string | number,
  textalign?: 'left' | 'center' | 'right',
  tooltip?: string,
  text_font_family?: 'default' | 'monospace'
): Label {
  return {
    x,
    y,
    xloc,
    yloc,
    text,
    tooltip,
    color: labelColor,
    style,
    textcolor,
    size,
    textalign,
    text_font_family
  };
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.get_x | PineScript label.get_x}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.get_y | PineScript label.get_y}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.get_text | PineScript label.get_text}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.copy | PineScript label.copy}
 */
export function copy(id: Label): Label {
  return { ...id };
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_x | PineScript label.set_x}
 */
export function set_x(id: Label, x: number): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_y | PineScript label.set_y}
 */
export function set_y(id: Label, y: number): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_xy | PineScript label.set_xy}
 */
export function set_xy(id: Label, x: number, y: number): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_xloc | PineScript label.set_xloc}
 */
export function set_xloc(id: Label, x: number, xloc: 'bar_index' | 'bar_time'): Label {
  id.x = x;
  id.xloc = xloc;
  return id;
}

/**
 * Sets the y-axis positioning mode.
 *
 * @param id - Label object to modify
 * @param y - New y coordinate
 * @param yloc - New positioning mode
 * @returns Modified label object
 *
 * @remarks
 * - 'price': Position at y coordinate
 * - 'abovebar': Position above the bar
 * - 'belowbar': Position below the bar
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.set_yloc(label, 0, 'abovebar'); // Position above bar (y ignored)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_yloc | PineScript label.set_yloc}
 */
export function set_yloc(id: Label, y: number, yloc: 'price' | 'abovebar' | 'belowbar'): Label {
  id.y = y;
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_text | PineScript label.set_text}
 */
export function set_text(id: Label, text: string): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_tooltip | PineScript label.set_tooltip}
 */
export function set_tooltip(id: Label, tooltip: string): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_color | PineScript label.set_color}
 */
export function set_color(id: Label, labelColor: color): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_textcolor | PineScript label.set_textcolor}
 */
export function set_textcolor(id: Label, textColor: color): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_style | PineScript label.set_style}
 */
export function set_style(
  id: Label,
  style: 'none' | 'xcross' | 'cross' | 'triangleup' | 'triangledown' | 'flag' | 'circle' |
        'arrowup' | 'arrowdown' | 'label_up' | 'label_down' | 'label_left' | 'label_right' |
        'label_lower_left' | 'label_lower_right' | 'label_upper_left' | 'label_upper_right' |
        'label_center' | 'square' | 'diamond' | 'text_outline'
): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_size | PineScript label.set_size}
 */
export function set_size(id: Label, size: string | number): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_textalign | PineScript label.set_textalign}
 */
export function set_textalign(id: Label, align: 'left' | 'center' | 'right'): Label {
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.set_text_font_family | PineScript label.set_text_font_family}
 */
export function set_text_font_family(id: Label, font: 'default' | 'monospace'): Label {
  id.text_font_family = font;
  return id;
}

/**
 * Deletes the label object.
 *
 * @param id - Label object to delete
 *
 * @remarks
 * In this implementation, deletion is a no-op since we don't maintain a global label registry.
 * Users should simply stop referencing the label object to allow garbage collection.
 * This function exists for API compatibility with PineScript.
 *
 * @example
 * ```typescript
 * const label = label.new(50, 155.5, 'Pivot');
 * label.delete(label);
 * // Label object can now be garbage collected if no other references exist
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_label.delete | PineScript label.delete}
 */
export function delete_label(_id: Label): void {
  // No-op in this implementation
  // In TradingView, this removes the label from the chart
  // In our calculation-only library, users manage object lifecycle
}

// Alias to match PineScript API
export { new_label as new };
