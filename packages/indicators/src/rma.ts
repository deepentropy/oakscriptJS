/**
 * Smoothed Moving Average (RMA/SMMA) Indicator
 *
 * Hand-optimized implementation using oakscriptjs.
 * Also known as Wilder's Smoothing or SMMA. Uses exponential smoothing with alpha = 1/length.
 * First value is SMA, subsequent values use: (prev * (len - 1) + src) / len
 */

import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig, type Bar } from 'oakscriptjs';

export interface RMAInputs {
  len: number;
  src: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4';
}

export const defaultInputs: RMAInputs = {
  len: 7,
  src: 'close',
};

export const inputConfig: InputConfig[] = [
  { id: 'len', type: 'int', title: 'Length', defval: 7, min: 1 },
  { id: 'src', type: 'source', title: 'Source', defval: 'close' },
];

export const plotConfig: PlotConfig[] = [
  { id: 'plot0', title: 'SMMA', color: '#673AB7', lineWidth: 2 },
];

export const metadata = {
  title: 'Smoothed Moving Average',
  shortTitle: 'SMMA',
  overlay: true,
};

function getSourceSeries(bars: Bar[], src: RMAInputs['src']): Series {
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

export function calculate(bars: Bar[], inputs: Partial<RMAInputs> = {}): IndicatorResult {
  const { len, src } = { ...defaultInputs, ...inputs };
  const source = getSourceSeries(bars, src);
  const sourceArr = source.toArray();
  const sma = ta.sma(source, len);
  const smaArr = sma.toArray();

  // SMMA formula: first value = SMA, then (prev * (len - 1) + src) / len
  const smmaArr: (number | undefined)[] = [];

  for (let i = 0; i < bars.length; i++) {
    const prev = i > 0 ? smmaArr[i - 1] : undefined;
    const srcVal = sourceArr[i];

    if (prev === undefined || isNaN(prev as number)) {
      // Use SMA as initial value
      smmaArr.push(smaArr[i]);
    } else {
      // SMMA formula
      smmaArr.push(((prev as number) * (len - 1) + (srcVal ?? 0)) / len);
    }
  }

  const plotData = smmaArr.map((value, i) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  return {
    metadata: { title: metadata.title, shorttitle: metadata.shortTitle, overlay: metadata.overlay },
    plots: { 'plot0': plotData },
  };
}

export const RMA = { calculate, metadata, defaultInputs, inputConfig, plotConfig };
