/**
 * Balance of Power (BOP) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="Balance of Power", format=format.price, precision=2, timeframe="", timeframe_gaps=true)
 * plot((close - open) / (high - low), color=color.red)
 * ```
 */

import type { Bar } from '@deepentropy/oakscriptjs';
import { calculateBOP } from './bop-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Balance of Power',
  shortTitle: 'BOP',
  overlay: false,
};

/**
 * Input definitions for the BOP indicator
 */
export interface BOPInputs {
  // BOP has no configurable inputs
}

/**
 * Default input values
 */
export const defaultInputs: BOPInputs = {};

/**
 * Input configuration for UI generation
 */
export const inputConfig: Array<{
  id: string;
  type: 'int' | 'float' | 'bool' | 'source' | 'string';
  title: string;
  defval: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}> = [];

/**
 * Plot configuration
 */
export const plotConfig = [
  {
    id: 'bop',
    title: 'BOP',
    color: '#F23645', // red
    lineWidth: 2,
  },
];

/**
 * Calculate Balance of Power indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs (unused for BOP)
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], _inputs: Partial<BOPInputs> = {}) {
  // Calculate BOP using the calculation module
  const bopData = calculateBOP(bars);

  return {
    plots: {
      bop: bopData,
    },
  };
}
