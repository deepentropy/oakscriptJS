/**
 * @fileoverview Per-call history of ta.* functions called in a conditional block.
 *
 * In PineScript, every ta.* call keeps its own history of the values it receives. A call inside
 * an `if` block receives values only on the bars where the block runs, so its history skips the
 * other bars: `ta.crossover(a, b)` is false on the first bar the block runs, and `ta.sma(x, 3)`
 * averages the last 3 values it received, not the last 3 bars.
 *
 * - {@link whenCalled}: vectorized, when the bars of the calls are known in advance.
 * - {@link crossover} / {@link crossunder} / {@link cross} / {@link barssince}: one stateful call site for bar
 *   loops, called only on the bars where the Pine call runs.
 * - {@link lowestByBar} / {@link highestByBar} / {@link lowestbars} / {@link highestbars} / {@link pivothigh} /
 *   {@link pivotlow}: `ta.lowest` / `ta.highest` / `ta.lowestbars` / `ta.highestbars` / `ta.pivothigh` /
 *   `ta.pivotlow` in a conditional block or a loop, also with a length that changes on each call. They keep the
 *   non-na values of their calls; {@link lowest} / {@link highest} are the same sites called with `(value, length)`.
 * - {@link linreg}: `ta.linreg` in a conditional block, whose history is kept by bar (not by call).
 * - {@link sum} / {@link sma}: `math.sum` / `ta.sma` in a `for` / `while` loop, called several times on one bar.
 *
 * Since PineScript v6, `and` / `or` are lazy: the right operand runs only when the left operand does not decide
 * the result. A ta.* call in the right operand of `a or b` runs on the bars where `a` is false, in `a and b` on the
 * bars where `a` is true, so it needs a call site too:
 *
 * ```typescript
 * // Pine:  longCond = longUp or (src > sig and ta.barssince(longUp) <= lookback)
 * const since = callsite.whenCalled(longUp.map((u, i) => !u && src[i] > sig[i]), (c) => taCore.barssince(c.map(Boolean)), longUp);
 * // ta.barssince(longUp) only runs where longUp is false: it never sees true and stays na
 * ```
 *
 * ```typescript
 * // Pine:  if inRange
 * //            buy = ta.crossover(cumRsi, 60)
 * const buy = callsite.whenCalled(inRange, (a) => taCore.crossover(a, a.map(() => 60)), cumRsi);
 *
 * // Same call in a bar loop
 * const buyCross = callsite.crossover();
 * for (let i = 0; i < n; i++) {
 *   if (inRange[i]) {
 *     const buy = buyCross(cumRsi[i], 60);
 *   }
 * }
 * ```
 *
 * @module callsite
 */

import type { Source } from '../types/index.js';
import { linreg as linregSeries } from '../ta/index.js';
import { RunningSum, isNa } from '../ta/running-sum.js';
import { checkSumLength, checkWindowLength } from '../ta/limits.js';
import { seededRandom } from '../math/index.js';

/**
 * Runs `fn` on the bars where `called` is true only, like a ta.* call inside an `if` block.
 * `fn` receives the values of `sources` on those bars, in order; its results are placed back on
 * the same bars. The other bars get na (NaN).
 *
 * @param called - true (or non-zero) on the bars where the call runs
 * @param fn - the calculation, for example `(x) => taCore.sma(x, 3)`
 * @param sources - the arguments of the call, one value per chart bar
 */
export function whenCalled<T extends number | boolean>(
  called: ArrayLike<boolean | number>,
  fn: (...values: number[][]) => ArrayLike<T>,
  ...sources: Source[]
): Array<T | number> {
  const bars: number[] = [];
  for (let i = 0; i < called.length; i++) if (called[i]) bars.push(i);
  const result = fn(...sources.map(s => bars.map(i => s[i] ?? NaN)));
  const out = new Array<T | number>(called.length).fill(NaN);
  bars.forEach((bar, k) => {
    out[bar] = result[k]!;
  });
  return out;
}

/**
 * A call site that keeps the arguments of the last call where both were not na (na before such a call), as
 * ta.crossover / ta.crossunder / ta.cross.
 */
