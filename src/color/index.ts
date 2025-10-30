/**
 * Color namespace
 * Mirrors PineScript's color.* functions
 */

import { color, int, float, simple_int, simple_float } from '../types';

/**
 * Creates an RGB color
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
 * Creates a color from hex string
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
 * Sets the transparency of a color
 */
export function new_color(baseColor: color, transp: simple_float): color {
  // Parse the color and apply transparency
  const rgba = parseColor(baseColor);
  return rgb(rgba.r, rgba.g, rgba.b, transp);
}

/**
 * Returns red component of color (0-255)
 */
export function r(clr: color): int {
  return parseColor(clr).r;
}

/**
 * Returns green component of color (0-255)
 */
export function g(clr: color): int {
  return parseColor(clr).g;
}

/**
 * Returns blue component of color (0-255)
 */
export function b(clr: color): int {
  return parseColor(clr).b;
}

/**
 * Returns transparency component (0-100)
 */
export function t(clr: color): float {
  return parseColor(clr).t;
}

/**
 * Helper function to parse color string to RGBA
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

// Predefined colors matching PineScript
export const aqua = '#00FFFF';
export const black = '#000000';
export const blue = '#0000FF';
export const fuchsia = '#FF00FF';
export const gray = '#808080';
export const green = '#00FF00';
export const lime = '#00FF00';
export const maroon = '#800000';
export const navy = '#000080';
export const olive = '#808000';
export const orange = '#FFA500';
export const purple = '#800080';
export const red = '#FF0000';
export const silver = '#C0C0C0';
export const teal = '#008080';
export const white = '#FFFFFF';
export const yellow = '#FFFF00';
