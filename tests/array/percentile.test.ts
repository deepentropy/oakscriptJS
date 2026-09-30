import { array } from '../../src';

describe('Array Percentile Functions', () => {
  describe('array.percentile_linear_interpolation', () => {
    it('should calculate 50th percentile (median)', () => {
      const arr = [1, 2, 3, 4, 5];
      const p50 = array.percentile_linear_interpolation(arr, 50);
      expect(p50).toBe(3);
    });

    it('should use linear interpolation for non-exact positions', () => {
      const arr = [1, 2, 3, 4];
      const p50 = array.percentile_linear_interpolation(arr, 50);
      // 50th percentile should be interpolated between 2 and 3
      expect(p50).toBe(2.5);
    });

    it('should calculate 25th percentile', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p25 = array.percentile_linear_interpolation(arr, 25);
      // position p / 100 * size - 0.5 (PineScript)
      expect(p25).toBeCloseTo(3, 10);
      expect(array.percentile_linear_interpolation(arr, 10)).toBeCloseTo(1.5, 10);
      expect(array.percentile_linear_interpolation(arr, 33.3)).toBeCloseTo(3.83, 10);
    });

    it('should calculate 75th percentile', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p75 = array.percentile_linear_interpolation(arr, 75);
      expect(p75).toBeCloseTo(8, 10);
    });

    it('should handle 0th percentile', () => {
      const arr = [1, 2, 3, 4, 5];
      const p0 = array.percentile_linear_interpolation(arr, 0);
      expect(p0).toBe(1);
    });

    it('should handle 100th percentile', () => {
      const arr = [1, 2, 3, 4, 5];
      const p100 = array.percentile_linear_interpolation(arr, 100);
      expect(p100).toBe(5);
    });

    it('should return NaN for empty array', () => {
      const arr: number[] = [];
      const result = array.percentile_linear_interpolation(arr, 50);
      expect(isNaN(result)).toBe(true);
    });

    it('sorts na after the numbers; a position between two values is na when the array holds na', () => {
      const arr = [3, NaN, 1, 2, NaN, 5];
      expect(array.percentile_linear_interpolation(arr, 0)).toBe(1);
      expect(array.percentile_linear_interpolation(arr, 25)).toBe(2); // exact position 1
      expect(array.percentile_linear_interpolation(arr, 10)).toBeNaN(); // between 1 and 2
      expect(array.percentile_linear_interpolation(arr, 75)).toBeNaN(); // position 4: na
      expect(array.percentile_linear_interpolation([NaN, 7, 2], 50)).toBe(7);
      expect(array.percentile_linear_interpolation([NaN, 7, 2], 10)).toBe(2);
    });

    it('should work with negative numbers', () => {
      const arr = [-5, -3, -1, 1, 3, 5];
      const p50 = array.percentile_linear_interpolation(arr, 50);
      expect(p50).toBeCloseTo(0, 10);
    });

    it('should work with decimal values', () => {
      const arr = [1.1, 2.2, 3.3, 4.4, 5.5];
      const p50 = array.percentile_linear_interpolation(arr, 50);
      expect(p50).toBeCloseTo(3.3, 10);
    });

    it('should handle single element', () => {
      const arr = [42];
      const p50 = array.percentile_linear_interpolation(arr, 50);
      expect(p50).toBe(42);
    });
  });

  describe('array.percentile_nearest_rank', () => {
    it('should calculate 50th percentile (median)', () => {
      const arr = [1, 2, 3, 4, 5];
      const p50 = array.percentile_nearest_rank(arr, 50);
      expect(p50).toBe(3);
    });

    it('should always return a member of the array', () => {
      const arr = [1, 2, 3, 4];
      const p50 = array.percentile_nearest_rank(arr, 50);
      // Should be 2 or 3, not 2.5
      expect([2, 3]).toContain(p50);
    });

    it('should calculate 25th percentile', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p25 = array.percentile_nearest_rank(arr, 25);
      expect([3, 4]).toContain(p25); // Nearest rank method
    });

    it('should calculate 75th percentile', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p75 = array.percentile_nearest_rank(arr, 75);
      expect([7, 8]).toContain(p75); // Nearest rank method
    });

    it('should handle 0th percentile', () => {
      const arr = [1, 2, 3, 4, 5];
      const p0 = array.percentile_nearest_rank(arr, 0);
      expect(arr).toContain(p0);
    });

    it('should handle 100th percentile as largest value', () => {
      const arr = [1, 2, 3, 4, 5];
      const p100 = array.percentile_nearest_rank(arr, 100);
      expect(p100).toBe(5);
    });

    it('should return NaN for empty array', () => {
      const arr: number[] = [];
      const result = array.percentile_nearest_rank(arr, 50);
      expect(isNaN(result)).toBe(true);
    });

    it('sorts na after the numbers, ranks on the full size (PineScript)', () => {
      const arr = [1, NaN, 2, 3, NaN, 4, 5];
      expect(array.percentile_nearest_rank(arr, 50)).toBe(4); // rank 4 of [1, 2, 3, 4, 5, na, na]
      expect(array.percentile_nearest_rank([3, NaN, 1, 2, NaN, 5], 50)).toBe(3);
      expect(array.percentile_nearest_rank([3, NaN, 1, 2, NaN, 5], 75)).toBeNaN(); // rank 5: na
      expect(array.percentile_nearest_rank([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 33.3)).toBe(4);
    });

    it('should work with negative numbers', () => {
      const arr = [-5, -3, -1, 1, 3, 5];
      const p50 = array.percentile_nearest_rank(arr, 50);
      expect([-1, 1]).toContain(p50);
    });

    it('should work with decimal values', () => {
      const arr = [1.1, 2.2, 3.3, 4.4, 5.5];
      const p50 = array.percentile_nearest_rank(arr, 50);
      expect(arr).toContain(p50);
    });

    it('should handle single element', () => {
      const arr = [42];
      const p50 = array.percentile_nearest_rank(arr, 50);
      expect(p50).toBe(42);
    });

    it('should demonstrate difference from linear interpolation', () => {
      const arr = [1, 2, 3, 4];

      const linear = array.percentile_linear_interpolation(arr, 50);
      const nearest = array.percentile_nearest_rank(arr, 50);

      expect(linear).toBe(2.5); // Interpolated
      expect([2, 3]).toContain(nearest); // Member of array
      expect(nearest).not.toBe(linear);
    });
  });

  describe('array.percentrank', () => {
    it('should return percentile rank of element at index', () => {
      const arr = [1, 2, 3, 4, 5];
      const rank = array.percentrank(arr, 2); // Value 3 at index 2
      // 3 values <= 3: [1, 2, 3] = 60%
      expect(rank).toBe(60);
    });

    it('should return 100 for maximum value', () => {
      const arr = [1, 2, 3, 4, 5];
      const rank = array.percentrank(arr, 4); // Value 5 at index 4
      expect(rank).toBe(100);
    });

    it('should return 20 for minimum value', () => {
      const arr = [1, 2, 3, 4, 5];
      const rank = array.percentrank(arr, 0); // Value 1 at index 0
      expect(rank).toBe(20);
    });

    it('should handle duplicate values', () => {
      const arr = [1, 2, 3, 3, 3, 4, 5];
      const rank = array.percentrank(arr, 2); // Value 3 at index 2
      // 5 values <= 3: [1, 2, 3, 3, 3] = 5/7 ≈ 71.4%
      expect(rank).toBeCloseTo(71.43, 1);
    });

    it('should handle all identical values', () => {
      const arr = [5, 5, 5, 5, 5];
      const rank = array.percentrank(arr, 2);
      expect(rank).toBe(100); // All values <= 5
    });

    it('should return NaN for empty array', () => {
      const arr: number[] = [];
      const rank = array.percentrank(arr, 0);
      expect(isNaN(rank)).toBe(true);
    });

    it('should return NaN for out of bounds index', () => {
      const arr = [1, 2, 3];
      expect(isNaN(array.percentrank(arr, -1))).toBe(true);
      expect(isNaN(array.percentrank(arr, 3))).toBe(true);
      expect(isNaN(array.percentrank(arr, 10))).toBe(true);
    });

    it('should return NaN if value at index is NaN', () => {
      const arr = [1, 2, NaN, 4, 5];
      const rank = array.percentrank(arr, 2);
      expect(isNaN(rank)).toBe(true);
    });

    it('should ignore NaN values when counting', () => {
      const arr = [1, NaN, 2, 3, NaN, 4, 5];
      const rank = array.percentrank(arr, 3); // Value 3 at index 3
      // Count includes NaN positions: 3/7 ≈ 42.86%
      expect(rank).toBeCloseTo(42.86, 1);
    });

    it('should work with negative numbers', () => {
      const arr = [-5, -3, -1, 1, 3];
      const rank = array.percentrank(arr, 2); // Value -1 at index 2
      // 3 values <= -1: [-5, -3, -1] = 60%
      expect(rank).toBe(60);
    });

    it('should work with decimal values', () => {
      const arr = [1.1, 2.2, 3.3, 4.4, 5.5];
      const rank = array.percentrank(arr, 2); // Value 3.3
      expect(rank).toBe(60);
    });

    it('should handle unsorted arrays', () => {
      const arr = [5, 1, 3, 2, 4];
      const rank = array.percentrank(arr, 2); // Value 3 at index 2
      // 3 values <= 3: [1, 2, 3] = 60%
      expect(rank).toBe(60);
    });

    it('should demonstrate percentrank vs percentile', () => {
      const arr = [10, 20, 30, 40, 50];

      // Percentrank: what percent of values are <= value at index 2 (30)?
      const rank = array.percentrank(arr, 2);
      expect(rank).toBe(60); // 60% of values <= 30

      // Percentile: what value has 60% of values <= it?
      const p60 = array.percentile_nearest_rank(arr, 60);
      expect(p60).toBe(30); // Value at 60th percentile is 30

      // They're inverse operations!
    });
  });

  describe('Percentile functions comparison', () => {
    it('should demonstrate all three functions on same data', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      // What value is at the 50th percentile?
      const pLinear = array.percentile_linear_interpolation(arr, 50);
      const pNearest = array.percentile_nearest_rank(arr, 50);

      expect(pLinear).toBeCloseTo(5.5, 10); // Interpolated
      expect(pNearest).toBe(5); // Nearest member

      // What percentile is the value at index 4 (value 5)?
      const rank = array.percentrank(arr, 4);
      expect(rank).toBe(50); // 50% of values <= 5
    });

    it('should handle edge case with two elements', () => {
      const arr = [1, 10];

      const p50Linear = array.percentile_linear_interpolation(arr, 50);
      const p50Nearest = array.percentile_nearest_rank(arr, 50);

      expect(p50Linear).toBeCloseTo(5.5, 10); // Midpoint
      expect([1, 10]).toContain(p50Nearest); // One of the values

      const rank0 = array.percentrank(arr, 0);
      const rank1 = array.percentrank(arr, 1);

      expect(rank0).toBe(50); // 50% <= 1
      expect(rank1).toBe(100); // 100% <= 10
    });
  });
});
