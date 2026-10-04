/**
 * Number patterns ("#.##", "#,##0.00", "0.00E0", "#.##%", "'#'#.##") as PineScript formats them.
 *
 * The pattern syntax is Java's DecimalFormat: `0` required digit, `#` optional digit, `,` grouping,
 * `.` decimal point, `E0` exponent, `%` multiplies by 100, `'...'` quoted literal text.
 * PineScript rules:
 * - `str.tostring` rounds half away from zero on the shortest decimal form of the number
 *   (`1.005` with "#.##" gives "1.01", `2.5` with "#" gives "3")
 * - `str.format` rounds half to even on the exact binary value (`0.25` with "#.#" gives "0.2")
 * - a negative number that rounds to zero loses its sign; "#.00" writes `.50` (no leading zero),
 *   but "#.##" writes `0.5` (a pattern without any '0' shows one integer digit)
 * - with an exponent, the value is first rounded to the fraction digits ("0.00E0": 0.125 gives "1.30E-1")
 * - a pattern without digit characters (`format.price` is "price") formats like "#" after its text,
 *   and keeps the sign: -0.004 gives "-price0"
 * - "pos;neg": a negative number uses the text around the digits of the negative subpattern instead of "-"
 *   ("#.##;(#.##)" gives "(3.5)" for -3.5); the digits follow the positive subpattern, as in Java
 * - at most 16 decimals when |x| >= 1e-3 (the shortest digits of a double never have more there):
 *   0.1 with 20 '#' decimals gives "0.1" in both rounding modes
 */

export type Rounding = 'halfUpShortest' | 'halfEvenExact';

interface Pattern {
  prefix: string;
  suffix: string;
  /** Text around the digits of the negative subpattern ("pos;neg"), or null without one */
  negPrefix: string | null;
  negSuffix: string | null;
  minInt: number;
  minFrac: number;
  maxFrac: number;
  /** Digits per group, 0 without grouping */
  grouping: number;
  percent: boolean;
  /** Minimum exponent digits, or null without exponent */
  exponent: number | null;
  hasDigits: boolean;
}

const patterns = new Map<string, Pattern>();

/** Index of the first ';' outside quotes, or -1. */
function subpatternSplit(pattern: string): number {
  let quoted = false;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "'") quoted = !quoted;
    else if (pattern[i] === ';' && !quoted) return i;
  }
  return -1;
}

function parsePattern(pattern: string): Pattern {
  const cached = patterns.get(pattern);
  if (cached) return cached;
  const semi = subpatternSplit(pattern);
  if (semi !== -1) {
    // only the text around the digits of the negative subpattern is used
    const neg = parsePattern(pattern.slice(semi + 1));
    const parsed = { ...parsePattern(pattern.slice(0, semi)), negPrefix: neg.prefix, negSuffix: neg.suffix };
    patterns.set(pattern, parsed);
    return parsed;
  }

  let prefix = '';
  let suffix = '';
  let number = '';
  let percent = false;
  let phase: 'prefix' | 'number' | 'suffix' = 'prefix';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!;
    let literal: string;
    if (ch === "'") {
      const end = pattern.indexOf("'", i + 1);
      if (end === i + 1) {
        literal = "'";
        i = end;
      } else {
        literal = pattern.slice(i + 1, end === -1 ? undefined : end);
        i = end === -1 ? pattern.length : end;
      }
    } else if (phase !== 'suffix' && ('#0,.'.includes(ch) || (phase === 'number' && ch === 'E'))) {
      phase = 'number';
      number += ch;
      continue;
    } else {
      if (ch === '%') percent = true;
      literal = ch;
    }
    if (phase === 'number') phase = 'suffix';
    if (phase === 'prefix') prefix += literal;
    else suffix += literal;
  }

  const [mantissa = '', exp] = number.split('E');
  const [intPart = '', fracPart = ''] = mantissa.split('.');
  const lastComma = intPart.lastIndexOf(',');
  const parsed: Pattern = {
    prefix,
    suffix,
    negPrefix: null,
    negSuffix: null,
    // as in Java, a pattern with a decimal point and no '0' at all ("#.##") shows one integer digit
    minInt: !mantissa.includes('0') && mantissa.includes('.') ? 1 : [...intPart].filter((c) => c === '0').length,
    minFrac: [...fracPart].filter((c) => c === '0').length,
    maxFrac: [...fracPart].filter((c) => c === '0' || c === '#').length,
    grouping: lastComma === -1 ? 0 : intPart.length - lastComma - 1,
    percent,
    exponent: exp === undefined ? null : exp.length,
    hasDigits: /[0#]/.test(mantissa),
  };
  patterns.set(pattern, parsed);
  return parsed;
}

/** Decimal digits of |x|: value = 0.d1d2d3... × 10^intLen (no leading zero digit; "" for 0). */
interface Digits {
  digits: string;
  intLen: number;
}

