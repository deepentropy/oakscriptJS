/**
 * The session of a chart context without a script run (#165): the same values as the script API, the periods of
 * request.security, and the bars after the last bar on the trading calendar.
 */
import {
  barTimeAfter,
  barsUntil,
  chartSessionFlags,
  mapToChart,
  periodClose,
  periodTime,
  resampleSession,
  tradingDayTime,
  type SessionContext,
} from '../../src';
import { close, executeScript, request, session, time, time_close, time_tradingday } from '../../src/script';
import type { Bar } from '../../src/types';

const NY = 'America/New_York';
const at = (iso: string): number => Date.parse(iso) / 1000;
const bar = (iso: string, c = 1): Bar => ({ time: at(iso), open: c, high: c + 1, low: c - 1, close: c, volume: 1 });

// 60-minute bars: Thursday 03/09/2026, Friday 04/09, then Tuesday 08/09 (Monday 07/09 is a holiday)
const hours = [13.5, 14.5, 15.5, 16.5, 17.5, 18.5, 19.5];
const BARS: Bar[] = [3, 4, 8].flatMap((d, k) =>
  hours.map((h, i) => bar(`2026-09-0${d}T${String(Math.floor(h)).padStart(2, '0')}:30Z`, 100 + k * 10 + i))
);
const AAPL: SessionContext = { timeframe: '60', timezone: NY, session: { session: '0930-1600', holidays: '20260907' } };

describe('session values of a chart context (#165)', () => {
  it('periodTime, periodClose, tradingDayTime and the flags equal the script API', () => {
    let script: number[][] = [];
    executeScript(() => {
      script = [time('D'), time_close('D'), time('W'), time_tradingday, session.isfirstbar, session.islastbar].map((s) => s.toArray());
    }, BARS, {}, AAPL);
    const flags = chartSessionFlags(BARS.map((b) => b.time as number), AAPL);
    expect(BARS.map((b) => periodTime(b.time as number, 'D', AAPL))).toEqual(script[0]);
    expect(BARS.map((b) => periodClose(b.time as number, 'D', AAPL))).toEqual(script[1]);
    expect(BARS.map((b) => periodTime(b.time as number, 'W', AAPL))).toEqual(script[2]);
    expect(BARS.map((b) => tradingDayTime(b.time as number, AAPL))).toEqual(script[3]);
    expect(flags.isfirstbar.map(Number)).toEqual(script[4]);
    expect(flags.islastbar.map(Number)).toEqual(script[5]);
    // the week of the holiday starts on Tuesday
    expect(periodTime(at('2026-09-08T15:30Z'), 'W', AAPL)).toBe(Date.parse('2026-09-08T13:30Z'));
  });

  it('resampleSession gives the daily bars and request.security values of the script API', () => {
    const daily = resampleSession(BARS, 'D', AAPL);
    expect(daily.bars.map((b) => [b.time, b.open, b.close])).toEqual([
      [at('2026-09-03T13:30Z'), 100, 106], [at('2026-09-04T13:30Z'), 110, 116], [at('2026-09-08T13:30Z'), 120, 126],
    ]);
    const closes = mapToChart(daily.bars.map((b) => b.close), daily.group, daily.latest, false, false);
    let script: number[] = [];
    executeScript(() => {
      script = request.security('', 'D', () => close).toArray();
    }, BARS, {}, { ...AAPL, tickerid: 'X' });
    expect(closes).toEqual(script);
    expect(() => resampleSession(BARS, '15', AAPL)).toThrow('lower than the chart timeframe');
  });

  it('a context without timeframe, time zone or session throws', () => {
    expect(() => periodTime(BARS[0]!.time as number, 'D', { timeframe: '60' })).toThrow('needs timeframe, timezone and session');
  });
});

describe('bars after a bar on the trading calendar (#165)', () => {
  it('barTimeAfter skips the closed hours, the weekend and the holiday', () => {
    const friday1530 = at('2026-09-04T19:30Z');
    expect(barTimeAfter(friday1530, 0, AAPL)).toBe(friday1530);
    // the next bar after Friday 15:30 is Tuesday 09:30 (weekend, then the Monday holiday)
    expect(barTimeAfter(friday1530, 1, AAPL)).toBe(at('2026-09-08T13:30Z'));
    expect(barTimeAfter(friday1530, 8, AAPL)).toBe(at('2026-09-09T13:30Z'));
    // inside a session: the next hour
    expect(barTimeAfter(at('2026-09-04T13:30Z'), 2, AAPL)).toBe(at('2026-09-04T15:30Z'));
  });

  it('on a daily chart the next bar is the next trading day', () => {
    const daily: SessionContext = { ...AAPL, timeframe: '1D' };
    expect(barTimeAfter(at('2026-09-04T13:30Z'), 1, daily)).toBe(at('2026-09-08T13:30Z'));
    expect(barTimeAfter(at('2026-09-04T13:30Z'), 3, daily)).toBe(at('2026-09-10T13:30Z'));
  });

  it('barsUntil counts the bars to the bar of a later time', () => {
    const friday1530 = at('2026-09-04T19:30Z');
    expect(barsUntil(friday1530, friday1530 + 600, AAPL)).toBe(0); // the same bar
    // Friday 15:30 + 3 days is Monday (a holiday): the chart shows it on the bar of Friday
    expect(barsUntil(friday1530, friday1530 + 3 * 86400, AAPL)).toBe(0);
    // + 4 days is Tuesday 15:30: 7 bars later
    expect(barsUntil(friday1530, friday1530 + 4 * 86400, AAPL)).toBe(7);
  });
});
