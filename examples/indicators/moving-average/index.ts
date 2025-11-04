/**
 * Moving Average Indicator using OakScriptJS (Simplified Version)
 */

import { createContext } from '../../../src/context';
import { shift, smooth } from '../../../src/utils';

export interface MovingAverageOptions {
  source?: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4';
  length: number;
  offset?: number;
  type?: 'SMA' | 'EMA' | 'WMA';
  smoothingType?: 'SMA' | 'EMA' | 'WMA' | 'RMA';
  smoothingLength?: number;
}

export function calculateMovingAverage(
  data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  options: MovingAverageOptions
): { time: number; value: number | null }[] {
  // Create context with raw data array (automatic conversion)
  const { ta, getSource, format } = createContext({ data });

  // Get source using helper (no manual mapping needed)
  const source = getSource(options.source || 'close');

  // Calculate MA dynamically
  const maType = (options.type || 'SMA').toLowerCase() as 'sma' | 'ema' | 'wma';
  let maValues = ta[maType](source, options.length);

  // Apply smoothing if specified
  if (options.smoothingType && options.smoothingLength && options.smoothingLength > 1) {
    maValues = smooth(maValues, options.smoothingType, options.smoothingLength);
  }

  // Apply offset if specified
  if (options.offset) {
    maValues = shift(maValues, options.offset);
  }

  // Format output with timestamps
  return format(maValues);
}
