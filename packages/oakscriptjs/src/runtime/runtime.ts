/**
 * @fileoverview OakScriptJS Runtime - Context management and plot functions
 * This module provides the global runtime context for indicator execution
 * @module runtime/runtime
 */

import type { OakScriptContext, SeriesHandle, SeriesOptions } from './types';

// Global context state
let context: OakScriptContext | null = null;

// Registered calculate function for recalculation
let calculateFn: (() => void) | null = null;

// Track active plots for cleanup
interface ActivePlot {
  id: string;
  series: SeriesHandle;
}

const activePlots: ActivePlot[] = [];

// Counter for generating unique plot IDs
let plotCounter = 0;

/**
 * Set the global OakScript context
 * Must be called by host application before any indicator calculation
 * @param ctx - The context object with chart and input adapters
 */
export function setContext(ctx: OakScriptContext): void {
  context = ctx;
  // Reset plot counter and clear active plots when context changes
  plotCounter = 0;
  clearPlots();
}

/**
 * Clear the global context
 * Call when detaching/removing an indicator
 */
export function clearContext(): void {
  clearPlots();
  context = null;
  calculateFn = null;
  plotCounter = 0;
}

/**
 * Get the current global context
 * @returns The current context or null if not set
 */
export function getContext(): OakScriptContext | null {
  return context;
}

/**
 * Register the calculate function for recalculation
 * Indicators call this to enable automatic recalculation on input changes
 * @param fn - The calculate function to register
 */
export function registerCalculate(fn: () => void): void {
  calculateFn = fn;
}

/**
 * Trigger recalculation of the current indicator
 * Clears existing plots and re-invokes the registered calculate function
 */
export function recalculate(): void {
  if (calculateFn) {
    clearPlots();
    plotCounter = 0;
    calculateFn();
  }
}

/**
 * Clear all active plots from the chart
 * Called internally before recalculation
 */
export function clearPlots(): void {
  if (context) {
    for (const plot of activePlots) {
      try {
        context.chart.removeSeries(plot.series);
      } catch {
        // Ignore errors during cleanup
      }
    }
  }
  activePlots.length = 0;
}

/**
 * Map plot style string to lightweight-charts series type
 * @param style - Plot style string
 * @returns Series type string
 */
function getSeriesType(style?: string): string {
  switch (style) {
    case 'histogram':
    case 'columns':
      return 'histogram';
    case 'area':
    case 'areabr':
      return 'area';
    case 'circles':
    case 'cross':
      return 'line'; // Use line with markers
    default:
      return 'line';
  }
}

/**
 * Map line style string to numeric value
 * @param style - Line style string
 * @returns Numeric line style
 */
function getLineStyle(style?: string): number {
  switch (style) {
    case 'dotted':
      return 1;
    case 'dashed':
      return 2;
    case 'solid':
    default:
      return 0;
  }
}

/**
 * Plot a series on the chart
 * @param series - Array of values to plot
 * @param title - Plot title (optional)
 * @param color - Plot color (optional)
 * @param linewidth - Line width (optional)
 * @param style - Plot style (optional)
 * @returns Unique plot ID for this plot
 */
export function plot(
  series: number[],
  title?: string,
  color?: string,
  linewidth?: number,
  style?: string
): string {
  if (!context) {
    throw new Error('OakScript context not set. Call setContext() before plotting.');
  }

  const plotId = `plot_${plotCounter++}${title ? '_' + title.replace(/\s+/g, '_') : ''}`;
  
  const seriesType = getSeriesType(style);
  const options: SeriesOptions = {
    color: color,
    lineWidth: linewidth,
    lineStyle: getLineStyle(style),
  };

  // Create series on chart
  const seriesHandle = context.chart.addSeries(seriesType, options);
  
  // Convert series data to time-value pairs
  const data: Array<{ time: number; value: number }> = [];
  for (let index = 0; index < series.length; index++) {
    const value = series[index];
    const time = context.ohlcv.time[index];
    if (time !== undefined && value !== undefined && !Number.isNaN(value)) {
      data.push({ time, value });
    }
  }

  // Set the data
  seriesHandle.setData(data);

  // Track the plot for cleanup
  activePlots.push({ id: plotId, series: seriesHandle });

  return plotId;
}

/**
 * Draw a horizontal line on the chart
 * @param price - Y-axis value for the line
 * @param title - Line title (optional)
 * @param color - Line color (optional)
 * @param linestyle - Line style (optional)
 * @param linewidth - Line width (optional)
 * @returns Unique hline ID
 */
export function hline(
  price: number,
  title?: string,
  color?: string,
  linestyle?: string,
  linewidth?: number
): string {
  if (!context) {
    throw new Error('OakScript context not set. Call setContext() before creating hlines.');
  }

  const hlineId = `hline_${plotCounter++}${title ? '_' + title.replace(/\s+/g, '_') : ''}`;

  const options: SeriesOptions = {
    color: color,
    lineWidth: linewidth,
    lineStyle: getLineStyle(linestyle),
  };

  // Create a line series for the hline
  const seriesHandle = context.chart.addSeries('line', options);

  // Create horizontal line data (constant value across all time points)
  const data = context.ohlcv.time.map(time => ({
    time: time,
    value: price,
  }));

  seriesHandle.setData(data);

  // Track the hline for cleanup
  activePlots.push({ id: hlineId, series: seriesHandle });

  return hlineId;
}

/**
 * Get the active plots array (for testing purposes)
 * @returns Array of active plots
 * @internal
 */
export function getActivePlots(): ReadonlyArray<ActivePlot> {
  return activePlots;
}
