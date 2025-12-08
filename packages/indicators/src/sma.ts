/**
 * Simple Moving Average (SMA) Indicator
 *
 * Hand-optimized implementation using oakscriptjs.
 * Matches TradingView's built-in SMA indicator.
 */

import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig, type Bar } from 'oakscriptjs';

/**
 * SMA indicator input parameters
 */
export interface SMAInputs {
  /** SMA period length */
  len: number;
  /** Price source */
  src: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4' | 'hlcc4';
  /** Plot offset */
  offset: number;
}

/**
 * Default input values
 */
export const defaultInputs: SMAInputs = {
  len: 9,
  src: 'close',
  offset: 0,
};

/**
 * Input configuration for UI
 */
export const inputConfig: InputConfig[] = [
  { id: 'len', type: 'int', title: 'Length', defval: 9, min: 1 },
  { id: 'src', type: 'source', title: 'Source', defval: 'close' },
  { id: 'offset', type: 'int', title: 'Offset', defval: 0, min: -500, max: 500 },
];

/**
 * Plot configuration
 */
export const plotConfig: PlotConfig[] = [
  { id: 'plot0', title: 'MA', color: '#2962FF', lineWidth: 2 },
];

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Simple Moving Average',
  shortTitle: 'SMA',
  overlay: true,
};

/**
 * Get source series based on input selection
 */
function getSourceSeries(bars: Bar[], src: SMAInputs['src']): Series {
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

/**
 * Calculate SMA indicator
 *
 * @param bars - OHLCV bar data
 * @param inputs - Indicator parameters (optional, uses defaults)
 * @returns Indicator result with plot data
 */
export function calculate(bars: Bar[], inputs: Partial<SMAInputs> = {}): IndicatorResult {
  const { len, src } = { ...defaultInputs, ...inputs };

  // Get source series
  const source = getSourceSeries(bars, src);

  // Calculate SMA
  const smaResult = ta.sma(source, len);

  // Convert to plot format
  const plotData = smaResult.toArray().map((value, i) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  return {
    metadata: {
      title: metadata.title,
      shorttitle: metadata.shortTitle,
      overlay: metadata.overlay,
    },
    plots: {
      'plot0': plotData,
    },
  };
}

/**
 * SMA indicator module
 */
export const SMA = {
  calculate,
  metadata,
  defaultInputs,
  inputConfig,
  plotConfig,
};
