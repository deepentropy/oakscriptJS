/**
 * Window sums of PineScript `math.sum` / `ta.sma` / `ta.stdev` / `ta.variance` / `ta.mfi` (bit for bit).
 *
 * PineScript gives the correctly rounded sum of the window values (the exact sum of the doubles, rounded once), on
 * every bar: `ta.sma` is that sum divided by the length (measured on the reference 05/11/2026, #188: built-in and
 * expression sources, with or without a `ta.stdev` of the same source, constant and series lengths, na values; 0
 * differing bars of 16,550 on BTCUSD 1D and 34,665 on AAPL 1D). The running sum of earlier versions (Kahan steps,
 * #114) gave a small residue on a window of zeros; the reference no longer does.
 *
 * The exact sum is kept as non-overlapping partials (Shewchuk's algorithm, as Python `math.fsum`): adding a value and
 * removing the one that leaves the window (adding its negation) are exact, so a bar costs the values that enter and
 * leave, not the whole window.
 *
 * @internal
 */
import { checkSumLength } from './limits.js';

/** A value PineScript treats as na in window functions (also +/-Infinity). */
export function isNa(v: number | null | undefined): boolean {
  return v === undefined || v === null || !Number.isFinite(v);
}

/** Adds `x` to the partials `p` (non-overlapping, increasing magnitude), exactly. */
function addExact(p: number[], x: number): void {
  let i = 0;
  for (let j = 0; j < p.length; j++) {
    let y = p[j]!;
    if (Math.abs(x) < Math.abs(y)) [x, y] = [y, x];
    const hi = x + y;
    const lo = y - (hi - x);
    if (lo !== 0) p[i++] = lo;
    x = hi;
  }
  p.length = i;
  p.push(x);
}

/** The partials' exact sum rounded once to a double (round half to even), as Python `math.fsum`. */
function roundExact(p: readonly number[]): number {
  let n = p.length;
  if (n === 0) return 0;
  let hi = p[--n]!;
  while (n > 0) {
    const x = hi;
    const y = p[--n]!;
    hi = x + y;
    const lo = y - (hi - x);
    if (lo !== 0) {
      // half-way case: the rest has the same sign, so round away from the tie
      if (n > 0 && ((lo < 0 && p[n - 1]! < 0) || (lo > 0 && p[n - 1]! > 0))) {
        const y2 = lo * 2;
        const x2 = hi + y2;
        if (y2 === x2 - hi) hi = x2;
      }
      break;
    }
  }
  return hi;
}

/**
 * Window sum state, one value at a time. {@link step} computes the sum with a new value from the kept state without
 * changing it; {@link commit} keeps the last step. So several candidate values can be tried on one bar and only the
 * last one kept (a ta.* call in a loop).
 *
 * The length can change from one step to the next (a series length): the window is then the last `length` values,
 * the values that leave or come back are removed or added exactly.
 */
export class RunningSum {
  private readonly values: number[] = [];
  /** Exact sum of the kept window (the last `keptLength` values). */
  private partials: number[] = [];
  private keptLength = 0;
  private stepLength = 0;
  private stepX = NaN;
  private stepPartials: number[] = [];

  /** The partials of the last `len` values (kept state, nothing added). */
  private resized(len: number): number[] {
    const values = this.values;
    const n = values.length;
    const p = this.partials.slice();
    const kept = Math.min(this.keptLength, n);
    const want = Math.min(len, n);
    if (want < kept) for (let k = n - kept; k < n - want; k++) addExact(p, -values[k]!);
    else for (let k = n - kept - 1; k >= n - want; k--) addExact(p, values[k]!);
    return p;
  }

  /**
   * The sum of the last `length` values with the (not na) value `x` added, from the kept state; the state is
   * unchanged until {@link commit}.
   *
   * @returns The sum, or NaN while fewer than `length` values exist (with `x`)
   */
  step(x: number, length: number): number {
    const n = this.values.length;
    const p = this.resized(length - 1);
    addExact(p, x);
    this.stepPartials = p;
    this.stepLength = Math.min(length, n + 1);
    this.stepX = x;
    return n + 1 >= length ? roundExact(p) : NaN;
  }

  /**
   * The sum of the last `length` values on a bar with an na value (no value added), from the kept state; the state is
   * unchanged until {@link commit}. With an unchanged length, it is the previous result.
   *
   * @returns The sum, or NaN while fewer than `length` values exist
   */
  stepNa(length: number): number {
    const n = this.values.length;
    const p = this.resized(length);
    this.stepPartials = p;
    this.stepLength = Math.min(length, n);
    this.stepX = NaN;
    return n > 0 && n >= length ? roundExact(p) : NaN;
  }

  /** Keeps the state of the last {@link step} or {@link stepNa}. */
  commit(): void {
    if (!Number.isNaN(this.stepX)) this.values.push(this.stepX);
    this.keptLength = this.stepLength;
    this.partials = this.stepPartials;
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
 * The sum of the last `length` non-na values on each bar, correctly rounded, as PineScript.
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
    checkSumLength(name, len, i);
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

/** Variance from the window sums of the values and of their squares; rules in {@link runningVariance}. */
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
 * Window variance from the window sums of the values and of their squares, as PineScript computes it (#188):
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