function twoSeriesSite(test: (a: number, b: number, prevA: number, prevB: number) => boolean) {
  let prevA = NaN;
  let prevB = NaN;
  return (a: number, b: number): boolean => {
    const result = test(a, b, prevA, prevB);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      prevA = a;
      prevB = b;
    }
    return result;
  };
}

/**
 * One `ta.crossover(a, b)` call site: compared with the last call where both arguments were not na; false before
 * such a call.
 */
export function crossover(): (a: number, b: number) => boolean {
  return twoSeriesSite((a, b, pa, pb) => a > b && pa <= pb);
}

/**
 * One `ta.crossunder(a, b)` call site: compared with the last call where both arguments were not na; false before
 * such a call.
 */
export function crossunder(): (a: number, b: number) => boolean {
  return twoSeriesSite((a, b, pa, pb) => a < b && pa >= pb);
}

/**
 * One `ta.barssince(condition)` call site: the number of calls since the condition was true on a call (0 on that
 * call), na before the first true condition. An na condition counts as false.
 */
export function barssince(): (condition: boolean | number) => number {
  let count = NaN;
  return (condition) => {
    if (condition && !Number.isNaN(condition)) count = 0;
    else if (!Number.isNaN(count)) count++;
    return count;
  };
}

/**
 * One `ta.cross(a, b)` call site, rules of `ta.cross`: the site keeps the side of the last call where `a` was
 * strictly above or strictly below `b` (none before such a call; equal values and na arguments do not change it),
 * and is true when the arguments are strictly on the other side. False with an na argument.
 */
export function cross(): (a: number, b: number) => boolean {
  let side = 0; // -1: last strictly below, 1: last strictly above, 0: none yet
  return (a, b) => {
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    const result = (side < 0 && a > b) || (side > 0 && a < b);
    if (a < b) side = -1;
    else if (a > b) side = 1;
    return result;
  };
}

/** The values a ta.highest / ta.lowest / ta.pivothigh call site keeps: the non-na values of its calls, one per bar. */
class KeptCalls {
  readonly values: number[] = [];
  readonly bars: number[] = [];

  /**
   * Keeps a non-na value (+/-Infinity is skipped like na, #183); a later call on the same bar (a loop) replaces the
   * value of that bar.
   */
  add(barIndex: number, value: number): void {
    if (!Number.isFinite(value)) return;
    const last = this.values.length - 1;
    if (last >= 0 && this.bars[last] === barIndex) this.values[last] = value;
    else {
      this.values.push(value);
      this.bars.push(barIndex);
    }
  }

  /** Position of the best of the last `count` kept values (the newest one on ties), -1 when there is none. */
  best(count: number, isLowest: boolean): number {
    const last = this.values.length - 1;
    if (last < 0 || !(count >= 1)) return -1;
    let best = last;
    for (let k = last - 1; k >= 0 && k > last - count; k--) {
      if (isLowest ? this.values[k]! < this.values[best]! : this.values[k]! > this.values[best]!) best = k;
    }
    return best;
  }
}

/** One `ta.lowest` / `ta.highest` / `ta.lowestbars` / `ta.highestbars` call site; rules in {@link lowestByBar}. */
function extremeByBarSite(
  isLowest: boolean,
  offsets: boolean
): (barIndex: number, value: number, length: number) => number {
  const kept = new KeptCalls();
  const name = (isLowest ? 'lowest' : 'highest') + (offsets ? 'bars' : '');
  return (barIndex, value, length) => {
    checkWindowLength(name, length, barIndex);
    kept.add(barIndex, value);
    const len = Math.trunc(length);
    if (barIndex < len - 1) return NaN;
    const best = kept.best(len, isLowest);
    if (best < 0) return NaN;
    return offsets ? -(barIndex - kept.bars[best]!) : kept.values[best]!;
  };
}

/** {@link extremeByBarSite} called with `(value, length, barIndex?)`: without a bar index, every call is a new bar. */
function extremeSite(isLowest: boolean): (value: number, length: number, barIndex?: number) => number {
  const site = extremeByBarSite(isLowest, false);
  let calls = 0;
  return (value, length, barIndex) => site(barIndex ?? calls++, value, length);
}

