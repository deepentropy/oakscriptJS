/**
 * array.* rules: values measured on PineScript (NASDAQ:AAPL probe), plus PyneCore measured rules for bounds.
 */
import { array } from '../../src';

const na = NaN;

describe('array statistics', () => {
  it('percentrank is (count - 1) * 100 / (size - 1) with an exact comparison', () => {
    const a = array.from(10, 20, 30, 40);
    expect(array.percentrank(a, 0)).toBe(0);
    expect(array.percentrank(a, 2)).toBe(66.66666666666667);
    expect(array.percentrank(array.from(5), 0)).toBeNaN();
    expect(array.percentrank(array.from(1, 1 + 5e-11), 0)).toBe(0);
    expect(array.percentrank(a, na)).toBe(0);
  });

  it('variance / stdev use the moment form', () => {
    const p = array.from(0.1, 0.2, 0.3);
    expect(array.variance(p)).toBe(0.006666666666666654);
    expect(array.variance(p, false)).toBe(0.009999999999999988);
    expect(array.stdev(p)).toBe(0.08164965809277253);
    expect(array.variance(array.from(5))).toBe(0);
    expect(array.variance(array.from(5), false)).toBeNaN();
  });

  it('standardize: flat array gives 1, na stays na', () => {
    expect(array.standardize(array.from(2, 2, 2))).toEqual([1, 1, 1]);
    expect(array.standardize(array.from(0.1, 0.2, 0.3))[0]).toBe(-1.2247448713915907);
    const z = array.standardize(array.from(1, 2, 3, na));
    expect(z[3]).toBeNaN();
    expect(z.slice(0, 3)).toEqual(array.standardize(array.from(1, 2, 3)));
  });

  it('percentile_nearest_rank / percentile_linear_interpolation', () => {
    const h = array.from(...Array.from({ length: 100 }, (_, i) => (i + 1) * 1.0));
    expect(array.percentile_nearest_rank(h, 7)).toBe(7);
    const t = array.from(...Array.from({ length: 10 }, (_, i) => (i + 1) * 0.1));
    expect(array.percentile_linear_interpolation(t, 7)).toBe(0.12000000000000001);
    expect(array.percentile_linear_interpolation(t, 33)).toBe(0.38);
  });

  it('percentiles: na percentage, out of range percentage', () => {
    const a = array.from(4, 3, 2, 1);
    expect(array.percentile_nearest_rank(a, na)).toBe(1);
    expect(array.percentile_linear_interpolation(a, na)).toBeNaN();
    expect(() => array.percentile_nearest_rank(a, 101)).toThrow();
    expect(() => array.percentile_linear_interpolation(a, -1)).toThrow();
  });

  it('covariance skips the pairs with an na', () => {
    expect(array.covariance(array.from(1, na, 3), array.from(2, 5, 4))).toBe(1);
    expect(array.covariance(array.from(1, na), array.from(2, 5), false)).toBeNaN();
  });

  it('median / mode skip na; mode tie gives the smallest value', () => {
    expect(array.median(array.from(3, na, 1, 2))).toBe(2);
    expect(array.mode(array.from(na, na, 1))).toBe(1);
    expect(array.mode(array.from(2, 2, 1, 1))).toBe(1);
    expect(array.mode(array.from(na, na))).toBeNaN();
  });

  it('min / max: nth outside the size throws, na nth is 0', () => {
    const a = array.from(30, na, 10, na);
    expect(array.min(a, 1)).toBe(30);
    expect(array.min(a, 3)).toBe(30);
    expect(array.max(a, 3)).toBe(10);
    expect(() => array.min(a, 4)).toThrow();
    expect(() => array.max(a, -1)).toThrow();
    expect(array.max(array.from(10, 20, 30, 40), na)).toBe(40);
  });
});

describe('array.sort / sort_indices', () => {
  it('na goes last ascending, first descending', () => {
    const s = array.from(30, na, 10);
    array.sort(s);
    expect(s).toEqual([10, 30, na]);
    const d = array.from(30, 20, 10, na);
    array.sort(d, 'descending');
    expect(d).toEqual([na, 30, 20, 10]);
  });

  it('sort_indices puts the na indices last, in their order', () => {
    expect(array.sort_indices(array.from(na, na, 5, 1))).toEqual([3, 2, 0, 1]);
  });

  it('accepts asc / desc', () => {
    const s = array.from(2, 3, 1);
    array.sort(s, 'desc');
    expect(s).toEqual([3, 2, 1]);
  });
});

