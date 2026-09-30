import { taCore, fixnan, ta } from '../../src';
import type { Bar } from '../../src/types';

// First 3 daily bars of NASDAQ:ARM (IPO 14/09/2023) and the values computed for them
// (30/09/2026, full history, see volume-check/doc/README.md).
const o = [56.1, 68.63, 57.95];
const h = [66.28, 69, 58.7407];
const l = [55.54, 60.75, 55.02];
const c = [63.59, 60.75, 58];
const v = [130534505, 74753091, 34571903];

const TV = {
  obv: [NaN, -74753091, -109324994],
  pvt: [NaN, -3338556.0377417873, -4903539.301116273],
  accdist: [65145711.99255128, -9607379.007448718, 11199690.196706448],
  iii: [65145711.99255128, -74753091, 20807069.204155166],
  wvad: [91033840.07914339, -71400528.13090906, 464588.692987853],
  wad: [0, -8.25, -11],
  nvi: [1, 0.9553388897625412, 0.9120930963988048],
  pvi: [1, 1, 1],
};

function expectSeries(actual: number[], expected: number[]): void {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((e, i) => {
    if (Number.isNaN(e)) expect(actual[i]).toBeNaN();
    else expect(actual[i]).toBeCloseTo(e, Math.max(0, 9 - Math.ceil(Math.log10(Math.abs(e) + 1))));
  });
}

describe('volume built-in variables (values)', () => {
  it.each([
    ['obv', () => taCore.obv(c, v)],
    ['pvt', () => taCore.pvt(c, v)],
    ['accdist', () => taCore.accdist(h, l, c, v)],
    ['iii', () => taCore.iii(h, l, c, v)],
    ['wvad', () => taCore.wvad(o, h, l, c, v)],
    ['wad', () => taCore.wad(h, l, c)],
    ['nvi', () => taCore.nvi(c, v)],
    ['pvi', () => taCore.pvi(c, v)],
  ] as const)('%s', (name, fn) => {
    expectSeries(fn(), TV[name]);
  });
});

describe('volume variables: na and flat bars', () => {
  const flatH = [10, 11, 11, 12];
  const flatL = [9, 10, 11, 11];
  const flatC = [9.5, 10.5, 11, 11.5];
  const flatO = [9.2, 10.2, 11, 11.2];
  const vol = [100, 200, 300, 400];

  it('iii and wvad are na on flat bars, accdist adds 0', () => {
    expect(taCore.iii(flatH, flatL, flatC, vol)[2]).toBeNaN();
    expect(taCore.wvad(flatO, flatH, flatL, flatC, vol)[2]).toBeNaN();
    const acc = taCore.accdist(flatH, flatL, flatC, vol);
    expect(acc[2]).toBe(acc[1]);
  });

  it('bars without volume give na, and cumulative sums skip them', () => {
    const noVol = [100, NaN, 300, 400];
    const obv = taCore.obv([1, 2, 3, 2], noVol);
    expect(obv[0]).toBeNaN();
    expect(obv[1]).toBeNaN();
    expect(obv[2]).toBe(300); // the na bar adds nothing
    expect(obv[3]).toBe(-100);
  });

  it('nvi and pvi stay at 1 without volume', () => {
    const noVol = [NaN, NaN, NaN, NaN];
    expect(taCore.nvi([1, 2, 3, 2], noVol)).toEqual([1, 1, 1, 1]);
    expect(taCore.pvi([1, 2, 3, 2], noVol)).toEqual([1, 1, 1, 1]);
  });

  it('wad is 0 on the first bar and on unchanged closes', () => {
    expect(taCore.wad([10, 12, 12], [8, 9, 9], [9, 11, 11])).toEqual([0, 2, 2]);
  });
});

describe('Series layer', () => {
  it('ta.obv(bars) equals taCore.obv', () => {
    const bars: Bar[] = c.map((close, i) => ({ time: i, open: o[i]!, high: h[i]!, low: l[i]!, close, volume: v[i]! }));
    expectSeries(ta.obv(bars).toArray(), TV.obv);
    expectSeries(ta.accdist(bars).toArray(), TV.accdist);
  });
});

describe('fixnan', () => {
  it('replaces na with the previous non-na value, and keeps leading na', () => {
    const out = fixnan([NaN, 1, NaN, NaN, 4, NaN]);
    expect(out[0]).toBeNaN();
    expect(out.slice(1)).toEqual([1, 1, 1, 4, 4]);
  });

  it('works for color series (undefined = na)', () => {
    expect(fixnan([undefined, '#ff0000', undefined, '#00ff00', undefined])).toEqual([
      undefined, '#ff0000', '#ff0000', '#00ff00', '#00ff00',
    ]);
  });
});
