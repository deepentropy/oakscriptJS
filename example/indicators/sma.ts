/**
 * Simple Moving Average (SMA) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="Moving Average Simple", shorttitle="SMA", overlay=true, timeframe="", timeframe_gaps=true)
 * len = input.int(9, minval=1, title="Length")
 * src = input(close, title="Source")
 * offset = input.int(title="Offset", defval=0, minval=-500, maxval=500, display = display.data_window)
 * out = ta.sma(src, len)
 * plot(out, color=color.blue, title="MA", offset=offset)
 * ```
 */

import { Series, ta, type Bar } from '@deepentropy/oakscriptjs';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Moving Average Simple',
  shortTitle: 'SMA',
  overlay: true,
};

/**
 * Input definitions for the SMA indicator
 */
export interface SMAInputs {
  length: number;
  source: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
  offset: number;
}

/**
 * Default input values
 */
export const defaultInputs: SMAInputs = {
  length: 9,
  source: 'close',
  offset: 0,
};

/**
 * Input configuration for UI generation
 */
export const inputConfig = [
  {
    id: 'length',
    type: 'int' as const,
    title: 'Length',
    defval: 9,
    min: 1,
    max: 500,
    step: 1,
  },
  {
    id: 'source',
    type: 'source' as const,
    title: 'Source',
    defval: 'close',
    options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'],
  },
  {
    id: 'offset',
    type: 'int' as const,
    title: 'Offset',
    defval: 0,
    min: -500,
    max: 500,
    step: 1,
  },
];

/**
 * Plot configuration
 */
export const plotConfig = [
  {
    id: 'ma',
    title: 'MA',
    color: '#2962FF', // blue
    lineWidth: 2,
  },
];

/**
 * Get source series based on source name
 */
function getSourceSeries(bars: Bar[], sourceName: string): Series {
  switch (sourceName) {
    case 'open':
      return Series.fromBars(bars, 'open');
    case 'high':
      return Series.fromBars(bars, 'high');
    case 'low':
      return Series.fromBars(bars, 'low');
    case 'close':
      return Series.fromBars(bars, 'close');
    case 'hl2': {
      const high = Series.fromBars(bars, 'high');
      const low = Series.fromBars(bars, 'low');
      return high.add(low).div(2);
    }
    case 'hlc3': {
      const high = Series.fromBars(bars, 'high');
      const low = Series.fromBars(bars, 'low');
      const close = Series.fromBars(bars, 'close');
      return high.add(low).add(close).div(3);
    }
    case 'ohlc4': {
      const open = Series.fromBars(bars, 'open');
      const high = Series.fromBars(bars, 'high');
      const low = Series.fromBars(bars, 'low');
      const close = Series.fromBars(bars, 'close');
      return open.add(high).add(low).add(close).div(4);
    }
    default:
      return Series.fromBars(bars, 'close');
  }
}

/**
 * Calculate SMA indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Array of plot data points
 */
export function calculate(bars: Bar[], inputs: Partial<SMAInputs> = {}) {
  // Merge inputs with defaults
  const { length, source, offset } = { ...defaultInputs, ...inputs };

  // Get source series
  const src = getSourceSeries(bars, source);

  // Calculate SMA
  const smaValues = ta.sma(src, length);

  // Convert to time-value pairs with offset applied
  const smaArray = smaValues.toArray();
  const data: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < bars.length; i++) {
    const targetIndex = i + offset;
    if (targetIndex >= 0 && targetIndex < bars.length) {
      const value = smaArray[i];
      const targetBar = bars[targetIndex];
      if (targetBar && value !== undefined && !Number.isNaN(value)) {
        data.push({ time: targetBar.time, value });
      }
    }
  }

  return {
    plots: {
      ma: data,
    },
  };
}
