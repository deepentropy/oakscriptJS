/**
 * PineScript rules behind three 0.6.0 bugs:
 * comparison operators with a 1e-10 tolerance, ta.rsi / ta.rma with na values, color.new with hex colours.
 */
import { Series, color, compare, taCore } from '../../src';

describe('comparison operators', () => {
  it('use an absolute tolerance of 1e-10', () => {
    expect(compare.eq(0.1 + 0.2, 0.3)).toBe(true);
    expect(0.1 + 0.2 === 0.3).toBe(false);
    expect(compare.eq(1e-12, 1e-12 + 9e-11)).toBe(true);
    expect(compare.eq(1, 1 + 1e-10)).toBe(false); // 1 + 1e-10 - 1 = 1.00000008e-10
    expect(compare.lt(150, 150 + 1e-10)).toBe(false); // difference 9.9988e-11
    expect(compare.lt(150, 150 + 2e-10)).toBe(true);
    expect(compare.le(1 + 5e-11, 1)).toBe(true);
    expect(compare.ge(1, 1 + 5e-11)).toBe(true);
    expect(compare.gt(1 + 5e-11, 1)).toBe(false);
    expect(compare.ne(1, 1 + 5e-11)).toBe(false);
  });

  it('are false with an na operand, != included', () => {
    for (const fn of [compare.eq, compare.ne, compare.lt, compare.le, compare.gt, compare.ge]) {
      expect(fn(NaN, 1)).toBe(false);
      expect(fn(NaN, NaN)).toBe(false);
    }
  });

  it('Series comparison methods follow the same rules', () => {
    const bars = [0.3, NaN].map((c, i) => ({ time: i, open: c, high: c, low: c, close: c, volume: 0 }));
    const a = new Series(bars, (b) => b.close);
    expect(a.eq(0.1 + 0.2).toArray()).toEqual([1, 0]);
    expect(a.neq(0.1 + 0.2).toArray()).toEqual([0, 0]);
    expect(a.gte(0.3 + 5e-11).toArray()).toEqual([1, 0]);
  });
});

describe('ta.rsi and ta.rma with na values', () => {
  const close = Array.from({ length: 40 }, (_, i) => 50 + Math.sin(i) * 5 + i * 0.1);

  it('rma is na on an na source bar and continues from its last value', () => {
    const src = close.map((c, i) => (i === 25 ? NaN : c));
    const r = taCore.rma(src, 14);
    expect(r[25]).toBeNaN();
    expect(r[26]).toBeCloseTo((1 / 14) * src[26]! + (13 / 14) * r[24]!, 12);
  });

  it('rsi: a change from or to na is na, not a 0 gain / loss', () => {
    const lead = close.map((c, i) => (i < 10 ? NaN : c));
    const r = taCore.rsi(lead, 14);
    expect(r.findIndex((v) => !Number.isNaN(v))).toBe(24); // first change at bar 11, then 14 values
    const mid = taCore.rsi(close.map((c, i) => (i === 30 ? NaN : c)), 14);
    expect([mid[29], mid[30], mid[31], mid[32]].map(Number.isNaN)).toEqual([false, true, true, false]);
  });
});

describe('color.new with hex colours', () => {
  it('keeps the RGB of #RRGGBB and reads #RRGGBBAA', () => {
    const c = color.new_color('#089981', 80);
    expect([color.r(c), color.g(c), color.b(c), color.t(c)]).toEqual([8, 153, 129, 80]);
    expect(color.t('#08998133')).toBeCloseTo(80, 10);
    expect(color.r('#f00')).toBe(255);
  });
});
