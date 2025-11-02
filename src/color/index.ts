/**
 * Color namespace
 * Mirrors PineScript's color.* functions for color creation and manipulation.
 *
 * @remarks
 * All color functions in this namespace follow PineScript v6 API specifications.
 * Colors are represented as RGB or RGBA strings.
 * Transparency values range from 0 (fully opaque) to 100 (fully transparent).
 *
 * @version 6
 */

import { color, int, float, simple_int, simple_float } from '../types';

/**
 * Creates a color from RGB values with optional transparency.
 *
 * @param red - Red component (0-255, values are clamped)
 * @param green - Green component (0-255, values are clamped)
 * @param blue - Blue component (0-255, values are clamped)
 * @param transp - Optional transparency (0-100). 0 = opaque, 100 = fully transparent
 * @returns Color string in rgb() or rgba() format
 *
 * @remarks
 * - RGB values are automatically clamped to the 0-255 range
 * - Transparency of 0 or omitted results in rgb() format
 * - Transparency > 0 results in rgba() format
 * - Transparency is converted to alpha channel (0-1 range)
 *
 * @example
 * ```typescript
 * color.rgb(255, 0, 0) // Returns: "rgb(255, 0, 0)" - Red
 * color.rgb(0, 255, 0, 50) // Returns: "rgba(0, 255, 0, 0.5)" - Semi-transparent green
 * color.rgb(300, 0, 0) // Returns: "rgb(255, 0, 0)" - Clamped to 255
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_color.rgb | PineScript color.rgb}
 */
export function rgb(red: simple_int, green: simple_int, blue: simple_int, transp?: simple_float): color {
  const r = Math.max(0, Math.min(255, red));
  const g = Math.max(0, Math.min(255, green));
  const b = Math.max(0, Math.min(255, blue));
  const a = transp !== undefined ? 1 - (transp / 100) : 1;

  if (a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Creates a color from a hexadecimal string with optional transparency.
 *
 * @param hex - Hex color string (with or without '#' prefix, e.g., "#FF0000" or "FF0000")
 * @param transp - Optional transparency (0-100). 0 = opaque, 100 = fully transparent
 * @returns Color string in rgb() or rgba() format
 *
 * @remarks
 * - Accepts hex strings with or without '#' prefix
 * - Case-insensitive (accepts both "FF0000" and "ff0000")
 * - Must be 6 characters (excluding '#')
 * - Format: RRGGBB where each component is 00-FF
 *
 * @example
 * ```typescript
 * color.from_hex("#FF0000") // Returns: "rgb(255, 0, 0)" - Red
 * color.from_hex("00FF00", 50) // Returns: "rgba(0, 255, 0, 0.5)" - Semi-transparent green
 * color.from_hex("#0000FF") // Returns: "rgb(0, 0, 255)" - Blue
 * color.from_hex("FFA500") // Returns: "rgb(255, 165, 0)" - Orange
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_color.rgb | PineScript color.rgb}
 */
export function from_hex(hex: string, transp?: simple_float): color {
  // Remove # if present
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return rgb(r, g, b, transp);
}

/**
 * Creates a new color with modified transparency, preserving RGB components.
 *
 * @param baseColor - The base color to modify
 * @param transp - New transparency value (0-100). 0 = opaque, 100 = fully transparent
 * @returns New color with updated transparency
 *
 * @remarks
 * - Preserves the RGB values from the base color
 * - Replaces the transparency with the new value
 * - Useful for creating semi-transparent versions of existing colors
 *
 * @example
 * ```typescript
 * const red = color.rgb(255, 0, 0)
 * color.new_color(red, 50) // Returns: "rgba(255, 0, 0, 0.5)" - Semi-transparent red
 * color.new_color(red, 0) // Returns: "rgb(255, 0, 0)" - Fully opaque
 * color.new_color(red, 100) // Returns: "rgba(255, 0, 0, 0)" - Fully transparent
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_color.new | PineScript color.new}
 */
export function new_color(baseColor: color, transp: simple_float): color {
  // Parse the color and apply transparency
  const rgba = parseColor(baseColor);
  return rgb(rgba.r, rgba.g, rgba.b, transp);
}

/**
 * Extracts the red component from a color.
 *
 * @param clr - The color to extract from
 * @returns Red component value (0-255)
 *
 * @example
 * ```typescript
 * color.r(color.rgb(255, 128, 64)) // Returns: 255
 * color.r(color.from_hex("#FF0000")) // Returns: 255
 * color.r(color.from_hex("#FFA500")) // Returns: 255 (orange)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_color.r | PineScript color.r}
 */
export function r(clr: color): int {
  return parseColor(clr).r;
}

/**
 * Extracts the green component from a color.
 *
 * @param clr - The color to extract from
 * @returns Green component value (0-255)
 *
 * @example
 * ```typescript
 * color.g(color.rgb(255, 128, 64)) // Returns: 128
 * color.g(color.from_hex("#00FF00")) // Returns: 255
 * color.g(color.from_hex("#FFA500")) // Returns: 165 (orange)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_color.g | PineScript color.g}
 */
export function g(clr: color): int {
  return parseColor(clr).g;
}

/**
 * Extracts the blue component from a color.
 *
 * @param clr - The color to extract from
 * @returns Blue component value (0-255)
 *
 * @example
 * ```typescript
 * color.b(color.rgb(255, 128, 64)) // Returns: 64
 * color.b(color.from_hex("#0000FF")) // Returns: 255
 * color.b(color.from_hex("#FFA500")) // Returns: 0 (orange)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_color.b | PineScript color.b}
 */
export function b(clr: color): int {
  return parseColor(clr).b;
}

/**
 * Extracts the transparency component from a color.
 *
 * @param clr - The color to extract from
 * @returns Transparency value (0-100). 0 = fully opaque, 100 = fully transparent
 *
 * @remarks
 * - Returns 0 for colors without transparency (rgb format)
 * - Converts alpha channel (0-1) to transparency (0-100)
 *
 * @example
 * ```typescript
 * color.t(color.rgb(255, 0, 0)) // Returns: 0 (opaque)
 * color.t(color.rgb(255, 0, 0, 50)) // Returns: 50
 * color.t(color.rgb(255, 0, 0, 100)) // Returns: 100 (fully transparent)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_color.t | PineScript color.t}
 */
export function t(clr: color): float {
  return parseColor(clr).t;
}

/**
 * Helper function to parse color string to RGBA components.
 *
 * @internal
 * @param clr - The color string to parse
 * @returns Object containing r, g, b (0-255) and t (0-100) components
 */
function parseColor(clr: color): { r: int; g: int; b: int; t: float } {
  if (typeof clr === 'string') {
    // Handle rgb() or rgba() format
    const match = clr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        t: match[4] ? (1 - parseFloat(match[4])) * 100 : 0,
      };
    }
  }
  return { r: 0, g: 0, b: 0, t: 0 };
}

