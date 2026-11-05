/**
 * Session calendar (#167): a session with sections and the "F" marker, a bar after an early close, and
 * session.isfirstbar on the first loaded bar. The expected values are PineScript results on 60-minute bars.
 */
import { executeScript, session, time, time_close, time_tradingday, timeframe, type ChartContext } from '../../src/script';
import { periodTime } from '../../src/session/context';
import { SessionBars } from '../../src/session/bars';
import { TradingCalendar, addDays, weekdayOf } from '../../src/session/calendar';
import type { Bar } from '../../src/types';

const NY = 'America/New_York';
const bar = (iso: string): Bar => ({ time: Date.parse(iso) / 1000, open: 1, high: 2, low: 0, close: 1, volume: 1 });

function run<T>(bars: Bar[], chart: ChartContext, fn: () => T): T {
  let out: T | undefined;
  executeScript(() => {
    out = fn();
  }, bars, {}, chart);
  return out as T;
}

describe('a session with sections and the "F" marker', () => {
  // the dollar index: Monday opens on Sunday 17:00, the other days at 19:00 of the day before
  const calendar = new TradingCalendar(NY, { session: '1900-1900:3456|1700F-1900:2' });

  it('"1700F-1900:2": Monday runs from Sunday 17:00 to Monday 19:00', () => {
    expect(calendar.periods(20261005)).toEqual([[Date.parse('2026-10-04T21:00Z'), Date.parse('2026-10-05T23:00Z')]]);
  });

  it('"1900-1900:3456": Tuesday to Friday run from 19:00 of the day before', () => {
    expect(calendar.periods(20261006)).toEqual([[Date.parse('2026-10-05T23:00Z'), Date.parse('2026-10-06T23:00Z')]]);
    expect(calendar.periods(20261003)).toEqual([]); // Saturday
    expect(calendar.periods(20261004)).toEqual([]); // Sunday
  });

  it('time("D") and time_tradingday of a script (PineScript values)', () => {
    const chart: ChartContext = { timeframe: '60', timezone: NY, session: '1900-1900:3456|1700F-1900:2' };
    const bars = ['2026-10-04T22:00Z', '2026-10-05T22:00Z', '2026-10-05T23:00Z'].map(bar); // Sunday 18:00, Monday 18:00, Monday 19:00
    const [d, c, day] = run(bars, chart, () => [time('D').toArray(), time_close('D').toArray(), time_tradingday.toArray()]);
    expect(d).toEqual([Date.parse('2026-10-04T21:00Z'), Date.parse('2026-10-04T21:00Z'), Date.parse('2026-10-05T23:00Z')]);
    expect(c).toEqual([Date.parse('2026-10-05T23:00Z'), Date.parse('2026-10-05T23:00Z'), Date.parse('2026-10-06T23:00Z')]);
    expect(day).toEqual([Date.UTC(2026, 9, 5), Date.UTC(2026, 9, 5), Date.UTC(2026, 9, 6)]);
  });
});

describe('a bar that opens after an early close', () => {
  // Friday 29/11/2019 closes at 13:00; the data has a bar at 13:30
  const chart: ChartContext = { timeframe: '60', timezone: NY, session: { session: '0930-1600', corrections: '0930-1300:20191129' } };
  const bars = ['2019-11-27T20:30Z', '2019-11-29T14:30Z', '2019-11-29T17:30Z', '2019-11-29T18:30Z', '2019-12-02T14:30Z', '2019-12-02T15:30Z'].map(bar);

  it('time("D"), time_close("D") and time_tradingday are na on it; time("W") keeps its value', () => {
    const [d, c, day, w] = run(bars, chart, () => [time('D').toArray(), time_close('D').toArray(), time_tradingday.toArray(), time('W').toArray()]);
    expect(d[2]).toBe(Date.parse('2019-11-29T14:30Z'));
    expect(d[3]).toBeNaN();
    expect(c[3]).toBeNaN();
    expect(day[3]).toBeNaN();
    expect(w[3]).toBe(Date.parse('2019-11-25T14:30Z'));
  });

  it('timeframe.change("D") is false on it and on the next bar; timeframe.change("W") is true on the next bar', () => {
    const [d, w] = run(bars, chart, () => [timeframe.change('D').toArray(), timeframe.change('W').toArray()]);
    expect(d).toEqual([0, 1, 0, 0, 0, 0]);
    expect(w).toEqual([0, 0, 0, 0, 1, 0]);
  });

  it('it is in the market hours and is no last bar', () => {
    const [market, last] = run(bars, chart, () => [session.ismarket.toArray(), session.islastbar.toArray()]);
    expect(market[3]).toBe(1);
    expect(last.slice(2, 4)).toEqual([1, 0]); // the 12:30 bar closes the session
  });
});

