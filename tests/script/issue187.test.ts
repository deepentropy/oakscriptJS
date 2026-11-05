/**
 * #187: na(), nz() and color.from_gradient() on a Series. Expected values are PineScript results of the same calls
 * (BITSTAMP:BTCUSD 1D, first bars of the history and bars 71 to 86).
 */
import { Series, color, executeScript, na, nz, open } from '../../src/script';
import type { Bar } from '../../src/types';
import * as colorCore from '../../src/color';

const NA = NaN;

const close0 = [10.9, 11.69, 11.7, 11.7, 11.7, 10.5, 10, 8, 8.22, 8.88, 8.89, 8, 8.5, 7.4, 5.97, 5.53, 5.13, 4.85, 4.87, 4.92];
const open0 = [10.9, 11.85, 11.7, 11.7, 11.7, 11.5, 10, 8, 8, 8.12, 8.89, 8, 8.5, 7.98, 5.8, 5.58, 5.12, 4.82, 4.87, 4.87];
const bars0: Bar[] = close0.map((c, i) => ({ time: i, open: open0[i]!, high: Math.max(c, open0[i]!), low: Math.min(c, open0[i]!), close: c }));
// x = bar_index % 13 == 4 ? na : bar_index % 17 == 3 ? close / 0 : bar_index % 19 == 7 ? -close / 0 : close - open
const x0 = close0.map((c, i) => (i % 13 === 4 ? NA : i % 17 === 3 ? c / 0 : i % 19 === 7 ? -c / 0 : c - open0[i]!));

describe('na() and nz() on a Series', () => {
  it('na(x) is 1 where x is NaN or +/-Infinity', () => {
    let got: number[] = [];
    executeScript(() => { got = na(Series.fromArray(bars0, x0)).toArray(); }, bars0);
    expect(got).toEqual([0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]);
  });

  it('nz(x), nz(x, number), nz(x, series) replace the na values of each bar', () => {
    const out: Record<string, number[]> = {};
    executeScript(() => {
      const x = Series.fromArray(bars0, x0);
      // y = bar_index % 11 == 2 ? na : open
      const y = Series.fromArray(bars0, open0.map((o, i) => (i % 11 === 2 ? NA : o)));
      out.zero = nz(x).toArray();
      out.open = nz(x, open).toArray();
      out.constant = nz(x, -1.5).toArray();
      out.y = nz(x, y).toArray();
    }, bars0);
    const diff = [0, -0.16000000000000014, 0, 0, 0, -1, 0, 0, 0.22000000000000064, 0.7600000000000016, 0, 0, 0,
      -0.5800000000000001, 0.16999999999999993, -0.04999999999999982, 0.009999999999999787, 0, 0, 0.04999999999999982];
    const withNa = (r: number[]) => diff.map((d, i) => ([3, 4, 7, 17].includes(i) ? r[[3, 4, 7, 17].indexOf(i)]! : d));
    expect(out.zero).toEqual(withNa([0, 0, 0, 0]));
    expect(out.open).toEqual(withNa([11.7, 11.7, 8, 4.82]));
    expect(out.constant).toEqual(withNa([-1.5, -1.5, -1.5, -1.5]));
    expect(out.y).toEqual(withNa([11.7, 11.7, 8, 4.82]));
  });

  it('nz(x, y) is na where y is na too; numbers keep the boolean / number forms', () => {
    const b: Bar[] = [0, 1].map((t) => ({ time: t, open: 1, high: 1, low: 1, close: 1 }));
    let got: number[] = [];
    executeScript(() => { got = nz(Series.fromArray(b, [NA, Infinity]), Series.fromArray(b, [NA, NA])).toArray(); }, b);
    expect(got).toEqual([NA, NA]);
    expect(na(NA)).toBe(true);
    expect(na(-Infinity)).toBe(true);
    expect(na(0)).toBe(false);
    expect(nz(NA)).toBe(0);
    expect(nz(Infinity, 5)).toBe(5);
    expect(nz(2, 5)).toBe(2);
  });
});

describe('color.from_gradient() on a Series', () => {
  // bars 71..86: v = ta.rsi(close, 14), lo = bar_index % 23 == 5 ? na : 30 + bar_index % 7, hi = 70 - bar_index % 5
  const k = Array.from({ length: 16 }, (_, i) => 71 + i);
  const v = [41.36313628714669, 47.91162543646945, 44.638091607100826, 44.96206751086373, 43.455817862473964,
    44.54705355036872, 52.31096324636818, 55.58792641750301, 49.53201579661904, 47.90506583470504, 47.90506583470504,
    48.791761762452325, 54.168378729451206, 54.168378729451206, 52.182672627129215, 53.468546797304455];
  const up = [1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1];
  const bars: Bar[] = k.map((t) => ({ time: t, open: 1, high: 1, low: 1, close: 1 }));
  const channels = (cs: string[]) => [cs.map((c) => color.r(c)), cs.map((c) => color.g(c)), cs.map((c) => color.b(c)), cs.map((c) => color.t(c))];

  it('Series value and bounds, constant colours', () => {
    let got: string[] = [];
    executeScript(() => {
      const lo = Series.fromArray(bars, k.map((i) => (i % 23 === 5 ? NA : 30 + (i % 7))));
      const hi = Series.fromArray(bars, k.map((i) => 70 - (i % 5)));
      got = color.from_gradient(Series.fromArray(bars, v), lo, hi, color.red, color.new(color.green, 40)) as string[];
    }, bars);
    expect(channels(got)).toEqual([
      [211, 188, 202, 0, 215, 213, 165, 148, 177, 194, 194, 192, 165, 150, 172, 166],
      [76, 92, 82, 0, 73, 74, 109, 122, 101, 88, 88, 90, 109, 120, 104, 108],
      [71, 72, 71, 0, 70, 70, 74, 75, 73, 72, 72, 72, 74, 75, 73, 73],
      [11, 18, 14, 100, 10, 11, 24, 27, 21, 16, 16, 17, 24, 27, 22, 24],
    ]);
  });

  it('per-bar colour arrays, an na colour counts as transparent', () => {
    let got: string[] = [];
    executeScript(() => {
      const bottom = up.map((u) => (u === 1 ? color.blue : color.new(color.orange, 70)));
      const top = k.map((i) => (i % 9 === 0 ? undefined : color.rgb(10 + (i % 200), 250, 30, i % 60)));
      got = color.from_gradient(Series.fromArray(bars, v), 40, 60, bottom, top) as string[];
    }, bars);
    expect(channels(got)).toEqual([
      [43, 41, 49, 172, 192, 49, 118, 103, 137, 150, 41, 60, 74, 75, 127, 74],
      [107, 98, 129, 199, 188, 128, 231, 240, 221, 214, 98, 155, 196, 196, 229, 189],
      [241, 254, 208, 14, 11, 210, 24, 27, 21, 19, 255, 169, 108, 108, 23, 118],
      [1, 40, 3, 56, 60, 4, 37, 30, 46, 50, 40, 10, 16, 17, 43, 18],
    ]);
  });

  it('numbers give one colour, the core function', () => {
    expect(color.from_gradient(v[0]!, 30, 70, color.red, color.green)).toBe(colorCore.from_gradient(v[0]!, 30, 70, color.red, color.green));
  });
});
