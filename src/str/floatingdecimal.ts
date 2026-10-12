/**
 * Decimal digits of a double as PineScript's plain `str.tostring` produces them.
 *
 * PineScript formats a number without a format with the digits of the classic binary to decimal conversion of the
 * JVM (the one `Double.toString` used before Java 19), then rounds them to 10 decimals half to even, with two
 * flags of the conversion deciding a tie on the last digit: digits that were rounded up are not rounded up again,
 * digits that were cut on a '5' are. These digits are not always the shortest ones: 78195689105219552 keeps all
 * its digits (the shortest form is 78195689105219550), and 1990736.000001111 has 16 digits where rounding the exact
 * value would give 1990736.0000011111 (#174).
 */

/** Digits d1d2d3... of |x| = 0.d1d2d3... × 10^decExponent, with the flags of the conversion. */
export interface ConvertedDigits {
  digits: string;
  decExponent: number;
  /** The last digit was rounded up */
  roundedUp: boolean;
  /** The digits are the exact value of the double */
  exact: boolean;
}

const EXP_SHIFT = 52;
const MAX_SMALL_BIN_EXP = 62;
const MIN_SMALL_BIN_EXP = -21;
// approximately ceil(log2(5^i))
const N_5_BITS = [0, 3, 5, 7, 10, 12, 14, 17, 19, 21, 24, 26, 28, 31, 33, 35, 38, 40, 42, 45, 47, 49, 52, 54, 56, 59, 61];
// number of decimal digits of 2^i minus one, for i < 64
const INSIGNIFICANT_DIGITS = [
  0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10,
  11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19,
];
const LONG_5_POW_LENGTH = 27;
const view = new DataView(new ArrayBuffer(8));

const int32 = (v: bigint): bigint => BigInt.asIntN(32, v);
const int64 = (v: bigint): bigint => BigInt.asIntN(64, v);

function trailingZeros(v: bigint): number {
  let n = 0;
  while ((v & 1n) === 0n) {
    v >>= 1n;
    n++;
  }
  return n;
}

/** floor(log10(x)) estimate of the conversion (it can be one too high). */
function estimateDecExp(fractBits: bigint, binExp: number): number {
  view.setBigUint64(0, (1023n << 52n) | (fractBits & 0xfffffffffffffn));
  const d2 = view.getFloat64(0);
  const d = (d2 - 1.5) * 0.289529654 + 0.176091259 + binExp * 0.301029995663981;
  // the conversion truncates toward zero and corrects negative non-integers down
  const r = Math.trunc(d);
  return d < 0 && r !== d ? r - 1 : r;
}

