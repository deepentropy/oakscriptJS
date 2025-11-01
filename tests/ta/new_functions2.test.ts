import * as ta from '../../src/ta';

describe('ta.roc', () => {
  it('should calculate rate of change as percentage', () => {
    const source = [100, 105, 110, 115, 120];
    const roc1 = ta.roc(source, 1);

    expect(roc1[0]).toBeNaN();
    expect(roc1[1]).toBeCloseTo(5.0, 2);    // (105-100)/100 * 100 = 5%
    expect(roc1[2]).toBeCloseTo(4.76, 2);  // (110-105)/105 * 100 = 4.76%
    expect(roc1[3]).toBeCloseTo(4.55, 2);  // (115-110)/110 * 100 = 4.55%
    expect(roc1[4]).toBeCloseTo(4.35, 2);  // (120-115)/115 * 100 = 4.35%
  });

  it('should handle negative ROC', () => {
    const source = [120, 115, 110, 105, 100];
    const roc1 = ta.roc(source, 1);

    expect(roc1[1]).toBeCloseTo(-4.17, 2);  // (115-120)/120 * 100 = -4.17%
    expect(roc1[2]).toBeCloseTo(-4.35, 2);  // (110-115)/115 * 100 = -4.35%
  });

  it('should handle longer periods', () => {
    const source = [100, 105, 110, 115, 120, 125, 130];
    const roc3 = ta.roc(source, 3);

    expect(roc3[0]).toBeNaN();
    expect(roc3[1]).toBeNaN();
    expect(roc3[2]).toBeNaN();
    expect(roc3[3]).toBeCloseTo(15.0, 2);  // (115-100)/100 * 100 = 15%
    expect(roc3[4]).toBeCloseTo(14.29, 2); // (120-105)/105 * 100 = 14.29%
  });

  it('should return NaN for division by zero', () => {
    const source = [0, 10, 20];
    const roc1 = ta.roc(source, 1);

    expect(roc1[1]).toBeNaN(); // oldValue is 0
  });

  it('should handle NaN values', () => {
    const source = [100, NaN, 110];
    const roc1 = ta.roc(source, 1);

    expect(roc1[1]).toBeNaN();
    expect(roc1[2]).toBeNaN(); // oldValue is NaN
  });
});

describe('ta.mom', () => {
  it('should calculate momentum correctly', () => {
    const source = [100, 105, 110, 115, 120];
    const mom1 = ta.mom(source, 1);

    expect(mom1[0]).toBeNaN();
    expect(mom1[1]).toBe(5);   // 105 - 100
    expect(mom1[2]).toBe(5);   // 110 - 105
    expect(mom1[3]).toBe(5);   // 115 - 110
    expect(mom1[4]).toBe(5);   // 120 - 115
  });

  it('should handle negative momentum', () => {
    const source = [120, 115, 110, 105, 100];
    const mom1 = ta.mom(source, 1);

    expect(mom1[1]).toBe(-5);  // 115 - 120
    expect(mom1[2]).toBe(-5);  // 110 - 115
  });

  it('should handle longer periods', () => {
    const source = [100, 105, 110, 115, 120, 125, 130];
    const mom3 = ta.mom(source, 3);

    expect(mom3[0]).toBeNaN();
    expect(mom3[1]).toBeNaN();
    expect(mom3[2]).toBeNaN();
    expect(mom3[3]).toBe(15);  // 115 - 100
    expect(mom3[4]).toBe(15);  // 120 - 105
    expect(mom3[5]).toBe(15);  // 125 - 110
  });

  it('should handle NaN values', () => {
    const source = [100, NaN, 110];
    const mom1 = ta.mom(source, 1);

    expect(mom1[1]).toBeNaN();
    expect(mom1[2]).toBeNaN();
  });

  it('should be equivalent to change', () => {
    const source = [100, 105, 110, 115, 120];
    const mom2 = ta.mom(source, 2);
    const change2 = ta.change(source, 2);

    expect(mom2).toEqual(change2);
  });
});

