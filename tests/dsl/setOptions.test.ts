/**
 * Test setOptions() functionality with input parameters
 */

import { indicator, input, plot, compile, close, high, low, ta, getDSLContext } from '../../src';

// Mock Lightweight Charts interfaces
const mockChart: any = {
  addSeries: jest.fn(() => ({
    setData: jest.fn(),
  })),
  removeSeries: jest.fn(),
  panes: jest.fn(() => []),
};

const mockMainSeries: any = {
  data: jest.fn(() => [
    { time: 1, open: 100, high: 110, low: 95, close: 105 },
    { time: 2, open: 105, high: 115, low: 100, close: 110 },
    { time: 3, open: 110, high: 120, low: 105, close: 115 },
    { time: 4, open: 115, high: 125, low: 110, close: 120 },
    { time: 5, open: 120, high: 130, low: 115, close: 125 },
  ]),
  subscribeDataChanged: jest.fn(),
  unsubscribeDataChanged: jest.fn(),
};

describe('setOptions() with input parameters', () => {
  beforeEach(() => {
    getDSLContext().clear();
    jest.clearAllMocks();
  });

  it('should update calculations when input parameter changes', () => {
    // Create indicator with input parameter
    indicator("Test SMA");

    const lengthInput = input.int(2, "Length");
    const sma = ta.sma(close, lengthInput);

    plot(sma, { title: "SMA" });

    const compiled = compile();

    // Bind with default length=2
    const controller = compiled.bind(mockChart, mockMainSeries, {});
    controller.attach();

    // Get initial series mock
    const initialSeries = mockChart.addSeries.mock.results[0]?.value;
    expect(initialSeries.setData).toHaveBeenCalled();
    const initialData = initialSeries.setData.mock.calls[0]?.[0];

    // Clear mocks
    jest.clearAllMocks();

    // Change parameter to length=3
    controller.setOptions({ length: 3 });

    // Series should be updated with new data
    expect(initialSeries.setData).toHaveBeenCalled();
    const newData = initialSeries.setData.mock.calls[0]?.[0];

    // Data should be different (different SMA period)
    expect(newData).toBeDefined();
    expect(initialData).toBeDefined();

    // The arrays should have different values due to different SMA periods
    // With length=2, SMA values will be different from length=3
    if (initialData && newData && initialData.length > 0 && newData.length > 0) {
      // At least one value should be different
      const valuesDifferent = initialData.some((point: any, i: number) => {
        const newPoint = newData[i];
        return newPoint && Math.abs(point.value - newPoint.value) > 0.001;
      });
      expect(valuesDifferent).toBe(true);
    }
  });

  it('should invalidate Series cache when options change', () => {
    indicator("Test Indicator");

    const multiplier = input.float(2.0, "Multiplier");
    const result = close.mul(multiplier);

    plot(result, { title: "Result" });

    const compiled = compile();

    // Bind with default multiplier=2.0
    const controller = compiled.bind(mockChart, mockMainSeries, {});
    controller.attach();

    const series = mockChart.addSeries.mock.results[0]?.value;
    const initialData = series.setData.mock.calls[0]?.[0];

    // Clear mocks
    jest.clearAllMocks();

    // Change multiplier to 3.0
    controller.setOptions({ multiplier: 3.0 });

    // Get new data
    const newData = series.setData.mock.calls[0]?.[0];

    // Values should be different (multiplied by different factor)
    expect(newData).toBeDefined();
    expect(initialData).toBeDefined();

    if (initialData && newData && initialData.length > 2) {
      // Check that values are indeed different
      // With multiplier=2.0: close * 2
      // With multiplier=3.0: close * 3
      const firstInitialValue = initialData[2]?.value;
      const firstNewValue = newData[2]?.value;

      expect(firstNewValue).not.toBe(firstInitialValue);
      // New value should be 1.5x the initial value (3.0/2.0)
      expect(Math.abs(firstNewValue - (firstInitialValue * 1.5))).toBeLessThan(0.01);
    }
  });

  it('should work with multiple sequential setOptions calls', () => {
    indicator("Test Indicator");

    const lengthInput = input.int(2, "Length");
    const sma = ta.sma(close, lengthInput);

    plot(sma);

    const compiled = compile();
    const controller = compiled.bind(mockChart, mockMainSeries, {});
    controller.attach();

    // First change
    controller.setOptions({ length: 3 });
    expect(mockChart.addSeries.mock.results[0]?.value.setData).toHaveBeenCalled();

    jest.clearAllMocks();

    // Second change
    controller.setOptions({ length: 5 });
    expect(mockChart.addSeries.mock.results[0]?.value.setData).toHaveBeenCalled();

    jest.clearAllMocks();

    // Third change
    controller.setOptions({ length: 10 });
    expect(mockChart.addSeries.mock.results[0]?.value.setData).toHaveBeenCalled();
  });

  it('should handle boolean input parameters', () => {
    indicator("Test Indicator");

    const showMA = input.bool(false, "Show MA");

    // Conditional plot based on input
    const result = showMA ? ta.sma(close, 14) : close;

    plot(result);

    const compiled = compile();
    const controller = compiled.bind(mockChart, mockMainSeries, {});
    controller.attach();

    // Change boolean parameter
    controller.setOptions({ show_ma: true });

    // Should trigger update
    expect(mockChart.addSeries.mock.results[0]?.value.setData).toHaveBeenCalled();
  });

  it('should handle multiple input parameters', () => {
    indicator("Moving Average Cross");

    const fastLength = input.int(9, "Fast Length");
    const slowLength = input.int(21, "Slow Length");

    const fastMA = ta.sma(close, fastLength);
    const slowMA = ta.sma(close, slowLength);

    plot(fastMA, { title: "Fast MA" });
    plot(slowMA, { title: "Slow MA" });

    const compiled = compile();
    const controller = compiled.bind(mockChart, mockMainSeries, {});
    controller.attach();

    // Clear mocks
    jest.clearAllMocks();

    // Change both parameters
    controller.setOptions({ fast_length: 5, slow_length: 13 });

    // Both series should be updated
    expect(mockChart.addSeries.mock.results[0]?.value.setData).toHaveBeenCalled();
    expect(mockChart.addSeries.mock.results[1]?.value.setData).toHaveBeenCalled();
  });
});
