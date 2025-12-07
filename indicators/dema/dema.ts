import {Series, ta, type IndicatorResult, type InputConfig, type PlotConfig} from 'oakscriptjs';

export interface IndicatorInputs {
  length: number;
  src: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
}

const defaultInputs: IndicatorInputs = {
  length: 9,
  src: "close",
};

export function Double_EMA(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { length, src } = { ...defaultInputs, ...inputs };
  
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
  const e1 = ta.ema(srcSeries, length);
  const e2 = ta.ema(e1, length);
  const dema = e1.mul(2).sub(e2);
  
  return {
    metadata: { title: "Double EMA", shorttitle: "DEMA", overlay: true },
    plots: { 'plot0': dema.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Double EMA", shortTitle: "DEMA", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'length', type: 'int', title: 'length', defval: 9, min: 1 }, { id: 'src', type: 'source', title: 'Source', defval: "close" }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'dema', color: '#43A047', lineWidth: 2 }];
export const calculate = Double_EMA;
export { Double_EMA as Double_EMAIndicator };
export type Double_EMAInputs = IndicatorInputs;