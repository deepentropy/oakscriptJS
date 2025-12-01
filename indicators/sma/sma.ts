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

import { indicator, type Bar } from '@deepentropy/oakscriptjs';
import { calculateSMA } from './sma-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Simple Moving Average',
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

/**
 * SMA Indicator using the new indicator() pattern
 * Provides automatic pane management based on overlay setting
 * 
 * Note: The setup function is a placeholder for future implementation.
 * Currently, calculation is done via the calculate() function which is
 * used by the indicator registry. The indicator() pattern provides:
 * - Metadata with overlay setting for automatic pane placement
 * - getPaneIndex() for determining where to render the indicator
 * - isOverlay() for checking if indicator should be on price chart
 */
export const SMAIndicator = indicator({
  title: 'Simple Moving Average',
  shortTitle: 'SMA',
  overlay: true,
}, (_ctx) => {
  // Calculation is handled by the calculate() function
  // This setup function will be enhanced when ctx.addLineSeries() is available
});
