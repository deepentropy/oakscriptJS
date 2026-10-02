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
 * - {@link lowest} / {@link highest}: `ta.lowest` / `ta.highest` with a series length (a different length on each
 *   call), which PineScript computes with a state kept between calls.
 * - {@link linreg}: `ta.linreg` in a conditional block, whose window is kept by bar (not by call).
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
 * One `ta.cross(a, b)` call site: compared with the last call where both arguments were not na; false before such
 * a call.
 */
export function cross(): (a: number, b: number) => boolean {
  return twoSeriesSite((a, b, pa, pb) => (a > b && pa <= pb) || (a < b && pa >= pb));
}

/** One `ta.lowest` / `ta.highest` call site with a series length; rules in {@link lowest}. */
function extremeSite(isLowest: boolean): (value: number, length: number) => number {
  const better = isLowest ? (a: number, b: number) => a < b : (a: number, b: number) => a > b;
  const values: number[] = [];
  let extreme = NaN;
  let extremeAt = -1;
  let prevLength = NaN;
  const keep = (v: number, at: number) => {
    extreme = v;
    extremeAt = at;
  };
  const rescan = (i: number, length: number) => {
    extreme = NaN;
    for (let b = i; b > i - length && b >= 0; b--) {
      const v = values[b]!;
      if (!Number.isNaN(v) && (Number.isNaN(extreme) || !better(extreme, v))) keep(v, b);
    }
  };
  return (value, length) => {
    const i = values.length;
    values.push(value);
    if (Number.isNaN(value)) {
      extreme = NaN;
      prevLength = length;
      return NaN;
    }
    if (length > prevLength) {
      const from = Math.max(0, i - length + 1);
      const to = Math.max(0, i - prevLength + 1);
      if (values.slice(from, to).some(Number.isNaN)) keep(value, i);
      else {
        for (let b = from; b < to; b++) if (Number.isNaN(extreme) || better(values[b]!, extreme)) keep(values[b]!, b);
        if (Number.isNaN(extreme) || better(value, extreme)) keep(value, i);
      }
    } else if (length < prevLength || Number.isNaN(extreme) || i - extremeAt >= length) rescan(i, length);
    else if (better(value, extreme)) keep(value, i);
    prevLength = length;
    return i < length - 1 ? NaN : extreme;
  };
}

/**
 * One `ta.lowest(source, length)` call site with a series length (a different length on each call), called with
 * `(value, length)`.
 *
 * PineScript rules (measured with a length that changes on each bar):
 * - the extreme is kept with its bar; a new value that passes it replaces it; when the kept extreme is `length`
 *   calls old, the last `length` values are scanned again (na skipped, the oldest wins a tie)
 * - a length smaller than on the previous call: the last `length` values are scanned again
 * - a length larger than on the previous call: the values that enter the window at its old end are compared with the
 *   extreme; when one of them is na, the extreme restarts from the current value (the values in between are not read)
 * - an na value gives na and resets the extreme; na before call `length - 1`
 *
 * @example
 * ```typescript
 * // Pine:  lowPrice = ta.lowest(close[1], lookback)   // lookback changes per bar
 * const lowPrice = callsite.lowest();
 * const out = closes.map((_, i) => lowPrice(i > 0 ? closes[i - 1]! : NaN, lookback[i]!));
 * ```
 */
export function lowest(): (value: number, length: number) => number {
  return extremeSite(true);
}

/**
 * One `ta.highest(source, length)` call site with a series length (a different length on each call), called with
 * `(value, length)`. Same rules as {@link lowest}.
 */
export function highest(): (value: number, length: number) => number {
  return extremeSite(false);
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

