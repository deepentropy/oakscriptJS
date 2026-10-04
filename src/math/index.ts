/**
 * Math namespace
 * Mirrors PineScript's math.* functions for mathematical operations and calculations.
 *
 * @remarks
 * All math functions in this namespace follow PineScript v6 API specifications.
 * Functions include basic arithmetic, algebraic operations, trigonometry, and combinatorics.
 *
 * Known difference: `log10`, `exp`, `log`, `pow`, `sin`, `cos`, `tan` use JavaScript's `Math`. PineScript uses
 * other algorithms, whose results differ by 1 or 2 units in the last place on part of the inputs (`log10` about 4 %,
 * `exp` about 9 %, `sin` / `cos` / `tan` about 3 %, `log` 0.4 %, `pow` 0.05 % of random inputs). A constant argument
 * (`math.log10(2)`) can differ by up to 3 units in the last place. This is visible only when a script amplifies
 * these tiny differences (e.g. `ma > ma[1]` on values of 1e195); `sqrt`, `atan`, `asin`, `acos` are equal.
 *
 * @version 6
 */

import type { float, int, simple_int, series_float } from '../types/index.js';
import { Series } from '../runtime/series.js';
import { runningSum, runningSumSeries } from '../ta/running-sum.js';

/**
 * Returns the absolute value of a number.
 *
 * @param value - The number or Series
 * @returns The absolute value (always non-negative)
 *
 * @remarks
 * - Returns the distance from zero on the number line
 * - |x| = x if x ≥ 0, -x if x < 0
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.abs(5) // Returns: 5
 * math.abs(-5) // Returns: 5
 * math.abs(0) // Returns: 0
 * ```
 */
export function abs(value: Series): Series;
export function abs(value: float): float;
export function abs(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.abs(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.abs(value);
}

/**
 * Returns the smallest integer greater than or equal to a given number (rounds up).
 *
 * @param value - The number to round up or Series
 * @returns The ceiling value (smallest integer ≥ value)
 *
 * @remarks
 * - Always rounds towards positive infinity
 * - For positive numbers, rounds away from zero
 * - For negative numbers, rounds towards zero
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.ceil(4.2) // Returns: 5
 * math.ceil(4.8) // Returns: 5
 * math.ceil(-4.2) // Returns: -4
 * math.ceil(5) // Returns: 5
 * ```
 */
export function ceil(value: Series): Series;
export function ceil(value: float): int;
export function ceil(value: float | Series): int | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.ceil(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.ceil(value);
}

/**
 * Returns the largest integer less than or equal to a given number (rounds down).
 *
 * @param value - The number to round down or Series
 * @returns The floor value (largest integer ≤ value)
 *
 * @remarks
 * - Always rounds towards negative infinity
 * - For positive numbers, rounds towards zero
 * - For negative numbers, rounds away from zero
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.floor(4.2) // Returns: 4
 * math.floor(4.8) // Returns: 4
 * math.floor(-4.2) // Returns: -5
 * math.floor(5) // Returns: 5
 * ```
 */
export function floor(value: Series): Series;
export function floor(value: float): int;
export function floor(value: float | Series): int | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.floor(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.floor(value);
}

/**
 * Returns the value rounded to the nearest integer or to a specified precision.
 *
 * @param value - The number to round or Series
 * @param precision - Optional number of decimal places (default: 0)
 * @returns The rounded value
 *
 * @remarks
 * - Rounds to nearest integer by default
 * - With precision, rounds to that many decimal places
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * PineScript rules:
 * - ties go away from zero (2.5 -> 3, -2.5 -> -3, -0.5 -> -1)
 * - without a precision, or with a precision <= 0, the result is the integer rounding (1234.5678 @ -2 -> 1235)
 * - a positive precision rounds only the fraction: `int + round(frac * scale) / scale` with
 *   `scale = 1 / 10^-precision` (precision above 16 acts as 16); the tie is decided on the exact value of
 *   `frac * scale` with a 1e-10 tolerance (1.005 @ 2 -> 1.01, 0.285 @ 2 -> 0.29, -1.45 @ 1 -> -1.5)
 * - an infinite value gives na
 *
 * @example
 * ```typescript
 * math.round(4.2) // Returns: 4
 * math.round(4.5) // Returns: 5
 * math.round(-2.5) // Returns: -3
 * math.round(4.567, 2) // Returns: 4.57
 * math.round(1.005, 2) // Returns: 1.01
 * ```
 */
export function round(value: Series, precision?: int): Series;
export function round(value: float, precision?: int): float;
export function round(value: float | Series, precision?: int): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const result: number[] = [];
    for (let i = 0; i < bars.length; i++) {
      result.push(roundValue(valueArray[i] ?? NaN, precision));
    }
    return Series.fromArray(bars, result);
  }
  return roundValue(value, precision);
}

