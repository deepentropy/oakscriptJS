/**
 * @fileoverview plot() DSL function
 * @module dsl/plot
 */

import { getContext } from '../runtime/context';
import type { PlotRegistration } from '../runtime/context';
import type { Series } from '../runtime/series';

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
 * This function registers a plot in the runtime context.
 * Equivalent to PineScript's plot() function.
 *
 * @param series - Series to plot
 * @param options - Plot options
 *
 * @example
 * ```typescript
 * plot(close);
 * plot(close, {title: "Close", color: color.blue});
 * plot(rsi, {title: "RSI", color: color.purple, linewidth: 2});
 * plot(volume, {style: "histogram", color: color.gray});
 * ```
 */
export function plot(series: Series, options: PlotOptions = {}): void {
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

  getContext().registerPlot(registration);
}
