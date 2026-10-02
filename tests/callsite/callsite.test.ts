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

describe('callsite.linreg (ta.linreg in a conditional block, #131)', () => {
  const x = [3, 5, 4, 6, 8, 7, 9, 12, 10, 11, 13, 15, 14, 16, 18, 17];
  const L = 4;
  const last = (w: number[], off = 0) => taCore.linreg(w, L, off)[L - 1]!;

  it('called on every bar: equal to ta.linreg', () => {
    const site = callsite.linreg();
    expect(x.map((v, i) => site(i, v, L))).toEqual(taCore.linreg(x, L));
  });

  it('first call on a later bar: the bars before it count as 0', () => {
    const site = callsite.linreg();
    const got = x.map((v, i) => (i >= 6 ? site(i, v, L, 1) : NaN));
    expect(got[6]).toBe(last([0, 0, 0, x[6]!], 1));
    expect(got[8]).toBe(last([0, x[6]!, x[7]!, x[8]!], 1));
    expect(got[9]).toBe(taCore.linreg(x, L, 1)[9]); // the window holds only called bars
  });

  it('na before bar length - 1, even when called', () => {
    const site = callsite.linreg();
    expect([0, 1, 2].map((i) => site(i, x[i]!, L))).toEqual([NaN, NaN, NaN]);
  });

  it('a bar without a call holds the value of the call length + 1 bars earlier (ring of length + 1 by bar)', () => {
    // calls on even bars from bar 2, ring of 5 slots (bar % 5). Window of bar 10 = bars 7..10:
    // bar 7 (slot 2, last written on bar 2), bar 8, bar 9 (slot 4, written on bar 4), bar 10
    const site = callsite.linreg();
    const got = x.map((v, i) => (i >= 2 && i % 2 === 0 ? site(i, v, L) : NaN));
    expect(got[10]).toBe(last([x[2]!, x[8]!, x[4]!, x[10]!]));
    // window of bar 6 = bars 3..6: bar 3 (slot 3, never written) is 0, bar 5 (slot 0, never written) is 0
    expect(got[6]).toBe(last([0, x[4]!, 0, x[6]!]));
  });
});

