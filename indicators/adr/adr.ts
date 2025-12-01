/**
 * Average Day Range (ADR) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator("Average Day Range", shorttitle="ADR", timeframe="", timeframe_gaps=true)
 * lengthInput = input.int(14, title="Length")
 * adr = ta.sma(high - low, lengthInput)
 * plot(adr, title="ADR")
 * ```
 */

import type { Bar } from '@deepentropy/oakscriptjs';
import { calculateADR } from './adr-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Average Day Range',
  shortTitle: 'ADR',
  overlay: false,
};

/**
 * Input definitions for the ADR indicator
 */
export interface ADRInputs {
  length: number;
}

/**
 * Default input values
 */
export const defaultInputs: ADRInputs = {
  length: 14,
};

/**
 * Input configuration for UI generation
 */
export const inputConfig = [
  {
    id: 'length',
    type: 'int' as const,
    title: 'Length',
    defval: 14,
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
    id: 'adr',
    title: 'ADR',
    color: '#7E57C2', // purple
    lineWidth: 2,
  },
];

/**
 * Calculate ADR indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<ADRInputs> = {}) {
  // Merge inputs with defaults
  const { length } = { ...defaultInputs, ...inputs };

  // Calculate ADR using the calculation module
  const adrData = calculateADR(bars, length);

  return {
    plots: {
      adr: adrData,
    },
  };
}
