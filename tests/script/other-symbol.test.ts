/**
 * request.security of another symbol (#179). Expected values are the PineScript results of the same calls on
 * NASDAQ:AAPL 1D and BITSTAMP:BTCUSD 1D (02/09/2026 to 11/09/2026, with the Labor Day holiday of 07/09/2026).
 */
import { securityOther } from '../../src';
import { MissingSymbolDataError, barmerge, close, executeScript, request, syminfo, time } from '../../src/script';
import type { Bar } from '../../src/types';

const na = NaN;
const DAY = 86400;
const bar = (t: number): Bar => ({ time: t, open: 1, high: 1, low: 1, close: t / DAY, volume: 1 });
// AAPL opens at 13:30 UTC; BTCUSD trades every day from 00:00 UTC
const aaplTimes = [1788355800, 1788442200, 1788528600, 1788874200, 1788960600, 1789047000, 1789133400];
const btcTimes = Array.from({ length: 11 }, (_, i) => 1788220800 + i * DAY); // 01/09 to 11/09
const AAPL = { timezone: 'America/New_York', session: { session: '0930-1600', holidays: '20260907' } };
const BTC = { timezone: 'Etc/UTC', session: '24x7' };
const ms = (t: number) => t * 1000;

function run(chart: 'aapl' | 'btc', gaps: string, lookahead: string): number[] {
  const chartBars = (chart === 'aapl' ? aaplTimes : btcTimes.slice(1)).map(bar);
  const other = chart === 'aapl' ? 'BITSTAMP:BTCUSD' : 'NASDAQ:AAPL';
  const otherBars = (chart === 'aapl' ? btcTimes : aaplTimes).map(bar);
  let out: number[] = [];
  executeScript(() => {
    out = request.security(other, 'D', () => time, gaps, lookahead).toArray();
  }, chartBars, {}, {
    tickerid: chart === 'aapl' ? 'NASDAQ:AAPL' : 'BITSTAMP:BTCUSD',
    timeframe: '1D',
    ...(chart === 'aapl' ? AAPL : BTC),
    bars: (symbol, timeframe) => (symbol === other && timeframe === '1D' ? otherBars : undefined),
    symbolInfo: (symbol) => (symbol === 'NASDAQ:AAPL' ? AAPL : BTC),
  });
  return out;
}

