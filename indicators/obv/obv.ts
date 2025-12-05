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
  maTypeInput: "None" | "SMA" | "SMA + Bollinger Bands" | "EMA" | "SMMA (RMA)" | "WMA" | "VWMA";
  maLengthInput: number;
  bbMultInput: number;
}

const defaultInputs: IndicatorInputs = {
  maTypeInput: "None",
  maLengthInput: 14,
  bbMultInput: 2,
};

export function On_Balance_Volume(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { maTypeInput, maLengthInput, bbMultInput } = { ...defaultInputs, ...inputs };
  
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
  const cumVol = 0;
  (cumVol += nz(volume));
  if ((i === bars.length - 1)) {
    runtime.error("No volume is provided by the data vendor.");
  }
  const src = close;
  const obv = ta.cum(math.sign(ta.change(src)).mul(volume));
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
  const smoothingMA = (enableMA ? ma(obv, maLengthInput, maTypeInput) : new Series(bars, () => NaN));
  const smoothingStDev = (isBB ? ta.stdev(obv, maLengthInput).mul(bbMultInput) : new Series(bars, () => NaN));
  // bbUpperBand = <unsupported>;
  // bbLowerBand = <unsupported>;
  
  return {
    metadata: { title: "On Balance Volume", shorttitle: "OBV", overlay: false },
    plots: { 'plot0': obv.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })), 'plot1': smoothingMA.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })), 'plot2': smoothingMA.add(smoothingStDev).toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })), 'plot3': smoothingMA.sub(smoothingStDev).toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "On Balance Volume", shortTitle: "OBV", overlay: false };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'maTypeInput', type: 'string', title: 'Type', defval: "None", options: ['None', 'SMA', 'SMA + Bollinger Bands', 'EMA', 'SMMA (RMA)', 'WMA', 'VWMA'] }, { id: 'maLengthInput', type: 'int', title: 'Length', defval: 14 }, { id: 'bbMultInput', type: 'float', title: 'BB StdDev', defval: 2, min: 0.001, max: 50, step: 0.5 }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'OnBalanceVolume', color: '#2962FF', lineWidth: 2 }, { id: 'plot1', title: 'smoothingMA', color: '#FFFF00', lineWidth: 2 }, { id: 'plot2', title: 'Upper Bollinger Band', color: '#00FF00', lineWidth: 2 }, { id: 'plot3', title: 'Lower Bollinger Band', color: '#00FF00', lineWidth: 2 }];
export const calculate = On_Balance_Volume;
export { On_Balance_Volume as On_Balance_VolumeIndicator };
export type On_Balance_VolumeInputs = IndicatorInputs;