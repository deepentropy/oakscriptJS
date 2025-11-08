/**
 * @fileoverview input.* DSL functions for dynamic indicator parameters
 * @module dsl/input
 */

import { getContext } from '../runtime/context';
import type { InputRegistration } from '../runtime/context';

/**
 * Integer input parameter
 * @param defval - Default value
 * @param title - Display title
 * @param options - Additional options (minval, maxval, step, tooltip, etc.)
 * @returns The input value (from user options or default)
 *
 * @example
 * ```typescript
 * const length = input.int(14, "Length", { minval: 1, maxval: 500 });
 * ```
 */
export function int(
  defval: number,
  title: string,
  options?: {
    minval?: number;
    maxval?: number;
    step?: number;
    tooltip?: string;
    inline?: string;
    group?: string;
  }
): number {
  const inputName = title.toLowerCase().replace(/\s+/g, '_');

  const registration: InputRegistration = {
    type: 'int',
    name: inputName,
    title,
    defval,
    minval: options?.minval,
    maxval: options?.maxval,
    step: options?.step ?? 1,
    tooltip: options?.tooltip,
    inline: options?.inline,
    group: options?.group,
  };

  getContext().registerInput(inputName, registration);

  // Return user value if set, otherwise default
  const value = getContext().getInputValue(inputName);
  return value !== undefined ? value : defval;
}

/**
 * Float input parameter
 * @param defval - Default value
 * @param title - Display title
 * @param options - Additional options (minval, maxval, step, tooltip, etc.)
 * @returns The input value (from user options or default)
 *
 * @example
 * ```typescript
 * const multiplier = input.float(2.0, "Multiplier", { minval: 0.1, maxval: 10.0, step: 0.1 });
 * ```
 */
export function float(
  defval: number,
  title: string,
  options?: {
    minval?: number;
    maxval?: number;
    step?: number;
    tooltip?: string;
    inline?: string;
    group?: string;
  }
): number {
  const inputName = title.toLowerCase().replace(/\s+/g, '_');

  const registration: InputRegistration = {
    type: 'float',
    name: inputName,
    title,
    defval,
    minval: options?.minval,
    maxval: options?.maxval,
    step: options?.step ?? 0.1,
    tooltip: options?.tooltip,
    inline: options?.inline,
    group: options?.group,
  };

  getContext().registerInput(inputName, registration);

  const value = getContext().getInputValue(inputName);
  return value !== undefined ? value : defval;
}

/**
 * Boolean input parameter
 * @param defval - Default value
 * @param title - Display title
 * @param options - Additional options (tooltip, inline, group)
 * @returns The input value (from user options or default)
 *
 * @example
 * ```typescript
 * const showSignals = input.bool(true, "Show Signals");
 * ```
 */
export function bool(
  defval: boolean,
  title: string,
  options?: {
    tooltip?: string;
    inline?: string;
    group?: string;
  }
): boolean {
  const inputName = title.toLowerCase().replace(/\s+/g, '_');

  const registration: InputRegistration = {
    type: 'bool',
    name: inputName,
    title,
    defval,
    tooltip: options?.tooltip,
    inline: options?.inline,
    group: options?.group,
  };

  getContext().registerInput(inputName, registration);

  const value = getContext().getInputValue(inputName);
  return value !== undefined ? value : defval;
}

/**
 * String input parameter
 * @param defval - Default value
 * @param title - Display title
 * @param options - Additional options (tooltip, inline, group, options for dropdown)
 * @returns The input value (from user options or default)
 *
 * @example
 * ```typescript
 * const maType = input.string("SMA", "MA Type", {
 *   options: ["SMA", "EMA", "WMA"]
 * });
 * ```
 */
export function string(
  defval: string,
  title: string,
  options?: {
    tooltip?: string;
    inline?: string;
    group?: string;
    options?: string[];  // Dropdown options
  }
): string {
  const inputName = title.toLowerCase().replace(/\s+/g, '_');

  const registration: InputRegistration = {
    type: 'string',
    name: inputName,
    title,
    defval,
    tooltip: options?.tooltip,
    inline: options?.inline,
    group: options?.group,
    options: options?.options,
  };

  getContext().registerInput(inputName, registration);

  const value = getContext().getInputValue(inputName);
  return value !== undefined ? value : defval;
}

/**
 * Source input parameter (for series selection)
 * @param defval - Default source series
 * @param title - Display title
 * @param options - Additional options (tooltip, inline, group)
 * @returns The input value (from user options or default)
 *
 * @example
 * ```typescript
 * const src = input.source(close, "Source");
 * ```
 */
export function source(
  defval: any,
  title: string,
  options?: {
    tooltip?: string;
    inline?: string;
    group?: string;
  }
): any {
  const inputName = title.toLowerCase().replace(/\s+/g, '_');

  const registration: InputRegistration = {
    type: 'source',
    name: inputName,
    title,
    defval,
    tooltip: options?.tooltip,
    inline: options?.inline,
    group: options?.group,
  };

  getContext().registerInput(inputName, registration);

  const value = getContext().getInputValue(inputName);
  return value !== undefined ? value : defval;
}

/**
 * Input namespace for PineScript DSL
 * Provides input.int(), input.float(), input.bool(), input.string(), input.source()
 */
export const input = {
  int,
  float,
  bool,
  string,
  source,
};