/** Digits of a positive finite double, as the JVM converter gives them. */
export function convertDouble(x: number): ConvertedDigits {
  view.setFloat64(0, Math.abs(x));
  const bits = view.getBigUint64(0);
  let fractBits = bits & 0xfffffffffffffn;
  let binExp = Number((bits >> 52n) & 0x7ffn);
  if (binExp === 0 && fractBits === 0n) return { digits: '0', decExponent: 1, roundedUp: false, exact: false };
  let nSignificantBits: number;
  if (binExp === 0) {
    const leadingZeros = 64 - fractBits.toString(2).length;
    const shift = leadingZeros - (63 - EXP_SHIFT);
    fractBits <<= BigInt(shift);
    binExp = 1 - shift;
    nSignificantBits = 64 - leadingZeros;
  } else {
    fractBits |= 1n << 52n;
    nSignificantBits = EXP_SHIFT + 1;
  }
  binExp -= 1023;

  const tailZeros = trailingZeros(fractBits);
  const nFractBits = EXP_SHIFT + 1 - tailZeros;
  const nTinyBits = Math.max(0, nFractBits - binExp - 1);

  // an integer that fits in a long: its digits, the low ones rounded away when they are not significant
  if (
    binExp <= MAX_SMALL_BIN_EXP &&
    binExp >= MIN_SMALL_BIN_EXP &&
    nTinyBits < LONG_5_POW_LENGTH &&
    nFractBits + N_5_BITS[nTinyBits]! < 64 &&
    nTinyBits === 0
  ) {
    const p2 = binExp - nSignificantBits - 1;
    const insignificant = binExp > nSignificantBits && p2 > 1 && p2 < INSIGNIFICANT_DIGITS.length ? INSIGNIFICANT_DIGITS[p2]! : 0;
    let lvalue = binExp >= EXP_SHIFT ? fractBits << BigInt(binExp - EXP_SHIFT) : fractBits >> BigInt(EXP_SHIFT - binExp);
    if (insignificant !== 0) {
      const pow10 = 10n ** BigInt(insignificant);
      const residue = lvalue % pow10;
      lvalue /= pow10;
      if (residue >= pow10 >> 1n) lvalue++;
    }
    const s = lvalue.toString();
    return { digits: s.replace(/0+$/, ''), decExponent: insignificant + s.length, roundedUp: false, exact: false };
  }

  let decExp = estimateDecExp(fractBits, binExp);
  const B5 = Math.max(0, -decExp);
  let B2 = B5 + nTinyBits + binExp;
  const S5 = Math.max(0, decExp);
  let S2 = S5 + nTinyBits;
  const M5 = B5;
  let M2 = B2 - nSignificantBits;

  fractBits >>= BigInt(tailZeros);
  B2 -= nFractBits - 1;
  const common2factor = Math.min(B2, S2);
  B2 -= common2factor;
  S2 -= common2factor;
  M2 -= common2factor;
  // an exact power of two: the next smaller double is half as far
  if (nFractBits === 1) M2 -= 1;
  if (M2 < 0) {
    B2 -= M2;
    S2 -= M2;
    M2 = 0;
  }

  const digits: number[] = [];
  let low: boolean;
  let high: boolean;
  let lowDigitDifference: bigint;
  let exact: boolean;
  const Bbits = nFractBits + B2 + (B5 < N_5_BITS.length ? N_5_BITS[B5]! : B5 * 3);
  const tenSbits = S2 + 1 + (S5 + 1 < N_5_BITS.length ? N_5_BITS[S5 + 1]! : (S5 + 1) * 3);
  // two digits at least in the exponent form
  const minTwo = decExp < -3 || decExp >= 8;

  if (Bbits < 64 && tenSbits < 64) {
    // int or long arithmetic, with its overflows
    const wrap = Bbits < 32 && tenSbits < 32 ? int32 : int64;
    let b = wrap((fractBits * 5n ** BigInt(B5)) << BigInt(B2));
    const s = wrap(5n ** BigInt(S5) << BigInt(S2));
    let m = wrap(5n ** BigInt(M5) << BigInt(M2));
    const tens = wrap(s * 10n);
    let q = Number(b / s);
    b = wrap(10n * (b % s));
    m = wrap(m * 10n);
    low = b < m;
    high = wrap(b + m) > tens;
    if (q === 0 && !high) decExp--;
    else digits.push(q);
    if (minTwo) high = low = false;
    while (!low && !high) {
      q = Number(b / s);
      b = wrap(10n * (b % s));
      m = wrap(m * 10n);
      if (m > 0n) {
        low = b < m;
        high = wrap(b + m) > tens;
      } else {
        low = true;
        high = true;
      }
      digits.push(q);
    }
    lowDigitDifference = wrap((b << 1n) - tens);
    exact = b === 0n;
  } else {
    let b = (fractBits * 5n ** BigInt(B5)) << BigInt(B2);
    const s = 5n ** BigInt(S5) << BigInt(S2);
    let m = 5n ** BigInt(M5 + 1) << BigInt(M2 + 1);
    const tens = s * 10n;
    let q = Number(b / s);
    b = (b % s) * 10n;
    low = b < m;
    high = b + m >= tens;
    if (q === 0 && !high) decExp--;
    else digits.push(q);
    if (minTwo) high = low = false;
    while (!low && !high) {
      q = Number(b / s);
      b = (b % s) * 10n;
      m *= 10n;
      low = b < m;
      high = b + m >= tens;
      digits.push(q);
    }
    lowDigitDifference = high && low ? (b << 1n) - tens : 0n;
    exact = b === 0n;
  }

  let decExponent = decExp + 1;
  let roundedUp = false;
  const roundup = (): void => {
    let i = digits.length - 1;
    while (digits[i] === 9 && i > 0) digits[i--] = 0;
    if (digits[i] === 9) {
      decExponent += 1;
      digits[0] = 1;
      return;
    }
    digits[i]! += 1;
    roundedUp = true;
  };
  if (high) {
    if (!low) roundup();
    else if (lowDigitDifference === 0n) {
      if (digits[digits.length - 1]! % 2 !== 0) roundup();
    } else if (lowDigitDifference > 0n) roundup();
  }
  const text = digits.join('').replace(/0+$/, '');
  return { digits: text || '0', decExponent, roundedUp, exact };
}

/**
 * `|x|` with at most `maxFrac` decimals, as the JVM's decimal formatter rounds the converted digits (half to even;
 * a tie on the last converted digit is decided by the conversion flags). Returns the digits and the position of the
 * decimal point (value = 0.digits × 10^intLen); "" for zero.
 */
export function javaFixedDigits(x: number, maxFrac: number): { digits: string; intLen: number } {
  if (x === 0) return { digits: '', intLen: 0 };
  const c = convertDouble(x);
  const digits = [...c.digits].map(Number);
  let decimalAt = c.decExponent;
  // the formatter reads the conversion's text, which ends in ".0" when no digit follows the point ("5.0E-11",
  // "120.0"): that zero is a digit for the tie test below (5e-11 to 10 decimals gives 0)
  const n = digits.length;
  if (decimalAt > 0 && decimalAt < 8) {
    if (n <= decimalAt) digits.push(...Array<number>(decimalAt - n + 1).fill(0));
  } else if (decimalAt <= -3 || decimalAt >= 8) {
    if (n === 1) digits.push(0);
  }
  let count = digits.length;

  const shouldRoundUp = (keep: number): boolean => {
    if (keep >= count) return false;
    if (digits[keep]! > 5) return true;
    if (digits[keep] !== 5) return false;
    if (keep === count - 1) {
      if (c.exact) return keep > 0 && digits[keep - 1]! % 2 !== 0;
      return !c.roundedUp;
    }
    for (let i = keep + 1; i < count; i++) if (digits[i] !== 0) return true;
    return false;
  };

  if (-decimalAt > maxFrac) return { digits: '', intLen: 0 };
  if (-decimalAt === maxFrac) {
    return shouldRoundUp(0) ? { digits: '1', intLen: decimalAt + 1 } : { digits: '', intLen: 0 };
  }
  while (count > 1 && digits[count - 1] === 0) count--;
  let keep = maxFrac + decimalAt;
  if (keep >= 0 && keep < count) {
    if (shouldRoundUp(keep)) {
      do {
        keep--;
        if (keep < 0) {
          digits[0] = 1;
          decimalAt++;
          keep = 0;
          break;
        }
        digits[keep]! += 1;
      } while (digits[keep]! > 9);
      keep++;
    }
    count = keep;
    while (count > 1 && digits[count - 1] === 0) count--;
  }
  const text = digits.slice(0, count).join('').replace(/0+$/, '');
  return { digits: text, intLen: text ? decimalAt : 0 };
}
