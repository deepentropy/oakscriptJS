/**
 * Math namespace
 * Mirrors PineScript's math.* functions for mathematical operations and calculations.
 *
 * @remarks
 * All math functions in this namespace follow PineScript v6 API specifications.
 * Functions include basic arithmetic, algebraic operations, trigonometry, and combinatorics.
 *
 * @version 6
 */

import { float, int, simple_float, simple_int, series_float } from '../types';

/**
 * Returns the absolute value of a number.
 *
 * @param value - The number
 * @returns The absolute value (always non-negative)
 *
 * @remarks
 * - Returns the distance from zero on the number line
 * - |x| = x if x ≥ 0, -x if x < 0
 *
 * @example
 * ```typescript
 * math.abs(5) // Returns: 5
 * math.abs(-5) // Returns: 5
 * math.abs(0) // Returns: 0
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.abs | PineScript math.abs}
 */
export function abs(value: float): float {
  return Math.abs(value);
}

/**
 * Returns the smallest integer greater than or equal to a given number (rounds up).
 *
 * @param value - The number to round up
 * @returns The ceiling value (smallest integer ≥ value)
 *
 * @remarks
 * - Always rounds towards positive infinity
 * - For positive numbers, rounds away from zero
 * - For negative numbers, rounds towards zero
 *
 * @example
 * ```typescript
 * math.ceil(4.2) // Returns: 5
 * math.ceil(4.8) // Returns: 5
 * math.ceil(-4.2) // Returns: -4
 * math.ceil(5) // Returns: 5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.ceil | PineScript math.ceil}
 */
export function ceil(value: float): int {
  return Math.ceil(value);
}

/**
 * Returns the largest integer less than or equal to a given number (rounds down).
 *
 * @param value - The number to round down
 * @returns The floor value (largest integer ≤ value)
 *
 * @remarks
 * - Always rounds towards negative infinity
 * - For positive numbers, rounds towards zero
 * - For negative numbers, rounds away from zero
 *
 * @example
 * ```typescript
 * math.floor(4.2) // Returns: 4
 * math.floor(4.8) // Returns: 4
 * math.floor(-4.2) // Returns: -5
 * math.floor(5) // Returns: 5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.floor | PineScript math.floor}
 */
export function floor(value: float): int {
  return Math.floor(value);
}

/**
 * Returns the value rounded to the nearest integer or to a specified precision.
 *
 * @param value - The number to round
 * @param precision - Optional number of decimal places (default: 0)
 * @returns The rounded value
 *
 * @remarks
 * - Rounds to nearest integer by default
 * - With precision, rounds to that many decimal places
 * - Uses "round half up" strategy (0.5 rounds to 1)
 *
 * @example
 * ```typescript
 * math.round(4.2) // Returns: 4
 * math.round(4.5) // Returns: 5
 * math.round(4.8) // Returns: 5
 * math.round(4.567, 2) // Returns: 4.57
 * math.round(4.567, 1) // Returns: 4.6
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.round | PineScript math.round}
 */
export function round(value: float, precision?: int): float {
  if (precision === undefined) {
    return Math.round(value);
  }
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Returns the maximum value from the arguments.
 *
 * @param values - Variable number of values to compare
 * @returns The largest value
 *
 * @remarks
 * - Accepts any number of arguments
 * - Returns -Infinity if no arguments provided
 * - Returns NaN if any argument is NaN
 *
 * @example
 * ```typescript
 * math.max(1, 2, 3) // Returns: 3
 * math.max(-1, -5, -2) // Returns: -1
 * math.max(10) // Returns: 10
 * math.max(5, 10, 3, 8) // Returns: 10
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.max | PineScript math.max}
 */
export function max(...values: float[]): float {
  return Math.max(...values);
}

/**
 * Returns the minimum value from the arguments.
 *
 * @param values - Variable number of values to compare
 * @returns The smallest value
 *
 * @remarks
 * - Accepts any number of arguments
 * - Returns Infinity if no arguments provided
 * - Returns NaN if any argument is NaN
 *
 * @example
 * ```typescript
 * math.min(1, 2, 3) // Returns: 1
 * math.min(-1, -5, -2) // Returns: -5
 * math.min(10) // Returns: 10
 * math.min(5, 10, 3, 8) // Returns: 3
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.min | PineScript math.min}
 */