describe('session.isfirstbar on the first loaded bar', () => {
  const chart: ChartContext = { timeframe: '60', timezone: NY, session: '0930-1600' };

  it('false when the data starts in the middle of a session', () => {
    const bars = ['2026-09-04T18:30Z', '2026-09-04T19:30Z', '2026-09-08T13:30Z'].map(bar); // 14:30, 15:30, next day 09:30
    expect(run(bars, chart, () => [session.isfirstbar.toArray(), session.isfirstbar_regular.toArray()])).toEqual([[0, 0, 1], [0, 0, 1]]);
  });

  it('true when the data starts with the first bar of a session', () => {
    const bars = ['2026-09-04T13:30Z', '2026-09-04T14:30Z'].map(bar);
    expect(run(bars, chart, () => session.isfirstbar.toArray())).toEqual([1, 0]);
  });
});

describe('trading days counted without Date objects (#198)', () => {
  // the Date reading the calendar used before: years 0-99 are 1900-1999 there, months roll over
  const utcOf = (date: number): number => Date.UTC(Math.floor(date / 10000), Math.floor(date / 100) % 100 - 1, date % 100);
  const fromUtc = (ms: number): number => {
    const d = new Date(ms);
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  };

  it('addDays and weekdayOf give the Date results, odd dates included', () => {
    const dates: number[] = [];
    for (let date = 18000101; date < 22000101; date = fromUtc(utcOf(date) + 37 * 86_400_000)) dates.push(date);
    dates.push(10101, 991231, 1000101, 15821004, 15821015, 20240230, 20241301, 20240000, 20240099, 2757600913, -10101, NaN);
    for (const n of [0, 1, -1, 7, 400, -400, 100_000_000]) {
      expect(dates.map((d) => addDays(d, n))).toEqual(dates.map((d) => fromUtc(utcOf(d) + n * 86_400_000)));
    }
    expect(dates.map(weekdayOf)).toEqual(dates.map((d) => new Date(utcOf(d)).getUTCDay() + 1));
  });

  it('a time located again, and calendars shared by timeframes and charts, give the periods of fresh calendars', () => {
    const times = Array.from({ length: 400 }, (_, i) => Date.UTC(2024, 1, 20) + i * 3 * 3_600_000);
    const S = '2000-0400:1234567';
    const fresh = () => new SessionBars(new TradingCalendar('Europe/London', { session: S }, 'pine', true), '60');
    const expected = times.map((t) => [fresh().inside(t) ? fresh().timeOf(t, 'D') : NaN, fresh().timeOf(t, 'W')]);
    // two chart contexts, "D" and "W" read in turn: one calendar of the session in London serves them all
    const charts = [0, 1].map(() => ({ timeframe: '60', timezone: NY, session: '0930-1600', timeUnit: 'ms' as const }));
    expect(times.map((t, i) => [periodTime(t, 'D', charts[i % 2]!, S, 'Europe/London'), periodTime(t, 'W', charts[(i + 1) % 2]!, S, 'Europe/London')])).toEqual(expected);
    const one = new TradingCalendar(NY, { session: '1700-1600' });
    const again = (t: number) => [t, t + 3_600_000, t, t].map((x) => one.locate(x));
    expect(times.map(again)).toEqual(times.map((t) => [t, t + 3_600_000, t, t].map((x) => new TradingCalendar(NY, { session: '1700-1600' }).locate(x))));
  });
});
