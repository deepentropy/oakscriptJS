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
 * Returns the arctangent of y/x in radians.
 *
 * @param y - The y-coordinate
 * @param x - The x-coordinate
 * @returns The angle in radians between the positive x-axis and the point (x, y)
 *
 * @remarks
 * - Returns a value in the range [-π, π]
 * - Correctly handles the signs of both arguments to determine the quadrant
 * - Unlike atan(y/x), atan2 handles the case when x = 0
 *
 * @example
 * ```typescript
 * math.atan2(1, 1) // Returns: π/4 (45 degrees)
 * math.atan2(1, 0) // Returns: π/2 (90 degrees)
 * math.atan2(0, 1) // Returns: 0
 * math.atan2(-1, -1) // Returns: -3π/4 (-135 degrees)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.atan2 | PineScript math.atan2}
 */
export function atan2(y: float, x: float): float {
  return Math.atan2(y, x);
}

/**
 * Returns the factorial of a number.
 *
 * @param num - The number (must be non-negative integer)
 * @returns The factorial of num (num!)
 *
 * @remarks
 * - Returns 1 for n = 0 (0! = 1)
 * - For negative numbers, returns NaN
 * - For non-integers, uses the floor value
 * - Large values may exceed JavaScript's number precision
 *
 * @example
 * ```typescript
 * math.fact(0) // Returns: 1
 * math.fact(5) // Returns: 120 (5! = 5×4×3×2×1)
 * math.fact(10) // Returns: 3628800
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.fact | PineScript math.fact}
 */
export function fact(num: simple_int): float {
  if (num < 0) return NaN;
  if (num === 0 || num === 1) return 1;

  let result = 1;
  for (let i = 2; i <= num; i++) {
    result *= i;
  }
  return result;
}

/**
 * Returns the square root of the sum of squares of its arguments.
 *
 * @param values - Variable number of values
 * @returns The Euclidean norm (square root of sum of squares)
 *
 * @remarks
 * - Calculates: √(x₁² + x₂² + ... + xₙ²)
 * - Useful for calculating distance in n-dimensional space
 * - More accurate than manually calculating sqrt(x² + y²) for very large or small numbers
 *
 * @example
 * ```typescript
 * math.hypot(3, 4) // Returns: 5 (3² + 4² = 25, √25 = 5)
 * math.hypot(1, 1) // Returns: √2 ≈ 1.414
 * math.hypot(3, 4, 12) // Returns: 13 (3² + 4² + 12² = 169)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.hypot | PineScript math.hypot}
 */
export function hypot(...values: float[]): float {
  return Math.hypot(...values);
}

/**
 * Returns the next representable floating-point value after x in the direction of y.
 *
 * @param x - The starting value
 * @param y - The direction (if y > x, returns next larger value; if y < x, returns next smaller value)
 * @returns The next representable floating-point number
 *
 * @remarks
 * - If x = y, returns y
 * - Useful for numerical analysis and precision control
 * - Steps by the smallest possible amount in the given direction
 *
 * @example
 * ```typescript
 * math.nextafter(1, 2) // Returns: 1.0000000000000002 (next larger float)
 * math.nextafter(1, 0) // Returns: 0.9999999999999999 (next smaller float)
 * math.nextafter(1, 1) // Returns: 1 (no change)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.nextafter | PineScript math.nextafter}
 */
export function nextafter(x: float, y: float): float {
  if (x === y) return y;
  if (isNaN(x) || isNaN(y)) return NaN;

  // Handle special cases
  if (x === 0) {
    return y > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE;
  }

  // Determine direction
  const direction = y > x ? 1 : -1;

  // Use a small epsilon relative to the magnitude of x
  const epsilon = Math.abs(x) * Number.EPSILON;
  return x + (direction * epsilon);
}

/**
 * Returns the number of combinations (n choose k).
 *
 * @param n - Total number of items
 * @param k - Number of items to choose
 * @returns The number of ways to choose k items from n items (n! / (k! × (n-k)!))
 *
 * @remarks
 * - Order does not matter in combinations
 * - Returns 0 if k > n or k < 0
 * - C(n, k) = C(n, n-k)
 * - C(n, 0) = C(n, n) = 1
 *
 * @example
 * ```typescript
 * math.combinations(5, 2) // Returns: 10 (5!/(2!×3!) = 10 ways)
 * math.combinations(10, 3) // Returns: 120
 * math.combinations(5, 0) // Returns: 1
 * math.combinations(5, 5) // Returns: 1
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.combinations | PineScript math.combinations}
 */
export function combinations(n: simple_int, k: simple_int): float {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;

  // Use the optimization: C(n,k) = C(n, n-k), choose the smaller
  k = Math.min(k, n - k);

  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i);
    result /= (i + 1);
  }

  return result;
}

/**
 * Returns the number of permutations (n P k).
 *
 * @param n - Total number of items
 * @param k - Number of items to arrange
 * @returns The number of ways to arrange k items from n items (n! / (n-k)!)
 *
 * @remarks
 * - Order matters in permutations
 * - Returns 0 if k > n or k < 0
 * - P(n, k) = n × (n-1) × (n-2) × ... × (n-k+1)
 * - P(n, n) = n!
 * - P(n, 0) = 1
 *
 * @example
 * ```typescript
 * math.permutations(5, 2) // Returns: 20 (5×4 = 20 ways)
 * math.permutations(5, 3) // Returns: 60 (5×4×3 = 60)
 * math.permutations(5, 0) // Returns: 1
 * math.permutations(5, 5) // Returns: 120 (5!)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.permutations | PineScript math.permutations}
 */
export function permutations(n: simple_int, k: simple_int): float {
  if (k < 0 || k > n) return 0;
  if (k === 0) return 1;

  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i);
  }

  return result;
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
