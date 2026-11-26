/**
 * #211: every syminfo.* field, request.dividends / request.splits / request.earnings. `events-211.json` holds
 * PineScript results (26/11/2026) on NASDAQ:AAPL 1D and 60, NYSE:KO 1D, 60, 1W and 1M, NASDAQ:NVDA 1D and
 * NSE:RELIANCE 1D: the bar times (s) and the values of `request.dividends(t)` (div), `request.earnings(t)` (eps),
 * with gaps on (epsGaps), with gaps and lookahead on (epsGapsLook), and `request.splits(t, splits.numerator)`
 * (splitNum, splitNumGaps with gaps on) / `splits.denominator` (splitDen).
 */
import {
  MissingSymbolDataError, barmerge, dividends, earnings, executeScript, na, request, splits, syminfo,
  type ChartContext, type SymbolEvents,
} from '../../src/script';
import { utcPeriod } from '../../src/security/events';
import fixture from './events-211.json';

type Case = { times: number[] } & Record<string, (number | null)[]>;
const cases = fixture as unknown as Record<string, Case>;
const at = (iso: string) => Date.parse(iso);
const NY = { timezone: 'America/New_York', session: '0930-1600' };
const barsOf = (name: string) => cases[name]!.times.map((t) => ({ time: t, open: 1, high: 1, low: 1, close: 1, volume: 1 }));

// The events as a host gives them: dividends and splits at 00:00 UTC of their day, earnings at their release time
// (after the close: 16:30 New York, before the open: 06:55).
const EVENTS: Record<string, SymbolEvents> = {
  'NASDAQ:AAPL': {
    dividends: [{ time: at('2026-02-09'), net: 0.26 }, { time: at('2026-05-11'), net: 0.27 }],
    earnings: [{ time: at('2026-01-29T21:30Z'), actual: 2.84 }, { time: at('2026-04-30T20:30Z'), actual: 2.01 }],
  },
  'NYSE:KO': {
    earnings: [
      { time: at('2025-04-29T10:55Z'), actual: 0.73 }, { time: at('2025-07-22T10:55Z'), actual: 0.87 },
      { time: at('2025-10-21T10:55Z'), actual: 0.82 }, { time: at('2026-02-10T11:55Z'), actual: 0.58 },
    ],
  },
  'NASDAQ:NVDA': {
    splits: [{ time: at('2021-07-20'), numerator: 4, denominator: 1 }, { time: at('2024-06-10'), numerator: 10, denominator: 1 }],
    dividends: [{ time: at('2024-03-05'), net: 0.04 }, { time: at('2024-06-11'), net: 0.01 }],
  },
  'NSE:RELIANCE': {
    splits: [{ time: at('2020-05-14'), numerator: 1009, denominator: 1000 }, { time: at('2024-10-28'), numerator: 2, denominator: 1 }],
    dividends: [{ time: at('2024-08-19'), net: 10 }],
  },
};

const SERIES: Record<string, (t: string) => number[]> = {
  div: (t) => request.dividends(t).toArray(),
  eps: (t) => request.earnings(t).toArray(),
  epsGaps: (t) => request.earnings(t, earnings.actual, barmerge.gaps_on).toArray(),
  epsGapsLook: (t) => request.earnings(t, earnings.actual, barmerge.gaps_on, barmerge.lookahead_on).toArray(),
  splitNum: (t) => request.splits(t, splits.numerator).toArray(),
  splitDen: (t) => request.splits(t, splits.denominator).toArray(),
  splitNumGaps: (t) => request.splits(t, splits.numerator, barmerge.gaps_on).toArray(),
};

function runCase(name: string, tickerid: string, timeframe: string, chart: Partial<ChartContext> = NY): Record<string, number[]> {
  const c = cases[name]!;
  const out: Record<string, number[]> = {};
  executeScript(() => {
    for (const key of Object.keys(c)) if (key !== 'times') out[key] = SERIES[key]!(syminfo.tickerid);
  }, barsOf(name), {}, { tickerid, timeframe, ...chart, events: (s) => EVENTS[s] });
  return out;
}

function expected(name: string): Record<string, number[]> {
  const { times: _times, ...values } = cases[name]!;
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, (v as (number | null)[]).map((x) => x ?? NaN)]));
}

/** Values compared at float32 precision (PineScript stores the event values as float32: 0.25999999). */
function rounded(values: Record<string, number[]>): Record<string, number[]> {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.map((x) => (Number.isNaN(x) ? NaN : Math.fround(x)))]));
}

