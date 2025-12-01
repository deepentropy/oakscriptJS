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

import { indicator, type Bar } from '@deepentropy/oakscriptjs';
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

/**
 * Balance of Power Indicator using the new indicator() pattern
 * Provides automatic pane management based on overlay setting (separate pane)
 * 
 * Note: The setup function is a placeholder for future implementation.
 * Currently, calculation is done via the calculate() function which is
 * used by the indicator registry. The indicator() pattern provides:
 * - Metadata with overlay setting for automatic pane placement
 * - getPaneIndex() for determining where to render the indicator
 * - isOverlay() for checking if indicator should be on price chart
 */
export const BOPIndicator = indicator({
  title: 'Balance of Power',
  shortTitle: 'BOP',
  overlay: false,
  format: 'price',
  precision: 2,
}, (_ctx) => {
  // Calculation is handled by the calculate() function
  // This setup function will be enhanced when ctx.addLineSeries() is available
});
