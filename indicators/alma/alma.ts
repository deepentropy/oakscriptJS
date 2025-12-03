import { Series, taCore, type IndicatorResult } from '@deepentropy/oakscriptjs';

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
  
  // Close series for ALMA calculation
  const close = new Series(bars, (bar) => bar.close);
  
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
