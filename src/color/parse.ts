/**
 * Colour parsing shared by the color namespace and input.color (internal, not part of the public API).
 */

import type { color, int, float } from '../types/index.js';

/**
 * Parses a colour string to its channels (0-255) and alpha (0-1).
 * Hex: #RRGGBB, #RRGGBBAA (PineScript literals), #RGB, #RGBA; rgb() / rgba(). Anything else is opaque black.
 */
export function parseColor(clr: color): { r: int; g: int; b: int; a: float } {
  if (typeof clr === 'string') {
    const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(clr.trim());
    if (hex) {
      let digits = hex[1]!;
      if (digits.length <= 4) digits = [...digits].map((c) => c + c).join('');
      const byte = (k: number) => parseInt(digits.slice(k, k + 2), 16);
      return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) / 255 : 1 };
    }
    const match = clr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]!),
        g: parseInt(match[2]!),
        b: parseInt(match[3]!),
        a: match[4] ? parseFloat(match[4]) : 1,
      };
    }
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

/** Alpha byte (0-255) of an alpha (0-1), as PineScript stores it. */
export const alphaByte = (a: float): int => Math.round(a * 255);

/**
 * The colour a script receives for the default of `input.color(defval)`.
 *
 * PineScript rules (measured):
 * - the default is stored with an alpha of 2 decimals: a `color.new(c, t)` / `color.rgb(r, g, b, t)` default keeps
 *   `(100 - trunc(t)) / 100` (90 gives 0.1, 9.9 gives 0.91), a hex literal `#RRGGBBAA` keeps `round(AA / 255, 2)`
 * - the input value is then the alpha byte `round(255 * alpha)`: `color.new(c, 90)` as an input default has the
 *   byte 26, where `color.new(c, 90)` in the script has 25
 *
 * A default whose alpha byte does not change is returned unchanged.
 */
export function inputColorDefault(defval: color): color {
  if (typeof defval !== 'string') return defval;
  const p = parseColor(defval);
  const hex = defval.trim().startsWith('#');
  // rgba() from color.new / color.rgb: alpha = 1 - t / 100, so alpha * 100 = 100 - t (float noise removed first)
  const stored = hex ? Math.round(p.a * 100) / 100 : Math.ceil(Math.round(p.a * 100 * 1e6) / 1e6) / 100;
  const byte = alphaByte(stored);
  if (byte === alphaByte(p.a)) return defval;
  return byte === 255 ? `rgb(${p.r}, ${p.g}, ${p.b})` : `rgba(${p.r}, ${p.g}, ${p.b}, ${byte / 255})`;
}
