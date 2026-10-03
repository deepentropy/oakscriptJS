/**
 * ta.wma sum as PineScript (#136): a partial sum that cancels to a tiny residue is 0.
 * Expected values are PineScript outputs (full precision) for the same inputs.
 */
import { taCore } from '../../src';

const na = NaN;

describe('ta.wma partial sums (#136)', () => {
  it('a cancellation residue in the oldest-first sum is 0 (1.55 - 1.55 on the 4th value)', () => {
    const window = [
      0.36699729486023464, 0.44995491433723744, 0.09467989179440549, -0.38773669972948793, -0.355275022542832,
      -3.2110009017132635, -3.019837691614077, 0.2863663425282791, 0.24568366739432423, 0.19626910101210535,
      0.1543957134352049, -0.22603691208573165, 0.02520341337566942, 0.0930740226235364, 0.36753883892068684,
      0.4569364949577542, 0.4418097574270917, 0.8167151547209731, 0.8394604601957156, 0.7892092039143084,
      0.41507798960138753,
    ];
    // plain sum: 0.17483288638087413
    expect(taCore.wma(window, 21)[20]).toBe(0.17483288638087427);
  });

  it('the sum is 0 when |s + t| <= 1e-10 * max(1, |s| + |t|)', () => {
    // 1 + 2 * x: 1.9979995435903675e-10 is below 1e-10 * 1.9999999998 (0), 2.000000165480742e-10 is above
    expect(taCore.wma([1, -0.4999999999001], 2)).toEqual([na, 0]);
    expect(taCore.wma([1, -0.4999999999], 2)).toEqual([na, 6.66666721826914e-11]);
  });

  it('values below 1e-10 are 0 in the sum', () => {
    const tiny = [5e-11, 2e-10, 1.2e-10, 5e-11];
    expect(taCore.wma(tiny, 1)).toEqual([0, 2e-10, 1.2e-10, 0]);
    expect(taCore.wma(tiny, 2)).toEqual([na, 1.3333333333333334e-10, 1.4666666666666668e-10, 7.333333333333334e-11]);
  });
});
