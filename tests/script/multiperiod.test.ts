/**
 * Timeframes with a multiplier above one day ("3D", "2W", "5M"...). PineScript rules:
 * periods restart each calendar year; "nD" groups n trading days, "nW" n weeks
 * from the first week whose Monday is in the year, "nM" n months from January.
 */
import { close, executeScript, request, time, time_close, time_tradingday, timeframe, type ChartContext } from '../../src/script';
import type { Bar } from '../../src/types';

const SESSION = { session: '0930-1600', holidays: '20251225,20260101' };
const chart = (tf: string): ChartContext => ({ tickerid: 'NASDAQ:AAPL', timeframe: tf, timezone: 'America/New_York', session: SESSION });

// 09:30 New York (EST, UTC-5) of a date, in ms
const open = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 14, 30);
const end = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 21, 0);
const daily = (dates: Array<[number, number, number]>): Bar[] =>
  dates.map(([y, m, d], k) => ({ time: open(y, m, d) / 1000, open: k + 1, high: k + 1, low: k + 1, close: k + 1, volume: 1 }));

// trading days around the year change (25/12 and 01/01 are holidays)
const DAYS: Array<[number, number, number]> = [
  [2025, 12, 22], [2025, 12, 23], [2025, 12, 24], [2025, 12, 26], [2025, 12, 29], [2025, 12, 30], [2025, 12, 31],
  [2026, 1, 2], [2026, 1, 5], [2026, 1, 6], [2026, 1, 7], [2026, 1, 8], [2026, 1, 9],
];

function run<T>(fn: () => T, tf: string, bars: Bar[]): T {
  let out: T | undefined;
  executeScript(() => {
    out = fn();
  }, bars, {}, chart(tf));
  return out as T;
}

describe('multi-period timeframes', () => {
  it('"3D" groups 3 trading days and restarts on the first trading day of the year', () => {
    const [t, c] = run(() => [time('3D').toArray(), time_close('3D').toArray()], '1D', daily(DAYS));
    // 2025 has 260 trading days here (261 weekdays, 25/12 off): the last group is 30/12 to 31/12
    expect(t.slice(2, 7)).toEqual([open(2025, 12, 24), open(2025, 12, 24), open(2025, 12, 24), open(2025, 12, 30), open(2025, 12, 30)]);
    expect(t.slice(7)).toEqual([open(2026, 1, 2), open(2026, 1, 2), open(2026, 1, 2), open(2026, 1, 7), open(2026, 1, 7), open(2026, 1, 7)]);
    expect([c[2], c[5], c[7]]).toEqual([end(2025, 12, 29), end(2025, 12, 31), end(2026, 1, 6)]);
  });

  it('"2W" counts weeks from the first Monday of the year: 02/01/2026 is still in 2025', () => {
    const t = run(() => time('2W').toArray(), '1D', daily(DAYS));
    expect(t.slice(5, 9)).toEqual([open(2025, 12, 22), open(2025, 12, 22), open(2025, 12, 22), open(2026, 1, 5)]);
  });

  it('"5M" groups months from January (January-May, June-October, November-December)', () => {
    const t = run(() => time('5M').toArray(), '1D', daily(DAYS));
    expect([t[6], t[7]]).toEqual([open(2025, 11, 3), open(2026, 1, 2)]);
  });

  it('on intraday charts the "3D" close is the start of the next period', () => {
    const bars = [{ time: Date.UTC(2026, 0, 2, 15, 30) / 1000, open: 1, high: 1, low: 1, close: 1, volume: 1 }];
    const [c, change] = run(() => [time_close('3D').toArray()[0], timeframe.change('3D').toArray()[0]], '60', bars);
    expect(c).toBe(open(2026, 1, 7));
    expect(change).toBe(0);
  });

  it('on a "3D" chart, time_tradingday is the last trading day of the bar', () => {
    const bars = daily([[2026, 1, 2], [2026, 1, 7]]);
    const [t, ttd, mult] = run(() => [time_close.toArray(), time_tradingday.toArray(), timeframe.multiplier], '3D', bars);
    expect(t).toEqual([end(2026, 1, 6), end(2026, 1, 9)]);
    expect(ttd).toEqual([Date.UTC(2026, 0, 6), Date.UTC(2026, 0, 9)]);
    expect(mult).toBe(3);
  });

  it('request.security: a period whose last bar is missing completes on the next period', () => {
    // "2D" periods of 2026: 02/01-05/01, 06/01-07/01, 08/01-09/01; the 07/01 bar is missing
    const bars = daily([[2026, 1, 2], [2026, 1, 5], [2026, 1, 6], [2026, 1, 8], [2026, 1, 9]]);
    const v = run(() => request.security('', '2D', () => close).toArray(), '1D', bars);
    expect(v).toEqual([NaN, 2, 2, 3, 5]);
  });
});
