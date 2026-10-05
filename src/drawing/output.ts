/**
 * Renderable form of the live drawing objects (labels, lines, boxes, linefills, polylines, tables): the
 * `IndicatorResult` fields `labels`, `lines`, `boxes`, `linefills`, `polylines` and `tables`.
 *
 * Conversion rules:
 * - x coordinates become bar times: a `bar_index` x is the time of that bar, or of a future bar after the last bar
 *   (see {@link barTime}); a `bar_time` x (UNIX ms, as PineScript) is converted to the unit of the bar times
 * - an object with an `na` coordinate (or a bar index before the first bar) is not drawn, as in PineScript
 * - a property the script did not set is omitted (the renderer uses the PineScript default); a colour set to `na`
 *   is 'transparent'
 * - `force_overlay` is kept only when true
 *
 * @module drawing/output
 */

import { all } from './registry.js';
import { barInterval, barTime } from './bar-time.js';
import type { Box, ChartPoint, Label, Line, Polyline, Table, color } from '../types/index.js';
import type {
  BoxData,
  LabelData,
  LineDrawingData,
  LinefillData,
  PolylineData,
  TableCellData,
  TableData,
} from '../types/metadata.js';

/** Drawing fields of an IndicatorResult; a kind without live objects is undefined. */
export interface DrawingOutputs {
  labels?: LabelData[];
  lines?: LineDrawingData[];
  boxes?: BoxData[];
  linefills?: LinefillData[];
  polylines?: PolylineData[];
  tables?: TableData[];
}

/** A colour of the result: 'transparent' for na (null), '#rrggbb' for a numeric colour. */
function colorOut(c: color | null | undefined): string | undefined {
  if (c === undefined) return undefined;
  if (c === null || (typeof c === 'number' && Number.isNaN(c))) return 'transparent';
  return typeof c === 'number' ? `#${(c & 0xffffff).toString(16).padStart(6, '0')}` : c;
}

/** The object without its undefined fields (so that the result has only the properties that were set). */
function compact<T extends object>(obj: T): T {
  for (const k of Object.keys(obj) as Array<keyof T>) if (obj[k] === undefined) delete obj[k];
  return obj;
}

const overlay = (flag: boolean | undefined): true | undefined => (flag ? true : undefined);

/**
 * Converts the live drawing objects of the registry. `bars` are the chart bars (their `time` in `timeUnit`, 's' by
 * default as lightweight-charts); they give the time of a bar index.
 */
