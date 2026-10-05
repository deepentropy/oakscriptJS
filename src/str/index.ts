/**
 * String namespace
 * Mirrors PineScript's str.* functions for string manipulation and analysis.
 *
 * @remarks
 * All string functions in this namespace follow PineScript v6 API specifications.
 * String operations are case-sensitive unless otherwise specified.
 *
 * @version 6
 */

import { formatNumber } from './numberformat.js';
import { formatMessage } from './messageformat.js';
import { formatDate } from './dateformat.js';
import { round_to_mintick } from '../math/index.js';
import type { int, bool, float, simple_int, simple_string } from '../types/index.js';

/**
 * Returns the length of a string.
 *
 * @param str - The string to measure
 * @returns The number of characters in the string
 *
 * @example
 * ```typescript
 * str.length("Hello") // Returns: 5
 * str.length("") // Returns: 0
 * ```
 */
export function length(str: simple_string): int {
  return str.length;
}

/**
 * Converts a value to its string representation (PineScript `str.tostring`).
 *
 * @param value - The value to convert (number, boolean, string, etc.)
 * @param format - Optional number format: a pattern ("#.##", "#,###.00", "0.00%", "0.00E0", "#.##;(#.##)") or
 *   `format.percent` ("percent"), `format.volume` ("volume"), `format.mintick` ("mintick"),
 *   `format.price` / `format.inherit`
 * @param mintick - Tick size for `format.mintick` (PineScript `syminfo.mintick`, implicit there). Not part of the
 *   PineScript signature: the core function cannot see the chart, so pass it, as for `math.round_to_mintick`
 * @returns String representation of the value
 *
 * @remarks
 * As in PineScript:
 * - without format, numbers show up to 10 decimals ("0.3333333333"); 1e21 and more use "1E21"
 * - patterns round half away from zero on the shortest decimal form: 1.005 with "#.##" gives "1.01";
 *   at most 16 decimals from 1e-3 up (0.0012345678901234567 with 20 '#' decimals gives "0.0012345678901235")
 * - "pos;neg" patterns: a negative number takes the text of the negative subpattern ("#.##;(#.##)": "(3.5)")
 * - "#" is an optional digit ("1.5" with "#.##"), "0" a required digit ("1.50" with "0.00"),
 *   "," groups thousands, "%" multiplies by 100, 'text' is literal text
 * - `format.percent` shows 2 decimals and "%" without multiplying; `format.volume` uses K, M, B, T
 * - `format.price` and `format.inherit` give "price1" / "inherit1" in PineScript: they are patterns
 *   without digit characters, and oakscriptjs does the same
 * - `format.mintick` rounds to the tick (`math.round_to_mintick`) and shows the tick's decimals ("#.##" for 0.01);
 *   it throws without `mintick`
 * - na gives "NaN" ("NaN%" with `format.percent`); an infinity gives "NaN" too ("NaN%" for `format.percent`,
 *   "NaNT" for `format.volume`), except `format.mintick`, which gives "Infinity" / "-Infinity"
 *
 * @example
 * ```typescript
 * str.tostring(123) // "123"
 * str.tostring(1.5, "#.##") // "1.5"
 * str.tostring(0.5, "#.00") // ".50"
 * str.tostring(12345.678, format.volume) // "12.346K"
 * ```
 */
export function tostring(value: any, format?: simple_string, mintick?: float): string {
  if (typeof value !== 'number') return String(value);
  if (Number.isNaN(value)) return format === 'percent' ? 'NaN%' : 'NaN';
  if (!Number.isFinite(value)) {
    // the chart formatter has no infinity: NaN with the format's suffix
    if (format === 'mintick') return String(value);
    return format === 'percent' ? 'NaN%' : format === 'volume' ? 'NaNT' : 'NaN';
  }
  if (format === undefined || format === '') {
    if (Math.abs(value) >= 1e21 && Number.isFinite(value)) {
      return String(value).replace('e+', 'E').replace(/\.0+E/, 'E');
    }
    return formatNumber(value, '#.##########', 'halfUpShortest');
  }
  switch (format) {
    case 'percent':
      return formatNumber(value, '0.00', 'halfUpShortest') + '%';
    case 'volume': {
      const abs = Math.abs(value);
      for (const [size, unit] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']] as const) {
        if (abs >= size) return formatNumber(value / size, '#.###', 'halfUpShortest') + unit;
      }
      return formatNumber(value, '#', 'halfUpShortest');
    }
    case 'mintick': {
      if (mintick === undefined) {
        throw new Error('str.tostring(x, format.mintick) needs the tick size: pass it as str.tostring(x, format.mintick, syminfo.mintick)');
      }
      // mask: one '#' per decimal of the tick ("#.##" for 0.01, "#" for 1)
      const m = /^\d+(?:\.(\d+))?(?:e-(\d+))?$/.exec(String(mintick));
      const decimals = m ? (m[1]?.length ?? 0) + Number(m[2] ?? 0) : 0;
      const mask = decimals ? '#.' + '#'.repeat(decimals) : '#';
      return formatNumber(round_to_mintick(value, mintick), mask, 'halfUpShortest');
    }
    default:
      return formatNumber(value, format, 'halfUpShortest');
  }
}

