import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig } from 'oakscriptjs';

export interface IndicatorInputs {
  lengthInput: number;
}

const defaultInputs: IndicatorInputs = {
  lengthInput: 14,
};

export function Average_Day_Range(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { lengthInput } = { ...defaultInputs, ...inputs };
  
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
  const adr = ta.sma(high.sub(low), lengthInput);
  
  return {
    metadata: { title: "Average Day Range", shorttitle: "ADR", overlay: false },
    plots: { 'plot0': adr.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Average Day Range", shortTitle: "ADR", overlay: false };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'lengthInput', type: 'int', title: 'Length', defval: 14 }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'ADR', color: '#2962FF', lineWidth: 2 }];
export const calculate = Average_Day_Range;
export { Average_Day_Range as Average_Day_RangeIndicator };
export type Average_Day_RangeInputs = IndicatorInputs;