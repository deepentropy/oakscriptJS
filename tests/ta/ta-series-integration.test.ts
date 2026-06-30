/**
 * Integration test for ta.sma with Series to verify .bars property access fix
 */

import { Series, ta } from '../../src';

describe('ta.sma integration test', () => {
  it('should return correct length array with data after .bars fix', () => {
    // Create test data
    const bars = Array.from({ length: 100 }, (_, i) => ({
      time: 1609459200 + i * 86400,
      open: 100 + i * 0.1,
      high: 110 + i * 0.1,
      low: 90 + i * 0.1,
      close: 100 + i * 0.1,
      volume: 1000000
    }));

    // Create Series and calculate SMA
    const close = new Series(bars, (bar) => bar.close);
    const sma = ta.sma(close, 9);
    const smaValues = sma.toArray();

    // Verify the fix worked - should return array with same length as input
    expect(smaValues).toHaveLength(bars.length);
    
    // Verify it contains actual data (not all NaN)
    const nonNanCount = smaValues.filter(v => !Number.isNaN(v)).length;
    expect(nonNanCount).toBeGreaterThan(0);
    
    // First 8 values should be NaN (period - 1)
    for (let i = 0; i < 8; i++) {
      expect(Number.isNaN(smaValues[i])).toBe(true);
    }
    
    // 9th value and onwards should have data
    expect(Number.isNaN(smaValues[8])).toBe(false);
    expect(smaValues[8]).toBeCloseTo(100.4, 1);
  });

  it('should work with multiple ta functions (regression test)', () => {
    const bars = Array.from({ length: 50 }, (_, i) => ({
      time: 1609459200 + i * 86400,
      open: 100 + i * 0.5,
      high: 110 + i * 0.5,
      low: 90 + i * 0.5,
      close: 100 + i * 0.5,
      volume: 1000000
    }));

    const close = new Series(bars, (bar) => bar.close);
    
    // Test multiple ta functions that all use .bars
    const sma = ta.sma(close, 5);
    const ema = ta.ema(close, 5);
    const wma = ta.wma(close, 5);
    const rma = ta.rma(close, 5);

    // All should return correct length
    expect(sma.toArray()).toHaveLength(bars.length);
    expect(ema.toArray()).toHaveLength(bars.length);
    expect(wma.toArray()).toHaveLength(bars.length);
    expect(rma.toArray()).toHaveLength(bars.length);

    // All should have non-NaN values
    expect(sma.toArray().filter(v => !Number.isNaN(v)).length).toBeGreaterThan(0);
    expect(ema.toArray().filter(v => !Number.isNaN(v)).length).toBeGreaterThan(0);
    expect(wma.toArray().filter(v => !Number.isNaN(v)).length).toBeGreaterThan(0);
    expect(rma.toArray().filter(v => !Number.isNaN(v)).length).toBeGreaterThan(0);
  });
});
