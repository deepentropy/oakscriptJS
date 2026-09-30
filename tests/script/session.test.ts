/**
 * Session values of the script API (issue #100, step 2). The expected values follow the PineScript rules.
 */
import {
  executeScript,
  plot,
  session,
  ta,
  close,
  time,
  time_close,
  time_tradingday,
  timeframe,
  type ChartContext,
} from '../../src/script';
import type { Bar } from '../../src/types';

const NY = 'America/New_York';
/** Bar at a New York wall-clock time (EDT in September 2026: UTC-4), time in seconds. */
const nyBar = (day: number, hour: number, minute = 0, c = 100): Bar => ({
  time: Date.UTC(2026, 8, day, hour + 4, minute) / 1000,
  open: c, high: c + 1, low: c - 1, close: c, volume: 10,
});
const ms = (day: number, hour: number, minute = 0) => Date.UTC(2026, 8, day, hour + 4, minute);

function run<T>(bars: Bar[], chart: ChartContext, fn: () => T): T {
  let out: T | undefined;
  executeScript(() => {
    out = fn();
  }, bars, {}, chart);
  return out as T;
}

// 60-minute regular bars around Labor Day (Monday 07/09/2026)
const hours = [9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5];
const days = [4, 8, 9]; // Friday, Tuesday, Wednesday
const BARS = days.flatMap((d) => hours.map((h) => nyBar(d, Math.floor(h), (h % 1) * 60)));
const AAPL: ChartContext = {
  timeframe: '60',
  timezone: NY,
  session: { session: '0930-1600', holidays: '20260907' },
};

describe('time and time_close', () => {
  it('time is a Series of bar times in ms and can be called', () => {
    const [t, d, w, t240] = run(BARS, AAPL, () => [time.toArray(), time('D').toArray(), time('W').toArray(), time('240').toArray()]);
    expect(t[7]).toBe(ms(8, 9, 30));
    expect(d[13]).toBe(ms(8, 9, 30)); // Tuesday 15:30 bar: day start 09:30
    expect(w[7]).toBe(ms(8, 9, 30)); // week with a Monday holiday starts on Tuesday
    expect(w[0]).toBe(Date.UTC(2026, 7, 31, 13, 30)); // Friday 04/09: week of Monday 31/08
    expect(t240.slice(0, 7)).toEqual([...Array(4).fill(ms(4, 9, 30)), ...Array(3).fill(ms(4, 13, 30))]);
  });

  it('time_close cuts at the session end; the weekly close is the next week start on intraday charts', () => {
    const [tc, tcD, tcW] = run(BARS, AAPL, () => [time_close.toArray(), time_close('D').toArray(), time_close('W').toArray()]);
    expect(tc[6]).toBe(ms(4, 16)); // 15:30 bar closes at 16:00
    expect(tc[5]).toBe(ms(4, 15, 30));
    expect(tcD[0]).toBe(ms(4, 16));
    expect(tcW[0]).toBe(ms(8, 9, 30)); // next week starts on Tuesday 08/09
  });

  it('time with an explicit session is na outside it', () => {
    const t = run(BARS, AAPL, () => time('60', '1000-1200').toArray());
    expect(Number.isNaN(t[0]!)).toBe(true); // 09:30 bar
    // periods align on the explicit session start (10:00), as in PineScript (time("60", "0930-1600") on bars
    // at :00 gives the bar time - 30 minutes)
    expect(t[1]).toBe(ms(4, 10));
  });

  it('time_tradingday is 00:00 UTC of the trading day', () => {
    expect(run(BARS, AAPL, () => time_tradingday.toArray())[7]).toBe(Date.UTC(2026, 8, 8));
  });

  it('can be plotted like any Series', () => {
    const r = executeScript(() => plot(time, 't'), BARS, {}, AAPL);
    expect(r.result.plots['plot0']![0]!.value).toBe(ms(4, 9, 30));
  });
});

describe('timeframe.change and ta.vwap default anchor', () => {
  it('is 0 on the first bar and 1 on the first bar of each new period', () => {
    const [d, w] = run(BARS, AAPL, () => [timeframe.change('D').toArray(), timeframe.change('W').toArray()]);
    expect(d.slice(0, 8)).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    expect(w[7]).toBe(1);
    expect(w[14]).toBe(0);
  });

  it('ta.vwap restarts on each trading day', () => {
    const v = run(BARS, AAPL, () => ta.vwap(close).toArray());
    expect(v[7]).toBe(BARS[7]!.close);
  });
});

describe('session.* with extended hours', () => {
  const EXT: ChartContext = {
    timeframe: '60',
    timezone: NY,
    sessionType: 'extended',
    session: { session: '0400-2000' },
    regularSession: { session: '0930-1600' },
  };
  const ext = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((h) => nyBar(8, h));

  it('uses the bar open against the regular hours of the same trading day', () => {
    const f = run(ext, EXT, () => ({
      first: session.isfirstbar.toArray(), last: session.islastbar.toArray(), market: session.ismarket.toArray(),
      pre: session.ispremarket.toArray(), post: session.ispostmarket.toArray(),
      firstR: session.isfirstbar_regular.toArray(), lastR: session.islastbar_regular.toArray(),
    }));
    // 09:00 is premarket (opens before 09:30), 10:00 is the first regular bar, 15:00 the last one
    expect(f.pre.slice(0, 6)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(f.firstR[6]).toBe(1);
    expect(f.market.slice(6, 12)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(f.lastR[11]).toBe(1);
    expect(f.post.slice(12)).toEqual([1, 1, 1, 1]);
    expect([f.first[0], f.last[15]]).toEqual([1, 1]);
  });
});

describe('overnight sessions', () => {
  it('a session that opens at 17:00 belongs to the next trading day', () => {
    const ES: ChartContext = { timeframe: '60', timezone: 'America/Chicago', session: '1700-1600' };
    const bars = [17, 18].map((h) => ({ ...nyBar(8, h - 1), time: Date.UTC(2026, 8, 8, h + 5) / 1000 })); // Tue 17:00, 18:00 CT
    const [d, ttd] = run(bars, ES, () => [time('D').toArray(), time_tradingday.toArray()]);
    expect(d[0]).toBe(Date.UTC(2026, 8, 8, 22)); // 17:00 CT = 22:00 UTC
    expect(ttd[0]).toBe(Date.UTC(2026, 8, 9)); // Wednesday
  });

  it('throws when the session is not given', () => {
    expect(() => run(BARS, { timeframe: '60', timezone: NY }, () => time('D'))).toThrow('session is not known');
  });
});
