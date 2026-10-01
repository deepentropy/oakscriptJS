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
 * @param format - Optional number format: a pattern ("#.##", "#,###.00", "0.00%", "0.00E0") or
 *   `format.percent` ("percent"), `format.volume` ("volume"), `format.price` / `format.inherit`
 * @returns String representation of the value
 *
 * @remarks
 * As in PineScript:
 * - without format, numbers show up to 10 decimals ("0.3333333333"); 1e21 and more use "1E21"
 * - patterns round half away from zero on the shortest decimal form: 1.005 with "#.##" gives "1.01"
 * - "#" is an optional digit ("1.5" with "#.##"), "0" a required digit ("1.50" with "0.00"),
 *   "," groups thousands, "%" multiplies by 100, 'text' is literal text
 * - `format.percent` shows 2 decimals and "%" without multiplying; `format.volume` uses K, M, B, T
 * - `format.price` and `format.inherit` give "price1" / "inherit1" in PineScript: they are patterns
 *   without digit characters, and oakscriptjs does the same
 * - `format.mintick` needs the symbol's tick size and throws here
 *
 * @example
 * ```typescript
 * str.tostring(123) // "123"
 * str.tostring(1.5, "#.##") // "1.5"
 * str.tostring(0.5, "#.00") // ".50"
 * str.tostring(12345.678, format.volume) // "12.346K"
 * ```
 */
export function tostring(value: any, format?: simple_string): string {
  if (typeof value !== 'number') return String(value);
  if (!Number.isFinite(value)) return String(value); // NaN (na), Infinity
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
    case 'mintick':
      throw new Error('str.tostring(x, format.mintick) needs the symbol tick size (syminfo.mintick), which is not known here');
    default:
      return formatNumber(value, format, 'halfUpShortest');
  }
}

/**
 * Converts a string to a number (float).
 *
 * @param str - The string to convert
 * @returns The numeric value, or null if conversion fails
 *
 * @remarks
 * - Returns null for invalid number strings
 * - Supports scientific notation (e.g., "1e3")
 * - Supports decimal numbers (e.g., "0.5", ".5")
 * - Whitespace is ignored
 * - "NaN" string returns null
 *
 * @example
 * ```typescript
 * str.tonumber("123") // Returns: 123
 * str.tonumber("45.67") // Returns: 45.67
 * str.tonumber("abc") // Returns: null
 * str.tonumber("1e3") // Returns: 1000
 * ```
 */
export function tonumber(str: simple_string): float | null {
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
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
 * @returns The 0-based index of the first occurrence, or -1 if not found
 *
 * @remarks
 * - Search is case-sensitive
 * - Returns 0 for empty search string
 * - Returns -1 if substring is not found
 *
 * @example
 * ```typescript
 * str.pos("hello world", "world") // Returns: 6
 * str.pos("hello world", "o") // Returns: 4 (first occurrence)
 * str.pos("hello", "xyz") // Returns: -1
 * ```
 */
export function pos(source: simple_string, str: simple_string): int {
  return source.indexOf(str);
}

/**
 * Replaces occurrences of a substring with another string.
 *
 * @param source - The source string
 * @param target - The substring to replace
 * @param replacement - The string to replace with
 * @param occurrence - If 0, replaces first occurrence only; otherwise replaces all occurrences (default: all)
 * @returns The string with replacements made
 *
 * @remarks
 * - Search is case-sensitive
 * - If target is not found, returns source unchanged
 * - occurrence parameter: 0 = first only, any other value = all occurrences
 *
 * @example
 * ```typescript
 * str.replace("hello world hello", "hello", "hi", 0) // Returns: "hi world hello"
 * str.replace("hello world hello", "hello", "hi") // Returns: "hi world hi"
 * str.replace("test", "xyz", "abc") // Returns: "test"
 * ```
 */
export function replace(source: simple_string, target: simple_string, replacement: simple_string, occurrence?: simple_int): string {
  if (occurrence === 0) {
    return source.replace(target, replacement);
  } else {
    return source.replaceAll(target, replacement);
  }
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
 * - Empty separator splits into individual characters
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
  return str.split(separator);
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
 * value; `'...'` is literal text and `''` a quote; a missing argument leaves `{n}` in the text.
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
 * Tests if a string matches a regular expression pattern.
 *
 * @param source - The string to test
 * @param regex - The regular expression pattern
 * @returns True if the pattern matches, false otherwise
 *
 * @remarks
 * - Uses JavaScript regex syntax
 * - Match is case-sensitive by default
 * - Pattern is tested against entire string
 *
 * @example
 * ```typescript
 * str.match("hello123", "\\d+") // Returns: true
 * str.match("test@example.com", "^[a-z]+@[a-z]+\\.[a-z]+$") // Returns: true
 * str.match("abc", "[A-Z]+") // Returns: false
 * ```
 */
export function match(source: simple_string, regex: simple_string): bool {
  return new RegExp(regex).test(source);
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
 * @param count - Number of times to repeat (must be >= 0)
 * @param separator - String to inject between repeated instances. Optional, defaults to empty string.
 * @returns The repeated string, or null if source is null/undefined
 *
 * @example
 * ```typescript
 * str.repeat("ab", 3) // Returns: "ababab"
 * str.repeat("?", 3, ",") // Returns: "?,?,?"
 * str.repeat("hello", 0) // Returns: ""
 * str.repeat("x", 1) // Returns: "x"
 * ```
 */
export function repeat(source: simple_string, count: simple_int, separator: simple_string = ''): string | null {
  if (source == null) return null;
  if (count <= 0) return '';
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
