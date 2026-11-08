/**
 * request.seed (#205): an expression on a seed data series, read as request.security of the series' symbol on the
 * chart timeframe.
 */
import { MissingSymbolDataError, close, executeScript, request, syminfo } from '../../src/script';
import type { Bar } from '../../src/types';

const DAY = 86400;
const times = Array.from({ length: 5 }, (_, i) => (1788220800 + i * DAY) * 1000);
const bar = (t: number, v: number): Bar => ({ time: t, open: v, high: v, low: v, close: v, volume: 0 });
const chartBars = times.map((t, i) => bar(t, 100 + i));
const seedBars = times.map((t, i) => bar(t, i + 1));
const UTC = { timezone: 'Etc/UTC', session: '24x7' };

describe('request.seed (#205)', () => {
  it('reads "<SOURCE>:<SYMBOL>" by default, on the chart timeframe', () => {
    const asked: string[] = [];
    let ticker = '';
    let values: number[] = [];
    executeScript(() => {
      values = request.seed('seed_crypto_santiment', 'btc_dev_activity', () => {
        ticker = syminfo.tickerid;
        return close;
      }).toArray();
    }, chartBars, {}, {
      tickerid: 'BITSTAMP:BTCUSD',
      timeframe: '1D',
      ...UTC,
      bars: (symbol, timeframe) => {
        asked.push(`${symbol} ${timeframe}`);
        return symbol === 'SEED_CRYPTO_SANTIMENT:BTC_DEV_ACTIVITY' ? seedBars : undefined;
      },
      symbolInfo: () => UTC,
    });
    expect(asked).toContain('SEED_CRYPTO_SANTIMENT:BTC_DEV_ACTIVITY 1D');
    expect(ticker).toBe('SEED_CRYPTO_SANTIMENT:BTC_DEV_ACTIVITY');
    expect(values).toEqual([1, 2, 3, 4, 5]);
  });

  it('maps the series through ChartContext.seedSymbol; named arguments; a missing series asks for its bars', () => {
    let values: number[] = [];
    executeScript(() => {
      values = request.seed({ source: 'any', symbol: 'abc', expression: () => close.mul(2) }).toArray();
    }, chartBars, {}, {
      tickerid: 'X:Y',
      timeframe: '1D',
      ...UTC,
      seedSymbol: (_source, symbol) => `LOCAL:${symbol.toUpperCase()}`,
      bars: (symbol) => (symbol === 'LOCAL:ABC' ? seedBars : undefined),
      symbolInfo: () => UTC,
    });
    expect(values).toEqual([2, 4, 6, 8, 10]);

    expect(() =>
      executeScript(() => { request.seed('repo', 'missing', () => close); }, chartBars, {}, { tickerid: 'X:Y', timeframe: '1D', ...UTC, bars: () => undefined }),
    ).toThrow(MissingSymbolDataError);
  });

  it('calc_bars_count is not supported', () => {
    expect(() =>
      executeScript(() => { request.seed('repo', 's', () => close, { calc_bars_count: 10 }); }, chartBars, {}, { tickerid: 'X:Y', timeframe: '1D', ...UTC, bars: () => seedBars }),
    ).toThrow(/calc_bars_count/);
  });
});
