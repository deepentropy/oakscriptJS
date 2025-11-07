/**
 * @fileoverview IndicatorController for managing technical indicators with Lightweight Charts
 * @module indicator
 */

import type { SeriesType, SeriesDefinition } from 'lightweight-charts';
import { LineSeries, HistogramSeries, AreaSeries } from 'lightweight-charts';

/**
 * Metadata for a single plot line in an indicator
 */
export interface PlotMetadata {
  /** Variable name for the plot */
  varName: string;
  /** Display title for the plot */
  title: string;
  /** Pine color name (e.g., 'red', 'blue', 'green') */
  color: string;
  /** Line width for the plot */
  linewidth: number;
  /** Plot style type */
  style: 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns';
}

/**
 * Complete metadata describing an indicator
 */
export interface IndicatorMetadata {
  /** Indicator title */
  title: string;
  /** PineScript version */
  version: number;
  /** Whether the indicator overlays the main chart */
  overlay: boolean;
  /** Description of what the indicator does */
  description: string;
  /** Array of plots to display */
  plots: PlotMetadata[];
}

/**
 * Interface for controlling an indicator's lifecycle
 */
export interface IndicatorControllerInterface {
  /** Attach the indicator to the chart */
  attach(): void;
  /** Detach the indicator from the chart */
  detach(): void;
  /** Update the indicator with latest data */
  update(): void;
  /** Update indicator options and recalculate */
  setOptions(options: any): void;
}

/**
 * Type definition for Lightweight Charts IChartApi
 * @external
 */
export type IChartApi = import('lightweight-charts').IChartApi;

/**
 * Type definition for Lightweight Charts ISeriesApi
 * @external
 */
export type ISeriesApi = import('lightweight-charts').ISeriesApi<any>;

/**
 * Controller class for managing indicator lifecycle and rendering
 */
export class IndicatorController implements IndicatorControllerInterface {
  private chart: IChartApi;
  private mainSeries: ISeriesApi;
  private metadata: IndicatorMetadata;
  private calculateFn: (data: any[], options: any) => any[];
  private options: any;
  private series: ISeriesApi[] = [];
  private attached: boolean = false;

  /**
   * Create a new IndicatorController
   *
   * @param chart - Lightweight Charts IChartApi instance
   * @param mainSeries - Main series (typically candlestick) to attach to
   * @param metadata - Indicator metadata defining plots and behavior
   * @param calculateFn - Function to calculate indicator values from OHLCV data
   * @param options - Optional configuration options for the calculation
   *
   * @example
   * ```typescript
   * const controller = new IndicatorController(
   *   chart,
   *   candlestickSeries,
   *   {
   *     title: 'Moving Average',
   *     version: 6,
   *     overlay: true,
   *     description: 'Simple moving average',
   *     plots: [{
   *       varName: 'ma',
   *       title: 'MA',
   *       color: 'blue',
   *       linewidth: 2,
   *       style: 'line'
   *     }]
   *   },
   *   (data, options) => calculateMA(data, options),
   *   { length: 20 }
   * );
   * controller.attach();
   * ```
   */
  constructor(
    chart: IChartApi,
    mainSeries: ISeriesApi,
    metadata: IndicatorMetadata,
    calculateFn: (data: any[], options: any) => any[],
    options: any = {}
  ) {
    this.chart = chart;
    this.mainSeries = mainSeries;
    this.metadata = metadata;
    this.calculateFn = calculateFn;
    this.options = options;
  }

  /**
   * Attach the indicator to the chart
   *
   * Creates series for each plot, subscribes to data changes,
   * and performs initial calculation.
   */
  attach(): void {
    if (this.attached) return;

    const paneIndex = this.metadata.overlay ? 0 : 1;

    // Create series for each plot
    this.metadata.plots.forEach((plot, idx) => {
      const seriesOptions = this.createSeriesOptions(plot);
      const seriesType = this.getSeriesType(plot.style);

      const series = this.chart.addSeries(seriesType, seriesOptions, paneIndex);
      this.series[idx] = series;
    });

    // Subscribe to data changes with bound update method
    this.mainSeries.subscribeDataChanged(this.update);

    this.attached = true;
    this.update();

    // Set pane heights if not overlay
    if (!this.metadata.overlay) {
      const panes = this.chart.panes();
      if (panes && panes.length > 1) {
        panes[0]!.setHeight(400); // Main chart
        panes[1]!.setHeight(200); // Indicator pane
      }
    }
  }

