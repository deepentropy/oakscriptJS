/**
 * ta.tr and ta.mfi, following the PineScript reference code.
 */
import { taCore } from '../../src';

const high = [11, 12, 13, 12, 14];
const low = [9, 10, 11, 10, 12];
const close = [10, 11, 12, 11, 13];

describe('ta.tr', () => {
  it('bar 0: na with handle_na = false, high - low with handle_na = true', () => {
    expect(Number.isNaN(taCore.tr(false, high, low, close)[0]!)).toBe(true);
    expect(taCore.tr(true, high, low, close)[0]).toBe(2);
  });

  it('later bars: max(high - low, |high - close[1]|, |low - close[1]|)', () => {
    expect(taCore.tr(false, high, low, close).slice(1)).toEqual([2, 2, 2, 3]);
  });

  it('ta.atr uses ta.tr(true): value on bar length - 1', () => {
    const atr = taCore.atr(2, high, low, close);
    expect(Number.isNaN(atr[0]!)).toBe(true);
    expect(atr[1]).toBe(2); // sma of 2 and 2
    expect(atr[4]).toBeCloseTo(0.5 * 3 + 0.5 * atr[3]!, 12);
  });
});

describe('ta.mfi', () => {
  // Reference: upper = math.sum(volume * (ta.change(src) <= 0 ? 0 : src), length)
  //            lower = math.sum(volume * (ta.change(src) >= 0 ? 0 : src), length)
  const src = [10, 11, 10.5, 12, 11.5, 11.5];
  const volume = [100, 200, 300, 400, 500, 600];

  it('bar 0 (change na) counts in both sums, so the first value is on bar length - 1', () => {
    const mfi = taCore.mfi(src, 3, volume);
    expect(Number.isNaN(mfi[1]!)).toBe(true);
    const upper = 10 * 100 + 11 * 200; // bars 0 (na change) and 1 (up)
    const lower = 10 * 100 + 10.5 * 300; // bars 0 (na change) and 2 (down)
    expect(mfi[2]).toBeCloseTo(100 - 100 / (1 + upper / lower), 12);
  });

  it('an unchanged source adds to neither sum', () => {
    const mfi = taCore.mfi(src, 3, volume);
    const upper = 12 * 400; // bars 3 (up), 4 (down), 5 (unchanged)
    const lower = 11.5 * 500;
    expect(mfi[5]).toBeCloseTo(100 - 100 / (1 + upper / lower), 12);
  });

  it('a change within 1e-10 of 0 counts as unchanged (Pine comparison tolerance)', () => {
    const noisy = [10, 11, 11 + 5.7e-14, 10];
    const mfi = taCore.mfi(noisy, 3, [1, 1, 1, 1]);
    const upper = 11; // bar 1 only; bar 2 is unchanged
    const lower = 10; // bar 3
    expect(mfi[3]).toBeCloseTo(100 - 100 / (1 + upper / lower), 12);
  });
});

describe('ta.dmi and ta.kc use ta.tr (na on bar 0)', () => {
  const h = [11, 12, 13, 12, 14, 15, 14, 16];
  const l = [9, 10, 11, 10, 12, 13, 12, 14];
  const c = [10, 11, 12, 11, 13, 14, 13, 15];

  it('ta.dmi: +DM, -DM and TR are na on bar 0, so +DI / -DI start on bar length', () => {
    const [plus, minus, adx] = taCore.dmi(3, 2, h, l, c);
    expect(plus.slice(0, 3).every(Number.isNaN)).toBe(true);
    expect(minus.slice(0, 3).every(Number.isNaN)).toBe(true);
    // bars 1..3: up = 1, 1, -1; down = -1, -1, 1; TR = 2, 2, 2
    expect(plus[3]).toBeCloseTo((100 * (2 / 3)) / 2, 12);
    expect(minus[3]).toBeCloseTo((100 * (1 / 3)) / 2, 12);
    expect(Number.isNaN(adx[3]!)).toBe(true);
    expect(adx[4]).toBeGreaterThan(0);
  });

  it('ta.dmi: a zero true range gives na, and fixnan keeps the previous value', () => {
    const flat = [5, 5, 5, 5, 5, 5];
    const [plus] = taCore.dmi(2, 2, flat, flat, flat);
    expect(plus.every(Number.isNaN)).toBe(true);
  });

  it('ta.kc: with the true range, the range EMA starts one bar later than with high - low', () => {
    const [, upperTr] = taCore.kc(c, 3, 1, true, h, l, c);
    const [, upperHl] = taCore.kc(c, 3, 1, false, h, l, c);
    expect(Number.isNaN(upperTr[2]!)).toBe(true);
    expect(upperHl[2]).toBeCloseTo(11 + 2, 12);
    expect(upperTr[3]).toBeCloseTo(taCore.ema(c, 3)[3]! + 2, 12); // TR of bars 1..3 = 2, 2, 2
  });
});
