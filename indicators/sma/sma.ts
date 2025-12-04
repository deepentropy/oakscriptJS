import { Series, ta, taCore, math, array, type IndicatorResult } from '@deepentropy/oakscriptjs';

// Helper functions
function na(value: number | null | undefined): boolean {
  return value === null || value === undefined || Number.isNaN(value);
}

function nz(value: number | null | undefined, replacement: number = 0): number {
  return na(value) ? replacement : value as number;
}

// Plot configuration interface
interface PlotConfig {
  id: string;
  title: string;
  color: string;
  lineWidth?: number;
}

// Input configuration interface
export interface InputConfig {
  id: string;
  type: 'int' | 'float' | 'bool' | 'source' | 'string';
  title: string;
  defval: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface IndicatorInputs {
  len: number;
  src: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
  offset: number;
  maTypeInput: "None" | "SMA" | "SMA + Bollinger Bands" | "EMA" | "SMMA (RMA)" | "WMA" | "VWMA";
  maLengthInput: number;
  bbMultInput: number;
}

const defaultInputs: IndicatorInputs = {
  len: 9,
  src: "close",
  offset: 0,
  maTypeInput: "None",
  maLengthInput: 14,
  bbMultInput: 2,
};

export function Moving_Average_Simple(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { len, src, offset, maTypeInput, maLengthInput, bbMultInput } = { ...defaultInputs, ...inputs };
  
// OHLCV Series
const open = new Series(bars, (bar) => bar.open);
const high = new Series(bars, (bar) => bar.high);
const low = new Series(bars, (bar) => bar.low);
const close = new Series(bars, (bar) => bar.close);
const volume = new Series(bars, (bar) => bar.volume ?? 0);

// Calculated price sources
const hl2 = high.add(low).div(2);
const hlc3 = high.add(low).add(close).div(3);
const ohlc4 = open.add(high).add(low).add(close).div(4);
const hlcc4 = high.add(low).add(close).add(close).div(4);

// Map source inputs to Series
const srcSeries = (() => {
  switch (src) {
    case "open": return open;
    case "high": return high;
    case "low": return low;
    case "close": return close;
    case "hl2": return hl2;
    case "hlc3": return hlc3;
    case "ohlc4": return ohlc4;
    case "hlcc4": return hlcc4;
    default: return close;
  }
})();

// Time series
const year = new Series(bars, (bar) => new Date(bar.time).getFullYear());
const month = new Series(bars, (bar) => new Date(bar.time).getMonth() + 1);
const dayofmonth = new Series(bars, (bar) => new Date(bar.time).getDate());
const dayofweek = new Series(bars, (bar) => new Date(bar.time).getDay() + 1);
const hour = new Series(bars, (bar) => new Date(bar.time).getHours());
const minute = new Series(bars, (bar) => new Date(bar.time).getMinutes());

// Bar index
const last_bar_index = bars.length - 1;

  // @version=6
  const out = ta.sma(srcSeries, len);
  // Smoothing MA inputs
  const GRP = "Smoothing";
  const TT_BB = "Only applies when 'SMA + Bollinger Bands' is selected. Determines the distance between the SMA and the bands.";
  const isBB = (maTypeInput == "SMA + Bollinger Bands");
  const enableMA = (maTypeInput != "None");
  // Smoothing MA Calculation
  function ma(source: any, length: any, MAtype: any): any {
    return (() => {
      switch (MAtype) {
        case "SMA": return ta.sma(source, length);
        case "SMA + Bollinger Bands": return ta.sma(source, length);
        case "EMA": return ta.ema(source, length);
        case "SMMA (RMA)": return ta.rma(source, length);
        case "WMA": return ta.wma(source, length);
        case "VWMA": return ta.vwma(source, length, volume);
      }
    })();
  }
  // Smoothing MA plots
  const smoothingMA = (enableMA ? ma(out, maLengthInput, maTypeInput) : new Series(bars, () => NaN));
  const smoothingStDev = (isBB ? ta.stdev(out, maLengthInput).mul(bbMultInput) : new Series(bars, () => NaN));
  // bbUpperBand = <unsupported>;
  // bbLowerBand = <unsupported>;
  
  return {
    metadata: { title: "Moving Average Simple", shorttitle: "SMA", overlay: true },
    plots: { 'plot0': out.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })), 'plot1': smoothingMA.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })), 'plot2': smoothingMA.add(smoothingStDev).toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })), 'plot3': smoothingMA.sub(smoothingStDev).toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Moving Average Simple", shortTitle: "SMA", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'len', type: 'int', title: 'Length', defval: 9, min: 1 }, { id: 'src', type: 'source', title: 'Source', defval: "close" }, { id: 'offset', type: 'int', title: 'Offset', defval: 0, min: -500, max: 500 }, { id: 'maTypeInput', type: 'string', title: 'Type', defval: "None", options: ['None', 'SMA', 'SMA + Bollinger Bands', 'EMA', 'SMMA (RMA)', 'WMA', 'VWMA'] }, { id: 'maLengthInput', type: 'int', title: 'Length', defval: 14 }, { id: 'bbMultInput', type: 'float', title: 'BB StdDev', defval: 2, min: 0.001, max: 50, step: 0.5 }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'MA', color: '#2962FF', lineWidth: 2 }, { id: 'plot1', title: 'smoothingMA', color: '#FFFF00', lineWidth: 2 }, { id: 'plot2', title: 'Upper Bollinger Band', color: '#00FF00', lineWidth: 2 }, { id: 'plot3', title: 'Lower Bollinger Band', color: '#00FF00', lineWidth: 2 }];
export const calculate = Moving_Average_Simple;
export { Moving_Average_Simple as Moving_Average_SimpleIndicator };
export type Moving_Average_SimpleInputs = IndicatorInputs;