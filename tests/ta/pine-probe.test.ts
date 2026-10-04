import { taCore as ta, callsite } from '../../src';

// PineScript values of BITSTAMP:BTCUSD 1D, first bars of the history (probe of 04/10/2026). Each series below is
// equal to PineScript bit for bit on the full BTCUSD (5,490 bars) and NASDAQ:AAPL (11,536 bars) daily histories.
const close = [10.9, 11.69, 11.7, 11.7, 11.7, 10.5, 10, 8, 8.22, 8.88, 8.89, 8, 8.5, 7.4, 5.97, 5.53, 5.13, 4.85, 4.87, 4.92, 4.9];
const high = [10.9, 11.85, 11.7, 11.7, 11.7, 11.5, 10, 8, 8.31, 8.88, 8.89, 8, 8.5, 7.98, 6, 5.72, 5.24, 4.87, 4.87, 4.92, 4.9];
const low = [10.9, 11.15, 11.7, 11.7, 11.7, 10.5, 10, 8, 5.25, 8, 8.89, 8, 8.5, 7.4, 5.65, 5.52, 5, 4.8, 4.87, 4.81, 4.9];
const volume = [
  0.48990826, 1.92657814, 0.08547009, 0.08547009, 0.02863249, 2.35652174, 1.1, 1, 164.48, 79.76, 0.20022497, 21, 3,
  6.86, 58.37138238, 61.14598362, 80.1407952, 39.9140068, 0.3, 119.8128, 20,
];
const N = NaN;

describe('PineScript probe values (BTCUSD 1D)', () => {
  it('ta.cog: -sum(source[i] * (i + 1)) / math.sum(source, length)', () => {
    expect(ta.cog(close, 3)).toEqual([
      N, N, -1.9766695829687957, -1.9997150185237957, -2, -2.0353982300884956, -2.0527950310559, -2.087719298245614,
      -2.06788710907704, -1.9649402390438244, -1.9742208541746824, -2.034148234381063, -2.0153603781016147,
      -2.0251046025104604, -2.115683584819387, -2.098941798941799, -2.050511124473842, -2.0438426821405544,
      -2.0175084175084175, -1.9952185792349726, -1.9979577944179716,
    ]);
    expect(ta.cog(close, 10).slice(8, 12)).toEqual([N, -5.825636557265951, -5.865027646129541, -5.888923045393995]);
    expect(ta.cog([1, NaN, 2, 3], 2)).toEqual([N, N, N, -1.4]); // an na bar in the window gives na
  });

  it('ta.kcw: a ratio, not a percentage', () => {
    expect(ta.kcw(close, 20, 2, true, high, low, close).slice(19)).toEqual([N, 0.356091419430332]);
  });

  it('ta.cross: the side of the last strict relation', () => {
    // st = p < 3 ? 1.0 : p == 3 ? 1.0 : p == 4 ? 2.0 : p == 5 ? 1.0 : p == 6 ? 1.0 - 5e-11 : p == 7 ? 2.0 : 0.5,
    // p = bar_index % 9. Bar 4: no strict relation before (equal from the start), so no cross. Bar 13: the equal
    // run 9-12 is passed, the last strict relation (bar 8) was below.
    const stOf = (p: number) => (p < 4 ? 1 : p === 4 ? 2 : p === 5 ? 1 : p === 6 ? 1 - 5e-11 : p === 7 ? 2 : 0.5);
    const st = Array.from({ length: 18 }, (_, i) => stOf(i % 9));
    const ones = st.map(() => 1);
    const expected = [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1];
    expect(ta.cross(st, ones).map(Number)).toEqual(expected);
    const site = callsite.cross();
    expect(st.map((v) => Number(site(v, 1)))).toEqual(expected);
    // an na bar is false and keeps the side
    expect(ta.cross([1, 2, NaN, 0], [1, 1, 1, 1])).toEqual([false, false, false, true]);
  });

  it('ta.dev / ta.cci: running-sum mean, newest-first absolute deviations', () => {
    expect(ta.dev(close, 5).slice(4, 10)).toEqual([
      0.25519999999999926, 0.3831999999999994, 0.6959999999999997, 1.1039999999999999, 1.2591999999999994,
      0.9039999999999996,
    ]);
    expect(ta.cci(close, 20).slice(18)).toEqual([N, -110.5765375671558, -100.05527915975674]);
  });

  it('ta.accdist: ((close - low) - (high - close)) / (high - low) * volume', () => {
    // BTCUSD bar 39: close == high, so the multiplier is exactly 1 (the form 2 * close - low - high is not)
    expect(ta.accdist([4.1], [3.98], [4.1], [78.08])).toEqual([78.08]);
    // a flat bar (na multiplier) and an na volume add nothing
    expect(ta.accdist([2, 3, 3], [1, 3, 1], [2, 3, 3], [5, 7, NaN])).toEqual([5, 5, 5]);
  });

  it('ta.rma: the seed is the running-sum ta.sma', () => {
    // d3 = bar_index % 7 == 0 ? 0.1 : bar_index % 7 == 1 ? 0.2 : 0.3
    const d3 = [0.1, 0.2, 0.3, 0.3, 0.3, 0.3, 0.3, 0.1, 0.2];
    expect(ta.rma(d3, 3)).toEqual([
      N, N, 0.19999999999999998, 0.2333333333333333, 0.25555555555555554, 0.27037037037037037, 0.28024691358024695,
      0.22016460905349797, 0.21344307270233198,
    ]);
  });

  it('ta.swma: (source + 2 * source[1] + 2 * source[2] + source[3]) / 6', () => {
    expect(ta.swma(close).slice(0, 8)).toEqual([
      N, N, N, 11.563333333333333, 11.698333333333332, 11.5, 11.016666666666666, 10.116666666666667,
    ]);
  });

  it('ta.wpr: 100 * (close - max) / (max - min)', () => {
    expect(ta.wpr(high, low, close, 14).slice(12, 17)).toEqual([
      N, -67.42424242424242, -89.0909090909091, -95.65891472868216, -98.0597014925373,
    ]);
  });

  it('ta.mfi: running-sum residue is 0; an na source bar keeps the result', () => {
    const hlc3 = close.map((c, i) => (high[i]! + low[i]! + c) / 3);
    expect(ta.mfi(hlc3, 3, volume).slice(0, 17)).toEqual([
      N, N, 84.27453719357314, 100, 100, 0, 0, 0, 0, 36.29430318926435, 36.508975366359, 80.3428886651695,
      13.969684548152856, 10.383147649173921, 6.065293202256683, 0, 0,
    ]);
    const rn = close.map((c, i) => (i % 9 === 2 ? NaN : c));
    expect(ta.mfi(rn, 3, volume).slice(0, 17)).toEqual([
      N, N, N, 81.98950524083861, 95.92197885294463, 3.7392295756763474, 0, 0, 98.61417613208681, 99.61320786828026,
      100, 100, 96.6493607242322, 26.346287556690754, 5.663631554097421, 0, 0,
    ]);
  });

  it('ta.vwap: na before the first anchor; an na source makes it na until the next anchor', () => {
    const rn = close.map((c, i) => (i % 9 === 2 ? NaN : c));
    const anchor = close.map((_, i) => i % 30 === 5);
    expect(ta.vwap(rn, volume, anchor).slice(0, 13)).toEqual([
      N, N, N, N, N, 10.5, 10.340880503184684, 9.815609756231101, 8.262091961489203, 8.460262586501585,
      8.460608288732985, N, N,
    ]);
  });
});
