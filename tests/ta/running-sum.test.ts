/**
 * Window sums of math.sum / ta.sma / ta.stdev / ta.variance: the correctly rounded sum of the window values, bit for bit
 * with PineScript (reference runs of 05/11/2026, #188). Expected values are PineScript outputs (full precision) for the
 * same inputs. (The compensated running sums of #114 / #136 / #142 matched the reference of October 2026; it no longer
 * gives them.)
 */
import { math, taCore } from '../../src';

const na = NaN;
const toNum = (a: Array<number | null>): number[] => a.map((v) => (v === null ? NaN : v));

// Daily BTCUSD "buy proxy" ((close - low) / (high - low) * volume, 0 when high == low), first 30 bars
const BUY_PROXY: number[] = [
  0, 1.4862174222857134, 0, 0, 0, 0, 0, 0, 159.64235294117648, 79.76, 0, 0, 0, 0, 53.36812103314281,
  3.057299181000204, 43.409597399999925, 28.510004857142643, 0, 119.8128, 0, 89.28071068, 0, 43.77842238,
  20.68003681, 0, 0, 0, 24.3545, 0,
];
const PINE_SMA_2 = toNum([
  null, 0.7431087111428567, 0.7431087111428567, 0, 0, 0, 0, 0, 79.82117647058824, 119.70117647058825, 39.88, 0, 0, 0,
  26.684060516571407, 28.21271010707151, 23.233448290500064, 35.959801128571286, 14.255002428571322, 59.9064,
  59.9064, 44.64035534, 44.64035534, 21.88921119, 32.229229595, 10.340018405, 0, 0, 12.17725, 12.17725,
]);
const PINE_SUM_2 = toNum([
  null, 1.4862174222857134, 1.4862174222857134, 0, 0, 0, 0, 0, 159.64235294117648, 239.4023529411765, 79.76, 0, 0, 0,
  53.36812103314281, 56.42542021414302, 46.46689658100013, 71.91960225714257, 28.510004857142643, 119.8128, 119.8128,
  89.28071068, 89.28071068, 43.77842238, 64.45845919, 20.68003681, 0, 0, 24.3545, 24.3545,
]);
const PINE_STDEV_2 = toNum([
  null, 0.7431087111428567, 0.7431087111428567, 0, 0, 0, 0, 0, 79.82117647058824, 39.94117647058824, 39.88, 0, 0, 0,
  26.684060516571407, 25.155410926071305, 20.17614910949986, 7.449796271428638, 14.255002428571322, 59.9064, 59.9064,
  44.64035534, 44.64035534, 21.88921119, 11.549192784999999, 10.340018405, 0, 0, 12.17725, 12.17725,
]);

// Daily AAPL closes, first 16 bars
const AAPL_CLOSE: number[] = [
  0.128348, 0.121652, 0.112723, 0.115513, 0.118861, 0.126116, 0.132254, 0.137835, 0.145089, 0.158482, 0.160714,
  0.156808, 0.152344, 0.154018, 0.150669, 0.143973,
];

// Daily BTCUSD closes, first 24 bars
const BTC_CLOSE: number[] = [
  10.9, 11.69, 11.7, 11.7, 11.7, 10.5, 10, 8, 8.22, 8.88, 8.89, 8, 8.5, 7.4, 5.97, 5.53, 5.13, 4.85, 4.87, 4.92, 4.9,
  5.66, 5.66, 5.72,
];

/** Correctly rounded sum (the exact sum of the doubles, rounded once, half to even): the oracle of the tests. */
function exactSum(xs: number[]): number {
  // exact as a BigInt multiple of 2^-1074 (the smallest double), then one rounding to 53 bits
  let total = 0n;
  const view = new DataView(new ArrayBuffer(8));
  for (const x of xs) {
    if (x === 0) continue;
    view.setFloat64(0, x);
    const bits = view.getBigUint64(0);
    const exp = Number((bits >> 52n) & 0x7ffn);
    const mant = (bits & 0xfffffffffffffn) | (exp === 0 ? 0n : 1n << 52n);
    const scaled = mant << BigInt(Math.max(exp, 1) - 1);
    total += x < 0 ? -scaled : scaled;
  }
  if (total === 0n) return 0;
  const neg = total < 0n;
  let m = neg ? -total : total;
  let e = -1074;
  const bitsLen = m.toString(2).length;
  if (bitsLen > 53) {
    const drop = BigInt(bitsLen - 53);
    const rest = m & ((1n << drop) - 1n);
    const half = 1n << (drop - 1n);
    m >>= drop;
    if (rest > half || (rest === half && (m & 1n) === 1n)) m += 1n;
    e += Number(drop);
  }
  const v = Number(m) * 2 ** e;
  return neg ? -v : v;
}

