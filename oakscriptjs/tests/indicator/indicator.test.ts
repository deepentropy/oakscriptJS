/**
 * Tests for the indicator function and related utilities
 */

import { indicator, type IndicatorContext } from '../../src/indicator';
import { input } from '../../src/input';
import { plot, createPlot } from '../../src/plot';
import type { Bar } from '../../src/types';

// Sample bar data for testing
const sampleBars: Bar[] = [
  { time: 1000, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
  { time: 2000, open: 102, high: 108, low: 100, close: 107, volume: 1200 },
  { time: 3000, open: 107, high: 110, low: 104, close: 105, volume: 800 },
  { time: 4000, open: 105, high: 109, low: 103, close: 108, volume: 1500 },
  { time: 5000, open: 108, high: 112, low: 106, close: 110, volume: 1100 },
];

describe('indicator function', () => {
  describe('metadata handling', () => {
    it('should use provided metadata', () => {
      const TestIndicator = indicator({
        title: 'Test Indicator',
        shortTitle: 'TEST',
        overlay: true,
        format: 'price',
        precision: 4,
      }, () => {});

      const instance = new TestIndicator();
      expect(instance.metadata.title).toBe('Test Indicator');
      expect(instance.metadata.shortTitle).toBe('TEST');
      expect(instance.metadata.overlay).toBe(true);
      expect(instance.metadata.format).toBe('price');
      expect(instance.metadata.precision).toBe(4);
    });

    it('should use default values for optional metadata', () => {
      const TestIndicator = indicator({
        title: 'Simple Test',
      }, () => {});

      const instance = new TestIndicator();
      expect(instance.metadata.title).toBe('Simple Test');
      expect(instance.metadata.shortTitle).toBe('Simple Test');
      expect(instance.metadata.overlay).toBe(false);
      expect(instance.metadata.format).toBe('price');
      expect(instance.metadata.precision).toBe(2);
    });
  });

  describe('overlay and pane management', () => {
    it('should return paneIndex 0 for overlay indicators', () => {
      const OverlayIndicator = indicator({
        title: 'Overlay',
        overlay: true,
      }, () => {});

      const instance = new OverlayIndicator();
      expect(instance.isOverlay()).toBe(true);
      expect(instance.getPaneIndex()).toBe(0);
    });

    it('should return paneIndex > 0 for non-overlay indicators', () => {
      const SeparatePaneIndicator = indicator({
        title: 'Separate Pane',
        overlay: false,
      }, () => {});

      const instance = new SeparatePaneIndicator();
      expect(instance.isOverlay()).toBe(false);
      expect(instance.getPaneIndex()).toBe(1);
    });

    it('should default to non-overlay (separate pane)', () => {
      const DefaultIndicator = indicator({
        title: 'Default',
      }, () => {});

      const instance = new DefaultIndicator();
      expect(instance.isOverlay()).toBe(false);
      expect(instance.getPaneIndex()).toBe(1);
    });
  });

  describe('calculate function', () => {
    it('should call setup function with correct context', () => {
      let capturedCtx: IndicatorContext | null = null;

      const TestIndicator = indicator({
        title: 'Context Test',
      }, (ctx) => {
        capturedCtx = ctx;
      });

      const instance = new TestIndicator();
      instance.calculate(sampleBars);

      expect(capturedCtx).not.toBeNull();
      expect(capturedCtx!.data).toEqual(sampleBars);
      expect(capturedCtx!.open).toEqual([100, 102, 107, 105, 108]);
      expect(capturedCtx!.high).toEqual([105, 108, 110, 109, 112]);
      expect(capturedCtx!.low).toEqual([95, 100, 104, 103, 106]);
      expect(capturedCtx!.close).toEqual([102, 107, 105, 108, 110]);
      expect(capturedCtx!.volume).toEqual([1000, 1200, 800, 1500, 1100]);
      expect(capturedCtx!.time).toEqual([1000, 2000, 3000, 4000, 5000]);
    });

    it('should provide correct paneIndex in context', () => {
      let overlayPaneIndex: number | null = null;
      let separatePaneIndex: number | null = null;

      const OverlayIndicator = indicator({
        title: 'Overlay',
        overlay: true,
      }, (ctx) => {
        overlayPaneIndex = ctx.paneIndex;
      });

      const SeparateIndicator = indicator({
        title: 'Separate',
        overlay: false,
      }, (ctx) => {
        separatePaneIndex = ctx.paneIndex;
      });

      new OverlayIndicator().calculate(sampleBars);
      new SeparateIndicator().calculate(sampleBars);

      expect(overlayPaneIndex).toBe(0);
      expect(separatePaneIndex).toBe(1);
    });
  });

  describe('input management', () => {
    it('should return empty inputs by default', () => {
      const TestIndicator = indicator({
        title: 'Test',
      }, () => {});

      const instance = new TestIndicator();
      expect(instance.getInputs()).toEqual([]);
    });

    it('should update and get input values', () => {
      const TestIndicator = indicator({
        title: 'Test',
      }, () => {});

      const instance = new TestIndicator();
      instance.updateInputs({ length: 14, source: 'close' });
      
      const values = instance.getInputValues();
      expect(values.length).toBe(14);
      expect(values.source).toBe('close');
    });

    it('should merge input values on update', () => {
      const TestIndicator = indicator({
        title: 'Test',
      }, () => {});

      const instance = new TestIndicator();
      instance.updateInputs({ length: 14 });
      instance.updateInputs({ source: 'high' });
      
      const values = instance.getInputValues();
      expect(values.length).toBe(14);
      expect(values.source).toBe('high');
    });
  });
});

describe('input helpers', () => {
  describe('input.int', () => {
    it('should create integer input with defaults', () => {
      const inp = input.int(14);
      expect(inp.type).toBe('int');
      expect(inp.defaultValue).toBe(14);
      expect(inp.value).toBe(14);
      expect(inp.step).toBe(1);
    });

    it('should accept options', () => {
      const inp = input.int(10, { min: 1, max: 100, step: 5, title: 'Length' });
      expect(inp.min).toBe(1);
      expect(inp.max).toBe(100);
      expect(inp.step).toBe(5);
      expect(inp.title).toBe('Length');
    });
  });

  describe('input.float', () => {
    it('should create float input with defaults', () => {
      const inp = input.float(2.5);
      expect(inp.type).toBe('float');
      expect(inp.defaultValue).toBe(2.5);
      expect(inp.value).toBe(2.5);
      expect(inp.step).toBe(0.1);
    });

    it('should accept options', () => {
      const inp = input.float(1.0, { min: 0.1, max: 10, step: 0.5, title: 'Multiplier' });
      expect(inp.min).toBe(0.1);
      expect(inp.max).toBe(10);
      expect(inp.step).toBe(0.5);
      expect(inp.title).toBe('Multiplier');
    });
  });

  describe('input.source', () => {
    it('should create source input with default close', () => {
      const inp = input.source();
      expect(inp.type).toBe('source');
      expect(inp.defaultValue).toBe('close');
      expect(inp.value).toBe('close');
      expect(inp.options).toContain('close');
      expect(inp.options).toContain('high');
      expect(inp.options).toContain('low');
    });

    it('should accept different default source', () => {
      const inp = input.source('high', { title: 'Price Source' });
      expect(inp.defaultValue).toBe('high');
      expect(inp.value).toBe('high');
      expect(inp.title).toBe('Price Source');
    });
  });

  describe('input.bool', () => {
    it('should create boolean input', () => {
      const inp = input.bool(true);
      expect(inp.type).toBe('bool');
      expect(inp.defaultValue).toBe(true);
      expect(inp.value).toBe(true);
    });

    it('should accept title option', () => {
      const inp = input.bool(false, { title: 'Show Signal' });
      expect(inp.value).toBe(false);
      expect(inp.title).toBe('Show Signal');
    });
  });

  describe('input.string', () => {
    it('should create string input', () => {
      const inp = input.string('SMA');
      expect(inp.type).toBe('string');
      expect(inp.defaultValue).toBe('SMA');
      expect(inp.value).toBe('SMA');
    });

    it('should accept options for dropdown', () => {
      const inp = input.string('SMA', { title: 'MA Type', options: ['SMA', 'EMA', 'WMA'] });
      expect(inp.options).toEqual(['SMA', 'EMA', 'WMA']);
      expect(inp.title).toBe('MA Type');
    });
  });
});

describe('plot helpers', () => {
  const times = [1000, 2000, 3000, 4000, 5000];

  describe('plot function', () => {
    it('should convert values and times to time-value pairs', () => {
      const values = [10, 20, 30, 40, 50];
      const result = plot(values, times);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ time: 1000, value: 10 });
      expect(result[4]).toEqual({ time: 5000, value: 50 });
    });

    it('should filter out null values', () => {
      const values = [10, null, 30, null, 50];
      const result = plot(values, times);
      
      expect(result).toHaveLength(3);
      expect(result.map(r => r.value)).toEqual([10, 30, 50]);
    });

    it('should filter out NaN values', () => {
      const values = [10, NaN, 30, NaN, 50];
      const result = plot(values, times);
      
      expect(result).toHaveLength(3);
      expect(result.map(r => r.value)).toEqual([10, 30, 50]);
    });

    it('should handle empty arrays', () => {
      const result = plot([], []);
      expect(result).toEqual([]);
    });

    it('should handle offset', () => {
      const values = [10, 20, 30];
      const result = plot(values, times, { offset: 1 });
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ time: 2000, value: 10 });
      expect(result[2]).toEqual({ time: 4000, value: 30 });
    });

    it('should skip values with out-of-bounds time indices', () => {
      const values = [10, 20, 30, 40, 50, 60, 70]; // More values than times
      const result = plot(values, times);
      
      expect(result).toHaveLength(5); // Only 5 time points available
    });

    it('should handle negative offset', () => {
      const values = [10, 20, 30, 40, 50];
      const result = plot(values, times, { offset: -1 });
      
      // First value (index 0 + offset -1 = -1) should be skipped
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ time: 1000, value: 20 }); // value at index 1, time at index 0
    });
  });

  describe('createPlot function', () => {
    it('should create a named plot result', () => {
      const values = [10, 20, 30];
      const result = createPlot('sma', values, times.slice(0, 3), { color: '#FF0000' });
      
      expect(result.id).toBe('sma');
      expect(result.data).toHaveLength(3);
      expect(result.options.color).toBe('#FF0000');
    });

    it('should include all plot data', () => {
      const values = [10, 20, 30, 40, 50];
      const result = createPlot('test', values, times, {
        color: '#2196F3',
        title: 'Test Plot',
        lineWidth: 2,
      });
      
      expect(result.id).toBe('test');
      expect(result.data).toHaveLength(5);
      expect(result.options).toEqual({
        color: '#2196F3',
        title: 'Test Plot',
        lineWidth: 2,
      });
    });
  });
});

