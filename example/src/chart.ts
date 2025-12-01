/**
 * Chart Setup and Management
 * Creates and manages the LightweightCharts instance
 */

import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time,
  ColorType,
  LineStyle,
} from 'lightweight-charts';
import type { Bar } from '@deepentropy/oakscriptjs';
import { toCandlestickData } from './data-loader';

/**
 * Series configuration
 */
export interface SeriesConfig {
  color?: string;
  lineWidth?: number;
  lineStyle?: number;
}

/**
 * Chart wrapper class
 */
export class ChartManager {
  private chart: IChartApi;
  private candlestickSeries: ISeriesApi<'Candlestick'>;
  private indicatorSeries: Map<string, ISeriesApi<'Line'>> = new Map();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // Create chart with dark theme
    this.chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      crosshair: {
        mode: 1, // Normal mode
      },
      rightPriceScale: {
        borderColor: '#2b2b43',
      },
      timeScale: {
        borderColor: '#2b2b43',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series
    this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      this.chart.resize(width, height);
    });
    resizeObserver.observe(container);
  }

  /**
   * Set candlestick data
   */
  setCandlestickData(bars: Bar[]): void {
    const data = toCandlestickData(bars) as CandlestickData<Time>[];
    this.candlestickSeries.setData(data);
    this.chart.timeScale().fitContent();
  }

  /**
   * Add or update an indicator series
   */
  setIndicatorData(
    id: string,
    data: Array<{ time: number; value: number }>,
    config: SeriesConfig = {}
  ): void {
    let series = this.indicatorSeries.get(id);

    if (!series) {
      // Create new line series
      series = this.chart.addSeries(LineSeries, {
        color: config.color || '#2962FF',
        lineWidth: (config.lineWidth || 2) as 1 | 2 | 3 | 4,
        lineStyle: config.lineStyle ?? LineStyle.Solid,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      this.indicatorSeries.set(id, series);
    }

    // Set data
    const lineData = data as LineData<Time>[];
    series.setData(lineData);
  }

  /**
   * Remove an indicator series
   */
  removeIndicator(id: string): void {
    const series = this.indicatorSeries.get(id);
    if (series) {
      this.chart.removeSeries(series);
      this.indicatorSeries.delete(id);
    }
  }

  /**
   * Remove all indicator series
   */
  clearIndicators(): void {
    for (const [id, series] of this.indicatorSeries) {
      this.chart.removeSeries(series);
    }
    this.indicatorSeries.clear();
  }

  /**
   * Get the chart instance
   */
  getChart(): IChartApi {
    return this.chart;
  }

  /**
   * Fit content to view
   */
  fitContent(): void {
    this.chart.timeScale().fitContent();
  }
}