/** `0.5 - 1e-10` as the exact fraction TIE_HALF / TIE_SCALE: the tie threshold of round / round_to_mintick. */
const TIE_SCALE = 10n ** 10n;
const TIE_HALF = 5n * 10n ** 9n - 1n;
/** From 2^52 up every double is an integer. */
const INT_LIMIT = 2 ** 52;

/** Exact value of a finite double >= 0 as `[numerator, denominator]`. */
function exactRatio(x: number): [bigint, bigint] {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const hi = view.getUint32(0);
  const lo = view.getUint32(4);
  const expField = (hi >>> 20) & 0x7ff;
  let mantissa = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let exp = -1074;
  if (expField !== 0) {
    mantissa |= 1n << 52n;
    exp = expField - 1075;
  }
  return exp >= 0 ? [mantissa << BigInt(exp), 1n] : [mantissa, 1n << BigInt(-exp)];
}

/** True when `num / den - units` (exact) is >= 0.5 - 1e-10. */
function reachesTie(num: bigint, den: bigint, units: bigint): boolean {
  return (num - units * den) * TIE_SCALE >= TIE_HALF * den;
}

/** `10^-p`: the exact literal for an integer p (correctly rounded), Math.pow otherwise. */
function tenToMinus(p: number): number {
  return Number.isInteger(p) ? Number(`1e-${p}`) : Math.pow(10, -p);
}

/** PineScript math.round of one value (see `round`). */
function roundValue(value: number, precision?: number): number {
  if (!Number.isFinite(value)) return NaN;
  const negative = value < 0;
  const magnitude = negative ? -value : value;
  if (precision === undefined || Number.isNaN(precision) || precision <= 0) {
    if (magnitude >= INT_LIMIT) return value;
    let units = Math.floor(magnitude);
    if (magnitude - units >= 0.5) units++;
    return negative ? 0 - units : units;
  }
  const scale = 1 / tenToMinus(Math.min(precision, 16));
  const fraction = magnitude % 1;
  const scaled = fraction * scale;
  let units = Math.floor(scaled);
  const offset = scaled - units - 0.5;
  // Only a near-tie needs the exact product; the window covers the double's own error.
  const slack = 1e-9 + scaled * 1.8e-15;
  if (-slack < offset && offset < slack) {
    const [fn, fd] = exactRatio(fraction);
    const [sn, sd] = exactRatio(scale);
    if (reachesTie(fn * sn, fd * sd, BigInt(units))) units++;
  } else if (offset > 0) {
    units++;
  }
  const result = magnitude - fraction + units / scale;
  return negative ? 0 - result : result;
}

/**
 * Returns the maximum value from the arguments.
 *
 * @param values - Variable number of values to compare (numbers or Series)
 * @returns The largest value
 *
 * @remarks
 * - Accepts any number of arguments
 * - Returns -Infinity if no arguments provided
 * - Returns NaN if any argument is NaN
 * - If any argument is a Series, returns a Series; otherwise returns a number
 *
 * @example
 * ```typescript
 * math.max(1, 2, 3) // Returns: 3
 * math.max(-1, -5, -2) // Returns: -1
 * math.max(10) // Returns: 10
 * math.max(5, 10, 3, 8) // Returns: 10
 * ```
 */
