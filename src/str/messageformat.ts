/**
 * `str.format` patterns as formats them (Java MessageFormat).
 * (30/09/2026, see partb-check/doc/README.md):
 *
 * - `{n}` inserts argument n; numbers use "#,##0.###" (1234.5678 gives "1,234.568")
 * - `{n,number}`, `{n,number,integer}` ("#,##0"), `{n,number,percent}` ("#,##0%"),
 *   `{n,number,currency}` ("$1,234.57", "-$7.00"), `{n,number,<pattern>}`
 * - `{n,date}`, `{n,time}`, `{n,date,<pattern>}`, `{n,time,<pattern>}` (styles short, medium, long, full)
 * - `{n,choice,0#zero|1#one|1<many}`
 * - numbers round half to even on the exact binary value (0.5 as integer gives "0")
 * - `'...'` is literal text and `''` is a quote; a missing argument leaves `{n}` in the text
 */

import { formatNumber } from './numberformat';
import { formatDate } from './dateformat';

const DATE_STYLES: Record<string, string> = {
  short: 'M/d/yy', medium: 'MMM d, yyyy', long: 'MMMM d, yyyy', full: 'EEEE, MMMM d, yyyy',
};
// writes a narrow no-break space (U+202F) before AM/PM in the time styles
const TIME_STYLES: Record<string, string> = {
  short: 'h:mm a', medium: 'h:mm:ss a', long: 'h:mm:ss a z', full: 'h:mm:ss a z',
};

function number(value: unknown, pattern: string): string {
  return typeof value === 'number' ? formatNumber(value, pattern, 'halfEvenExact') : String(value);
}

function choice(value: number, spec: string): string {
  const options = spec.split('|').map((part) => {
    const m = /^\s*(-?[\d.]+|-?∞)\s*([#<≤])(.*)$/.exec(part);
    if (!m) throw new SyntaxError(`Invalid choice format "${spec}"`);
    const limit = m[1]!.includes('∞') ? (m[1]!.startsWith('-') ? -Infinity : Infinity) : Number(m[1]);
    return { limit: m[2] === '<' ? limit + Number.EPSILON * Math.max(1, Math.abs(limit)) : limit, text: m[3]! };
  });
  let chosen = options[0]!;
  for (const o of options) if (value >= o.limit) chosen = o;
  return chosen.text;
}

function formatArgument(
  value: unknown,
  type: string | undefined,
  style: string | undefined,
  timezone: string | (() => string)
): string {
  if (value === undefined) return '';
  if (!type) return typeof value === 'number' ? number(value, '#,##0.###') : String(value);
  switch (type.trim()) {
    case 'number': {
      const s = style?.trim();
      if (!s) return number(value, '#,##0.###');
      if (s === 'integer') return number(value, '#,##0');
      if (s === 'percent') return number(value, '#,##0%');
      if (s === 'currency') return number(value, "'$'#,##0.00");
      return number(value, style!);
    }
    case 'date':
    case 'time': {
      const styles = type.trim() === 'date' ? DATE_STYLES : TIME_STYLES;
      const s = style?.trim() ?? 'medium';
      return formatDate(Number(value), styles[s] ?? style!, typeof timezone === 'function' ? timezone() : timezone);
    }
    case 'choice':
      return choice(Number(value), style ?? '');
    default:
      throw new SyntaxError(`Unknown format type "${type}"`);
  }
}

/** Formats `pattern` with `args` like PineScript `str.format`; dates use `timezone` (read only when a date is formatted). */
export function formatMessage(pattern: string, args: unknown[], timezone: string | (() => string)): string {
  let out = '';
  for (let i = 0; i < pattern.length; ) {
    const ch = pattern[i]!;
    if (ch === "'") {
      if (pattern[i + 1] === "'") {
        out += "'";
        i += 2;
        continue;
      }
      const end = pattern.indexOf("'", i + 1);
      out += pattern.slice(i + 1, end === -1 ? undefined : end);
      i = end === -1 ? pattern.length : end + 1;
      continue;
    }
    if (ch !== '{') {
      out += ch;
      i++;
      continue;
    }
    // {index[,type[,style]]}; the style may contain quoted text and nested braces
    let depth = 1;
    let j = i + 1;
    let inQuote = false;
    for (; j < pattern.length && depth > 0; j++) {
      const c = pattern[j];
      if (c === "'") inQuote = !inQuote;
      else if (!inQuote && c === '{') depth++;
      else if (!inQuote && c === '}') depth--;
    }
    const inner = pattern.slice(i + 1, j - 1);
    const [index = '', type, ...rest] = inner.split(',');
    const style = rest.length ? rest.join(',') : undefined;
    const n = Number(index.trim());
    out += n < args.length ? formatArgument(args[n], type, style, timezone) : `{${inner}}`;
    i = j;
  }
  return out;
}
