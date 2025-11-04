import { array } from '../../src';

describe('Array Binary Search Functions', () => {
  describe('array.binary_search', () => {
    it('should find value in sorted array', () => {
      const arr = [-2, 0, 1, 5, 9];
      expect(array.binary_search(arr, 5)).toBe(3);
      expect(array.binary_search(arr, -2)).toBe(0);
      expect(array.binary_search(arr, 9)).toBe(4);
    });

    it('should return -1 when value not found', () => {
      const arr = [-2, 0, 1, 5, 9];
      expect(array.binary_search(arr, 3)).toBe(-1);
      expect(array.binary_search(arr, 10)).toBe(-1);
      expect(array.binary_search(arr, -10)).toBe(-1);
    });

    it('should work with single element', () => {
      const arr = [5];
      expect(array.binary_search(arr, 5)).toBe(0);
      expect(array.binary_search(arr, 3)).toBe(-1);
    });

    it('should work with two elements', () => {
      const arr = [1, 5];
      expect(array.binary_search(arr, 1)).toBe(0);
      expect(array.binary_search(arr, 5)).toBe(1);
      expect(array.binary_search(arr, 3)).toBe(-1);
    });

    it('should handle duplicate values', () => {
      const arr = [1, 2, 2, 2, 5];
      const index = array.binary_search(arr, 2);
      // Should return one of the indices where 2 exists (1, 2, or 3)
      expect([1, 2, 3]).toContain(index);
      expect(arr[index]).toBe(2);
    });

    it('should work with large arrays', () => {
      const arr = Array.from({ length: 1000 }, (_, i) => i);
      expect(array.binary_search(arr, 500)).toBe(500);
      expect(array.binary_search(arr, 0)).toBe(0);
      expect(array.binary_search(arr, 999)).toBe(999);
    });

    it('should work with negative numbers', () => {
      const arr = [-10, -5, -1, 0, 5, 10];
      expect(array.binary_search(arr, -5)).toBe(1);
      expect(array.binary_search(arr, 0)).toBe(3);
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      expect(array.binary_search(arr, 5)).toBe(-1);
    });

    it('should work with decimal values', () => {
      const arr = [1.1, 2.2, 3.3, 4.4, 5.5];
      expect(array.binary_search(arr, 3.3)).toBe(2);
    });
  });

  describe('array.binary_search_leftmost', () => {
    it('should return index of leftmost occurrence for duplicates', () => {
      const arr = [4, 5, 5, 5];
      expect(array.binary_search_leftmost(arr, 5)).toBe(1);
    });

    it('should return position left of where value would be', () => {
      const arr = [-2, 0, 1, 5, 9];
      expect(array.binary_search_leftmost(arr, 3)).toBe(2); // 1 is at index 2, left of where 3 would be
    });

    it('should find exact matches', () => {
      const arr = [-2, 0, 1, 5, 9];
      expect(array.binary_search_leftmost(arr, 5)).toBe(3);
      expect(array.binary_search_leftmost(arr, 0)).toBe(1);
    });

    it('should handle value smaller than all elements', () => {
      const arr = [5, 10, 15, 20];
      expect(array.binary_search_leftmost(arr, 3)).toBe(-1);
    });

    it('should handle value larger than all elements', () => {
      const arr = [5, 10, 15, 20];
      expect(array.binary_search_leftmost(arr, 25)).toBe(3); // Index of 20
    });

    it('should return leftmost for multiple duplicates at start', () => {
      const arr = [1, 1, 1, 2, 3];
      expect(array.binary_search_leftmost(arr, 1)).toBe(0);
    });

    it('should return leftmost for multiple duplicates in middle', () => {
      const arr = [1, 3, 3, 3, 5];
      expect(array.binary_search_leftmost(arr, 3)).toBe(1);
    });

    it('should return leftmost for multiple duplicates at end', () => {
      const arr = [1, 2, 5, 5, 5];
      expect(array.binary_search_leftmost(arr, 5)).toBe(2);
    });

    it('should work with single element found', () => {
      const arr = [5];
      expect(array.binary_search_leftmost(arr, 5)).toBe(0);
    });

    it('should work with single element not found', () => {
      const arr = [5];
      expect(array.binary_search_leftmost(arr, 10)).toBe(0);
      expect(array.binary_search_leftmost(arr, 3)).toBe(-1);
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      expect(array.binary_search_leftmost(arr, 5)).toBe(-1);
    });
  });

  describe('array.binary_search_rightmost', () => {
    it('should return index of rightmost occurrence for duplicates', () => {
      const arr = [4, 5, 5, 5];
      expect(array.binary_search_rightmost(arr, 5)).toBe(3);
    });

    it('should return position right of where value would be', () => {
      const arr = [-2, 0, 1, 5, 9];
      expect(array.binary_search_rightmost(arr, 3)).toBe(3); // 5 is at index 3, right of where 3 would be
    });

    it('should find exact matches', () => {
      const arr = [-2, 0, 1, 5, 9];
      expect(array.binary_search_rightmost(arr, 5)).toBe(3);
      expect(array.binary_search_rightmost(arr, 0)).toBe(1);
    });

    it('should handle value smaller than all elements', () => {
      const arr = [5, 10, 15, 20];
      expect(array.binary_search_rightmost(arr, 3)).toBe(0); // Index of 5
    });

    it('should handle value larger than all elements', () => {
      const arr = [5, 10, 15, 20];
      expect(array.binary_search_rightmost(arr, 25)).toBe(-1);
    });

    it('should return rightmost for multiple duplicates at start', () => {
      const arr = [1, 1, 1, 2, 3];
      expect(array.binary_search_rightmost(arr, 1)).toBe(2);
    });

    it('should return rightmost for multiple duplicates in middle', () => {
      const arr = [1, 3, 3, 3, 5];
      expect(array.binary_search_rightmost(arr, 3)).toBe(3);
    });

    it('should return rightmost for multiple duplicates at end', () => {
      const arr = [1, 2, 5, 5, 5];
      expect(array.binary_search_rightmost(arr, 5)).toBe(4);
    });

    it('should work with single element found', () => {
      const arr = [5];
      expect(array.binary_search_rightmost(arr, 5)).toBe(0);
    });

    it('should work with single element not found', () => {
      const arr = [5];
      expect(array.binary_search_rightmost(arr, 10)).toBe(-1);
      expect(array.binary_search_rightmost(arr, 3)).toBe(0);
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      expect(array.binary_search_rightmost(arr, 5)).toBe(-1);
    });
  });

  describe('array.binary_search comparison', () => {
    it('should demonstrate difference between leftmost and rightmost', () => {
      const arr = [1, 5, 5, 5, 10];

      const leftmost = array.binary_search_leftmost(arr, 5);
      const rightmost = array.binary_search_rightmost(arr, 5);

      expect(leftmost).toBe(1); // First 5
      expect(rightmost).toBe(3); // Last 5

      // Regular binary search returns any occurrence
      const regular = array.binary_search(arr, 5);
      expect(regular).toBeGreaterThanOrEqual(leftmost);
      expect(regular).toBeLessThanOrEqual(rightmost);
    });

    it('should demonstrate insertion points when not found', () => {
      const arr = [1, 3, 5, 7, 9];

      // Looking for 4 (between 3 and 5)
      const leftmost = array.binary_search_leftmost(arr, 4);
      const rightmost = array.binary_search_rightmost(arr, 4);
      const regular = array.binary_search(arr, 4);

      expect(leftmost).toBe(1); // Index of 3 (left of where 4 would be)
      expect(rightmost).toBe(2); // Index of 5 (right of where 4 would be)
      expect(regular).toBe(-1); // Not found
    });
  });
});