/**
 * Converts a string to a number (float).
 *
 * @param str - The string to convert
 * @returns The numeric value, or null (na) if conversion fails
 *
 * @remarks
 * As in PineScript:
 * - The whole text must be a number: a sign, digits and one optional "." ("0.5", ".5", "5.", "-12"); "12abc" is na
 * - Scientific notation ("1e3"), "Infinity", "NaN", hexadecimal, "1,000" give na
 * - The characters U+0000 to U+0020 (space, tab, line feed...) around the number are ignored; other spaces
 *   (no-break space U+00A0, U+3000) give na
 *
 * @example
 * ```typescript
 * str.tonumber("123") // Returns: 123
 * str.tonumber("45.67") // Returns: 45.67
 * str.tonumber("abc") // Returns: null
 * str.tonumber("12abc") // Returns: null
 * str.tonumber("1e3") // Returns: null
 * ```
 */
export function tonumber(str: simple_string): float | null {
  // remove the characters U+0000..U+0020 at both ends
  let start = 0;
  let end = str.length;
  while (start < end && str.charCodeAt(start) <= 0x20) start++;
  while (end > start && str.charCodeAt(end - 1) <= 0x20) end--;
  const text = str.slice(start, end);
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)) return null;
  return parseFloat(text);
}

/**
 * Extracts a substring from a string.
 *
 * @param str - The source string
 * @param begin - Starting index (0-based, inclusive)
 * @param end - Ending index (0-based, exclusive). If omitted, extracts to end of string
 * @returns The extracted substring
 *
 * @remarks
 * - An na `end` (NaN / null) is a runtime error in PineScript: it throws
 * - If begin > end, indices are swapped (JavaScript behavior)
 * - Negative indices are treated as 0
 * - Indices beyond string length return empty string
 *
 * @example
 * ```typescript
 * str.substring("hello world", 0, 5) // Returns: "hello"
 * str.substring("hello world", 6) // Returns: "world"
 * str.substring("test", 1, 3) // Returns: "es"
 * ```
 */
export function substring(str: simple_string, begin: simple_int, end?: simple_int): string {
  if (end === null || Number.isNaN(end)) throw new Error('str.substring: the end position is na');
  return str.substring(begin, end);
}

/**
 * Converts all characters in a string to uppercase.
 *
 * @param str - The string to convert
 * @returns The uppercase string
 *
 * @example
 * ```typescript
 * str.upper("hello") // Returns: "HELLO"
 * str.upper("Hello World") // Returns: "HELLO WORLD"
 * str.upper("test123") // Returns: "TEST123"
 * ```
 */
export function upper(str: simple_string): string {
  return str.toUpperCase();
}

/**
 * Converts all characters in a string to lowercase.
 *
 * @param str - The string to convert
 * @returns The lowercase string
 *
 * @example
 * ```typescript
 * str.lower("HELLO") // Returns: "hello"
 * str.lower("Hello World") // Returns: "hello world"
 * str.lower("TEST123") // Returns: "test123"
 * ```
 */
export function lower(str: simple_string): string {
  return str.toLowerCase();
}

/**
 * Checks if a string contains a substring.
 *
 * @param source - The string to search in
 * @param str - The substring to search for
 * @returns True if source contains str, false otherwise
 *
 * @remarks
 * - Search is case-sensitive
 * - Empty string is contained in any string
 *
 * @example
 * ```typescript
 * str.contains("hello world", "world") // Returns: true
 * str.contains("hello world", "World") // Returns: false (case-sensitive)
 * str.contains("test", "xyz") // Returns: false
 * ```
 */
export function contains(source: simple_string, str: simple_string): bool {
  return source.includes(str);
}