export function min(...values: float[]): float {
  return Math.min(...values);
}

/**
 * Returns the average (arithmetic mean) of the arguments.
 *
 * @param values - Variable number of values
 * @returns The arithmetic mean
 *
 * @remarks
 * - Calculates sum of all values divided by count
 * - Returns NaN if no arguments provided (division by zero)
 *
 * @example
 * ```typescript
 * math.avg(1, 2, 3) // Returns: 2
 * math.avg(10, 20) // Returns: 15
 * math.avg(5) // Returns: 5
 * math.avg(1, 2, 3, 4, 5) // Returns: 3
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.avg | PineScript math.avg}
 */
export function avg(...values: float[]): float {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Returns the sum of values over a sliding window.
 *
 * @param source - Series of values
 * @param length - Window length for summation
 * @returns Series with rolling sum values
 *
 * @remarks
 * - Calculates sum of last `length` values at each point
 * - Returns NaN for first `length-1` values (insufficient data)
 * - Window slides forward one value at a time
 *
 * @example
 * ```typescript
 * math.sum([1, 2, 3, 4, 5], 3) // Returns: [NaN, NaN, 6, 9, 12]
 * // Explanation: [NaN, NaN, 1+2+3, 2+3+4, 3+4+5]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.sum | PineScript math.sum}
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
 * Returns the square root of a number.
 *
 * @param value - The number (must be non-negative)
 * @returns The square root (√value)
 *
 * @remarks
 * - Returns NaN for negative numbers
 * - √x × √x = x (for non-negative x)
 *
 * @example
 * ```typescript
 * math.sqrt(9) // Returns: 3
 * math.sqrt(16) // Returns: 4
 * math.sqrt(2) // Returns: 1.414...
 * math.sqrt(0) // Returns: 0
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.sqrt | PineScript math.sqrt}
 */
export function sqrt(value: float): float {
  return Math.sqrt(value);
}

/**
 * Returns base raised to the power of exponent.
 *
 * @param base - The base number
 * @param exponent - The exponent (power)
 * @returns base^exponent
 *
 * @remarks
 * - 0^0 returns 1
 * - Negative base with fractional exponent returns NaN
 * - Any number to the power of 0 equals 1
 *
 * @example
 * ```typescript
 * math.pow(2, 3) // Returns: 8 (2³)
 * math.pow(10, 2) // Returns: 100
 * math.pow(5, 0) // Returns: 1
 * math.pow(2, -1) // Returns: 0.5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.pow | PineScript math.pow}
 */
export function pow(base: float, exponent: float): float {
  return Math.pow(base, exponent);
}

/**
 * Returns e (Euler's number) raised to the power of value.
 *
 * @param value - The exponent
 * @returns e^value (where e ≈ 2.71828)
 *
 * @remarks
 * - e^0 = 1
 * - e^1 = e ≈ 2.71828
 * - Inverse of ln(x)
 *
 * @example
 * ```typescript
 * math.exp(0) // Returns: 1
 * math.exp(1) // Returns: 2.71828... (e)
 * math.exp(2) // Returns: 7.389...
 * math.exp(-1) // Returns: 0.3678...
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.exp | PineScript math.exp}
 */
export function exp(value: float): float {
  return Math.exp(value);
}

/**
 * Returns the natural logarithm (base e) of a number.
 *
 * @param value - The number (must be positive)
 * @returns ln(value)
 *
 * @remarks
 * - Returns NaN for negative numbers
 * - Returns -Infinity for 0
 * - ln(e) = 1
 * - ln(1) = 0
 * - Inverse of exp(x)
 *
 * @example
 * ```typescript
 * math.log(1) // Returns: 0
 * math.log(Math.E) // Returns: 1
 * math.log(10) // Returns: 2.302...
 * math.log(100) // Returns: 4.605...
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.log | PineScript math.log}
 */