describe('request.security of another symbol (#179)', () => {
  it('a stock chart shows the crypto bar of the day before (lookahead off: by close time)', () => {
    const b = (i: number) => ms(btcTimes[i]!);
    expect(run('aapl', barmerge.gaps_off, barmerge.lookahead_off)).toEqual([b(0), b(1), b(2), b(6), b(7), b(8), b(9)]);
    // lookahead on: by trading day
    expect(run('aapl', barmerge.gaps_off, barmerge.lookahead_on)).toEqual([b(1), b(2), b(3), b(7), b(8), b(9), b(10)]);
  });

  it('a crypto chart shows the stock bar of the same day; gaps on gives na on the weekend and the holiday', () => {
    const a = (i: number) => ms(aaplTimes[i]!);
    const off = [a(0), a(1), a(2), a(2), a(2), a(2), a(3), a(4), a(5), a(6)];
    expect(run('btc', barmerge.gaps_off, barmerge.lookahead_off)).toEqual(off);
    expect(run('btc', barmerge.gaps_on, barmerge.lookahead_off)).toEqual([a(0), a(1), a(2), na, na, na, a(3), a(4), a(5), a(6)]);
    expect(run('btc', barmerge.gaps_off, barmerge.lookahead_on)).toEqual(off);
    expect(run('btc', barmerge.gaps_on, barmerge.lookahead_on)).toEqual([a(0), a(1), a(2), na, na, na, a(3), a(4), a(5), a(6)]);
  });

  it('the expression sees the other symbol (syminfo.tickerid, its bars)', () => {
    let ticker = '';
    let closes: number[] = [];
    executeScript(() => {
      closes = request.security('BITSTAMP:BTCUSD', 'D', () => {
        ticker = syminfo.tickerid;
        return close;
      }).toArray();
    }, aaplTimes.map(bar), {}, { tickerid: 'NASDAQ:AAPL', timeframe: '1D', ...AAPL, bars: () => btcTimes.map(bar), symbolInfo: () => BTC });
    expect(ticker).toBe('BITSTAMP:BTCUSD');
    expect(closes[0]).toBe(btcTimes[0]! / DAY);
  });

  it('bars not given: MissingSymbolDataError lists every request once', () => {
    let error: unknown;
    try {
      executeScript(() => {
        request.security('NASDAQ:MSFT', 'D', () => close);
        request.security('NASDAQ:MSFT', 'D', () => close);
        request.security('CRYPTOCAP:BTC', 'W', () => close);
      }, aaplTimes.map(bar), {}, { tickerid: 'NASDAQ:AAPL', timeframe: '1D' });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(MissingSymbolDataError);
    expect((error as MissingSymbolDataError).requests).toEqual([
      { symbol: 'NASDAQ:MSFT', timeframe: '1D' },
      { symbol: 'CRYPTOCAP:BTC', timeframe: '1W' },
    ]);
  });

  it('a symbol that does not exist (bars []): "Invalid symbol", or na with ignore_invalid_symbol', () => {
    const ctx = { tickerid: 'NASDAQ:AAPL', timeframe: '1D', bars: () => [] };
    expect(() => executeScript(() => { request.security('NASDAQ:ZZZQQQX', 'D', () => close); }, aaplTimes.map(bar), {}, ctx)).toThrow(
      'Invalid symbol: NASDAQ:ZZZQQQX'
    );
    let v: number[] = [];
    executeScript(() => {
      v = request.security('NASDAQ:ZZZQQQX', 'D', () => close, barmerge.gaps_off, barmerge.lookahead_off, true).toArray();
    }, aaplTimes.map(bar), {}, ctx);
    expect(v.every(Number.isNaN)).toBe(true);
  });

  it('securityOther gives the index of the bar shown on each chart bar', () => {
    const idx = securityOther(aaplTimes.map((t) => ({ time: t })), btcTimes.map((t) => ({ time: t })), 'D', { timeframe: '1D', ...AAPL }, { other: BTC });
    expect(idx).toEqual([0, 1, 2, 6, 7, 8, 9]);
    expect(securityOther([{ time: 0 }], [], 'D', { timeframe: '1D' })).toEqual([-1]);
    expect(securityOther([{ time: 0 }], [{ time: 0 }], '60', { timeframe: '1D' })).toEqual([0]); // a lower timeframe (#181): the hour closes inside the day
  });
});

describe('lower timeframes (#181)', () => {
  // BITSTAMP:BTCUSD 1D chart, 03/09/2026, with its hourly bars and the hourly bars of NASDAQ:AAPL (13:30 to 19:30 UTC)
  const day = 1788393600; // 03/09/2026 00:00 UTC
  const btcHours = Array.from({ length: 72 }, (_, i) => day - DAY + i * 3600); // 02/09 to 04/09
  const aaplHours = [-1, 0, 1].flatMap((d) => Array.from({ length: 7 }, (_, i) => day + d * DAY + 13.5 * 3600 + i * 3600));
  const ctx = {
    tickerid: 'BITSTAMP:BTCUSD', timeframe: '1D', ...BTC,
    bars: (symbol: string, tf: string) => (tf !== '60' ? undefined : (symbol === 'NASDAQ:AAPL' ? aaplHours : btcHours).map(bar)),
    symbolInfo: (symbol: string) => (symbol === 'NASDAQ:AAPL' ? AAPL : BTC),
  };
  const chartBars = [day - DAY, day, day + DAY].map(bar);

  it('request.security: lookahead off shows the last lower bar that closes by the close, lookahead on the one open at the open', () => {
    let r: number[][] = [];
    executeScript(() => {
      r = [
        request.security('', '60', () => time).toArray(),
        request.security('', '60', () => time, barmerge.gaps_off, barmerge.lookahead_on).toArray(),
        request.security('NASDAQ:AAPL', '60', () => time).toArray(),
        request.security('NASDAQ:AAPL', '60', () => time, barmerge.gaps_off, barmerge.lookahead_on).toArray(),
      ];
    }, chartBars, {}, ctx);
    expect(r[0]![1]).toBe(ms(day + 23 * 3600)); // 03/09 23:00
    expect(r[1]![1]).toBe(ms(day)); // 03/09 00:00
    expect(r[2]![1]).toBe(ms(day + 19.5 * 3600)); // AAPL 03/09 19:30
    expect(r[3]![1]).toBe(ms(day - DAY + 19.5 * 3600)); // AAPL 02/09 19:30: the last one open at 00:00
  });

  it('request.security_lower_tf: the lower bars that close inside the chart bar', () => {
    let own: number[][] = [];
    let aapl: number[][] = [];
    executeScript(() => {
      own = request.security_lower_tf('', '60', () => time);
      aapl = request.security_lower_tf('NASDAQ:AAPL', '60', () => time);
    }, chartBars, {}, ctx);
    expect(own[1]).toHaveLength(24);
    expect([own[1]![0], own[1]![23]]).toEqual([ms(day), ms(day + 23 * 3600)]);
    expect(aapl[1]).toEqual(Array.from({ length: 7 }, (_, i) => ms(day + 13.5 * 3600 + i * 3600)));
  });

  it('a higher timeframe in security_lower_tf throws', () => {
    expect(() => executeScript(() => { request.security_lower_tf('', 'W', () => time); }, chartBars, {}, ctx)).toThrow('higher than the chart timeframe');
  });
});
