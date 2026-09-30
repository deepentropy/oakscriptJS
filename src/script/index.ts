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
 * collects everything it declared. This is the host-side entry — editor
 * panels, workers and tests call it; scripts never do.
 */
export function executeScript(
  body: () => void,
  barsInput: Bar[],
  inputs: Record<string, unknown> = {}
): ScriptRunResult {
  ctxBars.setAll(barsInput);
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
  /** Lines kept before the oldest are deleted (default 50; keeps up to 5 more). */
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
  /** `ta.vwap(source, anchor?)` with the chart volume. `anchor` (non-zero = reset) is required for the
   *  PineScript default (a new day), which needs the exchange session. */
  vwap: ((source: Series, anchor?: Series, stdev_mult?: number): Series | [Series, Series, Series] =>
    stdev_mult === undefined
      ? taSeries.vwap(source, volume, anchor)
      : taSeries.vwapBands(source, volume, anchor, stdev_mult)) as {
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

/** PineScript `fill()` — between two plots (dynamic) or two hlines (band). */
export function fill(a: PlotHandle, b: PlotHandle, options: ScriptFillOptions = {}): void {
  const c = collector();
  const perBar = Array.isArray(options.color) ? options.color : undefined;
  const staticColor = typeof options.color === 'string' ? options.color : undefined;
  if (a.kind === 'hline' && b.kind === 'hline') {
    c.fillConfig.push({
      id: `fill${c.fillConfig.length}`,
      plot1: a.id,
      plot2: b.id,
      color: staticColor,
      colors: perBar,
      title: options.title,
    });
    return;
  }
  c.fills.push({
    plot1: a.id,
    plot2: b.id,
    options: { color: staticColor, title: options.title },
    colors: perBar,
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
      return chartPointCore.new_point(bar.time as number, currentBar, price ?? bar.close);
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
export * as timeframe from '../timeframe';
export { timestamp, year, month, weekofyear, dayofmonth, dayofweek, hour, minute, second, inSession } from '../time';
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
