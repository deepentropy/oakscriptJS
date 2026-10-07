/**
 * @fileoverview PineScript `active` of an input: whether the settings dialog lets the user edit it
 * @module runtime/input-active
 */

import type { InputConfig, InputCondition } from './types.js';

/** Current value of an input: the host value, else the default of its config. */
function inputValue(id: string, inputs: Record<string, unknown>, configs?: readonly InputConfig[]): unknown {
  const value = inputs[id];
  if (value !== undefined) return value;
  return configs?.find((c) => c.id === id)?.defval;
}

function holds(condition: InputCondition, inputs: Record<string, unknown>, configs?: readonly InputConfig[]): boolean {
  if (typeof condition === 'string') return inputValue(condition, inputs, configs) === true;
  if ('not' in condition) return !holds(condition.not, inputs, configs);
  if ('any' in condition) return condition.any.some((c) => holds(c, inputs, configs));
  if ('all' in condition) return condition.all.every((c) => holds(c, inputs, configs));
  const value = inputValue(condition.input, inputs, configs);
  if (!('eq' in condition) && !('ne' in condition)) return value === true;
  return (!('eq' in condition) || value === condition.eq) && (!('ne' in condition) || value !== condition.ne);
}

/**
 * Whether an input is active (PineScript `active`): an inactive input is shown greyed out in the settings and
 * cannot be edited. It still gives its value to the script.
 *
 * @param config - The input
 * @param inputs - Current input values by id
 * @param configs - All the inputs of the indicator: gives the default of an input that has no value in `inputs`
 * @returns true when `config.active` is not set, is true, or is a condition that holds
 *
 * @example
 * ```typescript
 * const configs: InputConfig[] = [
 *   { id: 'showMa1', type: 'bool', defval: true, title: 'MA #1' },
 *   { id: 'ma1Length', type: 'int', defval: 20, active: 'showMa1' },
 *   { id: 'bbMult', type: 'float', defval: 2, active: { input: 'maType', eq: 'SMA + Bollinger Bands' } },
 * ];
 * isInputActive(configs[1], { showMa1: false }) // false
 * isInputActive(configs[1], {}, configs) // true: the default of showMa1
 * ```
 */
export function isInputActive(config: InputConfig, inputs: Record<string, unknown> = {}, configs?: readonly InputConfig[]): boolean {
  const { active } = config;
  if (active === undefined) return true;
  if (typeof active === 'boolean') return active;
  return holds(active, inputs, configs);
}
