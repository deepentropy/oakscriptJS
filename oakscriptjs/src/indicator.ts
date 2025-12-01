/**
 * @fileoverview Indicator function for creating reusable technical indicators
 * This module provides the `indicator()` function that handles pane management
 * automatically based on the overlay metadata.
 * @module indicator
 */

import type { Bar } from './types';

/**
 * Indicator metadata that defines how the indicator should be displayed
 */
export interface IndicatorMetadataConfig {
  /** Full title of the indicator */
  title: string;
  /** Short title (for compact display) */
  shortTitle?: string;
  /** If true, overlay on price chart; if false, create separate pane (default: false) */
  overlay?: boolean;
  /** Number format for values */
  format?: 'price' | 'percent' | 'volume';
  /** Decimal precision for displayed values */
  precision?: number;
}

/**
 * Input definition for indicator parameters
 */
export interface InputDefinition {
  /** Unique identifier for the input */
  name: string;
  /** Input type */
  type: 'int' | 'float' | 'source' | 'bool' | 'string';
  /** Display title */
  title: string;
  /** Default value */
  defaultValue: number | string | boolean;
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
 * Context provided to indicator setup/compute functions
 */
export interface IndicatorContext {
  /** Bar data for calculation */
  data: Bar[];
  /** Open prices array */
  open: number[];
  /** High prices array */
  high: number[];
  /** Low prices array */
  low: number[];
  /** Close prices array */
  close: number[];
  /** Volume array */
  volume: number[];
  /** Time values array */
  time: number[];
  /** Pane index (0 for overlay, higher for separate panes) */
  paneIndex: number;
}

/**
 * Instance of a created indicator
 */
export interface IndicatorInstance {
  /** Indicator metadata */
  readonly metadata: IndicatorMetadataConfig;
  /** Get the pane index for this indicator */
  getPaneIndex(): number;
  /** Check if this is an overlay indicator */
  isOverlay(): boolean;
  /** Get input definitions */
  getInputs(): InputDefinition[];
  /** Update input values */
  updateInputs(inputs: Record<string, number | string | boolean>): void;
  /** Get current input values */
  getInputValues(): Record<string, number | string | boolean>;
  /** Calculate indicator with given bar data */
  calculate(data: Bar[]): void;
}

/**
 * Indicator class constructor type
 */
export interface IndicatorConstructor {
  new (): IndicatorInstance;
}

/**
 * Creates an indicator class that handles pane management automatically.
 * 
 * When `overlay: false` (default), the indicator will be displayed in a separate pane.
 * When `overlay: true`, the indicator will be overlaid on the main price chart.
 * 
 * @param metadata - Indicator metadata (title, overlay setting, etc.)
 * @param setup - Setup function that receives the indicator context and defines calculations
 * @returns A class constructor for creating indicator instances
 * 
 * @example
 * ```typescript
 * const SMAIndicator = indicator({
 *   title: 'Simple Moving Average',
 *   shortTitle: 'SMA',
 *   overlay: true, // Display on price chart
 * }, (ctx) => {
 *   const length = 9;
 *   const sma = ta.sma(ctx.close, length);
 *   // Plot or return data...
 * });
 * 
 * const instance = new SMAIndicator();
 * instance.calculate(barData);
 * ```
 */
export function indicator(
  metadata: IndicatorMetadataConfig,
  setup: (ctx: IndicatorContext) => void
): IndicatorConstructor {
  // Normalize metadata with defaults
  const normalizedMetadata: IndicatorMetadataConfig = {
    title: metadata.title,
    shortTitle: metadata.shortTitle ?? metadata.title,
    overlay: metadata.overlay ?? false, // Default to separate pane
    format: metadata.format ?? 'price',
    precision: metadata.precision ?? 2,
  };

  return class implements IndicatorInstance {
    readonly metadata = normalizedMetadata;
    private inputDefinitions: InputDefinition[] = [];
    private inputValues: Record<string, number | string | boolean> = {};
    private paneIndex: number = 0;

    constructor() {
      // Calculate initial pane index based on overlay setting
      this.paneIndex = normalizedMetadata.overlay ? 0 : 1;
    }

    getPaneIndex(): number {
      return this.paneIndex;
    }

    isOverlay(): boolean {
      return normalizedMetadata.overlay ?? false;
    }

    getInputs(): InputDefinition[] {
      return [...this.inputDefinitions];
    }

    updateInputs(inputs: Record<string, number | string | boolean>): void {
      this.inputValues = { ...this.inputValues, ...inputs };
    }

    getInputValues(): Record<string, number | string | boolean> {
      return { ...this.inputValues };
    }

    calculate(data: Bar[]): void {
      const ctx = this.createContext(data);
      setup(ctx);
    }

    private createContext(data: Bar[]): IndicatorContext {
      return {
        data,
        open: data.map(d => d.open),
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close),
        volume: data.map(d => d.volume ?? 0),
        time: data.map(d => d.time),
        paneIndex: this.paneIndex,
      };
    }
  };
}