export function max(...values: (float | Series)[]): float | Series {
  // Check if any value is a Series
  const hasSeries = values.some(v => v instanceof Series);
  
  if (!hasSeries) {
    // All scalars - use native Math.max
    return Math.max(...(values as number[]));
  }
  
  // At least one Series - return a Series
  const firstSeries = values.find(v => v instanceof Series) as Series;
  const bars = firstSeries.bars;
  const length = bars.length;
  
  // Convert all values to arrays (scalars become constant arrays)
  const valueArrays = values.map(v => 
    v instanceof Series ? v.toArray() : null
  );
  
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    const nums = values.map((v, idx) => 
      valueArrays[idx] ? valueArrays[idx]![i] ?? NaN : (v as number)
    );
    result.push(Math.max(...nums));
  }
  
  return Series.fromArray(bars, result);
}

/**
 * Returns the minimum value from the arguments.
 *
 * @param values - Variable number of values to compare (numbers or Series)
 * @returns The smallest value
 *
 * @remarks
 * - Accepts any number of arguments
 * - Returns Infinity if no arguments provided
 * - Returns NaN if any argument is NaN
 * - If any argument is a Series, returns a Series; otherwise returns a number
 *
 * @example
 * ```typescript
 * math.min(1, 2, 3) // Returns: 1
 * math.min(-1, -5, -2) // Returns: -5
 * math.min(10) // Returns: 10
 * math.min(5, 10, 3, 8) // Returns: 3
 * ```
 */
export function min(...values: (float | Series)[]): float | Series {
  // Check if any value is a Series
  const hasSeries = values.some(v => v instanceof Series);
  
  if (!hasSeries) {
    // All scalars - use native Math.min
    return Math.min(...(values as number[]));
  }
  
  // At least one Series - return a Series
  const firstSeries = values.find(v => v instanceof Series) as Series;
  const bars = firstSeries.bars;
  const length = bars.length;
  
  // Convert all values to arrays (scalars become constant arrays)
  const valueArrays = values.map(v => 
    v instanceof Series ? v.toArray() : null
  );
  
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    const nums = values.map((v, idx) => 
      valueArrays[idx] ? valueArrays[idx]![i] ?? NaN : (v as number)
    );
    result.push(Math.min(...nums));
  }
  
  return Series.fromArray(bars, result);
}

/**
 * Returns the average (arithmetic mean) of the arguments.
 *
 * @param values - Variable number of values (numbers or Series)
 * @returns The arithmetic mean
 *
 * @remarks
 * - Calculates sum of all values divided by count
 * - Returns NaN if no arguments provided (division by zero)
 * - If any argument is a Series, returns a Series; otherwise returns a number
 * - PineScript rule: with 1 or 2 values the sum is plain; with 3 values or more it is a Kahan compensated sum whose
 *   pending correction is subtracted before the division (math.avg(0.1, 0.2, 0.3) = 0.19999999999999998)
 *
 * @example
 * ```typescript
 * math.avg(1, 2, 3) // Returns: 2
 * math.avg(10, 20) // Returns: 15
 * math.avg(5) // Returns: 5
 * math.avg(1, 2, 3, 4, 5) // Returns: 3
 * ```
 */
export function avg(...values: (float | Series)[]): float | Series {
  // Check if any value is a Series
  const hasSeries = values.some(v => v instanceof Series);

  if (!hasSeries) {
    return avgOf(values as number[]);
  }
  
  // At least one Series - return a Series
  const firstSeries = values.find(v => v instanceof Series) as Series;
  const bars = firstSeries.bars;
  const length = bars.length;
  
  // Convert all values to arrays (scalars become constant arrays)
  const valueArrays = values.map(v => 
    v instanceof Series ? v.toArray() : null
  );
  
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    const nums = values.map((v, idx) => 
      valueArrays[idx] ? valueArrays[idx]![i] ?? NaN : (v as number)
    );
    result.push(avgOf(nums));
  }

  return Series.fromArray(bars, result);
}

/** PineScript math.avg of numbers: plain sum up to 2 values, Kahan sum with the correction flushed from 3. */
function avgOf(nums: number[]): number {
  if (nums.length <= 2) {
    let sum = 0;
    for (const n of nums) sum = sum + n;
    return sum / nums.length;
  }
  let sum = 0;
  let c = 0;
  for (const n of nums) {
    const y = n - c;
    const t = sum + y;
    c = t - sum - y;
    sum = t;
  }
  return (sum - c) / nums.length;
}

