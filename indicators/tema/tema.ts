import {Series, ta, type IndicatorResult, type InputConfig, type PlotConfig} from 'oakscriptjs';

export interface IndicatorInputs {
  length: number;
}

const defaultInputs: IndicatorInputs = {
  length: 9,
};

export function Triple_EMA(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { length } = { ...defaultInputs, ...inputs };
  
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
  const ema1 = ta.ema(close, length);
  const ema2 = ta.ema(ema1, length);
  const ema3 = ta.ema(ema2, length);
  const out = ema1.sub(ema2).mul(3).add(ema3);
  
  return {
    metadata: { title: "Triple EMA", shorttitle: "TEMA", overlay: true },
    plots: { 'plot0': out.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Triple EMA", shortTitle: "TEMA", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'length', type: 'int', title: 'length', defval: 9, min: 1 }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'out', color: '#2962FF', lineWidth: 2 }];
export const calculate = Triple_EMA;
export { Triple_EMA as Triple_EMAIndicator };
export type Triple_EMAInputs = IndicatorInputs;