/**
 * Moving Average Convergence Divergence (MACD) Indicator
 *
 * Hand-optimized implementation using oakscriptjs.
 * Trend-following momentum indicator showing relationship between two EMAs.
 */

import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig, type Bar } from 'oakscriptjs';

export interface MACDInputs {
  fastLength: number;
  slowLength: number;
  signalLength: number;
  src: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4';
}

export const defaultInputs: MACDInputs = {
  fastLength: 12,
  slowLength: 26,
  signalLength: 9,
  src: 'close',
};

export const inputConfig: InputConfig[] = [
  { id: 'fastLength', type: 'int', title: 'Fast Length', defval: 12, min: 1 },
  { id: 'slowLength', type: 'int', title: 'Slow Length', defval: 26, min: 1 },
  { id: 'signalLength', type: 'int', title: 'Signal Smoothing', defval: 9, min: 1 },
  { id: 'src', type: 'source', title: 'Source', defval: 'close' },
];

export const plotConfig: PlotConfig[] = [
  { id: 'plot0', title: 'Histogram', color: '#26A69A', lineWidth: 2 },
  { id: 'plot1', title: 'MACD', color: '#2962FF', lineWidth: 2 },
  { id: 'plot2', title: 'Signal', color: '#FF6D00', lineWidth: 2 },
];

export const metadata = {
  title: 'Moving Average Convergence Divergence',
  shortTitle: 'MACD',
  overlay: false,
};

function getSourceSeries(bars: Bar[], src: MACDInputs['src']): Series {
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

export function calculate(bars: Bar[], inputs: Partial<MACDInputs> = {}): IndicatorResult {
  const { fastLength, slowLength, signalLength, src } = { ...defaultInputs, ...inputs };
  const source = getSourceSeries(bars, src);

  // MACD line = Fast EMA - Slow EMA
  const fastEMA = ta.ema(source, fastLength);
  const slowEMA = ta.ema(source, slowLength);
  const macdLine = fastEMA.sub(slowEMA);

  // Signal line = EMA of MACD line
  const signalLine = ta.ema(macdLine, signalLength);

  // Histogram = MACD line - Signal line
  const histogram = macdLine.sub(signalLine);

  const histData = histogram.toArray().map((value, i) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  const macdData = macdLine.toArray().map((value, i) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  const signalData = signalLine.toArray().map((value, i) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  return {
    metadata: { title: metadata.title, shorttitle: metadata.shortTitle, overlay: metadata.overlay },
    plots: {
      'plot0': histData,
      'plot1': macdData,
      'plot2': signalData,
    },
  };
}

export const MACD = { calculate, metadata, defaultInputs, inputConfig, plotConfig };
