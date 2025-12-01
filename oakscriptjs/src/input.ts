/**
 * @fileoverview Input helper functions for indicator parameters
 * These functions create input definitions that can be used with the indicator system.
 * @module input
 */

/**
 * Input value with its configuration
 */
export interface InputValue<T> {
  /** Input type identifier */
  type: 'int' | 'float' | 'source' | 'bool' | 'string';
  /** Default value */
  defaultValue: T;
  /** Current value (initially equals defaultValue) */
  value: T;
  /** Display title */
  title?: string;
  /** Minimum value (for numeric inputs) */
  min?: number;
  /** Maximum value (for numeric inputs) */
  max?: number;
  /** Step size (for numeric inputs) */
  step?: number;
  /** Available options (for source/string types) */
  options?: string[];
}

/**
 * Options for integer input
 */
export interface IntInputOptions {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step size */
  step?: number;
  /** Display title */
  title?: string;
}

/**
 * Options for float input
 */
export interface FloatInputOptions {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step size */
  step?: number;
  /** Display title */
  title?: string;
}

/**
 * Options for source input
 */
export interface SourceInputOptions {
  /** Display title */
  title?: string;
}

/**
 * Options for boolean input
 */
export interface BoolInputOptions {
  /** Display title */
  title?: string;
}

/**
 * Options for string input
 */
export interface StringInputOptions {
  /** Display title */
  title?: string;
  /** Available options for dropdown */
  options?: string[];
}

/**
 * Source type for price data
 */
export type SourceType = 'open' | 'high' | 'low' | 'close' | 'hl2' | 'hlc3' | 'ohlc4';

/**
 * Input helper functions for creating indicator parameters
 */
export const input = {
  /**
   * Create an integer input parameter
   * @param defaultValue - Default value for the input
   * @param options - Additional options (min, max, step, title)
   * @returns Input value object
   * 
   * @example
   * ```typescript
   * const length = input.int(14, { min: 1, max: 500, title: 'Length' });
   * console.log(length.value); // 14
   * ```
   */
  int(defaultValue: number, options: IntInputOptions = {}): InputValue<number> {
    return {
      type: 'int' as const,
      defaultValue,
      value: defaultValue,
      title: options.title,
      min: options.min,
      max: options.max,
      step: options.step ?? 1,
    };
  },

  /**
   * Create a float input parameter
   * @param defaultValue - Default value for the input
   * @param options - Additional options (min, max, step, title)
   * @returns Input value object
   * 
   * @example
   * ```typescript
   * const multiplier = input.float(2.5, { min: 0.1, max: 10, step: 0.1, title: 'Multiplier' });
   * console.log(multiplier.value); // 2.5
   * ```
   */
  float(defaultValue: number, options: FloatInputOptions = {}): InputValue<number> {
    return {
      type: 'float' as const,
      defaultValue,
      value: defaultValue,
      title: options.title,
      min: options.min,
      max: options.max,
      step: options.step ?? 0.1,
    };
  },

  /**
   * Create a source input parameter (for selecting price data type)
   * @param defaultValue - Default source type (default: 'close')
   * @param options - Additional options (title)
   * @returns Input value object
   * 
   * @example
   * ```typescript
   * const src = input.source('close', { title: 'Source' });
   * console.log(src.value); // 'close'
   * ```
   */
  source(defaultValue: SourceType = 'close', options: SourceInputOptions = {}): InputValue<SourceType> {
    return {
      type: 'source' as const,
      defaultValue,
      value: defaultValue,
      title: options.title,
      options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4'],
    };
  },

  /**
   * Create a boolean input parameter
   * @param defaultValue - Default value for the input
   * @param options - Additional options (title)
   * @returns Input value object
   * 
   * @example
   * ```typescript
   * const showSignal = input.bool(true, { title: 'Show Signal' });
   * console.log(showSignal.value); // true
   * ```
   */
  bool(defaultValue: boolean, options: BoolInputOptions = {}): InputValue<boolean> {
    return {
      type: 'bool' as const,
      defaultValue,
      value: defaultValue,
      title: options.title,
    };
  },

  /**
   * Create a string input parameter
   * @param defaultValue - Default value for the input
   * @param options - Additional options (title, options for dropdown)
   * @returns Input value object
   * 
   * @example
   * ```typescript
   * const maType = input.string('SMA', { title: 'MA Type', options: ['SMA', 'EMA', 'WMA'] });
   * console.log(maType.value); // 'SMA'
   * ```
   */
  string(defaultValue: string, options: StringInputOptions = {}): InputValue<string> {
    return {
      type: 'string' as const,
      defaultValue,
      value: defaultValue,
      title: options.title,
      options: options.options,
    };
  },
};
