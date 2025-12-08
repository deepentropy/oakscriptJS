/**
 * Commodity Channel Index (CCI) Indicator
 *
 * Hand-optimized implementation using oakscriptjs.
 * Measures the variation of a security's price from its statistical mean.
 * High values show the price is unusually high compared to average, low values show it's unusually low.
 */

import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig, type Bar } from 'oakscriptjs';

export interface CCIInputs {
  length: number;
  src: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4';
}

export const defaultInputs: CCIInputs = {
  length: 20,
  src: 'hlc3',
};

export const inputConfig: InputConfig[] = [
  { id: 'length', type: 'int', title: 'Length', defval: 20, min: 1 },
  { id: 'src', type: 'source', title: 'Source', defval: 'hlc3' },
];

export const plotConfig: PlotConfig[] = [
  { id: 'plot0', title: 'CCI', color: '#2962FF', lineWidth: 2 },
];

export const metadata = {
  title: 'Commodity Channel Index',
  shortTitle: 'CCI',
  overlay: false,
};

function getSourceSeries(bars: Bar[], src: CCIInputs['src']): Series {
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

export function calculate(bars: Bar[], inputs: Partial<CCIInputs> = {}): IndicatorResult {
  const { length, src } = { ...defaultInputs, ...inputs };
  const source = getSourceSeries(bars, src);
  const cci = ta.cci(source, length);

  const plotData = cci.toArray().map((value: number | undefined, i: number) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  return {
    metadata: { title: metadata.title, shorttitle: metadata.shortTitle, overlay: metadata.overlay },
    plots: { 'plot0': plotData },
  };
}

export const CCI = { calculate, metadata, defaultInputs, inputConfig, plotConfig };
