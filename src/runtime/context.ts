/**
 * @fileoverview Runtime context for PineScript DSL
 * Manages global state for indicator execution
 * @module runtime/context
 */

import type { Bar } from '../types';

/**
 * Indicator metadata registered via indicator() function
 */
export interface IndicatorMetadata {
  title: string;
  shorttitle?: string;
  format?: 'price' | 'volume' | 'percent';
  precision?: number;
  overlay?: boolean;
  timeframe?: string;
  timeframe_gaps?: boolean;
}

/**
 * Plot registration from plot() function calls
 */
export interface PlotRegistration {
  series: any; // Series instance
  title?: string;
  color?: any;
  linewidth?: number;
  style?: 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns';
  trackprice?: boolean;
  histbase?: number;
  offset?: number;
  join?: boolean;
  editable?: boolean;
  display?: 'all' | 'none';
}

/**
 * Horizontal line registration from hline() function calls
 */
export interface HLineRegistration {
  price: number;
  title?: string;
  color?: any;
  linestyle?: 'solid' | 'dashed' | 'dotted';
  linewidth?: number;
  editable?: boolean;
}

/**
 * Input registration from input.* function calls
 */
export interface InputRegistration {
  type: 'int' | 'float' | 'bool' | 'string' | 'source';
  defval: any;
  title: string;
  tooltip?: string;
  inline?: string;
  group?: string;
  minval?: number;
  maxval?: number;
  step?: number;
  options?: any[];
}

/**
 * Runtime context for indicator execution
 *
 * This class manages the global state during indicator script execution.
 * It stores indicator metadata, plot registrations, and chart data.
 */
export class RuntimeContext {
  private data: Bar[] = [];
  private indicatorMeta: IndicatorMetadata | null = null;
  private plots: PlotRegistration[] = [];
  private hlines: HLineRegistration[] = [];
  private inputs: Map<string, InputRegistration> = new Map();
  private inputValues: Map<string, any> = new Map();

  /**
   * Set chart data for computation
   */
  setData(data: Bar[]): void {
    this.data = data;
  }

  /**
   * Get chart data
   */
  getData(): Bar[] {
    return this.data;
  }

  /**
   * Register indicator metadata
   */
  registerIndicator(meta: IndicatorMetadata): void {
    this.indicatorMeta = meta;
  }

  /**
   * Get indicator metadata
   */
  getIndicatorMetadata(): IndicatorMetadata | null {
    return this.indicatorMeta;
  }

  /**
   * Register a plot
   */
  registerPlot(plot: PlotRegistration): void {
    this.plots.push(plot);
  }

  /**
   * Get all registered plots
   */
  getPlots(): PlotRegistration[] {
    return this.plots;
  }

  /**
   * Register a horizontal line
   */
  registerHLine(hline: HLineRegistration): void {
    this.hlines.push(hline);
  }

  /**
   * Get all registered hlines
   */
  getHLines(): HLineRegistration[] {
    return this.hlines;
  }

  /**
   * Register an input
   */
  registerInput(name: string, input: InputRegistration): void {
    this.inputs.set(name, input);
  }

  /**
   * Get input value (from user or default)
   */
  getInputValue(name: string): any {
    if (this.inputValues.has(name)) {
      return this.inputValues.get(name);
    }
    const input = this.inputs.get(name);
    return input ? input.defval : undefined;
  }

  /**
   * Set input values from user
   */
  setInputValues(values: Record<string, any>): void {
    Object.entries(values).forEach(([name, value]) => {
      this.inputValues.set(name, value);
    });
  }

  /**
   * Get all inputs
   */
  getInputs(): Map<string, InputRegistration> {
    return this.inputs;
  }

  /**
   * Reset context (called before each compilation)
   */
  reset(): void {
    this.data = [];
    this.indicatorMeta = null;
    this.plots = [];
    this.hlines = [];
    // Don't reset inputs/inputValues - they persist
  }

  /**
   * Clear everything including inputs
   */
  clear(): void {
    this.reset();
    this.inputs.clear();
    this.inputValues.clear();
  }
}

/**
 * Global context instance
 * Each indicator import gets its own isolated context via module scope
 */
let globalContext = new RuntimeContext();

/**
 * Get the current runtime context
 */
export function getContext(): RuntimeContext {
  return globalContext;
}

/**
 * Reset the global context
 * Used when re-executing indicator script
 */
export function resetContext(): void {
  globalContext.reset();
}

/**
 * Create a new isolated context
 * Used for testing or running multiple indicators
 */
export function createIsolatedContext(): RuntimeContext {
  return new RuntimeContext();
}

/**
 * Replace global context (for testing)
 */
export function setContext(context: RuntimeContext): void {
  globalContext = context;
}
