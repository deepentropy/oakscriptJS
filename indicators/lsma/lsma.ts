import { Series, ta, taCore, math, array, type IndicatorResult } from '@deepentropy/oakscriptjs';

// Helper functions
function na(value: number | null | undefined): boolean {
  return value === null || value === undefined || Number.isNaN(value);
}

function nz(value: number | null | undefined, replacement: number = 0): number {
  return na(value) ? replacement : value as number;
}

// Plot configuration interface
interface PlotConfig {
  id: string;
  title: string;
  color: string;
  lineWidth?: number;
}

// Input configuration interface
export interface InputConfig {
  id: string;
  type: 'int' | 'float' | 'bool' | 'source' | 'string';
  title: string;
  defval: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

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
  const lsma = ta.linreg(srcSeries, length, offset);
  
  return {
    metadata: { title: "Least Squares Moving Average", shorttitle: "LSMA", overlay: true },
    plots: { 'plot0': lsma.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Least Squares Moving Average", shortTitle: "LSMA", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'length', type: 'int', title: 'Length', defval: 25 }, { id: 'offset', type: 'int', title: 'Offset', defval: 0 }, { id: 'src', type: 'source', title: 'Source', defval: "close", options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4'] }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'lsma', color: '#2962FF', lineWidth: 2 }];
export const calculate = Least_Squares_Moving_Average;
export { Least_Squares_Moving_Average as Least_Squares_Moving_AverageIndicator };
export type Least_Squares_Moving_AverageInputs = IndicatorInputs;