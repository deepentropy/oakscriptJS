import { array } from '../../src';

describe('Array Type Constructors', () => {
  describe('array.new_bool', () => {
    it('should create empty boolean array by default', () => {
      const arr = array.new_bool();
      expect(arr).toEqual([]);
      expect(arr.length).toBe(0);
    });

    it('should create boolean array with specified size', () => {
      const arr = array.new_bool(5);
      expect(arr.length).toBe(5);
      expect(arr).toEqual([false, false, false, false, false]);
    });

    it('should create boolean array with initial value', () => {
      const arr = array.new_bool(3, true);
      expect(arr).toEqual([true, true, true]);
    });

    it('should handle size 0 explicitly', () => {
      const arr = array.new_bool(0, true);
      expect(arr).toEqual([]);
    });
  });

  describe('array.new_float', () => {
    it('should create empty float array by default', () => {
      const arr = array.new_float();
      expect(arr).toEqual([]);
      expect(arr.length).toBe(0);
    });

    it('should create float array with NaN by default', () => {
      const arr = array.new_float(3);
      expect(arr.length).toBe(3);
      expect(arr.every(x => isNaN(x))).toBe(true);
    });

    it('should create float array with initial value', () => {
      const arr = array.new_float(4, 3.14);
      expect(arr).toEqual([3.14, 3.14, 3.14, 3.14]);
    });

    it('should handle decimal values', () => {
      const arr = array.new_float(2, 0.5);
      expect(arr).toEqual([0.5, 0.5]);
    });
  });

  describe('array.new_int', () => {
    it('should create empty int array by default', () => {
      const arr = array.new_int();
      expect(arr).toEqual([]);
      expect(arr.length).toBe(0);
    });

    it('should create int array with NaN by default', () => {
      const arr = array.new_int(3);
      expect(arr.length).toBe(3);
      expect(arr.every(x => isNaN(x))).toBe(true);
    });

    it('should create int array with initial value', () => {
      const arr = array.new_int(5, 42);
      expect(arr).toEqual([42, 42, 42, 42, 42]);
    });

    it('should handle negative values', () => {
      const arr = array.new_int(3, -10);
      expect(arr).toEqual([-10, -10, -10]);
    });

    it('should handle zero', () => {
      const arr = array.new_int(2, 0);
      expect(arr).toEqual([0, 0]);
    });
  });

  describe('array.new_string', () => {
    it('should create empty string array by default', () => {
      const arr = array.new_string();
      expect(arr).toEqual([]);
      expect(arr.length).toBe(0);
    });

    it('should create string array with undefined by default', () => {
      const arr = array.new_string(3);
      expect(arr.length).toBe(3);
      expect(arr).toEqual([undefined, undefined, undefined]);
    });

    it('should create string array with initial value', () => {
      const arr = array.new_string(4, "hello");
      expect(arr).toEqual(["hello", "hello", "hello", "hello"]);
    });

    it('should handle empty string', () => {
      const arr = array.new_string(2, "");
      expect(arr).toEqual(["", ""]);
    });

    it('should handle special characters', () => {
      const arr = array.new_string(2, "Hello 世界! 🎉");
      expect(arr).toEqual(["Hello 世界! 🎉", "Hello 世界! 🎉"]);
    });
  });

  describe('array.new_color', () => {
    it('should create empty color array by default', () => {
      const arr = array.new_color();
      expect(arr).toEqual([]);
      expect(arr.length).toBe(0);
    });

    it('should create color array with undefined by default', () => {
      const arr = array.new_color(3);
      expect(arr.length).toBe(3);
      expect(arr).toEqual([undefined, undefined, undefined]);
    });

    it('should create color array with hex color', () => {
      const arr = array.new_color(3, "#FF0000");
      expect(arr).toEqual(["#FF0000", "#FF0000", "#FF0000"]);
    });

    it('should create color array with numeric color', () => {
      const arr = array.new_color(2, 0xFF0000);
      expect(arr).toEqual([0xFF0000, 0xFF0000]);
    });

    it('should handle rgb strings', () => {
      const arr = array.new_color(2, "rgb(255, 0, 0)");
      expect(arr).toEqual(["rgb(255, 0, 0)", "rgb(255, 0, 0)"]);
    });
  });
});