describe('request.dividends / splits / earnings on the reference bars (#211)', () => {
  it.each([
    ['aapl1D', 'NASDAQ:AAPL', '1D'],
    ['aapl60', 'NASDAQ:AAPL', '60'],
    ['ko1D', 'NYSE:KO', '1D'],
    ['ko60', 'NYSE:KO', '60'],
    ['ko1W', 'NYSE:KO', '1W'],
    ['ko1M', 'NYSE:KO', '1M'],
    ['nvda1D', 'NASDAQ:NVDA', '1D'],
  ])('%s', (name, tickerid, tf) => {
    expect(rounded(runCase(name, tickerid, tf))).toEqual(rounded(expected(name)));
  });

  it('rel1D (Asia/Kolkata: the UTC day of the event still ends after the close)', () => {
    const got = runCase('rel1D', 'NSE:RELIANCE', '1D', { timezone: 'Asia/Kolkata', session: '0915-1530' });
    expect(rounded(got)).toEqual(rounded(expected('rel1D')));
  });

  it('UTC periods of the chart timeframe', () => {
    expect(utcPeriod(at('2026-05-11T05:00Z'), '1D')).toEqual([at('2026-05-11'), at('2026-05-12')]);
    expect(utcPeriod(at('2025-07-22T10:55Z'), '1W')).toEqual([at('2025-07-21'), at('2025-07-28')]);
    expect(utcPeriod(at('2025-07-22T10:55Z'), '1M')).toEqual([at('2025-07-01'), at('2025-08-01')]);
    expect(utcPeriod(at('2026-04-30T20:30Z'), '60')).toEqual([at('2026-04-30T20:00Z'), at('2026-04-30T21:00Z')]);
  });
});

