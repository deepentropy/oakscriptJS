/**
 * @fileoverview Series class for PineScript DSL
 * Represents a time-series of values with lazy evaluation
 * @module runtime/series
 */

import type { Bar } from '../types';
import type { RuntimeContext } from './context';

/**
 * Function that extracts/computes a value for each bar
 */
export type SeriesExtractor = (bar: Bar, index: number, data: Bar[]) => number;

/**
 * Series - represents a time-series of values
 *
 * Series are lazy - they don't compute values until needed.
 * Operations on Series return new Series with composed extractors.
 *
 * @example
 * ```typescript
 * const range = high.sub(low);  // Creates new Series, doesn't compute yet
 * const values = range._compute();  // Now computes for all bars
 * ```
 */
export class Series {
  private context: RuntimeContext;
  private extractor: SeriesExtractor;
  private cached: number[] | null = null;

  /**
   * Create a new Series
   *
   * @param context - Runtime context providing chart data
   * @param extractor - Function to extract/compute value for each bar
   */
  constructor(context: RuntimeContext, extractor: SeriesExtractor) {
    this.context = context;
    this.extractor = extractor;
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (bar, i, data) => {
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
    return new Series(this.context, (_bar, i, data) => {
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
   * @internal
   */
  _compute(): number[] {
    if (this.cached !== null) {
      return this.cached;
    }

    const data = this.context.getData();
    this.cached = data.map((bar, i) => this.extractor(bar, i, data));
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
   * Convert to regular array
   * @returns Array of values
   */
  toArray(): number[] {
    return this._compute();
  }

  /**
   * Get value at specific index
   * @param index - Bar index
   * @returns Value at that index
   */
  get(index: number): number {
    const values = this._compute();
    return values[index] ?? NaN;
  }

  /**
   * Get the last value (most recent bar)
   * @returns Most recent value
   */
  last(): number {
    const values = this._compute();
    return values[values.length - 1] ?? NaN;
  }

  /**
   * Get number of values
   * @returns Length of series
   */
  length(): number {
    return this.context.getData().length;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Create a constant series (same value for all bars)
   * @param context - Runtime context
   * @param value - Constant value
   * @returns Series with constant value
   */
  static constant(context: RuntimeContext, value: number): Series {
    return new Series(context, () => value);
  }

  /**
   * Create series from array of values
   * @param context - Runtime context
   * @param values - Array of values
   * @returns Series
   */
  static fromArray(context: RuntimeContext, values: number[]): Series {
    return new Series(context, (_bar, i) => values[i] || NaN);
  }
}
