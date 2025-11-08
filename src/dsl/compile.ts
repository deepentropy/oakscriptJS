/**
 * @fileoverview compile() function - bridges DSL to Lightweight Charts
 * @module dsl/compile
 */

import { getContext, resetContext } from '../runtime/context';
import { IndicatorController } from '../indicator';
import type { IndicatorControllerInterface, IChartApi, ISeriesApi } from '../indicator';
import type { PlotMetadata, IndicatorMetadata as ControllerMetadata } from '../indicator';

/**
 * Input metadata exposed to consumers
 */
export interface InputMetadata {
  type: 'int' | 'float' | 'bool' | 'string' | 'source';
  name: string;
  title: string;
  defval: any;
  minval?: number;
  maxval?: number;
  step?: number;
  tooltip?: string;
  inline?: string;
  group?: string;
  options?: any[];
}

/**
 * Complete indicator metadata exposed by compile()
 */
export interface IndicatorMetadata {
  title: string;
  shorttitle?: string;
  overlay: boolean;
  precision?: number;
  format?: string;
  timeframe?: string;
  timeframe_gaps?: boolean;
  inputs: InputMetadata[];
  plots: PlotMetadata[];
}

/**
 * Compiled indicator object that can be bound to a chart
 */
export interface CompiledIndicator {
  /**
   * Indicator metadata (accessible before binding)
   */
  metadata: IndicatorMetadata;

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

  // Capture current state (indicator metadata, plots, inputs)
  const indicatorMeta = context.getIndicatorMetadata();
  const plots = context.getPlots();
  const inputs = context.getInputs();

  if (!indicatorMeta) {
    throw new Error('indicator() must be called before compile()');
  }

  if (plots.length === 0) {
    console.warn('No plots registered. Indicator will not display anything.');
  }

  // Convert plots to metadata format
  const plotMetadata: PlotMetadata[] = plots.map((plot, index) => ({
    varName: `plot${index}`,
    title: plot.title || `Plot ${index + 1}`,
    color: convertColor(plot.color),
    linewidth: plot.linewidth || 1,
    style: plot.style || 'line',
  }));

  // Convert inputs to metadata format
  const inputMetadata: InputMetadata[] = Array.from(inputs.values()).map(input => ({
    type: input.type,
    name: input.name,
    title: input.title,
    defval: input.defval,
    minval: input.minval,
    maxval: input.maxval,
    step: input.step,
    tooltip: input.tooltip,
    inline: input.inline,
    group: input.group,
    options: input.options,
  }));

  // Build complete metadata
  const metadata: IndicatorMetadata = {
    title: indicatorMeta.title,
    shorttitle: indicatorMeta.shorttitle,
    overlay: indicatorMeta.overlay ?? false,
    precision: indicatorMeta.precision,
    format: indicatorMeta.format,
    timeframe: indicatorMeta.timeframe,
    timeframe_gaps: indicatorMeta.timeframe_gaps,
    inputs: inputMetadata,
    plots: plotMetadata,
  };

  return {
    metadata,  // Expose metadata

    bind(chart: IChartApi, mainSeries: ISeriesApi, options: Record<string, any> = {}): IndicatorControllerInterface {
      // Reset context for fresh execution
      resetContext();

      // Set user-provided input values
      context.setInputValues(options);

      // Create IndicatorController metadata (for internal use)
      const controllerMetadata: ControllerMetadata = {
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

        // Invalidate all Series caches when options change
        // This ensures recalculation with new input values
        plots.forEach(plot => {
          if (plot.series && typeof plot.series._invalidate === 'function') {
            plot.series._invalidate();
          }
        });

        // Compute first plot (for now, single plot support)
        // TODO: Handle multiple plots
        if (plots.length > 0) {
          const firstPlot = plots[0]!;
          const values = firstPlot.series._compute();

          // Filter out NaN values (PineScript's na)
          // Note: lightweight-charts always bridges gaps - there's no way to create
          // true breaks like PineScript's plot.style_linebr. We filter NaN values
          // to prevent errors, and the line will naturally bridge across missing data.
          return data
            .map((bar, i) => ({
              time: bar.time,
              value: values[i],
            }))
            .filter(point => !Number.isNaN(point.value));
        }

        return [];
      };

      // Create and return IndicatorController
      return new IndicatorController(
        chart,
        mainSeries,
        controllerMetadata,
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
