/**
 * Hull Moving Average (HMA) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="Hull Moving Average", shorttitle="HMA", overlay=true, timeframe="", timeframe_gaps=true)
 * length = input.int(9, "Length", minval = 2)
 * src = input(close, "Source")
 * hullma = ta.wma(2*ta.wma(src, length/2)-ta.wma(src, length), math.floor(math.sqrt(length)))
 * plot(hullma, "HMA")
 * ```
 */

import { indicator, type Bar } from '@deepentropy/oakscriptjs';
import { calculateHMA } from './hma-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Hull Moving Average',
  shortTitle: 'HMA',
  overlay: true,
};

/**
 * Input definitions for the HMA indicator
 */
export interface HMAInputs {
  length: number;
  source: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
}

/**
 * Default input values
 */
export const defaultInputs: HMAInputs = {
  length: 9,
  source: 'close',
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
    min: 2,
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
];

/**
 * Plot configuration
 */
export const plotConfig = [
  {
    id: 'hma',
    title: 'HMA',
    color: '#00BCD4', // cyan
    lineWidth: 2,
  },
];

/**
 * Calculate HMA indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<HMAInputs> = {}) {
  // Merge inputs with defaults
  const { length, source } = { ...defaultInputs, ...inputs };

  // Calculate HMA using the calculation module
  const hmaData = calculateHMA(bars, length, source);

  return {
    plots: {
      hma: hmaData,
    },
  };
}

/**
 * Hull Moving Average Indicator using the new indicator() pattern
 * Provides automatic pane management based on overlay setting (price chart)
 */
export const HMAIndicator = indicator({
  title: 'Hull Moving Average',
  shortTitle: 'HMA',
  overlay: true,
}, (_ctx) => {
  // The setup function is called during calculate()
  // Actual calculation is done via the calculate() function above
});
