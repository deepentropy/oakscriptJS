import {Series, type IndicatorResult, type InputConfig, type PlotConfig} from 'oakscriptjs';

export interface IndicatorInputs {
  length: number;
  source: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
}

const defaultInputs: IndicatorInputs = {
  length: 9,
  source: "close",
};

export function Rate_Of_Change(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { length, source } = { ...defaultInputs, ...inputs };
  
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
const sourceSeries = (() => {
  switch (source) {
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
  const roc = sourceSeries.sub(sourceSeries.offset(length)).mul(100).div(sourceSeries.offset(length));
  
  return {
    metadata: { title: "Rate Of Change", shorttitle: "ROC", overlay: false },
    plots: { 'plot0': roc.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Rate Of Change", shortTitle: "ROC", overlay: false };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'length', type: 'int', title: 'length', defval: 9, min: 1 }, { id: 'source', type: 'source', title: 'Source', defval: "close" }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'ROC', color: '#2962FF', lineWidth: 2 }];
export const calculate = Rate_Of_Change;
export { Rate_Of_Change as Rate_Of_ChangeIndicator };
export type Rate_Of_ChangeInputs = IndicatorInputs;