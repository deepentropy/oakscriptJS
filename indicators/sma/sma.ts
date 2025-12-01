import { Series, ta, taCore, math, array, type IndicatorResult } from '@deepentropy/oakscriptjs';

// Helper functions
function na(value: number | null | undefined): boolean {
  return value === null || value === undefined || Number.isNaN(value);
}

function nz(value: number | null | undefined, replacement: number = 0): number {
  return na(value) ? replacement : value as number;
}

export interface IndicatorInputs {
  len: number;
  offset: number;
  maTypeInput: "None" | "SMA" | "SMA + Bollinger Bands" | "EMA" | "SMMA (RMA)" | "WMA" | "VWMA";
  maLengthInput: number;
  bbMultInput: number;
}

const defaultInputs: IndicatorInputs = {
  len: 9,
  offset: 0,
  maTypeInput: "None",
  maLengthInput: 14,
  bbMultInput: 2,
};

export function Indicator(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { len, offset, maTypeInput, maLengthInput, bbMultInput } = { ...defaultInputs, ...inputs };
  
  // OHLCV Series
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume);
  
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
  src = input(close, title = "Source");
  out = ta.sma(src, len);
  // Smoothing MA inputs
  GRP = "Smoothing";
  TT_BB = "Only applies when 'SMA + Bollinger Bands' is selected. Determines the distance between the SMA and the bands.";
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
        case "VWMA": return ta.vwma(source, length);
      }
    })();
  }
  // Smoothing MA plots
  smoothingMA = (enableMA ? ma(out, maLengthInput, maTypeInput) : NaN);
  smoothingStDev = (isBB ? ta.stdev(out, maLengthInput).mul(bbMultInput) : NaN);
  
  return {
    metadata: { title: "Indicator", overlay: false },
    plots: [{ data: out.toArray().map((v, i) => ({ time: bars[i].time, value: v })) }, { data: smoothingMA.toArray().map((v, i) => ({ time: bars[i].time, value: v })) }, { data: (smoothingMA + smoothingStDev).toArray().map((v, i) => ({ time: bars[i].time, value: v })) }, { data: (smoothingMA - smoothingStDev).toArray().map((v, i) => ({ time: bars[i].time, value: v })) }],
  };
}