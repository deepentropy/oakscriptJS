/**
 * @fileoverview Type declarations of the script globals, for type-checking a script source (plain JavaScript)
 * before it runs. A script body uses every value export of `oakscriptjs/script` but `executeScript` (the host
 * entry) as a global; these declarations give each global its type, so the TypeScript checker reports the
 * mistakes of a script with their line: `close - open` (operators on a Series), a misspelt name (`ta.smaa`), a
 * wrong argument or option, a bad shape or style string.
 *
 * In a project that runs scripts, a `tsconfig.json` next to the scripts, then `npx tsc -p .`:
 *
 * ```json
 * {
 *   "compilerOptions": {
 *     "allowJs": true, "checkJs": true, "noEmit": true, "strict": true, "noImplicitAny": false,
 *     "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler", "moduleDetection": "force",
 *     "lib": ["ES2022"], "types": ["oakscriptjs/script/globals"]
 *   },
 *   "include": ["*.js"]
 * }
 * ```
 *
 * - `lib` leaves out `DOM`: its `open`, `close` and `alert` are other globals.
 * - `moduleDetection: "force"`: each script has its own top-level names (a script has no import or export).
 * - `noImplicitAny: false`: the parameters of a script's own functions have no types (plain JavaScript).
 *
 * @module script/globals
 */

import type * as S from './index.js';

declare global {
  const executeIntrabar: typeof S.executeIntrabar;
  const varip: typeof S.varip;
  const indicator: typeof S.indicator;
  const fixnan: typeof S.fixnan;
  const fill: typeof S.fill;
  const plotshape: typeof S.plotshape;
  const plotchar: typeof S.plotchar;
  const plotarrow: typeof S.plotarrow;
  const bgcolor: typeof S.bgcolor;
  const barcolor: typeof S.barcolor;
  const plotcandle: typeof S.plotcandle;
  const plotbar: typeof S.plotbar;
  const eachBar: typeof S.eachBar;
  const timestamp: typeof S.timestamp;
  const inSession: typeof S.inSession;
  const seriesOf: typeof S.seriesOf;
  const alertcondition: typeof S.alertcondition;
  const holdDrawing: typeof S.holdDrawing;
  const releaseDrawing: typeof S.releaseDrawing;
  const varDrawing: typeof S.varDrawing;
  const StrategyRecorder: typeof S.StrategyRecorder;
  const input: typeof S.input;
  const open: typeof S.open;
  const high: typeof S.high;
  const low: typeof S.low;
  const close: typeof S.close;
  const volume: typeof S.volume;
  const hl2: typeof S.hl2;
  const hlc3: typeof S.hlc3;
  const ohlc4: typeof S.ohlc4;
  const hlcc4: typeof S.hlcc4;
  const ta: typeof S.ta;
  const color: typeof S.color;
  const DEFAULT_OUTPUT_TITLES: typeof S.DEFAULT_OUTPUT_TITLES;
  const plot: typeof S.plot;
  const hline: typeof S.hline;
  const DEFAULT_CANDLE_COLORS: typeof S.DEFAULT_CANDLE_COLORS;
  const strategy: typeof S.strategy;
  const MissingSymbolDataError: typeof S.MissingSymbolDataError;
  const timeframe: typeof S.timeframe;
  const syminfo: typeof S.syminfo;
  const year: typeof S.year;
  const month: typeof S.month;
  const weekofyear: typeof S.weekofyear;
  const dayofmonth: typeof S.dayofmonth;
  const dayofweek: typeof S.dayofweek;
  const hour: typeof S.hour;
  const minute: typeof S.minute;
  const second: typeof S.second;
  const str: typeof S.str;
  const timenow: typeof S.timenow;
  const time: typeof S.time;
  const time_close: typeof S.time_close;
  const time_tradingday: typeof S.time_tradingday;
  const barstate: typeof S.barstate;
  const session: typeof S.session;
  const barmerge: typeof S.barmerge;
  const ticker: typeof S.ticker;
  const request: typeof S.request;
  const line: typeof S.line;
  const label: typeof S.label;
  const box: typeof S.box;
  const linefill: typeof S.linefill;
  const polyline: typeof S.polyline;
  const table: typeof S.table;
  const position: typeof S.position;
  const text: typeof S.text;
  const chart: typeof S.chart;
  const alert: typeof S.alert;
  const Series: typeof S.Series;
  const BarData: typeof S.BarData;
  const na: typeof S.na;
  const nz: typeof S.nz;
  const STRATEGY_DEFAULTS: typeof S.STRATEGY_DEFAULTS;
  const math: typeof S.math;
  const bar_index: typeof S.bar_index;
  const last_bar_index: typeof S.last_bar_index;
  const shape: typeof S.shape;
  const location: typeof S.location;
  const size: typeof S.size;
  const xloc: typeof S.xloc;
  const yloc: typeof S.yloc;
  const extend: typeof S.extend;
  const display: typeof S.display;
  const format: typeof S.format;
  const font: typeof S.font;
  const scale: typeof S.scale;
  const order: typeof S.order;
  const currency: typeof S.currency;
  const adjustment: typeof S.adjustment;
  const compare: typeof S.compare;
  const isInputActive: typeof S.isInputActive;
  /** A Series of the script (`close`, the result of `ta.*`...), for JSDoc types: `@type {Series}`. */
  type Series = S.Series;
  /** The bar handed to an `eachBar()` callback, for JSDoc types. */
  type BarContext = S.BarContext;
}

export {};
