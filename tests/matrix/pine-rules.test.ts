/**
 * Matrix rules measured on PineScript (PyneCore gap audit, 04/10/2026).
 */
import { matrix } from '../../src';

const mk = (rows: number[][]) => {
  const m = matrix.new_matrix(rows.length, rows[0]!.length, 0);
  rows.forEach((r, i) => r.forEach((v, j) => matrix.set(m, i, j, v)));
  return m;
};

describe('matrix PineScript rules', () => {
  it('det: LU with an absolute singularity threshold of 1e-11', () => {
    expect(matrix.det(mk([[1e-11, 0, 0], [0, 1e-11, 0], [0, 0, 1e-11]]))).toBe(9.999999999999999e-34);
    expect(matrix.det(mk([[1, 1], [1, 1 + 1e-12]]))).toBe(0);
    expect(matrix.det(mk([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))).toBe(0);
    expect(matrix.det(mk([[1e-12]]))).toBe(0);
    expect(matrix.det(mk([[0.1, 0.2], [0.3, 0.4]]))).toBe(-0.019999999999999993);
    expect(matrix.det(mk([[0.1, 0.7, 0.3], [0.9, 0.2, 0.5], [0.4, 0.8, 0.6]]))).toBe(-0.07399999999999997);
  });

  it('rank: singular values above max(rows, columns) * largest * 2^-52', () => {
    expect(matrix.rank(mk([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))).toBe(2);
    expect(matrix.rank(mk([[1e-11, 0, 0], [0, 1e-11, 0], [0, 0, 1e-11]]))).toBe(3);
    expect(matrix.rank(mk([[1, 1], [1, 1 + 1e-12]]))).toBe(2);
  });

  it('get / set with an na index: na / no change', () => {
    const m = matrix.new_matrix(2, 2, 1);
    expect(matrix.get(m, NaN, 0)).toBeNaN();
    matrix.set(m, NaN, 0, 5);
    expect(matrix.get(m, 0, 0)).toBe(1);
  });
});
