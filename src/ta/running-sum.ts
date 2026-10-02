/**
 * Running window sum with the floating-point behaviour of PineScript `math.sum` / `ta.sma` / `ta.stdev` /
 * `ta.variance` (bit for bit).
 *
 * PineScript does not sum the window again on each bar. It keeps a compensated (Kahan) running sum:
 * - each bar first removes, with a Kahan step, the compensated value that was added for the value that leaves the
 *   window, then adds the new value with a Kahan step and keeps its compensated value;
 * - when the compensation of the previous step would be lost when applied to the new value, the sum is computed
 *   again from the window values (newest first) and the compensation is reset. The test rounds on the grid of the
 *   new value toward +infinity: for a negative power of two, the finer grid of the binade below (#136).
 *
 * So the result can differ from the exact window sum in the last bits (e.g. a small residue on a window of zeros),
 * as in PineScript.
 *
 * @internal
 */

const view = new DataView(new ArrayBuffer(8));

/** Binary exponent of a finite non-zero number (from its bits). */
function exponentOf(x: number): number {
  view.setFloat64(0, x);
  const e = (view.getUint16(0) >> 4) & 0x7ff;
  return e === 0 ? -1074 : e - 1023;
}

/**
 * Distance from a finite non-zero `x` to the next number toward +infinity: the spacing of the binade of `x`, or half
 * of it when `x` is a negative power of two (the next number up is in the binade below).
 */
function spacingUp(x: number): number {
  const e = exponentOf(x);
  const powerOfTwo = (view.getUint16(0) & 0xf) === 0 && view.getUint16(2) === 0 && view.getUint32(4) === 0;
  return 2 ** (e - (x < 0 && powerOfTwo && e > -1022 ? 53 : 52));
}

/**
 * Whether the compensation `c` is (partly) lost when it is applied to `x`: `x - c` rounded on the grid of `x`
 * (spacing {@link spacingUp}, ties to an even mantissa) applies less than `c`.
 */
function compensationLost(x: number, c: number): boolean {
  if (c === 0 || x === 0) return false;
  const ulp = spacingUp(x);
  const q = c / ulp;
  const mantissa = x / ulp;
  const f = Math.floor(q);
  const d = q - f;
  // parity of mantissa - f from each part: the mantissa can be 2^53 (half spacing), where mantissa - f is not exact
  const applied = d > 0.5 ? f + 1 : d < 0.5 ? f : Math.abs(mantissa % 2) === Math.abs(f % 2) ? f : f + 1;
  return Math.abs(applied) < Math.abs(q);
}

/** A value PineScript treats as na in window functions (also +/-Infinity). */
function isNa(v: number | null | undefined): boolean {
  return v === undefined || v === null || !Number.isFinite(v);
}

/**
 * The sum of the last `length` non-na values on each bar, as PineScript computes it.
 *
 * @param source - Values (na: NaN, null, undefined or +/-Infinity, skipped)
 * @param length - Number of non-na values in the window
 * @returns The running sum per bar: NaN until `length` non-na values exist; a bar with an na value keeps the
 *   previous result
 */
export function runningSum(source: ArrayLike<number | null | undefined>, length: number): number[] {
  const len = Math.floor(length);
  const out: number[] = new Array<number>(source.length).fill(NaN);
  if (!(len >= 1)) return out;
  const values: number[] = [];
  const stored: number[] = [];
  let s = 0;
  let c = 0;
  let previous = NaN;
  const kahanAdd = (v: number): number => {
    const y = v - c;
    const t = s + y;
    c = (t - s) - y;
    s = t;
    return y;
  };
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    if (isNa(v)) {
      out[i] = previous;
      continue;
    }
    const x = v as number;
    const c0 = c;
    const n = values.length;
    if (n >= len) kahanAdd(-stored[n - len]!);
    values.push(x);
    if (compensationLost(x, c0)) {
      let fresh = 0;
      for (let k = values.length - 1; k >= Math.max(0, values.length - len); k--) fresh += values[k]!;
      s = fresh;
      c = 0;
      stored.push(x);
    } else {
      stored.push(kahanAdd(x));
    }
    previous = values.length >= len ? s : NaN;
    out[i] = previous;
  }
  return out;
}

/**
 * Window variance from the running sums of the values and of their squares, as PineScript computes it:
 * biased `sumSq / n - mean * mean`, unbiased `sumSq / (n - 1) - mean * sum / (n - 1)`, with `mean = sum / n`.
 */
export function runningVariance(
  source: ArrayLike<number | null | undefined>,
  length: number,
  biased: boolean
): number[] {
  const len = Math.floor(length);
  const squares = Array.from({ length: source.length }, (_, i) => {
    const v = source[i];
    return isNa(v) ? NaN : (v as number) * (v as number);
  });
  const sums = runningSum(source, len);
  const sumSquares = runningSum(squares, len);
  return sums.map((sum, i) => {
    const mean = sum / len;
    const sq = sumSquares[i]!;
    return biased ? sq / len - mean * mean : sq / (len - 1) - (mean * sum) / (len - 1);
  });
}
