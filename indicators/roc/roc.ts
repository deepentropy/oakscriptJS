/**
 * Rate of Change (ROC) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="Rate Of Change", shorttitle="ROC", format=format.price, precision=2, timeframe="", timeframe_gaps=true)
 * length = input.int(9, minval=1)
 * source = input(close, "Source")
 * roc = 100 * (source - source[length])/source[length]
 * plot(roc, color=#2962FF, title="ROC")
 * ```
 */

import { indicator, type Bar } from '@deepentropy/oakscriptjs';
import { calculateROC } from './roc-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Rate Of Change',
  shortTitle: 'ROC',
  overlay: false,
};

/**
 * Input definitions for the ROC indicator
 */
export interface ROCInputs {
  length: number;
  source: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
}

/**
 * Default input values
 */
export const defaultInputs: ROCInputs = {
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
    id: 'roc',
    title: 'ROC',
    color: '#2962FF', // blue
    lineWidth: 2,
  },
];

/**
 * Calculate ROC indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<ROCInputs> = {}) {
  // Merge inputs with defaults
  const { length, source } = { ...defaultInputs, ...inputs };

  // Calculate ROC using the calculation module
  const rocData = calculateROC(bars, length, source);

  return {
    plots: {
      roc: rocData,
    },
  };
}

/**
 * Rate of Change Indicator using the new indicator() pattern
 * Provides automatic pane management based on overlay setting (separate pane)
 */
export const ROCIndicator = indicator({
  title: 'Rate Of Change',
  shortTitle: 'ROC',
  overlay: false,
  format: 'price',
  precision: 2,
}, (_ctx) => {
  // The setup function is called during calculate()
  // Actual calculation is done via the calculate() function above
});
