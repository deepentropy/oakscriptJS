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
  lengthInput: number;
  offsetInput: number;
  sigmaInput: number;
}

const defaultInputs: IndicatorInputs = {
  lengthInput: 9,
  offsetInput: 0.85,
  sigmaInput: 6,
};

export function Arnaud_Legoux_Moving_Average(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { lengthInput, offsetInput, sigmaInput } = { ...defaultInputs, ...inputs };
  
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
  // ALMA calculation using taCore.alma (array-based)
  const closeArray = close.toArray();
  const almaArray = taCore.alma(closeArray, lengthInput, offsetInput, sigmaInput);
  const almaValues = new Series(bars, (bar, i) => almaArray[i] ?? NaN);
  
  return {
    metadata: { title: "Arnaud Legoux Moving Average", shorttitle: "ALMA", overlay: true },
    plots: { 'plot0': almaValues.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
  };
}

// Additional exports for compatibility
export const metadata = { title: "Arnaud Legoux Moving Average", shortTitle: "ALMA", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [
  { id: 'lengthInput', type: 'int', title: 'Length', defval: 9, min: 1 },
  { id: 'offsetInput', type: 'float', title: 'Offset', defval: 0.85, step: 0.01 },
  { id: 'sigmaInput', type: 'float', title: 'Sigma', defval: 6 }
];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'ALMA', color: '#2962FF', lineWidth: 2 }];
export const calculate = Arnaud_Legoux_Moving_Average;
export { Arnaud_Legoux_Moving_Average as Arnaud_Legoux_Moving_AverageIndicator };
export type Arnaud_Legoux_Moving_AverageInputs = IndicatorInputs;