describe('array search with the 1e-10 tolerance', () => {
  it('includes / indexof / lastindexof', () => {
    expect(array.includes(array.from(1), 1 + 5e-11)).toBe(true);
    expect(array.includes(array.from(1), 1 + 2e-10)).toBe(false);
    expect(array.includes(array.from(na, 1), na)).toBe(false);
    expect(array.indexof(array.from(3, 1 + 5e-11), 1)).toBe(1);
    expect(array.lastindexof(array.from(1, 1 + 5e-11, 3), 1)).toBe(1);
    expect(array.indexof(array.from('a', 'b'), 'b')).toBe(1);
  });
});

describe('array index rules', () => {
  it('get / set / remove: negative index from the end, out of range throws, na index', () => {
    const a = array.from(10, 20, 30, 40);
    expect(array.get(a, -1)).toBe(40);
    expect(() => array.get(a, 4)).toThrow();
    expect(() => array.get(a, -5)).toThrow();
    expect(array.get(a, na)).toBeNaN();
    array.set(a, -2, 33);
    expect(a).toEqual([10, 20, 33, 40]);
    array.set(a, na, 99);
    expect(a).toEqual([10, 20, 33, 40]);
    expect(() => array.set(a, 4, 1)).toThrow();
    expect(array.remove(a, -1)).toBe(40);
    expect(array.remove(a, na)).toBeNaN();
    expect(a).toEqual([10, 20, 33]);
    expect(() => array.remove(a, 3)).toThrow();
  });

  it('insert: -size .. size, na appends', () => {
    const a = array.from(10, 20, 30, 40);
    array.insert(a, 4, 77);
    expect(a).toEqual([10, 20, 30, 40, 77]);
    array.insert(a, -5, 1);
    expect(a).toEqual([1, 10, 20, 30, 40, 77]);
    array.insert(a, na, 2);
    expect(a).toEqual([1, 10, 20, 30, 40, 77, 2]);
    expect(() => array.insert(a, 8, 0)).toThrow();
    expect(() => array.insert(a, -8, 0)).toThrow();
  });
});

describe('array.concat / array.slice', () => {
  it('concat changes id1 and returns it', () => {
    const c1 = array.from(1, 2);
    const r = array.concat(c1, array.from(3));
    expect(r).toBe(c1);
    expect(c1).toEqual([1, 2, 3]);
  });

  it('slice is a live view of the array', () => {
    const a = array.from(10, 20, 30, 40);
    const s = array.slice(a, 1, 3);
    expect(s).toEqual([20, 30]);
    array.set(s, 0, 99);
    expect(array.get(a, 1)).toBe(99);
    array.set(a, 2, 77);
    expect(array.get(s, -1)).toBe(77);
  });

  it('adding / removing on a slice changes the array inside the slice bounds', () => {
    const a = array.from(10, 20, 30, 40, 50);
    const s = array.slice(a, 1, 4);
    array.push(s, 99);
    expect(a).toEqual([10, 20, 30, 40, 99, 50]);
    array.remove(s, 0);
    expect(a).toEqual([10, 30, 40, 99, 50]);
    array.sort(s, 'descending');
    expect(a).toEqual([10, 99, 40, 30, 50]);
    array.clear(s);
    expect(a).toEqual([10, 50]);
    expect(array.size(s)).toBe(0);
  });

  it('slice bounds: na bounds, out of range throws', () => {
    const a = array.from(10, 20, 30, 40);
    expect(array.slice(a, na, 2)).toEqual([10, 20]);
    expect(array.slice(a, 1, na)).toEqual([20, 30, 40]);
    expect(array.slice(a, 1, 1)).toEqual([]);
    expect(() => array.slice(a, 0, 10)).toThrow();
    expect(() => array.slice(a, -1, 2)).toThrow();
    expect(() => array.slice(a, 4, 4)).toThrow();
    expect(() => array.slice(a, 3, 1)).toThrow();
  });
});

describe('array.fill / first (PineScript runtime rules)', () => {
  it('an na bound is the start / the end; a bound past the end throws', () => {
    const a = array.from(10, 20, 30, 40);
    array.fill(a, 5, NaN, 2);
    expect(a).toEqual([5, 5, 30, 40]);
    expect(() => array.fill(array.from(10, 20, 30, 40), 5, 0, 6)).toThrow();
  });

  it('first / last of an empty array throw', () => {
    expect(() => array.first(array.new_float(0))).toThrow();
    expect(() => array.last(array.new_float(0))).toThrow();
  });
});
