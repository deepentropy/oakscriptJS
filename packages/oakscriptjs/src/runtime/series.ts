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
 * BarData - Versioned wrapper around Bar[] array for cache invalidation
 * 
 * This class wraps a Bar[] array and tracks a version number that increments
 * whenever the data is mutated. Series objects reference this to detect when
 * their cached values need to be recomputed.
 * 
 * @example
 * ```typescript
 * const barData = new BarData(bars);
 * const close = Series.fromBars(barData, 'close');
 * const values1 = close.toArray(); // Computes and caches
 * 
 * barData.push(newBar); // Increments version
 * const values2 = close.toArray(); // Detects stale cache, recomputes
 * ```
 */
export class BarData {
  private _bars: Bar[];
  private _version: number = 0;

  /**
   * Create a new BarData wrapper
   * @param bars - Initial bar data (defaults to empty array)
   */
  constructor(bars: Bar[] = []) {
    this._bars = bars;
  }

  /**
   * Get the current version number
   * Version increments whenever data is mutated
   */
  get version(): number {
    return this._version;
  }

  /**
   * Get the underlying bar array
   * Note: Direct mutations to this array will NOT increment version
   * Use the provided mutation methods instead
   */
  get bars(): Bar[] {
    return this._bars;
  }

  /**
   * Get the number of bars
   */
  get length(): number {
    return this._bars.length;
  }

  /**
   * Add a new bar to the end
   * @param bar - Bar to add
   */
  push(bar: Bar): void {
    this._bars.push(bar);
    this._version++;
  }

  /**
   * Remove and return the last bar
   * @returns The removed bar, or undefined if empty
   */
  pop(): Bar | undefined {
    const bar = this._bars.pop();
    if (bar !== undefined) {
      this._version++;
    }
    return bar;
  }

  /**
   * Replace a bar at a specific index
   * @param index - Index to update
   * @param bar - New bar data
   */
  set(index: number, bar: Bar): void {
    if (index >= 0 && index < this._bars.length) {
      this._bars[index] = bar;
      this._version++;
    }
  }

  /**
   * Update the last bar (useful for real-time/streaming updates)
   * @param bar - New bar data
   */
  updateLast(bar: Bar): void {
    if (this._bars.length > 0) {
      this._bars[this._bars.length - 1] = bar;
      this._version++;
    }
  }

  /**
   * Replace all bars with new data
   * @param bars - New bar array
   */
  setAll(bars: Bar[]): void {
    this._bars = bars;
    this._version++;
  }

  /**
   * Manually increment version (for advanced use cases)
   * Call this after direct mutations to the bars array
   */
  invalidate(): void {
    this._version++;
  }

  /**
   * Get a bar at a specific index
   * @param index - Bar index
   * @returns Bar at that index, or undefined
   */
  at(index: number): Bar | undefined {
    return this._bars[index];
  }

  /**
   * Create a BarData from an existing Bar array
   * @param bars - Bar array
   * @returns New BarData instance
   */
  static from(bars: Bar[]): BarData {
    return new BarData(bars);
  }
}

/**
 * Series - represents a time-series of values with lazy evaluation
 *
 * Series are lazy - they don't compute values until needed.
 * Operations on Series return new Series with composed extractors.
 *
 * Now supports automatic cache invalidation via BarData versioning
 * and memory-efficient closure chain breaking via materialize().
 *
 * @example
 * ```typescript
 * // Basic usage (backward compatible)
 * const close = Series.fromBars(bars, 'close');
 * const open = Series.fromBars(bars, 'open');
 * const range = close.sub(open);  // Creates new Series, doesn't compute yet
 * const values = range.toArray(); // Now computes for all bars
 * 
 * // With automatic cache invalidation
 * const barData = new BarData(bars);
 * const close = Series.fromBars(barData, 'close');
 * const values1 = close.toArray(); // Computes and caches
 * barData.push(newBar); // Version increments
 * const values2 = close.toArray(); // Detects stale cache, recomputes
 * 
 * // Breaking closure chains for memory efficiency
 * const complex = a.add(b).mul(c).div(d).sub(e);
 * const materialized = complex.materialize(); // Breaks closure chain
 * ```
 */