describe('events: missing, unknown fields, the future values', () => {
  const chart = (events: ChartContext['events'], now?: number): ChartContext => ({ tickerid: 'NASDAQ:AAPL', timeframe: '1D', ...NY, events, now });

  it('events not given yet: a MissingSymbolDataError with an events request', () => {
    let error: unknown;
    try {
      executeScript(() => { request.dividends('NASDAQ:MSFT'); }, barsOf('aapl1D'), {}, chart(undefined));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(MissingSymbolDataError);
    expect((error as MissingSymbolDataError).requests).toEqual([{ symbol: 'NASDAQ:MSFT', timeframe: '', events: true }]);
  });

  it('a field the host does not have throws; a symbol without events gives na', () => {
    const bars = barsOf('aapl1D');
    expect(() => executeScript(() => { request.earnings('', earnings.estimate); }, bars, {}, chart((s) => EVENTS[s]))).toThrow('estimate values');
    let v: number[] = [];
    executeScript(() => { v = request.splits('NASDAQ:AAPL', splits.numerator).toArray(); }, bars, {}, chart((s) => EVENTS[s]));
    expect(v.every(Number.isNaN)).toBe(true);
    expect(() => executeScript(() => { request.splits('', 'ratio'); }, bars, {}, chart(() => ({})))).toThrow('splits.numerator');
  });

  it('dividends.future_* and earnings.future_*: the first announced event after now', () => {
    const events: SymbolEvents = {
      dividends: [{ time: at('2026-05-11'), net: 0.27 }, { time: at('2026-08-10'), net: 0.28, payDate: at('2026-08-13') }],
      earnings: [{ time: at('2026-04-30T20:30Z'), actual: 2.01 }, { time: at('2026-07-30T20:30Z'), estimate: 1.9, periodEnd: at('2026-06-27') }],
      future: { dividends: true, earnings: true },
    };
    let out: number[] = [];
    let eps: number[] = [];
    executeScript(() => {
      out = [
        dividends.future_amount, dividends.future_ex_date, dividends.future_pay_date, earnings.future_eps,
        earnings.future_time, earnings.future_period_end_time, earnings.future_revenue,
      ];
      eps = request.earnings('').toArray();
    }, barsOf('aapl1D'), {}, chart(() => events, at('2026-06-01')));
    expect(out).toEqual([0.28, at('2026-08-10'), at('2026-08-13'), 1.9, at('2026-07-30T20:30Z'), at('2026-06-27'), NaN]);
    // the release to come is not a value yet
    expect(eps[eps.length - 1]).toBe(2.01);
    expect(() => executeScript(() => { void earnings.future_time; }, barsOf('aapl1D'), {}, chart(() => EVENTS['NASDAQ:AAPL']))).toThrow('announced earnings');
  });
});

describe('syminfo fields (#211)', () => {
  it('given, none (na) and not known', () => {
    let out: unknown[] = [];
    executeScript(() => {
      out = [
        syminfo.sector, syminfo.industry, syminfo.employees, syminfo.basecurrency, na(syminfo.basecurrency), syminfo.isin,
        syminfo.target_price_average, syminfo.recommendations_total, syminfo.country, syminfo.volumetype, syminfo.expiration_date,
      ];
    }, [], {}, {
      tickerid: 'NASDAQ:AAPL', sector: 'Electronic Technology', industry: 'Telecommunications Equipment', employees: 167000,
      basecurrency: null, isin: null, targetPrice: null,
      recommendations: { buy: 8, buy_strong: 21, hold: 13, sell: 3, sell_strong: 4, total: 49, date: 1795305600000 },
      country: 'US', volumetype: 'n/a', expirationDate: null,
    });
    expect(out).toEqual(['Electronic Technology', 'Telecommunications Equipment', 167000, '', true, '', NaN, 49, 'US', 'n/a', NaN]);
    expect(() => executeScript(() => { void syminfo.shareholders; }, [], {}, { tickerid: 'NASDAQ:AAPL' })).toThrow('syminfo.shareholders is not known');
    expect(() => executeScript(() => { void syminfo.isin; }, [], {}, { tickerid: 'NASDAQ:AAPL' })).toThrow('syminfo.isin is not known');
  });

  it.each([
    ['NASDAQ:AAPL', 'stock', 'AAPL', 'NASDAQ', 'AAPL'],
    ['BINANCE:BTCUSDT.P', 'crypto', 'BTCUSDT.P', 'BINANCE', 'BTCUSDT.P'],
    ['CME_MINI:ES1!', 'futures', 'ES1!', 'CME_MINI', 'ES'],
    ['CME_MINI:ESZ2026', 'futures', 'ESZ2026', 'CME_MINI', 'ES'],
    ['NSE:NIFTY1!', 'futures', 'NIFTY1!', 'NSE', 'NIFTY'],
    ['NYSE:BRK.B', 'stock', 'BRK.B', 'NYSE', 'BRK.B'],
  ])('%s: ticker, prefix and root from the ticker id', (tickerid, symbolType, ticker, prefix, root) => {
    let out: string[] = [];
    executeScript(() => { out = [syminfo.ticker, syminfo.prefix, syminfo.root, syminfo.main_tickerid]; }, [], {}, { tickerid, symbolType });
    expect(out).toEqual([ticker, prefix, root, tickerid]);
  });

  it('inside request.security: the requested symbol, its fields; main_tickerid stays the chart symbol', () => {
    const bars = barsOf('aapl1D');
    let seen: string[] = [];
    executeScript(() => {
      request.security('NYSE:KO', '1D', () => {
        seen = [syminfo.tickerid, syminfo.ticker, syminfo.main_tickerid, syminfo.sector, syminfo.description];
        return 0;
      });
    }, bars, {}, {
      tickerid: 'NASDAQ:AAPL', timeframe: '1D', ...NY, sector: 'Electronic Technology',
      bars: () => bars,
      symbolInfo: () => ({ ...NY, sector: 'Consumer Non-Durables', description: 'Coca-Cola Company (The)' }),
    });
    expect(seen).toEqual(['NYSE:KO', 'KO', 'NASDAQ:AAPL', 'Consumer Non-Durables', 'Coca-Cola Company (The)']);
  });

  it('a field read inside request.security before the bars are given: the run waits for the data', () => {
    let error: unknown;
    try {
      executeScript(() => {
        request.security('NYSE:KO', '1D', () => (syminfo.sector === '' ? 0 : 1));
      }, barsOf('aapl1D'), {}, { tickerid: 'NASDAQ:AAPL', timeframe: '1D', ...NY, bars: () => undefined });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(MissingSymbolDataError);
    expect((error as MissingSymbolDataError).requests).toEqual([{ symbol: 'NYSE:KO', timeframe: '1D' }]);
  });

  it('na("") is true, as in PineScript', () => {
    let v = false;
    executeScript(() => { v = na(''); }, [], {}, {});
    expect(v).toBe(true);
  });
});
