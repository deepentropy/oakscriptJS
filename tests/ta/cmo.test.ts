import { taCore as ta, math } from '../../src';

describe('ta.cmo', () => {
  it('is na on a flat window (0 / 0), as PineScript (#127)', () => {
    // PineScript: 100 * (sm1 - sm2) / (sm1 + sm2); closes 11.7, 11.7 give na with length 1
    // 100 * (sm1 - sm2) / (sm1 + sm2) left to right: 100 * 1.6999999999999993 / 1.6999999999999993 = 100.00000000000001
    expect(ta.cmo([10, 11.7, 11.7, 12], 1)).toEqual([NaN, 100.00000000000001, NaN, 100]);
    expect(ta.cmo([5, 5, 5, 5, 6], 3)).toEqual([NaN, NaN, NaN, NaN, 100]);
  });

  it('is the percentage of up minus down changes otherwise', () => {
    expect(ta.cmo([10, 11, 10.5, 12], 3)[3]).toBeCloseTo((100 * (2.5 - 0.5)) / 3, 12);
  });

  it('uses the running sums of math.sum (#132): equal to the PineScript formula bit for bit', () => {
    const src = [10, 10.4, 10.1, 10.9, 10.6, 10.6, 11.3, 10.8, 11.1, 10.7, 11.5, 11.2];
    const mom = src.map((v, i) => (i > 0 ? v - src[i - 1]! : NaN));
    const sm1 = math.sum(mom.map((m) => (m >= 0 ? m : 0)), 4);
    const sm2 = math.sum(mom.map((m) => (m >= 0 ? 0 : -m)), 4);
    expect(ta.cmo(src, 4)).toEqual(sm1.map((s1, i) => (100 * (s1 - sm2[i]!)) / (s1 + sm2[i]!)));
  });
});
