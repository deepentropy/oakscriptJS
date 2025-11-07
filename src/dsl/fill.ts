/**
 * @fileoverview fill() DSL function
 * @module dsl/fill
 */

import { getContext } from '../runtime/context';
import type { FillRegistration } from '../runtime/context';
import type { Plot, HLine } from '../types';

/**
 * Options for fill() function
 */
export interface FillOptions {
  /** Fill color */
  color?: any;
  /** Fill title */
  title?: string;
  /** Editable in chart */
  editable?: boolean;
  /** Display mode */
  display?: 'all' | 'none';
}

/**
 * Fill the background between two plots or horizontal lines
 *
 * This function creates a colored fill between two plot references or hline references.
 * Equivalent to PineScript's fill() function.
 *
 * @param plot1 - First plot or hline reference (from plot() or hline())
 * @param plot2 - Second plot or hline reference (from plot() or hline())
 * @param options - Fill options
 *
 * @example
 * ```typescript
 * // Fill between two plots
 * const p1 = plot(ema20, {color: color.blue});
 * const p2 = plot(ema50, {color: color.red});
 * fill(p1, p2, {color: color.new(color.blue, 90)});
 *
 * // Fill between horizontal lines
 * const h1 = hline(70, {title: "Overbought"});
 * const h2 = hline(30, {title: "Oversold"});
 * fill(h1, h2, {color: color.new(color.gray, 95)});
 *
 * // Fill between plot and hline
 * const rsiPlot = plot(rsi, {color: color.purple});
 * const midLine = hline(50, {title: "Middle"});
 * fill(rsiPlot, midLine, {color: color.new(color.purple, 90)});
 * ```
 */
export function fill(
  plot1: Plot | HLine,
  plot2: Plot | HLine,
  options: FillOptions = {}
): void {
  const registration: FillRegistration = {
    plot1: plot1.id,
    plot2: plot2.id,
    color: options.color,
    title: options.title,
    editable: options.editable,
    display: options.display || 'all',
  };

  getContext().registerFill(registration);
}
