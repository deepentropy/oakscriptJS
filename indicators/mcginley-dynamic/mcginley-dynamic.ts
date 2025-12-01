/**
 * McGinley Dynamic Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title="McGinley Dynamic", overlay=true, timeframe="", timeframe_gaps=true)
 * length = input.int(14, minval=1)
 * source = close
 * mg = 0.0
 * mg := na(mg[1]) ? ta.ema(source, length) : mg[1] + (source - mg[1]) / (length * math.pow(source/mg[1], 4))
 * plot(mg, "McGinley Dynamic")
 * ```
 */

import { indicator, type Bar } from '@deepentropy/oakscriptjs';
import { calculateMcGinleyDynamic } from './mcginley-dynamic-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'McGinley Dynamic',
  shortTitle: 'MGD',
  overlay: true,
};

/**
 * Input definitions for the McGinley Dynamic indicator
 */
export interface McGinleyDynamicInputs {
  length: number;
}

/**
 * Default input values
 */
export const defaultInputs: McGinleyDynamicInputs = {
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
    id: 'mg',
    title: 'McGinley Dynamic',
    color: '#26A69A', // teal
    lineWidth: 2,
  },
];

/**
 * Calculate McGinley Dynamic indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<McGinleyDynamicInputs> = {}) {
  // Merge inputs with defaults
  const { length } = { ...defaultInputs, ...inputs };

  // Calculate McGinley Dynamic using the calculation module
  const mgData = calculateMcGinleyDynamic(bars, length);

  return {
    plots: {
      mg: mgData,
    },
  };
}

/**
 * McGinley Dynamic Indicator using the new indicator() pattern
 * Provides automatic pane management based on overlay setting (price chart)
 * 
 * Note: The setup function is a placeholder for future implementation.
 * Currently, calculation is done via the calculate() function which is
 * used by the indicator registry. The indicator() pattern provides:
 * - Metadata with overlay setting for automatic pane placement
 * - getPaneIndex() for determining where to render the indicator
 * - isOverlay() for checking if indicator should be on price chart
 */
export const McGinleyDynamicIndicator = indicator({
  title: 'McGinley Dynamic',
  shortTitle: 'MGD',
  overlay: true,
}, (_ctx) => {
  // Calculation is handled by the calculate() function
  // This setup function will be enhanced when ctx.addLineSeries() is available
});