  /**
   * Detach the indicator from the chart
   *
   * Unsubscribes from data changes and removes all series.
   */
  detach(): void {
    if (!this.attached) return;

    // Unsubscribe from data changes
    this.mainSeries.unsubscribeDataChanged(this.update);

    // Remove all series
    this.series.forEach(series => {
      if (series) {
        this.chart.removeSeries(series);
      }
    });
    this.series = [];

    this.attached = false;
  }

  /**
   * Update indicator data based on current chart data
   *
   * Calls the calculation function with latest data and updates series.
   * Bound as arrow function to maintain 'this' context in subscriptions.
   */
  update = (): void => {
    if (!this.attached) return;

    try {
      const sourceData = this.mainSeries.data();
      // Convert readonly array to mutable array for calculation function
      const indicatorValues = this.calculateFn([...sourceData], this.options);

      // For single plot indicators
      if (this.series[0] && indicatorValues) {
        this.series[0].setData(indicatorValues);
      }

      // TODO: Handle multiple plots (would need calculateFn to return array of datasets)
    } catch (error) {
      console.error('Error updating indicator:', error);
    }
  }

  /**
   * Update indicator options and recalculate
   *
   * @param newOptions - New options to merge with existing options
   */
  setOptions(newOptions: any): void {
    this.options = { ...this.options, ...newOptions };
    this.update();
  }

  /**
   * Create series options for a plot
   *
   * @param plot - Plot metadata
   * @returns Series configuration object for Lightweight Charts
   */
  private createSeriesOptions(plot: PlotMetadata): any {
    return {
      color: this.pineColorToHex(plot.color),
      lineWidth: plot.linewidth || 2,
      title: plot.title,
    };
  }

  /**
   * Map Pine plot style to Lightweight Charts series type
   *
   * @param style - Pine plot style name
   * @returns Lightweight Charts series definition (v5 API)
   */
  private getSeriesType(style: string): SeriesDefinition<SeriesType> {
    // Map Pine plot styles to Lightweight Charts v5 series types
    // v5 requires actual series definition objects, not string identifiers
    switch (style) {
      case 'histogram':
        return HistogramSeries;
      case 'area':
        return AreaSeries;
      case 'line':
      case 'stepline':
      default:
        return LineSeries;
    }
  }

  /**
   * Convert Pine color name to hex color code
   *
   * @param color - Pine color name (e.g., 'red', 'blue')
   * @returns Hex color code (e.g., '#FF0000')
   */
  private pineColorToHex(color: string): string {
    const colorMap: Record<string, string> = {
      red: '#FF0000',
      green: '#00FF00',
      blue: '#0000FF',
      yellow: '#FFFF00',
      orange: '#FFA500',
      purple: '#800080',
      white: '#FFFFFF',
      black: '#000000',
      gray: '#808080',
      grey: '#808080',
      aqua: '#00FFFF',
      lime: '#00FF00',
      maroon: '#800000',
      navy: '#000080',
      olive: '#808000',
      teal: '#008080',
      fuchsia: '#FF00FF',
      silver: '#C0C0C0',
    };

    // If it's already a hex color, return as-is
    if (color.startsWith('#')) {
      return color;
    }

    // Look up Pine color name, default to TradingView blue
    return colorMap[color.toLowerCase()] || '#2962FF';
  }
}

/**
 * Factory function to create an indicator controller
 *
 * @param chart - Lightweight Charts IChartApi instance
 * @param mainSeries - Main series (typically candlestick) to attach to
 * @param metadata - Indicator metadata defining plots and behavior
 * @param calculateFn - Function to calculate indicator values from OHLCV data
 * @param options - Optional configuration options for the calculation
 * @returns IndicatorControllerInterface for managing the indicator
 *
 * @example
 * ```typescript
 * import { createIndicator } from '@deepentropy/oakscriptjs';
 *
 * const bopIndicator = createIndicator(
 *   chart,
 *   candlestickSeries,
 *   {
 *     title: 'Balance of Power',
 *     version: 6,
 *     overlay: false,
 *     description: 'Measures buyer vs seller strength',
 *     plots: [{
 *       varName: 'bop',
 *       title: 'BOP',
 *       color: 'red',
 *       linewidth: 2,
 *       style: 'line'
 *     }]
 *   },
 *   (data) => data.map(bar => ({
 *     time: bar.time,
 *     value: (bar.close - bar.open) / (bar.high - bar.low)
 *   })),
 *   {}
 * );
 *
 * bopIndicator.attach();
 * ```
 */
export function createIndicator(
  chart: IChartApi,
  mainSeries: ISeriesApi,
  metadata: IndicatorMetadata,
  calculateFn: (data: any[], options: any) => any[],
  options: any = {}
): IndicatorControllerInterface {
  return new IndicatorController(chart, mainSeries, metadata, calculateFn, options);
}
