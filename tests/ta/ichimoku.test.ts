import { taCore as ta } from '../../src';

describe('ta.ichimoku', () => {
  // Sample OHLC data for testing
  const high = [
    110, 112, 115, 114, 116, 118, 120, 119, 121, 123,
    125, 124, 126, 128, 130, 129, 131, 133, 135, 134,
    136, 138, 140, 139, 141, 143, 145, 144, 146, 148,
    150, 149, 151, 153, 155, 154, 156, 158, 160, 159,
    161, 163, 165, 164, 166, 168, 170, 169, 171, 173,
    175, 174, 176, 178, 180, 179, 181, 183, 185, 184
  ];

  const low = [
    100, 102, 105, 104, 106, 108, 110, 109, 111, 113,
    115, 114, 116, 118, 120, 119, 121, 123, 125, 124,
    126, 128, 130, 129, 131, 133, 135, 134, 136, 138,
    140, 139, 141, 143, 145, 144, 146, 148, 150, 149,
    151, 153, 155, 154, 156, 158, 160, 159, 161, 163,
    165, 164, 166, 168, 170, 169, 171, 173, 175, 174
  ];

  const close = [
    105, 107, 110, 109, 111, 113, 115, 114, 116, 118,
    120, 119, 121, 123, 125, 124, 126, 128, 130, 129,
    131, 133, 135, 134, 136, 138, 140, 139, 141, 143,
    145, 144, 146, 148, 150, 149, 151, 153, 155, 154,
    156, 158, 160, 159, 161, 163, 165, 164, 166, 168,
    170, 169, 171, 173, 175, 174, 176, 178, 180, 179
  ];

  it('should return 5 series with correct length', () => {
    const [tenkan, kijun, senkouA, senkouB, chikou] = ta.ichimoku(9, 26, 52, 26, high, low, close);

    expect(tenkan.length).toBe(60);
    expect(kijun.length).toBe(60);
    expect(senkouA.length).toBe(60);
    expect(senkouB.length).toBe(60);
    expect(chikou.length).toBe(60);
  });

  it('should calculate Tenkan-sen correctly', () => {
    const [tenkan] = ta.ichimoku(9, 26, 52, 26, high, low, close);

    // First 8 values (0-7) should be NaN (need 9 bars for period 9)
    for (let i = 0; i < 8; i++) {
      expect(tenkan[i]).toBeNaN();
    }

    // At index 8, we have first 9 bars (0-8)
    // Highest high in bars 0-8: 121 (index 8)
    // Lowest low in bars 0-8: 100 (index 0)
    // Tenkan-sen = (121 + 100) / 2 = 110.5
    expect(tenkan[8]).toBe(110.5);
  });

  it('should calculate Kijun-sen correctly', () => {
    const [, kijun] = ta.ichimoku(9, 26, 52, 26, high, low, close);

    // First 25 values (0-24) should be NaN (need 26 bars for period 26)
    for (let i = 0; i < 25; i++) {
      expect(kijun[i]).toBeNaN();
    }

    // At index 25, we have first 26 bars (0-25)
    // Highest high in bars 0-25: 143 (index 25)
    // Lowest low in bars 0-25: 100 (index 0)
    // Kijun-sen = (143 + 100) / 2 = 121.5
    expect(kijun[25]).toBe(121.5);
  });

  it('should calculate Senkou Span A with correct displacement', () => {
    const [tenkan, kijun, senkouA] = ta.ichimoku(9, 26, 52, 26, high, low, close);

    // Senkou Span A is offset forward by displacement (26)
    // So first 26 values should be NaN (displaced forward)
    for (let i = 0; i < 26; i++) {
      expect(senkouA[i]).toBeNaN();
    }

    // Senkou Span A at index i should be based on tenkan and kijun at index (i - displacement)
    // At index 51, it uses tenkan[25] and kijun[25]
    const sourceIndex = 51 - 26; // = 25
    if (!isNaN(tenkan[sourceIndex]) && !isNaN(kijun[sourceIndex])) {
      expect(senkouA[51]).toBe((tenkan[sourceIndex] + kijun[sourceIndex]) / 2);
    }
  });

  it('should calculate Senkou Span B with correct displacement', () => {
    const [, , , senkouB] = ta.ichimoku(9, 26, 52, 26, high, low, close);

    // Senkou Span B is offset forward by displacement (26)
    // Plus needs 52 periods for laggingSpan2Periods
    // So first values will be NaN due to displacement and lookback period

    // First 26 values should be NaN (displacement)
    for (let i = 0; i < 26; i++) {
      expect(senkouB[i]).toBeNaN();
    }
  });

  it('should calculate Chikou Span with correct backward offset', () => {
    const [, , , , chikou] = ta.ichimoku(9, 26, 52, 26, high, low, close);

    // Chikou Span is close offset backward by displacement (26)
    // At index i, it shows close[i + displacement]
    // So last 26 values should be NaN

    for (let i = 60 - 26; i < 60; i++) {
      expect(chikou[i]).toBeNaN();
    }

    // At index 0, chikou should equal close[26]
    expect(chikou[0]).toBe(close[26]);

    // At index 10, chikou should equal close[36]
    expect(chikou[10]).toBe(close[36]);
  });

  it('should handle default parameters (9, 26, 52, 26)', () => {
    const [tenkan, kijun, senkouA, senkouB, chikou] = ta.ichimoku(9, 26, 52, 26, high, low, close);

    // With default params, verify structure
    expect(tenkan.length).toBe(high.length);
    expect(kijun.length).toBe(high.length);
    expect(senkouA.length).toBe(high.length);
    expect(senkouB.length).toBe(high.length);
    expect(chikou.length).toBe(high.length);

    // Verify some values are valid numbers
    const validTenkan = tenkan.filter(v => !isNaN(v));
    const validKijun = kijun.filter(v => !isNaN(v));
    expect(validTenkan.length).toBeGreaterThan(0);
    expect(validKijun.length).toBeGreaterThan(0);
  });

  it('should return NaN for insufficient data periods', () => {
    // Short data array - only 10 bars
    const shortHigh = [110, 112, 115, 114, 116, 118, 120, 119, 121, 123];
    const shortLow = [100, 102, 105, 104, 106, 108, 110, 109, 111, 113];
    const shortClose = [105, 107, 110, 109, 111, 113, 115, 114, 116, 118];

    const [tenkan, kijun, senkouA, senkouB, chikou] = ta.ichimoku(9, 26, 52, 26, shortHigh, shortLow, shortClose);

    // With only 10 bars:
    // Tenkan (period 9): should have 2 valid values (index 8-9)
    // Kijun (period 26): all NaN (need 26 bars)
    // Senkou A: all NaN (displaced + kijun needs 26 bars)
    // Senkou B: all NaN (needs 52 bars + displacement)
    // Chikou: displacement(26) > array_length(10), so all values are NaN

    expect(tenkan[8]).not.toBeNaN();
    expect(tenkan[9]).not.toBeNaN();
    
    // All kijun should be NaN
    kijun.forEach(v => expect(v).toBeNaN());
    
    // All senkouA should be NaN (kijun is all NaN)
    senkouA.forEach(v => expect(v).toBeNaN());
    
    // All senkouB should be NaN
    senkouB.forEach(v => expect(v).toBeNaN());
  });

  it('should handle edge cases with short data arrays', () => {
    // Very short array
    const shortHigh = [110, 112, 115];
    const shortLow = [100, 102, 105];
    const shortClose = [105, 107, 110];

    const [tenkan, kijun, senkouA, senkouB, chikou] = ta.ichimoku(9, 26, 52, 26, shortHigh, shortLow, shortClose);

    // All values should be NaN because we don't have enough data
    tenkan.forEach(v => expect(v).toBeNaN());
    kijun.forEach(v => expect(v).toBeNaN());
    senkouA.forEach(v => expect(v).toBeNaN());
    senkouB.forEach(v => expect(v).toBeNaN());
    chikou.forEach(v => expect(v).toBeNaN());
  });

  it('should work with custom parameters', () => {
    // Use smaller periods that work with our 60-bar data
    const [tenkan, kijun, senkouA, senkouB, chikou] = ta.ichimoku(5, 10, 20, 10, high, low, close);

    // With period 5, tenkan should have valid values from index 4
    expect(tenkan[4]).not.toBeNaN();

    // With period 10, kijun should have valid values from index 9
    expect(kijun[9]).not.toBeNaN();

    // Senkou Span A with displacement 10 should have values from index 10+9 = 19
    // Actually, senkouA at index i = (tenkan[i-10] + kijun[i-10]) / 2
    // At index 19, we look at tenkan[9] and kijun[9]
    // tenkan[9] is valid, kijun[9] is valid
    expect(senkouA[19]).not.toBeNaN();

    // Chikou with displacement 10 should have NaN in last 10 values
    expect(chikou[49]).not.toBeNaN(); // close[59]
    expect(chikou[50]).toBeNaN(); // would need close[60]
  });

  it('should produce consistent results across calls', () => {
    const result1 = ta.ichimoku(9, 26, 52, 26, high, low, close);
    const result2 = ta.ichimoku(9, 26, 52, 26, high, low, close);

    // Both calls should produce identical results
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < result1[i].length; j++) {
        if (isNaN(result1[i][j])) {
          expect(result2[i][j]).toBeNaN();
        } else {
          expect(result1[i][j]).toBe(result2[i][j]);
        }
      }
    }
  });

  it('should handle empty arrays', () => {
    const [tenkan, kijun, senkouA, senkouB, chikou] = ta.ichimoku(9, 26, 52, 26, [], [], []);

    expect(tenkan.length).toBe(0);
    expect(kijun.length).toBe(0);
    expect(senkouA.length).toBe(0);
    expect(senkouB.length).toBe(0);
    expect(chikou.length).toBe(0);
  });

  it('should calculate middle values correctly (donchian channel midpoint)', () => {
    // Tenkan-sen and Kijun-sen are essentially donchian channel midpoints
    // Let's verify manually for a specific point

    const simpleHigh = [10, 12, 11, 13, 15, 14, 16, 18, 17, 19];
    const simpleLow = [8, 9, 8, 10, 12, 11, 13, 15, 14, 16];
    const simpleClose = [9, 11, 10, 12, 14, 13, 15, 17, 16, 18];

    const [tenkan] = ta.ichimoku(3, 5, 10, 5, simpleHigh, simpleLow, simpleClose);

    // At index 2, tenkan uses bars 0-2
    // Highest high: max(10, 12, 11) = 12
    // Lowest low: min(8, 9, 8) = 8
    // Tenkan = (12 + 8) / 2 = 10
    expect(tenkan[2]).toBe(10);

    // At index 5, tenkan uses bars 3-5
    // Highest high: max(13, 15, 14) = 15
    // Lowest low: min(10, 12, 11) = 10
    // Tenkan = (15 + 10) / 2 = 12.5
    expect(tenkan[5]).toBe(12.5);
  });
});
