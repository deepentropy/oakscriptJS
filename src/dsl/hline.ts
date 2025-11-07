/**
 * @fileoverview hline() DSL function
 * @module dsl/hline
 */

import { getContext } from '../runtime/context';
import type { HLineRegistration } from '../runtime/context';
import type { HLine } from '../types';

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
 * This function registers a horizontal line in the runtime context and returns a reference to it.
 * The returned reference can be used with fill() to color the space between levels or plots.
 * Equivalent to PineScript's hline() function.
 *
 * @param price - Price level for the horizontal line
 * @param options - Hline options
 * @returns HLine reference that can be used with fill()
 *
 * @example
 * ```typescript
 * hline(0);
 * const h1 = hline(70, {title: "Overbought", color: color.red, linestyle: "dashed"});
 * const h2 = hline(30, {title: "Oversold", color: color.green, linestyle: "dashed"});
 * fill(h1, h2, {color: color.new(color.gray, 90)});
 * ```
 */
export function hline(price: number, options: HLineOptions = {}): HLine {
  const registration: HLineRegistration = {
    price,
    title: options.title,
    color: options.color,
    linestyle: options.linestyle || 'solid',
    linewidth: options.linewidth || 1,
    editable: options.editable,
  };

  return getContext().registerHLine(registration);
}
