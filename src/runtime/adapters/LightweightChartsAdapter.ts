/**
 * @fileoverview Lightweight-charts v5 adapter
 * Provides integration with lightweight-charts library
 * @module runtime/adapters/LightweightChartsAdapter
 */

import type { ChartAdapter, SeriesHandle, SeriesOptions } from '../types';

/**
 * Minimal interface for lightweight-charts chart API
 * Only includes methods used by this adapter
 */
interface LightweightChart {
  addSeries<T>(seriesDefinition: unknown, options?: unknown): LightweightSeries<T>;
  removeSeries(series: LightweightSeries<unknown>): void;
  panes(): unknown[];
}

/**
 * Minimal interface for lightweight-charts series
 */
interface LightweightSeries<T> {
  setData(data: T[]): void;
}

/**
 * Data point format for lightweight-charts
 */
interface TimeValueData {
  time: number;
  value: number;
}

/**
 * Adapter for lightweight-charts v5
 * Translates OakScriptJS chart operations into lightweight-charts API calls
 */
export class LightweightChartsAdapter implements ChartAdapter {
  private chart: LightweightChart;
  private mainSeries: SeriesHandle | undefined;
  private paneCount: number = 0;

  /**
   * Create a new LightweightChartsAdapter
   * @param chart - The lightweight-charts chart instance
   * @param mainSeries - Optional main price series (candlestick/line series)
   */
  constructor(chart: unknown, mainSeries?: unknown) {
    this.chart = chart as LightweightChart;
    if (mainSeries) {
      this.mainSeries = this.wrapSeries(mainSeries as LightweightSeries<TimeValueData>);
    }
  }

  /**
   * Wrap a lightweight-charts series to implement SeriesHandle
   * @param lwcSeries - The lightweight-charts series
   * @returns SeriesHandle wrapper
   */
  private wrapSeries(lwcSeries: LightweightSeries<TimeValueData>): SeriesHandle {
    return {
      setData: (data: Array<{ time: number; value: number }>) => {
        lwcSeries.setData(data);
      },
      // Store reference for removal
      _lwcSeries: lwcSeries,
    } as SeriesHandle & { _lwcSeries: LightweightSeries<TimeValueData> };
  }

  /**
   * Map series type string to lightweight-charts series definition
   * @param type - Series type ('line', 'histogram', 'area')
   * @returns Lightweight-charts series definition object
   */
  private getSeriesDefinition(type: string): { type: string } {
    switch (type) {
      case 'histogram':
        return { type: 'Histogram' };
      case 'area':
        return { type: 'Area' };
      case 'baseline':
        return { type: 'Baseline' };
      case 'bar':
        return { type: 'Bar' };
      case 'line':
      default:
        return { type: 'Line' };
    }
  }

  /**
   * Convert OakScriptJS series options to lightweight-charts options
   * @param options - OakScriptJS series options
   * @returns Lightweight-charts compatible options
   */
  private convertOptions(options?: SeriesOptions): Record<string, unknown> {
    if (!options) {
      return {};
    }

    const lwcOptions: Record<string, unknown> = {};

    if (options.color) {
      lwcOptions.color = options.color;
    }

    if (options.lineWidth !== undefined) {
      lwcOptions.lineWidth = options.lineWidth;
    }

    if (options.lineStyle !== undefined) {
      lwcOptions.lineStyle = options.lineStyle;
    }

    if (options.priceScaleId) {
      lwcOptions.priceScaleId = options.priceScaleId;
    }

    return lwcOptions;
  }

  /**
   * Add a new series to the chart
   * @param type - Series type ('line', 'histogram', 'area')
   * @param options - Series options
   * @returns SeriesHandle for the new series
   */
  addSeries(type: string, options?: SeriesOptions): SeriesHandle {
    const seriesDefinition = this.getSeriesDefinition(type);
    const lwcOptions = this.convertOptions(options);
    
    const lwcSeries = this.chart.addSeries(seriesDefinition, lwcOptions);
    return this.wrapSeries(lwcSeries);
  }

  /**
   * Remove a series from the chart
   * @param series - SeriesHandle to remove
   */
  removeSeries(series: SeriesHandle): void {
    const wrappedSeries = series as SeriesHandle & { _lwcSeries?: LightweightSeries<unknown> };
    if (wrappedSeries._lwcSeries) {
      this.chart.removeSeries(wrappedSeries._lwcSeries);
    }
  }

  /**
   * Get the main price series
   * @returns Main series handle or undefined
   */
  getMainSeries(): SeriesHandle | undefined {
    return this.mainSeries;
  }

  /**
   * Create a new pane (if supported by the chart configuration)
   * @returns Index of the new pane
   */
  createPane(): number {
    // Lightweight-charts v5 doesn't have a direct createPane API
    // Panes are typically created via chart configuration
    // This returns an incremented pane count for reference
    return ++this.paneCount;
  }
}
