/**
 * @fileoverview Built-in series for PineScript DSL
 * Provides close, open, high, low, volume, and derived series
 * @module runtime/builtins
 */

import { getContext } from './context';
import { Series } from './series';

/**
 * Close price series
 * Equivalent to PineScript's `close`
 */
export const close: Series = new Series(getContext(), (bar) => bar.close);

/**
 * Open price series
 * Equivalent to PineScript's `open`
 */
export const open: Series = new Series(getContext(), (bar) => bar.open);

/**
 * High price series
 * Equivalent to PineScript's `high`
 */
export const high: Series = new Series(getContext(), (bar) => bar.high);

/**
 * Low price series
 * Equivalent to PineScript's `low`
 */
export const low: Series = new Series(getContext(), (bar) => bar.low);

/**
 * Volume series
 * Equivalent to PineScript's `volume`
 */
export const volume: Series = new Series(getContext(), (bar) => bar.volume || 0);

/**
 * (high + low) / 2
 * Equivalent to PineScript's `hl2`
 */
export const hl2: Series = high.add(low).div(2);

/**
 * (high + low + close) / 3
 * Equivalent to PineScript's `hlc3`
 */
export const hlc3: Series = high.add(low).add(close).div(3);

/**
 * (open + high + low + close) / 4
 * Equivalent to PineScript's `ohlc4`
 */
export const ohlc4: Series = open.add(high).add(low).add(close).div(4);

/**
 * (high + low + close + close) / 4
 * Equivalent to PineScript's `hlcc4`
 */
export const hlcc4: Series = high.add(low).add(close).add(close).div(4);

/**
 * Time series (timestamp in milliseconds)
 * Equivalent to PineScript's `time`
 */
export const time: Series = new Series(getContext(), (bar) => {
  if (typeof bar.time === 'string') {
    return new Date(bar.time).getTime();
  }
  return bar.time as number;
});

/**
 * Bar index series (0, 1, 2, ...)
 * Equivalent to PineScript's `bar_index`
 */
export const bar_index: Series = new Series(getContext(), (_bar, i) => i);