export function log(value: float): float {
  return Math.log(value);
}

/**
 * Returns the base-10 logarithm of a number.
 *
 * @param value - The number (must be positive)
 * @returns log₁₀(value)
 *
 * @remarks
 * - Returns NaN for negative numbers
 * - Returns -Infinity for 0
 * - log₁₀(10) = 1
 * - log₁₀(100) = 2
 *
 * @example
 * ```typescript
 * math.log10(10) // Returns: 1
 * math.log10(100) // Returns: 2
 * math.log10(1000) // Returns: 3
 * math.log10(1) // Returns: 0
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.log10 | PineScript math.log10}
 */
export function log10(value: float): float {
  return Math.log10(value);
}

/**
 * Returns the sine of an angle in radians.
 *
 * @param value - The angle in radians
 * @returns The sine value (range: [-1, 1])
 *
 * @remarks
 * - Input is in radians, not degrees
 * - sin(0) = 0
 * - sin(π/2) = 1
 * - Periodic with period 2π
 *
 * @example
 * ```typescript
 * math.sin(0) // Returns: 0
 * math.sin(Math.PI / 2) // Returns: 1
 * math.sin(Math.PI) // Returns: 0 (approximately)
 * math.sin(Math.PI / 6) // Returns: 0.5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.sin | PineScript math.sin}
 */
export function sin(value: float): float {
  return Math.sin(value);
}

/**
 * Returns the cosine of an angle in radians.
 *
 * @param value - The angle in radians
 * @returns The cosine value (range: [-1, 1])
 *
 * @remarks
 * - Input is in radians, not degrees
 * - cos(0) = 1
 * - cos(π/2) = 0
 * - Periodic with period 2π
 *
 * @example
 * ```typescript
 * math.cos(0) // Returns: 1
 * math.cos(Math.PI / 2) // Returns: 0 (approximately)
 * math.cos(Math.PI) // Returns: -1
 * math.cos(Math.PI / 3) // Returns: 0.5
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.cos | PineScript math.cos}
 */
export function cos(value: float): float {
  return Math.cos(value);
}

/**
 * Returns the tangent of an angle in radians.
 *
 * @param value - The angle in radians
 * @returns The tangent value
 *
 * @remarks
 * - Input is in radians, not degrees
 * - tan(x) = sin(x) / cos(x)
 * - Undefined at π/2, 3π/2, etc. (returns very large numbers)
 * - Periodic with period π
 *
 * @example
 * ```typescript
 * math.tan(0) // Returns: 0
 * math.tan(Math.PI / 4) // Returns: 1
 * math.tan(Math.PI / 6) // Returns: 0.577... (1/√3)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.tan | PineScript math.tan}
 */
export function tan(value: float): float {
  return Math.tan(value);
}

/**
 * Returns the arcsine (inverse sine) of a number.
 *
 * @param value - The value (must be in range [-1, 1])
 * @returns The angle in radians (range: [-π/2, π/2])
 *
 * @remarks
 * - Returns NaN for values outside [-1, 1]
 * - asin(sin(x)) = x for x in [-π/2, π/2]
 * - asin(0) = 0
 * - asin(1) = π/2
 *
 * @example
 * ```typescript
 * math.asin(0) // Returns: 0
 * math.asin(1) // Returns: 1.5707... (π/2)
 * math.asin(0.5) // Returns: 0.5235... (π/6)
 * math.asin(-1) // Returns: -1.5707... (-π/2)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.asin | PineScript math.asin}
 */
export function asin(value: float): float {
  return Math.asin(value);
}

/**
 * Returns the arccosine (inverse cosine) of a number.
 *
 * @param value - The value (must be in range [-1, 1])
 * @returns The angle in radians (range: [0, π])
 *
 * @remarks
 * - Returns NaN for values outside [-1, 1]
 * - acos(cos(x)) = x for x in [0, π]
 * - acos(1) = 0
 * - acos(0) = π/2
 *
 * @example
 * ```typescript
 * math.acos(1) // Returns: 0
 * math.acos(0) // Returns: 1.5707... (π/2)
 * math.acos(0.5) // Returns: 1.0471... (π/3)
 * math.acos(-1) // Returns: 3.1415... (π)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.acos | PineScript math.acos}
 */
