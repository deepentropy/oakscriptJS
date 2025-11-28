import { matrix } from '../../src';

describe('Matrix Foundational Functions', () => {
  describe('matrix.new_matrix', () => {
    it('should create a matrix with specified dimensions', () => {
      const m = matrix.new_matrix(2, 3, 0);
      expect(m.rows).toBe(2);
      expect(m.columns).toBe(3);
      expect(m.data.length).toBe(2);
      expect(m.data[0]!.length).toBe(3);
    });

    it('should fill all elements with initial value', () => {
      const m = matrix.new_matrix(2, 2, 5);
      expect(m.data).toEqual([[5, 5], [5, 5]]);
    });

    it('should handle undefined initial value', () => {
      const m = matrix.new_matrix<number>(2, 2);
      expect(m.data).toEqual([[undefined, undefined], [undefined, undefined]]);
    });

    it('should create empty matrix with 0 rows', () => {
      const m = matrix.new_matrix(0, 3, 1);
      expect(m.rows).toBe(0);
      expect(m.columns).toBe(3);
      expect(m.data).toEqual([]);
    });

    it('should work with string values', () => {
      const m = matrix.new_matrix(2, 2, 'test');
      expect(m.data).toEqual([['test', 'test'], ['test', 'test']]);
    });
  });

  describe('matrix.get', () => {
    it('should return element at position', () => {
      const m = matrix.new_matrix(2, 3, 0);
      m.data[0]![0] = 1;
      m.data[0]![1] = 2;
      m.data[1]![2] = 9;

      expect(matrix.get(m, 0, 0)).toBe(1);
      expect(matrix.get(m, 0, 1)).toBe(2);
      expect(matrix.get(m, 0, 2)).toBe(0);
      expect(matrix.get(m, 1, 2)).toBe(9);
    });

    it('should work with index starting at 0', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 100);
      expect(matrix.get(m, 0, 0)).toBe(100);
    });
  });

  describe('matrix.set', () => {
    it('should set element at position', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 10);
      matrix.set(m, 1, 2, 20);

      expect(m.data[0]![0]).toBe(10);
      expect(m.data[1]![2]).toBe(20);
    });

    it('should overwrite existing value', () => {
      const m = matrix.new_matrix(2, 2, 5);
      expect(matrix.get(m, 0, 0)).toBe(5);
      
      matrix.set(m, 0, 0, 99);
      expect(matrix.get(m, 0, 0)).toBe(99);
    });

    it('should work with different types', () => {
      const m = matrix.new_matrix(2, 2, 'a');
      matrix.set(m, 0, 0, 'changed');
      expect(matrix.get(m, 0, 0)).toBe('changed');
    });
  });

  describe('matrix.rows', () => {
    it('should return number of rows', () => {
      const m = matrix.new_matrix(2, 6, 0);
      expect(matrix.rows(m)).toBe(2);
    });

    it('should return 0 for empty matrix', () => {
      const m = matrix.new_matrix(0, 5, 0);
      expect(matrix.rows(m)).toBe(0);
    });

    it('should return correct value for square matrix', () => {
      const m = matrix.new_matrix(5, 5, 0);
      expect(matrix.rows(m)).toBe(5);
    });
  });

  describe('matrix.columns', () => {
    it('should return number of columns', () => {
      const m = matrix.new_matrix(2, 6, 0);
      expect(matrix.columns(m)).toBe(6);
    });

    it('should return correct value for empty matrix', () => {
      const m = matrix.new_matrix(0, 5, 0);
      expect(matrix.columns(m)).toBe(5);
    });

    it('should return correct value for square matrix', () => {
      const m = matrix.new_matrix(5, 5, 0);
      expect(matrix.columns(m)).toBe(5);
    });
  });

  describe('matrix.elements_count', () => {
    it('should return total element count', () => {
      const m = matrix.new_matrix(3, 4, 0);
      expect(matrix.elements_count(m)).toBe(12);
    });

    it('should return 0 for empty matrix', () => {
      const m = matrix.new_matrix(0, 5, 0);
      expect(matrix.elements_count(m)).toBe(0);
    });

    it('should return correct count for single element matrix', () => {
      const m = matrix.new_matrix(1, 1, 0);
      expect(matrix.elements_count(m)).toBe(1);
    });

    it('should match rows * columns', () => {
      const m = matrix.new_matrix(7, 11, 0);
      expect(matrix.elements_count(m)).toBe(matrix.rows(m) * matrix.columns(m));
    });
  });

  describe('matrix.row', () => {
    it('should return row as array', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 0, 1, 2);
      matrix.set(m, 0, 2, 3);

      const r = matrix.row(m, 0);
      expect(r).toEqual([1, 2, 3]);
    });

    it('should return a copy, not reference', () => {
      const m = matrix.new_matrix(2, 2, 5);
      const r = matrix.row(m, 0);
      r[0] = 999;

      expect(matrix.get(m, 0, 0)).toBe(5);
    });

    it('should work with index 0', () => {
      const m = matrix.new_matrix(3, 2, 0);
      matrix.set(m, 0, 0, 10);
      matrix.set(m, 0, 1, 20);

      expect(matrix.row(m, 0)).toEqual([10, 20]);
    });

    it('should work with last row', () => {
      const m = matrix.new_matrix(3, 2, 0);
      matrix.set(m, 2, 0, 100);
      matrix.set(m, 2, 1, 200);

      expect(matrix.row(m, 2)).toEqual([100, 200]);
    });
  });

  describe('matrix.col', () => {
    it('should return column as array', () => {
      const m = matrix.new_matrix(3, 2, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 0, 2);
      matrix.set(m, 2, 0, 3);

      const c = matrix.col(m, 0);
      expect(c).toEqual([1, 2, 3]);
    });

    it('should return a copy, not reference', () => {
      const m = matrix.new_matrix(2, 2, 5);
      const c = matrix.col(m, 0);
      c[0] = 999;

      expect(matrix.get(m, 0, 0)).toBe(5);
    });

    it('should work with index 0', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 10);
      matrix.set(m, 1, 0, 20);

      expect(matrix.col(m, 0)).toEqual([10, 20]);
    });

    it('should work with last column', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 2, 100);
      matrix.set(m, 1, 2, 200);

      expect(matrix.col(m, 2)).toEqual([100, 200]);
    });
  });

  describe('matrix.copy', () => {
    it('should create a deep copy', () => {
      const m1 = matrix.new_matrix(2, 3, 1);
      const m2 = matrix.copy(m1);

      expect(m2.rows).toBe(m1.rows);
      expect(m2.columns).toBe(m1.columns);
      expect(m2.data).toEqual(m1.data);
    });

    it('should not share references', () => {
      const m1 = matrix.new_matrix(2, 2, 1);
      const m2 = matrix.copy(m1);

      matrix.set(m2, 0, 0, 99);

      expect(matrix.get(m1, 0, 0)).toBe(1);
      expect(matrix.get(m2, 0, 0)).toBe(99);
    });

    it('should handle empty matrix', () => {
      const m1 = matrix.new_matrix(0, 2, 0);
      const m2 = matrix.copy(m1);

      expect(m2.rows).toBe(0);
      expect(m2.columns).toBe(2);
      expect(m2.data).toEqual([]);
    });

    it('should work with different data types', () => {
      const m1 = matrix.new_matrix(2, 2, 'test');
      const m2 = matrix.copy(m1);

      expect(m2.data).toEqual([['test', 'test'], ['test', 'test']]);
    });
  });

  describe('matrix.fill', () => {
    it('should fill entire matrix by default', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.fill(m, 9);

      expect(m.data).toEqual([[9, 9, 9], [9, 9, 9]]);
    });

    it('should fill specified range', () => {
      const m = matrix.new_matrix(4, 5, 0);
      matrix.fill(m, 9, 0, 2, 1, 3);

      expect(matrix.get(m, 0, 0)).toBe(0);
      expect(matrix.get(m, 0, 1)).toBe(9);
      expect(matrix.get(m, 0, 2)).toBe(9);
      expect(matrix.get(m, 0, 3)).toBe(0);
      expect(matrix.get(m, 1, 1)).toBe(9);
      expect(matrix.get(m, 1, 2)).toBe(9);
      expect(matrix.get(m, 2, 1)).toBe(0);
    });

    it('should fill with from_row only', () => {
      const m = matrix.new_matrix(3, 2, 0);
      matrix.fill(m, 5, 1);

      expect(m.data[0]).toEqual([0, 0]);
      expect(m.data[1]).toEqual([5, 5]);
      expect(m.data[2]).toEqual([5, 5]);
    });

    it('should fill with from_column only', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.fill(m, 7, 0, undefined, 1);

      expect(m.data).toEqual([[0, 7, 7], [0, 7, 7]]);
    });

    it('should handle empty range', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.fill(m, 9, 0, 0, 0, 0);

      expect(m.data).toEqual([[0, 0], [0, 0]]);
    });
  });

  describe('matrix.is_square', () => {
    it('should return true for square matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      expect(matrix.is_square(m)).toBe(true);
    });

    it('should return false for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      expect(matrix.is_square(m)).toBe(false);
    });

    it('should return true for 1x1 matrix', () => {
      const m = matrix.new_matrix(1, 1, 0);
      expect(matrix.is_square(m)).toBe(true);
    });

    it('should handle empty matrix (0x0)', () => {
      const m = matrix.new_matrix(0, 0, 0);
      expect(matrix.is_square(m)).toBe(true);
    });

    it('should return false for 1x2 matrix', () => {
      const m = matrix.new_matrix(1, 2, 0);
      expect(matrix.is_square(m)).toBe(false);
    });
  });

  describe('matrix.is_zero', () => {
    it('should return true for zero matrix', () => {
      const m = matrix.new_matrix(2, 2, 0);
      expect(matrix.is_zero(m)).toBe(true);
    });

    it('should return false if any element is non-zero', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1);
      expect(matrix.is_zero(m)).toBe(false);
    });

    it('should return true for empty matrix', () => {
      const m = matrix.new_matrix(0, 2, 0);
      expect(matrix.is_zero(m)).toBe(true);
    });

    it('should handle negative numbers', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, -1);
      expect(matrix.is_zero(m)).toBe(false);
    });

    it('should handle decimal numbers', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 0.001);
      expect(matrix.is_zero(m)).toBe(false);
    });

    it('should work with larger matrices', () => {
      const m = matrix.new_matrix(10, 10, 0);
      expect(matrix.is_zero(m)).toBe(true);
      
      matrix.set(m, 9, 9, 1);
      expect(matrix.is_zero(m)).toBe(false);
    });
  });

  describe('matrix.is_binary', () => {
    it('should return true for matrix with only 0s and 1s', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 1);
      expect(matrix.is_binary(m)).toBe(true);
    });

    it('should return false for matrix with other values', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 2);
      expect(matrix.is_binary(m)).toBe(false);
    });

    it('should return true for zero matrix', () => {
      const m = matrix.new_matrix(2, 2, 0);
      expect(matrix.is_binary(m)).toBe(true);
    });

    it('should return true for ones matrix', () => {
      const m = matrix.new_matrix(2, 2, 1);
      expect(matrix.is_binary(m)).toBe(true);
    });

    it('should return true for empty matrix', () => {
      const m = matrix.new_matrix(0, 2, 0);
      expect(matrix.is_binary(m)).toBe(true);
    });

    it('should handle negative numbers', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, -1);
      expect(matrix.is_binary(m)).toBe(false);
    });

    it('should handle decimal 1', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1.0);
      expect(matrix.is_binary(m)).toBe(true);
    });

    it('should reject decimal values other than 1.0', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 0.5);
      expect(matrix.is_binary(m)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should work with complete workflow', () => {
      // Create a 3x3 matrix
      const m = matrix.new_matrix(3, 3, 0);
      
      // Check dimensions
      expect(matrix.rows(m)).toBe(3);
      expect(matrix.columns(m)).toBe(3);
      expect(matrix.elements_count(m)).toBe(9);
      expect(matrix.is_square(m)).toBe(true);
      expect(matrix.is_zero(m)).toBe(true);
      expect(matrix.is_binary(m)).toBe(true);

      // Set some values
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 1);
      matrix.set(m, 2, 2, 1);

      // Check properties changed
      expect(matrix.is_zero(m)).toBe(false);
      expect(matrix.is_binary(m)).toBe(true);

      // Get rows and columns
      expect(matrix.row(m, 0)).toEqual([1, 0, 0]);
      expect(matrix.row(m, 1)).toEqual([0, 1, 0]);
      expect(matrix.col(m, 0)).toEqual([1, 0, 0]);
      expect(matrix.col(m, 2)).toEqual([0, 0, 1]);

      // Copy and modify
      const m2 = matrix.copy(m);
      matrix.set(m2, 0, 0, 5);
      expect(matrix.get(m, 0, 0)).toBe(1);
      expect(matrix.get(m2, 0, 0)).toBe(5);
      expect(matrix.is_binary(m2)).toBe(false);
    });

    it('should work with fill in a range', () => {
      // Create a 4x4 matrix
      const m = matrix.new_matrix(4, 4, 0);
      
      // Fill center 2x2 with 1s
      matrix.fill(m, 1, 1, 3, 1, 3);

      expect(matrix.row(m, 0)).toEqual([0, 0, 0, 0]);
      expect(matrix.row(m, 1)).toEqual([0, 1, 1, 0]);
      expect(matrix.row(m, 2)).toEqual([0, 1, 1, 0]);
      expect(matrix.row(m, 3)).toEqual([0, 0, 0, 0]);

      expect(matrix.is_binary(m)).toBe(true);
      expect(matrix.is_zero(m)).toBe(false);
    });
  });

  describe('Bounds Checking', () => {
    describe('matrix.get', () => {
      it('should throw error for row out of bounds', () => {
        const m = matrix.new_matrix(2, 3, 0);
        expect(() => matrix.get(m, 5, 0)).toThrow(/out of bounds/);
        expect(() => matrix.get(m, -1, 0)).toThrow(/out of bounds/);
      });

      it('should throw error for column out of bounds', () => {
        const m = matrix.new_matrix(2, 3, 0);
        expect(() => matrix.get(m, 0, 5)).toThrow(/out of bounds/);
        expect(() => matrix.get(m, 0, -1)).toThrow(/out of bounds/);
      });
    });

    describe('matrix.set', () => {
      it('should throw error for row out of bounds', () => {
        const m = matrix.new_matrix(2, 3, 0);
        expect(() => matrix.set(m, 5, 0, 1)).toThrow(/out of bounds/);
        expect(() => matrix.set(m, -1, 0, 1)).toThrow(/out of bounds/);
      });

      it('should throw error for column out of bounds', () => {
        const m = matrix.new_matrix(2, 3, 0);
        expect(() => matrix.set(m, 0, 5, 1)).toThrow(/out of bounds/);
        expect(() => matrix.set(m, 0, -1, 1)).toThrow(/out of bounds/);
      });
    });

    describe('matrix.row', () => {
      it('should throw error for row out of bounds', () => {
        const m = matrix.new_matrix(2, 3, 0);
        expect(() => matrix.row(m, 5)).toThrow(/out of bounds/);
        expect(() => matrix.row(m, -1)).toThrow(/out of bounds/);
      });
    });

    describe('matrix.col', () => {
      it('should throw error for column out of bounds', () => {
        const m = matrix.new_matrix(2, 3, 0);
        expect(() => matrix.col(m, 5)).toThrow(/out of bounds/);
        expect(() => matrix.col(m, -1)).toThrow(/out of bounds/);
      });
    });
  });
});
