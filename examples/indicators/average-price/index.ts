/**
 * Average Price Indicator using OakScriptJS
 *
 * Calculates the average price as (Open + High + Low + Close) / 4
 * with optional offset.
 */

import { createContext } from '../../../src/context';
import { shift } from '../../../src/utils';

export interface AveragePriceOptions {
  offset?: number;
}

export function calculateAveragePrice(
  data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  options: AveragePriceOptions = {}
): { time: number; value: number | null }[] {
  // Create context with raw data array
  const { getSource, format } = createContext({ data });

  // Get OHLC4 source (average of open, high, low, close)
  const avgPrice = getSource('ohlc4');

  // Apply offset if specified
  let result = avgPrice;
  if (options.offset) {
    result = shift(result, options.offset);
  }

  // Format output with timestamps
  return format(result);
}
