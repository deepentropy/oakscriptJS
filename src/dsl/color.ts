/**
 * @fileoverview Color constants and functions for DSL
 * @module dsl/color
 */

/**
 * Color object with hex representation
 */
export interface Color {
  hex: string;
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Create a color object from hex
 */
function createColor(hex: string): string {
  return hex;
}

/**
 * Pine color constants
 * Exported as simple strings for compatibility with IndicatorController
 */
export const color: {
  readonly red: string;
  readonly green: string;
  readonly blue: string;
  readonly yellow: string;
  readonly orange: string;
  readonly purple: string;
  readonly white: string;
  readonly black: string;
  readonly gray: string;
  readonly grey: string;
  readonly aqua: string;
  readonly lime: string;
  readonly maroon: string;
  readonly navy: string;
  readonly olive: string;
  readonly teal: string;
  readonly fuchsia: string;
  readonly silver: string;
  new(col: string, transp: number): string;
  rgb(r: number, g: number, b: number, transp?: number): string;
  from_hex(hex: string): string;
} = {
  // Basic colors
  red: 'red',
  green: 'green',
  blue: 'blue',
  yellow: 'yellow',
  orange: 'orange',
  purple: 'purple',
  white: 'white',
  black: 'black',
  gray: 'gray',
  grey: 'gray',

  // Extended colors
  aqua: 'aqua',
  lime: 'lime',
  maroon: 'maroon',
  navy: 'navy',
  olive: 'olive',
  teal: 'teal',
  fuchsia: 'fuchsia',
  silver: 'silver',

  /**
   * Create color with transparency
   * @param col - Base color
   * @param transp - Transparency (0-100)
   * @returns Color string
   */
  new(col: string, transp: number): string {
    return col; // TODO: Implement transparency
  },

  /**
   * Create RGB color
   * @param r - Red (0-255)
   * @param g - Green (0-255)
   * @param b - Blue (0-255)
   * @param transp - Transparency (0-100)
   * @returns Hex color string
   */
  rgb(r: number, g: number, b: number, transp?: number): string {
    const hex = '#' +
      Math.floor(r).toString(16).padStart(2, '0') +
      Math.floor(g).toString(16).padStart(2, '0') +
      Math.floor(b).toString(16).padStart(2, '0');
    return hex;
  },

  /**
   * Create color from hex string
   * @param hex - Hex color (e.g., "#FF0000")
   * @returns Color string
   */
  from_hex(hex: string): string {
    return hex;
  },
};

/**
 * Format constants
 */
export const format = {
  price: 'price',
  volume: 'volume',
  percent: 'percent',
};
