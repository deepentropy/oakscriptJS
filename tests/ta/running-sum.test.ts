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

describe('ta.ema seed (#136)', () => {
  it('the first value is ta.sma on that bar (running sum), not a plain loop sum', () => {
    // plain sum: (0.1 + 0.2 + 0.3) / 3 = 0.20000000000000004; running sum: 0.19999999999999998
    expect(taCore.ema([0.1, 0.2, 0.3], 3)[2]).toBe(0.19999999999999998);
    const x = [NaN, 1e-16, 1, Infinity, -1, 0.1, 0.2];
    expect(taCore.ema(x, 3)[4]).toBe(taCore.sma(x, 3)[4]);
  });
});

describe('running sum resync test at a negative power of two (#136)', () => {
  it('rounds on the finer grid toward +infinity: x = -4 after a negative compensation keeps the Kahan step', () => {
    // periodic series of 30 bars; PineScript math.sum(x, 2) on the bars of phase 6 .. 11 (steady state)
    const at: Record<number, number> = { 0: 159.64235294117648, 1: 79.76, 6: 53.36812103314281, 7: 3.057299181000204, 8: -4 };
    const x = Array.from({ length: 41 * 30 }, (_, i) => at[i % 30] ?? 0);
    const sum = math.sum(x, 2);
    const last = 40 * 30;
    expect(sum.slice(last + 6, last + 12)).toEqual([
      53.3681210331428, 56.425420214143, -0.9427008189998105, -4.000000000000014, -1.4654943925052066e-14,
      -1.4210854715202004e-14,
    ]);
  });
});

describe('series length (#140)', () => {
  const lengthAt = (pattern: (i: number) => number, n = 24): number[] => Array.from({ length: n }, (_, i) => pattern(i));
  // PineScript inputs: cy = 0.1, 0.2, 0.3, 0.4, 0.7 repeated; bs = 1e16 every 11 bars, else 0.5, 1 or 3
  const cy = lengthAt((i) => [0.1, 0.2, 0.3, 0.4, 0.7][i % 5]!);
  const bs = lengthAt((i) => (i % 11 === 2 ? 1e16 : i % 11 === 5 ? 1 : i % 11 === 6 ? 3 : 0.5));

  it('math.sum: a length change moves the running sum with Kahan steps of the raw values, as PineScript', () => {
    expect(math.sum(cy, lengthAt((i) => (i % 10 < 5 ? 4 : 2)))).toEqual(toNum([
      null, null, null, 1, 1.6, 0.7999999999999999, 0.3, 0.5, 0.7, 1.0999999999999999, 1.4999999999999998, 1.4,
      1.2999999999999998, 0.9999999999999999, 1.5999999999999999, 0.7999999999999998, 0.2999999999999999,
      0.4999999999999999, 0.6999999999999998, 1.0999999999999999, 1.4999999999999998, 1.4, 1.2999999999999998,
      0.9999999999999999,
    ]));
    expect(math.sum(bs, lengthAt((i) => (i % 10 < 5 ? 2 : 6)))).toEqual(toNum([
      null, 1, 10000000000000000, 10000000000000000, 0.5, 10000000000000002, 10000000000000004, 10000000000000004,
      4.5, 5, 0, 0, 0, 10000000000000000, 10000000000000000, 10000000000000002, 10000000000000002, 10000000000000004,
      10000000000000004, 4.5, -1, -1, -1, -1,
    ]));
    expect(math.sum(bs, lengthAt((i) => (i % 7 === 0 ? 8 : 5)))).toEqual(toNum([
      null, null, null, null, 10000000000000000, 10000000000000002, 10000000000000004, 10000000000000006, 4, 3.5,
      2.5, -1, -2, 9999999999999998, 9999999999999998, 9999999999999996, 9999999999999998, 10000000000000000, 0.5,
      0.5, 0, 0.5, -5, -5,
    ]));
  });

  it('an na bar applies the new length and gives the sum of the last length earlier values', () => {
    // daily BTCUSD closes, na every 9 bars (phase 4); length 3 on the na bars, else 6
    const xa = toNum([
      10.9, 11.69, 11.7, 11.7, null, 10.5, 10, 8, 8.22, 8.88, 8.89, 8, 8.5, null, 5.97, 5.53, 5.13, 4.85, 4.87, 4.92,
      4.9, 5.66, null, 5.72,
    ]);
    expect(math.sum(xa, lengthAt((i) => (i % 9 === 4 ? 3 : 6)))).toEqual(toNum([
      null, null, null, null, 35.089999999999996, null, 66.49, 63.589999999999996, 60.12, 57.3, 54.49,
      51.989999999999995, 50.489999999999995, 25.389999999999993, 48.459999999999994, 45.76999999999999,
      42.019999999999996, 37.97999999999999, 34.84999999999999, 31.26999999999999, 30.19999999999999,
      30.32999999999999, 15.479999999999993, 30.919999999999995,
    ]));
  });

  it('ta.sma / ta.stdev with a series length, as PineScript', () => {
    const xb = toNum([
      null, null, null, null, null, null, 10, null, null, 8.88, 8.89, 8, 8.5, 7.4, 5.97, 5.53, 5.13, 4.85, 4.87, 4.92,
      null, null, 5.66, 5.72,
    ]);
    const lc = lengthAt((i) => 2 + ((i * 7919) % 9));
    expect(taCore.sma(xb, lc)).toEqual(toNum([
      null, null, null, null, null, null, null, null, null, 9.440000000000001, null, null, null, null, 7.94,
      7.080000000000001, 6.007500000000001, 5.170000000000001, 4.860000000000003, 6.406000000000001, 6.13, 5.89625,
      5.275714285714287, 5.191666666666668,
    ]));
    expect(taCore.stdev(xb, lc)).toEqual(toNum([
      null, null, null, null, null, null, null, null, null, 0.5599999999999818, null, null, null, null,
      1.022725117842847, 1.1488951214101288, 0.8570990316176897, 0.279045993819409, 0.00999999999856726,
      1.5381235321000704, 1.3663576886501336, 1.2682856293043763, 0.4119589834942609, 0.364299174976931,
    ]));
  });

  it('a constant series length gives the fixed-length result', () => {
    const x = BUY_PROXY;
    expect(math.sum(x, lengthAt(() => 2, x.length))).toEqual(math.sum(x, 2));
    expect(taCore.sma(x, lengthAt(() => 2, x.length))).toEqual(PINE_SMA_2);
    expect(taCore.variance(x, lengthAt(() => 3, x.length), false)).toEqual(taCore.variance(x, 3, false));
  });

  it('rejects a length below 1 or a length series shorter than the source', () => {
    expect(() => math.sum([1, 2, 3], [2, 0, 2])).toThrow(/length must be at least 1/);
    expect(() => taCore.sma([1, 2, 3], [2, 2])).toThrow(/2 values for 3 bars/);
  });
});
