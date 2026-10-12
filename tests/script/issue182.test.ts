/**
 * #182: tables per position and pane, two-series rsi at x = -y, time("D", session) between two runs of a session, and
 * time(tf, session, timezone) for code without a script run. Each expected value is the PineScript result of the same
 * calls (BITSTAMP:BTCUSD 1D and 60).
 */
import { math, na, nz, periodClose, periodTime, resetDrawings, table, taCore } from '../../src';
import { executeScript, time, time_close } from '../../src/script';
import type { Bar } from '../../src/types';

afterEach(() => resetDrawings());

describe('table: one live table per position and pane', () => {
  it('a table with force_overlay and one without keep the same position', () => {
    const sizes: number[] = [];
    const a = table.new('bottom_right', 1, 1);
    sizes.push(table.all().length);
    const b = table.new('bottom_right', 1, 1, undefined, undefined, undefined, undefined, undefined, true);
    sizes.push(table.all().length);
    const c = table.new('bottom_right', 1, 1);
    sizes.push(table.all().length);
    const d = table.new('bottom_right', 1, 1, undefined, undefined, undefined, undefined, undefined, true);
    sizes.push(table.all().length);
    const e = table.new('top_left', 1, 1, undefined, undefined, undefined, undefined, undefined, true);
    sizes.push(table.all().length);
    expect(sizes).toEqual([1, 2, 2, 2, 3]);
    expect(table.all()).toEqual([c, d, e]);
    expect([na(a), na(b)]).toEqual([true, true]);
  });

  it('table.set_position onto a used position deletes the table there (same force_overlay only)', () => {
    const a = table.new('bottom_right', 1, 1);
    const b = table.new('top_left', 1, 1);
    const c = table.new('top_left', 1, 1, undefined, undefined, undefined, undefined, undefined, true);
    expect(table.all()).toHaveLength(3);
    table.set_position(b, 'bottom_right');
    expect(table.all()).toEqual([b, c]);
    expect(na(a)).toBe(true);
    table.set_position(c, 'bottom_right');
    expect(table.all()).toEqual([b, c]);
    table.set_position(c, 'bottom_right');
    expect(table.all()).toEqual([b, c]);
  });
});

describe('rsi(x, y) with x = -y (PineScript v4)', () => {
  // 1 + x / y = 0: 100 - 100 / 0 = -Infinity, which na() and nz() treat as na while comparisons and max see it
  it('-Infinity', () => {
    const [r] = taCore.rsi([0.001], [-0.001]);
    expect(r).toBe(-Infinity);
    expect([na(r), r! < 0, r! < -1e300, nz(r, 7), math.max(r!, -5)]).toEqual([true, true, true, 7, -5]);
  });

  it('next to it, finite values', () => {
    const r = taCore.rsi([0.7009999999999993, 0.001, 1.0000000000000002e-12, -2e-10], [-0.7010000000000001, -0.000999999999999999, -1.0000000000000002e-12, 2e-10]);
    expect(r).toEqual([-90071992547409820, 90071992547410020, 100, -Infinity]);
  });
});

describe('time("D", session, timezone) between two runs of a session', () => {
  // BITSTAMP:BTCUSD 60 (24x7, UTC), Monday 01/07/2024 11:00 UTC to Tuesday 02/07 16:00 UTC
  const from = 1719831600;
  const bars: Bar[] = Array.from({ length: 30 }, (_, i) => ({ time: from + i * 3600, open: 1, high: 1, low: 1, close: 1, volume: 1 }));
  const chart = { timeframe: '60', timezone: 'Etc/UTC', session: '24x7' };
  /** One letter per bar: '.' is na, 'a' the first value, 'b' the second. */
  const expand = (pattern: string, values: number[]): number[] =>
    [...pattern].map((ch) => (ch === '.' ? NaN : values[ch.charCodeAt(0) - 97]!));
  const cases: Array<[string, string, string, number[], string, number[]]> = [
    // runs 09:00-12:00 and 13:00-15:00: 12:00-13:00 is inside the day (the issue's bar, 16:00 UTC)
    ['0900-1200,1300-1500:1234567', 'America/New_York', '..aaaaaa..................bbbb', [1719838800000, 1719925200000], '..aaaaaa..................bbbb', [1719860400000, 1719946800000]],
    // weekdays, 22:00-01:00 belongs to the next day: 01:00-03:00 is inside
    ['2200-0100,0300-0500', 'Australia/Sydney', '.aaaaaaa.................bbbbb', [1719835200000, 1719921600000], '.aaaaaaa.................bbbbb', [1719860400000, 1719946800000]],
    // 22:00 of the day before to 20:00: the day starts with its overnight run
    ['1700-2000,2200-0200:1234567', 'America/New_York', 'aaaaaaaaaaaaa..bbbbbbbbbbbbbbb', [1719799200000, 1719885600000], 'aaaaaaaaaaaaa..bbbbbbbbbbbbbbb', [1719878400000, 1719964800000]],
  ];

  it.each(cases)('%s %s, script API', (session, tz, open, opens, close, closes) => {
    let d: number[] = [];
    let c: number[] = [];
    executeScript(() => {
      d = time('D', session, tz).toArray();
      c = time_close('D', session, tz).toArray();
    }, bars, {}, chart);
    expect(d).toEqual(expand(open, opens));
    expect(c).toEqual(expand(close, closes));
  });

  it.each(cases)('%s %s, periodTime / periodClose without a script run', (session, tz, open, opens, close, closes) => {
    expect(bars.map((b) => periodTime(b.time as number, 'D', chart, session, tz))).toEqual(expand(open, opens));
    expect(bars.map((b) => periodClose(b.time as number, 'D', chart, session, tz))).toEqual(expand(close, closes));
  });

  it('periodTime with a session on an intraday timeframe aligns on the run', () => {
    // "0900-1200,1300-1500:1234567" New York, 240: 09:00 for the first run, 13:00 for the second; na between them
    const t = bars.slice(0, 8).map((b) => periodTime(b.time as number, '240', chart, '0900-1200,1300-1500:1234567', 'America/New_York'));
    expect(t).toEqual([NaN, NaN, 1719838800000, 1719838800000, 1719838800000, NaN, 1719853200000, 1719853200000]);
  });
});
