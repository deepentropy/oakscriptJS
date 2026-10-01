import { array } from '../../src';

// Expected values: PineScript results of the same calls
describe('array: PineScript Part B forms', () => {
  const a = array.from(3, 1, 4, 1, 5, NaN, 9);

  it('from builds an array from its arguments and keeps na', () => {
    expect(a).toEqual([3, 1, 4, 1, 5, NaN, 9]);
    expect(array.from('a', 'b', 'c')).toEqual(['a', 'b', 'c']);
  });

  it('some / every test bool arrays; an empty array gives false', () => {
    expect([array.some([false, true, false]), array.some([false, false])]).toEqual([true, false]);
    expect([array.every([true, true]), array.every([true, false])]).toEqual([true, false]);
    expect([array.some([]), array.every([])]).toEqual([false, false]);
  });

  it('max / min with nth skip na; nth past the end gives the last value', () => {
    expect([array.max(a), array.max(a, 1), array.max(a, 2), array.max(a, 5), array.max(a, 6)]).toEqual([9, 5, 4, 1, 1]);
    expect([array.min(a, 0), array.min(a, 1), array.min(a, 2)]).toEqual([1, 1, 3]);
  });

  it('stdev / variance skip na and are biased by default', () => {
    expect(array.stdev(a)).toBeCloseTo(2.7335365778, 10);
    expect(array.stdev(a, false)).toBeCloseTo(2.9944392909, 10);
    expect(array.variance(a)).toBeCloseTo(7.4722222222, 10);
    expect(array.variance(a, false)).toBeCloseTo(8.9666666667, 10);
  });

  it('avg skips na; an array without values gives na (#124)', () => {
    expect(array.avg(array.from(1, NaN, 3))).toBe(2);
    expect(array.avg(array.from(10.9, NaN, NaN))).toBe(10.9);
    expect(array.avg(array.from(NaN, NaN))).toBeNaN();
    expect(array.avg([])).toBeNaN();
  });
});
