/**
 * Mock for lightweight-charts module for Jest tests
 * This allows tests that don't use chart functionality to run without the actual library
 */

// Mock series type definitions
export const LineSeries = { type: 'Line' } as const;
export const HistogramSeries = { type: 'Histogram' } as const;
export const AreaSeries = { type: 'Area' } as const;
export const BarSeries = { type: 'Bar' } as const;
export const CandlestickSeries = { type: 'Candlestick' } as const;
export const BaselineSeries = { type: 'Baseline' } as const;

// Mock types
export type SeriesType = 'Line' | 'Histogram' | 'Area' | 'Bar' | 'Candlestick' | 'Baseline';

export interface SeriesDefinition<T extends SeriesType> {
  type: T;
}

export interface IChartApi {
  addSeries: jest.Mock;
  removeSeries: jest.Mock;
  panes: jest.Mock;
  remove: jest.Mock;
  [key: string]: any;
}

export interface ISeriesApi<T = any, HorzScaleItem = any> {
  data: jest.Mock;
  setData: jest.Mock;
  update: jest.Mock;
  subscribeDataChanged: jest.Mock;
  unsubscribeDataChanged: jest.Mock;
  [key: string]: any;
}

export const createChart = jest.fn(() => ({
  addSeries: jest.fn(),
  removeSeries: jest.fn(),
  panes: jest.fn(() => []),
  remove: jest.fn(),
}));

export default {
  LineSeries,
  HistogramSeries,
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  BaselineSeries,
  createChart,
};
