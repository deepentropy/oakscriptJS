/**
 * Tests for runtime context management and plot functions
 */

import {
  setContext,
  clearContext,
  getContext,
  registerCalculate,
  recalculate,
  plot,
  hline,
  clearPlots,
  getActivePlots,
} from '../../src/runtime/runtime';
import type { OakScriptContext, ChartAdapter, SeriesHandle, SeriesOptions } from '../../src/runtime/types';
import { SimpleInputAdapter } from '../../src/runtime/adapters/SimpleInputAdapter';

// Mock chart adapter
function createMockChartAdapter(): ChartAdapter & { 
  addedSeries: Array<{ type: string; options?: SeriesOptions; data: Array<{ time: number; value: number }> }>;
  removedSeries: SeriesHandle[];
} {
  const addedSeries: Array<{ type: string; options?: SeriesOptions; data: Array<{ time: number; value: number }> }> = [];
  const removedSeries: SeriesHandle[] = [];

  return {
    addedSeries,
    removedSeries,
    addSeries(type: string, options?: SeriesOptions): SeriesHandle {
      const seriesRecord = { type, options, data: [] as Array<{ time: number; value: number }> };
      addedSeries.push(seriesRecord);
      return {
        setData(data: Array<{ time: number; value: number }>) {
          seriesRecord.data = data;
        },
      };
    },
    removeSeries(series: SeriesHandle) {
      removedSeries.push(series);
    },
  };
}

// Create a sample context
function createMockContext(): OakScriptContext & { 
  mockChart: ReturnType<typeof createMockChartAdapter>;
} {
  const mockChart = createMockChartAdapter();
  return {
    chart: mockChart,
    mockChart,
    inputs: new SimpleInputAdapter(),
    ohlcv: {
      time: [1000, 2000, 3000, 4000, 5000],
      open: [100, 101, 102, 103, 104],
      high: [105, 106, 107, 108, 109],
      low: [95, 96, 97, 98, 99],
      close: [102, 103, 104, 105, 106],
      volume: [1000, 1100, 1200, 1300, 1400],
    },
    bar_index: 4,
  };
}

describe('Runtime Context Management', () => {
  afterEach(() => {
    clearContext();
  });

  describe('setContext', () => {
    it('should set the global context', () => {
      const ctx = createMockContext();
      setContext(ctx);
      expect(getContext()).toBe(ctx);
    });

    it('should clear previous plots when context is set', () => {
      const ctx1 = createMockContext();
      setContext(ctx1);
      plot([1, 2, 3, 4, 5], 'Test');

      const ctx2 = createMockContext();
      setContext(ctx2);

      expect(getActivePlots().length).toBe(0);
    });
  });

  describe('clearContext', () => {
    it('should clear the global context', () => {
      const ctx = createMockContext();
      setContext(ctx);
      clearContext();
      expect(getContext()).toBeNull();
    });

    it('should clear active plots', () => {
      const ctx = createMockContext();
      setContext(ctx);
      plot([1, 2, 3, 4, 5], 'Test');
      
      clearContext();
      expect(getActivePlots().length).toBe(0);
    });
  });

  describe('getContext', () => {
    it('should return null when no context is set', () => {
      expect(getContext()).toBeNull();
    });

    it('should return the current context', () => {
      const ctx = createMockContext();
      setContext(ctx);
      expect(getContext()).toBe(ctx);
    });
  });
});

