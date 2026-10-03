/**
 * Running window sum with the floating-point behaviour of PineScript `math.sum` / `ta.sma` / `ta.stdev` /
 * `ta.variance` (bit for bit).
 *
 * PineScript does not sum the window again on each bar. It keeps a compensated (Kahan) running sum:
 * - each bar first removes, with a Kahan step, the compensated value that was added for the value that leaves the
 *   window, then adds the new value with a Kahan step and keeps its compensated value;
 * - when the compensation of the previous step would be lost when applied to the new value, the sum is computed
 *   again from the window values (newest first) and the compensation is reset. The test moves the new value toward
 *   +infinity by the size of the compensation, in floating point (#136, #142).
 *
 * So the result can differ from the exact window sum in the last bits (e.g. a small residue on a window of zeros),
 * as in PineScript.
 *
 * @internal
 */

/**
 * Whether the compensation `c` is (partly) lost when it is applied to `x`: `x + |c|` in floating point moves `x` by
 * less than `|c|`. Moving toward +infinity uses the grid above `x` (the coarser binade just below a power of two, the
 * finer binade for a negative power of two), as PineScript (measured bit for bit, #142).
 */
function compensationLost(x: number, c: number): boolean {
  if (c === 0 || x === 0) return false;
  const size = Math.abs(c);
  return Math.abs(x + size - x) < size;
}

/** A value PineScript treats as na in window functions (also +/-Infinity). */
export function isNa(v: number | null | undefined): boolean {
  return v === undefined || v === null || !Number.isFinite(v);
}

/**
 * Running sum state, one value at a time. {@link step} computes the sum with a new value from the kept state without
 * changing it; {@link commit} keeps the last step. So several candidate values can be tried on one bar and only the
 * last one kept (a ta.* call in a loop).
 *
 * The length can change from one step to the next (a series length). PineScript then first moves the kept sum to the
 * new length with Kahan steps of the raw values (not the stored compensated values): a smaller length removes the
 * values that leave the window, oldest first; a larger length adds back the values from the one before the old window
 * down to the one `length` values back, newest first (one more than the window needs). Then the usual step runs with
 * the new length: it removes the stored value of the one `length` values back and adds the new value.
 */
export class RunningSum {
  private readonly values: number[] = [];
  private readonly stored: number[] = [];
  private keptLength = NaN;
  private s = 0;
  private c = 0;
  private stepLength = NaN;
  private stepX = NaN;
  private stepY = NaN;
  private stepS = 0;
  private stepC = 0;

  /** Kahan steps that move the kept sum from the kept length to `len`; the result goes to stepS / stepC. */
  private resize(len: number): void {
    const values = this.values;
    const n = values.length;
    const kept = this.keptLength;
    let s = this.s;
    let c = this.c;
    const add = (v: number) => {
      const y = v - c;
      const t = s + y;
      c = (t - s) - y;
      s = t;
    };
    if (len < kept) {
      for (let k = Math.max(0, n - kept); k <= n - len - 1; k++) add(-values[k]!);
    } else if (len > kept) {
      for (let k = n - kept - 1; k >= Math.max(0, n - len); k--) add(values[k]!);
    }
    this.stepS = s;
    this.stepC = c;
  }

  /**
   * The running sum of the last `length` values with the (not na) value `x` added, from the kept state; the state is
   * unchanged until {@link commit}.
   *
   * @returns The sum, or NaN while fewer than `length` values exist (with `x`)
   */
  step(x: number, length: number): number {
    const len = length;
    const values = this.values;
    this.resize(len);
    let s = this.stepS;
    let c = this.stepC;
    const c0 = c;
    const n = values.length;
    if (n >= len) {
      const y = -this.stored[n - len]! - c;
      const t = s + y;
      c = (t - s) - y;
      s = t;
    }
    if (compensationLost(x, c0)) {
      let fresh = x;
      for (let k = n - 1; k >= Math.max(0, n + 1 - len); k--) fresh += values[k]!;
      s = fresh;
      c = 0;
      this.stepY = x;
    } else {
      const y = x - c;
      const t = s + y;
      c = (t - s) - y;
      s = t;
      this.stepY = y;
    }
    this.stepLength = len;
    this.stepX = x;
    this.stepS = s;
    this.stepC = c;
    return n + 1 >= len ? s : NaN;
  }

