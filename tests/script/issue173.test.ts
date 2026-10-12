/**
 * Session calendar items of #173. Each expected value is the PineScript result of the same call: BITSTAMP:BTCUSD 60
 * (24x7, UTC) around the clock change of 03/11/2024, NASDAQ:AAPL 60 around the early close of 29/11/2019, TVC:DXY 60
 * and BITSTAMP:BTCUSD 1D.
 */
import { TradingCalendar, time as timeCore } from '../../src';
import { barmerge, executeScript, hlc3, request, syminfo, ta, time, time_close, timeframe } from '../../src/script';
import type { Bar } from '../../src/types';

const na = NaN;
const NY = 'America/New_York';

/** Hourly 24x7 bars from `from` for `count` hours (UNIX seconds). */
const hourly = (from: number, count: number): Bar[] =>
  Array.from({ length: count }, (_, i) => ({ time: from + i * 3600, open: 1, high: 1, low: 1, close: 1, volume: 1 }));
const BTC = { timeframe: '60', timezone: 'Etc/UTC', session: '24x7' };

function run(bars: Bar[], chart: object, body: () => Record<string, { toArray(): number[] }>): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  executeScript(() => {
    for (const [k, v] of Object.entries(body())) out[k] = v.toArray();
  }, bars, {}, chart);
  return out;
}

describe('time(tf, session, timezone) around a clock change (#173)', () => {
  // Saturday 02/11/2024 19:00 UTC to Sunday 03/11 07:00 UTC; New York clocks go back on Sunday 02:00
  const bars = hourly(1730574000, 13);

  it('"D": the day placement of the session string (no new period on the Saturday before the change)', () => {
    const r = run(bars, BTC, () => ({
      d: time('D', '1700-0200:1234567', NY),
      c: time_close('D', '1700-0200:1234567', NY),
    }));
    const s = 1730581200000; // Saturday 17:00 EDT
    expect(r.d).toEqual([na, na, s, s, s, s, s, s, s, s, s, na, na]);
    expect(r.c!.slice(2, 11)).toEqual(new Array(9).fill(1730613600000)); // Sunday 02:00 EDT
  });

  it('"240": periods aligned on the run as time.inSession places it', () => {
    const r = run(bars, BTC, () => ({ t: time('240', '1700-0200:1234567', NY) }));
    const [a, b, c] = [1730584800000, 1730599200000, 1730613600000];
    expect(r.t!.slice(1)).toEqual([na, na, a, a, a, a, b, b, b, b, c, na]);
  });

  it('"W", "M" and "2D" have no session test: the period time also between the runs', () => {
    const r = run(hourly(1730541600, 2), BTC, () => ({
      w: time('W', '2000-0000:23456', NY),
      m: time('M', '2000-0000:23456', NY),
      d2: time('2D', '2000-0000:23456', NY),
      wc: time_close('W', '2000-0000:23456', NY),
    }));
    expect(r.w).toEqual([1730160000000, 1730160000000]);
    expect(r.m).toEqual([1730505600000, 1730505600000]);
    expect(r.d2).toEqual([1730419200000, 1730419200000]);
    expect(r.wc!.every((x) => !Number.isNaN(x))).toBe(true);
  });

  it('a session ending at 0000 belongs to the day it starts, also in the calendar', () => {
    // Friday 05/07/2024 20:00 New York to midnight
    const r = run(hourly(1720220400, 6), BTC, () => ({ d: time('D', '2000-0000:23456', NY) }));
    const s = 1720224000000;
    expect(r.d).toEqual([na, s, s, s, s, na]);
    const cal = new TradingCalendar('Etc/UTC', { session: '2000-0000:23456' }, 'pine');
    expect(cal.periods(20260724)).toEqual([[Date.UTC(2026, 6, 24, 20), Date.UTC(2026, 6, 25)]]); // Friday
    expect(cal.periods(20260726)).toEqual([]); // Sunday
  });
});

