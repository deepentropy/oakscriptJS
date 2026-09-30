import { timeframe } from '../../src';

// Expected values: PineScript reference examples and PineScript results

describe('timeframe.in_seconds', () => {
  it.each([
    ['1', 60],
    ['60', 3600],
    ['240', 14400],
    ['1440', 86400],
    ['30S', 30],
    ['S', 1],
    ['D', 86400],
    ['1D', 86400],
    ['W', 604800],
    ['2W', 1209600],
    ['M', 2628003],
    ['3M', 7884009],
    ['12M', 31536036],
    // any multiplier, as in PineScript
    ['7S', 7],
    ['1441', 86460],
    ['0', 0],
    ['05', 300],
    ['13M', 34164039],
    ['366D', 31622400],
    ['53W', 32054400],
    ['S5', 5],
    ['1M ', 2628003],
  ])('%s', (tf, seconds) => {
    expect(timeframe.in_seconds(tf)).toBe(seconds);
  });

  it('returns NaN for tick timeframes', () => {
    expect(timeframe.in_seconds('1T')).toBeNaN();
    expect(timeframe.in_seconds('1000T')).toBeNaN();
  });

  it('rejects the chart timeframe and strings that are not timeframes', () => {
    for (const tf of ['', '1H', '1d', 'abc', '1D1']) {
      expect(() => timeframe.in_seconds(tf)).toThrow(RangeError);
    }
  });
});

describe('timeframe.from_seconds', () => {
  it.each([
    [0, '1S'],
    [1, '1S'],
    [2, '5S'],
    [5, '5S'],
    [16, '30S'],
    [30, '30S'],
    [31, '1'],
    [45, '1'],
    [46, '1'],
    [60, '1'],
    [90, '2'],
    [3600, '60'],
    [14400, '240'],
    [86399, '1440'],
    [86400, '1D'],
    [86401, '2D'],
    [604799, '7D'],
    [604800, '1W'],
    [1209600, '2W'],
    [2592000, '30D'],
    [2628000, '31D'],
    [2628003, '1M'],
    [2628004, '31D'],
    [26280000, '305D'],
    [26280030, '10M'],
    [31449600, '52W'],
    [31535999, '365D'],
    [31536000, '12M'],
    [31536036, '12M'],
    [31622401, '12M'],
  ])('%d seconds is "%s"', (seconds, tf) => {
    expect(timeframe.from_seconds(seconds)).toBe(tf);
  });

  it('round-trips valid timeframes', () => {
    for (const tf of ['1', '5', '15', '45', '120', '1439', '5S', '3D', '1W', '52W', '6M']) {
      expect(timeframe.from_seconds(timeframe.in_seconds(tf))).toBe(tf);
    }
  });

  it('uses the larger unit for equal durations', () => {
    expect(timeframe.from_seconds(timeframe.in_seconds('1440'))).toBe('1D');
    expect(timeframe.from_seconds(timeframe.in_seconds('7D'))).toBe('1W');
  });
});
