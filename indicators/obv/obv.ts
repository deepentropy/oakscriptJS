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
  // No inputs for basic OBV - it uses close and volume by default
}

const defaultInputs: IndicatorInputs = {};

export function On_Balance_Volume(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  // OHLCV Series
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
  
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
  // Check if volume is available
  const cumVol = ta.cum(volume);
  // src = close
  // obv = ta.cum(math.sign(ta.change(src)) * volume)
  const changeClose = ta.change(close, 1);
  const signChange = math.sign(changeClose);
  const signedVolume = signChange.mul(volume);
  const obv = ta.cum(signedVolume);
  
  return {
    metadata: { title: "On Balance Volume", shorttitle: "OBV", overlay: false },
    plots: { 'plot0': obv.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "On Balance Volume", shortTitle: "OBV", overlay: false };
export { defaultInputs };
export const inputConfig: InputConfig[] = [];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'OnBalanceVolume', color: '#2962FF', lineWidth: 2 }];
export const calculate = On_Balance_Volume;
export { On_Balance_Volume as On_Balance_VolumeIndicator };
export type On_Balance_VolumeInputs = IndicatorInputs;