/**
 * Returns the position of the first occurrence of a substring.
 *
 * @param source - The string to search in
 * @param str - The substring to search for
 * @returns The 0-based index of the first occurrence, or na (NaN) if not found
 *
 * @remarks
 * - Search is case-sensitive
 * - Returns 0 for empty search string
 * - Returns na (NaN) if substring is not found, as in PineScript
 *
 * @example
 * ```typescript
 * str.pos("hello world", "world") // Returns: 6
 * str.pos("hello world", "o") // Returns: 4 (first occurrence)
 * str.pos("hello", "xyz") // Returns: NaN (na)
 * ```
 */
export function pos(source: simple_string, str: simple_string): int {
  const index = source.indexOf(str);
  return index === -1 ? NaN : index;
}

/**
 * Replaces the Nth occurrence of a substring (PineScript `str.replace`).
 *
 * @param source - The source string
 * @param target - The substring to replace
 * @param replacement - The string to replace with
 * @param occurrence - 0-based occurrence to replace (default 0, the first one)
 * @returns The string with one occurrence replaced
 *
 * @remarks
 * PineScript rules:
 * - only the Nth occurrence is replaced; an na occurrence is 0 (`str.replace("aaa", "a", "-", na)` is "-aa")
 * - occurrences overlap: "aa" occurs at 0 and 1 in "aaa" (`str.replace("aaa", "aa", "-", 1)` is "a-")
 * - an empty target inserts the replacement at character N, at most at the end
 *   (`str.replace("abc", "", "-", 2)` is "ab-c")
 * - fewer than N + 1 occurrences (or a negative N) leave the source unchanged
 *
 * @example
 * ```typescript
 * str.replace("hello world hello", "hello", "hi") // Returns: "hi world hello"
 * str.replace("hello world hello", "hello", "hi", 1) // Returns: "hello world hi"
 * str.replace("test", "xyz", "abc") // Returns: "test"
 * ```
 */
export function replace(source: simple_string, target: simple_string, replacement: simple_string, occurrence: simple_int = 0): string {
  const n = occurrence === null || Number.isNaN(occurrence) ? 0 : Math.trunc(occurrence);
  if (n < 0) return source;
  let index: number;
  if (target === '') {
    index = Math.min(n, source.length);
  } else {
    index = -1;
    for (let k = 0; k <= n; k++) {
      index = source.indexOf(target, index + 1);
      if (index === -1) return source;
    }
  }
  return source.slice(0, index) + replacement + source.slice(index + target.length);
}

/**
 * Replaces all occurrences of a target string with a replacement string.
 *
 * @param source - The source string
 * @param target - The substring to find
 * @param replacement - The replacement string
 * @returns String with all occurrences replaced
 *
 * @remarks
 * - Replaces all occurrences of the target string
 * - Case sensitive
 * - If target is empty string, returns original string
 * - This matches PineScript's `str.replace_all()` behavior
 *
 * @example
 * ```typescript
 * str.replace_all("hello world hello", "hello", "hi") // Returns: "hi world hi"
 * str.replace_all("a-b-c", "-", "_") // Returns: "a_b_c"
 * str.replace_all("test", "x", "y") // Returns: "test" (no match)
 * ```
 */
export function replace_all(source: simple_string, target: simple_string, replacement: simple_string): string {
  return source.replaceAll(target, replacement);
}

/**
 * Splits a string into an array of substrings using a separator.
 *
 * @param str - The string to split
 * @param separator - The separator string
 * @returns Array of substrings
 *
 * @remarks
 * - Empty separator splits into individual characters; an empty string gives [""] (also with "")
 * - If separator is not found, returns array with original string
 * - Consecutive separators create empty strings in result
 *
 * @example
 * ```typescript
 * str.split("a,b,c", ",") // Returns: ["a", "b", "c"]
 * str.split("hello", "") // Returns: ["h", "e", "l", "l", "o"]
 * str.split("a,,b", ",") // Returns: ["a", "", "b"]
 * ```
 */
export function split(str: simple_string, separator: simple_string): string[] {
  // JavaScript gives [] for "".split(""); PineScript gives [""]
  return str === '' ? [''] : str.split(separator);
}

/**
 * Concatenates multiple strings into one.
 *
 * @param strings - Variable number of strings to concatenate
 * @returns The concatenated string
 *
 * @example
 * ```typescript
 * str.concat("hello", " ", "world") // Returns: "hello world"
 * str.concat("a", "b", "c") // Returns: "abc"
 * str.concat("test") // Returns: "test"
 * ```
 */
