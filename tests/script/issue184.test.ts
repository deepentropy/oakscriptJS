/**
 * #184: volume as a source, ta.roc with a zero base, the ZigZag library (first pivot, volumes), calendar fields of an
 * na time, a lower timeframe on the open last bar, syminfo.description and input.text_area. Expected values are
 * PineScript results of the same calls (BITSTAMP:BTCUSD 1D, NASDAQ:AAPL 1D).
 */
import { ZigZag, getSource, getSourceSeries, input as coreInput, math, taCore, time as timeCore } from '../../src';
import { executeScript, input, request, syminfo, time, year } from '../../src/script';
import type { Bar } from '../../src/types';

const na = NaN;

describe('volume as a source', () => {
  const bars: Bar[] = [
    { time: 1, open: 1, high: 2, low: 0.5, close: 1.5, volume: 0.48990826 },
    { time: 2, open: 1, high: 2, low: 0.5, close: 1.5 },
  ];
  it('getSource / getSourceSeries / input.source offer volume (NaN without volume)', () => {
    expect(getSource(bars, 'volume')).toEqual([0.48990826, na]);
    expect(getSourceSeries(bars, 'volume').toArray()).toEqual([0.48990826, na]);
    expect(coreInput.source('volume').options).toContain('volume');
    let v: number[] = [];
    executeScript(() => { v = input.source('volume', 'Source').toArray(); }, bars);
    expect(v).toEqual([0.48990826, na]);
  });
});

describe('ta.roc with a zero base', () => {
  it('divides by zero: +/-Infinity, NaN for 0 / 0', () => {
    // BTCUSD probe: x = 0, 11.69, -11.7, 0, na, 10.5, 10, 0, 8.22
    const x = [0, 11.69, -11.7, 0, na, 10.5, 10, 0, 8.22];
    expect(taCore.roc(x, 1)).toEqual([na, Infinity, -200.08554319931565, -100, na, na, -4.761904761904762, -100, Infinity]);
    expect(taCore.roc([0, -5.66], 1)).toEqual([na, -Infinity]);
    expect(taCore.roc([0, 0], 1)).toEqual([na, na]);
    // a -0 base (computed at runtime) gives the opposite sign
    expect(taCore.roc([-0, 11.69], 1)).toEqual([na, -Infinity]);
  });
});

describe('calendar fields of an na time', () => {
  it('are those of time 0 in the time zone', () => {
    const fields = (tz: string) =>
      [timeCore.year, timeCore.month, timeCore.dayofmonth, timeCore.dayofweek, timeCore.weekofyear, timeCore.hour, timeCore.minute, timeCore.second]
        .map((f) => f(na, tz));
    expect(fields('Etc/UTC')).toEqual([1970, 1, 1, 5, 1, 0, 0, 0]);
    expect(fields('America/New_York')).toEqual([1969, 12, 31, 4, 1, 19, 0, 0]);
    expect(fields('UTC+5:30').slice(5, 7)).toEqual([5, 30]);
    expect(fields('Asia/Tokyo').slice(0, 3)).toEqual([1970, 1, 1]);
    expect(timeCore.hour(na, 'Asia/Tokyo')).toBe(9);
  });

  it('in the script API, with the exchange time zone by default', () => {
    let y = 0;
    executeScript(() => { y = year(na); }, [], {}, { timezone: 'America/New_York' });
    expect(y).toBe(1969);
  });
});

