/**
 * A length of 0 or less stops the script (PineScript runtime error RE10001, #175). Each message is the PineScript
 * text of the same call: "Invalid value of the 'length' argument (0.0) in the 'sma' function. It must be > 0.",
 * with the bar of the call and the function path PineScript names.
 */
import { math, taCore, ta as seriesTa, Series } from '../../src';
import { close, executeScript, ta } from '../../src/script';
import type { Bar } from '../../src/types';

const s = [10, 11, 12, 11, 13, 14, 12, 15, 16, 15];
const v = s.map((x) => x * 100);
const msg = (fn: string, value: number, bar = 0, arg = 'length') =>
  `Error on bar ${bar}: Invalid value of the '${arg}' argument (${value.toFixed(1)}) in the ${fn} function. It must be > 0.`;

// [PineScript name in the message, call with the length L]
const calls: Array<[string, (L: number) => unknown]> = [
  ["'highest'", (L) => taCore.highest(s, L)],
  ["'lowest'", (L) => taCore.lowest(s, L)],
  ["'highestbars'", (L) => taCore.highestbars(s, L)],
  ["'lowestbars'", (L) => taCore.lowestbars(s, L)],
  ["'sma'", (L) => taCore.sma(s, L)],
  ["'ema'", (L) => taCore.ema(s, L)],
  ["'rma'", (L) => taCore.rma(s, L)],
  ["'wma'", (L) => taCore.wma(s, L)],
  ["'hma'", (L) => taCore.hma(s, L)],
  ["'sum'", (L) => math.sum(s, L)],
  ["'stdev'->'variance'", (L) => taCore.stdev(s, L)],
  ["'variance'", (L) => taCore.variance(s, L)],
  ["'linreg'", (L) => taCore.linreg(s, L, 0)],
  ["'mom'", (L) => taCore.mom(s, L)],
  ["'change'", (L) => taCore.change(s, L)],
  ["'roc'", (L) => taCore.roc(s, L)],
  ["'atr'->'rma'", (L) => taCore.atr(L, s, s, s)],
  ["'dev'", (L) => taCore.dev(s, L)],
  ["'median'", (L) => taCore.median(s, L)],
  ["'percentrank'", (L) => taCore.percentrank(s, L)],
  ["'cci'", (L) => taCore.cci(s, L)],
  ["'mfi'", (L) => taCore.mfi(s, L, v)],
  ["'cmo'", (L) => taCore.cmo(s, L)],
  ["'vwma'->'sma'", (L) => taCore.vwma(s, L, v)],
  ["'alma'", (L) => taCore.alma(s, L, 0.85, 6)],
  ["'stoch'->'highest'", (L) => taCore.stoch(s, s, s, L)],
  ["'correlation'", (L) => taCore.correlation(s, v, L)],
  ["'rising'", (L) => taCore.rising(s, L)],
  ["'falling'", (L) => taCore.falling(s, L)],
  ["'mode'", (L) => taCore.mode(s, L)],
  ["'range'", (L) => taCore.range(s, L)],
  ["'percentile_nearest_rank'", (L) => taCore.percentile_nearest_rank(s, L, 50)],
  ["'percentile_linear_interpolation'", (L) => taCore.percentile_linear_interpolation(s, L, 50)],
  ["'rci'", (L) => taCore.rci(s, L)],
  ["'wpr'", (L) => taCore.wpr(s, s, s, L)],
  ["'cog'", (L) => taCore.cog(s, L)],
  ["'bbw'", (L) => taCore.bbw(s, L, 2)],
  ["'bb'", (L) => taCore.bb(s, L, 2)],
  ["'kc'", (L) => taCore.kc(s, L, 2, true, s, s, s)],
  ["'tsi'->'ema'", (L) => taCore.tsi(s, L, 5)],
];

describe('a length of 0 or less stops the script (RE10001, #175)', () => {
  it.each(calls)('%s: 0 and -1 throw on bar 0', (fn, call) => {
    expect(() => call(0)).toThrow(msg(fn, 0));
    expect(() => call(-1)).toThrow(msg(fn, -1));
    expect(() => call(fn === "'hma'" ? 2 : 1)).not.toThrow(); // hma(1) is the inner wma error below
  });

  it('ta.rsi names its length argument y', () => {
    expect(() => taCore.rsi(s, 0)).toThrow(msg("'rsi'", 0, 0, 'y'));
  });

  it('ta.hma(src, 1) stops in its inner wma(src, 0)', () => {
    expect(() => taCore.hma(s, 1)).toThrow(msg("'wma'", 0));
  });

  it('a series length stops on the bar where it reaches 0', () => {
    const L = s.map((_, i) => (i >= 6 ? 0 : 3));
    expect(() => taCore.highest(s, L)).toThrow(msg("'highest'", 0, 6));
    expect(() => taCore.sma(s, L)).toThrow(msg("'sma'", 0, 6));
    expect(() => taCore.wma(s, L)).toThrow(msg("'wma'", 0, 6));
    expect(() => taCore.stdev(s, L)).toThrow(msg("'stdev'->'variance'", 0, 6));
  });

  it('the Series and script APIs throw the same errors', () => {
    expect(() => seriesTa.sma(Series.fromArray([], s), 0)).toThrow(msg("'sma'", 0));
    const bars: Bar[] = s.map((x, i) => ({ time: 1_000_000 + i * 60, open: x, high: x, low: x, close: x, volume: 1 }));
    expect(() => executeScript(() => { ta.highest(close, 0); }, bars)).toThrow(msg("'highest'", 0));
    expect(() => executeScript(() => { ta.hma(close, 1); }, bars)).toThrow(msg("'wma'", 0));
  });
});
