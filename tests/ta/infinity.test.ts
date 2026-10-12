/**
 * +/-Infinity in window functions (#183): PineScript skips it like na in ta.highest / ta.lowest / ta.highestbars /
 * ta.lowestbars / ta.max / ta.min / ta.range / ta.pivothigh / ta.pivotlow / ta.median / ta.mode / ta.rising /
 * ta.falling and their call sites. ta.stoch gives +/-Infinity for a non-zero value over a zero range.
 * Expected values are PineScript outputs (full precision) for the same inputs.
 */
import { taCore, callsite } from '../../src';

const na = NaN;
const P = Infinity;
const M = -Infinity;
// Daily BTCUSD, first 30 bars
const CLOSE = [
  10.9, 11.69, 11.7, 11.7, 11.7, 10.5, 10, 8, 8.22, 8.88, 8.89, 8, 8.5, 7.4, 5.97, 5.53, 5.13, 4.85, 4.87, 4.92, 4.9,
  5.66, 5.66, 5.72, 5.72, 5.68, 6.05, 4.8, 4.92, 4.82,
];
const I = CLOSE.map((_, i) => i);
const xa = I.map((i) => [P, M, CLOSE[i]!, NaN][i % 4]!); // +inf, -inf, close, na
const xb = I.map((i) => (i % 5 === 2 ? P : CLOSE[i]!));
const xc = I.map((i) => (i % 5 === 2 ? M : CLOSE[i]!));
const xd = I.map((i) => (i % 20 < 7 ? P : i % 20 < 10 ? NaN : CLOSE[i]!));
const xe = I.map((i) => (i < 10 ? P : i % 7 === 3 ? M : CLOSE[i]!));
/** The sign of a zero offset is not part of the comparison (the library gives -0 for the current bar). */
const off = (a: number[]) => a.map((v) => v + 0);

