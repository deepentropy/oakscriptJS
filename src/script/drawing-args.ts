/**
 * @fileoverview Arguments of the drawing functions of the script API, as PineScript writes them:
 *
 * - **Named arguments**: a last argument that is an object of PineScript parameter names, e.g.
 *   `label.new(c.i, c.high, "A", { style: label.style_label_down, textcolor: color.white })`, or every argument by
 *   name: `line.new({ x1, y1, x2, y2, extend: extend.right })`. An unknown name throws with the closest names.
 * - **Series arguments**: inside a bar loop a Series argument (`bar_index`, `high`, `ta.sma(...)`) is its value on the
 *   current bar, as PineScript reads a series in a call; outside a loop it throws (a drawing takes one value).
 *
 * @module script/drawing-args
 */
import { Series } from '../runtime/series.js';

/** PineScript parameters of the drawing constructors, in their positional order (coordinates, then chart points). */
export const DRAWING_PARAMETERS: Record<string, { coords: readonly string[]; point?: readonly string[] }> = {
  'label.new': {
    coords: ['x', 'y', 'text', 'xloc', 'yloc', 'color', 'style', 'textcolor', 'size', 'textalign', 'tooltip', 'text_font_family', 'force_overlay', 'text_formatting'],
    point: ['point', 'text', 'xloc', 'yloc', 'color', 'style', 'textcolor', 'size', 'textalign', 'tooltip', 'text_font_family', 'force_overlay', 'text_formatting'],
  },
  'line.new': {
    coords: ['x1', 'y1', 'x2', 'y2', 'xloc', 'extend', 'color', 'style', 'width', 'force_overlay'],
    point: ['first_point', 'second_point', 'xloc', 'extend', 'color', 'style', 'width', 'force_overlay'],
  },
  'box.new': {
    coords: [
      'left', 'top', 'right', 'bottom', 'border_color', 'border_width', 'border_style', 'extend', 'xloc', 'bgcolor', 'text',
      'text_size', 'text_color', 'text_halign', 'text_valign', 'text_wrap', 'text_font_family', 'force_overlay', 'text_formatting',
    ],
    point: [
      'top_left', 'bottom_right', 'border_color', 'border_width', 'border_style', 'extend', 'xloc', 'bgcolor', 'text',
      'text_size', 'text_color', 'text_halign', 'text_valign', 'text_wrap', 'text_font_family', 'force_overlay', 'text_formatting',
    ],
  },
  'table.new': {
    coords: ['position', 'columns', 'rows', 'bgcolor', 'frame_color', 'frame_width', 'border_color', 'border_width', 'force_overlay'],
  },
  'table.cell': {
    coords: [
      'table_id', 'column', 'row', 'text', 'width', 'height', 'text_color', 'text_halign', 'text_valign', 'text_size', 'bgcolor',
      'tooltip', 'text_font_family', 'text_formatting',
    ],
  },
  'polyline.new': {
    coords: ['points', 'curved', 'closed', 'xloc', 'line_color', 'fill_color', 'line_style', 'line_width', 'force_overlay'],
  },
  'linefill.new': { coords: ['line1', 'line2', 'color'] },
};

/** Parameters that take an object: a plain object there is the argument, not named arguments. */
const OBJECT_PARAMETERS = new Set(['point', 'first_point', 'second_point', 'top_left', 'bottom_right', 'table_id', 'line1', 'line2', 'points']);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Series) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

/** A chart point (`chart.point.*`): its keys are index / time / price. */
const isChartPoint = (v: Record<string, unknown>): boolean => {
  const keys = Object.keys(v);
  return keys.length > 0 && keys.every((k) => k === 'index' || k === 'time' || k === 'price');
};

function closest(name: string, names: readonly string[]): string[] {
  const n = name.toLowerCase();
  const dist = (a: string, b: string): number => {
    const row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let diag = row[0]!;
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const up = row[j]!;
        row[j] = Math.min(up + 1, row[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
        diag = up;
      }
    }
    return row[b.length]!;
  };
  return names
    .map((k) => ({ k, d: dist(n, k) }))
    .filter(({ k, d }) => d <= Math.max(2, Math.floor(name.length / 3)) || k.includes(n) || n.includes(k))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(({ k }) => k);
}

/** The positional arguments of a call whose last argument may be named arguments. */
export function positionalArguments(name: string, args: readonly unknown[]): unknown[] {
  const params = DRAWING_PARAMETERS[name];
  if (!params) return [...args];
  const last = args[args.length - 1];
  if (!isPlainObject(last) || isChartPoint(last)) return [...args];
  // an object at a parameter that takes one (a chart point, a drawing, the points) is that argument
  const at = args.length - 1;
  const firstArg = args[0];
  const positionalList =
    params.point !== undefined && typeof firstArg === 'object' && firstArg !== null && !(firstArg instanceof Series) && at > 0
      ? params.point
      : params.coords;
  if (at > 0 && OBJECT_PARAMETERS.has(positionalList[at] ?? '')) return [...args];
  const positional = args.slice(0, -1);
  const first = positional.length ? positional[0] : last.point ?? last.first_point ?? last.top_left;
  const usesPoint = params.point !== undefined && typeof first === 'object' && first !== null && !(first instanceof Series);
  const list = usesPoint ? params.point! : params.coords;
  const out = [...positional];
  for (const [key, value] of Object.entries(last)) {
    const index = list.indexOf(key);
    if (index < 0) {
      const near = closest(key, list);
      throw new TypeError(
        `${name}(): unknown argument "${key}".` + (near.length ? ` Did you mean ${near.join(', ')}?` : '') +
          ` The arguments are: ${list.join(', ')}.`
      );
    }
    if (index < positional.length && positional[index] !== undefined) {
      throw new TypeError(`${name}(): "${key}" is given twice (by position and by name).`);
    }
    out[index] = value;
  }
  return out;
}

/** The value of each Series argument on the current bar (inside a bar loop); throws outside a loop. */
export function barValues(name: string, args: unknown[], currentBar: number): unknown[] {
  return args.map((a, k) => {
    if (!(a instanceof Series)) return a;
    if (currentBar < 0) {
      throw new TypeError(
        `${name}(): argument ${k + 1} is a Series, a drawing takes one value: call ${name}() inside eachBar() ` +
          '(e.g. label.new(c.i, c.high, ...)) or pass a number.'
      );
    }
    const v = a.toArray()[currentBar];
    return v === undefined ? NaN : v;
  });
}

/**
 * Wraps the functions of a drawing namespace (`label`, `line`, `box`, `table`, `polyline`, `linefill`): named
 * arguments for the constructors and `table.cell`, Series arguments read on the current bar for every function.
 */
export function drawingNamespace<T extends Record<string, unknown>>(namespace: string, members: T, currentBar: () => number): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(members)) {
    if (typeof value !== 'function') {
      out[key] = value;
      continue;
    }
    const name = `${namespace}.${key}`;
    const fn = value as (...args: unknown[]) => unknown;
    out[key] = function (this: unknown, ...args: unknown[]) {
      return fn.apply(this, barValues(name, positionalArguments(name, args), currentBar()));
    };
  }
  return out as T;
}
