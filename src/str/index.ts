/**
 * String namespace
 * Mirrors PineScript's str.* functions
 */

import { string, int, bool, float, simple_int, simple_string } from '../types';

/**
 * Returns the length of the string
 */
export function length(str: simple_string): int {
  return str.length;
}

/**
 * Converts a value to a string
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
 * Converts a string to a number
 */
export function tonumber(str: simple_string): float | null {
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Returns a substring
 */
export function substring(str: simple_string, begin: simple_int, end?: simple_int): string {
  return str.substring(begin, end);
}

/**
 * Converts string to uppercase
 */
export function upper(str: simple_string): string {
  return str.toUpperCase();
}

/**
 * Converts string to lowercase
 */
export function lower(str: simple_string): string {
  return str.toLowerCase();
}

/**
 * Returns true if string contains substring
 */
export function contains(source: simple_string, str: simple_string): bool {
  return source.includes(str);
}

/**
 * Returns the position of substring in source
 */
export function pos(source: simple_string, str: simple_string): int {
  return source.indexOf(str);
}

/**
 * Replaces occurrences of substring with replacement
 */
export function replace(source: simple_string, target: simple_string, replacement: simple_string, occurrence?: simple_int): string {
  if (occurrence === 0) {
    return source.replace(target, replacement);
  } else {
    return source.replaceAll(target, replacement);
  }
}

/**
 * Splits a string into an array
 */
export function split(str: simple_string, separator: simple_string): string[] {
  return str.split(separator);
}

/**
 * Concatenates strings
 */
export function concat(...strings: simple_string[]): string {
  return strings.join('');
}

/**
 * Formats a string with placeholders
 */
export function format(formatStr: simple_string, ...args: any[]): string {
  let result = formatStr;
  args.forEach((arg, index) => {
    result = result.replace(`{${index}}`, String(arg));
  });
  return result;
}

/**
 * Checks if string starts with prefix
 */
export function startswith(source: simple_string, str: simple_string): bool {
  return source.startsWith(str);
}

/**
 * Checks if string ends with suffix
 */
export function endswith(source: simple_string, str: simple_string): bool {
  return source.endsWith(str);
}

/**
 * Returns character at position
 */
export function charAt(str: simple_string, pos: simple_int): string {
  return str.charAt(pos);
}

/**
 * Trims whitespace from both ends
 */
export function trim(str: simple_string): string {
  return str.trim();
}

/**
 * Trims whitespace from left
 */
export function trimLeft(str: simple_string): string {
  return str.trimStart();
}

/**
 * Trims whitespace from right
 */
export function trimRight(str: simple_string): string {
  return str.trimEnd();
}

/**
 * Matches string against regex pattern
 */
export function match(source: simple_string, regex: simple_string): bool {
  return new RegExp(regex).test(source);
}
