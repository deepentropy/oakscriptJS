/**
 * @fileoverview indicator() DSL function
 * @module dsl/indicator
 */

import { getContext } from '../runtime/context';
import type { IndicatorMetadata } from '../runtime/context';

/**
 * Options for indicator() function
 */
export interface IndicatorOptions {
  /** Short title for display */
  shorttitle?: string;
  /** Format for values */
  format?: 'price' | 'volume' | 'percent';
  /** Decimal precision */
  precision?: number;
  /** Whether to overlay on main chart */
  overlay?: boolean;
  /** Timeframe (empty string = chart timeframe) */
  timeframe?: string;
  /** Whether to show gaps for different timeframes */
  timeframe_gaps?: boolean;
}

/**
 * Declare an indicator
 *
 * This function registers indicator metadata in the runtime context.
 * Equivalent to PineScript's indicator() function.
 *
 * @param title - Indicator title
 * @param options - Indicator options
 *
 * @example
 * ```typescript
 * indicator("My Indicator");
 * indicator("RSI", {overlay: false, precision: 2});
 * indicator("Moving Average", {format: "price", overlay: true});
 * ```
 */
export function indicator(title: string, options: IndicatorOptions = {}): void {
  const metadata: IndicatorMetadata = {
    title,
    shorttitle: options.shorttitle,
    format: options.format || 'price',
    precision: options.precision ?? 4,
    overlay: options.overlay ?? false,
    timeframe: options.timeframe || '',
    timeframe_gaps: options.timeframe_gaps ?? true,
  };

  getContext().registerIndicator(metadata);
}
