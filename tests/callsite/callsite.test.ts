/**
 * Per-call history of ta.* calls in a conditional block (PineScript rule).
 */
import { callsite, math, taCore } from '../../src';

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

  it('compares with the last call where both arguments were not na (#134)', () => {
    const over = callsite.crossover();
    expect([over(-98, -87), over(-94, NaN), over(-85, -86)]).toEqual([false, false, true]);
    const cross = callsite.cross();
    expect([cross(2, 1), cross(NaN, 1), cross(0, NaN), cross(0, 1)]).toEqual([false, false, false, true]);
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

describe('callsite.lowest / highest (value, length, barIndex?)', () => {
  const run = (site: (v: number, l: number) => number, values: number[], lengths: number[]) =>
    values.map((v, i) => site(v, lengths[i]!));

  it('with a fixed length and no na: the extreme of the last length values', () => {
    const x = [5, 3, 4, 6, 7, 2, 8, 8, 1];
    const len = x.map(() => 3);
    expect(run(callsite.lowest(), x, len)).toEqual(taCore.lowest(x, 3));
    expect(run(callsite.highest(), x, len)).toEqual(taCore.highest(x, 3));
  });

  it('a length that changes: the last length values of each call', () => {
    expect(run(callsite.lowest(), [1, 5, 4, 6, 7], [5, 5, 5, 5, 2])).toEqual([NaN, NaN, NaN, NaN, 6]);
    expect(run(callsite.lowest(), [9, 1, 5, 4, 3], [2, 2, 2, 2, 4])).toEqual([NaN, 1, 1, 4, 1]);
  });

  it('na values are skipped, and an na call gives the extreme of the kept values', () => {
    expect(run(callsite.highest(), [4, 9, NaN, 2, 3], [3, 3, 3, 3, 3])).toEqual([NaN, NaN, 9, 9, 9]);
    expect(run(callsite.lowest(), [NaN, 1, 5, 4, 6, 7], [2, 2, 2, 2, 5, 5])).toEqual([NaN, 1, 1, 4, 1, 1]);
  });

  it('with the bar index, it is the site of lowestByBar / highestByBar', () => {
    const a = callsite.highest();
    const b = callsite.highestByBar();
    const x = [5, 3, 8, 1, 9, 2, 7];
    for (const i of [0, 2, 3, 6]) expect(a(x[i]!, 3, i)).toEqual(b(i, x[i]!, 3));
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


describe('callsite.lowestByBar / highestByBar: the non-na values of the calls (#159)', () => {
  // PineScript: src = math.sin(bar_index * 1.7) * 100 + bar_index % 11, first 16 bars
  const src = [
    0, 100.16648104524685, -23.554110202683123, -89.58146823277325, 53.411335113860815, 84.84871126234903,
    -63.98746875935423, -54.81371122370333, 93.91618148564957, 48.67405731306137, -86.13974918795569,
    -14.89990258141988,
  ];

  it('if bar_index % 2 == 0: ta.highest(src, 5) is na before bar 4, then the calls so far (PineScript values)', () => {
    const hi = callsite.highestByBar();
    const out = src.map((v, i) => (i % 2 === 0 ? hi(i, v, 5) : NaN));
    expect(out).toEqual([
      NaN, NaN, NaN, NaN, 53.411335113860815, NaN, 53.411335113860815, NaN, 93.91618148564957, NaN,
      93.91618148564957, NaN,
    ]);
  });

  it('a first call after bar length - 1 gives its own value; a bar without a call keeps nothing', () => {
    const lo = callsite.lowestByBar();
    expect(lo(0, 300, 6)).toBeNaN(); // na before bar length - 1
    expect(lo(6, 310, 6)).toBe(300); // the two calls so far
    const first = callsite.lowestByBar();
    expect(first(7, -54.81371122370333, 5)).toBe(-54.81371122370333); // PineScript: if bar_index % 7 == 0
  });

  it('the window is the last length calls, whatever their bars', () => {
    const values = Array.from({ length: 17 }, (_, i) => (i === 10 ? 501 : i === 12 ? 400 : 100));
    const hi = callsite.highestByBar();
    const out = values.map((v, i) => hi(i, v, 6));
    expect(out[16]).toBe(400);
    expect(hi(21, 403, 6)).toBe(403);
    expect(hi(40, 100, 6)).toBe(403); // 19 bars later, still in the last 6 calls
  });

  it('an na value is not kept, and its call gives the extreme of the kept values', () => {
    const hi = callsite.highestByBar();
    expect([5, NaN, 3, NaN, 2, 1, 0].map((v, i) => hi(i, v, 3))).toEqual([NaN, NaN, 5, 5, 5, 3, 2]);
  });

  it('a loop: one kept value per bar, each call replaces the value of the earlier calls of that bar (#168)', () => {
    const hi = callsite.highestByBar();
    // bars 0..2 with one call; bar 3 with three calls (10, na, 4)
    [7, 8, 6].forEach((v, i) => hi(i, v, 3));
    expect(hi(3, 10, 3)).toBe(10);
    expect(hi(3, NaN, 3)).toBe(10); // the value of the earlier call of this bar counts
    expect(hi(3, 4, 3)).toBe(8); // 8, 6 and its own value
    expect(hi(4, 1, 3)).toBe(6); // the bar 3 kept 4, its last non-na value
  });

  it('called on every bar, equals ta.lowest / ta.highest', () => {
    const x = [5, 3, 8, 1, 9, NaN, 7, 7, 4, 6, 1, 1, 3, 9, 0, 2];
    const lo = callsite.lowestByBar();
    const hi = callsite.highestByBar();
    expect(x.map((v, i) => lo(i, v, 4))).toEqual(taCore.lowest(x, 4));
    expect(x.map((v, i) => hi(i, v, 4))).toEqual(taCore.highest(x, 4));
  });
});

describe('callsite.highestbars / lowestbars (#160)', () => {
  it('if bar_index % 2 == 0: ta.highestbars(src, 5) counts bars to the best of the calls (PineScript values)', () => {
    const src = [
      0, 100.16648104524685, -23.554110202683123, -89.58146823277325, 53.411335113860815, 84.84871126234903,
      -63.98746875935423, -54.81371122370333, 93.91618148564957, 48.67405731306137, -86.13974918795569,
      -14.89990258141988, 100.97929001426692,
    ];
    const site = callsite.highestbars();
    const out = src.map((v, i) => (i % 2 === 0 ? site(i, v, 5) : NaN));
    expect(out).toEqual([NaN, NaN, NaN, NaN, -0, NaN, -2, NaN, -0, NaN, -2, NaN, -0]);
  });

  it('the newest value on ties; called on every bar, equals ta.lowestbars', () => {
    const x = [5, 1, 1, 2, NaN, 3, 1, 4];
    const site = callsite.lowestbars();
    expect(x.map((v, i) => site(i, v, 3))).toEqual(taCore.lowestbars(x, 3));
  });
});

describe('callsite.pivothigh / pivotlow (#169)', () => {
  it('the highest of the last left + right + 1 calls must be on the bar right bars back', () => {
    const site = callsite.pivothigh();
    // calls on bars 0..5, then 8: 9 on bar 3 is the highest of the calls
    const out = [1, 2, 3, 9, 4, 5].map((v, i) => site(i, v, 2, 2));
    expect(out).toEqual([NaN, NaN, NaN, NaN, NaN, 9]);
    // on bar 8 the highest of the last 5 calls is still 9 (bar 3), which is not 2 bars back
    expect(site(8, 6, 2, 2)).toBeNaN();
    // bar 10: the last 5 calls are bars 3, 4, 5, 8, 10; no pivot on bar 8
    expect(site(10, 0, 2, 2)).toBeNaN();
  });

  it('called on every bar, equals ta.pivothigh / ta.pivotlow', () => {
    const x = [5, 3, 8, 1, 9, NaN, 7, 7, 4, 6, 1, 1, 3, 9, 0, 2];
    const hi = callsite.pivothigh();
    const lo = callsite.pivotlow();
    expect(x.map((v, i) => hi(i, v, 2, 1))).toEqual(taCore.pivothigh(x, 2, 1));
    expect(x.map((v, i) => lo(i, v, 2, 1))).toEqual(taCore.pivotlow(x, 2, 1));
  });
});

describe('callsite.sum / sma (ta.* call in a loop, #139)', () => {
  const x = [0.1, 0.7, 0.3, 1.9, 2.2, 0.4, 5.1, 0.25, 3.3, 0.6];

  it('called once per bar, equals math.sum / ta.sma bit for bit', () => {
    const sum = callsite.sum();
    const sma = callsite.sma();
    expect(x.map((v, b) => sum(b, v, 3))).toEqual(math.sum(x, 3));
    expect(x.map((v, b) => sma(b, v, 4))).toEqual(taCore.sma(x, 4));
  });

  it('every call on a bar starts from the earlier bars; the last call of the bar is kept', () => {
    const sum = callsite.sum();
    const first: number[] = [];
    const last: number[] = [];
    x.forEach((v, b) => {
      first.push(sum(b, v, 3));
      sum(b, v + 100, 3);
      last.push(sum(b, v + 10, 3));
    });
    const kept = x.map((v) => v + 10);
    const lastRef = math.sum(kept, 3);
    expect(last).toEqual(lastRef);
    // the first call: its own value plus the last two kept values
    expect(first.slice(0, 2)).toEqual([NaN, NaN]);
    x.slice(2).forEach((v, k) => expect(first[k + 2]).toBeCloseTo(kept[k]! + kept[k + 1]! + v, 12));
  });

  it('a bar without a call is not in the history', () => {
    const sma = callsite.sma();
    const called = x.map((_, b) => b % 3 !== 0);
    const out = x.map((v, b) => (called[b] ? sma(b, v, 2) : NaN));
    expect(out).toEqual(callsite.whenCalled(called, (v) => taCore.sma(v, 2), x));
  });

  it('an na value returns the sum of the earlier bars', () => {
    const sum = callsite.sum();
    expect([sum(0, 1, 2), sum(1, 2, 2), sum(2, NaN, 2), sum(3, 4, 2)]).toEqual([NaN, 3, 3, 6]);
  });

  it('several lengths on one bar: each call moves the kept sum to its length, as PineScript (#143)', () => {
    // Pine: for i = 0 to 2 / v = math.sum(close, i == 0 ? 5 : i == 1 ? 2 : 10); daily BTCUSD closes
    const closes = [10.9, 11.69, 11.7, 11.7, 11.7, 10.5, 10, 8, 8.22, 8.88, 8.89, 8];
    const sum = callsite.sum();
    const out: number[][] = [[], [], []];
    closes.forEach((c, b) => [5, 2, 10].forEach((len, k) => out[k]!.push(sum(b, c, len))));
    // a separate math.sum(close, 2) gives 20.5 on bar 6
    expect(out[1]!.slice(1, 8)).toEqual([22.59, 23.39, 23.4, 23.4, 22.2, 20.499999999999996, 18]);
    expect(out[0]!.slice(4, 8)).toEqual([57.69, 57.29, 55.599999999999994, 51.9]);
    expect(out[2]!.slice(9, 12)).toEqual([103.28999999999999, 101.28, 97.59]);
  });

  it('stdev: running sums of the values and of their squares, as ta.stdev', () => {
    const dev = callsite.stdev();
    const out = x.map((v, b) => dev(b, v, 3));
    expect(out).toEqual(taCore.stdev(x, 3));
  });
});
