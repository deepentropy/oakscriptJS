/**
 * PineScript comparison operators (`==`, `!=`, `<`, `<=`, `>`, `>=`) on numbers.
 *
 * PineScript rules:
 * - the operators use an absolute tolerance of 1e-10: `a == b` when `|a - b| <= 1e-10`, `a < b` when
 *   `b - a > 1e-10` (the same for every magnitude; `0.1 + 0.2 == 0.3` is true)
 * - every comparison with an `na` operand is false, `!=` included
 * - built-in functions (`ta.crossover`, `ta.pivothigh`, `ta.highestbars`...) compare exactly
 *
 * The `Series` comparison methods (`gt`, `gte`, `lt`, `lte`, `eq`, `neq`) follow the same rules.
 */

/** Tolerance of PineScript's comparison operators. */
export const EPSILON = 1e-10;

const valid = (a: number, b: number): boolean => !Number.isNaN(a) && !Number.isNaN(b);

/** PineScript `a == b`. */
export function eq(a: number, b: number): boolean {
  return valid(a, b) && Math.abs(a - b) <= EPSILON;
}

/** PineScript `a != b` (false when an operand is `na`). */
export function ne(a: number, b: number): boolean {
  return valid(a, b) && Math.abs(a - b) > EPSILON;
}

/** PineScript `a < b`. */
export function lt(a: number, b: number): boolean {
  return valid(a, b) && b - a > EPSILON;
}

/** PineScript `a <= b`. */
export function le(a: number, b: number): boolean {
  return valid(a, b) && a - b <= EPSILON;
}

/** PineScript `a > b`. */
export function gt(a: number, b: number): boolean {
  return valid(a, b) && a - b > EPSILON;
}

/** PineScript `a >= b`. */
export function ge(a: number, b: number): boolean {
  return valid(a, b) && b - a <= EPSILON;
}
