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

  it('uses the 1e-10 tolerance and gives na when the first value has a flat window', () => {
    expect(ta.cci([3.3, 3.3, 3.5], 2)).toEqual([NaN, NaN, expect.any(Number)]);
    const cci = ta.cci([3.1, 3.2, 3.3, 3.3 + 1e-11], 2);
    expect(cci[3]).toBe(cci[2]);
  });
});