export class Series {
  private extractor: SeriesExtractor;
  private dataSource: BarData;
  private cached: number[] | null = null;
  private cachedVersion: number = -1;

  /**
   * Create a new Series
   *
   * @param data - Bar data (Bar[] or BarData)
   * @param extractor - Function to extract/compute value for each bar
   */
  constructor(data: Bar[] | BarData, extractor: SeriesExtractor) {
    // Support both Bar[] and BarData for backward compatibility
    this.dataSource = data instanceof BarData ? data : new BarData(data);
    this.extractor = extractor;
  }

  /**
   * Get the underlying bar data
   * @returns Bar array
   */
  get bars(): Bar[] {
    return this.dataSource.bars;
  }

  /**
   * Get the underlying BarData source
   * @returns BarData instance
   */
  get barData(): BarData {
    return this.dataSource;
  }

  // ============================================
  // Static Factory Methods
  // ============================================

  /**
   * Create Series from bar data by extracting a specific field
   * @param bars - Bar data (Bar[] or BarData)
   * @param field - Field to extract ('open', 'high', 'low', 'close', 'volume')
   * @returns Series with extracted field values
   */
  static fromBars(bars: Bar[] | BarData, field: 'open' | 'high' | 'low' | 'close' | 'volume'): Series {
    return new Series(bars, (bar) => bar[field] ?? NaN);
  }

  /**
   * Create a constant series (same value for all bars)
   * @param bars - Bar data (Bar[] or BarData)
   * @param value - Constant value
   * @returns Series with constant value
   */
  static constant(bars: Bar[] | BarData, value: number): Series {
    return new Series(bars, () => value);
  }

  /**
   * Create series from array of values
   * @param bars - Bar data (Bar[] or BarData) for time alignment
   * @param values - Array of values
   * @returns Series
   */
  static fromArray(bars: Bar[] | BarData, values: number[]): Series {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (bar, i, data) => {
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
    return new Series(this.dataSource, (_bar, i, data) => {
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
   * 
   * Now includes automatic cache invalidation:
   * - Checks if dataSource version has changed since cache was computed
   * - Recomputes if version mismatch detected
   * - Stores version when cache is created
   * 
   * @returns Array of computed values
   */
  toArray(): number[] {
    // Check if cache is valid by comparing versions
    if (this.cached !== null && this.cachedVersion === this.dataSource.version) {
      return this.cached;
    }

    // Recompute and update cache
    const bars = this.dataSource.bars;
    this.cached = bars.map((bar, i) => this.extractor(bar, i, bars));
    this.cachedVersion = this.dataSource.version;
    return this.cached;
  }

  /**
   * Materialize this Series by eagerly computing values and breaking closure chain
   * 
   * This method addresses the closure chain memory leak issue:
   * - Computes all values immediately
   * - Creates a new Series that stores values directly
   * - Breaks references to parent Series objects
   * - Useful for complex expressions to free intermediate Series memory
   * 
   * @example
   * ```typescript
   * // Without materialize: keeps a, b, c, d in memory via closures
   * const result = a.add(b).mul(c).div(d).sub(e);
   * 
   * // With materialize: breaks chain, frees a, b, c memory
   * const result = a.add(b).mul(c).materialize().div(d).sub(e);
   * ```
   * 
   * @returns New Series with computed values and no closure dependencies
   */
  materialize(): Series {
    const values = this.toArray();
    // Create a copy of values to ensure no shared references
    const valuesCopy = [...values];
    return Series.fromArray(this.dataSource, valuesCopy);
  }

  /**
   * Invalidate cache (when data changes)
   * 
   * Note: With BarData versioning, manual invalidation is rarely needed.
   * The cache is automatically invalidated when the underlying BarData changes.
   * This method is kept for backward compatibility and advanced use cases.
   * 
   * @internal
   */
  _invalidate(): void {
    this.cached = null;
    this.cachedVersion = -1;
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
    return this.dataSource.length;
  }

  /**
   * Convert series to time-value pairs for charting
   * @returns Array of { time, value } objects
   */
  toTimeValuePairs(): Array<{ time: any; value: number }> {
    const values = this.toArray();
    const bars = this.dataSource.bars;
    return bars.map((bar, i) => ({
      time: bar.time,
      value: values[i]!
    })).filter(point => !Number.isNaN(point.value));
  }
}