export function concat(...strings: simple_string[]): string {
  return strings.join('');
}

/**
 * Formats a string with placeholders (PineScript `str.format`, Java MessageFormat syntax).
 *
 * @param formatStr - Pattern with `{0}`, `{1,number,#.##}`, `{0,number,percent}`, `{0,date,yyyy-MM-dd}`...
 * @param args - Values for the placeholders
 * @returns Formatted string
 *
 * @remarks
 * As in PineScript: numbers in `{n}` use
 * "#,##0.###" (1234.5678 gives "1,234.568"); number patterns round half to even on the exact
 * value (16 decimals at most from 1e-3 up); an array gives "[a, b]"; `'...'` is literal text and `''` a quote;
 * a missing argument leaves `{n}` in the text.
 * Dates are formatted in UTC here; PineScript uses the exchange time zone.
 *
 * @example
 * ```typescript
 * str.format('Close: {0,number,#.##}', 101.456) // "Close: 101.46"
 * str.format('{0} and {1}', 'a', 2) // "a and 2"
 * ```
 */
export function format(formatStr: simple_string, ...args: any[]): string {
  return formatMessage(formatStr, args, 'Etc/UTC');
}

/**
 * Checks if a string starts with a specific prefix.
 *
 * @param source - The string to check
 * @param str - The prefix to look for
 * @returns True if source starts with str, false otherwise
 *
 * @remarks
 * - Search is case-sensitive
 * - Empty string prefix always returns true
 *
 * @example
 * ```typescript
 * str.startswith("hello world", "hello") // Returns: true
 * str.startswith("hello world", "Hello") // Returns: false (case-sensitive)
 * str.startswith("test", "testing") // Returns: false
 * ```
 */
export function startswith(source: simple_string, str: simple_string): bool {
  return source.startsWith(str);
}

/**
 * Checks if a string ends with a specific suffix.
 *
 * @param source - The string to check
 * @param str - The suffix to look for
 * @returns True if source ends with str, false otherwise
 *
 * @remarks
 * - Search is case-sensitive
 * - Empty string suffix always returns true
 *
 * @example
 * ```typescript
 * str.endswith("hello world", "world") // Returns: true
 * str.endswith("hello world", "World") // Returns: false (case-sensitive)
 * str.endswith("testing", "test") // Returns: false
 * ```
 */
export function endswith(source: simple_string, str: simple_string): bool {
  return source.endsWith(str);
}

/**
 * Returns the character at a specific position in a string.
 *
 * @param str - The source string
 * @param pos - The 0-based position
 * @returns The character at the position, or empty string if out of bounds
 *
 * @remarks
 * - Returns empty string for negative or out-of-bounds positions
 * - Unicode characters may span multiple code units
 *
 * @example
 * ```typescript
 * str.charAt("hello", 0) // Returns: "h"
 * str.charAt("hello", 4) // Returns: "o"
 * str.charAt("hello", 10) // Returns: ""
 * ```
 */
export function charAt(str: simple_string, pos: simple_int): string {
  return str.charAt(pos);
}

/**
 * Removes whitespace from both ends of a string.
 *
 * @param str - The string to trim
 * @returns The trimmed string
 *
 * @remarks
 * - Removes spaces, tabs, newlines, and other whitespace characters
 * - Preserves internal whitespace
 *
 * @example
 * ```typescript
 * str.trim("  hello  ") // Returns: "hello"
 * str.trim("  hello world  ") // Returns: "hello world"
 * str.trim("\thello\n") // Returns: "hello"
 * ```
 */
export function trim(str: simple_string): string {
  return str.trim();
}

/**
 * Removes whitespace from the left (start) of a string.
 *
 * @param str - The string to trim
 * @returns The trimmed string
 *
 * @remarks
 * - Only removes leading whitespace
 * - Preserves trailing and internal whitespace
 *
 * @example
 * ```typescript
 * str.trimLeft("  hello  ") // Returns: "hello  "
 * str.trimLeft("  hello") // Returns: "hello"
 * str.trimLeft("\thello") // Returns: "hello"
 * ```
 */
export function trimLeft(str: simple_string): string {
  return str.trimStart();
}

/**
 * Removes whitespace from the right (end) of a string.
 *
 * @param str - The string to trim
 * @returns The trimmed string
 *
 * @remarks
 * - Only removes trailing whitespace
 * - Preserves leading and internal whitespace
 *
 * @example
 * ```typescript
 * str.trimRight("  hello  ") // Returns: "  hello"
 * str.trimRight("hello  ") // Returns: "hello"
 * str.trimRight("hello\t") // Returns: "hello"
 * ```
 */