describe('Calculate Registration and Recalculation', () => {
  afterEach(() => {
    clearContext();
  });

  describe('registerCalculate', () => {
    it('should register a calculate function', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const calculateFn = jest.fn();
      registerCalculate(calculateFn);

      // Calling recalculate should invoke the function
      recalculate();
      expect(calculateFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('recalculate', () => {
    it('should clear plots before recalculating', () => {
      const ctx = createMockContext();
      setContext(ctx);

      plot([1, 2, 3, 4, 5], 'Test');
      expect(getActivePlots().length).toBe(1);

      const calculateFn = jest.fn();
      registerCalculate(calculateFn);
      recalculate();

      // Plots should have been cleared before calling calculateFn
      // The mock function doesn't add new plots, so count should be 0
      expect(getActivePlots().length).toBe(0);
    });

    it('should do nothing if no calculate function is registered', () => {
      const ctx = createMockContext();
      setContext(ctx);
      
      // Should not throw
      expect(() => recalculate()).not.toThrow();
    });
  });
});

describe('Plot Functions', () => {
  afterEach(() => {
    clearContext();
  });

  describe('plot', () => {
    it('should throw if no context is set', () => {
      expect(() => plot([1, 2, 3], 'Test')).toThrow('OakScript context not set');
    });

    it('should add a line series to the chart', () => {
      const ctx = createMockContext();
      setContext(ctx);

      plot([1, 2, 3, 4, 5], 'SMA');

      expect(ctx.mockChart.addedSeries.length).toBe(1);
      expect(ctx.mockChart.addedSeries[0]!.type).toBe('line');
    });

    it('should return a unique plot ID', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const id1 = plot([1, 2, 3, 4, 5], 'SMA');
      const id2 = plot([2, 3, 4, 5, 6], 'EMA');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('SMA');
      expect(id2).toContain('EMA');
    });

    it('should track active plots', () => {
      const ctx = createMockContext();
      setContext(ctx);

      plot([1, 2, 3, 4, 5], 'SMA');
      plot([2, 3, 4, 5, 6], 'EMA');

      expect(getActivePlots().length).toBe(2);
    });

    it('should pass color and linewidth options', () => {
      const ctx = createMockContext();
      setContext(ctx);

      plot([1, 2, 3, 4, 5], 'Test', '#FF0000', 2);

      expect(ctx.mockChart.addedSeries[0]!.options?.color).toBe('#FF0000');
      expect(ctx.mockChart.addedSeries[0]!.options?.lineWidth).toBe(2);
    });

    it('should map histogram style correctly', () => {
      const ctx = createMockContext();
      setContext(ctx);

      plot([1, 2, 3, 4, 5], 'Volume', undefined, undefined, 'histogram');

      expect(ctx.mockChart.addedSeries[0]!.type).toBe('histogram');
    });

    it('should set time-value data on the series', () => {
      const ctx = createMockContext();
      setContext(ctx);

      plot([10, 20, 30, 40, 50], 'Test');

      const seriesData = ctx.mockChart.addedSeries[0]!.data;
      expect(seriesData.length).toBe(5);
      expect(seriesData[0]).toEqual({ time: 1000, value: 10 });
      expect(seriesData[4]).toEqual({ time: 5000, value: 50 });
    });

    it('should filter out NaN values', () => {
      const ctx = createMockContext();
      setContext(ctx);

      plot([10, NaN, 30, NaN, 50], 'Test');

      const seriesData = ctx.mockChart.addedSeries[0]!.data;
      expect(seriesData.length).toBe(3);
      expect(seriesData.map(d => d.value)).toEqual([10, 30, 50]);
    });
  });

  describe('hline', () => {
    it('should throw if no context is set', () => {
      expect(() => hline(50, 'Test')).toThrow('OakScript context not set');
    });

    it('should add a horizontal line series', () => {
      const ctx = createMockContext();
      setContext(ctx);

      hline(50, 'Support');

      expect(ctx.mockChart.addedSeries.length).toBe(1);
      expect(ctx.mockChart.addedSeries[0]!.type).toBe('line');
    });

    it('should create constant value data across all time points', () => {
      const ctx = createMockContext();
      setContext(ctx);

      hline(50, 'Support');

      const seriesData = ctx.mockChart.addedSeries[0]!.data;
      expect(seriesData.length).toBe(5);
      seriesData.forEach(point => {
        expect(point.value).toBe(50);
      });
    });

    it('should return a unique hline ID', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const id1 = hline(50, 'Support');
      const id2 = hline(70, 'Resistance');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('hline');
      expect(id2).toContain('hline');
    });

    it('should track active hlines', () => {
      const ctx = createMockContext();
      setContext(ctx);

      hline(50, 'Support');
      hline(70, 'Resistance');

      expect(getActivePlots().length).toBe(2);
    });
  });

  describe('clearPlots', () => {
    it('should remove all active plots from chart', () => {
      const ctx = createMockContext();
      setContext(ctx);

      plot([1, 2, 3, 4, 5], 'SMA');
      plot([2, 3, 4, 5, 6], 'EMA');
      hline(50, 'Support');

      expect(getActivePlots().length).toBe(3);

      clearPlots();

      expect(getActivePlots().length).toBe(0);
      expect(ctx.mockChart.removedSeries.length).toBe(3);
    });

    it('should handle clearing when no context is set', () => {
      // No context, no error
      expect(() => clearPlots()).not.toThrow();
    });
  });
});
