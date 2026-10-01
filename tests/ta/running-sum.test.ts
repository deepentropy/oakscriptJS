/**
 * Compensated running sums of math.sum / ta.sma / ta.stdev / ta.variance / ta.mfi, bit for bit with PineScript (#114).
 * Expected values are PineScript outputs (full precision) for the same inputs.
 */
import { math, taCore } from '../../src';

const na = NaN;
const toNum = (a: Array<number | null>): number[] => a.map((v) => (v === null ? NaN : v));

// Daily BTCUSD "buy proxy" ((close - low) / (high - low) * volume, 0 when high == low), first 30 bars
const BUY_PROXY = [
  0, 1.4862174222857134, 0, 0, 0, 0, 0, 0, 159.64235294117648, 79.76, 0, 0, 0, 0, 53.36812103314281,
  3.057299181000204, 43.409597399999925, 28.510004857142643, 0, 119.8128, 0, 89.28071068, 0, 43.77842238,
  20.68003681, 0, 0, 0, 24.3545, 0,
];
const PINE_SMA_2 = toNum([
  null, 0.7431087111428567, 0.7431087111428567, 0, 0, 0, 0, 0, 79.82117647058824, 119.70117647058825,
  39.879999999999995, -7.105427357601002e-15, -7.105427357601002e-15, -7.105427357601002e-15, 26.6840605165714,
  28.2127101070715, 23.233448290500064, 35.959801128571286, 14.255002428571323, 59.9064, 59.9064, 44.64035534,
  44.64035534, 21.88921119, 32.229229595, 10.340018405000002, 1.7763568394002505e-15, 1.7763568394002505e-15,
  12.177250000000003, 12.177250000000003,
]);
const PINE_STDEV_2 = toNum([
  null, 0.7431087111428567, 0.7431087111428567, 0, 0, 0, 0, 0, 79.82117647058824, 39.94117647058824,
  39.879999999999995, 0, 0, 0, 26.684060516571396, 25.155410926071294, 20.17614910949986, 7.449796271428638,
  14.255002428571322, 59.9064, 59.9064, 44.64035534, 44.64035534, 21.88921119, 11.549192784999999,
  10.340018404999999, 1.685873940435761e-7, 1.685873940435761e-7, 12.177249999999999, 12.177249999999999,
]);

// Daily AAPL closes, first 16 bars
const AAPL_CLOSE = [
  0.128348, 0.121652, 0.112723, 0.115513, 0.118861, 0.126116, 0.132254, 0.137835, 0.145089, 0.158482, 0.160714,
  0.156808, 0.152344, 0.154018, 0.150669, 0.143973,
];
const warm = (n: number, values: number[]): number[] => [...new Array<number>(n).fill(na), ...values];

/** Repeat a 30-bar pattern (value per bar index of the period) and return the last period of math.sum(x, 2). */
function lastPeriodSum2(pattern: Record<number, number>): number[] {
  const period = Array.from({ length: 30 }, (_, k) => pattern[k] ?? 0);
  const x = Array.from({ length: 40 * 30 }, (_, i) => period[i % 30]!);
  return math.sum(x, 2).slice(-30);
}

describe('PineScript running sums (#114)', () => {
  it('ta.sma: residues of the running sum, as PineScript (window [0, 0] is not exactly 0)', () => {
    expect(taCore.sma(BUY_PROXY, 2)).toEqual(PINE_SMA_2);
  });

  it('ta.stdev: from running sums of x and x^2, as PineScript (non-zero on a window [0, 0])', () => {
    expect(taCore.stdev(BUY_PROXY, 2)).toEqual(PINE_STDEV_2);
  });

  it('math.sum: compensated sum (0.1, 0.2 then the 0.1 leaves gives exactly 0.2)', () => {
    expect(math.sum([0.1, 0.2, 0, 0], 2)).toEqual([na, 0.30000000000000004, 0.2, 0]);
  });

  it('ta.variance / ta.stdev biased and unbiased, as PineScript', () => {
    expect(taCore.variance(AAPL_CLOSE, 10)).toEqual(warm(9, [
      0.0001824341056099986, 0.0002680447648899971, 0.0003000247718500035, 0.000253374610240005,
      0.0001951446538899955, 0.00012467402988999843, 0.00007724137363999961,
    ]));
    expect(taCore.variance(AAPL_CLOSE, 10, false)).toEqual(warm(9, [
      0.00020270456178889118, 0.00029782751654444314, 0.0003333608576111119, 0.000281527344711114,
      0.00021682739321110533, 0.0001385266998777772, 0.00008582374848888422,
    ]));
    expect(taCore.stdev(AAPL_CLOSE, 10, false)).toEqual(warm(9, [
      0.014237435225099048, 0.01725767992936603, 0.01825817235133659, 0.016778776615448278, 0.014725060041001712,
      0.01176973661038246, 0.00926411077701925,
    ]));
  });

  it('resync: the sum is taken again from the window when the compensation is lost', () => {
    // residue maker (159.64.., 79.76), then A, B, C on consecutive bars: on the bar where C enters and A leaves,
    // the compensation of B's add is lost, the sum becomes B + C and the residue disappears
    const sums = lastPeriodSum2({ 0: 159.64235294117648, 1: 79.76, 6: 53.36812103314281, 7: 3.057299181000204, 8: 43.409597399999925 });
    expect(sums.slice(0, 13)).toEqual([
      159.64235294117648, 239.4023529411765, 79.75999999999999, -1.4210854715202004e-14, -1.4210854715202004e-14,
      -1.4210854715202004e-14, 53.3681210331428, 56.425420214143, 46.46689658100013, 43.409597399999925, 0,
      4.440892098500626e-16, 4.440892098500626e-16,
    ]);
    // the loss is measured on the grid of the new value: 1.0 (lost) and 4.0 (not lost) after the same history
    const one = lastPeriodSum2({ 0: 159.64235294117648, 1: 79.76, 6: 53.36812103314281, 7: 0.1, 8: 1 });
    expect(one.slice(7, 13)).toEqual([53.4681210331428, 1.1, 1, 1.1102230246251565e-16, 2.7755575615628914e-17, 2.7755575615628914e-17]);
    const four = lastPeriodSum2({ 0: 159.64235294117648, 1: 79.76, 6: 53.36812103314281, 7: 0.1, 8: 4 });
    expect(four.slice(7, 13)).toEqual([
      53.4681210331428, 4.099999999999987, 3.999999999999987, -1.2878587085651816e-14, -1.2961853812498703e-14,
      -1.2961853812498703e-14,
    ]);
  });

  it('na and +/-Infinity are skipped; the bar keeps the previous result', () => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8];
    const withInf = base.map((v, i) => (i === 4 ? Infinity : i === 5 ? -Infinity : v));
    const withNa = base.map((v, i) => (i === 4 || i === 5 ? NaN : v));
    expect(math.sum(withInf, 3)).toEqual(math.sum(withNa, 3));
    expect(math.sum(withNa, 3)).toEqual([na, na, 6, 9, 9, 9, 14, 19]);
    expect(taCore.variance(withInf, 3)).toEqual(taCore.variance(withNa, 3));
    expect(taCore.stdev(withInf, 3)).toEqual(taCore.stdev(withNa, 3));
    expect(taCore.sma(withInf, 3)).toEqual(taCore.sma(withNa, 3));
  });
});
