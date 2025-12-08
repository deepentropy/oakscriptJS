import { Series, type IndicatorResult, type InputConfig, type PlotConfig } from 'oakscriptjs';

export function Balance_of_Power(bars: any[]): IndicatorResult {
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
  
  return {
    metadata: { title: "Balance of Power", shorttitle: "Balance of Power", overlay: false },
    plots: { 'plot0': close.sub(open).div(high.sub(low)).toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Balance of Power", shortTitle: "Balance of Power", overlay: false };
export const defaultInputs = {};
export const inputConfig: InputConfig[] = [];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'Plot 0', color: '#FF0000', lineWidth: 2 }];
export const calculate = Balance_of_Power;
export { Balance_of_Power as Balance_of_PowerIndicator };
export type Balance_of_PowerInputs = Record<string, never>;