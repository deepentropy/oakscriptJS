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

import type { color, int, float, simple_int, simple_float } from '../types/index.js';
import { alphaByte, parseColor } from './parse.js';

/** Channel of color.rgb: na is 0, a fraction is truncated. */
const channel = (v: number): int =>
  v === null || v === undefined || Number.isNaN(v) ? 0 : Math.max(0, Math.min(255, Math.trunc(v)));

/**
 * Alpha (0-1) of a transparency given to color.rgb / color.new: na is fully transparent, clamped to 0..100.
 * `1 - t / 100` as in PineScript: `color.new(c, 90)` has the alpha byte 25 (0.09999999999999998 * 255 rounded).
 */
const alphaOf = (transp: number): float =>
  transp === null || Number.isNaN(transp) ? 0 : 1 - Math.max(0, Math.min(100, transp)) / 100;

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
 * PineScript rules:
 * - an `na` channel is 0; a fractional channel is truncated (127.6 is 127)
 * - the transparency is clamped to 0..100 (140 is fully transparent, -5 is opaque); an `na` transparency is fully
 *   transparent
 *
 * @example
 * ```typescript
 * color.rgb(255, 0, 0) // Returns: "rgb(255, 0, 0)" - Red
 * color.rgb(0, 255, 0, 50) // Returns: "rgba(0, 255, 0, 0.5)" - Semi-transparent green
 * color.rgb(300, 0, 0) // Returns: "rgb(255, 0, 0)" - Clamped to 255
 * ```
 */
