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

import { indicator, type Bar } from '@deepentropy/oakscriptjs';
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

/**
 * Average Day Range Indicator using the new indicator() pattern
 * Provides automatic pane management based on overlay setting (separate pane)
 * 
 * Note: The setup function is a placeholder for future implementation.
 * Currently, calculation is done via the calculate() function which is
 * used by the indicator registry. The indicator() pattern provides:
 * - Metadata with overlay setting for automatic pane placement
 * - getPaneIndex() for determining where to render the indicator
 * - isOverlay() for checking if indicator should be on price chart
 */
export const ADRIndicator = indicator({
  title: 'Average Day Range',
  shortTitle: 'ADR',
  overlay: false,
}, (_ctx) => {
  // Calculation is handled by the calculate() function
  // This setup function will be enhanced when ctx.addLineSeries() is available
});
