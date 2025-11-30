/**
 * @fileoverview Simple in-memory input adapter for demos and testing
 * Stores input values in memory and provides change notification
 * @module runtime/adapters/SimpleInputAdapter
 */

import type { InputAdapter, InputConfig } from '../types';

/**
 * Simple in-memory input adapter
 * Stores input configurations and values in memory
 * Useful for demos, testing, and simple applications
 */
export class SimpleInputAdapter implements InputAdapter {
  private inputs: Map<string, { config: InputConfig; value: unknown }> = new Map();
  private changeCallbacks: Array<(id: string, value: unknown) => void> = [];

  /**
   * Register an input configuration
   * If already registered, returns current value without modifying config
   * @param config - Input configuration
   * @returns Current value (defval on first registration)
   */
  registerInput(config: InputConfig): unknown {
    if (!this.inputs.has(config.id)) {
      this.inputs.set(config.id, { config, value: config.defval });
    }
    return this.inputs.get(config.id)!.value;
  }

  /**
   * Get current value of an input
   * @param id - Input identifier
   * @returns Current value or undefined if not registered
   */
  getValue(id: string): unknown {
    return this.inputs.get(id)?.value;
  }

  /**
   * Set value of an input with validation
   * Validates against config constraints (min/max/step for numerics, options for strings)
   * @param id - Input identifier
   * @param value - New value
   */
  setValue(id: string, value: unknown): void {
    const input = this.inputs.get(id);
    if (!input) {
      return;
    }

    const { config } = input;
    let validatedValue = value;

    // Validate numeric inputs
    if ((config.type === 'int' || config.type === 'float') && typeof value === 'number') {
      // Apply min constraint
      if (config.min !== undefined && value < config.min) {
        validatedValue = config.min;
      }
      // Apply max constraint
      if (config.max !== undefined && value > config.max) {
        validatedValue = config.max;
      }
      // Round to step for int type
      if (config.type === 'int') {
        validatedValue = Math.floor(validatedValue as number);
      }
    }

    // Validate string inputs with options
    if (config.type === 'string' && config.options && typeof value === 'string') {
      if (!config.options.includes(value)) {
        // Keep current value if invalid option
        return;
      }
    }

    // Validate source inputs
    if (config.type === 'source' && config.options && typeof value === 'string') {
      if (!config.options.includes(value)) {
        return;
      }
    }

    // Update value
    input.value = validatedValue;

    // Notify callbacks
    this.changeCallbacks.forEach(cb => cb(id, validatedValue));
  }

  /**
   * Register a callback for input value changes
   * @param callback - Function to call when any input value changes
   */
  onInputChange(callback: (id: string, value: unknown) => void): void {
    this.changeCallbacks.push(callback);
  }

  /**
   * Get all registered inputs (for UI rendering)
   * @returns Map of input IDs to their configs and values
   */
  getAllInputs(): Map<string, { config: InputConfig; value: unknown }> {
    return new Map(this.inputs);
  }

  /**
   * Clear all registered inputs
   * Useful for testing or resetting state
   */
  clear(): void {
    this.inputs.clear();
    this.changeCallbacks = [];
  }

  /**
   * Remove a specific change callback
   * @param callback - The callback to remove
   */
  removeChangeCallback(callback: (id: string, value: unknown) => void): void {
    const index = this.changeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.changeCallbacks.splice(index, 1);
    }
  }
}
