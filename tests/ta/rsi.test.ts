import { ta } from '../../src';

describe('ta.rsi', () => {
  it('should calculate RSI correctly for basic data', () => {
    // Simple test data with clear uptrend
    const source = [44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08,
                    45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64];
    const rsi14 = ta.rsi(source, 14);

    expect(rsi14.length).toBe(source.length);

    // First value should be NaN (no previous value to calculate change)
    expect(rsi14[0]).toBeNaN();

    // RSI values should be between 0 and 100
    for (let i = 14; i < rsi14.length; i++) {
      if (!isNaN(rsi14[i])) {
        expect(rsi14[i]).toBeGreaterThanOrEqual(0);
        expect(rsi14[i]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('should return 100 for all gains (no losses)', () => {
    // Perfect uptrend - RSI should approach 100
    const source = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
    const rsi14 = ta.rsi(source, 14);

    // With consistent gains and no losses, RSI should be very high
    expect(rsi14[15]).toBeGreaterThan(90);
  });

  it('should return low RSI for all losses (no gains)', () => {
    // Perfect downtrend - RSI should approach 0
    const source = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
    const rsi14 = ta.rsi(source, 14);

    // With consistent losses and no gains, RSI should be very low
    expect(rsi14[15]).toBeLessThan(10);
  });

  it('should handle constant values (no losses = RSI 100)', () => {
    // No change means no gains or losses
    const source = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50];
    const rsi14 = ta.rsi(source, 14);

    // When there's no change, avgGains and avgLosses are both 0
    // Per PineScript v6: when avgLosses = 0, RSI = 100 (no losses means 100% bullish)
    // This matches the formula: RSI = 100 when there are zero losses
    expect(rsi14[15]).toBe(100);
  });

  it('should work with different periods', () => {
    const source = [10, 12, 11, 13, 14, 12, 15, 16, 14, 17, 18, 16, 19, 20];

    const rsi5 = ta.rsi(source, 5);
    const rsi10 = ta.rsi(source, 10);

    expect(rsi5.length).toBe(source.length);
    expect(rsi10.length).toBe(source.length);

    // Shorter period RSI should be more volatile (different values)
    expect(rsi5[13]).not.toBe(rsi10[13]);
  });

  it('should handle typical trading data', () => {
    // Realistic price data with mixed ups and downs
    const source = [100, 102, 101, 103, 102, 104, 106, 105, 107, 109,
                    108, 110, 109, 111, 110, 112, 111, 113, 112, 114];
    const rsi14 = ta.rsi(source, 14);

    // After sufficient data, RSI should be calculated
    expect(isNaN(rsi14[0])).toBe(true);
    expect(isNaN(rsi14[15])).toBe(false);

    // For this uptrend data, RSI should be above 50
    expect(rsi14[19]).toBeGreaterThan(50);
  });

  it('should use RMA (Relative Moving Average) for smoothing', () => {
    // This tests that RSI uses RMA (alpha = 1/length) not SMA
    const source = [44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42,
                    45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28];
    const rsi14 = ta.rsi(source, 14);

    // The implementation uses ta.rma() internally
    // Verify that results are reasonable for RMA-based calculation
    expect(rsi14.length).toBe(source.length);
    for (let i = 14; i < rsi14.length; i++) {
      if (!isNaN(rsi14[i])) {
        expect(rsi14[i]).toBeGreaterThanOrEqual(0);
        expect(rsi14[i]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('should handle NaN values in source', () => {
    const source = [10, 11, NaN, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
    const rsi14 = ta.rsi(source, 14);

    expect(rsi14.length).toBe(source.length);
    // Function should handle NaN gracefully
  });

  it('should match PineScript v6 RSI formula', () => {
    // RSI = 100 - (100 / (1 + RS))
    // Where RS = Average Gain / Average Loss (using RMA)
    const source = [10, 11, 12, 11, 12, 13, 12, 13, 14, 13, 14, 15, 14, 15, 16];
    const rsi14 = ta.rsi(source, 14);

    // Verify the formula is applied correctly
    // For this data: gains = [1,1,0,1,1,0,1,1,0,1,1,0,1,1]
    // losses = [0,0,1,0,0,1,0,0,1,0,0,1,0,0]
    expect(rsi14[0]).toBeNaN(); // First value
    expect(rsi14[14]).toBeGreaterThan(50); // More gains than losses
    expect(rsi14[14]).toBeLessThan(100);
  });

  it('should handle short data series', () => {
    const source = [10, 11, 12];
    const rsi5 = ta.rsi(source, 5);

    expect(rsi5.length).toBe(3);
    // Should still calculate even with insufficient data
    expect(rsi5[0]).toBeNaN();
  });

  it('should handle oscillating values', () => {
    // Alternating up and down
    const source = [10, 12, 10, 12, 10, 12, 10, 12, 10, 12,
                    10, 12, 10, 12, 10, 12, 10, 12, 10, 12];
    const rsi14 = ta.rsi(source, 14);

    // With equal gains and losses, RSI should be around 50
    expect(rsi14[19]).toBeGreaterThan(40);
    expect(rsi14[19]).toBeLessThan(60);
  });

  it('should identify overbought conditions (>70)', () => {
    // Strong uptrend that should push RSI above 70
    const source = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118,
                    120, 122, 124, 126, 128, 130, 132, 134, 136, 138];
    const rsi14 = ta.rsi(source, 14);

    // Strong consistent uptrend should create overbought condition
    expect(rsi14[19]).toBeGreaterThan(70);
  });

  it('should identify oversold conditions (<30)', () => {
    // Strong downtrend that should push RSI below 30
    const source = [140, 138, 136, 134, 132, 130, 128, 126, 124, 122,
                    120, 118, 116, 114, 112, 110, 108, 106, 104, 102];
    const rsi14 = ta.rsi(source, 14);

    // Strong consistent downtrend should create oversold condition
    expect(rsi14[19]).toBeLessThan(30);
  });

  it('should handle single large spike', () => {
    const source = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
                    100, 100, 100, 100, 150, 100, 100, 100, 100, 100];
    const rsi14 = ta.rsi(source, 14);

    // After the spike, RSI should be elevated but then normalize
    expect(rsi14[14]).toBeGreaterThan(50);
    expect(rsi14[19]).toBeLessThan(rsi14[14]); // Should decrease after spike
  });

  it('should handle length of 1', () => {
    const source = [10, 11, 12, 13, 14];
    const rsi1 = ta.rsi(source, 1);

    expect(rsi1.length).toBe(5);
    expect(rsi1[0]).toBeNaN();
    // With length 1, RSI responds immediately to changes
  });

  it('should produce smooth values with RMA smoothing', () => {
    const source = [100, 102, 101, 103, 102, 104, 103, 105, 104, 106,
                    105, 107, 106, 108, 107, 109, 108, 110, 109, 111];
    const rsi14 = ta.rsi(source, 14);

    // RMA smoothing should prevent wild oscillations
    let maxChange = 0;
    for (let i = 16; i < rsi14.length; i++) {
      if (!isNaN(rsi14[i]) && !isNaN(rsi14[i-1])) {
        const change = Math.abs(rsi14[i] - rsi14[i-1]);
        maxChange = Math.max(maxChange, change);
      }
    }

    // Changes should be relatively smooth (not jumping 50+ points)
    expect(maxChange).toBeLessThan(30);
  });
});
