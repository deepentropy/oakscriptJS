/**
 * Plot namespace
 * Mirrors PineScript's plot functions
 *
 * TODO: Implement plotting functions
 * Note: These functions would output plot data rather than render
 */

import { series_float, simple_string, color } from '../types';

export interface PlotData {
  series: series_float;
  title?: simple_string;
  color?: color;
  linewidth?: number;
  style?: simple_string;
}

/**
 * Plots a series of data
 * @param series - Series to plot
 * @param title - Plot title
 * @param color - Plot color
 * @param linewidth - Line width
 * @param style - Line style
 */
export function plot(
  series: series_float,
  title?: simple_string,
  color?: color,
  linewidth?: number,
  style?: simple_string
): PlotData {
  return {
    series,
    title,
    color,
    linewidth,
    style,
  };
}

// TODO: Add more plot functions
// - plotshape()
// - plotchar()
// - plotarrow()
// - plotbar()
// - plotcandle()
// - bgcolor()
// - fill()
// - hline()
// - etc.
