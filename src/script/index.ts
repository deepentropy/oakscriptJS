/**
 * @fileoverview PineScript-style script API — write an indicator as a flat
 * script instead of the explicit calculate() convention.
 *
 * ```typescript
 * import { indicator, input, plot, ta } from 'oakscriptjs/script';
 *
 * indicator('My SMA', { overlay: true });
 * const length = input.int(20, 'Length', { minval: 1 });
 * const src = input.source('close', 'Source');
 * plot(ta.sma(src, length), 'SMA', { color: '#2962FF' });
 * ```
 *
 * Execution model: the host calls {@link executeScript} with the script body,
 * the bars and the current input values. Declaration calls (indicator, input.*,
 * plot, hline, fill, alertcondition) run as the body executes and are collected
 * into a {@link ScriptRunResult}: the declarative configs (inputConfig,
 * plotConfig, hlineConfig, fillConfig) plus an IndicatorResult with the plot
 * data. Re-running the body with new bars or inputs is PineScript's
 * recalculation model.
 *
 * `input.*` is idempotent like PineScript: it declares the input AND returns
 * its current value (the host-supplied override, else the default).
 *
 * The OHLCV builtins (open/high/low/close/volume/hl2/hlc3/ohlc4/hlcc4) are
 * Series bound to a module-level BarData that the host swaps per run, so
 * derived Series memoize between identical runs and recompute when the bars
 * version bumps.
 *
 * One script executes at a time (module-level context) — hosts that run many
 * scripts must serialize executions, which a Web Worker does naturally.
 *
 * @module script
 */

import type { Bar } from '../types';
import type {
  BarColorData,
  FillData,
  FillGradient,
  IndicatorResult,
  MarkerData,
  MarkerLocation,
  MarkerSize,
  ShapeStyle,
  TimeValue,
} from '../types/metadata';
import type { BarColorConfig, FillConfig, HLineConfig, InputConfig, PlotConfig, ShapeConfig } from '../runtime/types';
import { BarData, Series } from '../runtime/series';
import * as taSeries from '../ta-series';
import * as colorCore from '../color';
import { fixnan as fixnanValues, isNA, nz } from '../utils';
import * as lineCore from '../line';
import * as labelCore from '../label';
import * as boxCore from '../box';
import * as linefillCore from '../linefill';
import * as polylineCore from '../polyline';
import * as chartPointCore from '../chartpoint';
import * as textCore from '../text';
import { resetDrawings, setDrawingLimits } from '../drawing/registry';
import * as timeframeCore from '../timeframe';
import * as timeCore from '../time';
import * as strCore from '../str';
import { formatMessage } from '../str/messageformat';
import { TradingCalendar, type SessionSpec } from '../session/calendar';
import { SessionBars, sessionFlags, type SessionFlags } from '../session/bars';
import { heikinAshi, mapToChart, periodsOf, resample } from '../security/resample';
import type { ChartPoint } from '../types';

/** Everything one run of a script produced. */
export interface ScriptRunResult {
  metadata: { title: string; shortTitle?: string; overlay: boolean; precision?: number; format?: string };
  inputConfig: InputConfig[];
  plotConfig: PlotConfig[];
  hlineConfig: HLineConfig[];
  fillConfig: FillConfig[];
  shapeConfig: ShapeConfig[];
  barColorConfig: BarColorConfig[];
  defaultInputs: Record<string, unknown>;
  alertConfig: AlertConditionConfig[];
  /** The renderable output (plots keyed by plotConfig ids, plot-pair fills). */
  result: IndicatorResult & { alerts?: AlertState[] };
}

export interface AlertConditionConfig {
  id: string;
  title: string;
  message?: string;
}

/** Per-run alert evaluation: whether the condition is true on the last bar. */
export interface AlertState {
  id: string;
  title: string;
  message?: string;
  triggered: boolean;
}

/** Handle returned by plot()/hline() so fill() can reference them. */
export interface PlotHandle {
  id: string;
  kind: 'plot' | 'hline';
}

interface Collector {
  title: string;
  shortTitle?: string;
  overlay: boolean;
  precision?: number;
  format?: string;
  inputValues: Record<string, unknown>;
  inputConfig: InputConfig[];
  inputIds: Set<string>;
  defaultInputs: Record<string, unknown>;
  plotConfig: PlotConfig[];
  plots: Record<string, TimeValue[]>;
  hlineConfig: HLineConfig[];
  fills: FillData[];
  fillConfig: FillConfig[];
  shapeConfig: ShapeConfig[];
  markers: MarkerData[];
  barColorConfig: BarColorConfig[];
  bgcolors: BarColorData[];
  barcolors: BarColorData[];
  alertConfig: AlertConditionConfig[];
  alerts: AlertState[];
}

/** Bars for the current run. Module-level and REUSED across runs so builtins
 *  and every Series derived from them keep their version-keyed memoization. */
const ctxBars = new BarData([]);

let ctx: Collector | null = null;

function collector(): Collector {
  if (!ctx) {
    throw new Error(
      'oakscriptjs/script functions can only run inside executeScript() — ' +
        'the host (chart/worker) drives script execution.'
    );
  }
  return ctx;
}

function freshCollector(inputValues: Record<string, unknown>): Collector {
  return {
    title: 'Untitled',
    overlay: true,
    inputValues,
    inputConfig: [],
    inputIds: new Set(),
    defaultInputs: {},
    plotConfig: [],
    plots: {},
    hlineConfig: [],
    fills: [],
    fillConfig: [],
    shapeConfig: [],
    markers: [],
    barColorConfig: [],
    bgcolors: [],
    barcolors: [],
    alertConfig: [],
    alerts: [],
  };
}