export function rgb(red: simple_int, green: simple_int, blue: simple_int, transp?: simple_float): string {
  const r = channel(red);
  const g = channel(green);
  const b = channel(blue);
  const a = transp !== undefined ? alphaOf(transp) : 1;

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
 */
export function from_hex(hex: string, transp?: simple_float): string {
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
 * - PineScript clamps the transparency to 0..100 (`color.new(c, 140)` is fully transparent, `color.new(c, -5)` is
 *   opaque); an `na` transparency is fully transparent
 *
 * @example
 * ```typescript
 * const red = color.rgb(255, 0, 0)
 * color.new_color(red, 50) // Returns: "rgba(255, 0, 0, 0.5)" - Semi-transparent red
 * color.new_color(red, 0) // Returns: "rgb(255, 0, 0)" - Fully opaque
 * color.new_color(red, 100) // Returns: "rgba(255, 0, 0, 0)" - Fully transparent
 * ```
 */
export function new_color(baseColor: color, transp: simple_float): string {
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
 * - PineScript stores the alpha as a byte (0-255) and returns an integer transparency:
 *   `color.t(color.new(c, 33.3))` is 33
 *
 * @example
 * ```typescript
 * color.t(color.rgb(255, 0, 0)) // Returns: 0 (opaque)
 * color.t(color.rgb(255, 0, 0, 50)) // Returns: 50
 * color.t(color.rgb(255, 0, 0, 100)) // Returns: 100 (fully transparent)
 * ```
 */
export function t(clr: color): float {
  return Math.round((1 - alphaByte(parseColor(clr).a) / 255) * 100);
}

// Predefined color constants of PineScript v6.
// PineScript v5 differs for red (#FF5252), teal (#00897B) and yellow (#FFEB3B).
/**
 * Aqua/Cyan color constant
 * @constant {string} #00BCD4 - RGB(0, 188, 212)
 */
export const aqua = '#00BCD4';

/**
 * Black color constant
 * @constant {string} #363A45 - RGB(54, 58, 69)
 */
export const black = '#363A45';

/**
 * Blue color constant
 * @constant {string} #2962FF - RGB(41, 98, 255)
 */
export const blue = '#2962FF';

/**
 * Fuchsia/Magenta color constant
 * @constant {string} #E040FB - RGB(224, 64, 251)
 */
export const fuchsia = '#E040FB';

/**
 * Gray color constant
 * @constant {string} #787B86 - RGB(120, 123, 134)
 */
export const gray = '#787B86';

/**
 * Green color constant (same as lime)
 * @constant {string} #4CAF50 - RGB(76, 175, 80)
 */
export const green = '#4CAF50';

/**
 * Lime color constant (same as green)
 * @constant {string} #00E676 - RGB(0, 230, 118)
 */
export const lime = '#00E676';

/**
 * Maroon color constant
 * @constant {string} #880E4F - RGB(136, 14, 79)
 */
export const maroon = '#880E4F';

/**
 * Navy color constant
 * @constant {string} #311B92 - RGB(49, 27, 146)
 */
export const navy = '#311B92';

/**
 * Olive color constant
 * @constant {string} #808000 - RGB(128, 128, 0)
 */
export const olive = '#808000';

/**
 * Orange color constant
 * @constant {string} #FF9800 - RGB(255, 152, 0)
 */
export const orange = '#FF9800';

/**
 * Purple color constant
 * @constant {string} #9C27B0 - RGB(156, 39, 176)
 */
export const purple = '#9C27B0';

/**
 * Red color constant
 * @constant {string} #F23645 - RGB(242, 54, 69)
 */
export const red = '#F23645';

/**
 * Silver color constant
 * @constant {string} #B2B5BE - RGB(178, 181, 190)
 */
export const silver = '#B2B5BE';

/**
 * Teal color constant
 * @constant {string} #089981 - RGB(8, 153, 129)
 */
export const teal = '#089981';

/**
 * White color constant
 * @constant {string} #FFFFFF - RGB(255, 255, 255)
 */
export const white = '#FFFFFF';

/**
 * Yellow color constant
 * @constant {string} #FDD835 - RGB(253, 216, 53)
 */
export const yellow = '#FDD835';

/**
 * Creates a color from a gradient based on value position.
 *
 * @param value - Value to calculate position-dependent color
 * @param bottom_value - Bottom position value corresponding to bottom_color
 * @param top_value - Top position value corresponding to top_color
 * @param bottom_color - Bottom position color
 * @param top_color - Top position color
 * @returns Color calculated from linear gradient
 *
 * @remarks
 * PineScript rules:
 * - If value <= bottom_value, returns bottom_color; else if value >= top_value, returns top_color
 * - An inverted range (bottom_value > top_value) returns bottom_color, wherever the value is
 * - Otherwise the colours are mixed with their transparency (premultiplied alpha, alpha as a byte); the RGB channels
 *   and the alpha are truncated. PineScript's float rounding order is not known: a channel can differ by 1 when the
 *   exact result is an integer (same RGB at both ends)
 * - An na value or bottom_value / top_value, or bottom_value == top_value, gives a fully transparent colour
 * - An na colour counts as fully transparent
 * - Works with rgb(), rgba() and hex (#RRGGBB, #RRGGBBAA) colours
 *
 * @example
 * ```typescript
 * // Value at middle of range gets middle color
 * const midColor = color.from_gradient(50, 0, 100,
 *   color.rgb(255, 0, 0),    // Red at bottom
 *   color.rgb(0, 255, 0)      // Green at top
 * ); // Returns color between red and green
 *
 * // Value at extremes
 * const lowColor = color.from_gradient(-10, 0, 100, red, green); // Returns red
 * const highColor = color.from_gradient(150, 0, 100, red, green); // Returns green
 * ```
 */
export function from_gradient(
  value: float,
  bottom_value: float,
  top_value: float,
  bottom_color: color,
  top_color: color
): string {
  const transparent = 'rgba(0, 0, 0, 0)';
  if ([value, bottom_value, top_value].some((v) => v === null || v === undefined || Number.isNaN(v)) || bottom_value === top_value) {
    return transparent;
  }
  const k =
    value <= bottom_value || bottom_value > top_value
      ? 0
      : value >= top_value
        ? 1
        : (value - bottom_value) / (top_value - bottom_value);
  // alpha as a byte (0-255), as PineScript stores it; an na colour (null / undefined) is fully transparent
  const rgba = (c: color) => {
    if (c === null || c === undefined) return { r: 0, g: 0, b: 0, a: 0 };
    const p = parseColor(c);
    return { r: p.r, g: p.g, b: p.b, a: alphaByte(p.a) };
  };
  const c1 = rgba(bottom_color);
  const c2 = rgba(top_color);
  const a = c1.a * (1 - k) + c2.a * k;
  if (a === 0) return transparent;
  // at an end (k = 0 or 1), PineScript gives floor(x * a / a) with the alpha as byte / 255 (measured bit for bit, #146):
  // the end colour, or one unit less for some channel / alpha pairs
  const end = k === 0 ? c1 : k === 1 ? c2 : null;
  const endAlpha = end ? end.a / 255 : 0;
  // inside the range: the operation order with the fewest differences to PineScript (channels as 0-1, alpha as a byte)
  const mix = (x1: number, x2: number) =>
    end
      ? Math.floor(((k === 0 ? x1 : x2) * endAlpha) / endAlpha)
      : Math.floor((((x1 / 255) * c1.a) * (1 - k) + ((x2 / 255) * c2.a) * k) / (a / 255));
  const [r, g, b] = [mix(c1.r, c2.r), mix(c1.g, c2.g), mix(c1.b, c2.b)];
  const alpha = Math.floor(a);
  return alpha === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha / 255})`;
}

/**
 * Alias for new_color function.
 * Creates a new color with specified transparency from an existing color.
 *
 * @param baseColor - The base color
 * @param transp - Transparency value (0-100). 0 = fully opaque, 100 = fully transparent
 * @returns New color with applied transparency
 *
 * @remarks
 * This is an alias for `new_color()` to match PineScript's `color.new()` syntax.
 *
 * @example
 * ```typescript
 * const redColor = color.rgb(255, 0, 0);
 * const transparentRed = color.new(redColor, 50); // 50% transparent red
 * ```
 */
export { new_color as new };