export function trimRight(str: simple_string): string {
  return str.trimEnd();
}

/**
 * Returns the first substring of `source` that matches the `regex` (PineScript `str.match`).
 *
 * @param source - Source string
 * @param regex - Regular expression
 * @returns The first match (searched anywhere in the string), or na (null) when nothing matches or the match is empty
 *
 * @remarks
 * - As PineScript: "Hello World!" with "o" gives "o", with "[a-z]+" gives "ello"; no match gives na
 * - Uses JavaScript regex syntax
 *
 * @example
 * ```typescript
 * str.match("abc123def", "[0-9]+") // Returns: "123"
 * str.match("abc", "[0-9]+") // Returns: null (na)
 * ```
 */
export function match(source: simple_string, regex: simple_string): simple_string | null {
  const found = new RegExp(regex).exec(source);
  return found && found[0] !== '' ? found[0] : null;
}

/**
 * Formats a timestamp as a string according to the specified format.
 *
 * @param time - Unix timestamp in milliseconds
 * @param format - Format string using PineScript format specifiers
 * @returns Formatted date/time string
 *
 * @remarks
 * Supported format specifiers (case-sensitive):
 * - `yyyy` - 4-digit year (e.g., "2024")
 * - `yy` - 2-digit year (e.g., "24")
 * - `MMMM` - Full month name (e.g., "January")
 * - `MMM` - Abbreviated month name (e.g., "Jan")
 * - `MM` - 2-digit month (01-12)
 * - `M` - Month (1-12)
 * - `dd` - 2-digit day (01-31)
 * - `d` - Day (1-31)
 * - `HH` - 2-digit hour (00-23)
 * - `H` - Hour (0-23)
 * - `hh` - 2-digit hour (01-12)
 * - `h` - Hour (1-12)
 * - `mm` - 2-digit minute (00-59)
 * - `m` - Minute (0-59)
 * - `ss` - 2-digit second (00-59)
 * - `s` - Second (0-59)
 * - `a` - AM/PM
 *
 * @example
 * ```typescript
 * const timestamp = 1609459200000; // Jan 1, 2021 00:00:00 UTC
 * str.format_time(timestamp, "dd MMM yyyy") // Returns: "01 Jan 2021"
 * str.format_time(timestamp, "yyyy-MM-dd HH:mm:ss") // Returns: "2021-01-01 00:00:00"
 * str.format_time(timestamp, "MMM d, yyyy") // Returns: "Jan 1, 2021"
 * str.format_time(timestamp, "hh:mm a") // Returns: "12:00 AM"
 * ```
 */
/**
 * Constructs a new string containing the source string repeated N times with an optional separator.
 *
 * @param source - The string to repeat
 * @param count - Number of times to repeat
 * @param separator - String to inject between repeated instances. Optional, defaults to empty string.
 * @returns The repeated string, or null (na) if source is na or count is 0 / negative / na, as in PineScript
 *
 * @example
 * ```typescript
 * str.repeat("ab", 3) // Returns: "ababab"
 * str.repeat("?", 3, ",") // Returns: "?,?,?"
 * str.repeat("hello", 0) // Returns: null (na)
 * str.repeat("x", 1) // Returns: "x"
 * ```
 */
export function repeat(source: simple_string, count: simple_int, separator: simple_string = ''): string | null {
  if (source == null) return null;
  if (!(count > 0)) return null; // 0, negative or na: na
  return Array(count).fill(source).join(separator);
}

/**
 * Formats a UNIX time (ms) with a date pattern (PineScript `str.format_time`).
 *
 * @param time - UNIX time in milliseconds
 * @param format - Java SimpleDateFormat pattern, e.g. "yyyy-MM-dd HH:mm:ss", "dd MMM yyyy", "hh:mm a"
 * @param timezone - UTC/GMT offset ("UTC-5") or IANA name ("America/New_York"). PineScript's default is
 *   the exchange time zone, which is not known here: the default is UTC
 * @returns Formatted date string
 *
 * @remarks
 * Letters: y, M, d, E, u, D, w,
 * H, k, K, h, a, m, s, S, Z, z; 'text' is literal text.
 */
export function format_time(time: simple_int, format: simple_string = "yyyy-MM-dd'T'HH:mm:ssZ", timezone: simple_string = 'Etc/UTC'): string {
  return formatDate(time, format, timezone);
}
