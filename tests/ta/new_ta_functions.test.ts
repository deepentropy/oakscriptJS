import { taCore as ta } from '../../src';

describe('Newly Implemented TA Functions', () => {
  describe('ta.mode', () => {
    it('should return the most frequent value', () => {
      const values = [1, 2, 2, 3, 3, 3, 4, 4, 5];
      const result = ta.mode(values, values.length);
      expect(result[values.length - 1]).toBe(3);
    });

    it('should return smallest value when multiple modes exist', () => {
      const values = [1, 1, 2, 2, 3, 3];
      const result = ta.mode(values, values.length);
      expect(result[values.length - 1]).toBe(1);
    });

    it('should handle rolling window', () => {
      const values = [1, 2, 3, 3, 3, 4, 5, 5, 5, 5];
      const result = ta.mode(values, 4);
      expect(result[6]).toBe(3); // Window [3,3,4,5] -> mode is 3
      expect(result[9]).toBe(5); // Window [5,5,5,5] -> mode is 5
    });

    it('should ignore NaN values', () => {
      const values = [1, NaN, 2, 2, NaN, 3];
      const result = ta.mode(values, values.length);
      expect(result[values.length - 1]).toBe(2);
    });
  });

  describe('ta.percentile_linear_interpolation', () => {
    it('should calculate 50th percentile (median)', () => {
      const values = [1, 2, 3, 4, 5];
      const result = ta.percentile_linear_interpolation(values, values.length, 50);
      expect(result[values.length - 1]).toBe(3);
    });

    it('should use linear interpolation', () => {
      const values = [1, 2, 3, 4];
      const result = ta.percentile_linear_interpolation(values, values.length, 50);
      // 50th percentile of [1,2,3,4] = 2.5 (interpolated between 2 and 3)
      expect(result[values.length - 1]).toBe(2.5);
    });

    it('should handle 25th and 75th percentiles', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p25 = ta.percentile_linear_interpolation(values, values.length, 25);
      const p75 = ta.percentile_linear_interpolation(values, values.length, 75);
      expect(p25[values.length - 1]).toBeCloseTo(3.25);
      expect(p75[values.length - 1]).toBeCloseTo(7.75);
    });

    it('should return NaN if any value is NaN', () => {
      const values = [1, 2, NaN, 4, 5];
      const result = ta.percentile_linear_interpolation(values, values.length, 50);
      expect(result[values.length - 1]).toBeNaN();
    });
  });

  describe('ta.percentile_nearest_rank', () => {
    it('should calculate 50th percentile', () => {
      const values = [1, 2, 3, 4, 5];
      const result = ta.percentile_nearest_rank(values, values.length, 50);
      expect(result[values.length - 1]).toBe(3);
    });

    it('should always return a member of input data', () => {
      const values = [1, 2, 3, 4];
      const result = ta.percentile_nearest_rank(values, values.length, 50);
      // Should be 2 or 3, not 2.5
      expect([2, 3]).toContain(result[values.length - 1]);
    });

    it('should handle 100th percentile as largest value', () => {
      const values = [1, 2, 3, 4, 5];
      const result = ta.percentile_nearest_rank(values, values.length, 100);
      expect(result[values.length - 1]).toBe(5);
    });

    it('should ignore NaN values', () => {
      const values = [1, NaN, 2, 3, NaN, 4, 5];
      const result = ta.percentile_nearest_rank(values, values.length, 50);
      expect(result[values.length - 1]).toBe(3);
    });
  });

  describe('ta.rci', () => {
    it('should return +100 for perfectly increasing series', () => {
      const values = [1, 2, 3, 4, 5];
      const result = ta.rci(values, values.length);
      expect(result[values.length - 1]).toBeCloseTo(100, 5);
    });

    it('should return -100 for perfectly decreasing series', () => {
      const values = [5, 4, 3, 2, 1];
      const result = ta.rci(values, values.length);
      expect(result[values.length - 1]).toBeCloseTo(-100, 5);
    });

    it('should return value between -100 and 100 for mixed data', () => {
      const values = [1, 5, 2, 4, 3];
      const result = ta.rci(values, values.length);
      // RCI for this series should be between -100 and 100
      expect(result[values.length - 1]).toBeGreaterThan(-100);
      expect(result[values.length - 1]).toBeLessThan(100);
    });

    it('should handle rolling window', () => {
      const values = [1, 2, 3, 4, 5, 4, 3, 2, 1];
      const result = ta.rci(values, 5);
      expect(result[4]).toBeCloseTo(100, 5); // [1,2,3,4,5]
      expect(result[8]).toBeCloseTo(-100, 5); // [5,4,3,2,1]
    });

    it('should return NaN if any value is NaN', () => {
      const values = [1, 2, NaN, 4, 5];
      const result = ta.rci(values, values.length);
      expect(result[values.length - 1]).toBeNaN();
    });
  });

  describe('ta.pivot_point_levels', () => {
    it('should calculate Traditional pivot points', () => {
      const high = [100, 105, 110, 108, 112];
      const low = [95, 100, 105, 103, 107];
      const close = [98, 103, 108, 106, 110];
      const anchor = [true, false, false, false, false];

      const pivots = ta.pivot_point_levels('Traditional', anchor, false, high, low, close);

      // P = (H + L + C) / 3 = (100 + 95 + 98) / 3 = 97.67
      const P = pivots[0][4]; // Last value
      expect(P).toBeCloseTo(97.67, 2);

      // R1 = 2*P - L = 2*97.67 - 95 = 100.33
      const R1 = pivots[1][4];
      expect(R1).toBeCloseTo(100.33, 2);

      // S1 = 2*P - H = 2*97.67 - 100 = 95.33
      const S1 = pivots[2][4];
      expect(S1).toBeCloseTo(95.33, 2);
    });

    it('should calculate Fibonacci pivot points', () => {
      const high = [100, 105];
      const low = [90, 95];
      const close = [95, 100];
      const anchor = [true, false];

      const pivots = ta.pivot_point_levels('Fibonacci', anchor, false, high, low, close);

      // P = (100 + 90 + 95) / 3 = 95
      expect(pivots[0][1]).toBeCloseTo(95, 2);

      // R1 = P + 0.382 * (H - L) = 95 + 0.382 * 10 = 98.82
      expect(pivots[1][1]).toBeCloseTo(98.82, 2);
    });

    it('should calculate DM pivot points with only P, R1, S1', () => {
      const high = [100];
      const low = [90];
      const close = [95];
      const open = [92];
      const anchor = [true];

      const pivots = ta.pivot_point_levels('DM', anchor, false, high, low, close, open);

      // DM has different formula: x = H + L + 2C + O
      // P = x / 5, R1 = x/2 - L, S1 = x/2 - H
      const x = 100 + 90 + (2 * 95) + 92; // 472
      expect(pivots[0][0]).toBeCloseTo(x / 5, 2); // P = 94.4
      expect(pivots[1][0]).toBeCloseTo(x / 2 - 90, 2); // R1 = 146
      expect(pivots[2][0]).toBeCloseTo(x / 2 - 100, 2); // S1 = 136

      // R2-R5, S2-S5 should be NaN
      expect(pivots[3][0]).toBeNaN();
      expect(pivots[4][0]).toBeNaN();
    });

    it('should throw error for Woodie with developing=true', () => {
      const high = [100];
      const low = [90];
      const close = [95];
      const anchor = [true];

      expect(() => {
        ta.pivot_point_levels('Woodie', anchor, true, high, low, close);
      }).toThrow('Woodie type cannot use developing=true');
    });

    it('should handle developing mode', () => {
      const high = [100, 105, 110];
      const low = [90, 95, 100];
      const close = [95, 100, 105];
      const anchor = [true, false, false];

      const pivotsDeveloping = ta.pivot_point_levels('Traditional', anchor, true, high, low, close);
      const pivotsNonDeveloping = ta.pivot_point_levels('Traditional', anchor, false, high, low, close);

      // Developing should recalculate with max/min since anchor
      // Non-developing should use values at anchor point
      expect(pivotsDeveloping[0][2]).not.toBe(pivotsNonDeveloping[0][2]);
    });
  });
});