describe('+/-Infinity is skipped like na (#183)', () => {
  it('ta.highest / ta.lowest', () => {
    expect(taCore.highest(xa, 3)).toEqual([
      na, na, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 10, 10, 10, 10, 8.89, 8.89, 8.89,
      8.89, 5.97, 5.97, 5.97, 5.97, 6.05, 6.05, 6.05, 6.05,
    ]);
    expect(taCore.lowest(xa, 3)).toEqual([
      na, na, 11.7, 11.7, 11.7, 11.7, 10, 10, 10, 10, 8.89, 8.89, 8.89, 8.89, 5.97, 5.97, 5.97, 5.97, 4.87, 4.87, 4.87,
      4.87, 4.87, 4.87, 4.87, 4.87, 4.87, 4.87, 4.87, 4.87,
    ]);
    expect(taCore.lowest(xb, 3)).toEqual([
      na, na, 10.9, 10.9, 11.69, 10.5, 10, 10, 8.22, 8.22, 8.22, 8, 8, 7.4, 5.97, 5.53, 5.13, 5.13, 4.87, 4.87, 4.87, 4.9,
      4.9, 4.9, 5.66, 5.68, 5.68, 5.68, 4.92, 4.82,
    ]);
    expect(taCore.highest(xc, 3)).toEqual([
      na, na, 11.69, 11.7, 11.7, 11.7, 11.7, 11.7, 10.5, 10, 8.89, 8.89, 8.89, 8.89, 8, 7.4, 5.97, 5.97, 5.53, 5.13, 4.92,
      5.66, 5.66, 5.72, 5.72, 5.72, 6.05, 6.05, 6.05, 6.05,
    ]);
    expect(taCore.highest(xd, 3)).toEqual([
      na, na, na, na, na, na, na, na, na, na, 8.89, 8.89, 8.89, 8.5, 8.5, 7.4, 5.97, 5.53, 5.13, 4.92, 4.92, 4.92, 4.92,
      4.92, 4.92, 4.92, 4.92, 4.92, 4.92, 4.92,
    ]);
  });

  it('ta.highestbars / ta.lowestbars count bars, so skipped infinite values make the offset larger', () => {
    expect(off(taCore.highestbars(xa, 3))).toEqual([
      na, na, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -8, -9, -10, -11, -8, -9, -10, -11, -8, -9, -10, -11, 0,
      -1, -2, -3,
    ]);
    expect(off(taCore.lowestbars(xc, 3))).toEqual([
      na, na, -2, -3, -3, 0, 0, -1, 0, -1, -2, 0, -1, 0, 0, 0, 0, -1, 0, -1, -2, -1, -2, -3, -3, 0, -1, -2, 0, 0,
    ]);
    expect(off(taCore.highestbars(xe, 3))).toEqual([
      na, na, na, na, na, na, na, na, na, na, na, 0, 0, -1, -2, -2, -2, -3, -3, -3, -1, 0, 0, 0, -1, -2, 0, -1, -2, -1,
    ]);
  });

  it('a series length', () => {
    const len = I.map((i) => 2 + (i % 4));
    expect(taCore.highest(xa, len)).toEqual([
      na, na, na, na, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 10, 11.7, 11.7, 11.7, 8.89, 10, 10, 11.7, 5.97, 8.89,
      8.89, 10, 5.66, 5.97, 6.05, 8.89, 6.05, 6.05,
    ]);
    expect(off(taCore.lowestbars(xe, len))).toEqual([
      na, na, na, na, na, na, na, na, na, na, na, 0, -1, 0, 0, 0, 0, -1, 0, -1, 0, -1, -2, -3, -2, -3, -4, 0, -1, -2,
    ]);
  });

  it('ta.max / ta.min', () => {
    expect(taCore.max(xa)).toEqual([na, na, ...Array<number>(28).fill(11.7)]);
    expect(taCore.min(xe)).toEqual([
      na, na, na, na, na, na, na, na, na, na, na, 8, 8, 7.4, 5.97, 5.53, 5.13, 5.13, 4.87, 4.87, 4.87, 4.87, 4.87, 4.87,
      4.87, 4.87, 4.87, 4.8, 4.8, 4.8,
    ]);
  });

  it('ta.range', () => {
    expect(taCore.range(xa, 3).slice(8, 30)).toEqual([
      na, na, 2.8099999999999987, 2.8099999999999987, 2.8099999999999987, 2.8099999999999987, 4.03, 4.03, 4.03, 4.03,
      4.0200000000000005, 4.0200000000000005, 4.0200000000000005, 4.0200000000000005, 1.0999999999999996,
      1.0999999999999996, 1.0999999999999996, 1.0999999999999996, 1.1799999999999997, 1.1799999999999997,
      1.1799999999999997, 1.1799999999999997,
    ]);
  });

  it('ta.pivothigh / ta.pivotlow', () => {
    const at = (a: number[]) => a.flatMap((v, i) => (Number.isNaN(v) ? [] : [[i, v]]));
    expect(at(taCore.pivothigh(xb, 2, 2))).toEqual([[6, 11.7], [28, 6.05]]);
    expect(at(taCore.pivotlow(xb, 2, 2))).toEqual([[10, 8.22], [20, 4.87]]);
    expect(at(taCore.pivothigh(xd, 2, 2))).toEqual([[12, 8.89]]);
    expect(at(taCore.pivotlow(xe, 2, 2))).toEqual([[20, 4.87], [29, 4.8]]);
  });

  it('call sites in an if block and in a loop', () => {
    const run = (site: (b: number, v: number, ...a: number[]) => number, src: number[], ...args: number[]) =>
      I.map((i) => (i % 3 !== 1 ? site(i, src[i]!, ...args) : na));
    expect(run(callsite.highestByBar(), xa, 3)).toEqual([
      na, na, 11.7, 11.7, na, 11.7, 11.7, na, 11.7, 11.7, na, 11.7, 11.7, na, 11.7, 11.7, na, 11.7, 10, na, 10, 10, na,
      10, 10, na, 6.05, 6.05, na, 6.05,
    ]);
    expect(off(run(callsite.highestbars(), xb, 3))).toEqual([
      na, na, -2, 0, na, -2, -3, na, -3, -3, na, -2, -3, na, -5, -4, na, -6, -4, na, -5, 0, na, 0, 0, na, 0, -1, na, -3,
    ]);
    const ph = run(callsite.pivothigh(), xb, 2, 1);
    expect(ph.flatMap((v, i) => (Number.isNaN(v) ? [] : [[i, v]]))).toEqual([[27, 6.05]]);
    // for j = 0 to 1: lh := ta.highest(j == 0 ? xb : xc, 3); the -inf of the second turn does not replace the first
    const site = callsite.highestByBar();
    const loop = I.map((i) => {
      let r = na;
      for (let j = 0; j <= 1; j++) r = site(i, (j === 0 ? xb : xc)[i]!, 3);
      return r;
    });
    expect(loop).toEqual(taCore.highest(xc, 3));
  });
});