describe('session strings with "F" (#173)', () => {
  it('"1700F-1900:2" runs from Sunday 17:00 to Monday 19:00', () => {
    const tz = NY;
    const sunday1800 = Date.UTC(2026, 8, 27, 22);
    expect(timeCore.inSession(sunday1800, '1700F-1900:2', tz)).toBe(true);
    expect(timeCore.inSession(sunday1800 - 2 * 3600000, '1700F-1900:2', tz)).toBe(false); // 16:00
    expect(timeCore.inSession(Date.UTC(2026, 8, 28, 22, 30), '1700F-1900:2', tz)).toBe(true); // Monday 18:30
    expect(timeCore.inSession(Date.UTC(2026, 8, 28, 23), '1700F-1900:2', tz)).toBe(false); // Monday 19:00
    // the TVC:DXY session: 06/01/2026 15:00 UTC is inside
    expect(timeCore.inSession(Date.UTC(2026, 0, 6, 15), '1900-1900:3456|1700F-1900:2', tz)).toBe(true);
  });
});

describe('NASDAQ:AAPL 60 around the early close of 29/11/2019 (#173)', () => {
  const raw: Array<[number, number, number, number, number, number]> = [
    [1574778600, 66.735, 66.76, 66.30875, 66.4975, 1241404], [1574782200, 66.495, 66.6225, 66.375, 66.51, 808180],
    [1574785800, 66.5, 66.635, 66.435, 66.6075, 471800], [1574789400, 66.605, 66.695, 66.585, 66.65, 371072],
    [1574793000, 66.65, 66.655, 66.575, 66.5975, 294220], [1574796600, 66.6, 66.6425, 66.535, 66.5775, 503784],
    [1574800200, 66.5775, 66.675, 65.915, 66.02, 1516808], [1574865000, 66.45, 66.565, 66.33, 66.4975, 1117824],
    [1574868600, 66.505, 66.65, 66.4375, 66.63, 684580], [1574872200, 66.635, 66.675, 66.54, 66.64, 489348],
    [1574875800, 66.64, 66.6625, 66.5825, 66.635, 400932], [1574879400, 66.6325, 66.75, 66.63, 66.7325, 569468],
    [1574883000, 66.7325, 66.8, 66.7025, 66.7825, 586540], [1574886600, 66.785, 66.9925, 66.77, 66.975, 932064],
    [1575037800, 66.565, 66.9775, 66.4825, 66.8225, 900796], [1575041400, 66.81375, 67, 66.775, 66.945, 513384],
    [1575045000, 66.94, 66.995, 66.8475, 66.8675, 560520], [1575048600, 66.865, 66.9675, 66.7375, 66.8625, 803052],
    [1575052200, 66.8625, 66.8625, 66.85, 66.85, 800], [1575297000, 66.8075, 67.0475, 66.2125, 66.3575, 1709720],
    [1575300600, 66.355, 66.3775, 65.865, 66.065, 1322840], [1575304200, 66.0625, 66.24, 65.945, 66.045, 833688],
    [1575307800, 66.0575, 66.33, 66.035, 66.3, 353700], [1575311400, 66.2975, 66.42, 66.2425, 66.42, 432328],
    [1575315000, 66.41, 66.435, 66.205, 66.2125, 564844], [1575318600, 66.2175, 66.3325, 65.9975, 66.03, 997552],
  ];
  const bars: Bar[] = raw.map(([time, open, high, low, close, volume]) => ({ time, open, high, low, close, volume }));
  const chart = {
    tickerid: 'NASDAQ:AAPL', timeframe: '60', timezone: NY,
    session: { session: '0930-1600', corrections: '0930-1300:20191129', holidays: '20191128' },
  };
  const r = run(bars, chart, () => ({
    secD: request.security(syminfo.tickerid, 'D', () => time),
    sec240: request.security(syminfo.tickerid, '240', () => time),
    secDla: request.security(syminfo.tickerid, 'D', () => time, barmerge.gaps_off, barmerge.lookahead_on),
    time240: time('240'),
    ch240: timeframe.change('240'),
    vwap: ta.vwap(hlc3),
  }));
  const [tue, wed, fri, mon] = [1574778600000, 1574865000000, 1575037800000, 1575297000000];

  it('the bar after the early close (18:30 UTC) is in the D bar of Friday, which completes at 17:30', () => {
    expect(r.secD!.slice(6)).toEqual([tue, tue, tue, tue, tue, tue, tue, wed, wed, wed, wed, fri, fri, fri, fri, fri, fri, fri, fri, mon]);
    expect(r.secDla!.slice(14, 20)).toEqual([fri, fri, fri, fri, fri, mon]);
  });

  it('it is an intraday bar of its own for "240", and time("240") is na on it', () => {
    const [t2, w1, w2, f2] = [1574793000000, wed, 1574879400000, 1575052200000];
    expect(r.sec240!.slice(3)).toEqual([tue, tue, tue, t2, t2, t2, t2, w1, w1, w1, w2, w2, w2, w2, fri, fri, f2, f2, f2, mon, mon, mon, 1575311400000]);
    expect(r.time240!.slice(14, 20)).toEqual([fri, fri, fri, fri, na, mon]);
    expect(r.ch240!.slice(14, 20)).toEqual([1, 0, 0, 0, 0, 0]);
  });

  it('ta.vwap starts a new day on Monday (where timeframe.change("D") is false)', () => {
    expect(r.vwap!.slice(14)).toEqual([
      66.76083333333334, 66.81377461379267, 66.83919592005537, 66.84400581957401, 66.84400874508258, 66.53916666666667,
      66.34868729170515, 66.29003085506501, 66.28430082866741, 66.29141286257881, 66.29062833581236, 66.26323982075536,
    ]);
  });
});

