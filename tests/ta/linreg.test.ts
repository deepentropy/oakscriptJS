/**
 * ta.linreg arithmetic as PineScript (bit for bit). Expected values are PineScript outputs (full precision).
 */
import { taCore } from '../../src';

const na = NaN;
// Daily BTCUSD closes, first 14 bars
const BTC_CLOSE = [10.9, 11.69, 11.7, 11.7, 11.7, 10.5, 10, 8, 8.22, 8.88, 8.89, 8, 8.5, 7.4];
const warm = (n: number, values: number[]): number[] => [...new Array<number>(n).fill(na), ...values];

describe('ta.linreg arithmetic', () => {
  it('constant and alternating series: x = 1 .. length from the oldest value, intercept at x = 1', () => {
    expect(taCore.linreg(new Array<number>(12).fill(0.1), 10, 0)).toEqual(warm(9, [0.10000000000000006, 0.10000000000000006, 0.10000000000000006]));
    expect(taCore.linreg(new Array<number>(4).fill(0.1), 3, 0)).toEqual(warm(2, [0.10000000000000002, 0.10000000000000002]));
    const alt = Array.from({ length: 6 }, (_, i) => (i % 2 === 0 ? 1 : 0.3));
    expect(taCore.linreg(alt, 4, 0)).toEqual(warm(3, [0.4400000000000001, 0.8599999999999998, 0.4400000000000001]));
  });

  it('closes with an offset (positive and negative)', () => {
    expect(taCore.linreg(BTC_CLOSE, 10, 3).slice(9)).toEqual([
      9.717454545454544, 9.455818181818183, 9.068909090909091, 8.84, 8.469272727272728,
    ]);
    expect(taCore.linreg(BTC_CLOSE, 3, 1).slice(2, 8)).toEqual([
      11.430000000000001, 11.696666666666667, 11.699999999999998, 11.299999999999997, 10.733333333333333, 9.5,
    ]);
    expect(taCore.linreg(BTC_CLOSE, 3, -2).slice(2, 6)).toEqual([12.62999999999999, 11.711666666666654, 11.699999999999998, 9.5]);
  });
});