function shortestDigits(x: number): Digits {
  const m = /^(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(String(Math.abs(x)))!;
  const all = m[1]! + (m[2] ?? '');
  let intLen = m[1]!.length + Number(m[3] ?? 0);
  const lead = all.length - all.replace(/^0+/, '').length;
  intLen -= lead;
  const digits = all.slice(lead).replace(/0+$/, '');
  return { digits, intLen: digits ? intLen : 0 };
}

/** Exact decimal expansion of the double |x|. */
function exactDigits(x: number): Digits {
  const abs = Math.abs(x);
  if (abs === 0) return { digits: '', intLen: 0 };
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, abs);
  const bits = view.getBigUint64(0);
  const expBits = Number((bits >> 52n) & 0x7ffn);
  let mant = bits & 0xfffffffffffffn;
  const e2 = expBits === 0 ? -1074 : expBits - 1075;
  if (expBits !== 0) mant |= 1n << 52n;
  let str: string;
  let fracDigits: number;
  if (e2 >= 0) {
    str = (mant << BigInt(e2)).toString();
    fracDigits = 0;
  } else {
    str = (mant * 5n ** BigInt(-e2)).toString();
    fracDigits = -e2;
  }
  const intLen = str.length - fracDigits;
  const lead = str.length - str.replace(/^0+/, '').length;
  const digits = str.slice(lead).replace(/0+$/, '');
  return { digits, intLen: intLen - lead };
}

/** Rounds to `frac` digits after the point. */
function roundDigits(d: Digits, frac: number, mode: Rounding): Digits {
  const keep = d.intLen + frac;
  if (keep >= d.digits.length) return d;
  if (keep < 0) return { digits: '', intLen: 0 };
  const first = d.digits.charCodeAt(keep) - 48;
  let up: boolean;
  if (mode === 'halfUpShortest') up = first >= 5;
  else if (first !== 5) up = first > 5;
  else if (d.digits.length > keep + 1) up = true;
  else up = keep > 0 && (d.digits.charCodeAt(keep - 1) - 48) % 2 === 1;
  let kept = d.digits.slice(0, keep);
  let intLen = d.intLen;
  if (up) {
    const n = (BigInt(kept || '0') + 1n).toString();
    if (n.length > kept.length) intLen += 1;
    kept = n;
  }
  kept = kept.replace(/0+$/, '');
  return { digits: kept, intLen: kept ? intLen : 0 };
}

function group(int: string, size: number): string {
  if (!size || int.length <= size) return int;
  const parts: string[] = [];
  for (let end = int.length; end > 0; end -= size) parts.unshift(int.slice(Math.max(0, end - size), end));
  return parts.join(',');
}

function layout(d: Digits, p: Pattern): string {
  let int = d.intLen > 0 ? d.digits.slice(0, d.intLen).padEnd(d.intLen, '0') : '';
  int = int.replace(/^0+/, '').padStart(p.minInt, '0');
  let frac = d.intLen < 0 ? '0'.repeat(-d.intLen) + d.digits : d.digits.slice(Math.max(0, d.intLen));
  frac = frac.slice(0, p.maxFrac).replace(/0+$/, '').padEnd(p.minFrac, '0');
  if (!int && !frac) int = '0';
  return group(int, p.grouping) + (frac ? '.' + frac : '');
}

/** Formats a number with a DecimalFormat pattern. */
export function formatNumber(value: number, pattern: string, mode: Rounding): string {
  if (Number.isNaN(value)) return 'NaN';
  const p = parsePattern(pattern);
  if (!Number.isFinite(value)) return affixes(p, value < 0, '∞');
  const x = p.percent ? value * 100 : value;
  const toDigits = mode === 'halfUpShortest' ? shortestDigits : exactDigits;

  let body: string;
  let isZero: boolean;
  if (p.exponent !== null) {
    const rounded = roundDigits(toDigits(x), p.maxFrac, mode);
    const intDigits = Math.max(p.minInt, 1);
    isZero = rounded.digits === '';
    let exponent = isZero ? 0 : rounded.intLen - intDigits;
    let mant = roundDigits({ digits: rounded.digits, intLen: isZero ? 0 : intDigits }, p.maxFrac, mode);
    if (mant.intLen > intDigits) {
      exponent += 1;
      mant = { digits: mant.digits, intLen: intDigits };
    }
    const e = String(Math.abs(exponent)).padStart(p.exponent, '0');
    body = layout(mant, p) + 'E' + (exponent < 0 ? '-' : '') + e;
  } else {
    // 16 decimals at most from 1e-3 up (the shortest digits of a double have no more there)
    const frac = !p.hasDigits ? 0 : Math.abs(x) >= 1e-3 ? Math.min(p.maxFrac, 16) : p.maxFrac;
    const rounded = roundDigits(toDigits(x), frac, mode);
    isZero = rounded.digits === '';
    body = p.hasDigits ? layout(rounded, p) : layout(rounded, { ...p, minInt: 0, maxFrac: 0, minFrac: 0 });
  }
  return affixes(p, x < 0 && (!isZero || !p.hasDigits), body);
}

/** `body` with the text of the positive pattern, or of the negative one ("-" + prefix without "pos;neg"). */
function affixes(p: Pattern, negative: boolean, body: string): string {
  if (!negative) return p.prefix + body + p.suffix;
  if (p.negPrefix === null) return '-' + p.prefix + body + p.suffix;
  return p.negPrefix + body + p.negSuffix!;
}