describe('ta.vwap on daily bars needs no time zone or session (#173)', () => {
  it('each bar is its own day', () => {
    const v = [0.48990826, 1.92657814, 0.08547009, 0.08547009];
    const p = [[10.9, 10.9, 10.9], [11.85, 11.15, 11.69], [11.7, 11.7, 11.7], [11.7, 11.7, 11.7]];
    const bars: Bar[] = p.map(([high, low, close], i) => ({ time: 1315872000 + i * 86400, open: close!, high: high!, low: low!, close: close!, volume: v[i]! }));
    const r = run(bars, { timeframe: '1D' }, () => ({ vwap: ta.vwap(hlc3) }));
    expect(r.vwap).toEqual([10.9, 11.563333333333333, 11.699999999999998, 11.699999999999998]);
  });
});

describe('ta.vwap after an early close with several bars after the close (#178)', () => {
  it('the first bar continues the day, each further one starts a new sum (AMEX:SPY 60, 26/11/2021)', () => {
    const raw: Array<[number, number, number, number, number, number]> = [
      [1637937000, 462.34, 463.89, 459.05, 460.98, 2491290], [1637940600, 460.96, 461.38, 458.14, 458.94, 1626867],
      [1637944200, 458.95, 460.68, 458.34, 460.62, 1950675], [1637947800, 460.62, 461.495, 457.24, 458.09, 3117569],
      [1637951400, 458.01, 458.14, 457.22, 457.22, 9200], [1637955000, 457.26, 457.26, 456.96, 457.16, 5527],
      [1637958600, 456.94, 456.94, 456.94, 456.94, 209], [1638196200, 464.06, 464.59, 462.47, 462.62, 1703772],
      [1638199800, 462.63, 463.53, 461.75, 463.06, 825131], [1638203400, 463.05, 465.77, 463.04, 465.66, 610265],
    ];
    const bars: Bar[] = raw.map(([time, open, high, low, close, volume]) => ({ time, open, high, low, close, volume }));
    const chart = { timeframe: '60', timezone: NY, session: { session: '0930-1600', corrections: '0930-1300:20211126', holidays: '20211125' } };
    const r = run(bars, chart, () => ({ vwap: ta.vwap(hlc3) }));
    expect(r.vwap).toEqual([
      461.3066666666666, 460.58768049396855, 460.36021421255356, 459.8788048059663, 459.876451542609, 457.1266666666667,
      456.94000000000005, 463.22666666666663, 463.080928173204, 463.41965769804824,
    ]);
  });
});
