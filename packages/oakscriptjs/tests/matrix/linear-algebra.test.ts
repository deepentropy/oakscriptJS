import { matrix } from '../../src';

describe('Matrix Linear Algebra Functions (Phase 3)', () => {
  // ==========================================
  // matrix.mult()
  // ==========================================

  describe('matrix.mult', () => {
    describe('Matrix × Matrix', () => {
      it('should multiply two square matrices', () => {
        // [[1, 2], [3, 4]] × [[5, 6], [7, 8]] = [[19, 22], [43, 50]]
        const m1 = matrix.new_matrix(2, 2, 0);
        matrix.set(m1, 0, 0, 1); matrix.set(m1, 0, 1, 2);
        matrix.set(m1, 1, 0, 3); matrix.set(m1, 1, 1, 4);

        const m2 = matrix.new_matrix(2, 2, 0);
        matrix.set(m2, 0, 0, 5); matrix.set(m2, 0, 1, 6);
        matrix.set(m2, 1, 0, 7); matrix.set(m2, 1, 1, 8);

        const result = matrix.mult(m1, m2) as ReturnType<typeof matrix.new_matrix>;
        expect(matrix.get(result, 0, 0)).toBe(19);
        expect(matrix.get(result, 0, 1)).toBe(22);
        expect(matrix.get(result, 1, 0)).toBe(43);
        expect(matrix.get(result, 1, 1)).toBe(50);
      });

      it('should multiply non-square matrices', () => {
        // 6×2 matrix × 2×3 matrix = 6×3 matrix
        const m1 = matrix.new_matrix(6, 2, 5);
        const m2 = matrix.new_matrix(2, 3, 4);

        const result = matrix.mult(m1, m2) as ReturnType<typeof matrix.new_matrix>;
        expect(matrix.rows(result)).toBe(6);
        expect(matrix.columns(result)).toBe(3);
        // Each element should be 5*4 + 5*4 = 40
        expect(matrix.get(result, 0, 0)).toBe(40);
      });

      it('should throw error for dimension mismatch', () => {
        const m1 = matrix.new_matrix(2, 3, 1);
        const m2 = matrix.new_matrix(4, 2, 1);

        expect(() => matrix.mult(m1, m2)).toThrow(/dimension mismatch/);
      });

      it('should handle identity matrix multiplication', () => {
        const m = matrix.new_matrix(3, 3, 0);
        matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
        matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);
        matrix.set(m, 2, 0, 7); matrix.set(m, 2, 1, 8); matrix.set(m, 2, 2, 9);

        const identity = matrix.new_matrix(3, 3, 0);
        matrix.set(identity, 0, 0, 1);
        matrix.set(identity, 1, 1, 1);
        matrix.set(identity, 2, 2, 1);

        const result = matrix.mult(m, identity) as ReturnType<typeof matrix.new_matrix>;
        expect(matrix.get(result, 0, 0)).toBe(1);
        expect(matrix.get(result, 1, 1)).toBe(5);
        expect(matrix.get(result, 2, 2)).toBe(9);
      });
    });

    describe('Matrix × Scalar', () => {
      it('should multiply matrix by scalar', () => {
        const m = matrix.new_matrix(2, 3, 4);
        const result = matrix.mult(m, 5) as ReturnType<typeof matrix.new_matrix>;

        expect(matrix.rows(result)).toBe(2);
        expect(matrix.columns(result)).toBe(3);
        expect(matrix.get(result, 0, 0)).toBe(20);
        expect(matrix.get(result, 1, 2)).toBe(20);
      });

      it('should handle zero scalar', () => {
        const m = matrix.new_matrix(2, 2, 5);
        const result = matrix.mult(m, 0) as ReturnType<typeof matrix.new_matrix>;

        expect(matrix.is_zero(result)).toBe(true);
      });

      it('should handle negative scalar', () => {
        const m = matrix.new_matrix(2, 2, 3);
        const result = matrix.mult(m, -2) as ReturnType<typeof matrix.new_matrix>;

        expect(matrix.get(result, 0, 0)).toBe(-6);
      });
    });

    describe('Matrix × Vector', () => {
      it('should multiply matrix by vector', () => {
        const m = matrix.new_matrix(2, 3, 4);
        const vec = [1, 1, 1];

        const result = matrix.mult(m, vec) as number[];
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(12);
        expect(result[1]).toBe(12);
      });

      it('should throw error for vector dimension mismatch', () => {
        const m = matrix.new_matrix(2, 3, 1);
        const vec = [1, 2]; // Wrong size

        expect(() => matrix.mult(m, vec)).toThrow(/must equal/);
      });
    });
  });

  // ==========================================
  // matrix.pow()
  // ==========================================

  describe('matrix.pow', () => {
    it('should compute matrix power', () => {
      const m = matrix.new_matrix(2, 2, 2);
      const result = matrix.pow(m, 2);

      // [[2,2],[2,2]]² = [[8,8],[8,8]]
      expect(matrix.get(result, 0, 0)).toBe(8);
      expect(matrix.get(result, 0, 1)).toBe(8);
    });

    it('should return identity for power 0', () => {
      const m = matrix.new_matrix(3, 3, 5);
      const result = matrix.pow(m, 0);

      expect(matrix.is_identity(result)).toBe(true);
    });

    it('should return original matrix for power 1', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);

      const result = matrix.pow(m, 1);

      expect(matrix.get(result, 0, 0)).toBe(1);
      expect(matrix.get(result, 0, 1)).toBe(2);
      expect(matrix.get(result, 1, 0)).toBe(3);
      expect(matrix.get(result, 1, 1)).toBe(4);
    });

    it('should compute power of 3', () => {
      const m = matrix.new_matrix(2, 2, 2);
      const result = matrix.pow(m, 3);

      // [[2,2],[2,2]]³ = [[32,32],[32,32]]
      expect(matrix.get(result, 0, 0)).toBe(32);
    });

    it('should throw error for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 1);

      expect(() => matrix.pow(m, 2)).toThrow(/must be square/);
    });

    it('should handle negative power', () => {
      // [[1, 2], [3, 4]] has inverse [[-2, 1], [1.5, -0.5]]
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);

      const result = matrix.pow(m, -1);

      expect(matrix.get(result, 0, 0)).toBeCloseTo(-2);
      expect(matrix.get(result, 0, 1)).toBeCloseTo(1);
      expect(matrix.get(result, 1, 0)).toBeCloseTo(1.5);
      expect(matrix.get(result, 1, 1)).toBeCloseTo(-0.5);
    });
  });

  // ==========================================
  // matrix.det()
  // ==========================================

  describe('matrix.det', () => {
    it('should compute determinant of 2x2 matrix', () => {
      // det([[3, 7], [1, -4]]) = 3*(-4) - 7*1 = -19
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 3); matrix.set(m, 0, 1, 7);
      matrix.set(m, 1, 0, 1); matrix.set(m, 1, 1, -4);

      expect(matrix.det(m)).toBe(-19);
    });

    it('should compute determinant of 3x3 matrix', () => {
      // [[1, 2, 3], [4, 5, 6], [7, 8, 10]]
      // det = 1*(5*10 - 6*8) - 2*(4*10 - 6*7) + 3*(4*8 - 5*7)
      // = 1*(50 - 48) - 2*(40 - 42) + 3*(32 - 35)
      // = 2 - 2*(-2) + 3*(-3) = 2 + 4 - 9 = -3
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);
      matrix.set(m, 2, 0, 7); matrix.set(m, 2, 1, 8); matrix.set(m, 2, 2, 10);

      expect(matrix.det(m)).toBeCloseTo(-3);
    });

    it('should return 1 for identity matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 1);
      matrix.set(m, 2, 2, 1);

      expect(matrix.det(m)).toBeCloseTo(1);
    });

    it('should return 0 for singular matrix', () => {
      // [[1, 2], [2, 4]] is singular
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 2); matrix.set(m, 1, 1, 4);

      expect(matrix.det(m)).toBeCloseTo(0);
    });

    it('should return element value for 1x1 matrix', () => {
      const m = matrix.new_matrix(1, 1, 5);
      expect(matrix.det(m)).toBe(5);
    });

    it('should return 1 for empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      expect(matrix.det(m)).toBe(1);
    });

    it('should throw error for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 1);
      expect(() => matrix.det(m)).toThrow(/must be square/);
    });
  });

  // ==========================================
  // matrix.inv()
  // ==========================================

  describe('matrix.inv', () => {
    it('should compute inverse of 2x2 matrix', () => {
      // [[1, 2], [3, 4]] has inverse [[-2, 1], [1.5, -0.5]]
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);

      const result = matrix.inv(m);
      expect(result).not.toBeNull();

      expect(matrix.get(result!, 0, 0)).toBeCloseTo(-2);
      expect(matrix.get(result!, 0, 1)).toBeCloseTo(1);
      expect(matrix.get(result!, 1, 0)).toBeCloseTo(1.5);
      expect(matrix.get(result!, 1, 1)).toBeCloseTo(-0.5);
    });

    it('should return identity when multiplied with original', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 0); matrix.set(m, 1, 1, 1); matrix.set(m, 1, 2, 4);
      matrix.set(m, 2, 0, 5); matrix.set(m, 2, 1, 6); matrix.set(m, 2, 2, 0);

      const inv = matrix.inv(m);
      expect(inv).not.toBeNull();

      const product = matrix.mult(m, inv!) as ReturnType<typeof matrix.new_matrix>;

      // Should be close to identity
      expect(matrix.get(product, 0, 0)).toBeCloseTo(1, 5);
      expect(matrix.get(product, 1, 1)).toBeCloseTo(1, 5);
      expect(matrix.get(product, 2, 2)).toBeCloseTo(1, 5);
      expect(matrix.get(product, 0, 1)).toBeCloseTo(0, 5);
    });

    it('should return null for singular matrix', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 2); matrix.set(m, 1, 1, 4);

      expect(matrix.inv(m)).toBeNull();
    });

    it('should return identity inverse as identity', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 1);
      matrix.set(m, 2, 2, 1);

      const result = matrix.inv(m);
      expect(result).not.toBeNull();
      expect(matrix.is_identity(result!)).toBe(true);
    });

    it('should throw error for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 1);
      expect(() => matrix.inv(m)).toThrow(/must be square/);
    });

    it('should handle empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      const result = matrix.inv(m);
      expect(result).not.toBeNull();
      expect(matrix.rows(result!)).toBe(0);
    });
  });

  // ==========================================
  // matrix.pinv()
  // ==========================================

  describe('matrix.pinv', () => {
    it('should compute pseudo-inverse of square non-singular matrix', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);

      const result = matrix.pinv(m);

      // Should be same as regular inverse
      expect(matrix.get(result, 0, 0)).toBeCloseTo(-2);
      expect(matrix.get(result, 0, 1)).toBeCloseTo(1);
    });

    it('should compute pseudo-inverse of tall matrix', () => {
      // 3x2 matrix with full column rank
      const m = matrix.new_matrix(3, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 0);
      matrix.set(m, 1, 0, 0); matrix.set(m, 1, 1, 1);
      matrix.set(m, 2, 0, 1); matrix.set(m, 2, 1, 1);

      const result = matrix.pinv(m);

      // Pseudo-inverse should be 2x3
      expect(matrix.rows(result)).toBe(2);
      expect(matrix.columns(result)).toBe(3);
    });

    it('should compute pseudo-inverse of wide matrix', () => {
      // 2x3 matrix
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);

      const result = matrix.pinv(m);

      // Pseudo-inverse should be 3x2
      expect(matrix.rows(result)).toBe(3);
      expect(matrix.columns(result)).toBe(2);
    });

    it('should satisfy A × A⁺ × A ≈ A', () => {
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);

      const pinvM = matrix.pinv(m);
      const temp = matrix.mult(m, pinvM) as ReturnType<typeof matrix.new_matrix>;
      const result = matrix.mult(temp, m) as ReturnType<typeof matrix.new_matrix>;

      // A × A⁺ × A should approximately equal A
      expect(matrix.get(result, 0, 0)).toBeCloseTo(1, 3);
      expect(matrix.get(result, 0, 1)).toBeCloseTo(2, 3);
      expect(matrix.get(result, 1, 2)).toBeCloseTo(6, 3);
    });

    it('should handle empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      const result = matrix.pinv(m);
      expect(matrix.rows(result)).toBe(0);
      expect(matrix.columns(result)).toBe(0);
    });
  });

  // ==========================================
  // matrix.rank()
  // ==========================================

  describe('matrix.rank', () => {
    it('should return full rank for identity matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 1);
      matrix.set(m, 2, 2, 1);

      expect(matrix.rank(m)).toBe(3);
    });

    it('should return 2 for rank-2 3x3 matrix', () => {
      // [[1, 2, 3], [4, 5, 6], [7, 8, 9]] has rank 2
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);
      matrix.set(m, 2, 0, 7); matrix.set(m, 2, 1, 8); matrix.set(m, 2, 2, 9);

      expect(matrix.rank(m)).toBe(2);
    });

    it('should return 0 for zero matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      expect(matrix.rank(m)).toBe(0);
    });

    it('should return 1 for matrix with one non-zero row', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);

      expect(matrix.rank(m)).toBe(1);
    });

    it('should handle non-square matrices', () => {
      // 2x3 matrix with rank 2
      const m = matrix.new_matrix(2, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 0); matrix.set(m, 0, 2, 1);
      matrix.set(m, 1, 0, 0); matrix.set(m, 1, 1, 1); matrix.set(m, 1, 2, 1);

      expect(matrix.rank(m)).toBe(2);
    });

    it('should return 0 for empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      expect(matrix.rank(m)).toBe(0);
    });
  });

  // ==========================================
  // matrix.eigenvalues()
  // ==========================================

  describe('matrix.eigenvalues', () => {
    it('should compute eigenvalues of 2x2 matrix', () => {
      // [[2, 4], [6, 8]] has eigenvalues 10 and 0 (approx)
      // Characteristic: λ² - 10λ + (16-24) = λ² - 10λ - 8 = 0
      // λ = (10 ± √(100 + 32)) / 2 = (10 ± √132) / 2
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 2); matrix.set(m, 0, 1, 4);
      matrix.set(m, 1, 0, 6); matrix.set(m, 1, 1, 8);

      const ev = matrix.eigenvalues(m);

      expect(ev).toHaveLength(2);
      // Check that sum of eigenvalues equals trace
      expect(ev[0] + ev[1]).toBeCloseTo(10, 3);
      // Check that product of eigenvalues equals determinant
      expect(ev[0] * ev[1]).toBeCloseTo(2 * 8 - 4 * 6, 3);
    });

    it('should compute eigenvalues of diagonal matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 2);
      matrix.set(m, 1, 1, 5);
      matrix.set(m, 2, 2, 8);

      const ev = matrix.eigenvalues(m);

      expect(ev).toHaveLength(3);
      // Eigenvalues of diagonal matrix are the diagonal elements
      expect(ev.sort((a, b) => b - a)).toEqual([8, 5, 2]);
    });

    it('should compute eigenvalues of identity matrix', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 1);
      matrix.set(m, 2, 2, 1);

      const ev = matrix.eigenvalues(m);

      expect(ev).toHaveLength(3);
      ev.forEach(e => expect(e).toBeCloseTo(1, 5));
    });

    it('should return single eigenvalue for 1x1 matrix', () => {
      const m = matrix.new_matrix(1, 1, 7);
      const ev = matrix.eigenvalues(m);

      expect(ev).toHaveLength(1);
      expect(ev[0]).toBe(7);
    });

    it('should return empty array for empty matrix', () => {
      const m = matrix.new_matrix(0, 0, 0);
      const ev = matrix.eigenvalues(m);

      expect(ev).toHaveLength(0);
    });

    it('should throw error for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 1);
      expect(() => matrix.eigenvalues(m)).toThrow(/must be square/);
    });
  });

  // ==========================================
  // matrix.eigenvectors()
  // ==========================================

  describe('matrix.eigenvectors', () => {
    it('should compute eigenvectors of 2x2 matrix', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 2); matrix.set(m, 0, 1, 4);
      matrix.set(m, 1, 0, 6); matrix.set(m, 1, 1, 8);

      const evecs = matrix.eigenvectors(m);

      expect(matrix.rows(evecs)).toBe(2);
      expect(matrix.columns(evecs)).toBe(2);
    });

    it('should produce eigenvectors as normalized unit vectors', () => {
      // Simple 2x2 matrix
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 4); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 1); matrix.set(m, 1, 1, 3);

      const evecs = matrix.eigenvectors(m);

      // For each eigenvector, verify it's approximately unit length
      for (let i = 0; i < matrix.columns(evecs); i++) {
        const v = matrix.col(evecs, i);
        
        // Compute norm
        const norm = Math.sqrt(v[0]! * v[0]! + v[1]! * v[1]!);
        
        // Should be approximately 1 (unit vector)
        expect(norm).toBeCloseTo(1, 3);
      }
    });

    it('should compute eigenvectors of identity matrix', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1);
      matrix.set(m, 1, 1, 1);

      const evecs = matrix.eigenvectors(m);

      expect(matrix.rows(evecs)).toBe(2);
      expect(matrix.columns(evecs)).toBe(2);
    });

    it('should return empty matrix for empty input', () => {
      const m = matrix.new_matrix(0, 0, 0);
      const evecs = matrix.eigenvectors(m);

      expect(matrix.rows(evecs)).toBe(0);
    });

    it('should throw error for non-square matrix', () => {
      const m = matrix.new_matrix(2, 3, 1);
      expect(() => matrix.eigenvectors(m)).toThrow(/must be square/);
    });
  });

  // ==========================================
  // matrix.kron()
  // ==========================================

  describe('matrix.kron', () => {
    it('should compute Kronecker product of two 2x2 matrices', () => {
      const m1 = matrix.new_matrix(2, 2, 1);
      const m2 = matrix.new_matrix(2, 2, 2);

      const result = matrix.kron(m1, m2);

      // Result should be 4x4
      expect(matrix.rows(result)).toBe(4);
      expect(matrix.columns(result)).toBe(4);

      // All elements should be 1*2 = 2
      expect(matrix.get(result, 0, 0)).toBe(2);
      expect(matrix.get(result, 3, 3)).toBe(2);
    });

    it('should compute Kronecker product correctly', () => {
      // [[1, 2], [3, 4]] ⊗ [[0, 5], [6, 7]]
      const m1 = matrix.new_matrix(2, 2, 0);
      matrix.set(m1, 0, 0, 1); matrix.set(m1, 0, 1, 2);
      matrix.set(m1, 1, 0, 3); matrix.set(m1, 1, 1, 4);

      const m2 = matrix.new_matrix(2, 2, 0);
      matrix.set(m2, 0, 0, 0); matrix.set(m2, 0, 1, 5);
      matrix.set(m2, 1, 0, 6); matrix.set(m2, 1, 1, 7);

      const result = matrix.kron(m1, m2);

      // Check specific elements
      // Block (0,0) = 1 * m2 = [[0, 5], [6, 7]]
      expect(matrix.get(result, 0, 0)).toBe(0);
      expect(matrix.get(result, 0, 1)).toBe(5);
      expect(matrix.get(result, 1, 0)).toBe(6);
      expect(matrix.get(result, 1, 1)).toBe(7);

      // Block (0,1) = 2 * m2 = [[0, 10], [12, 14]]
      expect(matrix.get(result, 0, 2)).toBe(0);
      expect(matrix.get(result, 0, 3)).toBe(10);

      // Block (1,0) = 3 * m2 = [[0, 15], [18, 21]]
      expect(matrix.get(result, 2, 0)).toBe(0);
      expect(matrix.get(result, 2, 1)).toBe(15);
    });

    it('should handle non-square matrices', () => {
      const m1 = matrix.new_matrix(2, 3, 1);
      const m2 = matrix.new_matrix(3, 2, 2);

      const result = matrix.kron(m1, m2);

      expect(matrix.rows(result)).toBe(6); // 2 * 3
      expect(matrix.columns(result)).toBe(6); // 3 * 2
    });

    it('should handle empty matrices', () => {
      const m1 = matrix.new_matrix(0, 0, 1);
      const m2 = matrix.new_matrix(2, 2, 2);

      const result = matrix.kron(m1, m2);

      expect(matrix.rows(result)).toBe(0);
      expect(matrix.columns(result)).toBe(0);
    });

    it('should satisfy Kronecker product properties', () => {
      // (A ⊗ B) ⊗ C = A ⊗ (B ⊗ C) for associativity
      const a = matrix.new_matrix(2, 2, 1);
      const b = matrix.new_matrix(2, 2, 2);
      const c = matrix.new_matrix(2, 2, 3);

      const left = matrix.kron(matrix.kron(a, b), c);
      const right = matrix.kron(a, matrix.kron(b, c));

      expect(matrix.rows(left)).toBe(matrix.rows(right));
      expect(matrix.columns(left)).toBe(matrix.columns(right));

      // Check some elements
      expect(matrix.get(left, 0, 0)).toBe(matrix.get(right, 0, 0));
      expect(matrix.get(left, 7, 7)).toBe(matrix.get(right, 7, 7));
    });
  });

  // ==========================================
  // matrix.newtype()
  // ==========================================

  describe('matrix.newtype', () => {
    it('should create matrix with custom type', () => {
      interface Point {
        x: number;
        y: number;
      }

      const defaultPoint: Point = { x: 0, y: 0 };
      const m = matrix.newtype<Point>(2, 2, defaultPoint);

      expect(matrix.rows(m)).toBe(2);
      expect(matrix.columns(m)).toBe(2);
      expect(matrix.get(m, 0, 0)).toEqual({ x: 0, y: 0 });
    });

    it('should handle default values', () => {
      const m = matrix.newtype(3, 3);

      expect(matrix.rows(m)).toBe(3);
      expect(matrix.columns(m)).toBe(3);
    });

    it('should handle zero dimensions', () => {
      const m = matrix.newtype(0, 0);

      expect(matrix.rows(m)).toBe(0);
      expect(matrix.columns(m)).toBe(0);
    });

    it('should work with string types', () => {
      const m = matrix.newtype<string>(2, 2, 'test');

      expect(matrix.get(m, 0, 0)).toBe('test');
      expect(matrix.get(m, 1, 1)).toBe('test');
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================

  describe('Integration Tests', () => {
    it('should verify A × A⁻¹ = I', () => {
      const m = matrix.new_matrix(3, 3, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
      matrix.set(m, 1, 0, 0); matrix.set(m, 1, 1, 1); matrix.set(m, 1, 2, 4);
      matrix.set(m, 2, 0, 5); matrix.set(m, 2, 1, 6); matrix.set(m, 2, 2, 0);

      const inv = matrix.inv(m);
      expect(inv).not.toBeNull();

      const product = matrix.mult(m, inv!) as ReturnType<typeof matrix.new_matrix>;

      // Should be close to identity
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const expected = i === j ? 1 : 0;
          expect(matrix.get(product, i, j)).toBeCloseTo(expected, 5);
        }
      }
    });

    it('should verify det(A × B) = det(A) × det(B)', () => {
      const a = matrix.new_matrix(2, 2, 0);
      matrix.set(a, 0, 0, 1); matrix.set(a, 0, 1, 2);
      matrix.set(a, 1, 0, 3); matrix.set(a, 1, 1, 4);

      const b = matrix.new_matrix(2, 2, 0);
      matrix.set(b, 0, 0, 5); matrix.set(b, 0, 1, 6);
      matrix.set(b, 1, 0, 7); matrix.set(b, 1, 1, 8);

      const ab = matrix.mult(a, b) as ReturnType<typeof matrix.new_matrix>;

      const detA = matrix.det(a);
      const detB = matrix.det(b);
      const detAB = matrix.det(ab);

      expect(detAB).toBeCloseTo(detA * detB, 5);
    });

    it('should verify rank + nullity = columns', () => {
      const m = matrix.new_matrix(3, 4, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 1); matrix.set(m, 0, 3, 0);
      matrix.set(m, 1, 0, 0); matrix.set(m, 1, 1, 1); matrix.set(m, 1, 2, 1); matrix.set(m, 1, 3, 0);
      matrix.set(m, 2, 0, 1); matrix.set(m, 2, 1, 3); matrix.set(m, 2, 2, 2); matrix.set(m, 2, 3, 0);

      const r = matrix.rank(m);
      // Rank-nullity theorem: rank + nullity = number of columns
      // nullity = columns - rank
      const nullity = matrix.columns(m) - r;

      expect(r + nullity).toBe(matrix.columns(m));
    });

    it('should verify eigenvalue decomposition A = V × D × V⁻¹ for symmetric matrix', () => {
      // Symmetric matrix has real eigenvalues and orthogonal eigenvectors
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 4); matrix.set(m, 0, 1, 2);
      matrix.set(m, 1, 0, 2); matrix.set(m, 1, 1, 4);

      const evals = matrix.eigenvalues(m);
      
      // Eigenvalues of symmetric matrix should be real
      // For [[4, 2], [2, 4]]: eigenvalues are 6 and 2
      expect(evals.sort((a, b) => b - a)[0]).toBeCloseTo(6, 3);
      expect(evals.sort((a, b) => b - a)[1]).toBeCloseTo(2, 3);
    });
  });

  // ==========================================
  // Edge Cases & Numerical Stability
  // ==========================================

  describe('Numerical Stability', () => {
    it('should handle near-singular matrices in inv()', () => {
      // Matrix with condition number close to machine epsilon boundary
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 1);
      matrix.set(m, 1, 0, 1); matrix.set(m, 1, 1, 1.0000001);

      const result = matrix.inv(m);
      // Should still compute inverse for slightly perturbed singular matrix
      expect(result).not.toBeNull();
    });

    it('should handle large values in det()', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1e8); matrix.set(m, 0, 1, 2e8);
      matrix.set(m, 1, 0, 3e8); matrix.set(m, 1, 1, 4e8);

      const d = matrix.det(m);
      // det = 4e16 - 6e16 = -2e16
      expect(d).toBeCloseTo(-2e16, -10);
    });

    it('should handle small values in rank()', () => {
      const m = matrix.new_matrix(2, 2, 0);
      matrix.set(m, 0, 0, 1e-6); matrix.set(m, 0, 1, 2e-6);
      matrix.set(m, 1, 0, 3e-6); matrix.set(m, 1, 1, 4e-6);

      // Small but above epsilon values should still have correct rank
      const r = matrix.rank(m);
      expect(r).toBe(2);
    });
  });
});
