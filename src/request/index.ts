/**
 * Request namespace
 * Mirrors PineScript's request.* functions for external data
 *
 * TODO: Implement data request functions
 * Note: This will require a data provider interface
 */

import { series_float, simple_string } from '../types';

/**
 * Requests data from another symbol/timeframe
 * @param symbol - Symbol to request
 * @param timeframe - Timeframe
 * @param expression - Expression to evaluate
 */
export function security(
  symbol: simple_string,
  timeframe: simple_string,
  expression: any
): series_float {
  // TODO: Implement security function
  // This requires integration with a data provider
  throw new Error('request.security not yet implemented');
}

// TODO: Add more request functions
// - financial()
// - dividends()
// - splits()
// - earnings()
// - etc.