/**
 * Returns the sum of values over a sliding window.
 *
 * @param source - Series of values or array
 * @param length - Window length for summation, or one length per bar (a series length: array or Series)
 * @returns Series or array with rolling sum values
 *
 * @remarks
 * - Calculates the sum of the last `length` non-`na` values at each point; an `na` value (also +/-Infinity) is
 *   skipped and the bar keeps the previous result (as in PineScript)
 * - Returns NaN until `length` non-`na` values are available
 * - A compensated running sum, as in PineScript, so the result can differ from the exact window sum in the last
 *   bits (bit for bit with PineScript)
 * - When passed a Series, returns a Series; when passed an array, returns an array
 * - With a series length, PineScript moves the running sum to the new length when the length changes, with Kahan
 *   steps of the raw values: a smaller length removes the values that leave the window (oldest first); a larger
 *   length adds back the values from the one before the old window down to the one `length` values back (newest
 *   first), then the usual step removes the stored value of the one `length` values back. A bar with an `na` value
 *   gives the sum of the last `length` earlier values
 *
 * @example
 * ```typescript
 * math.sum([1, 2, 3, 4, 5], 3) // Returns: [NaN, NaN, 6, 9, 12]
 * // Explanation: [NaN, NaN, 1+2+3, 2+3+4, 3+4+5]
 * ```
 */
export function sum(source: Series, length: simple_int | ArrayLike<number> | Series): Series;
export function sum(source: series_float, length: simple_int | ArrayLike<number> | Series): series_float;
export function sum(
  source: series_float | Series,
  length: simple_int | ArrayLike<number> | Series
): series_float | Series {
  // Handle Series objects - extract to array first
  const sourceArray = source instanceof Series ? source.toArray() : source;
  // PineScript: the sum of the last `length` non-na values (also +/-Infinity skipped); an na bar keeps the previous
  // result. A compensated running sum, bit for bit as PineScript.
  const result: series_float =
    typeof length === 'number'
      ? runningSum(sourceArray, length)
      : runningSumSeries(sourceArray, length instanceof Series ? length.toArray() : length, 'math.sum');

  // If input was a Series, return a Series
  if (source instanceof Series) {
    return Series.fromArray(source.bars, result);
  }

  return result;
}

/**
 * Returns the square root of a number.
 *
 * @param value - The number (must be non-negative) or Series
 * @returns The square root (√value)
 *
 * @remarks
 * - Returns NaN for negative numbers
 * - √x × √x = x (for non-negative x)
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.sqrt(9) // Returns: 3
 * math.sqrt(16) // Returns: 4
 * math.sqrt(2) // Returns: 1.414...
 * math.sqrt(0) // Returns: 0
 * ```
 */
export function sqrt(value: Series): Series;
export function sqrt(value: float): float;
export function sqrt(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.sqrt(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.sqrt(value);
}

/**
 * Returns base raised to the power of exponent.
 *
 * @param base - The base number or Series
 * @param exponent - The exponent (power) or Series
 * @returns base^exponent
 *
 * @remarks
 * - 0^0 returns 1
 * - Negative base with fractional exponent returns NaN
 * - Any number to the power of 0 equals 1
 * - If any argument is a Series, returns a Series; if all are numbers, returns a number
 *
 * @example
 * ```typescript
 * math.pow(2, 3) // Returns: 8 (2³)
 * math.pow(10, 2) // Returns: 100
 * math.pow(5, 0) // Returns: 1
 * math.pow(2, -1) // Returns: 0.5
 * ```
 */
export function pow(base: Series, exponent: float): Series;
export function pow(base: float, exponent: Series): Series;
export function pow(base: Series, exponent: Series): Series;
export function pow(base: float, exponent: float): float;
export function pow(base: float | Series, exponent: float | Series): float | Series {
  const baseIsSeries = base instanceof Series;
  const expIsSeries = exponent instanceof Series;
  
  // Pure scalar case
  if (!baseIsSeries && !expIsSeries) {
    return Math.pow(base as number, exponent as number);
  }
  
  // At least one is a Series - return a Series
  const bars = baseIsSeries ? (base as Series).bars : (exponent as Series).bars;
  const baseArray = baseIsSeries ? (base as Series).toArray() : null;
  const expArray = expIsSeries ? (exponent as Series).toArray() : null;
  const length = bars.length;
  
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    const b = baseArray ? baseArray[i] ?? NaN : (base as number);
    const e = expArray ? expArray[i] ?? NaN : (exponent as number);
    result.push(Math.pow(b, e));
  }
  
  return Series.fromArray(bars, result);
}

