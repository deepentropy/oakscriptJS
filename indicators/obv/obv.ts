import { Series, ta, math, type IndicatorResult } from '@deepentropy/oakscriptjs';

export interface IndicatorInputs {
  // No inputs for basic OBV - it uses close and volume by default
}

const defaultInputs: IndicatorInputs = {};

export function On_Balance_Volume(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  // OHLCV Series
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
  
  // @version=6
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
export const metadata = { title: "On Balance Volume", shortTitle: "OBV", overlay: false };
export { defaultInputs };
export const inputConfig: InputConfig[] = [];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'OnBalanceVolume', color: '#2962FF', lineWidth: 2 }];
export const calculate = On_Balance_Volume;
export { On_Balance_Volume as On_Balance_VolumeIndicator };
export type On_Balance_VolumeInputs = IndicatorInputs;