describe('PineScript window sums (#188)', () => {
  it('ta.sma / math.sum / ta.stdev: correctly rounded window sums (a window [0, 0] gives exactly 0)', () => {
    expect(taCore.sma(BUY_PROXY, 2)).toEqual(PINE_SMA_2);
    expect(math.sum(BUY_PROXY, 2)).toEqual(PINE_SUM_2);
    expect(taCore.stdev(BUY_PROXY, 2)).toEqual(PINE_STDEV_2);
  });

  it('math.sum: 0.1, 0.2 then the 0.1 leaves gives exactly 0.2', () => {
    expect(math.sum([0.1, 0.2, 0, 0], 2)).toEqual([na, 0.30000000000000004, 0.2, 0]);
  });

  it('ta.variance: biased sumSq / n - mean^2, unbiased (sumSq - mean * sum) / (n - 1); ta.stdev of them', () => {
    expect(taCore.variance(AAPL_CLOSE, 5)).toEqual(toNum([
      null, null, null, null, 0.000029023589040000353, 0.000021849226799999788, 0.00005119471464000436,
      0.00006801372776000028, 0.00008253672679999977, 0.00012498508135999967, 0.00012498508135999273,
      0.00007784925863999273, 0.00003056732944000176, 0.000009042010559998093, 0.000012530983839999232,
      0.000018510869040002514,
    ]));
    expect(taCore.variance(AAPL_CLOSE, 5, false)).toEqual(toNum([
      null, null, null, null, 0.00003627948630000044, 0.000027311533499999735, 0.00006399339330000198,
      0.00008501715970000295, 0.0001031709084999971, 0.00015623135169999872, 0.00015623135169999525,
      0.00009731157329999351, 0.000038209161799997865, 0.000011302513199997616, 0.000015663729799997306,
      0.00002313858630000401,
    ]));
    expect(taCore.stdev(AAPL_CLOSE, 5, false)).toEqual(toNum([
      null, null, null, null, 0.006023245495577981, 0.0052260437713436475, 0.007999587070593206, 0.00922047502572416,
      0.010157308132571203, 0.012499254045742038, 0.0124992540457419, 0.00986466285789806, 0.00618135598392439,
      0.003361921057966355, 0.003957743018438325, 0.004810258444200687,
    ]));
  });

  it('equal to the correctly rounded window sum on any data', () => {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647 - 0.5) * 10 ** ((seed % 9) - 4);
    };
    const x = Array.from({ length: 3000 }, rnd);
    for (const len of [2, 7, 50]) {
      const sums = math.sum(x, len);
      for (let i = len - 1; i < x.length; i++) expect(sums[i]).toBe(exactSum(x.slice(i - len + 1, i + 1)));
    }
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

  it('an na every 7 bars: the window is the last 3 non-na values, an na bar keeps the result (BTCUSD 1D)', () => {
    const x = BTC_CLOSE.map((c, i) => (i % 7 === 3 ? NaN : c));
    expect(taCore.sma(x, 3)).toEqual(toNum([
      null, null, 11.43, 11.43, 11.696666666666665, 11.299999999999999, 10.733333333333334, 9.5, 8.74,
      8.366666666666667, 8.366666666666667, 8.366666666666667, 8.46, 7.966666666666666, 7.29, 6.3, 5.543333333333333,
      5.543333333333333, 5.176666666666667, 4.973333333333334, 4.896666666666667, 5.16, 5.406666666666666, 5.68,
    ]));
    expect(math.sum(x, 3)).toEqual(toNum([
      null, null, 34.29, 34.29, 35.089999999999996, 33.9, 32.2, 28.5, 26.22, 25.1, 25.1, 25.1, 25.380000000000003,
      23.9, 21.87, 18.9, 16.63, 16.63, 15.530000000000001, 14.92, 14.690000000000001, 15.48, 16.22, 17.04,
    ]));
  });
});

