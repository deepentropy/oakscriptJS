import {Series, ta, taCore, math, array, type IndicatorResult} from 'oakscriptjs';

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
}

const defaultInputs: IndicatorInputs = {
  length: 10,
};

export function Mass_Index(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
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
  const span = high.sub(low);
  const mi = math.sum(ta.ema(span, 9).div(ta.ema(ta.ema(span, 9), 9)), length);
  
  return {
    metadata: { title: "Mass Index", shorttitle: "Mass Index", overlay: false },
    plots: { 'plot0': mi.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Mass Index", shortTitle: "Mass Index", overlay: false };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'length', type: 'int', title: 'length', defval: 10, min: 1 }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'mi', color: '#2962FF', lineWidth: 2 }];
export const calculate = Mass_Index;
export { Mass_Index as Mass_IndexIndicator };
export type Mass_IndexInputs = IndicatorInputs;