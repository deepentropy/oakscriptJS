/**
 * Tests for SimpleInputAdapter
 */

import { SimpleInputAdapter } from '../../src/runtime/adapters/SimpleInputAdapter';
import type { InputConfig } from '../../src/runtime/types';

describe('SimpleInputAdapter', () => {
  let adapter: SimpleInputAdapter;

  beforeEach(() => {
    adapter = new SimpleInputAdapter();
  });

  describe('registerInput', () => {
    it('should register a new input and return default value', () => {
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
        title: 'Length',
      };

      const value = adapter.registerInput(config);
      expect(value).toBe(14);
    });

    it('should return existing value if input already registered', () => {
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
        title: 'Length',
      };

      adapter.registerInput(config);
      adapter.setValue('length', 20);

      // Register again - should return current value, not defval
      const value = adapter.registerInput(config);
      expect(value).toBe(20);
    });

    it('should handle float inputs', () => {
      const config: InputConfig = {
        id: 'factor',
        type: 'float',
        defval: 2.5,
        title: 'Factor',
      };

      const value = adapter.registerInput(config);
      expect(value).toBe(2.5);
    });

    it('should handle bool inputs', () => {
      const config: InputConfig = {
        id: 'showLabels',
        type: 'bool',
        defval: true,
        title: 'Show Labels',
      };

      const value = adapter.registerInput(config);
      expect(value).toBe(true);
    });

    it('should handle string inputs', () => {
      const config: InputConfig = {
        id: 'maType',
        type: 'string',
        defval: 'SMA',
        title: 'MA Type',
        options: ['SMA', 'EMA', 'WMA'],
      };

      const value = adapter.registerInput(config);
      expect(value).toBe('SMA');
    });
  });

  describe('getValue', () => {
    it('should return current value for registered input', () => {
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
      };

      adapter.registerInput(config);
      expect(adapter.getValue('length')).toBe(14);
    });

    it('should return undefined for unregistered input', () => {
      expect(adapter.getValue('nonexistent')).toBeUndefined();
    });
  });

  describe('setValue', () => {
    it('should update value of registered input', () => {
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
      };

      adapter.registerInput(config);
      adapter.setValue('length', 20);
      expect(adapter.getValue('length')).toBe(20);
    });

    it('should ignore setValue for unregistered input', () => {
      adapter.setValue('nonexistent', 100);
      expect(adapter.getValue('nonexistent')).toBeUndefined();
    });

    it('should enforce min constraint', () => {
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
        min: 1,
        max: 100,
      };

      adapter.registerInput(config);
      adapter.setValue('length', -5);
      expect(adapter.getValue('length')).toBe(1);
    });

    it('should enforce max constraint', () => {
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
        min: 1,
        max: 100,
      };

      adapter.registerInput(config);
      adapter.setValue('length', 500);
      expect(adapter.getValue('length')).toBe(100);
    });

    it('should floor int values', () => {
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
      };

      adapter.registerInput(config);
      adapter.setValue('length', 15.7);
      expect(adapter.getValue('length')).toBe(15);
    });

    it('should validate string options', () => {
      const config: InputConfig = {
        id: 'maType',
        type: 'string',
        defval: 'SMA',
        options: ['SMA', 'EMA', 'WMA'],
      };

      adapter.registerInput(config);
      
      // Valid option
      adapter.setValue('maType', 'EMA');
      expect(adapter.getValue('maType')).toBe('EMA');

      // Invalid option - should keep current value
      adapter.setValue('maType', 'INVALID');
      expect(adapter.getValue('maType')).toBe('EMA');
    });
  });

  describe('onInputChange', () => {
    it('should call registered callback when value changes', () => {
      const callback = jest.fn();
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
      };

      adapter.registerInput(config);
      adapter.onInputChange(callback);
      adapter.setValue('length', 20);

      expect(callback).toHaveBeenCalledWith('length', 20);
    });

    it('should call multiple callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const config: InputConfig = {
        id: 'length',
        type: 'int',
        defval: 14,
      };

      adapter.registerInput(config);
      adapter.onInputChange(callback1);
      adapter.onInputChange(callback2);
      adapter.setValue('length', 20);

      expect(callback1).toHaveBeenCalledWith('length', 20);
      expect(callback2).toHaveBeenCalledWith('length', 20);
    });
  });

  describe('getAllInputs', () => {
    it('should return all registered inputs', () => {
      adapter.registerInput({ id: 'a', type: 'int', defval: 1 });
      adapter.registerInput({ id: 'b', type: 'float', defval: 2.5 });

      const inputs = adapter.getAllInputs();
      expect(inputs.size).toBe(2);
      expect(inputs.get('a')?.value).toBe(1);
      expect(inputs.get('b')?.value).toBe(2.5);
    });
  });

  describe('clear', () => {
    it('should remove all inputs and callbacks', () => {
      const callback = jest.fn();
      adapter.registerInput({ id: 'a', type: 'int', defval: 1 });
      adapter.onInputChange(callback);

      adapter.clear();

      expect(adapter.getValue('a')).toBeUndefined();
      expect(adapter.getAllInputs().size).toBe(0);
    });
  });
});