// Predefined color constants matching PineScript v6
/**
 * Aqua/Cyan color constant
 * @constant {string} #00FFFF - RGB(0, 255, 255)
 */
export const aqua = '#00FFFF';

/**
 * Black color constant
 * @constant {string} #000000 - RGB(0, 0, 0)
 */
export const black = '#000000';

/**
 * Blue color constant
 * @constant {string} #0000FF - RGB(0, 0, 255)
 */
export const blue = '#0000FF';

/**
 * Fuchsia/Magenta color constant
 * @constant {string} #FF00FF - RGB(255, 0, 255)
 */
export const fuchsia = '#FF00FF';

/**
 * Gray color constant
 * @constant {string} #808080 - RGB(128, 128, 128)
 */
export const gray = '#808080';

/**
 * Green color constant (same as lime)
 * @constant {string} #00FF00 - RGB(0, 255, 0)
 */
export const green = '#00FF00';

/**
 * Lime color constant (same as green)
 * @constant {string} #00FF00 - RGB(0, 255, 0)
 */
export const lime = '#00FF00';

/**
 * Maroon color constant
 * @constant {string} #800000 - RGB(128, 0, 0)
 */
export const maroon = '#800000';

/**
 * Navy color constant
 * @constant {string} #000080 - RGB(0, 0, 128)
 */
export const navy = '#000080';

/**
 * Olive color constant
 * @constant {string} #808000 - RGB(128, 128, 0)
 */
export const olive = '#808000';

/**
 * Orange color constant
 * @constant {string} #FFA500 - RGB(255, 165, 0)
 */
export const orange = '#FFA500';

/**
 * Purple color constant
 * @constant {string} #800080 - RGB(128, 0, 128)
 */
export const purple = '#800080';

/**
 * Red color constant
 * @constant {string} #FF0000 - RGB(255, 0, 0)
 */
export const red = '#FF0000';

/**
 * Silver color constant
 * @constant {string} #C0C0C0 - RGB(192, 192, 192)
 */
export const silver = '#C0C0C0';

/**
 * Teal color constant
 * @constant {string} #008080 - RGB(0, 128, 128)
 */
export const teal = '#008080';

/**
 * White color constant
 * @constant {string} #FFFFFF - RGB(255, 255, 255)
 */
export const white = '#FFFFFF';

/**
 * Yellow color constant
 * @constant {string} #FFFF00 - RGB(255, 255, 0)
 */
export const yellow = '#FFFF00';