describe('ZigZag library', () => {
  // first 45 bars of BITSTAMP:BTCUSD 1D, default settings (deviation 5, depth 10)
  const high = [10.9, 11.85, 11.7, 11.7, 11.7, 11.5, 10, 8, 8.31, 8.88, 8.89, 8, 8.5, 7.98, 6, 5.72, 5.24, 4.87, 4.87, 4.92, 4.9, 5.66, 5.79, 5.72, 5.72, 5.76, 6.05, 6.06, 4.92, 4.91, 4.82, 4.87, 5.3, 6.25, 4.99, 4.81, 4.57, 3.89, 4.51, 4.1, 3.99, 3.97, 4.05, 3.92, 2.29];
  const low = [10.9, 11.15, 11.7, 11.7, 11.7, 10.5, 10, 8, 5.25, 8, 8.89, 8, 8.5, 7.4, 5.65, 5.52, 5, 4.8, 4.87, 4.81, 4.9, 4.92, 5.66, 5.68, 5.7, 5.68, 6.05, 4.8, 4.85, 4.82, 4.81, 4.83, 4.8, 4.8, 4.8, 4.59, 3.99, 3.89, 3.99, 3.98, 3.93, 3.93, 4.05, 3.92, 2.22];
  const volume = [0.48990826, 1.92657814, 0.08547009, 0.08547009, 0.02863249, 2.35652174, 1.1, 1, 164.48, 79.76, 0.20022497, 21, 3, 6.86, 58.37138238, 61.14598362, 80.1407952, 39.9140068, 0.3, 119.8128, 20, 89.28071068, 17.62932238, 43.77842238, 20.68003681, 90.58706633, 12.22, 39.57846334, 24.3545, 83.0533258, 46.9645, 30.57595, 142.52162238, 113.72, 170.84354937, 94.64, 56, 11, 132.5, 78.08, 79.523525, 109.621766, 96.97751266, 10.24, 61.972332];
  const times = [1313625600, 1313712000, 1313798400, 1313884800, 1313971200, 1314144000, 1314230400, 1314662400, 1314835200, 1314921600, 1315094400, 1315267200, 1315353600, 1315440000, 1315872000, 1315958400, 1316044800, 1316131200, 1316217600, 1316304000, 1316390400, 1316476800, 1316563200, 1316649600, 1316736000, 1316822400, 1316908800, 1316995200, 1317081600, 1317168000, 1317254400, 1317600000, 1317686400, 1317772800, 1317859200, 1317945600, 1318032000, 1318118400, 1318204800, 1318291200, 1318377600, 1318464000, 1318550400, 1318809600, 1319068800].map((t) => t * 1000);
  const bar = (i: number): Bar => ({ time: times[i]!, open: na, high: high[i]!, low: low[i]!, close: na, volume: volume[i]! });

  it('the first pivot starts on its own end point; volumes sum volume[depth]', () => {
    const zz = new ZigZag();
    const state: Record<number, unknown> = {};
    for (let i = 0; i < times.length; i++) {
      zz.update(bar(i), i);
      const [f, s] = zz.pivots;
      state[i] = [zz.pivots.length, f?.start.time, f?.end.time, f?.start.price, f?.volume, s?.start.time, s?.volume];
    }
    const t = (i: number) => times[i];
    expect(state[12]).toEqual([0, undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(state[13]).toEqual([1, t(8), t(8), 5.25, 171.55258081, undefined, undefined]);
    // the first leg moves its start with its end (it was fixed on the bar 8 low)
    expect(state[22]).toEqual([1, t(17), t(17), 4.8, 521.94497378, undefined, undefined]);
    expect(state[32]).toEqual([3, t(17), t(17), 4.8, 521.94497378, t(17), 453.86682192]);
    expect(state[44]![0]).toBe(5);
  });

  it('the extension adds math.sum(volume, depth) of the last bar', () => {
    const zz = new ZigZag();
    for (let i = 0; i < times.length; i++) zz.update(bar(i), i);
    const last = times.length - 1;
    const remVol = math.sum(volume, 5).at(-1)!;
    expect(zz.getExtension(bar(last), last)!.volume).toBe(zz.sumVol + remVol);
  });
});

describe('lower timeframe request on the open last bar', () => {
  // BTCUSD 1D chart, open bar of 13/10/2026 with hourly bars up to 09:00
  const DAY = 86400;
  const day0 = Date.UTC(2026, 9, 11) / 1000;
  const chartBars: Bar[] = [0, 1, 2].map((d) => ({ time: day0 + d * DAY, open: 1, high: 1, low: 1, close: 1, volume: 1 }));
  const hourly: Bar[] = Array.from({ length: 2 * 24 + 10 }, (_, h) => ({ time: day0 + h * 3600, open: 1, high: 1, low: 1, close: 1, volume: 1 }));
  const run = (realtime: boolean, lookahead: string) => {
    let out: number[] = [];
    executeScript(() => {
      out = request.security('BITSTAMP:BTCUSD', '60', () => time, 'gaps_off', lookahead).toArray();
    }, chartBars, {}, {
      tickerid: 'BITSTAMP:BTCUSD', timeframe: '1D', timezone: 'Etc/UTC', session: '24x7', realtime,
      bars: (s, tf) => (tf === '60' ? hourly : undefined),
    });
    return out.map((t) => new Date(t).toISOString().slice(5, 16));
  };
  it('shows the last lower bar so far (lookahead off), the first one with lookahead on', () => {
    for (const realtime of [false, true]) {
      expect(run(realtime, 'lookahead_off')).toEqual(['10-11T23:00', '10-12T23:00', '10-13T09:00']);
      expect(run(realtime, 'lookahead_on')).toEqual(['10-11T00:00', '10-12T00:00', '10-13T00:00']);
    }
  });
});

describe('syminfo.description and input.text_area', () => {
  it('syminfo.description comes from the chart context, and from symbolInfo inside request.security', () => {
    const bars: Bar[] = [{ time: 1791849600, open: 1, high: 1, low: 1, close: 1, volume: 1 }];
    let own = '';
    let other: string[] = [];
    executeScript(() => {
      own = syminfo.description;
      request.security('NASDAQ:AAPL', 'D', () => { other = [syminfo.description]; return time; });
    }, bars, {}, {
      tickerid: 'BITSTAMP:BTCUSD', timeframe: '1D', timezone: 'Etc/UTC', session: '24x7', description: 'Bitcoin / U.S. dollar',
      bars: () => bars,
      symbolInfo: (s) => (s === 'NASDAQ:AAPL' ? { timezone: 'America/New_York', session: '0930-1600', description: 'Apple Inc.' } : undefined),
    });
    expect(own).toBe('Bitcoin / U.S. dollar');
    expect(other).toEqual(['Apple Inc.']);
    expect(() => executeScript(() => { void syminfo.description; }, [], {}, {})).toThrow('syminfo.description is not known');
  });

  it('input.text_area declares a multi-line string input', () => {
    let v = '';
    const run = executeScript(() => { v = input.text_area('a\nb, c', 'List'); }, [], {});
    expect(v).toBe('a\nb, c');
    expect(run.inputConfig[0]).toMatchObject({ id: 'list', type: 'text_area', defval: 'a\nb, c' });
    executeScript(() => { v = input.text_area('a\nb, c', 'List'); }, [], { list: 'x\ny' });
    expect(v).toBe('x\ny');
    expect(coreInput.text_area('a\nb').type).toBe('text_area');
  });
});