/**
 * One `ta.lowest(source, length)` call site, called with `(value, length, barIndex?)`: the same site as
 * {@link lowestByBar} (same rules). Pass the bar index when the call does not run on every bar; without it every
 * call counts as one bar, which is right for a call on every bar (for example with a length that changes).
 *
 * @example
 * ```typescript
 * // Pine:  lowPrice = ta.lowest(close[1], lookback)   // lookback changes per bar
 * const lowPrice = callsite.lowest();
 * const out = closes.map((_, i) => lowPrice(i > 0 ? closes[i - 1]! : NaN, lookback[i]!));
 * ```
 */
export function lowest(): (value: number, length: number, barIndex?: number) => number {
  return extremeSite(true);
}

/**
 * One `ta.highest(source, length)` call site, called with `(value, length, barIndex?)`. Same rules as
 * {@link lowest}.
 */
export function highest(): (value: number, length: number, barIndex?: number) => number {
  return extremeSite(false);
}

/**
 * One `ta.lowest(source, length)` call site in a conditional block or a loop, called with
 * `(barIndex, value, length)` on the bars (and loop turns) where the Pine call runs. The length can change from one
 * call to the next.
 *
 * PineScript rules (measured in `if` blocks, ternaries, user functions and `for` loops, with constant lengths and
 * lengths that change, on sources with and without na):
 * - the call site keeps the non-na values it received, each with its bar; nothing is kept for a bar without a call
 *   or for an na value
 * - the result is na while `barIndex < length - 1` (by bar, not by call) and while no value was received
 * - otherwise it is the lowest of the last `length` kept values, or of all of them when there are fewer: the first
 *   call after bar `length - 1` gives its own value. A call with an na value also gives this result
 * - in a loop (several calls on one bar), a bar has one kept value: each call replaces the value of the earlier
 *   calls of that bar, so a call gives the lowest of its value and the values of the bars before
 *
 * Called on every bar, it equals `ta.lowest`.
 *
 * @example
 * ```typescript
 * // Pine:  lo = cond ? ta.lowest(low, 6) : na
 * const site = callsite.lowestByBar();
 * const lo = lows.map((v, i) => (cond[i] ? site(i, v, 6) : NaN));
 * ```
 */
export function lowestByBar(): (barIndex: number, value: number, length: number) => number {
  return extremeByBarSite(true, false);
}

/**
 * One `ta.highest(source, length)` call site in a conditional block or a loop, called with
 * `(barIndex, value, length)`. Same rules as {@link lowestByBar}.
 */
export function highestByBar(): (barIndex: number, value: number, length: number) => number {
  return extremeByBarSite(false, false);
}

/**
 * One `ta.lowestbars(source, length)` call site in a conditional block or a loop, called with
 * `(barIndex, value, length)`: the offset (0 or negative) from this bar to the bar of the lowest of the last `length`
 * kept values, the newest one on equal values. The values are kept as in {@link lowestByBar}; the offset counts
 * bars, not calls, so it can be below `-(length - 1)`.
 *
 * @example
 * ```typescript
 * // Pine:  off = cond ? ta.lowestbars(low, 10) : na
 * const site = callsite.lowestbars();
 * const off = lows.map((v, i) => (cond[i] ? site(i, v, 10) : NaN));
 * ```
 */
export function lowestbars(): (barIndex: number, value: number, length: number) => number {
  return extremeByBarSite(true, true);
}

/**
 * One `ta.highestbars(source, length)` call site in a conditional block or a loop, called with
 * `(barIndex, value, length)`. Same rules as {@link lowestbars}.
 */
export function highestbars(): (barIndex: number, value: number, length: number) => number {
  return extremeByBarSite(false, true);
}

/** One `ta.pivothigh` / `ta.pivotlow` call site; rules in {@link pivothigh}. */
function pivotSite(isLowest: boolean): (barIndex: number, value: number, leftbars: number, rightbars: number) => number {
  const kept = new KeptCalls();
  return (barIndex, value, leftbars, rightbars) => {
    kept.add(barIndex, value);
    const left = Math.trunc(leftbars);
    const right = Math.trunc(rightbars);
    if (!(barIndex >= left + right)) return NaN;
    const best = kept.best(left + right + 1, isLowest);
    return best >= 0 && kept.bars[best] === barIndex - right ? kept.values[best]! : NaN;
  };
}

