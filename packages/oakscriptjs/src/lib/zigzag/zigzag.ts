/**
 * ZigZag Library
 *
 * Identifies trend reversals by connecting pivot highs and lows
 * that exceed a specified percentage deviation threshold.
 *
 * Based on TradingView's ZigZag library v8.
 */

import type { Bar } from '../../types';

// ============ Types ============

export interface ZigZagSettings {
  /** Minimum percentage deviation from previous pivot to register reversal (default: 5.0) */
  devThreshold: number;
  /** Number of bars required for pivot point detection (default: 10) */
  depth: number;
  /** Line color for ZigZag drawing (default: '#2962FF') */
  lineColor: string;
  /** Extend line from last pivot to current bar (default: true) */
  extendLast: boolean;
  /** Display reversal price in labels (default: true) */
  displayReversalPrice: boolean;
  /** Display cumulative volume in labels (default: true) */
  displayCumulativeVolume: boolean;
  /** Display price change from previous pivot (default: true) */
  displayReversalPriceChange: boolean;
  /** Price change display mode: 'Absolute' or 'Percent' (default: 'Absolute') */
  differencePriceMode: 'Absolute' | 'Percent';
  /** Allow both pivot high and low on same bar (default: true) */
  allowZigZagOnOneBar: boolean;
}

export interface ZigZagPoint {
  /** Bar timestamp */
  time: number;
  /** Bar index position */
  barIndex: number;
  /** Price at this point */
  price: number;
}

export interface ZigZagPivot {
  /** True if this is a pivot high, false for pivot low */
  isHigh: boolean;
  /** Cumulative volume from start to end */
  volume: number;
  /** Starting point of this segment */
  start: ZigZagPoint;
  /** Ending point (the pivot) of this segment */
  end: ZigZagPoint;
}

export interface ZigZagResult {
  /** Array of confirmed pivots */
  pivots: ZigZagPivot[];
  /** Extension line to current bar (if extendLast enabled) */
  extension: ZigZagPivot | null;
}

// ============ Default Settings ============

export const defaultSettings: ZigZagSettings = {
  devThreshold: 5.0,
  depth: 10,
  lineColor: '#2962FF',
  extendLast: true,
  displayReversalPrice: true,
  displayCumulativeVolume: true,
  displayReversalPriceChange: true,
  differencePriceMode: 'Absolute',
  allowZigZagOnOneBar: true,
};

// ============ ZigZag Class ============

export class ZigZag {
  settings: ZigZagSettings;
  pivots: ZigZagPivot[] = [];
  sumVol: number = 0;

  private highBuffer: number[] = [];
  private lowBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private barCount: number = 0;

  constructor(settings?: Partial<ZigZagSettings>) {
    this.settings = { ...defaultSettings, ...settings };
  }

  /**
   * Process a single bar, detecting pivots.
   * Must be called sequentially for each bar.
   * @returns true if a new pivot was detected or updated
   */
  update(bar: Bar, barIndex: number): boolean {
    // Store price data in buffers for lookback
    this.highBuffer.push(bar.high);
    this.lowBuffer.push(bar.low);
    this.timeBuffer.push(bar.time);
    this.barCount++;

    const depth = Math.max(2, Math.floor(this.settings.depth / 2));
    this.sumVol += bar.volume ?? 0;

    // Need enough bars for pivot detection (depth bars before and after)
    if (this.barCount < depth * 2 + 1) return false;

    let somethingChanged = this.tryFindPivot(true, depth, barIndex);
    somethingChanged = this.tryFindPivot(
      false,
      depth,
      barIndex,
      this.settings.allowZigZagOnOneBar || !somethingChanged
    ) || somethingChanged;

    return somethingChanged;
  }

  /**
   * Get the last confirmed pivot
   */
  lastPivot(): ZigZagPivot | null {
    if (this.pivots.length === 0) return null;
    const last = this.pivots[this.pivots.length - 1];
    return last !== undefined ? last : null;
  }

  /**
   * Get extension line to current bar (if extendLast enabled)
   */
  getExtension(currentBar: Bar, barIndex: number): ZigZagPivot | null {
    if (!this.settings.extendLast) return null;

    const last = this.lastPivot();
    if (!last) return null;

    // Extension goes opposite direction from last pivot
    const isHigh = !last.isHigh;
    const price = isHigh ? currentBar.high : currentBar.low;

    return {
      isHigh,
      volume: this.sumVol,
      start: last.end,
      end: { time: currentBar.time, barIndex, price },
    };
  }

  // ============ Private Methods ============

