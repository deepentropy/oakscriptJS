import { Series, ta, taCore, math, array, type IndicatorResult } from '@deepentropy/oakscriptjs';

// Helper functions
function na(value: number | null | undefined): boolean {
  return value === null || value === undefined || Number.isNaN(value);
}

function nz(value: number | null | undefined, replacement: number = 0): number {
  return na(value) ? replacement : value as number;
}

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
  
  return {
    metadata: { title: "Balance of Power", overlay: false },
    plots: [{ data: close.sub(open).div(high.sub(low)).toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v! })) }],
  };
}

// Additional exports for compatibility
export const metadata = { title: "Balance of Power", shortTitle: "BOP", overlay: false };
export const defaultInputs = {};
export const inputConfig = {};
export const plotConfig = {};
export const calculate = Balance_of_Power;
export { Balance_of_Power as Balance_of_PowerIndicator };
export type Balance_of_PowerInputs = Record<string, never>;