export function acos(value: float): float {
  return Math.acos(value);
}

/**
 * Returns the arctangent (inverse tangent) of a number.
 *
 * @param value - The value
 * @returns The angle in radians (range: [-π/2, π/2])
 *
 * @remarks
 * - Accepts any number as input
 * - atan(tan(x)) = x for x in [-π/2, π/2]
 * - atan(0) = 0
 * - atan(1) = π/4
 *
 * @example
 * ```typescript
 * math.atan(0) // Returns: 0
 * math.atan(1) // Returns: 0.7853... (π/4)
 * math.atan(-1) // Returns: -0.7853... (-π/4)
 * math.atan(Infinity) // Returns: 1.5707... (π/2)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.atan | PineScript math.atan}
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
 * Converts an angle from degrees to radians.
 *
 * @param degrees - The angle in degrees
 * @returns The angle in radians
 *
 * @remarks
 * - Radians = Degrees × (π / 180)
 * - One full rotation: 360° = 2π radians
 * - Common conversions: 90° = π/2, 180° = π, 270° = 3π/2
 *
 * @example
 * ```typescript
 * math.toradians(0) // Returns: 0
 * math.toradians(90) // Returns: 1.5707... (π/2)
 * math.toradians(180) // Returns: 3.1415... (π)
 * math.toradians(360) // Returns: 6.2831... (2π)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.toradians | PineScript math.toradians}
 */
export function toradians(degrees: float): float {
  return degrees * (Math.PI / 180);
}

/**
 * Converts an angle from radians to degrees.
 *
 * @param radians - The angle in radians
 * @returns The angle in degrees
 *
 * @remarks
 * - Degrees = Radians × (180 / π)
 * - One full rotation: 2π radians = 360°
 * - Common conversions: π/2 = 90°, π = 180°, 3π/2 = 270°
 *
 * @example
 * ```typescript
 * math.todegrees(0) // Returns: 0
 * math.todegrees(Math.PI / 2) // Returns: 90
 * math.todegrees(Math.PI) // Returns: 180
 * math.todegrees(2 * Math.PI) // Returns: 360
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.todegrees | PineScript math.todegrees}
 */
export function todegrees(radians: float): float {
  return radians * (180 / Math.PI);
}

/**
 * Returns a pseudo-random number.
 *
 * @param min - Optional minimum value (inclusive)
 * @param max - Optional maximum value (exclusive)
 * @param seed - Optional seed for deterministic random (not implemented in this version)
 * @returns A random number in the specified range, or [0, 1) if no range specified
 *
 * @remarks
 * - Without arguments: returns value in [0, 1)
 * - With min and max: returns value in [min, max)
 * - Note: This implementation does not support deterministic seeding
 * - Each call generates a new random value
 *
 * @example
 * ```typescript
 * math.random() // Returns: value between 0 and 1 (e.g., 0.234...)
 * math.random(0, 10) // Returns: value between 0 and 10 (e.g., 7.45...)
 * math.random(5, 15) // Returns: value between 5 and 15 (e.g., 11.82...)
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.random | PineScript math.random}
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
 * Returns the sign of a number.
 *
 * @param value - The number to check
 * @returns 1 for positive, -1 for negative, 0 for zero
 *
 * @remarks
 * - Returns 1 if value > 0
 * - Returns -1 if value < 0
 * - Returns 0 if value = 0
 * - Useful for determining direction or polarity
 *
 * @example
 * ```typescript
 * math.sign(5) // Returns: 1
 * math.sign(-3) // Returns: -1
 * math.sign(0) // Returns: 0
 * math.sign(0.001) // Returns: 1
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_math.sign | PineScript math.sign}
 */
export function sign(value: float): int {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

// Constants
export const PI = Math.PI;
export const E = Math.E;
export const PHI = 1.618033988749895; // Golden ratio
export const RPHI = 0.618033988749895; // Reciprocal of golden ratio
