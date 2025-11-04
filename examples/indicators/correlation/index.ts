/**
 * Correlation Indicator using OakScriptJS
 *
 * Calculates the rolling Pearson correlation coefficient between two data series.
 */

import { createContext } from '../../../src/context';

export interface CorrelationOptions {
  primarySource?: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4';
  secondarySource?: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4';
  length: number;
}

export function calculateCorrelation(
  primaryData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  secondaryData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  options: CorrelationOptions
): { time: number; value: number | null }[] {
  // Create contexts for both data series
  const primaryContext = createContext({ data: primaryData });
  const secondaryContext = createContext({ data: secondaryData });

  // Get source data
  const primarySource = primaryContext.getSource(options.primarySource || 'close');
  const secondarySource = secondaryContext.getSource(options.secondarySource || 'close');

  // Ensure both series have the same length (use the shorter one)
  const minLength = Math.min(primarySource.length, secondarySource.length);
  const source1 = primarySource.slice(0, minLength);
  const source2 = secondarySource.slice(0, minLength);

  // Calculate correlation using OakScriptJS
  const correlationValues = primaryContext.ta.correlation(source1, source2, options.length);

  // Format output with timestamps from primary data
  return primaryContext.format(correlationValues, primaryData.slice(0, minLength).map(d => d.time));
}