describe('LightweightChartsAdapter', () => {
  // Import and test the adapter with a mock chart
  const { LightweightChartsAdapter } = require('../../src/runtime/adapters/LightweightChartsAdapter');

  // Create mock lightweight-charts objects
  function createMockChart() {
    const series: Array<{ type: string; options: unknown; data: unknown[] }> = [];
    
    return {
      series,
      addSeries: jest.fn((seriesDefinition: { type: string }, options: unknown) => {
        const s = {
          type: seriesDefinition.type,
          options,
          data: [] as unknown[],
          setData: jest.fn((data: unknown[]) => {
            s.data = data;
          }),
        };
        series.push(s);
        return s;
      }),
      removeSeries: jest.fn(),
      panes: jest.fn(() => []),
    };
  }

  describe('addSeries', () => {
    it('should add a line series', () => {
      const mockChart = createMockChart();
      const adapter = new LightweightChartsAdapter(mockChart);

      const handle = adapter.addSeries('line', { color: '#FF0000' });
      
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        { type: 'Line' },
        { color: '#FF0000' }
      );
      expect(handle.setData).toBeDefined();
    });

    it('should add a histogram series', () => {
      const mockChart = createMockChart();
      const adapter = new LightweightChartsAdapter(mockChart);

      adapter.addSeries('histogram');
      
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        { type: 'Histogram' },
        {}
      );
    });

    it('should add an area series', () => {
      const mockChart = createMockChart();
      const adapter = new LightweightChartsAdapter(mockChart);

      adapter.addSeries('area');
      
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        { type: 'Area' },
        {}
      );
    });

    it('should convert options correctly', () => {
      const mockChart = createMockChart();
      const adapter = new LightweightChartsAdapter(mockChart);

      adapter.addSeries('line', {
        color: '#00FF00',
        lineWidth: 2,
        lineStyle: 1,
        priceScaleId: 'right',
      });
      
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        { type: 'Line' },
        {
          color: '#00FF00',
          lineWidth: 2,
          lineStyle: 1,
          priceScaleId: 'right',
        }
      );
    });
  });

  describe('removeSeries', () => {
    it('should remove a series from the chart', () => {
      const mockChart = createMockChart();
      const adapter = new LightweightChartsAdapter(mockChart);

      const handle = adapter.addSeries('line');
      adapter.removeSeries(handle);
      
      expect(mockChart.removeSeries).toHaveBeenCalled();
    });
  });

  describe('setData', () => {
    it('should set data on the series handle', () => {
      const mockChart = createMockChart();
      const adapter = new LightweightChartsAdapter(mockChart);

      const handle = adapter.addSeries('line');
      const data = [
        { time: 1000, value: 100 },
        { time: 2000, value: 110 },
      ];
      
      handle.setData(data);

      expect(mockChart.series[0]!.data).toEqual(data);
    });
  });

  describe('getMainSeries', () => {
    it('should return undefined when no main series is provided', () => {
      const mockChart = createMockChart();
      const adapter = new LightweightChartsAdapter(mockChart);

      expect(adapter.getMainSeries()).toBeUndefined();
    });

    it('should return the main series when provided', () => {
      const mockChart = createMockChart();
      const mockMainSeries = {
        setData: jest.fn(),
      };
      const adapter = new LightweightChartsAdapter(mockChart, mockMainSeries);

      const mainSeries = adapter.getMainSeries();
      expect(mainSeries).toBeDefined();
      expect(mainSeries!.setData).toBeDefined();
    });
  });

  describe('createPane', () => {
    it('should return incrementing pane indices', () => {
      const mockChart = createMockChart();
      const adapter = new LightweightChartsAdapter(mockChart);

      const pane1 = adapter.createPane();
      const pane2 = adapter.createPane();
      const pane3 = adapter.createPane();

      expect(pane1).toBe(1);
      expect(pane2).toBe(2);
      expect(pane3).toBe(3);
    });
  });
});