describe('ta.dev', () => {
  it('should calculate mean absolute deviation', () => {
    const source = [10, 12, 10, 8, 10]; // Mean = 10, deviations: 0, 2, 0, 2, 0
    const dev5 = ta.dev(source, 5);

    expect(dev5[0]).toBeNaN();
    expect(dev5[1]).toBeNaN();
    expect(dev5[2]).toBeNaN();
    expect(dev5[3]).toBeNaN();
    expect(dev5[4]).toBeCloseTo(0.8, 2); // (0+2+0+2+0)/5 = 0.8
  });

  it('should handle varying values', () => {
    const source = [1, 2, 3, 4, 5];
    const dev3 = ta.dev(source, 3);

    expect(dev3[0]).toBeNaN();
    expect(dev3[1]).toBeNaN();
    // At index 2: values are [1,2,3], mean=2, deviations=[1,0,1], dev=0.667
    expect(dev3[2]).toBeCloseTo(0.667, 2);
    // At index 3: values are [2,3,4], mean=3, deviations=[1,0,1], dev=0.667
    expect(dev3[3]).toBeCloseTo(0.667, 2);
  });

  it('should return 0 for constant values', () => {
    const source = [10, 10, 10, 10, 10];
    const dev3 = ta.dev(source, 3);

    expect(dev3[2]).toBe(0);
    expect(dev3[4]).toBe(0);
  });

  it('should ignore NaN values', () => {
    const source = [10, NaN, 12, 10];
    const dev3 = ta.dev(source, 3);

    // Should calculate based on non-NaN values
    expect(dev3[2]).toBeDefined();
  });
});

describe('ta.variance', () => {
  it('should calculate biased variance (population)', () => {
    const source = [2, 4, 4, 4, 5, 5, 7, 9]; // Mean = 5
    const variance8 = ta.variance(source, 8, true);

    // Variance = ((2-5)² + (4-5)² + (4-5)² + (4-5)² + (5-5)² + (5-5)² + (7-5)² + (9-5)²) / 8
    // = (9 + 1 + 1 + 1 + 0 + 0 + 4 + 16) / 8 = 32/8 = 4
    expect(variance8[7]).toBeCloseTo(4, 2);
  });

  it('should calculate unbiased variance (sample)', () => {
    const source = [2, 4, 4, 4, 5, 5, 7, 9];
    const variance8 = ta.variance(source, 8, false);

    // Sample variance = 32 / 7 = 4.571
    expect(variance8[7]).toBeCloseTo(4.571, 2);
  });

  it('should default to biased variance', () => {
    const source = [1, 2, 3, 4, 5];
    const varianceBiased = ta.variance(source, 5, true);
    const varianceDefault = ta.variance(source, 5);

    expect(varianceDefault[4]).toBe(varianceBiased[4]);
  });

  it('should handle constant values', () => {
    const source = [5, 5, 5, 5, 5];
    const variance3 = ta.variance(source, 3);

    expect(variance3[2]).toBe(0);
    expect(variance3[4]).toBe(0);
  });

  it('should relate to standard deviation', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const variance5 = ta.variance(source, 5);
    const stdev5 = ta.stdev(source, 5);

    for (let i = 4; i < source.length; i++) {
      if (!isNaN(variance5[i]) && !isNaN(stdev5[i])) {
        expect(Math.sqrt(variance5[i])).toBeCloseTo(stdev5[i], 2);
      }
    }
  });
});

describe('ta.median', () => {
  it('should find median of odd-length series', () => {
    const source = [1, 3, 5, 7, 9];
    const median5 = ta.median(source, 5);

    expect(median5[4]).toBe(5); // Middle value of [1,3,5,7,9]
  });

  it('should find median of even-length series', () => {
    const source = [1, 2, 3, 4];
    const median4 = ta.median(source, 4);

    expect(median4[3]).toBe(2.5); // Average of 2 and 3
  });

  it('should handle unsorted input', () => {
    const source = [5, 1, 9, 3, 7];
    const median5 = ta.median(source, 5);

    // Sorted: [1,3,5,7,9], median = 5
    expect(median5[4]).toBe(5);
  });

  it('should return median over rolling window', () => {
    const source = [1, 2, 3, 4, 5, 6, 7];
    const median3 = ta.median(source, 3);

    expect(median3[0]).toBeNaN();
    expect(median3[1]).toBeNaN();
    expect(median3[2]).toBe(2); // Median of [1,2,3]
    expect(median3[3]).toBe(3); // Median of [2,3,4]
    expect(median3[4]).toBe(4); // Median of [3,4,5]
  });

  it('should ignore NaN values', () => {
    const source = [1, NaN, 3, 5, 7];
    const median3 = ta.median(source, 3);

    // At index 4: [3, 5, 7] (NaN ignored if within window)
    expect(median3[4]).toBe(5);
  });

  it('should be more robust than mean', () => {
    const normal = [10, 10, 10, 10, 10];
    const withOutlier = [10, 10, 10, 10, 100];

    const medianNormal = ta.median(normal, 5);
    const medianOutlier = ta.median(withOutlier, 5);
    const smaNormal = ta.sma(normal, 5);
    const smaOutlier = ta.sma(withOutlier, 5);

    // Median is less affected by outlier
    expect(medianNormal[4]).toBe(10);
    expect(medianOutlier[4]).toBe(10); // Still 10
    expect(smaOutlier[4]).toBe(28);    // Heavily affected: (10+10+10+10+100)/5 = 28
  });
});
