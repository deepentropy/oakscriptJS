/**
 * Least Squares Moving Average (LSMA) Indicator
 * 
 * Transpiled from PineScript:
 * ```pine
 * //@version=6
 * indicator(title = "Least Squares Moving Average", shorttitle="LSMA", overlay=true, timeframe="", timeframe_gaps=true)
 * length = input(title="Length", defval=25)
 * offset = input(title="Offset", defval=0)
 * src = input(close, title="Source")
 * lsma = ta.linreg(src, length, offset)
 * plot(lsma, "LSMA")
 * ```
 */

import type { Bar } from '@deepentropy/oakscriptjs';
import { calculateLSMA } from './lsma-calculation';

/**
 * Indicator metadata
 */
export const metadata = {
  title: 'Least Squares Moving Average',
  shortTitle: 'LSMA',
  overlay: true,
};

/**
 * Input definitions for the LSMA indicator
 */
export interface LSMAInputs {
  length: number;
  offset: number;
  source: 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';
}

/**
 * Default input values
 */
export const defaultInputs: LSMAInputs = {
  length: 25,
  offset: 0,
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
    defval: 25,
    min: 1,
    max: 500,
    step: 1,
  },
  {
    id: 'offset',
    type: 'int' as const,
    title: 'Offset',
    defval: 0,
    min: -500,
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
    id: 'lsma',
    title: 'LSMA',
    color: '#E91E63', // pink
    lineWidth: 2,
  },
];

/**
 * Calculate LSMA indicator
 * @param bars - OHLCV bar data
 * @param inputs - Indicator inputs
 * @returns Object containing plot data
 */
export function calculate(bars: Bar[], inputs: Partial<LSMAInputs> = {}) {
  // Merge inputs with defaults
  const { length, offset, source } = { ...defaultInputs, ...inputs };

  // Calculate LSMA using the calculation module
  const lsmaData = calculateLSMA(bars, length, offset, source);

  return {
    plots: {
      lsma: lsmaData,
    },
  };
}
