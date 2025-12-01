/**
 * Triple EMA (TEMA) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="Triple EMA", shorttitle="TEMA", overlay=true, timeframe="", timeframe_gaps=true)
 * length = input.int(9, minval=1)
 * ema1 = ta.ema(close, length)
 * ema2 = ta.ema(ema1, length)
 * ema3 = ta.ema(ema2, length)
 * out = 3 * (ema1 - ema2) + ema3
 * plot(out, "TEMA", color=#2962FF)
 * ```
 */

import { indicator, type Bar } from '@deepentropy/oakscriptjs';
import { calculateTEMA } from './tema-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Triple EMA',
  shortTitle: 'TEMA',
  overlay: true,
};

/**
 * Input definitions for the TEMA indicator
 */
export interface TEMAInputs {
  length: number;
  source: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
}

/**
 * Default input values
 */
export const defaultInputs: TEMAInputs = {
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
];

/**
 * Plot configuration
 */
export const plotConfig = [
  {
    id: 'tema',
    title: 'TEMA',
    color: '#2962FF', // blue
    lineWidth: 2,
  },
];

/**
 * Calculate TEMA indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<TEMAInputs> = {}) {
  // Merge inputs with defaults
  const { length, source } = { ...defaultInputs, ...inputs };

  // Calculate TEMA using the calculation module
  const temaData = calculateTEMA(bars, length, source);

  return {
    plots: {
      tema: temaData,
    },
  };
}

/**
 * Triple EMA Indicator using the new indicator() pattern
 * Provides automatic pane management based on overlay setting (price chart)
 */
export const TEMAIndicator = indicator({
  title: 'Triple EMA',
  shortTitle: 'TEMA',
  overlay: true,
}, (_ctx) => {
  // The setup function is called during calculate()
  // Actual calculation is done via the calculate() function above
});
