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

/** A call site that keeps the two previous arguments (na before the first call). */
function twoSeriesSite(test: (a: number, b: number, prevA: number, prevB: number) => boolean) {
  let prevA = NaN;
  let prevB = NaN;
  return (a: number, b: number): boolean => {
    const result = test(a, b, prevA, prevB);
    prevA = a;
    prevB = b;
    return result;
  };
}

/** One `ta.crossover(a, b)` call site: false on its first call, as its history is na. */
export function crossover(): (a: number, b: number) => boolean {
  return twoSeriesSite((a, b, pa, pb) => a > b && pa <= pb);
}

/** One `ta.crossunder(a, b)` call site: false on its first call, as its history is na. */
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

/** One `ta.cross(a, b)` call site: false on its first call, as its history is na. */
export function cross(): (a: number, b: number) => boolean {
  return twoSeriesSite((a, b, pa, pb) => (a > b && pa <= pb) || (a < b && pa >= pb));
}
