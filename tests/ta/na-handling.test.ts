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
});