/**
 * Returns e (Euler's number) raised to the power of value.
 *
 * @param value - The exponent or Series
 * @returns e^value (where e ≈ 2.71828)
 *
 * @remarks
 * - e^0 = 1
 * - e^1 = e ≈ 2.71828
 * - Inverse of ln(x)
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.exp(0) // Returns: 1
 * math.exp(1) // Returns: 2.71828... (e)
 * math.exp(2) // Returns: 7.389...
 * math.exp(-1) // Returns: 0.3678...
 * ```
 */
export function exp(value: Series): Series;
export function exp(value: float): float;
export function exp(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.exp(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.exp(value);
}

/**
 * Returns the natural logarithm (base e) of a number.
 *
 * @param value - The number (must be positive) or Series
 * @returns ln(value)
 *
 * @remarks
 * - Returns NaN for negative numbers
 * - Returns -Infinity for 0
 * - ln(e) = 1
 * - ln(1) = 0
 * - Inverse of exp(x)
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.log(1) // Returns: 0
 * math.log(Math.E) // Returns: 1
 * math.log(10) // Returns: 2.302...
 * math.log(100) // Returns: 4.605...
 * ```
 */
export function log(value: Series): Series;
export function log(value: float): float;
export function log(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.log(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.log(value);
}

/**
 * Returns the base-10 logarithm of a number.
 *
 * @param value - The number (must be positive) or Series
 * @returns log₁₀(value)
 *
 * @remarks
 * - Returns NaN for negative numbers
 * - Returns -Infinity for 0
 * - log₁₀(10) = 1
 * - log₁₀(100) = 2
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.log10(10) // Returns: 1
 * math.log10(100) // Returns: 2
 * math.log10(1000) // Returns: 3
 * math.log10(1) // Returns: 0
 * ```
 */
export function log10(value: Series): Series;
export function log10(value: float): float;
export function log10(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.log10(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.log10(value);
}

/**
 * Returns the sine of an angle in radians.
 *
 * @param value - The angle in radians or Series
 * @returns The sine value (range: [-1, 1])
 *
 * @remarks
 * - Input is in radians, not degrees
 * - sin(0) = 0
 * - sin(π/2) = 1
 * - Periodic with period 2π
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.sin(0) // Returns: 0
 * math.sin(Math.PI / 2) // Returns: 1
 * math.sin(Math.PI) // Returns: 0 (approximately)
 * math.sin(Math.PI / 6) // Returns: 0.5
 * ```
 */
export function sin(value: Series): Series;
export function sin(value: float): float;
export function sin(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.sin(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.sin(value);
}

/**
 * Returns the cosine of an angle in radians.
 *
 * @param value - The angle in radians or Series
 * @returns The cosine value (range: [-1, 1])
 *
 * @remarks
 * - Input is in radians, not degrees
 * - cos(0) = 1
 * - cos(π/2) = 0
 * - Periodic with period 2π
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.cos(0) // Returns: 1
 * math.cos(Math.PI / 2) // Returns: 0 (approximately)
 * math.cos(Math.PI) // Returns: -1
 * math.cos(Math.PI / 3) // Returns: 0.5
 * ```
 */
export function cos(value: Series): Series;
export function cos(value: float): float;
export function cos(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.cos(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.cos(value);
}

/**
 * Returns the tangent of an angle in radians.
 *
 * @param value - The angle in radians or Series
 * @returns The tangent value
 *
 * @remarks
 * - Input is in radians, not degrees
 * - tan(x) = sin(x) / cos(x)
 * - Undefined at π/2, 3π/2, etc. (returns very large numbers)
 * - Periodic with period π
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.tan(0) // Returns: 0
 * math.tan(Math.PI / 4) // Returns: 1
 * math.tan(Math.PI / 6) // Returns: 0.577... (1/√3)
 * ```
 */
export function tan(value: Series): Series;
export function tan(value: float): float;
export function tan(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.tan(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.tan(value);
}

/**
 * Returns the arcsine (inverse sine) of a number.
 *
 * @param value - The value (must be in range [-1, 1]) or Series
 * @returns The angle in radians (range: [-π/2, π/2])
 *
 * @remarks
 * - Returns NaN for values outside [-1, 1]
 * - asin(sin(x)) = x for x in [-π/2, π/2]
 * - asin(0) = 0
 * - asin(1) = π/2
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.asin(0) // Returns: 0
 * math.asin(1) // Returns: 1.5707... (π/2)
 * math.asin(0.5) // Returns: 0.5235... (π/6)
 * math.asin(-1) // Returns: -1.5707... (-π/2)
 * ```
 */
export function asin(value: Series): Series;
export function asin(value: float): float;
export function asin(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.asin(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.asin(value);
}

/**
 * Returns the arccosine (inverse cosine) of a number.
 *
 * @param value - The value (must be in range [-1, 1]) or Series
 * @returns The angle in radians (range: [0, π])
 *
 * @remarks
 * - Returns NaN for values outside [-1, 1]
 * - acos(cos(x)) = x for x in [0, π]
 * - acos(1) = 0
 * - acos(0) = π/2
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.acos(1) // Returns: 0
 * math.acos(0) // Returns: 1.5707... (π/2)
 * math.acos(0.5) // Returns: 1.0471... (π/3)
 * math.acos(-1) // Returns: 3.1415... (π)
 * ```
 */
export function acos(value: Series): Series;
export function acos(value: float): float;
export function acos(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.acos(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.acos(value);
}

/**
 * Returns the arctangent (inverse tangent) of a number.
 *
 * @param value - The value or Series
 * @returns The angle in radians (range: [-π/2, π/2])
 *
 * @remarks
 * - Accepts any number as input
 * - atan(tan(x)) = x for x in [-π/2, π/2]
 * - atan(0) = 0
 * - atan(1) = π/4
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.atan(0) // Returns: 0
 * math.atan(1) // Returns: 0.7853... (π/4)
 * math.atan(-1) // Returns: -0.7853... (-π/4)
 * math.atan(Infinity) // Returns: 1.5707... (π/2)
 * ```
 */
export function atan(value: Series): Series;
export function atan(value: float): float;
export function atan(value: float | Series): float | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(Math.atan(v));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return Math.atan(value);
}

/**
 * Converts an angle from degrees to radians.
 *
 * @param degrees - The angle in degrees or Series
 * @returns The angle in radians
 *
 * @remarks
 * - Radians = Degrees × (π / 180)
 * - One full rotation: 360° = 2π radians
 * - Common conversions: 90° = π/2, 180° = π, 270° = 3π/2
 * - If degrees is a Series, returns a Series; if degrees is a number, returns a number
 *
 * @example
 * ```typescript
 * math.toradians(0) // Returns: 0
 * math.toradians(90) // Returns: 1.5707... (π/2)
 * math.toradians(180) // Returns: 3.1415... (π)
 * math.toradians(360) // Returns: 6.2831... (2π)
 * ```
 */
export function toradians(degrees: Series): Series;
export function toradians(degrees: float): float;
export function toradians(degrees: float | Series): float | Series {
  if (degrees instanceof Series) {
    const bars = degrees.bars;
    const valueArray = degrees.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(v * (Math.PI / 180));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return degrees * (Math.PI / 180);
}

/**
 * Converts an angle from radians to degrees.
 *
 * @param radians - The angle in radians or Series
 * @returns The angle in degrees
 *
 * @remarks
 * - Degrees = Radians × (180 / π)
 * - One full rotation: 2π radians = 360°
 * - Common conversions: π/2 = 90°, π = 180°, 3π/2 = 270°
 * - If radians is a Series, returns a Series; if radians is a number, returns a number
 *
 * @example
 * ```typescript
 * math.todegrees(0) // Returns: 0
 * math.todegrees(Math.PI / 2) // Returns: 90
 * math.todegrees(Math.PI) // Returns: 180
 * math.todegrees(2 * Math.PI) // Returns: 360
 * ```
 */
export function todegrees(radians: Series): Series;
export function todegrees(radians: float): float;
export function todegrees(radians: float | Series): float | Series {
  if (radians instanceof Series) {
    const bars = radians.bars;
    const valueArray = radians.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(v * (180 / Math.PI));
    }
    
    return Series.fromArray(bars, result);
  }
  
  return radians * (180 / Math.PI);
}

/**
 * PineScript's seeded generator: Java's linear congruential generator (`java.util.Random`), `nextDouble()`.
 * Each generator draws one number per call.
 */
export function seededRandom(seed: int): (min?: float, max?: float) => float {
  const mask = (1n << 48n) - 1n;
  let state = (BigInt(Math.trunc(seed)) ^ 0x5deece66dn) & mask;
  const next = (bits: bigint): bigint => {
    state = (0x5deece66dn * state + 11n) & mask;
    return state >> (48n - bits);
  };
  return (min = 0, max = 1) => {
    const hi = next(26n);
    const lo = next(27n);
    const unit = Number((hi << 27n) + lo) / 2 ** 53;
    return min + unit * (max - min);
  };
}

const seeded = new Map<number, (min?: float, max?: float) => float>();

/** Starts every seeded sequence of `math.random` again (called at the start of a script run). */
export function resetRandom(): void {
  seeded.clear();
}

/**
 * Returns a pseudo-random number.
 *
 * @param min - Optional minimum value (inclusive), default 0
 * @param max - Optional maximum value (exclusive), default 1
 * @param seed - Optional seed: a repeatable sequence, as PineScript (Java's `java.util.Random`)
 * @returns A random number in the specified range, or [0, 1) if no range specified
 *
 * @remarks
 * - Without a seed: `Math.random()`
 * - With a seed: PineScript's sequence, one number per call (measured: the call on each bar draws the next number
 *   of `new java.util.Random(seed).nextDouble()` from the first bar of the history). PineScript keeps one generator
 *   per call site; here there is one generator per seed value (started again by `executeScript`): for two call sites
 *   with the same seed use `callsite.random(seed)`
 *
 * @example
 * ```typescript
 * math.random() // Returns: value between 0 and 1 (e.g., 0.234...)
 * math.random(0, 10) // Returns: value between 0 and 10 (e.g., 7.45...)
 * math.random(0, 1, 42) // Returns: 0.7275636800328681 on the first call, as PineScript
 * ```
 */
export function random(min?: float, max?: float, seed?: int): float {
  if (seed !== undefined && seed !== null && !Number.isNaN(seed)) {
    let gen = seeded.get(seed);
    if (!gen) {
      gen = seededRandom(seed);
      seeded.set(seed, gen);
    }
    return gen(min ?? 0, max ?? 1);
  }
  const rand = Math.random();
  if (min !== undefined && max !== undefined) {
    return min + rand * (max - min);
  }
  return rand;
}

/**
 * Returns the sign of a number.
 *
 * @param value - The number to check or Series
 * @returns 1 for positive, -1 for negative, 0 for zero, na for na
 *
 * @remarks
 * - Returns 1 if value > 0
 * - Returns -1 if value < 0
 * - Returns 0 if value = 0
 * - Returns na if value is na (as PineScript)
 * - Useful for determining direction or polarity
 * - If value is a Series, returns a Series; if value is a number, returns a number
 *
 * @example
 * ```typescript
 * math.sign(5) // Returns: 1
 * math.sign(-3) // Returns: -1
 * math.sign(0) // Returns: 0
 * math.sign(0.001) // Returns: 1
 * math.sign(NaN) // Returns: NaN
 * ```
 */
export function sign(value: Series): Series;
export function sign(value: float): int;
export function sign(value: float | Series): int | Series {
  if (value instanceof Series) {
    const bars = value.bars;
    const valueArray = value.toArray();
    const length = bars.length;
    
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      const v = valueArray[i] ?? NaN;
      result.push(v > 0 ? 1 : v < 0 ? -1 : v === 0 ? 0 : NaN);
    }
    
    return Series.fromArray(bars, result);
  }
  
  return value > 0 ? 1 : value < 0 ? -1 : value === 0 ? 0 : NaN;
}

/**
 * Rounds a value to the nearest mintick.
 *
 * @param number - The number to round or Series
 * @param mintick - Optional mintick value (defaults to requiring syminfo context)
 * @returns The number rounded to tick precision
 *
 * @remarks
 * - **PineScript v6 signature**: `math.round_to_mintick(number)` - uses implicit syminfo.mintick
 * - **JavaScript signature**: Requires explicit `mintick` OR use `createContext()` with syminfo
 * - Rounds to the nearest value divisible by mintick
 * - Returns NaN for NaN input
 * - If number is a Series, returns a Series; if number is a float, returns a float
 *
 * PineScript rules:
 * - mintick is `minmove / pricescale` (here rebuilt from `mintick`: the smallest power of 10 that makes it an
 *   integer); the position on the tick grid is `|number| * pricescale / minmove`
 * - ties go away from zero, decided on the exact value of that product with a 1e-10 tolerance
 *   (-1.075 -> -1.08, 1.005 -> 1.01, 2.675 -> 2.68 at mintick 0.01)
 *
 * @example
 * ```typescript
 * // Direct call with explicit mintick
 * const rounded = math.round_to_mintick(1.2345, 0.01); // Returns: 1.23
 * const rounded2 = math.round_to_mintick(1.2367, 0.01); // Returns: 1.24
 *
 * // Or use context API for cleaner syntax
 * const { math } = createContext({ syminfo: { mintick: 0.01 } });
 * const rounded = math.round_to_mintick(1.2345); // Returns: 1.23
 * ```
 */
export function round_to_mintick(number: Series, mintick?: float): Series;
export function round_to_mintick(number: float, mintick?: float): float;
export function round_to_mintick(number: float | Series, mintick?: float): float | Series {
  if (number instanceof Series) {
    const bars = number.bars;
    const valueArray = number.toArray();
    if (mintick === undefined) {
      throw new Error(
        'math.round_to_mintick() requires mintick value. ' +
        'Either pass it explicitly or use createContext({ syminfo: { mintick } }) for implicit data.'
      );
    }
    const result: number[] = [];
    for (let i = 0; i < bars.length; i++) {
      result.push(roundToTick(valueArray[i] ?? NaN, mintick));
    }
    return Series.fromArray(bars, result);
  }

  // Scalar case
  if (isNaN(number)) {
    return NaN;
  }

  if (mintick === undefined) {
    throw new Error(
      'math.round_to_mintick() requires mintick value. ' +
      'Either pass it explicitly or use createContext({ syminfo: { mintick } }) for implicit data.'
    );
  }
  return roundToTick(number, mintick);
}

/** `[minmove, pricescale]` of a mintick: pricescale is the smallest power of 10 (up to 1e15) giving an integer. */
function tickPair(mintick: number): [number, number] | null {
  for (let k = 0; k <= 15; k++) {
    const pricescale = Number(`1e${k}`);
    const scaled = mintick * pricescale;
    const minmove = Math.round(scaled);
    if (minmove >= 1 && Math.abs(scaled - minmove) <= 1e-9 * minmove) return [minmove, pricescale];
  }
  return null;
}

/** PineScript math.round_to_mintick of one value (see `round_to_mintick`). */
function roundToTick(number: number, mintick: number): number {
  if (!Number.isFinite(number)) return NaN;
  if (mintick === 0) return number;
  const pair = tickPair(mintick);
  const negative = number < 0;
  const magnitude = negative ? -number : number;
  if (pair === null) {
    // A tick that is no decimal fraction: the grid of the double mintick, ties away from zero.
    const scaled = magnitude / mintick;
    let units = Math.trunc(scaled);
    if (scaled - units >= 0.5) units++;
    return (negative ? 0 - units : units) * mintick;
  }
  const [minmove, pricescale] = pair;
  const scaled = (magnitude * pricescale) / minmove;
  let units = Math.trunc(scaled);
  const offset = scaled - units - 0.5;
  const slack = 1e-6 + scaled * 1.8e-15;
  if (-slack < offset && offset < slack) {
    const [n, d] = exactRatio(magnitude);
    const num = n * BigInt(pricescale);
    const den = d * BigInt(minmove);
    const whole = num / den;
    units = Number(whole) + (reachesTie(num, den, whole) ? 1 : 0);
  } else if (offset > 0) {
    units++;
  }
  return ((negative ? 0 - units : units) * minmove) / pricescale;
}

// Constants
export const pi = Math.PI;
export const e = Math.E;
export const phi = 1.618033988749895; // Golden ratio
export const rphi = 0.6180339887498948; // Reciprocal of golden ratio: 1 / phi
