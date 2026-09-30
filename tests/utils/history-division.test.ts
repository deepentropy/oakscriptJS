/**
 * at(): PineScript history reference on arrays; div(): PineScript division.
 */
import { at, div, getSource, na, nz, fixnan, taCore, Series, BarData } from '../../src';

describe('at', () => {
  const x = [10, 20, 30];
  it('x[offset] at bar i, na before the first bar', () => {
    expect([at(x, 2), at(x, 2, 1), at(x, 2, 2)]).toEqual([30, 20, 10]);
    expect(Number.isNaN(at(x, 1, 2))).toBe(true);
  });
  it('a negative offset throws (it would read a later bar)', () => {
    expect(() => at(x, 0, -1)).toThrow(RangeError);
  });
});

describe('division by zero (PineScript)', () => {
  it('x / 0 is +/-Infinity, 0 / 0 is NaN; na() is true for both', () => {
    expect(div(1, 0)).toBe(Infinity);
    expect(div(-1, 0)).toBe(-Infinity);
    expect(Number.isNaN(div(0, 0))).toBe(true);
    expect(div(3, 2)).toBe(1.5);
    expect([na(div(1, 0)), na(div(-1, 0)), na(div(0, 0)), na(1.5)]).toEqual([true, true, true, false]);
    expect(div(1, 0) > 0).toBe(true); // comparisons keep the infinite value
  });
  it('nz() replaces +/-Infinity, fixnan() keeps it', () => {
    expect([nz(Infinity), nz(-Infinity, -7)]).toEqual([0, -7]);
    expect(fixnan([1, Infinity, NaN])).toEqual([1, Infinity, Infinity]);
  });
  it('Series.div gives +/-Infinity', () => {
    const data = new BarData([1, 2].map((c, i) => ({ time: i, open: c, high: c, low: c, close: c, volume: 0 })));
    const c = Series.fromBars(data, 'close');
    expect(c.div(0).toArray()).toEqual([Infinity, Infinity]);
    expect(c.sub(c).div(0).toArray().every(Number.isNaN)).toBe(true);
  });
  it('ta.sma skips +/-Infinity like na; ta.cum is na on that bar and continues', () => {
    expect(taCore.sma([1, 2, Infinity, 3], 2)).toEqual([NaN, 1.5, 1.5, 2.5]);
    expect(taCore.cum([1, Infinity, 2])).toEqual([1, NaN, 3]);
  });
});

describe('getSource', () => {
  it('a price source by name, as an array', () => {
    const bars = [{ time: 1, open: 1, high: 4, low: 2, close: 3, volume: 0 }];
    expect(getSource(bars, 'hlc3')).toEqual([3]);
    expect(getSource(bars, 'hlcc4')).toEqual([3]);
  });
});
