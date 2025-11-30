/**
 * @fileoverview Simplified Series class for lazy time-series computation
 * Represents a time-series of values with lazy evaluation
 * @module runtime/series
 */

import type { Bar } from '../types';

/**
 * Function that computes a value for each bar
 */
export type SeriesExtractor = (bar: Bar, index: number, data: Bar[]) => number;

/**
 * Series - represents a time-series of values with lazy evaluation
 *
 * Series are lazy - they don't compute values until needed.
 * Operations on Series return new Series with composed extractors.
 *
 * @example
 * ```typescript
 * const close = Series.fromBars(bars, 'close');
 * const open = Series.fromBars(bars, 'open');
 * const range = close.sub(open);  // Creates new Series, doesn't compute yet
 * const values = range.toArray(); // Now computes for all bars
 * ```
 */
export class Series {
  private extractor: SeriesExtractor;
  private data: Bar[];
  private cached: number[] | null = null;

  /**
   * Create a new Series
   *
   * @param data - Bar data for the series
   * @param extractor - Function to extract/compute value for each bar
   */
  constructor(data: Bar[], extractor: SeriesExtractor) {
    this.data = data;
    this.extractor = extractor;
  }

  // ============================================
  // Static Factory Methods
  // ============================================

  /**
   * Create Series from bar data by extracting a specific field
   * @param bars - Bar data
   * @param field - Field to extract ('open', 'high', 'low', 'close', 'volume')
   * @returns Series with extracted field values
   */
  static fromBars(bars: Bar[], field: 'open' | 'high' | 'low' | 'close' | 'volume'): Series {
    return new Series(bars, (bar) => bar[field] ?? NaN);
  }

  /**
   * Create a constant series (same value for all bars)
   * @param bars - Bar data
   * @param value - Constant value
   * @returns Series with constant value
   */
  static constant(bars: Bar[], value: number): Series {
    return new Series(bars, () => value);
  }

  /**
   * Create series from array of values
   * @param bars - Bar data (for time alignment)
   * @param values - Array of values
   * @returns Series
   */
  static fromArray(bars: Bar[], values: number[]): Series {
    return new Series(bars, (_bar, i) => values[i] ?? NaN);
  }

  // ============================================
  // Arithmetic Operations
  // ============================================

  /**
   * Add two series or a series and a number
   * @param other - Series or number to add
   * @returns New Series representing the sum
   */
  add(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a + b;
    });
  }

  /**
   * Subtract two series or subtract a number from a series
   * @param other - Series or number to subtract
   * @returns New Series representing the difference
   */
  sub(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a - b;
    });
  }

  /**
   * Multiply two series or a series by a number
   * @param other - Series or number to multiply
   * @returns New Series representing the product
   */
  mul(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a * b;
    });
  }

  /**
   * Divide two series or a series by a number
   * @param other - Series or number to divide by
   * @returns New Series representing the quotient
   */
  div(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return b !== 0 ? a / b : NaN;
    });
  }

  /**
   * Modulo operation
   * @param other - Series or number for modulo
   * @returns New Series representing the remainder
   */
  mod(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return b !== 0 ? a % b : NaN;
    });
  }

  /**
   * Negation
   * @returns New Series with negated values
   */
  neg(): Series {
    return new Series(this.data, (bar, i, data) => {
      return -this.extractor(bar, i, data);
    });
  }

  // ============================================
  // Comparison Operations
  // ============================================

  /**
   * Greater than comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  gt(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a > b ? 1 : 0;
    });
  }

  /**
   * Greater than or equal comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  gte(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a >= b ? 1 : 0;
    });
  }

  /**
   * Less than comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  lt(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a < b ? 1 : 0;
    });
  }

  /**
   * Less than or equal comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  lte(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a <= b ? 1 : 0;
    });
  }

  /**
   * Equality comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  eq(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a === b ? 1 : 0;
    });
  }

  /**
   * Not equal comparison
   * @param other - Series or number to compare
   * @returns New Series with 1 where true, 0 where false
   */
  neq(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a !== b ? 1 : 0;
    });
  }

  // ============================================
  // Logical Operations (for boolean series)
  // ============================================

  /**
   * Logical AND
   * @param other - Series or number (truthy/falsy)
   * @returns New Series with 1 where both true, 0 otherwise
   */
  and(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a && b ? 1 : 0;
    });
  }

  /**
   * Logical OR
   * @param other - Series or number (truthy/falsy)
   * @returns New Series with 1 where either true, 0 otherwise
   */
  or(other: Series | number): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a || b ? 1 : 0;
    });
  }

  /**
   * Logical NOT
   * @returns New Series with inverted boolean values
   */
  not(): Series {
    return new Series(this.data, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      return !a ? 1 : 0;
    });
  }

  // ============================================
  // Offset/History
  // ============================================

  /**
   * Access previous bars (like close[1] in PineScript)
   * @param offset - Number of bars back (positive = past)
   * @returns New Series with offset values
   */
  offset(offset: number): Series {
    return new Series(this.data, (_bar, i, data) => {
      const targetIndex = i - offset;
      if (targetIndex < 0 || targetIndex >= data.length) {
        return NaN;
      }
      return this.extractor(data[targetIndex]!, targetIndex, data);
    });
  }

  // ============================================
  // Computation & Access
  // ============================================

  /**
   * Compute all values for the series
   * @returns Array of computed values
   */
  toArray(): number[] {
    if (this.cached !== null) {
      return this.cached;
    }

    this.cached = this.data.map((bar, i) => this.extractor(bar, i, this.data));
    return this.cached;
  }

  /**
   * Invalidate cache (when data changes)
   * @internal
   */
  _invalidate(): void {
    this.cached = null;
  }

  /**
   * Compute all values (alias for toArray)
   * @returns Array of computed values
   * @internal
   */
  _compute(): number[] {
    return this.toArray();
  }

  /**
   * Get value at specific index
   * @param index - Bar index
   * @returns Value at that index
   */
  get(index: number): number {
    const values = this.toArray();
    return values[index] ?? NaN;
  }

  /**
   * Get the last value (most recent bar)
   * @returns Most recent value
   */
  last(): number {
    const values = this.toArray();
    return values[values.length - 1] ?? NaN;
  }

  /**
   * Get number of values
   * @returns Length of series
   */
  length(): number {
    return this.data.length;
  }

  /**
   * Convert series to time-value pairs for charting
   * @returns Array of { time, value } objects
   */
  toTimeValuePairs(): Array<{ time: any; value: number }> {
    const values = this.toArray();
    return this.data.map((bar, i) => ({
      time: bar.time,
      value: values[i]!
    })).filter(point => !Number.isNaN(point.value));
  }
}