describe('Array Statistical Functions', () => {
  describe('array.covariance', () => {
    it('should calculate biased covariance by default', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [2, 4, 6, 8, 10];

      // Perfect positive correlation, covariance should be positive
      const cov = array.covariance(arr1, arr2);
      expect(cov).toBeGreaterThan(0);
      expect(cov).toBeCloseTo(4, 5); // Biased covariance
    });

    it('should calculate unbiased covariance when specified', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [2, 4, 6, 8, 10];

      const cov = array.covariance(arr1, arr2, false);
      expect(cov).toBeGreaterThan(0);
      expect(cov).toBeCloseTo(5, 5); // Unbiased covariance
    });

    it('should calculate negative covariance for inverse relationship', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [10, 8, 6, 4, 2];

      const cov = array.covariance(arr1, arr2);
      expect(cov).toBeLessThan(0);
    });

    it('should calculate zero covariance for no relationship', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [3, 3, 3, 3, 3]; // Constant

      const cov = array.covariance(arr1, arr2);
      expect(cov).toBeCloseTo(0, 10);
    });

    it('should return NaN for empty arrays', () => {
      const arr1: number[] = [];
      const arr2: number[] = [];

      const cov = array.covariance(arr1, arr2);
      expect(isNaN(cov)).toBe(true);
    });

    it('should return NaN for arrays of different lengths', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3, 4, 5];

      const cov = array.covariance(arr1, arr2);
      expect(isNaN(cov)).toBe(true);
    });

    it('should work with two elements', () => {
      const arr1 = [1, 2];
      const arr2 = [3, 4];

      const covBiased = array.covariance(arr1, arr2, true);
      const covUnbiased = array.covariance(arr1, arr2, false);

      expect(covBiased).toBeCloseTo(0.25, 10);
      expect(covUnbiased).toBeCloseTo(0.5, 10);
    });

    it('should handle negative numbers', () => {
      const arr1 = [-5, -3, -1, 1, 3, 5];
      const arr2 = [-10, -6, -2, 2, 6, 10];

      const cov = array.covariance(arr1, arr2);
      expect(cov).toBeGreaterThan(0);
    });

    it('should work with real-world price/volume data', () => {
      const prices = [100, 102, 98, 105, 103];
      const volumes = [1000, 1200, 950, 1300, 1100];

      const cov = array.covariance(prices, volumes);
      // Higher prices should correlate with higher volumes
      expect(cov).toBeGreaterThan(0);
    });

    it('should match variance when arrays are identical', () => {
      const arr = [1, 2, 3, 4, 5];

      const cov = array.covariance(arr, arr, true);
      const variance = array.variance(arr);

      expect(cov).toBeCloseTo(variance, 10);
    });

    it('should handle decimal values', () => {
      const arr1 = [1.5, 2.3, 3.7, 4.1];
      const arr2 = [2.1, 3.5, 5.2, 6.0];

      const cov = array.covariance(arr1, arr2);
      expect(cov).toBeGreaterThan(0);
    });

    it('should demonstrate difference between biased and unbiased', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [5, 4, 3, 2, 1];

      const biased = array.covariance(arr1, arr2, true);
      const unbiased = array.covariance(arr1, arr2, false);

      // Unbiased should have larger absolute value
      expect(Math.abs(unbiased)).toBeGreaterThan(Math.abs(biased));

      // They should have same sign
      expect(Math.sign(biased)).toBe(Math.sign(unbiased));
    });
  });
});
