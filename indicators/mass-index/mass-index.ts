/**
 * Mass Index Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="Mass Index", format=format.price, precision=2, timeframe="", timeframe_gaps=true)
 * length = input.int(10, minval=1)
 * span = high - low
 * mi = math.sum(ta.ema(span, 9) / ta.ema(ta.ema(span, 9), 9), length)
 * plot(mi, "Mass Index")
 * ```
 */

import type { Bar } from '@deepentropy/oakscriptjs';
import { calculateMassIndex } from './mass-index-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Mass Index',
  shortTitle: 'MI',
  overlay: false,
};

/**
 * Input definitions for the Mass Index indicator
 */
export interface MassIndexInputs {
  length: number;
}

/**
 * Default input values
 */
export const defaultInputs: MassIndexInputs = {
  length: 10,
};

/**
 * Input configuration for UI generation
 */
export const inputConfig = [
  {
    id: 'length',
    type: 'int' as const,
    title: 'Length',
    defval: 10,
    min: 1,
    max: 500,
    step: 1,
  },
];

/**
 * Plot configuration
 */
export const plotConfig = [
  {
    id: 'mi',
    title: 'Mass Index',
    color: '#FF6D00', // orange
    lineWidth: 2,
  },
];

/**
 * Calculate Mass Index indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<MassIndexInputs> = {}) {
  // Merge inputs with defaults
  const { length } = { ...defaultInputs, ...inputs };

  // Calculate Mass Index using the calculation module
  const miData = calculateMassIndex(bars, length);

  return {
    plots: {
      mi: miData,
    },
  };
}
