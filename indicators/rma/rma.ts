import { Series, ta, type IndicatorResult } from '@deepentropy/oakscriptjs';

export interface IndicatorInputs {
  len: number;
  src: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
}

const defaultInputs: IndicatorInputs = {
  len: 7,
  src: "close",
};

export function Smoothed_Moving_Average(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
  const { len, src } = { ...defaultInputs, ...inputs };
  
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
  
  // @version=6
  // RMA calculation using ta.rma
  const smma = ta.rma(srcSeries, len);
  
  return {
    metadata: { title: "Smoothed Moving Average", shorttitle: "SMMA", overlay: true },
    plots: { 'plot0': smma.toArray().map((v: number | undefined, i: number) => ({ time: bars[i]!.time, value: v ?? NaN })) },
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
export const metadata = { title: "Smoothed Moving Average", shortTitle: "SMMA", overlay: true };
export { defaultInputs };
export const inputConfig: InputConfig[] = [{ id: 'len', type: 'int', title: 'Length', defval: 7, min: 1 }, { id: 'src', type: 'source', title: 'Source', defval: "close", options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4'] }];
export const plotConfig: PlotConfig[] = [{ id: 'plot0', title: 'SMMA', color: '#673AB7', lineWidth: 2 }];
export const calculate = Smoothed_Moving_Average;
export { Smoothed_Moving_Average as Smoothed_Moving_AverageIndicator };
export type Smoothed_Moving_AverageInputs = IndicatorInputs;
