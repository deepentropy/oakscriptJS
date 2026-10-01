/**
 * @fileoverview Lightweight-charts v5 adapter
 * Provides integration with lightweight-charts library
 * @module runtime/adapters/LightweightChartsAdapter
 */

import type { ChartAdapter, SeriesHandle, SeriesOptions } from '../types.js';

/**
 * Minimal interface for lightweight-charts chart API
 * Only includes methods used by this adapter
 */
interface LightweightChart {
  addSeries<T>(seriesDefinition: unknown, options?: unknown, paneIndex?: number): LightweightSeries<T>;
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
  color?: string;
}

/**
 * The lightweight-charts v5 series definitions the adapter creates series with. Pass the library's own exports
 * (`import { LineSeries, HistogramSeries } from 'lightweight-charts'`, or the whole module): OakScriptJS does not
 * import lightweight-charts itself. `LineSeries` is required; the others are needed only for the series types used.
 */
export interface LightweightSeriesDefinitions {
  LineSeries: unknown;
  HistogramSeries?: unknown;
  AreaSeries?: unknown;
  BaselineSeries?: unknown;
  BarSeries?: unknown;
}

/**
 * Adapter for lightweight-charts v5
 * Translates OakScriptJS chart operations into lightweight-charts API calls
 *
 * @example
 * ```typescript
 * import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
 *
 * const chart = createChart(container);
 * const candles = chart.addSeries(CandlestickSeries);
 * const adapter = new LightweightChartsAdapter(chart, { LineSeries, HistogramSeries }, candles);
 * ```
 */
export class LightweightChartsAdapter implements ChartAdapter {
  private chart: LightweightChart;
  private definitions: LightweightSeriesDefinitions;
  private mainSeries: SeriesHandle | undefined;
  private paneCount: number = 0;

  /**
   * Create a new LightweightChartsAdapter
   * @param chart - The lightweight-charts chart instance
   * @param definitions - The lightweight-charts series definitions (`LineSeries`, `HistogramSeries`...)
   * @param mainSeries - Optional main price series (candlestick/line series)
   */
  constructor(chart: unknown, definitions: LightweightSeriesDefinitions, mainSeries?: unknown) {
    if (!definitions?.LineSeries) {
      throw new Error(
        'LightweightChartsAdapter: pass the lightweight-charts series definitions, ' +
          "e.g. new LightweightChartsAdapter(chart, { LineSeries, HistogramSeries }) with the imports from 'lightweight-charts'."
      );
    }
    this.chart = chart as LightweightChart;
    this.definitions = definitions;
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
      setData: (data: Array<{ time: number; value: number; color?: string }>) => {
        lwcSeries.setData(data);
      },
      // Store reference for removal
      _lwcSeries: lwcSeries,
    } as SeriesHandle & { _lwcSeries: LightweightSeries<TimeValueData> };
  }

  /**
   * Map series type string to lightweight-charts series definition
   * @param type - Series type ('line', 'histogram', 'area', 'baseline', 'bar')
   * @returns Lightweight-charts series definition
   * @throws When the definition of that series type was not given to the constructor
   */
  private getSeriesDefinition(type: string): unknown {
    const key = (
      {
        histogram: 'HistogramSeries',
        area: 'AreaSeries',
        baseline: 'BaselineSeries',
        bar: 'BarSeries',
      } as const
    )[type as 'histogram' | 'area' | 'baseline' | 'bar'] ?? 'LineSeries';
    const definition = this.definitions[key];
    if (!definition) {
      throw new Error(`LightweightChartsAdapter: a '${type}' series needs ${key}; pass it in the constructor definitions.`);
    }
    return definition;
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
   * @param type - Series type ('line', 'histogram', 'area', 'baseline', 'bar')
   * @param options - Series options (`pane` is the lightweight-charts pane index)
   * @returns SeriesHandle for the new series
   */
  addSeries(type: string, options?: SeriesOptions): SeriesHandle {
    const seriesDefinition = this.getSeriesDefinition(type);
    const lwcOptions = this.convertOptions(options);

    const lwcSeries =
      options?.pane !== undefined
        ? this.chart.addSeries<TimeValueData>(seriesDefinition, lwcOptions, options.pane)
        : this.chart.addSeries<TimeValueData>(seriesDefinition, lwcOptions);
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
