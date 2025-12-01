/**
 * Double EMA (DEMA) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="Double EMA", shorttitle="DEMA", overlay=true, timeframe="", timeframe_gaps=true)
 * length = input.int(9, minval=1)
 * src = input(close, title="Source")
 * e1 = ta.ema(src, length)
 * e2 = ta.ema(e1, length)
 * dema = 2 * e1 - e2
 * plot(dema, "DEMA", color=#43A047)
 * ```
 */

import type { Bar } from '@deepentropy/oakscriptjs';
import { calculateDEMA } from './dema-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Double EMA',
  shortTitle: 'DEMA',
  overlay: true,
};

/**
 * Input definitions for the DEMA indicator
 */
export interface DEMAInputs {
  length: number;
  source: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
}

/**
 * Default input values
 */
export const defaultInputs: DEMAInputs = {
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
    id: 'dema',
    title: 'DEMA',
    color: '#43A047', // green
    lineWidth: 2,
  },
];

/**
 * Calculate DEMA indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<DEMAInputs> = {}) {
  // Merge inputs with defaults
  const { length, source } = { ...defaultInputs, ...inputs };

  // Calculate DEMA using the calculation module
  const demaData = calculateDEMA(bars, length, source);

  return {
    plots: {
      dema: demaData,
    },
  };
}
