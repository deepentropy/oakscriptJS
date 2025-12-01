/**
 * Momentum (MOM) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="Momentum", shorttitle="Mom", timeframe="", timeframe_gaps=true)
 * len = input.int(10, minval=1, title="Length")
 * src = input(close, title="Source")
 * mom = src - src[len]
 * plot(mom, color=#2962FF, title="MOM")
 * ```
 */

import { indicator, type Bar } from '@deepentropy/oakscriptjs';
import { calculateMomentum } from './momentum-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Momentum',
  shortTitle: 'MOM',
  overlay: false,
};

/**
 * Input definitions for the Momentum indicator
 */
export interface MomentumInputs {
  length: number;
  source: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
}

/**
 * Default input values
 */
export const defaultInputs: MomentumInputs = {
  length: 10,
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
    defval: 10,
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
    id: 'mom',
    title: 'MOM',
    color: '#2962FF', // blue
    lineWidth: 2,
  },
];

/**
 * Calculate Momentum indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<MomentumInputs> = {}) {
  // Merge inputs with defaults
  const { length, source } = { ...defaultInputs, ...inputs };

  // Calculate Momentum using the calculation module
  const momData = calculateMomentum(bars, length, source);

  return {
    plots: {
      mom: momData,
    },
  };
}

/**
 * Momentum Indicator using the new indicator() pattern
 * Provides automatic pane management based on overlay setting (separate pane)
 * 
 * Note: The setup function is a placeholder for future implementation.
 * Currently, calculation is done via the calculate() function which is
 * used by the indicator registry. The indicator() pattern provides:
 * - Metadata with overlay setting for automatic pane placement
 * - getPaneIndex() for determining where to render the indicator
 * - isOverlay() for checking if indicator should be on price chart
 */
export const MomentumIndicator = indicator({
  title: 'Momentum',
  shortTitle: 'MOM',
  overlay: false,
}, (_ctx) => {
  // Calculation is handled by the calculate() function
  // This setup function will be enhanced when ctx.addLineSeries() is available
});
