import {Series, ta, type IndicatorResult, type InputConfig, type PlotConfig} from 'oakscriptjs';

export interface IndicatorInputs {
  length: number;
  offset: number;
  src: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
}

const defaultInputs: IndicatorInputs = {
  length: 25,
  offset: 0,
  src: "close",
};

export function Least_Squares_Moving_Average(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { length, offset, src } = { ...defaultInputs, ...inputs };
  
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

  // @version=6
  const lsma = ta.linreg(srcSeries, length, offset);
  
  return {
    metadata: { title: "Least Squares Moving Average", shorttitle: "LSMA", overlay: true },
    plots: { 'plot0': lsma.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Least Squares Moving Average", shortTitle: "LSMA", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'length', type: 'int', title: 'Length', defval: 25 }, { id: 'offset', type: 'int', title: 'Offset', defval: 0 }, { id: 'src', type: 'source', title: 'Source', defval: "close" }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'lsma', color: '#2962FF', lineWidth: 2 }];
export const calculate = Least_Squares_Moving_Average;
export { Least_Squares_Moving_Average as Least_Squares_Moving_AverageIndicator };
export type Least_Squares_Moving_AverageInputs = IndicatorInputs;