import { Series, ta, math, nz, type IndicatorResult, type InputConfig, type PlotConfig } from 'oakscriptjs';

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

  // @version=6
  let cumVol = 0;
  (cumVol += nz(volume));
  if (true) {
    (() => { throw new Error("No volume is provided by the data vendor."); })();
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
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'OnBalanceVolume', color: '#2962FF', lineWidth: 2 }, { id: 'plot1', title: 'smoothingMA', color: '#FFFF00', lineWidth: 2, display: 'all', visible: 'enableMA' }, { id: 'plot2', title: 'Upper Bollinger Band', color: '#00FF00', lineWidth: 2, display: 'all', visible: 'isBB' }, { id: 'plot3', title: 'Lower Bollinger Band', color: '#00FF00', lineWidth: 2, display: 'all', visible: 'isBB' }];
export const fillConfig = [{ id: 'fill0', plot1: 'plot2', plot2: 'plot3', color: '#2962FF', title: 'Bollinger Bands Background Fill', visible: 'isBB' }];
export const calculate = On_Balance_Volume;
export { On_Balance_Volume as On_Balance_VolumeIndicator };
export type On_Balance_VolumeInputs = IndicatorInputs;