  /**
   * The running sum of the last `length` values on a bar with an na value (no value added), from the kept state; the
   * state is unchanged until {@link commit}. With an unchanged length, it is the previous result.
   *
   * @returns The sum, or NaN while fewer than `length` values exist
   */
  stepNa(length: number): number {
    this.resize(length);
    this.stepLength = length;
    this.stepX = NaN;
    const n = this.values.length;
    return n > 0 && n >= length ? this.stepS : NaN;
  }

  /** Keeps the state of the last {@link step} or {@link stepNa}. */
  commit(): void {
    if (!Number.isNaN(this.stepX)) {
      this.values.push(this.stepX);
      this.stored.push(this.stepY);
    }
    this.keptLength = this.stepLength;
    this.s = this.stepS;
    this.c = this.stepC;
  }
}

/** The running sums of `source` with the length `lengthAt(i)` on bar `i`. */
function sumWindows(source: ArrayLike<number | null | undefined>, lengthAt: (i: number) => number): number[] {
  const out: number[] = new Array<number>(source.length);
  const sum = new RunningSum();
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    const len = lengthAt(i);
    out[i] = isNa(v) ? sum.stepNa(len) : sum.step(v as number, len);
    sum.commit();
  }
  return out;
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
  if (!(len >= 1)) return new Array<number>(source.length).fill(NaN);
  return sumWindows(source, () => len);
}

/** The values of a series length, floored, checked to be at least 1 on every bar. */
function seriesLengths(lengths: ArrayLike<number>, count: number, name: string): number[] {
  if (lengths.length < count) {
    throw new Error(`${name}: the length series has ${lengths.length} values for ${count} bars`);
  }
  return Array.from({ length: count }, (_, i) => {
    const len = Math.floor(lengths[i]!);
    if (!(len >= 1)) throw new Error(`${name}: length must be at least 1 (bar ${i}: ${lengths[i]})`);
    return len;
  });
}

/**
 * The sum of the last `lengths[i]` non-na values on each bar `i` (a series length), as PineScript computes it (see
 * {@link RunningSum}). A bar with an na value gives the sum of the last `lengths[i]` earlier values.
 *
 * @param name - Function name for the error messages
 */
export function runningSumSeries(
  source: ArrayLike<number | null | undefined>,
  lengths: ArrayLike<number>,
  name = 'math.sum'
): number[] {
  const lens = seriesLengths(lengths, source.length, name);
  return sumWindows(source, (i) => lens[i]!);
}

/** Variance from the running sums of the values and of their squares; rules in {@link runningVariance}. */
function varianceFromSums(
  source: ArrayLike<number | null | undefined>,
  sumOf: (src: ArrayLike<number | null | undefined>) => number[],
  lengthAt: (i: number) => number,
  biased: boolean
): number[] {
  const squares = Array.from({ length: source.length }, (_, i) => {
    const v = source[i];
    return isNa(v) ? NaN : (v as number) * (v as number);
  });
  const sums = sumOf(source);
  const sumSquares = sumOf(squares);
  return sums.map((sum, i) => {
    const len = lengthAt(i);
    const mean = sum / len;
    const sq = sumSquares[i]!;
    return biased ? sq / len - mean * mean : sq / (len - 1) - (mean * sum) / (len - 1);
  });
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
  return varianceFromSums(source, (src) => runningSum(src, len), () => len, biased);
}

/** {@link runningVariance} with a series length (the length of bar `i` is `lengths[i]`). */
export function runningVarianceSeries(
  source: ArrayLike<number | null | undefined>,
  lengths: ArrayLike<number>,
  biased: boolean,
  name = 'ta.variance'
): number[] {
  const lens = seriesLengths(lengths, source.length, name);
  return varianceFromSums(source, (src) => sumWindows(src, (i) => lens[i]!), (i) => lens[i]!, biased);
}
