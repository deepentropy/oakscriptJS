import * as ta from '../../src/ta';

describe('ta.swma', () => {
  it('should calculate symmetrically weighted moving average with fixed length 4', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const swma4 = ta.swma(source);

    // First 3 values should be NaN (need 4 bars)
    expect(swma4[0]).toBeNaN();
    expect(swma4[1]).toBeNaN();
    expect(swma4[2]).toBeNaN();

    // Index 3: (1*1/6 + 2*2/6 + 3*2/6 + 4*1/6) = (1 + 4 + 6 + 4)/6 = 15/6 = 2.5
    expect(swma4[3]).toBeCloseTo(2.5, 2);

    // Index 4: (2*1/6 + 3*2/6 + 4*2/6 + 5*1/6) = (2 + 6 + 8 + 5)/6 = 21/6 = 3.5
    expect(swma4[4]).toBeCloseTo(3.5, 2);
  });

  it('should handle NaN values correctly', () => {
    const source = [1, 2, NaN, 4, 5];
    const result = ta.swma(source);

    // Index 3 should be NaN because it includes NaN value
    expect(result[3]).toBeNaN();
  });

  it('should work with symmetric weights [1/6, 2/6, 2/6, 1/6]', () => {
    const source = [10, 20, 30, 40];
    const result = ta.swma(source);

    // (10*1/6 + 20*2/6 + 30*2/6 + 40*1/6) = (10 + 40 + 60 + 40)/6 = 150/6 = 25
    expect(result[3]).toBeCloseTo(25, 2);
  });

  it('should handle small arrays', () => {
    const source = [1, 2];
    const result = ta.swma(source);

    expect(result.length).toBe(2);
    expect(result.every(v => isNaN(v))).toBe(true);
  });
});

describe('ta.vwma', () => {
  it('should calculate volume weighted moving average correctly', () => {
    const price = [10, 20, 30, 40, 50];
    const volume = [100, 200, 300, 400, 500];
    const vwma3 = ta.vwma(price, 3, volume);

    // First 2 values should be NaN
    expect(vwma3[0]).toBeNaN();
    expect(vwma3[1]).toBeNaN();

    // Index 2: sma([10*100, 20*200, 30*300], 3) / sma([100, 200, 300], 3)
    // = sma([1000, 4000, 9000], 3) / sma([100, 200, 300], 3)
    // = 14000/3 / 600/3 = 4666.67 / 200 = 23.33
    expect(vwma3[2]).toBeCloseTo(23.33, 2);
  });

  it('should give higher weight to high volume bars', () => {
    const price = [10, 10, 10];
    const volumeEqual = [100, 100, 100];
    const volumeHeavy = [100, 100, 1000]; // Last bar has 10x volume

    const vwmaEqual = ta.vwma(price, 3, volumeEqual);
    const vwmaHeavy = ta.vwma(price, 3, volumeHeavy);

    // With equal volume, vwma should equal price
    expect(vwmaEqual[2]).toBeCloseTo(10, 2);

    // With heavy last bar, still ~10 since all prices are 10
    expect(vwmaHeavy[2]).toBeCloseTo(10, 2);
  });

  it('should handle varying price with volume weighting', () => {
    const price = [10, 20, 30];
    const lowVolume = [1000, 100, 100];  // High volume on low price
    const result = ta.vwma(price, 3, lowVolume);

    // Should be weighted toward the $10 price due to high volume there
    // sma([10*1000, 20*100, 30*100]) / sma([1000, 100, 100])
    // = sma([10000, 2000, 3000]) / sma([1000, 100, 100])
    // = 15000/3 / 1200/3 = 5000 / 400 = 12.5
    expect(result[2]).toBeCloseTo(12.5, 2);
  });

  it('should throw error when volume is not provided', () => {
    const price = [10, 20, 30];
    expect(() => ta.vwma(price, 3)).toThrow('requires volume series');
  });

  it('should handle zero volume correctly', () => {
    const price = [10, 20, 30];
    const volume = [0, 0, 0];
    const result = ta.vwma(price, 3, volume);

    // Should return NaN when volume sum is zero
    expect(result[2]).toBeNaN();
  });
});

describe('ta.linreg', () => {
  it('should calculate linear regression correctly', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const linreg5 = ta.linreg(source, 5, 0);

    // First 4 values should be NaN
    expect(linreg5[0]).toBeNaN();
    expect(linreg5[3]).toBeNaN();

    // For perfectly linear data, linreg should match the actual value
    expect(linreg5[4]).toBeCloseTo(5, 1);
    expect(linreg5[7]).toBeCloseTo(8, 1);
  });

  it('should project forward with positive offset', () => {
    const source = [1, 2, 3, 4, 5];
    const linreg5offset1 = ta.linreg(source, 5, 1);
    const linreg5offset0 = ta.linreg(source, 5, 0);

    // With offset=1, should project one bar back (lower value for uptrend)
    expect(linreg5offset1[4]).toBeLessThan(linreg5offset0[4]);
  });

  it('should handle non-linear data', () => {
    const source = [10, 12, 11, 13, 14, 12, 15, 16];
    const linreg5 = ta.linreg(source, 5, 0);

    expect(linreg5.length).toBe(source.length);
    expect(linreg5[4]).toBeDefined();
    expect(isNaN(linreg5[4])).toBe(false);
  });

  it('should work with default offset of 0', () => {
    const source = [1, 2, 3, 4, 5];
    const linregDefault = ta.linreg(source, 5);
    const linregZero = ta.linreg(source, 5, 0);

    expect(linregDefault[4]).toBe(linregZero[4]);
  });

  it('should calculate slope correctly for uptrend', () => {
    const uptrend = [10, 11, 12, 13, 14];
    const result = ta.linreg(uptrend, 5, 0);

    // Should be close to 14 at the end
    expect(result[4]).toBeCloseTo(14, 1);
  });
});