/**
 * One `ta.pivothigh(source, leftbars, rightbars)` call site in a conditional block, called with
 * `(barIndex, value, leftbars, rightbars)` on the bars where the Pine call runs. The lengths can change from one call
 * to the next (the lengths of the current call are used).
 *
 * PineScript rules (measured in `if` blocks and ternaries, and on sources with na):
 * - the call site keeps the non-na values it received, each with its bar
 * - on a call it takes the last `leftbars + rightbars + 1` kept values (all of them when there are fewer) and finds
 *   the highest, the newest one on equal values
 * - there is a pivot only when that value is on the bar `rightbars` BARS back (by bar index, not by call); the
 *   result is its value, na otherwise and before bar `leftbars + rightbars`
 *
 * Called on every bar, it equals `ta.pivothigh`.
 *
 * @example
 * ```typescript
 * // Pine:  ph = useFilter ? ta.pivothigh(src, 5, 5) : na
 * const site = callsite.pivothigh();
 * const ph = src.map((v, i) => (useFilter[i] ? site(i, v, 5, 5) : NaN));
 * ```
 */
export function pivothigh(): (barIndex: number, value: number, leftbars: number, rightbars: number) => number {
  return pivotSite(false);
}

/**
 * One `ta.pivotlow(source, leftbars, rightbars)` call site in a conditional block, called with
 * `(barIndex, value, leftbars, rightbars)`. Same rules as {@link pivothigh} (the lowest value).
 */
export function pivotlow(): (barIndex: number, value: number, leftbars: number, rightbars: number) => number {
  return pivotSite(true);
}

/**
 * One `ta.linreg(source, length, offset)` call site in a conditional block, called with
 * `(barIndex, value, length, offset)` on the bars where the Pine call runs.
 *
 * PineScript rules (measured): `ta.linreg` keeps the values it receives in a ring of `length + 1` slots indexed by the
 * bar index, filled with 0 at the start and written only on the bars where it is called. The window is read from the
 * ring for the last `length` bars: a bar before the first call counts as 0, and a bar without a call holds the value of
 * the call `length + 1` bars earlier (0 if there was none). The result is na before bar `length - 1`. Called on every
 * bar, it equals `ta.linreg`.
 *
 * @example
 * ```typescript
 * // Pine:  if bar_index >= 20
 * //            a := ta.linreg(close, 10, 0)
 * const site = callsite.linreg();
 * const a = closes.map((c, i) => (i >= 20 ? site(i, c, 10, 0) : NaN));
 * ```
 */
export function linreg(): (barIndex: number, value: number, length: number, offset?: number) => number {
  let ring: number[] = [];
  return (barIndex, value, length, offset = 0) => {
    const len = Math.floor(length);
    if (ring.length !== len + 1) ring = new Array<number>(len + 1).fill(0);
    ring[barIndex % (len + 1)] = value;
    if (barIndex < len - 1) return NaN;
    const window = Array.from({ length: len }, (_, k) => ring[(barIndex - len + 1 + k) % (len + 1)]!);
    return linregSeries(window, len, offset)[len - 1]!;
  };
}


/**
 * One `math.sum` call site in a loop; rules in {@link sum}. With `squares`, it also keeps the running sum of the
 * squared values (for {@link stdev}). Returns `[sum, sumOfSquares]` (NaN when not kept).
 */
function loopSumSite(
  name: string,
  squares: boolean
): (barIndex: number, value: number, length: number) => [number, number] {
  const running = new RunningSum();
  const runningSq = new RunningSum();
  let lastBar = NaN;
  let pending = false;
  return (barIndex, value, length) => {
    const len = Math.floor(length);
    checkSumLength(name === 'sum' ? 'math.sum' : `ta.${name}`, len, barIndex);
    if (!(len >= 1)) throw new Error(`callsite.${name}: length must be at least 1 (got ${length})`);
    if (barIndex !== lastBar) {
      if (pending) {
        running.commit();
        if (squares) runningSq.commit();
      }
      pending = false;
      lastBar = barIndex;
    }
    if (isNa(value)) {
      pending = false;
      return [running.stepNa(len), squares ? runningSq.stepNa(len) : NaN];
    }
    const x = value;
    const out: [number, number] = [running.step(x, len), squares ? runningSq.step(x * x, len) : NaN];
    pending = true;
    return out;
  };
}