describe('ta.ema seed (#136)', () => {
  it('the first value is ta.sma on that bar (window sum), not a plain loop sum', () => {
    // plain sum: (0.1 + 0.2 + 0.3) / 3 = 0.20000000000000004; correctly rounded sum: 0.19999999999999998
    expect(taCore.ema([0.1, 0.2, 0.3], 3)[2]).toBe(0.19999999999999998);
    const x = [NaN, 1e-16, 1, Infinity, -1, 0.1, 0.2];
    expect(taCore.ema(x, 3)[4]).toBe(taCore.sma(x, 3)[4]);
  });
});

describe('series length (#140)', () => {
  const lengthAt = (pattern: (i: number) => number, n = 24): number[] => Array.from({ length: n }, (_, i) => pattern(i));

  it('ta.sma / math.sum with a series length: the last length values (BTCUSD 1D, length bar_index % 4 + 2)', () => {
    const len = lengthAt((i) => (i % 4) + 2);
    expect(taCore.sma(BTC_CLOSE, len)).toEqual(toNum([
      null, null, null, null, 11.7, 11.299999999999999, 10.975, 10.379999999999999, 8.11, 8.366666666666667, 8.4975,
      8.398, 8.25, 7.966666666666666, 7.4675, 7.08, 5.33, 5.17, 5.095, 5.0600000000000005, 4.91, 5.16, 5.285, 5.372,
    ]));
    expect(math.sum(BTC_CLOSE, len)).toEqual(toNum([
      null, null, null, null, 23.4, 33.9, 43.9, 51.9, 16.22, 25.1, 33.99, 41.99, 16.5, 23.9, 29.87, 35.4, 10.66,
      15.51, 20.38, 25.3, 9.82, 15.48, 21.14, 26.86,
    ]));
  });

  it('an na bar applies the new length and gives the sum of the last length earlier values', () => {
    const x = BTC_CLOSE.map((c, i) => (i % 9 === 4 ? NaN : c));
    const len = lengthAt((i) => (i % 9 === 4 ? 3 : 6));
    const sums = math.sum(x, len);
    const before = (bar: number) => x.slice(0, bar + 1).filter((v) => !Number.isNaN(v));
    expect(sums[13]).toBe(exactSum(before(13).slice(-3))); // bar 13 is na: the last 3 values before it
    expect(sums[12]).toBe(exactSum(before(12).slice(-6)));
  });

  it('a constant series length gives the fixed-length result', () => {
    const x = BUY_PROXY;
    expect(math.sum(x, lengthAt(() => 2, x.length))).toEqual(math.sum(x, 2));
    expect(taCore.sma(x, lengthAt(() => 2, x.length))).toEqual(PINE_SMA_2);
    expect(taCore.variance(x, lengthAt(() => 3, x.length), false)).toEqual(taCore.variance(x, 3, false));
  });

  it('the constant-length path (sums changed in place) gives the doubles of the step-by-step path, na and ±inf included', () => {
    let seed = 11;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      const k = seed % 23;
      if (k === 3) return NaN;
      if (k === 5) return seed % 2 ? Infinity : -Infinity;
      if (k === 7) return -0;
      return (seed / 2147483647 - 0.5) * 10 ** ((seed % 11) - 5);
    };
    const x = Array.from({ length: 4000 }, rnd);
    for (const len of [1, 2, 3, 14, 200]) {
      const fixed = math.sum(x, len);
      const stepped = math.sum(x, lengthAt(() => len, x.length));
      for (let i = 0; i < x.length; i++) expect(Object.is(fixed[i], stepped[i])).toBe(true);
    }
  });

  it('rejects a length below 1 or a length series shorter than the source', () => {
    expect(() => math.sum([1, 2, 3], [2, 0, 2])).toThrow(
      "Error on bar 1: Invalid value of the 'length' argument (0.0) in the 'sum' function. It must be > 0."
    );
    expect(() => taCore.sma([1, 2, 3], [2, 2])).toThrow(/2 values for 3 bars/);
  });
});
