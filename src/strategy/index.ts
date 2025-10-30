/**
 * Strategy namespace
 * Mirrors PineScript's strategy.* functions
 *
 * TODO: Implement strategy backtesting functions
 */

import { StrategyEntry, StrategyExit, simple_string, simple_float } from '../types';

/**
 * Strategy entry (long)
 * @param id - Entry ID
 * @param qty - Quantity
 */
export function entry_long(id: simple_string, qty?: simple_float): StrategyEntry {
  return {
    id,
    direction: 'long',
    qty,
  };
}

/**
 * Strategy entry (short)
 * @param id - Entry ID
 * @param qty - Quantity
 */
export function entry_short(id: simple_string, qty?: simple_float): StrategyEntry {
  return {
    id,
    direction: 'short',
    qty,
  };
}

/**
 * Strategy exit
 * @param id - Exit ID
 * @param from_entry - Entry ID to exit from
 */
export function exit(id: simple_string, from_entry?: simple_string): StrategyExit {
  return {
    id,
    from_entry,
  };
}

// TODO: Add more strategy functions
// - close()
// - close_all()
// - cancel()
// - cancel_all()
// - position_size
// - position_avg_price
// - etc.
