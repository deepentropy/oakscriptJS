/**
 * na handling of window functions (PineScript rules).
 */
import { math, taCore } from '../../src';

const src = [1, 2, 3, 4, NaN, 5, 6];

describe('na handling', () => {
  it('ta.sma: the mean of the last length non-na values; an na bar keeps the previous result', () => {
    expect(taCore.sma(src, 3)).toEqual([NaN, NaN, 2, 3, 3, 4, 5]);
    expect(taCore.sma([NaN, NaN, 1, 2, 3], 3)).toEqual([NaN, NaN, NaN, NaN, 2]);
  });

  it('ta.variance: the last length non-na values, like ta.sma', () => {
    const v = taCore.variance(src, 3);
    expect(v[4]).toBeCloseTo(v[3]!, 12);
    expect(v[5]).toBeCloseTo(((3 - 4) ** 2 + (4 - 4) ** 2 + (5 - 4) ** 2) / 3, 12); // 3, 4, 5
  });

  it('ta.dev: na when the window holds an na value', () => {
    const d = taCore.dev(src, 3);
    expect(d.slice(4).map(Number.isNaN)).toEqual([true, true, true]);
    expect(d[3]).toBeCloseTo(2 / 3, 12);
  });

  it('math.sum: the sum of the last length non-na values; an na bar keeps the previous result', () => {
    expect(math.sum(src, 3)).toEqual([NaN, NaN, 6, 9, 9, 12, 15]);
  });

  it('ta.ema: na on an na bar, then continues from the last value', () => {
    const e = taCore.ema(src, 3);
    expect(Number.isNaN(e[4]!)).toBe(true);
    expect(e[5]).toBeCloseTo(0.5 * 5 + 0.5 * e[3]!, 12);
  });

  it('ta.wma: na on an na bar; otherwise the last length bars with na replaced by the previous value', () => {
    const w = taCore.wma(src, 3);
    expect(Number.isNaN(w[4]!)).toBe(true);
    expect(w[5]).toBeCloseTo((4 * 1 + 4 * 2 + 5 * 3) / 6, 12); // values of bars 3, 4, 5: 4, na -> 4, 5
    expect(w[6]).toBeCloseTo((4 * 1 + 5 * 2 + 6 * 3) / 6, 12);
  });

  it('ta.median: the median of the last length non-na values; na until length non-na values exist (#116)', () => {
    const m = taCore.median([1, 2, NaN, 3, 4, NaN, 10, NaN], 3);
    expect(m.slice(0, 3).map(Number.isNaN)).toEqual([true, true, true]);
    expect(m.slice(3)).toEqual([2, 3, 3, 4, 4]); // [1,2,3], [2,3,4], [2,3,4] (na bar), [3,4,10], [3,4,10]
    expect(taCore.median([5, 1, NaN, 3, 7], 4)).toEqual([NaN, NaN, NaN, NaN, 4]); // [5,1,3,7]: (3 + 5) / 2
  });

  it('ta.ema / ta.rma / ta.wma / ta.stdev: +/-Infinity is na (#119)', () => {
    const base = Array.from({ length: 20 }, (_, i) => 100 + i);
    const withInf = base.map((v, i) => (i === 10 ? Infinity : i === 11 ? -Infinity : v));
    const withNa = base.map((v, i) => (i === 10 || i === 11 ? NaN : v));
    expect(taCore.ema(withInf, 5)).toEqual(taCore.ema(withNa, 5));
    expect(taCore.rma(withInf, 5)).toEqual(taCore.rma(withNa, 5));
    expect(taCore.wma(withInf, 5)).toEqual(taCore.wma(withNa, 5));
    expect(taCore.stdev(withInf, 5)).toEqual(taCore.stdev(withNa, 5));
    expect(taCore.ema(withInf, 5).slice(12).every(Number.isFinite)).toBe(true);
    // an infinite value in the seed window is skipped too
    expect(taCore.rma([Infinity, 1, 2, 3], 3)).toEqual(taCore.rma([NaN, 1, 2, 3], 3));
  });

  it('ta.rma: (source + (length - 1) * rma[1]) / length, bit for bit (#118)', () => {
    const src = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28];
    const len = 3;
    const r = taCore.rma(src, len);
    let prev = (src[0]! + src[1]! + src[2]!) / len;
    expect(r[2]).toBe(prev);
    for (let i = 3; i < src.length; i++) {
      prev = (src[i]! + (len - 1) * prev) / len;
      expect(r[i]).toBe(prev);
    }
  });
});