  private tryFindPivot(
    isHigh: boolean,
    depth: number,
    currentBarIndex: number,
    registerPivot: boolean = true
  ): boolean {
    const point = this.findPivotPoint(isHigh, depth, currentBarIndex);
    if (!point || !registerPivot) return false;
    return this.newPivotPointFound(isHigh, point);
  }

  /**
   * Check if a bar from `depth` bars back is a pivot point.
   * A pivot high has prices below it on both sides.
   * A pivot low has prices above it on both sides.
   */
  private findPivotPoint(
    isHigh: boolean,
    depth: number,
    currentBarIndex: number
  ): ZigZagPoint | null {
    const buffer = isHigh ? this.highBuffer : this.lowBuffer;
    const pivotBufferIdx = buffer.length - 1 - depth;

    if (pivotBufferIdx < depth) return null;

    const pivotPrice = buffer[pivotBufferIdx];
    if (pivotPrice === undefined) return null;

    // Check bars AFTER the potential pivot (more recent bars)
    // For a pivot high, subsequent bars must be strictly lower
    // For a pivot low, subsequent bars must be strictly higher
    for (let i = pivotBufferIdx + 1; i < buffer.length; i++) {
      const price = buffer[i];
      if (price === undefined) return null;
      if (isHigh) {
        if (price > pivotPrice) return null;
      } else {
        if (price < pivotPrice) return null;
      }
    }

    // Check bars BEFORE the potential pivot (older bars)
    // For a pivot high, previous bars must be lower or equal
    // For a pivot low, previous bars must be higher or equal
    for (let i = pivotBufferIdx - depth; i < pivotBufferIdx; i++) {
      const price = buffer[i];
      if (price === undefined) return null;
      if (isHigh) {
        if (price >= pivotPrice) return null;
      } else {
        if (price <= pivotPrice) return null;
      }
    }

    // It's a valid pivot
    const pivotBarIndex = currentBarIndex - depth;
    const pivotTime = this.timeBuffer[pivotBufferIdx];
    if (pivotTime === undefined) return null;

    return {
      time: pivotTime,
      barIndex: pivotBarIndex,
      price: pivotPrice,
    };
  }

  /**
   * Calculate percentage deviation from base price to new price
   */
  private calcDev(basePrice: number, price: number): number {
    return 100 * (price - basePrice) / Math.abs(basePrice);
  }

  /**
   * Handle a newly detected pivot point.
   * Either updates existing pivot (if same direction) or adds new pivot (if direction changed).
   */
  private newPivotPointFound(isHigh: boolean, point: ZigZagPoint): boolean {
    const last = this.lastPivot();

    if (!last) {
      // First pivot - create initial entry
      this.pivots.push({
        isHigh,
        volume: this.sumVol,
        start: point,
        end: point,
      });
      this.sumVol = 0;
      return true;
    }

    if (last.isHigh === isHigh) {
      // Same direction - check if this is a more extreme price
      const isMoreExtreme = isHigh
        ? point.price > last.end.price
        : point.price < last.end.price;

      if (isMoreExtreme) {
        // Update the existing pivot to the new extreme
        last.end = point;
        last.volume += this.sumVol;
        this.sumVol = 0;
        return true;
      }
    } else {
      // Direction change - check if deviation threshold is met
      const dev = this.calcDev(last.end.price, point.price);
      const threshold = this.settings.devThreshold;

      // For pivot high -> low transition, need negative deviation
      // For pivot low -> high transition, need positive deviation
      const meetsThreshold = last.isHigh
        ? dev <= -threshold
        : dev >= threshold;

      if (meetsThreshold) {
        // Add new pivot
        this.pivots.push({
          isHigh,
          volume: this.sumVol,
          start: last.end,
          end: point,
        });
        this.sumVol = 0;
        return true;
      }
    }

    return false;
  }
}

/**
 * Convenience function to calculate ZigZag on an array of bars.
 * Processes all bars and returns the resulting pivots and extension.
 */
export function calculateZigZag(
  bars: Bar[],
  settings?: Partial<ZigZagSettings>
): ZigZagResult {
  if (bars.length === 0) {
    return { pivots: [], extension: null };
  }

  const zz = new ZigZag(settings);

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar !== undefined) {
      zz.update(bar, i);
    }
  }

  const lastBar = bars[bars.length - 1];
  if (lastBar === undefined) {
    return { pivots: zz.pivots, extension: null };
  }
  const extension = zz.getExtension(lastBar, bars.length - 1);

  return {
    pivots: zz.pivots,
    extension,
  };
}
