import { array } from '../../src';

describe('Array Final Functions', () => {
  describe('array.sort_indices', () => {
    it('should return indices that would sort array in ascending order', () => {
      const arr = [5, -2, 0, 9, 1];
      const indices = array.sort_indices(arr);

      expect(indices).toEqual([1, 2, 4, 0, 3]);
      // Verify: arr[1]=-2, arr[2]=0, arr[4]=1, arr[0]=5, arr[3]=9
    });

    it('should return indices for descending order', () => {
      const arr = [5, -2, 0, 9, 1];
      const indices = array.sort_indices(arr, 'desc');

      expect(indices).toEqual([3, 0, 4, 2, 1]);
      // Verify: arr[3]=9, arr[0]=5, arr[4]=1, arr[2]=0, arr[1]=-2
    });

    it('should not modify original array', () => {
      const arr = [5, -2, 0, 9, 1];
      const original = [...arr];

      array.sort_indices(arr);

      expect(arr).toEqual(original);
    });

    it('should work with already sorted array', () => {
      const arr = [1, 2, 3, 4, 5];
      const indices = array.sort_indices(arr);

      expect(indices).toEqual([0, 1, 2, 3, 4]);
    });

    it('should work with reverse sorted array', () => {
      const arr = [5, 4, 3, 2, 1];
      const indices = array.sort_indices(arr);

      expect(indices).toEqual([4, 3, 2, 1, 0]);
    });

    it('should handle duplicate values', () => {
      const arr = [3, 1, 2, 1, 3];
      const indices = array.sort_indices(arr);

      // Should maintain stable sort for duplicates
      expect(arr[indices[0]]).toBe(1);
      expect(arr[indices[1]]).toBe(1);
      expect(arr[indices[2]]).toBe(2);
      expect(arr[indices[3]]).toBe(3);
      expect(arr[indices[4]]).toBe(3);
    });

    it('should handle single element', () => {
      const arr = [42];
      const indices = array.sort_indices(arr);

      expect(indices).toEqual([0]);
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      const indices = array.sort_indices(arr);

      expect(indices).toEqual([]);
    });

    it('should handle negative numbers', () => {
      const arr = [-5, -1, -3, -2, -4];
      const indices = array.sort_indices(arr);

      expect(indices).toEqual([0, 4, 2, 3, 1]);
      // -5, -4, -3, -2, -1
    });

    it('should handle decimal values', () => {
      const arr = [1.5, 1.1, 1.9, 1.3];
      const indices = array.sort_indices(arr);

      expect(indices).toEqual([1, 3, 0, 2]);
      // 1.1, 1.3, 1.5, 1.9
    });

    it('should allow accessing array in sorted order', () => {
      const arr = [5, -2, 0, 9, 1];
      const indices = array.sort_indices(arr);

      const sorted = indices.map(i => arr[i]);
      expect(sorted).toEqual([-2, 0, 1, 5, 9]);
    });

    it('should maintain correspondence with parallel arrays', () => {
      const values = [5, -2, 0, 9, 1];
      const names = ['E', 'B', 'C', 'A', 'D'];
      const indices = array.sort_indices(values);

      const sortedNames = indices.map(i => names[i]);
      expect(sortedNames).toEqual(['B', 'C', 'D', 'E', 'A']);
      // Corresponds to values: -2, 0, 1, 5, 9
    });
  });

  describe('array.standardize', () => {
    it('should standardize array to mean 0 and stddev 1', () => {
      const arr = [1, 2, 3, 4, 5];
      const standardized = array.standardize(arr);

      // Check mean is approximately 0
      const mean = array.avg(standardized);
      expect(mean).toBeCloseTo(0, 10);

      // Check stddev is approximately 1
      const stddev = array.stdev(standardized);
      expect(stddev).toBeCloseTo(1, 10);
    });

    it('should calculate correct z-scores', () => {
      const arr = [1, 2, 3, 4, 5];
      const standardized = array.standardize(arr);

      // Mean = 3, StdDev = sqrt(2) ≈ 1.414
      // z-scores: [(1-3)/1.414, (2-3)/1.414, 0, (4-3)/1.414, (5-3)/1.414]
      expect(standardized[0]).toBeCloseTo(-1.414, 2);
      expect(standardized[1]).toBeCloseTo(-0.707, 2);
      expect(standardized[2]).toBeCloseTo(0, 10);
      expect(standardized[3]).toBeCloseTo(0.707, 2);
      expect(standardized[4]).toBeCloseTo(1.414, 2);
    });

    it('should handle all identical values', () => {
      const arr = [5, 5, 5, 5, 5];
      const standardized = array.standardize(arr);

      // StdDev is 0, should return NaN
      expect(standardized.every(x => isNaN(x))).toBe(true);
    });

    it('should handle negative numbers', () => {
      const arr = [-5, -3, -1, 1, 3, 5];
      const standardized = array.standardize(arr);

      // Mean = 0, already centered
      const mean = array.avg(standardized);
      expect(mean).toBeCloseTo(0, 10);

      const stddev = array.stdev(standardized);
      expect(stddev).toBeCloseTo(1, 10);
    });

    it('should handle decimal values', () => {
      const arr = [1.1, 2.2, 3.3, 4.4, 5.5];
      const standardized = array.standardize(arr);

      const mean = array.avg(standardized);
      expect(mean).toBeCloseTo(0, 10);

      const stddev = array.stdev(standardized);
      expect(stddev).toBeCloseTo(1, 10);
    });

    it('should handle single element', () => {
      const arr = [42];
      const standardized = array.standardize(arr);

      // StdDev is 0 for single element
      expect(isNaN(standardized[0])).toBe(true);
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      const standardized = array.standardize(arr);

      expect(standardized).toEqual([]);
    });

    it('should handle two elements', () => {
      const arr = [1, 5];
      const standardized = array.standardize(arr);

      // Mean = 3, StdDev = 2
      expect(standardized[0]).toBeCloseTo(-1, 10);
      expect(standardized[1]).toBeCloseTo(1, 10);
    });

    it('should not modify original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];

      array.standardize(arr);

      expect(arr).toEqual(original);
    });

    it('should preserve relative ordering', () => {
      const arr = [10, 20, 30];
      const standardized = array.standardize(arr);

      // Values should maintain order
      expect(standardized[0]).toBeLessThan(standardized[1]);
      expect(standardized[1]).toBeLessThan(standardized[2]);
    });

    it('should work with large range of values', () => {
      const arr = [0, 100, 1000, 10000];
      const standardized = array.standardize(arr);

      const mean = array.avg(standardized);
      expect(mean).toBeCloseTo(0, 5);

      const stddev = array.stdev(standardized);
      expect(stddev).toBeCloseTo(1, 5);
    });

    it('should demonstrate use case for comparing different scales', () => {
      // Temperature in Celsius vs Height in cm
      const temps = [10, 15, 20, 25, 30];
      const heights = [150, 160, 170, 180, 190];

      const tempZ = array.standardize(temps);
      const heightZ = array.standardize(heights);

      // Now both are on same scale (z-scores)
      // Middle values should be close to 0
      expect(tempZ[2]).toBeCloseTo(0, 10);
      expect(heightZ[2]).toBeCloseTo(0, 10);

      // Both should have same stddev of 1
      expect(array.stdev(tempZ)).toBeCloseTo(1, 10);
      expect(array.stdev(heightZ)).toBeCloseTo(1, 10);
    });
  });

  describe('array.newtype', () => {
    it('should create empty array by default', () => {
      const arr = array.newtype<number>();
      expect(arr).toEqual([]);
      expect(arr.length).toBe(0);
    });

    it('should create array with specified size', () => {
      const arr = array.newtype<number>(5);
      expect(arr.length).toBe(5);
    });

    it('should create array with initial value', () => {
      const arr = array.newtype<number>(3, 42);
      expect(arr).toEqual([42, 42, 42]);
    });

    it('should work with string type', () => {
      const arr = array.newtype<string>(3, 'test');
      expect(arr).toEqual(['test', 'test', 'test']);
    });

    it('should work with boolean type', () => {
      const arr = array.newtype<boolean>(2, true);
      expect(arr).toEqual([true, true]);
    });

    it('should work with object type', () => {
      interface Point {
        x: number;
        y: number;
      }
      const point: Point = { x: 1, y: 2 };
      const arr = array.newtype<Point>(2, point);

      expect(arr.length).toBe(2);
      expect(arr[0]).toBe(point);
      expect(arr[1]).toBe(point);
    });

    it('should work as generic type parameter', () => {
      const arrNum = array.newtype<number>(3, 0);
      const arrStr = array.newtype<string>(3, '');

      expect(arrNum).toEqual([0, 0, 0]);
      expect(arrStr).toEqual(['', '', '']);
    });

    it('should note limited UDT support in documentation', () => {
      // This test documents that full UDT support is not yet available
      // The function works for basic types but complex UDT features
      // from PineScript are not implemented

      const arr = array.newtype<any>(3);
      expect(arr.length).toBe(3);

      // UDT-specific features would require additional implementation:
      // - Type methods
      // - Type validation
      // - Type inheritance
      // - etc.
    });
  });

  describe('Drawing object array functions', () => {
    it('should include drawing object type constructors', () => {
      // After implementing drawing objects (Phase 4-5), these are now available
      // These were previously excluded as "rendering functions" but now implemented
      // with computational focus (no actual rendering)

      expect(typeof array.new_line).toBe('function');
      expect(typeof array.new_box).toBe('function');
      expect(typeof array.new_label).toBe('function');
      expect(typeof array.new_linefill).toBe('function');

      // new_table() remains excluded (no computational value)
      expect(array).not.toHaveProperty('new_table');
    });

    it('should confirm all calculation functions remain available', () => {
      // This library focuses on calculation functions
      // All statistical and calculation functions should be available

      expect(typeof array.avg).toBe('function');
      expect(typeof array.stdev).toBe('function');
      expect(typeof array.standardize).toBe('function');
      expect(typeof array.covariance).toBe('function');
      expect(typeof array.percentile_linear_interpolation).toBe('function');

      // Drawing object arrays are now available too
      expect(typeof array.new_line).toBe('function');
      expect(typeof array.new_box).toBe('function');
    });
  });
});