describe('ta.correlation', () => {
  it('should return 1 for perfectly correlated series', () => {
    const source1 = [1, 2, 3, 4, 5];
    const source2 = [2, 4, 6, 8, 10]; // Perfectly correlated (2x)
    const corr = ta.correlation(source1, source2, 5);

    expect(corr[4]).toBeCloseTo(1.0, 2);
  });

  it('should return -1 for perfectly negatively correlated series', () => {
    const source1 = [1, 2, 3, 4, 5];
    const source2 = [10, 9, 8, 7, 6]; // Perfectly negatively correlated
    const corr = ta.correlation(source1, source2, 5);

    expect(corr[4]).toBeCloseTo(-1.0, 2);
  });

  it('should return 0 for uncorrelated series', () => {
    const source1 = [5, 5, 5, 5, 5]; // Constant
    const source2 = [1, 2, 3, 4, 5]; // Linear
    const corr = ta.correlation(source1, source2, 5);

    // Correlation with constant is undefined (NaN)
    expect(corr[4]).toBeNaN();
  });

  it('should handle varying correlation over time', () => {
    const source1 = [1, 2, 3, 4, 5, 6, 7, 8];
    const source2 = [1, 2, 3, 4, 5, 5, 4, 3]; // Correlated then diverges
    const corr = ta.correlation(source1, source2, 4);

    // Early correlation should be high
    expect(corr[3]).toBeCloseTo(1.0, 1);

    // Later correlation should be lower as they diverge
    expect(Math.abs(corr[7])).toBeLessThan(1.0);
  });

  it('should return NaN for insufficient data', () => {
    const source1 = [1, 2, 3];
    const source2 = [4, 5, 6];
    const corr = ta.correlation(source1, source2, 5);

    expect(corr.every(v => isNaN(v))).toBe(true);
  });

  it('should handle partial correlation', () => {
    const source1 = [1, 3, 2, 4, 3, 5];
    const source2 = [2, 4, 3, 5, 4, 6];
    const corr = ta.correlation(source1, source2, 4);

    // Should have positive correlation
    expect(corr[5]).toBeGreaterThan(0);
    expect(corr[5]).toBeLessThanOrEqual(1);
  });
});

describe('ta.percentrank', () => {
  it('should return 100 for highest value in period', () => {
    const source = [1, 2, 3, 4, 5];
    const prank = ta.percentrank(source, 5);

    // Last value (5) is highest, should be 100
    expect(prank[4]).toBe(100);
  });

  it('should return 0 for lowest value in period', () => {
    const source = [5, 4, 3, 2, 1];
    const prank = ta.percentrank(source, 5);

    // Last value (1) is lowest, should be 0
    expect(prank[4]).toBe(0);
  });

  it('should calculate median percentrank correctly', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const prank = ta.percentrank(source, 5);

    // At index 6, window is [3,4,5,6,7], current=7
    // All 5 values <= 7, so (5-1)/(5-1) * 100 = 100%
    expect(prank[6]).toBe(100);

    // At index 4, window is [1,2,3,4,5], current=5
    // All 5 values <= 5, so (5-1)/(5-1) * 100 = 100%
    expect(prank[4]).toBe(100);
  });

  it('should handle duplicate values', () => {
    const source = [1, 2, 2, 2, 3];
    const prank = ta.percentrank(source, 5);

    // At index 4, value is 3 (highest), all 5 values <= 3
    // (5-1)/(5-1) * 100 = 100%
    expect(prank[4]).toBe(100);

    // Test with a value that's not the highest
    const source2 = [1, 2, 3, 4, 5, 6];
    const prank2 = ta.percentrank(source2, 5);

    // At index 4, window is [1,2,3,4,5], value is 5 (highest)
    // All 5 values <= 5, so (5-1)/(5-1) * 100 = 100%
    expect(prank2[4]).toBe(100);

    // At index 5, window is [2,3,4,5,6], value is 6 (highest)
    // All 5 values <= 6, so (5-1)/(5-1) * 100 = 100%
    expect(prank2[5]).toBe(100);
  });

  it('should return NaN for insufficient data', () => {
    const source = [1, 2, 3];
    const prank = ta.percentrank(source, 5);

    // First 4 should be NaN
    expect(prank[0]).toBeNaN();
    expect(prank[1]).toBeNaN();
    expect(prank[2]).toBeNaN();
  });

  it('should calculate percentile correctly in middle of data', () => {
    const source = [10, 20, 30, 40, 50, 60, 70, 80];
    const prank = ta.percentrank(source, 5);

    // At index 4, last 5 values are [10,20,30,40,50], current=50
    // 5 values <= 50, so 5/5 = 100%
    expect(prank[4]).toBe(100);

    // At index 5, last 5 values are [20,30,40,50,60], current=60
    // 5 values <= 60, so 5/5 = 100%
    expect(prank[5]).toBe(100);
  });
});
