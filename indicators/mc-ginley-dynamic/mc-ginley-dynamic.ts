import {Series, ta, math, na, type IndicatorResult, type InputConfig, type PlotConfig} from 'oakscriptjs';

export interface IndicatorInputs {
  length: number;
}

const defaultInputs: IndicatorInputs = {
  length: 14,
};

export function McGinley_Dynamic(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
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
  const source = close;
  let mg = new Series(bars, () => 0);
  // Recursive formula for mg
  const mgValues: number[] = new Array(bars.length).fill(NaN);
  for (let i = 0; i < bars.length; i++) {
    const mgPrev = i > 0 ? mgValues[i - 1] : NaN;
    mgValues[i] = (na(mgPrev) ? ta.ema(source, length).get(i) : (mgPrev + ((source.get(i) - mgPrev) / (length * math.pow((source.get(i) / mgPrev), 4)))));
  }
  mg = Series.fromArray(bars, mgValues);
  
  return {
    metadata: { title: "McGinley Dynamic", shorttitle: "McGinley Dynamic", overlay: true },
    plots: { 'plot0': mg.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "McGinley Dynamic", shortTitle: "McGinley Dynamic", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'length', type: 'int', title: 'length', defval: 14, min: 1 }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'mg', color: '#2962FF', lineWidth: 2 }];
export const calculate = McGinley_Dynamic;
export { McGinley_Dynamic as McGinley_DynamicIndicator };
export type McGinley_DynamicInputs = IndicatorInputs;