describe('+/-Infinity in ta.median / ta.mode / ta.rising / ta.falling (#183)', () => {
  // Daily BTCUSD, first 60 bars, +inf on bar 7 and -inf on bar 31 (of every 50)
  const C60 = [
    ...CLOSE, 4.82, 4.87, 4.98, 4.92, 4.8, 4.61, 3.99, 3.89, 4.51, 4.1, 3.93, 3.97, 4.05, 3.92, 2.24, 2.27, 2.92, 2.72,
    2.69, 4.2, 3.95, 3.5, 3.3, 3.33, 3.55, 3, 2.95, 3.08, 3.3, 3.3,
  ];
  const y = C60.map((c, i) => (i % 50 === 7 ? P : i % 50 === 31 ? M : c));

  it('ta.median', () => {
    expect(taCore.median(y, 5)).toEqual([
      na, na, na, na, 11.7, 11.7, 11.7, 11.7, 10.5, 10, 8.89, 8.88, 8.5, 8.5, 8, 7.4, 5.97, 5.53, 5.13, 4.92, 4.9, 4.9,
      4.92, 5.66, 5.66, 5.68, 5.72, 5.72, 5.68, 4.92, 4.82, 4.82, 4.82, 4.92, 4.82, 4.82, 4.8, 4.61, 4.51, 4.1, 3.99,
      3.97, 4.05, 3.97, 3.93, 3.92, 2.92, 2.72, 2.69, 2.72, 2.92, 3.5, 3.5, 3.5, 3.5, 3.33, 3.3, 3.3, 3.3, 3.3,
    ]);
  });

  it('ta.mode', () => {
    expect(taCore.mode(y, 5)).toEqual([
      na, na, na, na, 11.7, 11.7, 11.7, 11.7, 11.7, 8.22, 8.22, 8, 8, 7.4, 5.97, 5.53, 5.13, 4.85, 4.85, 4.85, 4.85, 4.85,
      5.66, 5.66, 5.66, 5.66, 5.72, 5.72, 4.8, 4.8, 4.82, 4.82, 4.82, 4.82, 4.82, 4.61, 3.99, 3.89, 3.89, 3.89, 3.89,
      3.89, 3.93, 3.92, 2.24, 2.24, 2.24, 2.24, 2.24, 2.27, 2.69, 2.69, 2.69, 3.3, 3.3, 3, 2.95, 2.95, 2.95, 3.3,
    ]);
  });

  it('ta.rising / ta.falling: a step from or to an infinite value leaves the counter unchanged', () => {
    const on = (a: boolean[]) => a.flatMap((v, i) => (v ? [i] : []));
    expect(on(taCore.rising(y, 3))).toEqual([]);
    expect(on(taCore.falling(y, 3))).toEqual([15, 16, 17, 35, 36, 37, 52]);
  });
});

describe('ta.stoch on a zero range (#183)', () => {
  it('a zero range gives +/-Infinity for a value away from the lowest, the previous result for 0 / 0', () => {
    // Daily AAPL bars 295 to 311, high = close with +inf every 5 bars, low = close with -inf every 5 bars
    const close = [
      0.082031, 0.083147, 0.084263, 0.083705, 0.082589, 0.081473, 0.082031, 0.081473, 0.081473, 0.082031, 0.082031,
      0.082031, 0.080357, 0.074219, 0.073103, 0.073661, 0.072545,
    ];
    const high = close.map((c, j) => ((295 + j) % 5 === 2 ? P : c));
    const low = close.map((c, j) => ((295 + j) % 5 === 2 ? M : c));
    expect(taCore.stoch(close, high, low, 3).slice(3)).toEqual([
      100, 0, 0, 50.000000000000625, 0, 0, 100, 100, 100, M, 0, 0, 50.000000000000625, 0,
    ]);
  });
});
