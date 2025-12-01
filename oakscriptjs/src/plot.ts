/**
 * @fileoverview Plot helper functions for indicator visualization
 * These functions help format and prepare data for plotting.
 * @module plot
 */

/**
 * Time value type (can be number timestamp or string date)
 */
export type Time = number | string;

/**
 * Time-value pair for chart data
 */
export interface TimeValuePair {
  /** Time (timestamp or date string) */
  time: Time;
  /** Value at this time point */
  value: number;
}

/**
 * Options for plot function
 */
export interface PlotOptions {
  /** Plot color */
  color?: string;
  /** Display title */
  title?: string;
  /** Line width (1-4) */
  lineWidth?: number;
  /** Line style */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Offset from current bar */
  offset?: number;
}

/**
 * Prepare values for plotting by combining with time data
 * 
 * @param values - Array of values to plot (null values create gaps)
 * @param times - Array of time values corresponding to each value
 * @param options - Plot options (color, title, lineWidth, etc.)
 * @returns Array of time-value pairs ready for charting
 * 
 * @example
 * ```typescript
 * const smaValues = ta.sma(ctx.close, 14);
 * const plotData = plot(smaValues, ctx.time, { color: '#2196F3', title: 'SMA' });
 * // Returns: [{ time: 1000, value: 100.5 }, { time: 2000, value: 101.2 }, ...]
 * ```
 */
export function plot(
  values: (number | null)[],
  times: Time[],
  options: PlotOptions = {}
): TimeValuePair[] {
  const result: TimeValuePair[] = [];
  const offset = options.offset ?? 0;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const timeIndex = i + offset;
    
    // Skip null/undefined/NaN values (creates gaps in the chart)
    if (value === null || value === undefined || Number.isNaN(value)) {
      continue;
    }

    // Skip if time index is out of bounds
    if (timeIndex < 0 || timeIndex >= times.length) {
      continue;
    }

    const time = times[timeIndex];
    if (time !== undefined) {
      result.push({ time, value });
    }
  }

  return result;
}

/**
 * Plot result with metadata
 */
export interface PlotResult {
  /** Plot identifier */
  id: string;
  /** Time-value data pairs */
  data: TimeValuePair[];
  /** Plot options */
  options: PlotOptions;
}

/**
 * Create a named plot with data and options
 * 
 * @param id - Unique identifier for this plot
 * @param values - Array of values to plot
 * @param times - Array of time values
 * @param options - Plot options
 * @returns PlotResult with id, data, and options
 * 
 * @example
 * ```typescript
 * const smaPlot = createPlot('sma', smaValues, ctx.time, { color: '#2196F3' });
 * ```
 */
export function createPlot(
  id: string,
  values: (number | null)[],
  times: Time[],
  options: PlotOptions = {}
): PlotResult {
  return {
    id,
    data: plot(values, times, options),
    options,
  };
}
