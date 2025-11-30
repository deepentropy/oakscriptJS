/**
 * Tests for idempotent input registration functions
 */

import {
  input_int,
  input_float,
  input_bool,
  input_string,
  input_source,
  resetInputs,
} from '../../src/runtime/inputs';
import {
  setContext,
  clearContext,
} from '../../src/runtime/runtime';
import type { OakScriptContext } from '../../src/runtime/types';
import { SimpleInputAdapter } from '../../src/runtime/adapters/SimpleInputAdapter';

// Create a sample context
function createMockContext(): OakScriptContext {
  const mockChart = {
    addSeries: jest.fn(() => ({ setData: jest.fn() })),
    removeSeries: jest.fn(),
  };

  return {
    chart: mockChart,
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

describe('Input Functions', () => {
  beforeEach(() => {
    clearContext();
    resetInputs();
  });

  afterEach(() => {
    clearContext();
    resetInputs();
  });

  describe('input_int', () => {
    it('should return default value when no context is set', () => {
      const value = input_int(14, 'Length');
      expect(value).toBe(14);
    });

    it('should floor the default value', () => {
      const value = input_int(14.7, 'Length');
      expect(value).toBe(14);
    });

    it('should register input and return default value on first call', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_int(14, 'Length');
      expect(value).toBe(14);
    });

    it('should be idempotent - return same value on subsequent calls', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value1 = input_int(14, 'Length');
      const value2 = input_int(14, 'Length');
      const value3 = input_int(14, 'Length');

      expect(value1).toBe(14);
      expect(value2).toBe(14);
      expect(value3).toBe(14);
    });

    it('should return updated value after user changes it', () => {
      const ctx = createMockContext();
      setContext(ctx);

      input_int(14, 'Length');
      
      // Simulate user changing the value
      ctx.inputs.setValue('Length', 20);

      // Subsequent call should return updated value
      const value = input_int(14, 'Length');
      expect(value).toBe(20);
    });

    it('should pass options to input config', () => {
      const ctx = createMockContext();
      const inputAdapter = ctx.inputs as SimpleInputAdapter;
      setContext(ctx);

      input_int(14, 'Length', { min: 1, max: 100, step: 1 });

      const inputs = inputAdapter.getAllInputs();
      const lengthInput = inputs.get('Length');
      expect(lengthInput?.config.min).toBe(1);
      expect(lengthInput?.config.max).toBe(100);
      expect(lengthInput?.config.step).toBe(1);
    });
  });

  describe('input_float', () => {
    it('should return default value when no context is set', () => {
      const value = input_float(2.5, 'Factor');
      expect(value).toBe(2.5);
    });

    it('should register input and return default value on first call', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_float(2.5, 'Factor');
      expect(value).toBe(2.5);
    });

    it('should be idempotent', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value1 = input_float(2.5, 'Factor');
      const value2 = input_float(2.5, 'Factor');

      expect(value1).toBe(2.5);
      expect(value2).toBe(2.5);
    });

    it('should return updated value after user changes it', () => {
      const ctx = createMockContext();
      setContext(ctx);

      input_float(2.5, 'Factor');
      ctx.inputs.setValue('Factor', 3.0);

      const value = input_float(2.5, 'Factor');
      expect(value).toBe(3.0);
    });
  });

  describe('input_bool', () => {
    it('should return default value when no context is set', () => {
      const value = input_bool(true, 'Show Labels');
      expect(value).toBe(true);
    });

    it('should register input and return default value on first call', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_bool(true, 'Show Labels');
      expect(value).toBe(true);
    });

    it('should be idempotent', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value1 = input_bool(true, 'Show Labels');
      const value2 = input_bool(true, 'Show Labels');

      expect(value1).toBe(true);
      expect(value2).toBe(true);
    });

    it('should return updated value after user changes it', () => {
      const ctx = createMockContext();
      setContext(ctx);

      input_bool(true, 'Show Labels');
      ctx.inputs.setValue('Show_Labels', false);

      const value = input_bool(true, 'Show Labels');
      expect(value).toBe(false);
    });
  });

  describe('input_string', () => {
    it('should return default value when no context is set', () => {
      const value = input_string('SMA', 'MA Type');
      expect(value).toBe('SMA');
    });

    it('should register input and return default value on first call', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_string('SMA', 'MA Type', ['SMA', 'EMA', 'WMA']);
      expect(value).toBe('SMA');
    });

    it('should be idempotent', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value1 = input_string('SMA', 'MA Type');
      const value2 = input_string('SMA', 'MA Type');

      expect(value1).toBe('SMA');
      expect(value2).toBe('SMA');
    });

    it('should return updated value after user changes it', () => {
      const ctx = createMockContext();
      setContext(ctx);

      input_string('SMA', 'MA Type', ['SMA', 'EMA', 'WMA']);
      ctx.inputs.setValue('MA_Type', 'EMA');

      const value = input_string('SMA', 'MA Type');
      expect(value).toBe('EMA');
    });
  });

  describe('input_source', () => {
    it('should return empty array when no context is set', () => {
      const value = input_source('close', 'Source');
      expect(value).toEqual([]);
    });

    it('should return close data by default', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_source('close', 'Source');
      expect(value).toEqual([102, 103, 104, 105, 106]);
    });

    it('should return open data when selected', () => {
      const ctx = createMockContext();
      setContext(ctx);

      input_source('open', 'Source');
      const value = input_source('open', 'Source');
      expect(value).toEqual([100, 101, 102, 103, 104]);
    });

    it('should return high data', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_source('high', 'Source');
      expect(value).toEqual([105, 106, 107, 108, 109]);
    });

    it('should return low data', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_source('low', 'Source');
      expect(value).toEqual([95, 96, 97, 98, 99]);
    });

    it('should return volume data', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_source('volume', 'Source');
      expect(value).toEqual([1000, 1100, 1200, 1300, 1400]);
    });

    it('should calculate hl2', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_source('hl2', 'Source');
      // hl2 = (high + low) / 2
      expect(value).toEqual([100, 101, 102, 103, 104]);
    });

    it('should calculate hlc3', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_source('hlc3', 'Source');
      // hlc3 = (high + low + close) / 3
      // For first bar: (105 + 95 + 102) / 3 = 100.67
      expect(value[0]).toBeCloseTo(100.67, 1);
    });

    it('should calculate ohlc4', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value = input_source('ohlc4', 'Source');
      // ohlc4 = (open + high + low + close) / 4
      // For first bar: (100 + 105 + 95 + 102) / 4 = 100.5
      expect(value[0]).toBeCloseTo(100.5, 1);
    });

    it('should return updated source after user changes it', () => {
      const ctx = createMockContext();
      setContext(ctx);

      input_source('close', 'Source');
      ctx.inputs.setValue('Source', 'open');

      const value = input_source('close', 'Source');
      expect(value).toEqual([100, 101, 102, 103, 104]);
    });

    it('should be idempotent', () => {
      const ctx = createMockContext();
      setContext(ctx);

      const value1 = input_source('close', 'Source');
      const value2 = input_source('close', 'Source');

      expect(value1).toEqual([102, 103, 104, 105, 106]);
      expect(value2).toEqual([102, 103, 104, 105, 106]);
    });
  });

  describe('resetInputs', () => {
    it('should clear registered inputs', () => {
      const ctx = createMockContext();
      setContext(ctx);

      input_int(14, 'Length');
      
      // Update value
      ctx.inputs.setValue('Length', 20);
      expect(input_int(14, 'Length')).toBe(20);

      // Reset inputs
      resetInputs();
      clearContext();
      
      // Create new context
      const ctx2 = createMockContext();
      setContext(ctx2);

      // Should register again with default
      expect(input_int(14, 'Length')).toBe(14);
    });
  });
});
