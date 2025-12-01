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

import type { Bar } from '@deepentropy/oakscriptjs';
import { calculateSMA } from './sma-calculation';

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
 * Calculate SMA indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<SMAInputs> = {}) {
  // Merge inputs with defaults
  const { length, source, offset } = { ...defaultInputs, ...inputs };

  // Calculate SMA using the calculation module
  const smaData = calculateSMA(bars, length, source, offset);

  return {
    plots: {
      ma: smaData,
    },
  };
}
