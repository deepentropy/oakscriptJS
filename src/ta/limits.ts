/**
 * History limits of the window functions.
 *
 * PineScript stops a script when `ta.highest` / `ta.lowest` / `ta.highestbars` / `ta.lowestbars` ask for more than
 * 15,000 bars (runtime error RE10004): with a constant length on the first bar, with a length that changes on the
 * bar where it passes the limit. `math.sum`, `ta.sma`, `ta.variance`, `ta.stdev` and `ta.bb` have the same error
 * above 5,000 bars; the message names the function that keeps the window ('stdev'->'variance', 'bb'->'sma').
 */

/** Largest length of `ta.highest` / `ta.lowest` / `ta.highestbars` / `ta.lowestbars`. */
export const MAX_WINDOW_LENGTH = 15000;

/** Largest length of `math.sum` / `ta.sma` / `ta.variance` / `ta.stdev` / `ta.bb`. */
export const MAX_SUM_LENGTH = 5000;

/** Names of the PineScript message for the functions with the 5,000 limit ("a->b": a calls b). */
export const SUM_FUNCTIONS: Record<string, string> = {
  'math.sum': 'sum',
  'ta.sma': 'sma',
  'ta.variance': 'variance',
  'ta.stdev': 'stdev->variance',
  'ta.bb': 'bb->sma',
};

/**
 * PineScript's runtime error RE10004 text; `bar` is the bar index of the call when it is known. `name` is the
 * function, or a call path "stdev->variance" (printed 'stdev'->'variance').
 */
export function windowError(name: string, length: number, bar?: number, max = MAX_WINDOW_LENGTH): string {
  const fn = name.split('->').map((part) => `'${part}'`).join('->');
  return (
    (bar === undefined ? '' : `Error on bar ${bar}: `) +
    `The ${fn} function references too many historical candles (${length}), the limit is ${max}.`
  );
}

/** Throws RE10004 when the (truncated) length of a window function is above the limit. */
export function checkWindowLength(name: string, length: number, bar?: number, max = MAX_WINDOW_LENGTH): void {
  const len = Math.trunc(length);
  if (len <= 0) throw new Error(lengthError(name, len, bar));
  if (len > max) throw new Error(windowError(name, len, bar, max));
}

/** Throws RE10004 for a function of {@link SUM_FUNCTIONS} ("ta.sma", ...) with a length above 5,000. */
export function checkSumLength(name: string, length: number, bar?: number): void {
  const fn = SUM_FUNCTIONS[name];
  if (fn === undefined) return;
  // RE10001 names 'bb' itself, RE10004 its inner 'sma'
  checkPositiveLength(name === 'ta.bb' ? 'bb' : fn, length, bar);
  checkWindowLength(fn, length, bar, MAX_SUM_LENGTH);
}

/**
 * PineScript's runtime error RE10001 text for a length that is 0 or negative. `name` is the function, or a call path
 * "atr->rma" (printed 'atr'->'rma'); the value prints as a float ("0.0", "-1.0").
 */
export function lengthError(name: string, value: number, bar?: number, arg = 'length'): string {
  const fn = name.split('->').map((part) => `'${part}'`).join('->');
  const text = Number.isInteger(value) ? value.toFixed(1) : String(value);
  return (
    (bar === undefined ? '' : `Error on bar ${bar}: `) +
    `Invalid value of the '${arg}' argument (${text}) in the ${fn} function. It must be > 0.`
  );
}

/**
 * Throws RE10001 when the (truncated) length is 0 or negative, as PineScript does for every window function on the
 * bar of the call (#175): `ta.sma(close, 0)` stops on bar 0, a series length that becomes 0 on the bar where it
 * does. `ta.hma(src, 1)` stops in its inner `wma(src, 0)`. An na length is not checked here.
 */
export function checkPositiveLength(name: string, length: number, bar?: number, arg = 'length'): void {
  const len = Math.trunc(length);
  if (len <= 0) throw new Error(lengthError(name, len, bar, arg));
}
