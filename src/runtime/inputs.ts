/**
 * @fileoverview Idempotent input registration functions
 * These functions mirror PineScript's input functions with idempotent semantics:
 * - First call registers the input with default value
 * - Subsequent calls return the current stored value (possibly user-updated)
 * @module runtime/inputs
 */

import type { InputConfig, InputOptions } from './types';
import { getContext, recalculate } from './runtime';

// Track registered inputs for idempotent registration
const registeredInputs = new Map<string, boolean>();

// Track if we should auto-recalculate on input change
let autoRecalculateEnabled = false;

/**
 * Enable automatic recalculation when inputs change
 */
export function enableAutoRecalculate(): void {
  autoRecalculateEnabled = true;
}

/**
 * Disable automatic recalculation
 */
export function disableAutoRecalculate(): void {
  autoRecalculateEnabled = false;
}

/**
 * Reset registered inputs (for testing or context changes)
 * @internal
 */
export function resetInputs(): void {
  registeredInputs.clear();
}

/**
 * Generate a unique input ID from title or default
 * @param title - Optional title
 * @param defval - Default value for fallback
 * @param type - Input type
 * @returns Unique input ID
 */
function generateInputId(title: string | undefined, defval: unknown, type: string): string {
  if (title) {
    return title.replace(/\s+/g, '_');
  }
  return `${type}_${String(defval)}`;
}

/**
 * Register an integer input
 * First call registers with defval, subsequent calls return current value
 * @param defval - Default value
 * @param title - Display title (optional)
 * @param options - Additional options: min, max, step (optional)
 * @returns Current integer value
 */
export function input_int(defval: number, title?: string, options?: InputOptions): number {
  const context = getContext();
  if (!context) {
    // No context - return default value
    return Math.floor(defval);
  }

  const id = generateInputId(title, defval, 'int');
  const config: InputConfig = {
    id,
    type: 'int',
    defval: Math.floor(defval),
    title,
    min: options?.min,
    max: options?.max,
    step: options?.step ?? 1,
  };

  // Check if already registered (idempotent)
  if (!registeredInputs.has(id)) {
    // First call - register the input
    context.inputs.registerInput(config);
    registeredInputs.set(id, true);

    // Set up auto-recalculate on change if not already done
    if (autoRecalculateEnabled) {
      context.inputs.onInputChange((changedId) => {
        if (changedId === id) {
          recalculate();
        }
      });
    }
  }

  // Return current value (may have been updated by user)
  const value = context.inputs.getValue(id);
  return typeof value === 'number' ? Math.floor(value) : Math.floor(defval);
}

/**
 * Register a float input
 * First call registers with defval, subsequent calls return current value
 * @param defval - Default value
 * @param title - Display title (optional)
 * @param options - Additional options: min, max, step (optional)
 * @returns Current float value
 */
export function input_float(defval: number, title?: string, options?: InputOptions): number {
  const context = getContext();
  if (!context) {
    // No context - return default value
    return defval;
  }

  const id = generateInputId(title, defval, 'float');
  const config: InputConfig = {
    id,
    type: 'float',
    defval,
    title,
    min: options?.min,
    max: options?.max,
    step: options?.step ?? 0.1,
  };

  // Check if already registered (idempotent)
  if (!registeredInputs.has(id)) {
    context.inputs.registerInput(config);
    registeredInputs.set(id, true);

    if (autoRecalculateEnabled) {
      context.inputs.onInputChange((changedId) => {
        if (changedId === id) {
          recalculate();
        }
      });
    }
  }

  const value = context.inputs.getValue(id);
  return typeof value === 'number' ? value : defval;
}

/**
 * Register a boolean input
 * First call registers with defval, subsequent calls return current value
 * @param defval - Default value
 * @param title - Display title (optional)
 * @returns Current boolean value
 */
export function input_bool(defval: boolean, title?: string): boolean {
  const context = getContext();
  if (!context) {
    return defval;
  }

  const id = generateInputId(title, defval, 'bool');
  const config: InputConfig = {
    id,
    type: 'bool',
    defval,
    title,
  };

  if (!registeredInputs.has(id)) {
    context.inputs.registerInput(config);
    registeredInputs.set(id, true);

    if (autoRecalculateEnabled) {
      context.inputs.onInputChange((changedId) => {
        if (changedId === id) {
          recalculate();
        }
      });
    }
  }

  const value = context.inputs.getValue(id);
  return typeof value === 'boolean' ? value : defval;
}

/**
 * Register a string input
 * First call registers with defval, subsequent calls return current value
 * @param defval - Default value
 * @param title - Display title (optional)
 * @param options - Array of string options for dropdown (optional)
 * @returns Current string value
 */
export function input_string(defval: string, title?: string, options?: string[]): string {
  const context = getContext();
  if (!context) {
    return defval;
  }

  const id = generateInputId(title, defval, 'string');
  const config: InputConfig = {
    id,
    type: 'string',
    defval,
    title,
    options,
  };

  if (!registeredInputs.has(id)) {
    context.inputs.registerInput(config);
    registeredInputs.set(id, true);

    if (autoRecalculateEnabled) {
      context.inputs.onInputChange((changedId) => {
        if (changedId === id) {
          recalculate();
        }
      });
    }
  }

  const value = context.inputs.getValue(id);
  return typeof value === 'string' ? value : defval;
}

/**
 * Register a source input (returns a data series from OHLCV)
 * First call registers with defval, subsequent calls return current value
 * @param defval - Default source name ('close', 'open', 'high', 'low', 'volume', 'hl2', 'hlc3', 'ohlc4')
 * @param title - Display title (optional)
 * @returns Array of values for the selected source
 */
export function input_source(defval: string, title?: string): number[] {
  const context = getContext();
  if (!context) {
    return [];
  }

  const id = generateInputId(title, defval, 'source');
  const config: InputConfig = {
    id,
    type: 'source',
    defval,
    title,
    options: ['open', 'high', 'low', 'close', 'volume', 'hl2', 'hlc3', 'ohlc4'],
  };

  if (!registeredInputs.has(id)) {
    context.inputs.registerInput(config);
    registeredInputs.set(id, true);

    if (autoRecalculateEnabled) {
      context.inputs.onInputChange((changedId) => {
        if (changedId === id) {
          recalculate();
        }
      });
    }
  }

  const sourceName = (context.inputs.getValue(id) as string) ?? defval;
  
  return getSourceData(context.ohlcv, sourceName);
}

/**
 * Get data array for a source name
 * @param ohlcv - OHLCV data
 * @param sourceName - Source name
 * @returns Array of values
 */
function getSourceData(
  ohlcv: { open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] },
  sourceName: string
): number[] {
  switch (sourceName) {
    case 'open':
      return ohlcv.open;
    case 'high':
      return ohlcv.high;
    case 'low':
      return ohlcv.low;
    case 'close':
      return ohlcv.close;
    case 'volume':
      return ohlcv.volume;
    case 'hl2':
      return ohlcv.high.map((h, i) => (h + ohlcv.low[i]!) / 2);
    case 'hlc3':
      return ohlcv.high.map((h, i) => (h + ohlcv.low[i]! + ohlcv.close[i]!) / 3);
    case 'ohlc4':
      return ohlcv.open.map((o, i) => (o + ohlcv.high[i]! + ohlcv.low[i]! + ohlcv.close[i]!) / 4);
    default:
      return ohlcv.close;
  }
}
