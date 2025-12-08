/**
 * Rate of Change (ROC) Indicator
 *
 * Hand-optimized implementation using oakscriptjs.
 * Measures the percentage change in price over a specified period.
 */

import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig, type Bar } from 'oakscriptjs';

export interface ROCInputs {
  length: number;
  src: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4';
}

export const defaultInputs: ROCInputs = {
  length: 9,
  src: 'close',
};

export const inputConfig: InputConfig[] = [
  { id: 'length', type: 'int', title: 'Length', defval: 9, min: 1 },
  { id: 'src', type: 'source', title: 'Source', defval: 'close' },
];

export const plotConfig: PlotConfig[] = [
  { id: 'plot0', title: 'ROC', color: '#2962FF', lineWidth: 2 },
];

export const metadata = {
  title: 'Rate Of Change',
  shortTitle: 'ROC',
  overlay: false,
};

function getSourceSeries(bars: Bar[], src: ROCInputs['src']): Series {
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

export function calculate(bars: Bar[], inputs: Partial<ROCInputs> = {}): IndicatorResult {
  const { length, src } = { ...defaultInputs, ...inputs };
  const source = getSourceSeries(bars, src);
  const roc = ta.roc(source, length);

  const plotData = roc.toArray().map((value, i) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  return {
    metadata: { title: metadata.title, shorttitle: metadata.shortTitle, overlay: metadata.overlay },
    plots: { 'plot0': plotData },
  };
}

export const ROC = { calculate, metadata, defaultInputs, inputConfig, plotConfig };