describe('Array Simple Math Functions', () => {
  describe('array.abs', () => {
    it('should return absolute values of all elements', () => {
      const arr = [-1, -2, 3, -4, 5];
      const result = array.abs(arr);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle all negative values', () => {
      const arr = [-10, -20, -30];
      const result = array.abs(arr);
      expect(result).toEqual([10, 20, 30]);
    });

    it('should handle all positive values', () => {
      const arr = [10, 20, 30];
      const result = array.abs(arr);
      expect(result).toEqual([10, 20, 30]);
    });

    it('should handle mixed positive and negative', () => {
      const arr = [5, -3, 0, -7, 2];
      const result = array.abs(arr);
      expect(result).toEqual([5, 3, 0, 7, 2]);
    });

    it('should handle zero', () => {
      const arr = [0, -0];
      const result = array.abs(arr);
      expect(result).toEqual([0, 0]);
    });

    it('should handle decimal values', () => {
      const arr = [-1.5, 2.5, -3.7];
      const result = array.abs(arr);
      expect(result).toEqual([1.5, 2.5, 3.7]);
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      const result = array.abs(arr);
      expect(result).toEqual([]);
    });

    it('should handle NaN values', () => {
      const arr = [1, NaN, -3];
      const result = array.abs(arr);
      expect(result[0]).toBe(1);
      expect(isNaN(result[1])).toBe(true);
      expect(result[2]).toBe(3);
    });

    it('should not modify original array', () => {
      const arr = [-1, -2, -3];
      const result = array.abs(arr);
      expect(arr).toEqual([-1, -2, -3]);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('array.range', () => {
    it('should return difference between max and min', () => {
      const arr = [1, 5, 3, 9, 2];
      const result = array.range(arr);
      expect(result).toBe(8); // 9 - 1
    });

    it('should handle all positive values', () => {
      const arr = [10, 20, 15, 25, 12];
      const result = array.range(arr);
      expect(result).toBe(15); // 25 - 10
    });

    it('should handle all negative values', () => {
      const arr = [-10, -20, -5, -15];
      const result = array.range(arr);
      expect(result).toBe(15); // -5 - (-20)
    });

    it('should handle mixed positive and negative', () => {
      const arr = [-5, 10, -3, 8];
      const result = array.range(arr);
      expect(result).toBe(15); // 10 - (-5)
    });

    it('should return 0 for identical values', () => {
      const arr = [5, 5, 5, 5];
      const result = array.range(arr);
      expect(result).toBe(0);
    });

    it('should handle single element', () => {
      const arr = [42];
      const result = array.range(arr);
      expect(result).toBe(0);
    });

    it('should handle two elements', () => {
      const arr = [3, 7];
      const result = array.range(arr);
      expect(result).toBe(4);
    });

    it('should return NaN for empty array', () => {
      const arr: number[] = [];
      const result = array.range(arr);
      expect(isNaN(result)).toBe(true);
    });

    it('should handle decimal values', () => {
      const arr = [1.5, 2.3, 0.8, 3.1];
      const result = array.range(arr);
      expect(result).toBeCloseTo(2.3, 10); // 3.1 - 0.8
    });

    it('should handle large numbers', () => {
      const arr = [1000000, 5000000, 2000000];
      const result = array.range(arr);
      expect(result).toBe(4000000); // 5000000 - 1000000
    });

    it('should handle very small differences', () => {
      const arr = [1.0001, 1.0002, 1.0003];
      const result = array.range(arr);
      expect(result).toBeCloseTo(0.0002, 10);
    });
  });
});
