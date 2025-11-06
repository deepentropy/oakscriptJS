/**
 * @fileoverview hline() DSL function
 * @module dsl/hline
 */

import { getContext } from '../runtime/context';
import type { HLineRegistration } from '../runtime/context';

/**
 * Options for hline() function
 */
export interface HLineOptions {
  /** Line title */
  title?: string;
  /** Line color */
  color?: any;
  /** Line style */
  linestyle?: 'solid' | 'dashed' | 'dotted';
  /** Line width */
  linewidth?: number;
  /** Editable in chart */
  editable?: boolean;
}

/**
 * Draw a horizontal line at a specific price level
 *
 * This function registers a horizontal line in the runtime context.
 * Equivalent to PineScript's hline() function.
 *
 * @param price - Price level for the horizontal line
 * @param options - Hline options
 *
 * @example
 * ```typescript
 * hline(0);
 * hline(0, {title: "Zero Line", color: color.gray});
 * hline(70, {title: "Overbought", color: color.red, linestyle: "dashed"});
 * hline(30, {title: "Oversold", color: color.green, linestyle: "dashed"});
 * ```
 */
export function hline(price: number, options: HLineOptions = {}): void {
  const registration: HLineRegistration = {
    price,
    title: options.title,
    color: options.color,
    linestyle: options.linestyle || 'solid',
    linewidth: options.linewidth || 1,
    editable: options.editable,
  };

  getContext().registerHLine(registration);
}