describe('integration: indicator with inputs and plot', () => {
  it('should create a functional indicator', () => {
    let calculatedValues: number[] = [];
    
    const SMAIndicator = indicator({
      title: 'Simple Moving Average',
      shortTitle: 'SMA',
      overlay: true,
    }, (ctx) => {
      const length = input.int(3, { min: 1, title: 'Length' });
      
      // Simple SMA calculation
      calculatedValues = ctx.close.map((_, i) => {
        if (i < length.value - 1) return NaN;
        let sum = 0;
        for (let j = 0; j < length.value; j++) {
          sum += ctx.close[i - j];
        }
        return sum / length.value;
      });
    });

    const instance = new SMAIndicator();
    instance.calculate(sampleBars);

    // With length 3: NaN, NaN, avg(102,107,105), avg(107,105,108), avg(105,108,110)
    expect(calculatedValues).toHaveLength(5);
    expect(Number.isNaN(calculatedValues[0])).toBe(true);
    expect(Number.isNaN(calculatedValues[1])).toBe(true);
    expect(calculatedValues[2]).toBeCloseTo((102 + 107 + 105) / 3);
    expect(calculatedValues[3]).toBeCloseTo((107 + 105 + 108) / 3);
    expect(calculatedValues[4]).toBeCloseTo((105 + 108 + 110) / 3);
  });
});