/**
 * One `math.sum(source, length)` call site inside a `for` / `while` loop, called with `(barIndex, value, length)` on
 * each call.
 *
 * PineScript rules (measured on calls in loops, 1 to 3 calls per bar, and bars without a call):
 * - the call site keeps one history value per bar: the value of its last call on that bar
 * - every call on a bar starts from the state of the earlier bars, so it gives the sum of its value and the last
 *   `length - 1` kept values; the last call of the bar is the one kept for the later bars
 * - the length can change from one call to the next (also on the same bar): each call first moves the kept sum to
 *   its own length as `math.sum` with a series length does (Kahan steps of the raw values)
 * - a bar without a call is not in the history (as a call in an `if` block)
 * - the sum is the same compensated running sum as `math.sum` (bit for bit)
 *
 * An na value is skipped as in `math.sum` (it returns the sum of the last `length` earlier values); when it is the
 * last call of a bar, the bar is not in the history (not measured).
 *
 * @example
 * ```typescript
 * // Pine:  for i = 0 to 2
 * //            s = math.sum(close * (1 + 0.01 * i), 7)
 * const site = callsite.sum();
 * for (let b = 0; b < closes.length; b++) {
 *   for (let i = 0; i <= 2; i++) {
 *     const s = site(b, closes[b]! * (1 + 0.01 * i), 7);
 *   }
 * }
 * ```
 */
export function sum(): (barIndex: number, value: number, length: number) => number {
  const site = loopSumSite('sum', false);
  return (barIndex, value, length) => site(barIndex, value, length)[0];
}

/**
 * One `ta.sma(source, length)` call site inside a `for` / `while` loop, called with `(barIndex, value, length)` on
 * each call: {@link sum} divided by the length (same rules).
 *
 * @example
 * ```typescript
 * // Pine:  evaluate(ratio) => ta.sma(gann(ratio), n)   // called once per ratio in a while loop
 * const site = callsite.sma();
 * for (let b = 0; b < closes.length; b++) {
 *   for (const ratio of ratios) {
 *     const avg = site(b, gann(b, ratio), n);
 *   }
 * }
 * ```
 */
export function sma(): (barIndex: number, value: number, length: number) => number {
  const site = loopSumSite('sma', false);
  return (barIndex, value, length) => site(barIndex, value, length)[0] / Math.floor(length);
}

/**
 * One `ta.stdev(source, length, biased)` call site inside a `for` / `while` loop, called with
 * `(barIndex, value, length, biased?)` on each call: the running sums of the values and of their squares follow the
 * rules of {@link sum}; the result is computed from them as `ta.stdev` (bit for bit).
 *
 * @example
 * ```typescript
 * // Pine:  for len in lengths
 * //            [mid, up, lo] = ta.bb(close, len, 2)
 * const avgSite = callsite.sma();
 * const devSite = callsite.stdev();
 * for (let b = 0; b < closes.length; b++) {
 *   for (const len of lengths) {
 *     const mid = avgSite(b, closes[b]!, len);
 *     const dev = devSite(b, closes[b]!, len);
 *   }
 * }
 * ```
 */
export function stdev(): (barIndex: number, value: number, length: number, biased?: boolean) => number {
  const site = loopSumSite('stdev', true);
  return (barIndex, value, length, biased = true) => {
    const len = Math.floor(length);
    const [s, sq] = site(barIndex, value, length);
    const mean = s / len;
    const variance = biased ? sq / len - mean * mean : sq / (len - 1) - (mean * s) / (len - 1);
    if (!biased && len <= 1) return NaN;
    return Number.isNaN(variance) ? NaN : variance > 0 ? Math.sqrt(variance) : 0;
  };
}

/**
 * One `math.random(min, max, seed)` call site: PineScript keeps one generator per call site, so two call sites
 * with the same seed give the same sequence. Called with `(min?, max?)` once per bar.
 *
 * @example
 * ```typescript
 * // Pine: a = math.random(0, 1, 42), b = math.random(0, 1, 42)   // a == b on every bar
 * const a = callsite.random(42);
 * const b = callsite.random(42);
 * ```
 */
export function random(seed: number): (min?: number, max?: number) => number {
  return seededRandom(seed);
}
