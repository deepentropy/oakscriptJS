/**
 * Math namespace
 * Mirrors PineScript's math.* functions
 */

import { float, int, simple_float, simple_int, series_float } from '../types';

/**
 * Absolute value
 */
export function abs(value: float): float {
  return Math.abs(value);
}

/**
 * Returns the smallest integer greater than or equal to a given number
 */
export function ceil(value: float): int {
  return Math.ceil(value);
}

/**
 * Returns the largest integer less than or equal to a given number
 */
export function floor(value: float): int {
  return Math.floor(value);
}

/**
 * Returns the value rounded to the nearest integer
 */
export function round(value: float, precision?: int): float {
  if (precision === undefined) {
    return Math.round(value);
  }
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Returns the maximum of multiple values
 */
export function max(...values: float[]): float {
  return Math.max(...values);
}

/**
 * Returns the minimum of multiple values
 */
export function min(...values: float[]): float {
  return Math.min(...values);
}

/**
 * Returns the average of values
 */
export function avg(...values: float[]): float {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Sum of all values
 */
export function sum(source: series_float, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let total = 0;
      for (let j = 0; j < length; j++) {
        total += source[i - j];
      }
      result.push(total);
    }
  }

  return result;
}

/**
 * Returns the square root
 */
export function sqrt(value: float): float {
  return Math.sqrt(value);
}

/**
 * Returns base raised to the power of exponent
 */
export function pow(base: float, exponent: float): float {
  return Math.pow(base, exponent);
}

/**
 * Returns e raised to the power of value
 */
export function exp(value: float): float {
  return Math.exp(value);
}

/**
 * Returns the natural logarithm
 */
export function log(value: float): float {
  return Math.log(value);
}

/**
 * Returns the base 10 logarithm
 */
export function log10(value: float): float {
  return Math.log10(value);
}

/**
 * Returns the sine
 */
export function sin(value: float): float {
  return Math.sin(value);
}

/**
 * Returns the cosine
 */
export function cos(value: float): float {
  return Math.cos(value);
}

/**
 * Returns the tangent
 */
export function tan(value: float): float {
  return Math.tan(value);
}

/**
 * Returns the arcsine
 */
export function asin(value: float): float {
  return Math.asin(value);
}

/**
 * Returns the arccosine
 */
export function acos(value: float): float {
  return Math.acos(value);
}

/**
 * Returns the arctangent
 */
export function atan(value: float): float {
  return Math.atan(value);
}

/**
 * Converts degrees to radians
 */
export function toradians(degrees: float): float {
  return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees
 */
export function todegrees(radians: float): float {
  return radians * (180 / Math.PI);
}

/**
 * Returns a random number
 */
export function random(min?: float, max?: float, seed?: int): float {
  // Note: Pine's random has deterministic seed support
  // This is a simplified version
  const rand = Math.random();
  if (min !== undefined && max !== undefined) {
    return min + rand * (max - min);
  }
  return rand;
}

/**
 * Returns the sign of the argument
 */
export function sign(value: float): int {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

// Constants
export const PI = Math.PI;
export const E = Math.E;
export const PHI = 1.618033988749895; // Golden ratio
export const RPHI = 0.618033988749895; // Reciprocal of golden ratio
