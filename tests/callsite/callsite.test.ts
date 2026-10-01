/**
 * Per-call history of ta.* calls in a conditional block (PineScript rule).
 */
import { callsite, taCore } from '../../src';

describe('callsite.whenCalled', () => {
  it('the function sees only the values of the bars where it is called', () => {
    const x = [1, 2, 3, 4, 5, 6];
    const called = [true, false, true, false, true, true];
    const sma = callsite.whenCalled(called, (v) => taCore.sma(v, 2), x);
    // values seen: 1, 3, 5, 6 -> sma: na, 2, 4, 5.5
    expect(sma.map((v) => (Number.isNaN(v as number) ? null : v))).toEqual([null, null, 2, null, 4, 5.5]);
  });

  it('ta.crossover is false on the first bar the block runs', () => {
    const a = [0, 2, 0, 2, 0, 2];
    const b = [1, 1, 1, 1, 1, 1];
    const called = [false, true, true, true, false, true];
    const cross = callsite.whenCalled(called, (x, y) => taCore.crossover(x, y), a, b);
    expect(cross.map(Boolean)).toEqual([false, false, false, true, false, false]);
  });
});

describe('callsite.crossover / crossunder / cross', () => {
  it('false on the first call; then compares with the previous call, not the previous bar', () => {
    const over = callsite.crossover();
    expect(over(2, 1)).toBe(false);
    expect(over(0, 1)).toBe(false);
    expect(over(2, 1)).toBe(true);
    const under = callsite.crossunder();
    expect([under(0, 1), under(2, 1), under(0, 1)]).toEqual([false, false, true]);
    const cross = callsite.cross();
    expect([cross(0, 1), cross(2, 1), cross(0, 1), cross(0, 1)]).toEqual([false, true, true, false]);
  });

  it('na arguments give false, as Pine comparisons with na', () => {
    const over = callsite.crossover();
    expect([over(NaN, 1), over(2, 1)]).toEqual([false, false]);
  });

  it('called on every bar, equals the vectorized ta.crossover', () => {
    const a = [1, 3, 2, 5, 4, 6, 1, 7];
    const b = [2, 2, 3, 3, 5, 5, 2, 2];
    const over = callsite.crossover();
    expect(a.map((v, i) => over(v, b[i]!))).toEqual(taCore.crossover(a, b));
  });

  it('matches whenCalled on the same bars', () => {
    const a = [1, 3, 2, 5, 4, 6, 1, 7, 0, 9];
    const b = a.map(() => 3);
    const called = a.map((_, i) => i % 3 !== 1);
    const vec = callsite.whenCalled(called, (x, y) => taCore.crossover(x, y), a, b);
    const over = callsite.crossover();
    a.forEach((v, i) => {
      if (called[i]) expect(over(v, b[i]!)).toBe(vec[i]);
    });
  });
});

describe('callsite.barssince', () => {
  it('counts calls since the condition was true; na before the first true', () => {
    const since = callsite.barssince();
    expect([false, true, false, false, true, NaN].map((c) => since(c))).toEqual([NaN, 0, 1, 2, 0, 1]);
  });

  it('lazy or (PineScript v6): in the right operand of `up or ...`, barssince(up) never sees true', () => {
    // up every 7th bar, as in the PineScript probe: `up or ta.barssince(up) <= 3` equals `up` on every bar
    const since = callsite.barssince();
    const up = Array.from({ length: 30 }, (_, i) => i % 7 === 0);
    const lazyOr = up.map((u) => u || since(u) <= 3);
    expect(lazyOr).toEqual(up);
    // the vectorized reading (every bar) differs
    const eager = taCore.barssince(up);
    expect(up.map((u, i) => u || eager[i]! <= 3)).not.toEqual(up);
  });
});

describe('callsite.lowest / highest (series length, #126)', () => {
  const run = (site: (v: number, l: number) => number, values: number[], lengths: number[]) =>
    values.map((v, i) => site(v, lengths[i]!));

  it('with a fixed length and no na: the extreme of the last length values', () => {
    const x = [5, 3, 4, 6, 7, 2, 8, 8, 1];
    const len = x.map(() => 3);
    expect(run(callsite.lowest(), x, len)).toEqual(taCore.lowest(x, 3));
    expect(run(callsite.highest(), x, len)).toEqual(taCore.highest(x, 3));
  });

  it('a smaller length scans the window again', () => {
    expect(run(callsite.lowest(), [1, 5, 4, 6, 7], [5, 5, 5, 5, 2])).toEqual([NaN, NaN, NaN, NaN, 6]);
  });

  it('a larger length compares the values that enter the window with the extreme', () => {
    expect(run(callsite.lowest(), [NaN, 1, 5, 4, 3], [2, 2, 2, 2, 4])).toEqual([NaN, 1, 1, 4, 1]);
  });

  it('an na value among the entering values restarts the extreme from the current value', () => {
    // the plain minimum of the last 5 values would be 1
    expect(run(callsite.lowest(), [NaN, 1, 5, 4, 6, 7], [2, 2, 2, 2, 5, 5])).toEqual([NaN, 1, 1, 4, 6, 6]);
  });

  it('an na value gives na and resets the extreme; the next call scans the window again', () => {
    expect(run(callsite.highest(), [4, 9, NaN, 2, 3], [3, 3, 3, 3, 3])).toEqual([NaN, NaN, NaN, 9, 3]);
  });
});

