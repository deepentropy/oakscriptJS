/**
 * Chart context (issue #100, step 1). Expected values: PineScript results of the same code.
 */
import {
  executeScript,
  hour,
  dayofweek,
  str,
  syminfo,
  timeframe,
  timestamp,
  close,
  math,
  type ChartContext,
} from '../../src/script';
import type { Bar } from '../../src/types';

const BARS: Bar[] = [0, 1, 2].map((i) => ({
  time: Date.UTC(2024, 0, 2, 14 + i, 30),
  open: 1,
  high: 2,
  low: 1,
  close: 1.5,
  volume: 1,
}));

function run<T>(chart: ChartContext, fn: () => T): T {
  let out: T | undefined;
  executeScript(() => {
    out = fn();
  }, BARS, {}, chart);
  return out as T;
}

describe('timeframe.* from the chart timeframe', () => {
  // period, multiplier, isintraday, isdaily, isweekly, ismonthly, isminutes, isseconds, isticks, isdwm, in_seconds()
  it.each([
    ['1S', '1S', 1, true, false, false, false, false, true, false, false, 1],
    ['30S', '30S', 30, true, false, false, false, false, true, false, false, 30],
    ['1', '1', 1, true, false, false, false, true, false, false, false, 60],
    ['5', '5', 5, true, false, false, false, true, false, false, false, 300],
    ['60', '60', 60, true, false, false, false, true, false, false, false, 3600],
    ['240', '240', 240, true, false, false, false, true, false, false, false, 14400],
    ['1D', '1D', 1, false, true, false, false, false, false, false, true, 86400],
    ['D', '1D', 1, false, true, false, false, false, false, false, true, 86400],
    ['3D', '3D', 3, false, true, false, false, false, false, false, true, 259200],
    ['1W', '1W', 1, false, false, true, false, false, false, false, true, 604800],
    ['2W', '2W', 2, false, false, true, false, false, false, false, true, 1209600],
    ['1M', '1M', 1, false, false, false, true, false, false, false, true, 2628003],
    ['3M', '3M', 3, false, false, false, true, false, false, false, true, 7884009],
    ['12M', '12M', 12, false, false, false, true, false, false, false, true, 31536036],
  ] as const)('%s', (tf, ...expected) => {
    expect(run({ timeframe: tf }, () => [
      timeframe.period, timeframe.multiplier, timeframe.isintraday, timeframe.isdaily, timeframe.isweekly,
      timeframe.ismonthly, timeframe.isminutes, timeframe.isseconds, timeframe.isticks, timeframe.isdwm,
      timeframe.in_seconds(),
    ])).toEqual(expected);
    expect(run({ timeframe: tf }, () => [timeframe.main_period, timeframe.in_seconds('')])).toEqual([expected[0], expected[10]]);
  });

  it('throws when the caller did not give the chart timeframe', () => {
    expect(() => run({}, () => timeframe.period)).toThrow('chart timeframe is not known');
    expect(run({}, () => timeframe.in_seconds('60'))).toBe(3600);
  });
});

describe('exchange time zone defaults', () => {
  const NY: ChartContext = { timeframe: '60', timezone: 'America/New_York' };

  it('syminfo.timezone and syminfo.session', () => {
    expect(run(NY, () => [syminfo.timezone, syminfo.session])).toEqual(['America/New_York', 'regular']);
    expect(run({ ...NY, sessionType: 'extended' }, () => syminfo.session)).toBe('extended');
  });

  it('syminfo.mintick, pointvalue and mincontract; math.round_to_mintick uses syminfo.mintick', () => {
    const sym: ChartContext = { mintick: 0.25, pointvalue: 50, mincontract: 1 };
    expect(run(sym, () => [syminfo.mintick, syminfo.pointvalue, syminfo.mincontract])).toEqual([0.25, 50, 1]);
    expect(run(sym, () => [math.round_to_mintick(10.1), math.round_to_mintick(10.125), math.round_to_mintick(10.3, 0.5)])).toEqual([10, 10.25, 10.5]);
    expect(run(sym, () => math.round_to_mintick(close).toArray())).toEqual([1.5, 1.5, 1.5]);
    expect(() => run({}, () => syminfo.mintick)).toThrow('syminfo.mintick is not known');
    expect(() => run({}, () => math.round_to_mintick(1.2))).toThrow('syminfo.mintick is not known');
    expect(run({}, () => math.sqrt(4))).toBe(2);
  });

  it('calendar functions, timestamp and str.format_time use the exchange time zone', () => {
    const t = Date.UTC(2024, 0, 2, 14, 30);
    expect(run(NY, () => [hour(t), hour(t, 'UTC'), dayofweek(t)])).toEqual([9, 14, 3]);
    expect(run(NY, () => timestamp(2024, 1, 2, 9, 30))).toBe(t);
    expect(run(NY, () => str.format_time(t, 'HH:mm Z'))).toBe('09:30 -0500');
    expect(run({ timezone: 'Etc/UTC' }, () => str.format_time(t, 'HH:mm Z'))).toBe('14:30 +0000');
    expect(run(NY, () => str.format('{0,date,HH:mm}', t))).toBe('09:30');
  });

  it('calendar functions accept a Series of times', () => {
    const times = run(NY, () => hour(close.mul(0).add(Date.UTC(2024, 0, 2, 14, 30))).toArray());
    expect(times).toEqual([9, 9, 9]);
  });

  it('throws when the caller did not give the time zone, only when it is needed', () => {
    expect(() => run({}, () => hour(0))).toThrow('exchange time zone is not known');
    expect(run({}, () => hour(0, 'UTC'))).toBe(0);
    expect(run({}, () => str.format('{0}', 1.5))).toBe('1.5');
  });
});
