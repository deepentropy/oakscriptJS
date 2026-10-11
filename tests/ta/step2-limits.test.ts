/**
 * ta.wma with a series length (#161) and the 15,000-bar limit of the window functions (#164).
 */
import { callsite, math, taCore } from '../../src';

const na = NaN;

describe('ta.wma with a series length (#161)', () => {
  it('each bar gives the result of its own length', () => {
    const s = Array.from({ length: 60 }, (_, i) => (i % 13 === 4 ? NaN : 100 + Math.sin(i) * 7 + i * 0.3));
    const lengths = s.map((_, i) => (i % 17) + 1);
    const got = taCore.wma(s, lengths);
    const byLength = new Map<number, number[]>();
    s.forEach((_, i) => {
      const L = lengths[i]!;
      if (!byLength.has(L)) byLength.set(L, taCore.wma(s, L));
      expect(got[i]).toEqual(byLength.get(L)![i]);
    });
  });

  it('a fractional length is truncated; a length below 1, na or above the bars so far gives na', () => {
    expect(taCore.wma([1, 2, 3, 4, 5, 6], [1, 1, 3, 2.9, 30, 3])).toEqual([1, 2, 14 / 6, 11 / 3, na, 32 / 6]);
    expect(taCore.wma([1, 2, 3], [0, 2, NaN])).toEqual([na, 5 / 3, na]);
  });
});

describe('window limit of 15,000 bars (PineScript runtime error RE10004, #164)', () => {
  const s = [1, 2, 3];
  const message = (name: string) =>
    `Error on bar 0: The '${name}' function references too many historical candles (15001), the limit is 15000.`;

  it('a length above 15,000 throws the PineScript message; 15,000 is accepted', () => {
    expect(() => taCore.highest(s, 15001)).toThrow(message('highest'));
    expect(() => taCore.lowest(s, 15001)).toThrow(message('lowest'));
    expect(() => taCore.highestbars(s, 15001.9)).toThrow(message('highestbars'));
    expect(() => taCore.lowestbars(s, 15001)).toThrow(message('lowestbars'));
    expect(taCore.highest(s, 15000)).toEqual([na, na, na]);
    expect(taCore.lowest(s, 15000.9)).toEqual([na, na, na]);
  });

  it('the highest / lowest call sites throw on the call whose length is above 15,000', () => {
    const site = callsite.highest();
    expect(site(1, 15000)).toBeNaN();
    expect(() => site(2, 15001)).toThrow(
      "The 'highest' function references too many historical candles (15001), the limit is 15000."
    );
    const byBar = callsite.lowestByBar();
    expect(() => byBar(15000, 2, 15001)).toThrow(
      "Error on bar 15000: The 'lowest' function references too many historical candles (15001), the limit is 15000."
    );
  });
});

describe('window limit of 5,000 bars of math.sum / ta.sma / ta.variance / ta.stdev / ta.bb (RE10004, #164)', () => {
  const s = [1, 2, 3];
  const message = (fn: string, depth = 5001, bar = 0) =>
    `Error on bar ${bar}: The ${fn} function references too many historical candles (${depth}), the limit is 5000.`;

  it('a constant length above 5,000 throws the PineScript message on bar 0; 5,000 is accepted', () => {
    expect(() => math.sum(s, 5001)).toThrow(message("'sum'"));
    expect(() => taCore.sma(s, 5001)).toThrow(message("'sma'"));
    expect(() => taCore.sma(s, 20000)).toThrow(message("'sma'", 20000));
    expect(() => taCore.variance(s, 5001)).toThrow(message("'variance'"));
    expect(() => taCore.stdev(s, 5001)).toThrow(message("'stdev'->'variance'"));
    expect(() => taCore.bb(s, 5001, 2)).toThrow(message("'bb'->'sma'"));
    expect(math.sum(s, 5000)).toEqual([na, na, na]);
    expect(taCore.sma(s, 5000)).toEqual([na, na, na]);
  });

  it('a series length throws on the bar where it passes 5,000', () => {
    expect(() => taCore.sma(s, [1, 5000, 5001])).toThrow(message("'sma'", 5001, 2));
    expect(() => math.sum(s, [1, 5001, 3])).toThrow(message("'sum'", 5001, 1));
    expect(() => taCore.stdev(s, [1, 2, 5001])).toThrow(message("'stdev'->'variance'", 5001, 2));
    expect(() => taCore.variance(s, [5001, 2, 3])).toThrow(message("'variance'", 5001, 0));
    const site = callsite.sma();
    expect(() => site(7, 1, 5001)).toThrow(message("'sma'", 5001, 7));
  });
});

describe('series lengths of ta.highest / lowest / highestbars / lowestbars / pivothigh / pivotlow (#160, #169)', () => {
  const x = [5, 3, 8, NaN, 9, 2, 7, 7, 4, 6, 1, 1, 3, 9, 0, 2];
  const lengths = x.map((_, i) => 2 + (i % 4));

  it('each bar uses its own length: equal to the call site called on every bar', () => {
    for (const [fn, site] of [
      [taCore.highest, callsite.highestByBar()], [taCore.lowest, callsite.lowestByBar()],
      [taCore.highestbars, callsite.highestbars()], [taCore.lowestbars, callsite.lowestbars()],
    ] as const) {
      expect(fn(x, lengths)).toEqual(x.map((v, i) => site(i, v, lengths[i]!)));
    }
  });

  it('a constant length given as an array equals the fixed length', () => {
    expect(taCore.highest(x, x.map(() => 3))).toEqual(taCore.highest(x, 3));
    expect(taCore.lowestbars(x, x.map(() => 3))).toEqual(taCore.lowestbars(x, 3));
  });

  it('pivots: the lengths of the current bar, left and right', () => {
    const left = x.map((_, i) => 1 + (i % 3));
    const right = x.map((_, i) => 1 + (i % 2));
    const hi = callsite.pivothigh();
    const lo = callsite.pivotlow();
    expect(taCore.pivothigh(x, left, right)).toEqual(x.map((v, i) => hi(i, v, left[i]!, right[i]!)));
    expect(taCore.pivotlow(x, left, 1)).toEqual(x.map((v, i) => lo(i, v, left[i]!, 1)));
    expect(taCore.pivothigh(x, x.map(() => 2), 1)).toEqual(taCore.pivothigh(x, 2, 1));
  });

  it('a length above 15,000 on a bar throws on that bar', () => {
    expect(() => taCore.highest([1, 2, 3], [2, 15001, 2])).toThrow(
      "Error on bar 1: The 'highest' function references too many historical candles (15001), the limit is 15000."
    );
  });
});
