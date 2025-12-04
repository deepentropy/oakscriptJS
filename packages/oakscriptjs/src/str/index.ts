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

import { int, bool, float, simple_int, simple_string } from '../types';

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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.length | PineScript str.length}
 */
export function length(str: simple_string): int {
  return str.length;
}

/**
 * Converts a value to its string representation.
 *
 * @param value - The value to convert (number, boolean, string, etc.)
 * @param format - Optional format string for numbers (e.g., "#.##" for 2 decimals)
 * @returns String representation of the value
 *
 * @remarks
 * - When format is provided for numbers, it controls decimal places
 * - Format string pattern: "#" represents digits, "." represents decimal point
 * - Non-numeric values are converted using standard string conversion
 *
 * @example
 * ```typescript
 * str.tostring(123) // Returns: "123"
 * str.tostring(123.456, "#.##") // Returns: "123.46"
 * str.tostring(true) // Returns: "true"
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.tostring | PineScript str.tostring}
 */
export function tostring(value: any, format?: simple_string): string {
  if (typeof value === 'number' && format) {
    // Handle format string (e.g., "#.##")
    const decimals = format.split('.')[1]?.length || 0;
    return value.toFixed(decimals);
  }
  return String(value);
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.tonumber | PineScript str.tonumber}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.substring | PineScript str.substring}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.upper | PineScript str.upper}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.lower | PineScript str.lower}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.contains | PineScript str.contains}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.pos | PineScript str.pos}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.replace | PineScript str.replace}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.replace_all | PineScript str.replace_all}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.split | PineScript str.split}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.concat | PineScript str.concat}
 */
export function concat(...strings: simple_string[]): string {
  return strings.join('');
}

/**
 * Formats a string by replacing numbered placeholders with values.
 *
 * @param formatStr - The format string with placeholders like {0}, {1}, etc.
 * @param args - Values to substitute into placeholders
 * @returns The formatted string
 *
 * @remarks
 * - Placeholders use 0-based indexing: {0}, {1}, {2}, etc.
 * - Unreplaced placeholders remain in the string
 * - Values are converted to strings automatically
 * - Placeholders can be repeated
 *
 * @example
 * ```typescript
 * str.format("Hello {0}", "world") // Returns: "Hello world"
 * str.format("{0} + {1} = {2}", "1", "2", "3") // Returns: "1 + 2 = 3"
 * str.format("{1} {0}", "world", "Hello") // Returns: "Hello world"
 * str.format("{0} {0}", "test") // Returns: "test test"
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.format | PineScript str.format}
 */
export function format(formatStr: simple_string, ...args: any[]): string {
  let result = formatStr;
  args.forEach((arg, index) => {
    result = result.replaceAll(`{${index}}`, String(arg));
  });
  return result;
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.startswith | PineScript str.startswith}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.endswith | PineScript str.endswith}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.charAt | PineScript str.charAt}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.trim | PineScript str.trim}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.trimLeft | PineScript str.trimLeft}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.trimRight | PineScript str.trimRight}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.match | PineScript str.match}
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
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_str.format_time | PineScript str.format_time}
 */
export function format_time(time: simple_int, format: simple_string): string {
  const date = new Date(time);

  // Month names
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get date components
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  // Helper to pad with zeros
  const pad = (num: number, len: number = 2): string => num.toString().padStart(len, '0');

  // 12-hour format
  const hours12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';

  // Replace format specifiers
  // IMPORTANT: Must process longer patterns first to avoid partial replacements
  // Use unique placeholders that won't conflict with format strings
  const replacements = [
    // Year (process yyyy before yy)
    [/yyyy/g, year.toString()],
    [/yy/g, year.toString().slice(-2)],
    // Month (process MMMM before MMM before MM before M)
    [/MMMM/g, monthNames[month]],
    [/MMM/g, monthNamesShort[month]],
    [/MM/g, pad(month + 1)],
    [/M/g, (month + 1).toString()],
    // Day (process dd before d)
    [/dd/g, pad(day)],
    [/d/g, day.toString()],
    // Hours 24-hour (process HH before H)
    [/HH/g, pad(hours)],
    [/H/g, hours.toString()],
    // Hours 12-hour (process hh before h)
    [/hh/g, pad(hours12)],
    [/h/g, hours12.toString()],
    // Minutes (process mm before m)
    [/mm/g, pad(minutes)],
    [/m/g, minutes.toString()],
    // Seconds (process ss before s)
    [/ss/g, pad(seconds)],
    [/s/g, seconds.toString()],
    // AM/PM
    [/a/g, ampm]
  ];

  // Apply all replacements in order, using safe approach
  // Create unique placeholder tokens that won't appear in user format strings
  let result = format;
  const tokens: string[] = [];

  // First pass: replace all patterns with unique tokens
  replacements.forEach(([pattern, value], index) => {
    const token = `\uFFF0${index}\uFFF1`; // Use private use area characters
    result = result.replace(pattern as RegExp, token);
    tokens[index] = value as string;
  });

  // Second pass: replace tokens with actual values
  tokens.forEach((value, index) => {
    const token = `\uFFF0${index}\uFFF1`;
    result = result.replaceAll(token, value);
  });

  return result;
}
