/**
 * request.security for the chart symbol (issue #101). The mapping rules follow PineScript
 * (security-check/doc/README.md: 117,203 mapped values and 23,429 period times equal to PineScript's).
 */
import {
  barmerge,
  close,
  executeScript,
  request,
  syminfo,
  ta,
  ticker,
  time,
  timeframe,
  type ChartContext,
} from '../../src/script';
import type { Bar } from '../../src/types';

// Two trading days of 60-minute bars, 09:30 to 15:30 New York (EDT: UTC-4), closes 1..14
const hours = [9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5];
const BARS: Bar[] = [1, 2].flatMap((d, k) =>
  hours.map((h, j) => {
    const c = k * 7 + j + 1;
    return {
      time: Date.UTC(2026, 8, d + 28, Math.floor(h) + 4, (h % 1) * 60) / 1000, // 29/09 and 30/09
      open: c - 0.5, high: c + 1, low: c - 1, close: c, volume: 10,
    };
  })
);
const CHART: ChartContext = { tickerid: 'NASDAQ:AAPL', timeframe: '60', timezone: 'America/New_York', session: '0930-1600' };

function run<T>(fn: () => T, chart: ChartContext = CHART, bars: Bar[] = BARS): T {
  let out: T | undefined;
  executeScript(() => {
    out = fn();
  }, bars, {}, chart);
  return out as T;
}

const nan = NaN;

describe('request.security', () => {
  it('lookahead off shows a day from the bar that completes it', () => {
    const v = run(() => request.security(syminfo.tickerid, 'D', () => close).toArray());
    expect(v).toEqual([nan, nan, nan, nan, nan, nan, 7, 7, 7, 7, 7, 7, 7, 14]);
  });

  it('lookahead on shows the day on all its bars; gaps keep one bar per day', () => {
    const [on, gaps, gapsOn] = run(() => [
      request.security(syminfo.tickerid, 'D', () => close, barmerge.gaps_off, barmerge.lookahead_on).toArray(),
      request.security(syminfo.tickerid, 'D', () => close, barmerge.gaps_on).toArray(),
      request.security(syminfo.tickerid, 'D', () => close, barmerge.gaps_on, barmerge.lookahead_on).toArray(),
    ]);
    expect(on).toEqual([...Array(7).fill(7), ...Array(7).fill(14)]);
    expect(gaps).toEqual([nan, nan, nan, nan, nan, nan, 7, nan, nan, nan, nan, nan, nan, 14]);
    expect(gapsOn).toEqual([7, nan, nan, nan, nan, nan, nan, 14, nan, nan, nan, nan, nan, nan]);
  });

  it('the expression runs on the daily bars: time, ta.*, tuples, offsets and timeframe.period', () => {
    const [[change, zero, closeA, closeB], t, tf, prev] = run(() => [
      request.security('', 'D', () => [ta.change(close), close.sub(close.offset(0)), close, close], barmerge.gaps_off, barmerge.lookahead_on)
        .map((x) => x.toArray()[13]),
      request.security('', 'D', () => time, barmerge.gaps_off, barmerge.lookahead_on).toArray()[13],
      request.security('', 'D', () => (timeframe.period === '1D' ? 1 : 0)).toArray()[6],
      request.security('', 'D', () => close.offset(1), barmerge.gaps_off, barmerge.lookahead_on).toArray()[13],
    ]);
    expect([change, zero, closeA, closeB]).toEqual([7, 0, 14, 14]); // tuple; change of the daily close: 14 - 7
    expect(t).toBe(Date.UTC(2026, 8, 30, 13, 30)); // daily bar time: session start 09:30
    expect(tf).toBe(1);
    expect(prev).toBe(7); // close[1] with lookahead on: previous day
  });

  it('same timeframe returns the expression on the chart bars; Heikin Ashi bars are computed', () => {
    const [same, ha] = run(() => [
      request.security(syminfo.tickerid, timeframe.period, () => close).toArray(),
      request.security(ticker.heikinashi(syminfo.tickerid), timeframe.period, () => close).toArray(),
    ]);
    expect(same).toEqual(BARS.map((b) => b.close));
    expect(ha[0]).toBe((BARS[0]!.open + BARS[0]!.high + BARS[0]!.low + BARS[0]!.close) / 4);
  });

  it('throws for other symbols and lower timeframes', () => {
    expect(() => run(() => request.security('NASDAQ:MSFT', 'D', () => close))).toThrow('external data');
    expect(() => run(() => request.security('', '5', () => close))).toThrow('lower than the chart timeframe');
    expect(() => run(() => syminfo.tickerid, { timeframe: '60' })).toThrow('chart symbol is not known');
  });
});