export function drawingOutputs(bars: ReadonlyArray<{ time: number }>, timeUnit: 's' | 'ms' = 's'): DrawingOutputs {
  const interval = barInterval(bars);
  const msUnit = timeUnit === 'ms' ? 1 : 1000;
  const xTime = (x: number, xloc: 'bar_index' | 'bar_time'): number =>
    xloc === 'bar_time' ? x / msUnit : barTime(bars, x, interval);
  const ok = (...values: number[]): boolean => values.every(Number.isFinite);

  const lineData = (l: Line): LineDrawingData | undefined => {
    const time1 = xTime(l.x1, l.xloc);
    const time2 = xTime(l.x2, l.xloc);
    if (!ok(time1, time2, l.y1, l.y2)) return undefined;
    return compact({
      time1,
      price1: l.y1,
      time2,
      price2: l.y2,
      color: colorOut(l.color),
      width: l.width,
      style: l.style,
      extend: l.extend,
      forceOverlay: overlay(l.force_overlay),
    });
  };

  const labelData = (l: Label): LabelData | undefined => {
    const time = xTime(l.x, l.xloc);
    // abovebar / belowbar labels are placed at the bar, not at y
    if (!ok(time) || (l.yloc === 'price' && !ok(l.y))) return undefined;
    return compact({
      time,
      price: l.y,
      text: l.text ?? '',
      color: colorOut(l.color),
      textColor: colorOut(l.textcolor),
      style: l.style,
      size: l.size as LabelData['size'],
      yloc: l.yloc,
      textAlign: l.textalign,
      tooltip: l.tooltip,
      fontFamily: l.text_font_family,
      textFormatting: l.text_formatting,
      forceOverlay: overlay(l.force_overlay),
    });
  };

  const boxData = (b: Box): BoxData | undefined => {
    const time1 = xTime(b.left, b.xloc);
    const time2 = xTime(b.right, b.xloc);
    if (!ok(time1, time2, b.top, b.bottom)) return undefined;
    return compact({
      time1,
      price1: b.top,
      time2,
      price2: b.bottom,
      bgColor: colorOut(b.bgcolor),
      borderColor: colorOut(b.border_color),
      borderWidth: b.border_width,
      borderStyle: b.border_style,
      text: b.text,
      textColor: colorOut(b.text_color),
      textSize: b.text_size as BoxData['textSize'],
      textHAlign: b.text_halign,
      textVAlign: b.text_valign,
      textWrap: b.text_wrap,
      fontFamily: b.text_font_family,
      textFormatting: b.text_formatting,
      extend: b.extend,
      forceOverlay: overlay(b.force_overlay),
    });
  };

  const polylineData = (p: Polyline): PolylineData | undefined => {
    const points: PolylineData['points'] = [];
    for (const point of p.points as ChartPoint[]) {
      const x = p.xloc === 'bar_time' ? point.time : point.index;
      const time = x === null ? NaN : xTime(x, p.xloc);
      if (ok(time, point.price)) points.push({ time, price: point.price });
    }
    if (points.length === 0) return undefined;
    return compact({
      points,
      curved: p.curved,
      closed: p.closed,
      lineColor: colorOut(p.line_color),
      fillColor: p.fill_color === null ? undefined : colorOut(p.fill_color),
      lineStyle: p.line_style,
      lineWidth: p.line_width,
      forceOverlay: overlay(p.force_overlay),
    });
  };

  const tableData = (t: Table): TableData => {
    const cells: TableCellData[] = [];
    for (const [key, c] of t.cells ?? []) {
      const [column, row] = key.split(',').map(Number) as [number, number];
      cells.push(
        compact({
          row,
          column,
          text: c.text ?? '',
          bgColor: colorOut(c.bgcolor),
          textColor: colorOut(c.text_color),
          textSize: c.text_size as TableCellData['textSize'],
          width: c.width,
          height: c.height,
          textHAlign: c.text_halign,
          textVAlign: c.text_valign,
          tooltip: c.tooltip,
          fontFamily: c.text_font_family,
          textFormatting: c.text_formatting,
        })
      );
    }
    cells.sort((a, b) => a.row - b.row || a.column - b.column);
    const merges = (t.merges ?? []).map((m) => ({
      startColumn: m.start_column,
      startRow: m.start_row,
      endColumn: m.end_column,
      endRow: m.end_row,
    }));
    return compact({
      position: t.position,
      columns: t.columns,
      rows: t.rows,
      cells,
      merges: merges.length ? merges : undefined,
      bgColor: colorOut(t.bgcolor),
      frameColor: colorOut(t.frame_color),
      frameWidth: t.frame_width,
      borderColor: colorOut(t.border_color),
      borderWidth: t.border_width,
      forceOverlay: overlay(t.force_overlay),
    });
  };

  const convert = <T, R>(items: T[], fn: (item: T) => R | undefined): R[] | undefined => {
    const out: R[] = [];
    for (const item of items) {
      const r = fn(item);
      if (r !== undefined) out.push(r);
    }
    return out.length ? out : undefined;
  };

  return {
    labels: convert(all('label'), labelData),
    lines: convert(all('line'), lineData),
    boxes: convert(all('box'), boxData),
    linefills: convert(all('linefill'), (f): LinefillData | undefined => {
      const line1 = lineData(f.line1);
      const line2 = lineData(f.line2);
      return line1 && line2 ? compact({ line1, line2, color: colorOut(f.color) }) : undefined;
    }),
    polylines: convert(all('polyline'), polylineData),
    tables: convert(all('table'), tableData),
  };
}
