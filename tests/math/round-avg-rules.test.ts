/**
 * math.round / round_to_mintick / avg / rphi: values measured on PineScript (NASDAQ:AAPL, mintick 0.01).
 */
import { math } from '../../src';
import { Series } from '../../src/runtime/series';

describe('math.round PineScript rules', () => {
  it('ties go away from zero', () => {
    expect(math.round(-2.5)).toBe(-3);
    expect(math.round(2.5)).toBe(3);
    expect(math.round(-0.5)).toBe(-1);
  });

  it('a precision rounds the decimal value', () => {
    expect(math.round(1.005, 2)).toBe(1.01);
    expect(math.round(2.675, 2)).toBe(2.68);
    expect(math.round(0.285, 2)).toBe(0.29);
    expect(math.round(-1.45, 1)).toBe(-1.5);
    expect(math.round(-1.075, 2)).toBe(-1.08);
  });

  it('a negative precision is the integer rounding', () => {
    expect(math.round(1234.5678, -2)).toBe(1235);
  });

  it('an infinite value gives na', () => {
    expect(math.round(Infinity)).toBeNaN();
    expect(math.round(NaN)).toBeNaN();
  });

  it('applies the same rules to a Series', () => {
    const bars = [1, 2, 3].map((t) => ({ time: t, open: 0, high: 0, low: 0, close: 0, volume: 0 }));
    const result = math.round(Series.fromArray(bars, [1.005, -1.45, 2.675]), 2);
    expect(result.toArray()).toEqual([1.01, -1.45, 2.68]);
  });
});

describe('math.round_to_mintick PineScript rules', () => {
  it('rounds on the tick grid, ties away from zero with the 1e-10 tolerance', () => {
    expect(math.round_to_mintick(-1.075, 0.01)).toBe(-1.08);
    expect(math.round_to_mintick(0.3, 0.01)).toBe(0.3);
    expect(math.round_to_mintick(1.005, 0.01)).toBe(1.01);
    expect(math.round_to_mintick(2.675, 0.01)).toBe(2.68);
    expect(math.round_to_mintick(10.125, 0.01)).toBe(10.13);
  });

  it('handles a tick that is not a power of 10', () => {
    expect(math.round_to_mintick(1.0374, 0.025)).toBe(1.025);
    expect(math.round_to_mintick(1.0375, 0.025)).toBe(1.05);
  });
});

describe('math.avg PineScript rules', () => {
  it('uses a Kahan sum from 3 values', () => {
    expect(math.avg(0.1, 0.2, 0.3)).toBe(0.19999999999999998);
    expect(math.avg(1e16, 1, 1)).toBe(3333333333333334);
  });

  it('uses a plain sum with 2 values', () => {
    expect(math.avg(1e16, 1)).toBe(5000000000000000);
  });
});

describe('math.rphi', () => {
  it('is 1 / phi', () => {
    expect(math.rphi).toBe(0.6180339887498948);
  });
});
