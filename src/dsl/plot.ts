/**
 * @fileoverview plot() DSL function
 * @module dsl/plot
 */

import { getContext } from '../runtime/context';
import type { PlotRegistration } from '../runtime/context';
import type { Series } from '../runtime/series';
import type { Plot } from '../types';

/**
 * Options for plot() function
 */
export interface PlotOptions {
  /** Plot title */
  title?: string;
  /** Plot color */
  color?: any;
  /** Line width */
  linewidth?: number;
  /** Plot style */
  style?: 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns';
  /** Track price on y-axis */
  trackprice?: boolean;
  /** Histogram base level */
  histbase?: number;
  /** Offset in bars */
  offset?: number;
  /** Join gaps */
  join?: boolean;
  /** Editable in chart */
  editable?: boolean;
  /** Display mode */
  display?: 'all' | 'none';
}

/**
 * Plot a series on the chart
 *
 * This function registers a plot in the runtime context and returns a reference to it.
 * The returned reference can be used with fill() to color the space between plots.
 * Equivalent to PineScript's plot() function.
 *
 * @param series - Series to plot
 * @param options - Plot options
 * @returns Plot reference that can be used with fill()
 *
 * @example
 * ```typescript
 * plot(close);
 * const p1 = plot(close, {title: "Close", color: color.blue});
 * const p2 = plot(rsi, {title: "RSI", color: color.purple, linewidth: 2});
 * fill(p1, p2, {color: color.new(color.blue, 90)});
 * ```
 */
export function plot(series: Series, options: PlotOptions = {}): Plot {
  const registration: PlotRegistration = {
    series,
    title: options.title,
    color: options.color,
    linewidth: options.linewidth || 1,
    style: options.style || 'line',
    trackprice: options.trackprice,
    histbase: options.histbase,
    offset: options.offset || 0,
    join: options.join,
    editable: options.editable,
    display: options.display || 'all',
  };

  return getContext().registerPlot(registration);
}