/** Stable input id from the title ("ATR / Range Period" → "atr_range_period"). */
function slugId(title: string | undefined, fallback: string, taken: Set<string>): string {
  const base =
    (title ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || fallback;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}_${n}`;
  taken.add(id);
  return id;
}

// ── Host entry ───────────────────────────────────────────────────────────────

/**
 * Runs a script body against `bars` with the given input overrides and
 * collects everything it declared. `chart` describes the bars (chart timeframe,
 * exchange time zone, session type) for the PineScript values that depend on them. This is the host-side entry — editor
 * panels, workers and tests call it; scripts never do.
 */
export function executeScript(
  body: () => void,
  barsInput: Bar[],
  inputs: Record<string, unknown> = {},
  chart: ChartContext = {}
): ScriptRunResult {
  ctxBars.setAll(barsInput);
  chartCtx = { ...chart };
  ctx = freshCollector(inputs);
  resetDrawings();
  try {
    body();
    const c = ctx;
    return {
      metadata: {
        title: c.title,
        shortTitle: c.shortTitle,
        overlay: c.overlay,
        precision: c.precision,
        format: c.format,
      },
      inputConfig: c.inputConfig,
      plotConfig: c.plotConfig,
      hlineConfig: c.hlineConfig,
      fillConfig: c.fillConfig,
      shapeConfig: c.shapeConfig,
      barColorConfig: c.barColorConfig,
      defaultInputs: c.defaultInputs,
      alertConfig: c.alertConfig,
      result: {
        metadata: { title: c.title, shorttitle: c.shortTitle, overlay: c.overlay, precision: c.precision },
        plots: c.plots,
        fills: c.fills.length ? c.fills : undefined,
        markers: c.markers.length ? c.markers : undefined,
        bgcolors: c.bgcolors.length ? c.bgcolors : undefined,
        barcolors: c.barcolors.length ? c.barcolors : undefined,
        alerts: c.alerts.length ? c.alerts : undefined,
      },
    };
  } finally {
    ctx = null;
  }
}

// ── Declarations ─────────────────────────────────────────────────────────────

export interface IndicatorOptions {
  shorttitle?: string;
  overlay?: boolean;
  precision?: number;
  format?: string;
  /** Lines kept before the oldest are deleted (default 50; PineScript keeps up to 5 more). */
  max_lines_count?: number;
  /** Labels kept before the oldest are deleted (default 50). */
  max_labels_count?: number;
  /** Boxes kept before the oldest are deleted (default 50). */
  max_boxes_count?: number;
  /** Polylines kept before the oldest are deleted (default 50). */
  max_polylines_count?: number;
}

/** PineScript `indicator()` — declares the script's metadata. */
export function indicator(title: string, options: IndicatorOptions = {}): void {
  const c = collector();
  c.title = title;
  c.shortTitle = options.shorttitle;
  c.overlay = options.overlay ?? true;
  c.precision = options.precision;
  c.format = options.format;
  setDrawingLimits({
    line: options.max_lines_count,
    label: options.max_labels_count,
    box: options.max_boxes_count,
    polyline: options.max_polylines_count,
  });
}

export interface NumericInputOptions {
  minval?: number;
  maxval?: number;
  step?: number;
}

export interface StringInputOptions {
  options?: string[];
}

/** Declares the input in the collector and returns its current value (the
 *  host-supplied override when present, else the default). */
function registerInput<T>(config: Omit<InputConfig, 'id'>, fallbackId: string): T {
  const c = collector();
  const id = slugId(config.title, fallbackId, c.inputIds);
  c.inputConfig.push({ id, ...config });
  c.defaultInputs[id] = config.defval;
  const value = c.inputValues[id];
  return (value === undefined ? config.defval : value) as T;
}

function registerNumeric(type: 'int' | 'float', defval: number, title?: string, opts: NumericInputOptions = {}): number {
  const v = registerInput<unknown>(
    { type, defval, title, min: opts.minval, max: opts.maxval, step: opts.step },
    `input_${type}`
  );
  return typeof v === 'number' ? v : defval;
}

/** PineScript `input.*` — declares an input AND returns its current value. */
export const input = {
  int(defval: number, title?: string, opts: NumericInputOptions = {}): number {
    return Math.round(registerNumeric('int', defval, title, opts));
  },
  float(defval: number, title?: string, opts: NumericInputOptions = {}): number {
    return registerNumeric('float', defval, title, opts);
  },
  bool(defval: boolean, title?: string): boolean {
    return registerInput<boolean>({ type: 'bool', defval, title }, 'input_bool');
  },
  string(defval: string, title?: string, opts: StringInputOptions = {}): string {
    return registerInput<string>({ type: 'string', defval, title, options: opts.options }, 'input_string');
  },
  color(defval: string, title?: string): string {
    return registerInput<string>({ type: 'color', defval, title }, 'input_color');
  },
  /** Declares a source input and returns it as a Series. */
  source(defval: string = 'close', title?: string): Series {
    const name = registerInput<string>({ type: 'source', defval, title }, 'input_source');
    return sourceSeries(name);
  },
  /** Timeframe string ("60", "1D", "W"). As in PineScript, "" means the chart timeframe. */
  timeframe(defval: string, title?: string, opts: StringInputOptions = {}): string {
    return registerInput<string>({ type: 'timeframe', defval, title, options: opts.options }, 'input_timeframe');
  },
  /** Session string ("0930-1600", "0930-1600:23456"). */
  session(defval: string, title?: string, opts: StringInputOptions = {}): string {
    return registerInput<string>({ type: 'session', defval, title, options: opts.options }, 'input_session');
  },
  /** Date and time as a UNIX time in milliseconds, e.g. `input.time(timestamp('2024-01-01'), 'Start')`. */
  time(defval: number, title?: string): number {
    const v = registerInput<unknown>({ type: 'time', defval, title }, 'input_time');
    return typeof v === 'number' ? v : defval;
  },
};

// ── OHLCV builtins ───────────────────────────────────────────────────────────

export const open = Series.fromBars(ctxBars, 'open');
export const high = Series.fromBars(ctxBars, 'high');
export const low = Series.fromBars(ctxBars, 'low');
export const close = Series.fromBars(ctxBars, 'close');
export const volume = Series.fromBars(ctxBars, 'volume');
export const hl2 = new Series(ctxBars, (b) => (b.high + b.low) / 2);
export const hlc3 = new Series(ctxBars, (b) => (b.high + b.low + b.close) / 3);
export const ohlc4 = new Series(ctxBars, (b) => (b.open + b.high + b.low + b.close) / 4);
export const hlcc4 = new Series(ctxBars, (b) => (b.high + b.low + b.close + b.close) / 4);

const SOURCES: Record<string, Series> = { open, high, low, close, volume, hl2, hlc3, ohlc4, hlcc4 };

function sourceSeries(name: string): Series {
  return SOURCES[name] ?? close;
}

// ── Bound ta namespace ───────────────────────────────────────────────────────

const bars = (): Bar[] => ctxBars.bars;

/** A Series bound to the context bars whose values come from one pass over all bars
 *  (cumulative indicators), recomputed when the bars version changes. */
function barsSeries(compute: (b: Bar[]) => Series): Series {
  let version = -1;
  let values: number[] = [];
  return new Series(ctxBars, (_bar, i, data) => {
    if (version !== ctxBars.version) {
      values = compute(data).toArray();
      version = ctxBars.version;
    }
    return values[i] ?? NaN;
  });
}

/** ta.* with the chart-implicit (bars-first) functions bound to the context,
 *  so scripts call them like PineScript: `ta.tr(true)`, `ta.atr(14)`. */
export const ta = {
  ...taSeries,
  tr: (handleNa: boolean = false): Series => taSeries.tr(bars(), handleNa),
  atr: (length: number): Series => taSeries.atr(bars(), length),
  sar: (start?: number, inc?: number, max?: number): Series => taSeries.sar(bars(), start, inc, max),
  wpr: (length?: number): Series => taSeries.wpr(bars(), length),
  supertrend: (factor: number, atrLength: number): [Series, Series] =>
    taSeries.supertrend(bars(), factor, atrLength),
  dmi: (diLength: number, adxSmoothing: number): [Series, Series, Series] =>
    taSeries.dmi(bars(), diLength, adxSmoothing),
  kc: (source: Series, length: number, mult: number, useTrueRange?: boolean): [Series, Series, Series] =>
    taSeries.kc(bars(), source, length, mult, useTrueRange),
  kcw: (source: Series, length?: number, mult?: number, useTrueRange?: boolean): Series =>
    taSeries.kcw(bars(), source, length, mult, useTrueRange),
  ichimoku: (
    conversionPeriods: number,
    basePeriods: number,
    laggingSpan2Periods: number,
    displacement: number
  ): [Series, Series, Series, Series, Series] =>
    taSeries.ichimoku(bars(), conversionPeriods, basePeriods, laggingSpan2Periods, displacement),
  /** `ta.highest(source, length)` or `ta.highest(length)` (source = high). */
  highest: (sourceOrLength: Series | number, length?: number): Series =>
    typeof sourceOrLength === 'number' ? taSeries.highest(high, sourceOrLength) : taSeries.highest(sourceOrLength, length!),
  /** `ta.lowest(source, length)` or `ta.lowest(length)` (source = low). */
  lowest: (sourceOrLength: Series | number, length?: number): Series =>
    typeof sourceOrLength === 'number' ? taSeries.lowest(low, sourceOrLength) : taSeries.lowest(sourceOrLength, length!),
  /** `ta.highestbars(source, length)` or `ta.highestbars(length)` (source = high); offsets are 0 or negative. */
  highestbars: (sourceOrLength: Series | number, length?: number): Series =>
    typeof sourceOrLength === 'number'
      ? taSeries.highestbars(high, sourceOrLength)
      : taSeries.highestbars(sourceOrLength, length!),
  /** `ta.lowestbars(source, length)` or `ta.lowestbars(length)` (source = low); offsets are 0 or negative. */
  lowestbars: (sourceOrLength: Series | number, length?: number): Series =>
    typeof sourceOrLength === 'number'
      ? taSeries.lowestbars(low, sourceOrLength)
      : taSeries.lowestbars(sourceOrLength, length!),
  /** `ta.vwap(source, anchor?, stdev_mult?)` with the chart volume; the default anchor is a new trading
   *  day (`timeframe.change("1D")`), which needs the chart context (timeframe, time zone, session). */
  vwap: ((source: Series, anchor?: Series, stdev_mult?: number): Series | [Series, Series, Series] => {
    const a = anchor ?? changeOf('1D'); // PineScript default: timeframe.change("1D")
    return stdev_mult === undefined ? taSeries.vwap(source, volume, a) : taSeries.vwapBands(source, volume, a, stdev_mult);
  }) as {
    (source: Series, anchor?: Series): Series;
    (source: Series, anchor: Series | undefined, stdev_mult: number): [Series, Series, Series];
  },
  /** `ta.pivothigh(source, leftbars, rightbars)` or `ta.pivothigh(leftbars, rightbars)` (source = high).
   *  The value appears `rightbars` bars after the pivot bar, as in PineScript. */
  pivothigh: (sourceOrLeft: Series | number, leftOrRight: number, rightbars?: number): Series =>
    typeof sourceOrLeft === 'number'
      ? taSeries.pivothigh(high, sourceOrLeft, leftOrRight)
      : taSeries.pivothigh(sourceOrLeft, leftOrRight, rightbars!),
  /** `ta.pivotlow(source, leftbars, rightbars)` or `ta.pivotlow(leftbars, rightbars)` (source = low). */
  pivotlow: (sourceOrLeft: Series | number, leftOrRight: number, rightbars?: number): Series =>
    typeof sourceOrLeft === 'number'
      ? taSeries.pivotlow(low, sourceOrLeft, leftOrRight)
      : taSeries.pivotlow(sourceOrLeft, leftOrRight, rightbars!),
  // PineScript variables of the chart bars: `ta.obv`, not `ta.obv()`.
  obv: barsSeries(taSeries.obv),
  pvt: barsSeries(taSeries.pvt),
  accdist: barsSeries(taSeries.accdist),
  nvi: barsSeries(taSeries.nvi),
  pvi: barsSeries(taSeries.pvi),
  iii: barsSeries(taSeries.iii),
  wad: barsSeries(taSeries.wad),
  wvad: barsSeries(taSeries.wvad),
};

/** PineScript `fixnan(source)`: each `na` value becomes the previous non-`na` value.
 *  Accepts a Series or a per-bar color array (`undefined` = `na`, as returned by `color.when`). */
export function fixnan(source: Series): Series;
export function fixnan(source: Array<string | undefined>): Array<string | undefined>;
export function fixnan(source: Series | Array<string | undefined>): Series | Array<string | undefined> {
  return source instanceof Series ? Series.fromArray(ctxBars, fixnanValues(source.toArray())) : fixnanValues(source);
}

// ── Color helpers ────────────────────────────────────────────────────────────

/** Per-bar color selection: truthy → colorTrue, else colorFalse.
 *  colorFalse may be omitted (PineScript `na`): those bars get no color,
 *  which bgcolor()/barcolor() skip. */
function colorWhen(cond: Series, colorTrue: string, colorFalse: string): string[];
function colorWhen(cond: Series, colorTrue: string, colorFalse?: string): Array<string | undefined>;
function colorWhen(cond: Series, colorTrue: string, colorFalse?: string): Array<string | undefined> {
  return cond.toArray().map((v) => (!isNA(v) && v !== 0 ? colorTrue : colorFalse));
}

/** color.* plus `when` — per-bar conditional colors for plot()/fill()/bgcolor()/barcolor(). */
export const color = {
  ...colorCore,
  new: colorCore.new_color,
  when: colorWhen,
};

// ── Drawing declarations ─────────────────────────────────────────────────────

export interface ScriptPlotOptions {
  /** Static color, or a per-bar color array from color.when(). */
  color?: string | string[];
  linewidth?: number;
  style?: PlotConfig['style'];
  display?: PlotConfig['display'];
  histbase?: number;
}

/** PineScript `plot()` — declares the plot and supplies its data in one call. */
export function plot(series: Series, title?: string, options: ScriptPlotOptions = {}): PlotHandle {
  const c = collector();
  const id = `plot${c.plotConfig.length}`;
  const perBar = Array.isArray(options.color) ? options.color : undefined;
  const staticColor = typeof options.color === 'string' ? options.color : (perBar?.[perBar.length - 1] ?? '#2962FF');
  c.plotConfig.push({
    id,
    title: title ?? id,
    color: staticColor,
    lineWidth: options.linewidth,
    style: options.style,
    display: options.display,
    histbase: options.histbase,
  });
  const values = series.toArray();
  const b = bars();
  const data: TimeValue[] = [];
  for (let i = 0; i < b.length; i++) {
    const value = values[i];
    if (value === undefined || Number.isNaN(value)) continue;
    data.push(perBar ? { time: b[i]!.time, value, color: perBar[i] } : { time: b[i]!.time, value });
  }
  c.plots[id] = data;
  return { id, kind: 'plot' };
}

export interface ScriptHLineOptions {
  color?: string;
  linestyle?: HLineConfig['linestyle'];
  linewidth?: number;
}

/** PineScript `hline()` — a static horizontal level. */
export function hline(price: number, title?: string, options: ScriptHLineOptions = {}): PlotHandle {
  const c = collector();
  const id = `hline${c.hlineConfig.length}`;
  c.hlineConfig.push({
    id,
    price,
    title,
    color: options.color,
    linestyle: options.linestyle,
    linewidth: options.linewidth,
  });
  return { id, kind: 'hline' };
}

export interface ScriptFillOptions {
  /** Static color, or a per-bar color array from color.when(). */
  color?: string | string[];
  title?: string;
}

/** A fill colour argument: a colour, na (null / undefined), or a per-bar array from color.when(). */
export type ScriptFillColor = string | null | undefined | Array<string | null | undefined>;

/** A gradient value argument: a number or a Series. */
export type ScriptFillValue = number | Series;

function perBarValues(v: ScriptFillValue, n: number): number[] {
  return v instanceof Series ? v.toArray().slice(0, n) : new Array<number>(n).fill(v);
}

function perBarColors(c: ScriptFillColor, n: number): Array<string | null> {
  if (Array.isArray(c)) return Array.from({ length: n }, (_, i) => c[i] ?? null);
  return new Array<string | null>(n).fill(c ?? null);
}

/**
 * PineScript `fill()`, with the three PineScript overloads (positional arguments), for two plots or two hlines:
 * - `fill(p1, p2, color?, title?, ...)`
 * - `fill(p1, p2, top_value, bottom_value, top_color, bottom_color, title?, ...)`: gradient fill; values and colours
 *   can change per bar (a Series / a color.when() array)
 * - `fill(p1, p2, { color, title })`: options object (oakscriptjs form, kept for existing scripts)
 * Arguments that change only how the chart shows the fill (`editable`, `show_last`, `fillgaps`, `display`) are
 * accepted and not used.
 */
export function fill(a: PlotHandle, b: PlotHandle, options?: ScriptFillOptions): void;
export function fill(a: PlotHandle, b: PlotHandle, color: ScriptFillColor, title?: string, ...rest: unknown[]): void;
export function fill(
  a: PlotHandle,
  b: PlotHandle,
  top_value: ScriptFillValue,
  bottom_value: ScriptFillValue,
  top_color: ScriptFillColor,
  bottom_color: ScriptFillColor,
  title?: string,
  ...rest: unknown[]
): void;
export function fill(a: PlotHandle, b: PlotHandle, ...args: unknown[]): void {
  const c = collector();
  const third = args[0];
  let perBar: string[] | undefined;
  let staticColor: string | undefined;
  let title: string | undefined;
  let gradient: FillGradient | undefined;
  if (typeof third === 'number' || third instanceof Series) {
    const n = ctxBars.bars.length;
    gradient = {
      topValue: perBarValues(third, n),
      bottomValue: perBarValues(args[1] as ScriptFillValue, n),
      topColor: perBarColors(args[2] as ScriptFillColor, n),
      bottomColor: perBarColors(args[3] as ScriptFillColor, n),
    };
    title = args[4] as string | undefined;
  } else if (third !== null && typeof third === 'object' && !Array.isArray(third)) {
    const options = third as ScriptFillOptions;
    perBar = Array.isArray(options.color) ? options.color : undefined;
    staticColor = typeof options.color === 'string' ? options.color : undefined;
    title = options.title;
  } else {
    const color = third as ScriptFillColor;
    perBar = Array.isArray(color) ? color.map((x) => x ?? '') : undefined;
    staticColor = typeof color === 'string' ? color : undefined;
    title = args[1] as string | undefined;
  }
  if (a.kind === 'hline' && b.kind === 'hline') {
    c.fillConfig.push({
      id: `fill${c.fillConfig.length}`,
      plot1: a.id,
      plot2: b.id,
      color: staticColor,
      colors: perBar,
      gradient,
      title,
    });
    return;
  }
  c.fills.push({
    plot1: a.id,
    plot2: b.id,
    options: { color: staticColor, title },
    colors: perBar,
    gradient,
  });
}

export interface PlotShapeOptions {
  style?: ShapeStyle;
  location?: MarkerLocation;
  color?: string;
  text?: string;
  textcolor?: string;
  size?: MarkerSize;
  /** Display offset in bars (marker shown at bar i + offset). */
  offset?: number;
  /** Hover tooltip (extension over PineScript, for label.new-style ports). */
  tooltip?: string;
}

export interface PlotCharOptions extends Omit<PlotShapeOptions, 'style'> {
  char?: string;
}

/** Shared emitter for plotshape()/plotchar(). Emits one marker per bar where
 *  the condition is truthy (not na, not 0). */
function emitMarkers(
  kind: 'shape' | 'char',
  condition: Series,
  title: string | undefined,
  options: PlotShapeOptions & PlotCharOptions
): void {
  const c = collector();
  const id = `${kind}${c.shapeConfig.filter((s) => s.kind === kind).length}`;
  const style: ShapeStyle | 'char' = kind === 'shape' ? (options.style ?? 'xcross') : 'char';
  const char = kind === 'char' ? (options.char ?? '*') : undefined;
  const location = options.location ?? 'abovebar';
  c.shapeConfig.push({
    id,
    kind,
    title,
    style: kind === 'shape' ? (style as ShapeStyle) : undefined,
    char,
    location,
    color: options.color,
    text: options.text,
    textcolor: options.textcolor,
    size: options.size,
    offset: options.offset,
  });
  const values = condition.toArray();
  const b = bars();
  const off = options.offset ?? 0;
  for (let i = 0; i < b.length; i++) {
    const v = values[i];
    if (v === undefined || Number.isNaN(v) || v === 0) continue;
    const j = i + off;
    if (j < 0 || j >= b.length) continue;
    c.markers.push({
      time: b[j]!.time,
      id,
      location,
      style,
      char,
      color: options.color,
      text: options.text,
      textcolor: options.textcolor,
      size: options.size,
      tooltip: options.tooltip,
      price: location === 'absolute' ? v : undefined,
    });
  }
}

/** PineScript `plotshape()` — a marker on each bar where the condition holds. */
export function plotshape(condition: Series, title?: string, options: PlotShapeOptions = {}): void {
  emitMarkers('shape', condition, title, options);
}

/** PineScript `plotchar()` — a character marker on each bar where the condition holds. */
export function plotchar(condition: Series, title?: string, options: PlotCharOptions = {}): void {
  emitMarkers('char', condition, title, options);
}

/** Shared emitter for bgcolor()/barcolor(). A static color applies to every
 *  bar; a per-bar array (from color.when) skips undefined entries. The offset
 *  is baked in: the color computed at bar i lands on bar i + offset. */
function emitBarColors(
  kind: 'bgcolor' | 'barcolor',
  colors: string | Array<string | undefined>,
  options: { offset?: number; title?: string }
): void {
  const c = collector();
  const id = `${kind}${c.barColorConfig.filter((x) => x.kind === kind).length}`;
  c.barColorConfig.push({ id, kind, title: options.title, offset: options.offset });
  const b = bars();
  const off = options.offset ?? 0;
  const target = kind === 'bgcolor' ? c.bgcolors : c.barcolors;
  for (let i = 0; i < b.length; i++) {
    const col = typeof colors === 'string' ? colors : colors[i];
    if (!col) continue;
    const j = i + off;
    if (j < 0 || j >= b.length) continue;
    target.push({ time: b[j]!.time, color: col });
  }
}

/** PineScript `bgcolor()` — per-bar background color. */
export function bgcolor(
  colors: string | Array<string | undefined>,
  options: { offset?: number; title?: string } = {}
): void {
  emitBarColors('bgcolor', colors, options);
}

/** PineScript `barcolor()` — per-bar candle color override. */
export function barcolor(
  colors: string | Array<string | undefined>,
  options: { title?: string } = {}
): void {
  emitBarColors('barcolor', colors, options);
}

// ── Per-bar execution (eachBar) ──────────────────────────────────────────────

/**
 * The scalar view of one bar handed to an {@link eachBar} callback.
 * All fields are plain numbers, so native JS operators work.
 */
export interface BarContext {
  /** Bar index (PineScript bar_index). */
  readonly i: number;
  /** Total number of bars. */
  readonly n: number;
  /** Time of the current bar. */
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  /** Value of any Series at the current bar minus `offset` (PineScript src[offset]). */
  get(src: Series, offset?: number): number;
  /** This block's own previous output (PineScript self-reference, offset >= 1). */
  prev(offset?: number): number;
}

/**
 * Runs the callback once per bar, in order, and collects the returned values
 * into a Series. This is the escape hatch for PineScript logic the vectorized
 * model cannot express:
 *
 * - `var x = 0` / `x := ...` → a plain `let` variable captured by the closure
 * - per-bar `if` / `for` / `while` → native JS statements
 * - `src[k]` → `c.get(src, k)`; self-reference → `c.prev()`
 *
 * Returning a boolean collects 1/0; returning nothing collects na (NaN).
 *
 * ```typescript
 * let dir = 0;                          // var dir = 0
 * const trend = eachBar((c) => {
 *   if (c.close > c.get(close, 1)) dir = 1;   // dir := 1
 *   else if (c.close < c.get(close, 1)) dir = -1;
 *   return dir;
 * });
 * ```
 */
export function eachBar(fn: (c: BarContext) => number | boolean | void): Series {
  collector(); // same lifecycle guard (and error message) as the declaration calls
  const b = bars();
  const out: number[] = new Array(b.length).fill(NaN);
  const cache = new Map<Series, number[]>();
  let idx = 0;
  const ctx: BarContext = {
    get i() {
      return idx;
    },
    n: b.length,
    get time() {
      return b[idx]!.time as number;
    },
    get open() {
      return b[idx]!.open;
    },
    get high() {
      return b[idx]!.high;
    },
    get low() {
      return b[idx]!.low;
    },
    get close() {
      return b[idx]!.close;
    },
    get volume() {
      return b[idx]!.volume ?? NaN;
    },
    get(src: Series, offset: number = 0): number {
      let vals = cache.get(src);
      if (!vals) {
        vals = src.toArray();
        cache.set(src, vals);
      }
      const j = idx - offset;
      return j >= 0 && j < vals.length ? (vals[j] ?? NaN) : NaN;
    },
    prev(offset: number = 1): number {
      const j = idx - Math.max(1, offset);
      return j >= 0 ? out[j]! : NaN;
    },
  };
  try {
    for (idx = 0; idx < b.length; idx++) {
      currentBar = idx;
      const r = fn(ctx);
      out[idx] = typeof r === 'number' ? r : typeof r === 'boolean' ? (r ? 1 : 0) : NaN;
    }
  } finally {
    currentBar = -1;
  }
  return Series.fromArray(ctxBars, out);
}

/** Bar index of the running eachBar() callback, -1 outside eachBar(). */
let currentBar = -1;

// ── Chart context (issue #100) ───────────────────────────────────────────────

/**
 * What the caller knows about the loaded bars. PineScript reads these values from the chart and
 * the symbol; nothing is fetched here. A script that needs a value the caller did not give throws.
 */
export interface ChartContext {
  /** Chart timeframe: "5", "60", "1D", "1W"... (PineScript `timeframe.period`) */
  timeframe?: string;
  /** Exchange time zone: "America/New_York", "Etc/UTC"... (PineScript `syminfo.timezone`) */
  timezone?: string;
  /** Session type of the bars (PineScript `syminfo.session`); default "regular" */
  sessionType?: 'regular' | 'extended';
  /**
   * Session of the loaded bars in the symbol session format: hours ("0930-1600", "1700-1600", "24x7"),
   * corrections (early closes, days off) and holidays. Needed by `time(tf)`, `time_close`,
   * `timeframe.change`, `time_tradingday`, `session.*` and the default anchor of `ta.vwap`.
   */
  session?: SessionSpec | string;
  /** Regular trading hours when the bars include extended hours (default: `session`); holidays default to `session`'s */
  regularSession?: SessionSpec | string;
  /** Chart symbol as PineScript `syminfo.tickerid` (e.g. "NASDAQ:AAPL"); needed by `request.security(syminfo.tickerid, ...)` */
  tickerid?: string;
  /** Unit of `Bar.time`: 's' (default, as lightweight-charts) or 'ms'. PineScript times are in ms. */
  timeUnit?: 's' | 'ms';
}

let chartCtx: ChartContext = {};

function chartTimeframe(): timeframeCore.TimeframeInfo {
  collector();
  if (!chartCtx.timeframe) {
    throw new Error('The chart timeframe is not known: pass it as executeScript(body, bars, inputs, { timeframe }).');
  }
  return timeframeCore.info(chartCtx.timeframe);
}

function exchangeTimezone(): string {
  collector();
  if (!chartCtx.timezone) {
    throw new Error('The exchange time zone is not known: pass it as executeScript(body, bars, inputs, { timezone }).');
  }
  return chartCtx.timezone;
}

/**
 * PineScript `timeframe.*`: the chart timeframe variables (from the chart context), and
 * `in_seconds(timeframe?)`, `from_seconds(seconds)`.
 */
export const timeframe = {
  ...timeframeCore,
  get period(): string {
    return chartTimeframe().period;
  },
  get main_period(): string {
    return chartTimeframe().period;
  },
  get multiplier(): number {
    return chartTimeframe().multiplier;
  },
  get isintraday(): boolean {
    return chartTimeframe().isintraday;
  },
  get isdaily(): boolean {
    return chartTimeframe().isdaily;
  },
  get isweekly(): boolean {
    return chartTimeframe().isweekly;
  },
  get ismonthly(): boolean {
    return chartTimeframe().ismonthly;
  },
  get isminutes(): boolean {
    return chartTimeframe().isminutes;
  },
  get isseconds(): boolean {
    return chartTimeframe().isseconds;
  },
  get isticks(): boolean {
    return chartTimeframe().isticks;
  },
  get isdwm(): boolean {
    return chartTimeframe().isdwm;
  },
  /** PineScript `timeframe.change(tf)`: 1 on bars that open a new `tf` period (0 on the first bar). */
  change(tf: string): Series {
    return changeOf(tf || chartTimeframe().period);
  },
  /** Seconds in `timeframe`; without it (or with "") the chart timeframe, as in PineScript. */
  in_seconds(tf?: string): number {
    return timeframeCore.in_seconds(tf === undefined || tf === '' ? chartTimeframe().period : tf);
  },
};

/** PineScript `syminfo.timezone`, `syminfo.tickerid` and `syminfo.session` (session type), from the chart context. */
export const syminfo = {
  get timezone(): string {
    return exchangeTimezone();
  },
  get tickerid(): string {
    collector();
    if (!chartCtx.tickerid) {
      throw new Error('The chart symbol is not known: pass it as executeScript(body, bars, inputs, { tickerid }).');
    }
    return chartCtx.tickerid;
  },
  get session(): string {
    collector();
    return chartCtx.sessionType ?? 'regular';
  },
};

/** A calendar function: `(time, timezone?)` on a UNIX time or on a Series of times. */
interface CalendarFunction {
  (time: number, timezone?: string): number;
  (time: Series, timezone?: string): Series;
}

function calendar(fn: (time: number, timezone: string) => number): CalendarFunction {
  return ((time: number | Series, timezone?: string) => {
    const tz = timezone ?? exchangeTimezone();
    return time instanceof Series ? Series.fromArray(ctxBars, time.toArray().map((t) => fn(t, tz))) : fn(time, tz);
  }) as CalendarFunction;
}

/** PineScript `year(time, timezone?)`; the default time zone is the exchange time zone. */
export const year = calendar(timeCore.year);
/** PineScript `month(time, timezone?)`; the default time zone is the exchange time zone. */
export const month = calendar(timeCore.month);
/** PineScript `weekofyear(time, timezone?)`; the default time zone is the exchange time zone. */
export const weekofyear = calendar(timeCore.weekofyear);
/** PineScript `dayofmonth(time, timezone?)`; the default time zone is the exchange time zone. */
export const dayofmonth = calendar(timeCore.dayofmonth);
/** PineScript `dayofweek(time, timezone?)`; the default time zone is the exchange time zone. */
export const dayofweek = calendar(timeCore.dayofweek);
/** PineScript `hour(time, timezone?)`; the default time zone is the exchange time zone. */
export const hour = calendar(timeCore.hour);
/** PineScript `minute(time, timezone?)`; the default time zone is the exchange time zone. */
export const minute = calendar(timeCore.minute);
/** PineScript `second(time, timezone?)`; the default time zone is the exchange time zone. */
export const second = calendar(timeCore.second);

/**
 * PineScript `timestamp`: date string (GMT+0 by default), `(timezone, year, month, day, ...)`, or
 * `(year, month, day, ...)` in the exchange time zone.
 */
export function timestamp(dateString: string): number;
export function timestamp(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour?: number,
  minute?: number,
  second?: number
): number;
export function timestamp(year: number, month: number, day: number, hour?: number, minute?: number, second?: number): number;
export function timestamp(first: string | number, ...rest: Array<number | undefined>): number {
  if (typeof first === 'number') {
    const [m, d, h, mi, s] = rest as [number, number, number?, number?, number?];
    return timeCore.timestamp(exchangeTimezone(), first, m, d, h, mi, s);
  }
  if (rest.length === 0) return timeCore.timestamp(first);
  const [y, m, d, h, mi, s] = rest as [number, number, number, number?, number?, number?];
  return timeCore.timestamp(first, y, m, d, h, mi, s);
}

/** Session test of PineScript `time(timeframe, session, timezone)`; the default time zone is the exchange time zone. */
export function inSession(time: number, session: string, timezone?: string): boolean {
  return timeCore.inSession(time, session, timezone ?? exchangeTimezone());
}

/** PineScript `str.*`; `format_time` and the dates of `format` use the exchange time zone by default. */
export const str = {
  ...strCore,
  format_time(time: number, format: string = "yyyy-MM-dd'T'HH:mm:ssZ", timezone?: string): string {
    return strCore.format_time(time, format, timezone ?? exchangeTimezone());
  },
  format(pattern: string, ...args: unknown[]): string {
    return formatMessage(pattern, args, exchangeTimezone);
  },
};

// ── Session values (issue #100) ──────────────────────────────────────────────

/** Bar time in ms (PineScript `time`). */
function barTime(bar: Bar): number {
  return (bar.time as number) * (chartCtx.timeUnit === 'ms' ? 1 : 1000);
}

const toSpec = (s: SessionSpec | string): SessionSpec => (typeof s === 'string' ? { session: s } : s);

let sessionCache: { ctx: ChartContext; bars: SessionBars; regular: SessionBars } | null = null;

/** Session calendars of the run (loaded bars and regular hours), built from the chart context. */
function sessionBars(): { bars: SessionBars; regular: SessionBars } {
  const tz = exchangeTimezone();
  const tf = chartTimeframe().period;
  if (!chartCtx.session) {
    throw new Error('The session is not known: pass it as executeScript(body, bars, inputs, { session }).');
  }
  if (sessionCache?.ctx !== chartCtx) {
    const loaded = toSpec(chartCtx.session);
    const regular = chartCtx.regularSession ? toSpec(chartCtx.regularSession) : loaded;
    sessionCache = {
      ctx: chartCtx,
      bars: new SessionBars(new TradingCalendar(tz, loaded), tf),
      regular: new SessionBars(new TradingCalendar(tz, { holidays: loaded.holidays, ...regular }), tf),
    };
  }
  return sessionCache;
}

/**
 * Calendar for `time(tf, session, timezone)` arguments. Without session and time zone: the loaded
 * session. As in PineScript, an explicit time zone reads the symbol session hours in that zone without
 * corrections and holidays, and an explicit session follows PineScript's session string rules.
 */
function calendarFor(session?: string, timezone?: string): { bars: SessionBars; test: boolean } {
  const { bars } = sessionBars();
  if (!session && !timezone) return { bars, test: false };
  const tz = timezone ?? exchangeTimezone();
  const spec = session ? { session } : { session: toSpec(chartCtx.session!).session };
  return { bars: new SessionBars(new TradingCalendar(tz, spec, session ? 'pine' : 'symbol'), bars.chart.period), test: true };
}

function perBar(fn: (t: number, i: number, times: number[]) => number): Series {
  const times = ctxBars.bars.map(barTime);
  return Series.fromArray(ctxBars, times.map((t, i) => fn(t, i, times)));
}

/** A Series that can also be called, like PineScript's `time` (variable) and `time(...)` (function). */
function callableSeries<F extends (...args: never[]) => Series>(series: Series, fn: F): Series & F {
  Object.setPrototypeOf(fn, Series.prototype);
  Object.assign(fn, series);
  return fn as Series & F;
}

function timeFunction(tf?: string, session?: string, timezone?: string): Series {
  collector();
  const { bars, test } = calendarFor(session, timezone);
  const timeframeString = tf || chartTimeframe().period;
  return perBar((t) => (test && !bars.inside(t) ? NaN : bars.timeOf(t, timeframeString)));
}

function timeCloseFunction(tf?: string, session?: string, timezone?: string): Series {
  collector();
  const { bars, test } = calendarFor(session, timezone);
  const timeframeString = tf || chartTimeframe().period;
  return perBar((t) => (test && !bars.inside(t) ? NaN : bars.closeOf(t, timeframeString)));
}

/**
 * PineScript `time`: the bar open time in ms (a Series), and `time(timeframe?, session?, timezone?)`:
 * the open time of the `timeframe` period that contains the bar, `na` outside `session`.
 */
export const time = callableSeries(new Series(ctxBars, (b) => barTime(b)), timeFunction);

/**
 * PineScript `time_close`: the bar close time in ms (a Series), and `time_close(timeframe?, session?, timezone?)`.
 * Needs the chart timeframe and session.
 */
export const time_close = callableSeries(
  new Series(ctxBars, (_b, i) => sessionBars().bars.closeOf(barTime(ctxBars.bars[i]!), chartTimeframe().period)),
  timeCloseFunction
);

/** PineScript `time_tradingday`: 00:00 UTC of the trading day of each bar, in ms. */
export const time_tradingday = new Series(ctxBars, (b) => sessionBars().bars.tradingDayTime(barTime(b)));

function changeOf(tf: string): Series {
  const { bars } = sessionBars();
  return perBar((t, i, times) => (i > 0 && bars.timeOf(t, tf) !== bars.timeOf(times[i - 1]!, tf) ? 1 : 0));
}

function flag(key: keyof SessionFlags): Series {
  const { bars, regular } = sessionBars();
  const values = sessionFlags(ctxBars.bars.map(barTime), bars, regular)[key];
  return Series.fromArray(ctxBars, values.map((v) => (v ? 1 : 0)));
}

/**
 * PineScript `session.*` (1 / 0 per bar) and the constants `session.regular` / `session.extended`.
 * First and last bars are per session period; market / pre / post market use the regular hours.
 */
export const session = {
  regular: 'regular',
  extended: 'extended',
  get isfirstbar(): Series { return flag('isfirstbar'); },
  get islastbar(): Series { return flag('islastbar'); },
  get ismarket(): Series { return flag('ismarket'); },
  get ispremarket(): Series { return flag('ispremarket'); },
  get ispostmarket(): Series { return flag('ispostmarket'); },
  get isfirstbar_regular(): Series { return flag('isfirstbar_regular'); },
  get islastbar_regular(): Series { return flag('islastbar_regular'); },
};

// ── request.security (issue #101) ─────────────────────────────────────────────

/** PineScript `barmerge.*` constants of `request.security`. */
export const barmerge = {
  gaps_on: 'gaps_on',
  gaps_off: 'gaps_off',
  lookahead_on: 'lookahead_on',
  lookahead_off: 'lookahead_off',
} as const;

const HEIKIN_ASHI = 'heikinashi:';

/** PineScript `ticker.heikinashi(symbol)` / `ticker.standard(symbol)` for the chart symbol. */
export const ticker = {
  heikinashi(symbol: string): string {
    return HEIKIN_ASHI + symbol;
  },
  standard(symbol: string): string {
    return symbol.startsWith(HEIKIN_ASHI) ? symbol.slice(HEIKIN_ASHI.length) : symbol;
  },
};

/** What an expression of `request.security` may return. */
export type SecurityValue = Series | number | boolean | Array<Series | number | boolean>;

function valuesOf(value: Series | number | boolean, length: number): number[] {
  return value instanceof Series ? value.toArray().slice() : new Array<number>(length).fill(Number(value));
}

/**
 * PineScript `request.security` for the chart symbol (`syminfo.tickerid`, `""`, `ticker.heikinashi(...)`,
 * `ticker.standard(...)`) and a timeframe equal to or higher than the chart's. The higher-timeframe bars are
 * built by grouping the chart bars, and `expression` runs on them (its `ta.*` calls, tuples and `timeframe.*`
 * see the higher timeframe). Other symbols need external data and throw; a lower timeframe throws.
 *
 * PineScript rules: lookahead off shows a period's value from the
 * bar that completes it; lookahead on from its first bar; gaps on keeps only the bar where the value appears.
 * Built bars can differ from the exchange's bars (official open / close, volume).
 */
function security<T extends SecurityValue>(
  symbol: string,
  timeframe: string,
  expression: () => T,
  gaps: string = barmerge.gaps_off,
  lookahead: string = barmerge.lookahead_off
): T extends unknown[] ? Series[] : Series {
  collector();
  const heikin = symbol.startsWith(HEIKIN_ASHI);
  const base = heikin ? symbol.slice(HEIKIN_ASHI.length) : symbol;
  if (base !== '' && base !== chartCtx.tickerid) {
    throw new Error(`request.security: "${symbol}" is not the chart symbol; other symbols need external data.`);
  }
  const chart = chartTimeframe();
  const tf = timeframeCore.info(timeframe || chart.period).period;
  if (timeframeCore.in_seconds(tf) < timeframeCore.in_seconds(chart.period)) {
    throw new Error(`request.security: timeframe "${tf}" is lower than the chart timeframe "${chart.period}".`);
  }

  const chartBars = ctxBars.bars;
  const times = chartBars.map(barTime);
  let htf: Bar[];
  let group: number[];
  let latest: number[];
  if (tf === chart.period) {
    htf = chartBars;
    group = chartBars.map((_, i) => i);
    latest = group;
  } else {
    const { bars: loaded, regular } = sessionBars();
    // D / W / M periods follow the regular hours; intraday periods the loaded session
    const calendar = timeframeCore.info(tf).isdwm ? regular : loaded;
    const starts = times.map((t) => calendar.timeOf(t, tf));
    const dayPeriods = times.map((t, i) => {
      const at = loaded.calendar.locate(t);
      const periods = at ? calendar.calendar.periods(at.date) : [];
      return periods.length ? calendar.timeOf(periods[0]![0], tf) : starts[i]!;
    });
    const reaches = times.map((t) => loaded.closeOf(t, chart.period) >= calendar.periodEnd(t, tf));
    ({ group, latest } = periodsOf(starts, dayPeriods, reaches));
    const unit = chartCtx.timeUnit === 'ms' ? 1 : 1000;
    htf = resample(chartBars, starts.map((s) => s / unit)).bars;
  }
  if (heikin) htf = heikinAshi(htf);

  const savedCtx = chartCtx;
  let result: T;
  let values: number[][];
  ctxBars.setAll(htf);
  chartCtx = { ...chartCtx, timeframe: tf };
  try {
    result = expression();
    const parts = Array.isArray(result) ? result : [result];
    values = parts.map((p) => valuesOf(p, htf.length));
  } finally {
    ctxBars.setAll(chartBars);
    chartCtx = savedCtx;
  }
  const mapped = values.map((v) =>
    Series.fromArray(ctxBars, mapToChart(v, group, latest, lookahead === barmerge.lookahead_on, gaps === barmerge.gaps_on))
  );
  return (Array.isArray(result) ? mapped : mapped[0]) as T extends unknown[] ? Series[] : Series;
}

/** PineScript `request.*`: `security` for the chart symbol (issue #101). */
export const request = { security };

// ── Drawing objects ──────────────────────────────────────────────────────────
// The drawing namespaces come from this bundle so that they share the registry that
// executeScript() resets. `line.all` etc. are read like PineScript variables.

/** PineScript `line.*`; `line.all` lists the live lines in creation order. */
export const line = {
  ...lineCore,
  get all() {
    return lineCore.all();
  },
};

/** PineScript `label.*`; `label.all` lists the live labels in creation order. */
export const label = {
  ...labelCore,
  get all() {
    return labelCore.all();
  },
};

/** PineScript `box.*`; `box.all` lists the live boxes in creation order. */
export const box = {
  ...boxCore,
  get all() {
    return boxCore.all();
  },
};

/** PineScript `linefill.*`; `linefill.all` lists the live linefills in creation order. */
export const linefill = {
  ...linefillCore,
  get all() {
    return linefillCore.all();
  },
};

/** PineScript `polyline.*`; `polyline.all` lists the live polylines in creation order. */
export const polyline = {
  ...polylineCore,
  get all() {
    return polylineCore.all();
  },
};

/** PineScript `text.format_*` constants. */
export const text = { ...textCore };

/**
 * PineScript `chart.point.*`. `chart.point.now(price?)` is the point of the current bar
 * (index, time, and `price`, default the close), so it runs inside eachBar().
 */
export const chart = {
  point: {
    ...chartPointCore,
    now(price?: number): ChartPoint {
      collector();
      if (currentBar < 0) {
        throw new Error('chart.point.now() needs a current bar: call it inside eachBar().');
      }
      const bar = ctxBars.bars[currentBar]!;
      return chartPointCore.new_point(barTime(bar), currentBar, price ?? bar.close);
    },
  },
};

/** Wraps a plain value array (e.g. a side output accumulated inside eachBar)
 *  into a Series aligned with the current bars. */
export function seriesOf(values: number[]): Series {
  collector();
  return Series.fromArray(ctxBars, values);
}

/** PineScript `alertcondition()` — collected for the host's alert engine. */
export function alertcondition(condition: Series, title: string, message?: string): void {
  const c = collector();
  const id = `alert${c.alertConfig.length}`;
  c.alertConfig.push({ id, title, message });
  const last = condition.length() ? condition.last() : NaN;
  c.alerts.push({ id, title, message, triggered: !isNA(last) && last !== 0 });
}

// ── Convenience re-exports ───────────────────────────────────────────────────

export { Series, BarData, isNA as na, nz };
export * as math from '../math';
export * as compare from '../compare';
export type {
  Bar,
  IndicatorResult,
  TimeValue,
  InputConfig,
  PlotConfig,
  HLineConfig,
  FillConfig,
  ShapeConfig,
  BarColorConfig,
  MarkerData,
  BarColorData,
  MarkerLocation,
  MarkerSize,
  ShapeStyle,
};
