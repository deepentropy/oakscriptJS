import { taCore as ta } from '../../src';

describe('ta.cci', () => {
  it('keeps the previous CCI when the mean deviation is 0 (flat window) (#125)', () => {
    // PineScript (two equal closes, 11.7 and 11.7): the CCI of the previous bar
    const cci = ta.cci([1, 2, 3, 3, 3, 4], 2);
    expect(cci[0]).toBeNaN();
    expect(cci[3]).toBe(cci[2]);
    expect(cci[4]).toBe(cci[2]);
    expect(cci[5]).toBeCloseTo(66.6666666667, 9);
  });

  it('uses the 1e-10 tolerance and gives 0 when the first window is flat', () => {
    expect(ta.cci([3.3, 3.3, 3.5], 2)).toEqual([NaN, 0, expect.any(Number)]);
    const cci = ta.cci([3.1, 3.2, 3.3, 3.3 + 1e-11], 2);
    expect(cci[3]).toBe(cci[2]);
  });

  it('matches PineScript on a flat window (BTCUSD 1D, ta.cci(fl, 3))', () => {
    // fl = bar_index % 10 < 6 ? 3.0 : close. Flat first window: 0. Later flat windows: the last value (the running
    // sum mean of [3, 3, 3] is not exactly 3 there, so the window before gives -49.99999999999999)
    const fl = [3, 3, 3, 3, 3, 3, 10, 8, 8.22, 8.88, 3, 3, 3, 3, 3, 3];
    expect(ta.cci(fl, 3)).toEqual([
      NaN, NaN, 0, 0, 0, 0, 100.00000000000001, 25.000000000000004, -41.269841269841244, 100, -99.99999999999999,
      -49.99999999999999, -49.99999999999999, -49.99999999999999, -49.99999999999999, -49.99999999999999,
    ]);
  });
});
