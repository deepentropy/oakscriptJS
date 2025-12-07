import {Series, ta, na, type IndicatorResult, type InputConfig, type PlotConfig} from 'oakscriptjs';

export interface IndicatorInputs {
  len: number;
  src: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
}

const defaultInputs: IndicatorInputs = {
  len: 7,
  src: "close",
};

export function Smoothed_Moving_Average(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { len, src } = { ...defaultInputs, ...inputs };
  
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
  let smma = new Series(bars, () => 0);
  // Recursive formula for smma
  const smmaValues: number[] = new Array(bars.length).fill(NaN);
  for (let i = 0; i < bars.length; i++) {
    const smmaPrev = i > 0 ? smmaValues[i - 1] : NaN;
    smmaValues[i] = (na(smmaPrev) ? ta.sma(srcSeries, len).get(i) : (((smmaPrev * (len - 1)) + srcSeries.get(i)) / len));
  }
  smma = Series.fromArray(bars, smmaValues);
  
  return {
    metadata: { title: "Smoothed Moving Average", shorttitle: "SMMA", overlay: true },
    plots: { 'plot0': smma.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Smoothed Moving Average", shortTitle: "SMMA", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'len', type: 'int', title: 'Length', defval: 7, min: 1 }, { id: 'src', type: 'source', title: 'Source', defval: "close" }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'smma', color: '#673AB7', lineWidth: 2 }];
export const calculate = Smoothed_Moving_Average;
export { Smoothed_Moving_Average as Smoothed_Moving_AverageIndicator };
export type Smoothed_Moving_AverageInputs = IndicatorInputs;