/**
 * Volume Weighted Moving Average (VWMA) Indicator
 *
 * Hand-optimized implementation using oakscriptjs.
 * A moving average weighted by volume.
 */

import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig, type Bar } from 'oakscriptjs';

export interface VWMAInputs {
  length: number;
  src: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4';
}

export const defaultInputs: VWMAInputs = {
  length: 20,
  src: 'close',
};

export const inputConfig: InputConfig[] = [
  { id: 'length', type: 'int', title: 'Length', defval: 20, min: 1 },
  { id: 'src', type: 'source', title: 'Source', defval: 'close' },
];

export const plotConfig: PlotConfig[] = [
  { id: 'plot0', title: 'VWMA', color: '#2962FF', lineWidth: 2 },
];

export const metadata = {
  title: 'Volume Weighted Moving Average',
  shortTitle: 'VWMA',
  overlay: true,
};

function getSourceSeries(bars: Bar[], src: VWMAInputs['src']): Series {
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);

  switch (src) {
    case 'open': return open;
    case 'high': return high;
    case 'low': return low;
    case 'close': return close;
    case 'hl2': return high.add(low).div(2);
    case 'hlc3': return high.add(low).add(close).div(3);
    case 'ohlc4': return open.add(high).add(low).add(close).div(4);
    case 'hlcc4': return high.add(low).add(close).add(close).div(4);
    default: return close;
  }
}

export function calculate(bars: Bar[], inputs: Partial<VWMAInputs> = {}): IndicatorResult {
  const { length, src } = { ...defaultInputs, ...inputs };
  const source = getSourceSeries(bars, src);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
  const vwma = ta.vwma(source, length, volume);

  const plotData = vwma.toArray().map((value, i) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  return {
    metadata: { title: metadata.title, shorttitle: metadata.shortTitle, overlay: metadata.overlay },
    plots: { 'plot0': plotData },
  };
}

export const VWMA = { calculate, metadata, defaultInputs, inputConfig, plotConfig };
