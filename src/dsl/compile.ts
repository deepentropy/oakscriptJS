/**
 * @fileoverview compile() function - bridges DSL to Lightweight Charts
 * @module dsl/compile
 */

import { getContext, resetContext } from '../runtime/context';
import { IndicatorController } from '../indicator';
import type { IndicatorControllerInterface, IChartApi, ISeriesApi } from '../indicator';
import type { PlotMetadata, IndicatorMetadata as ControllerMetadata } from '../indicator';

/**
 * Compiled indicator object that can be bound to a chart
 */
export interface CompiledIndicator {
  /**
   * Bind the indicator to a chart
   * @param chart - Lightweight Charts instance
   * @param mainSeries - Main candlestick series
   * @param options - Optional user inputs/options
   * @returns IndicatorController for managing the indicator
   */
  bind(chart: IChartApi, mainSeries: ISeriesApi, options?: Record<string, any>): IndicatorControllerInterface;
}

/**
 * Compile registered indicator into chart-bindable object
 *
 * This function takes all registered metadata (indicator(), plot(), hline())
 * and creates an object that can be bound to a Lightweight Charts instance.
 *
 * @returns CompiledIndicator object with bind() method
 *
 * @example
 * ```typescript
 * // In indicator file
 * indicator("My Indicator");
 * const value = close.sub(open);
 * plot(value, {color: color.blue});
 * export default compile();
 *
 * // In application
 * import myIndicator from './indicators/my-indicator';
 * const controller = myIndicator.bind(chart, candlestickSeries);
 * controller.attach();
 * ```
 */
export function compile(): CompiledIndicator {
  const context = getContext();

  // Capture current state (indicator metadata, plots, hlines)
  const indicatorMeta = context.getIndicatorMetadata();
  const plots = context.getPlots();
  // const hlines = context.getHLines();
  // const inputs = context.getInputs();

  if (!indicatorMeta) {
    throw new Error('indicator() must be called before compile()');
  }

  if (plots.length === 0) {
    console.warn('No plots registered. Indicator will not display anything.');
  }

  return {
    bind(chart: IChartApi, mainSeries: ISeriesApi, options: Record<string, any> = {}): IndicatorControllerInterface {
      // Reset context for fresh execution
      resetContext();

      // Set user-provided input values
      context.setInputValues(options);

      // Convert plots to IndicatorController metadata format
      const plotMetadata: PlotMetadata[] = plots.map((plot, index) => ({
        varName: `plot${index}`,
        title: plot.title || `Plot ${index + 1}`,
        color: convertColor(plot.color),
        linewidth: plot.linewidth || 1,
        style: plot.style || 'line',
      }));

      // Create IndicatorController metadata
      const metadata: ControllerMetadata = {
        title: indicatorMeta.title,
        version: 6,
        overlay: indicatorMeta.overlay ?? false,
        description: '',
        plots: plotMetadata,
      };

      // Create calculation function
      const calculateFn = (data: any[], userOptions: any) => {
        // Set data in context
        context.setData(data);

        // Update input values if provided
        if (userOptions) {
          context.setInputValues(userOptions);
        }

        // Compute first plot (for now, single plot support)
        // TODO: Handle multiple plots
        if (plots.length > 0) {
          const firstPlot = plots[0]!;
          const values = firstPlot.series._compute();

          // Format for Lightweight Charts
          return data.map((bar, i) => ({
            time: bar.time,
            value: values[i],
          }));
        }

        return [];
      };

      // Create and return IndicatorController
      return new IndicatorController(
        chart,
        mainSeries,
        metadata,
        calculateFn,
        options
      );
    },
  };
}

/**
 * Convert DSL color to hex string
 * @param color - Color from DSL (could be color object or string)
 * @returns Hex color string
 */
function convertColor(color: any): string {
  if (!color) {
    return '#2962FF'; // Default TradingView blue
  }

  // If it's already a string (hex or named color)
  if (typeof color === 'string') {
    return color;
  }

  // If it's a color object with hex property
  if (color && typeof color === 'object' && 'hex' in color) {
    return color.hex;
  }

  // If it's a color object with rgb properties
  if (color && typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
    const r = Math.floor(color.r).toString(16).padStart(2, '0');
    const g = Math.floor(color.g).toString(16).padStart(2, '0');
    const b = Math.floor(color.b).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  return '#2962FF';
}
