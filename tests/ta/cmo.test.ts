import { taCore as ta } from '../../src';

describe('ta.cmo', () => {
  it('is na on a flat window (0 / 0), as PineScript (#127)', () => {
    // PineScript: 100 * (sm1 - sm2) / (sm1 + sm2); closes 11.7, 11.7 give na with length 1
    expect(ta.cmo([10, 11.7, 11.7, 12], 1)).toEqual([NaN, 100, NaN, 100]);
    expect(ta.cmo([5, 5, 5, 5, 6], 3)).toEqual([NaN, NaN, NaN, NaN, 100]);
  });

  it('is the percentage of up minus down changes otherwise', () => {
    expect(ta.cmo([10, 11, 10.5, 12], 3)[3]).toBeCloseTo((100 * (2.5 - 0.5)) / 3, 12);
  });
});
