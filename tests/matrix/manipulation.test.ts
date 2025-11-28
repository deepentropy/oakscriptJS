import { matrix } from '../../src';

describe('Matrix Manipulation Functions', () => {
  // ==========================================
  // Row/Column Operations
  // ==========================================

  describe('matrix.add_row', () => {
    it('should add row at end by default', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.add_row(m);
      
      expect(matrix.rows(m)).toBe(3);
      expect(matrix.columns(m)).toBe(3);
      expect(matrix.row(m, 2)).toEqual([undefined, undefined, undefined]);
    });

    it('should add row at specified index', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 0, 2);
      
      matrix.add_row(m, 1);
      
      expect(matrix.rows(m)).toBe(3);
      expect(matrix.row(m, 0)).toEqual([1, 0, 0]);
      expect(matrix.row(m, 1)).toEqual([undefined, undefined, undefined]);
      expect(matrix.row(m, 2)).toEqual([2, 0, 0]);
    });

    it('should add array as row', () => {
      const m = matrix.new_matrix(2, 3, 0);
      const arr = [1, 2, 3];
      
      matrix.add_row(m, 0, arr);
      
      expect(matrix.rows(m)).toBe(3);
      expect(matrix.row(m, 0)).toEqual([1, 2, 3]);
    });

    it('should add array to empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      const arr = [1, 2];
      
      matrix.add_row(m, 0, arr);
      
      expect(matrix.rows(m)).toBe(1);
      expect(matrix.columns(m)).toBe(2);
      expect(matrix.row(m, 0)).toEqual([1, 2]);
    });

    it('should throw error for mismatched array size', () => {
      const m = matrix.new_matrix(2, 3, 0);
      const arr = [1, 2]; // Wrong size
      
      expect(() => matrix.add_row(m, 0, arr)).toThrow(/does not match/);
    });

    it('should throw error for out of bounds index', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(() => matrix.add_row(m, 5)).toThrow(/out of bounds/);
      expect(() => matrix.add_row(m, -1)).toThrow(/out of bounds/);
    });
  });

  describe('matrix.add_col', () => {
    it('should add column at end by default', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.add_col(m);
      
      expect(matrix.rows(m)).toBe(2);
      expect(matrix.columns(m)).toBe(4);
      expect(matrix.col(m, 3)).toEqual([undefined, undefined]);
    });

    it('should add column at specified index', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 0, 1, 2);
      
      matrix.add_col(m, 1);
      
      expect(matrix.columns(m)).toBe(4);
      expect(matrix.row(m, 0)).toEqual([1, undefined, 2, 0]);
    });

    it('should add array as column', () => {
      const m = matrix.new_matrix(2, 3, 0);
      const arr = [1, 2];
      
      matrix.add_col(m, 0, arr);
      
      expect(matrix.columns(m)).toBe(4);
      expect(matrix.col(m, 0)).toEqual([1, 2]);
    });

    it('should add array to empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      const arr = [1, 3];
      
      matrix.add_col(m, 0, arr);
      
      expect(matrix.rows(m)).toBe(2);
      expect(matrix.columns(m)).toBe(1);
      expect(matrix.col(m, 0)).toEqual([1, 3]);
    });

    it('should throw error for mismatched array size', () => {
      const m = matrix.new_matrix(2, 3, 0);
      const arr = [1, 2, 3]; // Wrong size
      
      expect(() => matrix.add_col(m, 0, arr)).toThrow(/does not match/);
    });
  });

  describe('matrix.remove_row', () => {
    it('should remove last row by default', () => {
      const m = matrix.new_matrix(2, 2, 1);
      matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3);
      matrix.set(m, 1, 1, 4);
      
      const removed = matrix.remove_row(m);
      
      expect(matrix.rows(m)).toBe(1);
      expect(removed).toEqual([3, 4]);
    });

    it('should remove row at specified index', () => {
      const m = matrix.new_matrix(2, 2, 1);
      matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3);
      matrix.set(m, 1, 1, 4);
      
      const removed = matrix.remove_row(m, 0);
      
      expect(matrix.rows(m)).toBe(1);
      expect(removed).toEqual([1, 2]);
      expect(matrix.row(m, 0)).toEqual([3, 4]);
    });

    it('should throw error for out of bounds index', () => {
      const m = matrix.new_matrix(2, 2, 0);
      
      expect(() => matrix.remove_row(m, 5)).toThrow(/out of bounds/);
      expect(() => matrix.remove_row(m, -1)).toThrow(/out of bounds/);
    });
  });

  describe('matrix.remove_col', () => {
    it('should remove last column by default', () => {
      const m = matrix.new_matrix(2, 2, 1);
      matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3);
      matrix.set(m, 1, 1, 4);
      
      const removed = matrix.remove_col(m);
      
      expect(matrix.columns(m)).toBe(1);
      expect(removed).toEqual([2, 4]);
    });

    it('should remove column at specified index', () => {
      const m = matrix.new_matrix(2, 2, 1);
      matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3);
      matrix.set(m, 1, 1, 4);
      
      const removed = matrix.remove_col(m, 0);
      
      expect(matrix.columns(m)).toBe(1);
      expect(removed).toEqual([1, 3]);
      expect(matrix.col(m, 0)).toEqual([2, 4]);
    });

    it('should throw error for out of bounds index', () => {
      const m = matrix.new_matrix(2, 2, 0);
      
      expect(() => matrix.remove_col(m, 5)).toThrow(/out of bounds/);
      expect(() => matrix.remove_col(m, -1)).toThrow(/out of bounds/);
    });
  });

  describe('matrix.swap_rows', () => {
    it('should swap two rows', () => {
      const m = matrix.new_matrix(3, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      matrix.set(m, 2, 0, 5); matrix.set(m, 2, 1, 6);
      
      matrix.swap_rows(m, 0, 1);
      
      expect(matrix.row(m, 0)).toEqual([3, 4]);
      expect(matrix.row(m, 1)).toEqual([1, 2]);
      expect(matrix.row(m, 2)).toEqual([5, 6]);
    });

    it('should handle swapping same row', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      
      matrix.swap_rows(m, 0, 0);
      
      expect(matrix.row(m, 0)).toEqual([1, 2]);
    });

    it('should throw error for out of bounds indices', () => {
      const m = matrix.new_matrix(2, 2, 0);
      
      expect(() => matrix.swap_rows(m, 0, 5)).toThrow(/out of bounds/);
      expect(() => matrix.swap_rows(m, -1, 0)).toThrow(/out of bounds/);
    });
  });

  describe('matrix.swap_columns', () => {
    it('should swap two columns', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);
      
      matrix.swap_columns(m, 0, 2);
      
      expect(matrix.col(m, 0)).toEqual([3, 6]);
      expect(matrix.col(m, 1)).toEqual([2, 5]);
      expect(matrix.col(m, 2)).toEqual([1, 4]);
    });

    it('should throw error for out of bounds indices', () => {
      const m = matrix.new_matrix(2, 2, 0);
      
      expect(() => matrix.swap_columns(m, 0, 5)).toThrow(/out of bounds/);
      expect(() => matrix.swap_columns(m, -1, 0)).toThrow(/out of bounds/);
    });
  });

  // ==========================================
  // Matrix Transformations
  // ==========================================

  describe('matrix.transpose', () => {
    it('should transpose a matrix', () => {
      const m1 = matrix.new_matrix(2, 3, 0);
      matrix.set(m1, 0, 0, 1); matrix.set(m1, 0, 1, 2); matrix.set(m1, 0, 2, 3);
      matrix.set(m1, 1, 0, 4); matrix.set(m1, 1, 1, 5); matrix.set(m1, 1, 2, 6);
      
      const m2 = matrix.transpose(m1);
      
      expect(matrix.rows(m2)).toBe(3);
      expect(matrix.columns(m2)).toBe(2);
      expect(matrix.row(m2, 0)).toEqual([1, 4]);
      expect(matrix.row(m2, 1)).toEqual([2, 5]);
      expect(matrix.row(m2, 2)).toEqual([3, 6]);
    });

    it('should transpose a square matrix', () => {
      const m1 = matrix.new_matrix(2, 2, 0);
      matrix.set(m1, 0, 0, 1); matrix.set(m1, 0, 1, 2);
      matrix.set(m1, 1, 0, 3); matrix.set(m1, 1, 1, 4);
      
      const m2 = matrix.transpose(m1);
      
      expect(matrix.get(m2, 0, 1)).toBe(3);
      expect(matrix.get(m2, 1, 0)).toBe(2);
    });

    it('should handle empty matrix', () => {
      const m1 = matrix.new_matrix(0, 0, 0);
      const m2 = matrix.transpose(m1);
      
      expect(matrix.rows(m2)).toBe(0);
      expect(matrix.columns(m2)).toBe(0);
    });

    it('should not modify original matrix', () => {
      const m1 = matrix.new_matrix(2, 3, 1);
      const m2 = matrix.transpose(m1);
      
      matrix.set(m2, 0, 0, 99);
      
      expect(matrix.get(m1, 0, 0)).toBe(1);
    });
  });

  describe('matrix.concat', () => {
    it('should concatenate two matrices vertically', () => {
      const m1 = matrix.new_matrix(2, 4, 0);
      const m2 = matrix.new_matrix(2, 4, 1);
      
      matrix.concat(m1, m2);
      
      expect(matrix.rows(m1)).toBe(4);
      expect(matrix.columns(m1)).toBe(4);
      expect(matrix.row(m1, 0)).toEqual([0, 0, 0, 0]);
      expect(matrix.row(m1, 2)).toEqual([1, 1, 1, 1]);
    });

    it('should throw error for column mismatch', () => {
      const m1 = matrix.new_matrix(2, 3, 0);
      const m2 = matrix.new_matrix(2, 4, 1);
      
      expect(() => matrix.concat(m1, m2)).toThrow(/Column count mismatch/);
    });

    it('should return the modified first matrix', () => {
      const m1 = matrix.new_matrix(1, 2, 0);
      const m2 = matrix.new_matrix(1, 2, 1);
      
      const result = matrix.concat(m1, m2);
      
      expect(result).toBe(m1);
    });
  });

  describe('matrix.submatrix', () => {
    it('should extract a submatrix', () => {
      const m1 = matrix.new_matrix(2, 3, 0);
      matrix.set(m1, 0, 0, 1); matrix.set(m1, 0, 1, 2); matrix.set(m1, 0, 2, 3);
      matrix.set(m1, 1, 0, 4); matrix.set(m1, 1, 1, 5); matrix.set(m1, 1, 2, 6);
      
      const m2 = matrix.submatrix(m1, 0, 2, 1, 3);
      
      expect(matrix.rows(m2)).toBe(2);
      expect(matrix.columns(m2)).toBe(2);
      expect(matrix.row(m2, 0)).toEqual([2, 3]);
      expect(matrix.row(m2, 1)).toEqual([5, 6]);
    });

    it('should use defaults for full matrix', () => {
      const m1 = matrix.new_matrix(2, 2, 1);
      const m2 = matrix.submatrix(m1);
      
      expect(matrix.rows(m2)).toBe(2);
      expect(matrix.columns(m2)).toBe(2);
    });

    it('should return independent copy', () => {
      const m1 = matrix.new_matrix(2, 2, 1);
      const m2 = matrix.submatrix(m1);
      
      matrix.set(m2, 0, 0, 99);
      
      expect(matrix.get(m1, 0, 0)).toBe(1);
    });

    it('should throw error for invalid indices', () => {
      const m = matrix.new_matrix(2, 2, 0);
      
      expect(() => matrix.submatrix(m, -1)).toThrow(/out of bounds/);
      expect(() => matrix.submatrix(m, 0, 5)).toThrow(/out of bounds/);
    });
  });

  describe('matrix.reshape', () => {
    it('should reshape a matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);
      
      matrix.reshape(m, 3, 2);
      
      expect(matrix.rows(m)).toBe(3);
      expect(matrix.columns(m)).toBe(2);
      expect(matrix.row(m, 0)).toEqual([1, 2]);
      expect(matrix.row(m, 1)).toEqual([3, 4]);
      expect(matrix.row(m, 2)).toEqual([5, 6]);
    });

    it('should reshape to single row', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      matrix.reshape(m, 1, 4);
      
      expect(matrix.row(m, 0)).toEqual([1, 2, 3, 4]);
    });

    it('should throw error for element count mismatch', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(() => matrix.reshape(m, 2, 2)).toThrow(/Cannot reshape/);
    });
  });

  describe('matrix.reverse', () => {
    it('should reverse rows and columns', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      matrix.reverse(m);
      
      expect(matrix.row(m, 0)).toEqual([4, 3]);
      expect(matrix.row(m, 1)).toEqual([2, 1]);
    });

    it('should reverse a 3x2 matrix', () => {
      const m = matrix.new_matrix(3, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      matrix.set(m, 2, 0, 5); matrix.set(m, 2, 1, 6);
      
      matrix.reverse(m);
      
      expect(matrix.row(m, 0)).toEqual([6, 5]);
      expect(matrix.row(m, 1)).toEqual([4, 3]);
      expect(matrix.row(m, 2)).toEqual([2, 1]);
    });
  });

  describe('matrix.sort', () => {
    it('should sort by first column ascending by default', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 3); matrix.set(m, 0, 1, 4);
      matrix.set(m, 1, 0, 1); matrix.set(m, 1, 1, 2);
      
      matrix.sort(m);
      
      expect(matrix.row(m, 0)).toEqual([1, 2]);
      expect(matrix.row(m, 1)).toEqual([3, 4]);
    });

    it('should sort by specified column', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 3); matrix.set(m, 0, 1, 1);
      matrix.set(m, 1, 0, 1); matrix.set(m, 1, 1, 4);
      
      matrix.sort(m, 1);
      
      expect(matrix.row(m, 0)).toEqual([3, 1]);
      expect(matrix.row(m, 1)).toEqual([1, 4]);
    });

    it('should sort descending', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      matrix.sort(m, 0, 'descending');
      
      expect(matrix.row(m, 0)).toEqual([3, 4]);
      expect(matrix.row(m, 1)).toEqual([1, 2]);
    });

    it('should throw error for invalid column', () => {
      const m = matrix.new_matrix(2, 2, 0);
      
      expect(() => matrix.sort(m, 5)).toThrow(/out of bounds/);
    });
  });

  // ==========================================
  // Element-wise Arithmetic
  // ==========================================

  describe('matrix.sum', () => {
    it('should add two matrices element-wise', () => {
      const m1 = matrix.new_matrix(2, 3, 5);
      const m2 = matrix.new_matrix(2, 3, 4);
      
      const m3 = matrix.sum(m1, m2);
      
      expect(matrix.get(m3, 0, 0)).toBe(9);
      expect(matrix.get(m3, 1, 2)).toBe(9);
    });

    it('should add scalar to matrix', () => {
      const m1 = matrix.new_matrix(2, 3, 4);
      
      const m2 = matrix.sum(m1, 1);
      
      expect(matrix.get(m2, 0, 0)).toBe(5);
      expect(matrix.get(m2, 1, 2)).toBe(5);
    });

    it('should throw error for dimension mismatch', () => {
      const m1 = matrix.new_matrix(2, 3, 0);
      const m2 = matrix.new_matrix(3, 2, 0);
      
      expect(() => matrix.sum(m1, m2)).toThrow(/dimensions must match/);
    });

    it('should not modify original matrices', () => {
      const m1 = matrix.new_matrix(2, 2, 1);
      const m2 = matrix.new_matrix(2, 2, 2);
      
      const m3 = matrix.sum(m1, m2);
      matrix.set(m3, 0, 0, 99);
      
      expect(matrix.get(m1, 0, 0)).toBe(1);
      expect(matrix.get(m2, 0, 0)).toBe(2);
    });
  });

  describe('matrix.diff', () => {
    it('should subtract two matrices element-wise', () => {
      const m1 = matrix.new_matrix(2, 3, 5);
      const m2 = matrix.new_matrix(2, 3, 4);
      
      const m3 = matrix.diff(m1, m2);
      
      expect(matrix.get(m3, 0, 0)).toBe(1);
      expect(matrix.get(m3, 1, 2)).toBe(1);
    });

    it('should subtract scalar from matrix', () => {
      const m1 = matrix.new_matrix(2, 3, 4);
      
      const m2 = matrix.diff(m1, 1);
      
      expect(matrix.get(m2, 0, 0)).toBe(3);
      expect(matrix.get(m2, 1, 2)).toBe(3);
    });

    it('should throw error for dimension mismatch', () => {
      const m1 = matrix.new_matrix(2, 3, 0);
      const m2 = matrix.new_matrix(3, 2, 0);
      
      expect(() => matrix.diff(m1, m2)).toThrow(/dimensions must match/);
    });
  });

  // ==========================================
  // Statistical Functions
  // ==========================================

  describe('matrix.avg', () => {
    it('should calculate average of all elements', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      expect(matrix.avg(m)).toBe(2.5);
    });

    it('should handle empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      
      expect(matrix.avg(m)).toBeNaN();
    });

    it('should ignore NaN values', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, NaN); matrix.set(m, 1, 1, 3);
      
      expect(matrix.avg(m)).toBe(2); // (1+2+3) / 3
    });
  });

  describe('matrix.min', () => {
    it('should return minimum element', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      expect(matrix.min(m)).toBe(1);
    });

    it('should handle negative numbers', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, -5); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      expect(matrix.min(m)).toBe(-5);
    });

    it('should handle empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      
      expect(matrix.min(m)).toBeNaN();
    });
  });

  describe('matrix.max', () => {
    it('should return maximum element', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      expect(matrix.max(m)).toBe(4);
    });

    it('should handle negative numbers', () => {
      const m = matrix.new_matrix(2, 2, -5);
      matrix.set(m, 1, 1, -1);
      
      expect(matrix.max(m)).toBe(-1);
    });

    it('should handle empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      
      expect(matrix.max(m)).toBeNaN();
    });
  });

  describe('matrix.median', () => {
    it('should return median for odd count', () => {
      const m = matrix.new_matrix(1, 5, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 0, 1, 2);
      matrix.set(m, 0, 2, 3);
      matrix.set(m, 0, 3, 4);
      matrix.set(m, 0, 4, 5);
      
      expect(matrix.median(m)).toBe(3);
    });

    it('should return median for even count', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      expect(matrix.median(m)).toBe(2.5);
    });

    it('should handle unsorted values', () => {
      const m = matrix.new_matrix(1, 3, 0);
      matrix.set(m, 0, 0, 5);
      matrix.set(m, 0, 1, 1);
      matrix.set(m, 0, 2, 9);
      
      expect(matrix.median(m)).toBe(5);
    });

    it('should handle empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      
      expect(matrix.median(m)).toBeNaN();
    });
  });

  describe('matrix.mode', () => {
    it('should return most frequent value', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 2); matrix.set(m, 1, 2, 1);
      
      expect(matrix.mode(m)).toBe(2);
    });

    it('should return smallest value on tie', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 0); matrix.set(m, 0, 1, 0);
      matrix.set(m, 1, 0, 1); matrix.set(m, 1, 1, 1);
      
      expect(matrix.mode(m)).toBe(0);
    });

    it('should handle empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      
      expect(matrix.mode(m)).toBeNaN();
    });
  });

  describe('matrix.trace', () => {
    it('should return sum of diagonal elements', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      expect(matrix.trace(m)).toBe(5); // 1 + 4
    });

    it('should work for 3x3 matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 2);
      matrix.set(m, 2, 2, 3);
      
      expect(matrix.trace(m)).toBe(6);
    });

    it('should throw error for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(() => matrix.trace(m)).toThrow(/must be square/);
    });

    it('should return 0 for empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      
      expect(matrix.trace(m)).toBe(0);
    });
  });

  // ==========================================
  // Boolean Checks
  // ==========================================

  describe('matrix.is_diagonal', () => {
    it('should return true for diagonal matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 2);
      matrix.set(m, 2, 2, 3);
      
      expect(matrix.is_diagonal(m)).toBe(true);
    });

    it('should return true for zero matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      
      expect(matrix.is_diagonal(m)).toBe(true);
    });

    it('should return false for non-diagonal', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 0, 1, 2); // Off-diagonal element
      
      expect(matrix.is_diagonal(m)).toBe(false);
    });

    it('should return false for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(matrix.is_diagonal(m)).toBe(false);
    });
  });

  describe('matrix.is_identity', () => {
    it('should return true for identity matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 1);
      matrix.set(m, 2, 2, 1);
      
      expect(matrix.is_identity(m)).toBe(true);
    });

    it('should return false for diagonal matrix with non-1 values', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 2);
      matrix.set(m, 1, 1, 2);
      matrix.set(m, 2, 2, 2);
      
      expect(matrix.is_identity(m)).toBe(false);
    });

    it('should return false for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(matrix.is_identity(m)).toBe(false);
    });
  });

  describe('matrix.is_symmetric', () => {
    it('should return true for symmetric matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 2); matrix.set(m, 1, 1, 4); matrix.set(m, 1, 2, 5);
      matrix.set(m, 2, 0, 3); matrix.set(m, 2, 1, 5); matrix.set(m, 2, 2, 6);
      
      expect(matrix.is_symmetric(m)).toBe(true);
    });

    it('should return true for diagonal matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 2);
      matrix.set(m, 2, 2, 3);
      
      expect(matrix.is_symmetric(m)).toBe(true);
    });

    it('should return false for non-symmetric matrix', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
      
      expect(matrix.is_symmetric(m)).toBe(false);
    });

    it('should return false for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(matrix.is_symmetric(m)).toBe(false);
    });
  });

  describe('matrix.is_antisymmetric', () => {
    it('should return true for antisymmetric matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 1, 2);  matrix.set(m, 0, 2, -1);
      matrix.set(m, 1, 0, -2); matrix.set(m, 1, 2, 3);
      matrix.set(m, 2, 0, 1);  matrix.set(m, 2, 1, -3);
      
      expect(matrix.is_antisymmetric(m)).toBe(true);
    });

    it('should return true for zero matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      
      expect(matrix.is_antisymmetric(m)).toBe(true);
    });

    it('should return false when diagonal is not zero', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1);
      
      expect(matrix.is_antisymmetric(m)).toBe(false);
    });

    it('should return false for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(matrix.is_antisymmetric(m)).toBe(false);
    });
  });

  describe('matrix.is_triangular', () => {
    it('should return true for upper triangular matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 1, 4); matrix.set(m, 1, 2, 5);
      matrix.set(m, 2, 2, 6);
      
      expect(matrix.is_triangular(m)).toBe(true);
    });

    it('should return true for lower triangular matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 0, 2); matrix.set(m, 1, 1, 3);
      matrix.set(m, 2, 0, 4); matrix.set(m, 2, 1, 5); matrix.set(m, 2, 2, 6);
      
      expect(matrix.is_triangular(m)).toBe(true);
    });

    it('should return true for diagonal matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 2);
      matrix.set(m, 2, 2, 3);
      
      expect(matrix.is_triangular(m)).toBe(true);
    });

    it('should return false for non-triangular matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 2, 2);
      matrix.set(m, 2, 0, 3); matrix.set(m, 2, 2, 4);
      
      expect(matrix.is_triangular(m)).toBe(false);
    });

    it('should return false for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(matrix.is_triangular(m)).toBe(false);
    });
  });

  describe('matrix.is_antidiagonal', () => {
    it('should return true for antidiagonal matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 2, 1);
      matrix.set(m, 1, 1, 2);
      matrix.set(m, 2, 0, 3);
      
      expect(matrix.is_antidiagonal(m)).toBe(true);
    });

    it('should return true for zero matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      
      expect(matrix.is_antidiagonal(m)).toBe(true);
    });

    it('should return false when non-antidiagonal element is non-zero', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); // Main diagonal, not antidiagonal
      
      expect(matrix.is_antidiagonal(m)).toBe(false);
    });

    it('should return false for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 0);
      
      expect(matrix.is_antidiagonal(m)).toBe(false);
    });
  });

  describe('matrix.is_stochastic', () => {
    it('should return true for stochastic matrix', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 0.5); matrix.set(m, 0, 1, 0.5);
      matrix.set(m, 1, 0, 0.3); matrix.set(m, 1, 1, 0.7);
      
      expect(matrix.is_stochastic(m)).toBe(true);
    });

    it('should return false for negative elements', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, -0.5); matrix.set(m, 0, 1, 1.5);
      matrix.set(m, 1, 0, 0.3); matrix.set(m, 1, 1, 0.7);
      
      expect(matrix.is_stochastic(m)).toBe(false);
    });

    it('should return false when row sum is not 1', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 0.5); matrix.set(m, 0, 1, 0.6); // Sum = 1.1
      matrix.set(m, 1, 0, 0.3); matrix.set(m, 1, 1, 0.7);
      
      expect(matrix.is_stochastic(m)).toBe(false);
    });

    it('should return false for empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      
      expect(matrix.is_stochastic(m)).toBe(false);
    });

    it('should handle floating point precision', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 0.1); matrix.set(m, 0, 1, 0.2); matrix.set(m, 0, 2, 0.7);
      matrix.set(m, 1, 0, 0.3); matrix.set(m, 1, 1, 0.3); matrix.set(m, 1, 2, 0.4);
      
      expect(matrix.is_stochastic(m)).toBe(true);
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================

  describe('Integration Tests', () => {
    it('should handle complete manipulation workflow', () => {
      // Create a 2x3 matrix
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);

      // Transpose it
      const transposed = matrix.transpose(m);
      expect(matrix.rows(transposed)).toBe(3);
      expect(matrix.columns(transposed)).toBe(2);

      // Extract a submatrix
      const sub = matrix.submatrix(m, 0, 2, 1, 3);
      expect(matrix.rows(sub)).toBe(2);
      expect(matrix.columns(sub)).toBe(2);
      expect(matrix.row(sub, 0)).toEqual([2, 3]);

      // Statistics
      expect(matrix.avg(m)).toBe(3.5);
      expect(matrix.min(m)).toBe(1);
      expect(matrix.max(m)).toBe(6);
    });

    it('should handle matrix arithmetic workflow', () => {
      const m1 = matrix.new_matrix(2, 2, 1);
      const m2 = matrix.new_matrix(2, 2, 2);

      const sumMatrix = matrix.sum(m1, m2);
      expect(matrix.get(sumMatrix, 0, 0)).toBe(3);

      const diffMatrix = matrix.diff(sumMatrix, 1);
      expect(matrix.get(diffMatrix, 0, 0)).toBe(2);
    });

    it('should handle boolean checks workflow', () => {
      // Create identity matrix
      const identity = matrix.new_matrix(3, 3, 0);
      matrix.set(identity, 0, 0, 1);
      matrix.set(identity, 1, 1, 1);
      matrix.set(identity, 2, 2, 1);

      expect(matrix.is_square(identity)).toBe(true);
      expect(matrix.is_diagonal(identity)).toBe(true);
      expect(matrix.is_identity(identity)).toBe(true);
      expect(matrix.is_symmetric(identity)).toBe(true);
      expect(matrix.is_triangular(identity)).toBe(true);
      expect(matrix.trace(identity)).toBe(3);
    });
  });
});
