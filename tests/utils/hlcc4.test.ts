/**
 * hlcc4 = (high + low + 2 * close) / 4, as PineScript (#189): summing close twice differs in the last bits.
 */
import { getSource, getSourceSeries } from '../../src';

describe('hlcc4', () => {
  const bar = { time: 0, open: 8.5, high: 8.88, low: 8.0, close: 8.88, volume: 1 };
  it('getSource (bars and OHLC arrays)', () => {
    expect(getSource([bar], 'hlcc4')).toEqual([8.66]);
    expect(getSource({ open: [8.5], high: [8.88], low: [8.0], close: [8.88] }, 'hlcc4')).toEqual([8.66]);
  });
  it('getSourceSeries', () => {
    expect(getSourceSeries([bar], 'hlcc4').toArray()).toEqual([8.66]);
  });
});
