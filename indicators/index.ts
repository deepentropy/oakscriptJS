/**
 * OakScriptJS Indicators
 * Reusable technical indicators built with the OakScriptJS library
 */

import type { Bar } from '@deepentropy/oakscriptjs';

// Export all indicators
export * as sma from './sma';

// Import indicators for registry
import * as smaIndicator from './sma';

/**
 * Input configuration type
 */
export interface InputConfig {
  id: string;
  type: 'int' | 'float' | 'bool' | 'source' | 'string';
  title: string;
  defval: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

/**
 * Plot configuration type
 */
export interface PlotConfig {
  id: string;
  title: string;
  color: string;
  lineWidth?: number;
}

/**
 * Indicator registry entry
 */
export interface IndicatorRegistryEntry {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  overlay: boolean;
  metadata: {
    title: string;
    shortTitle: string;
    overlay: boolean;
  };
  inputConfig: InputConfig[];
  plotConfig: PlotConfig[];
  defaultInputs: Record<string, unknown>;
  calculate: (bars: Bar[], inputs: Record<string, unknown>) => {
    plots: Record<string, Array<{ time: number; value: number }>>;
  };
}

/**
 * Registry of all available indicators
 * Add new indicators here to make them available in the example
 */
export const indicatorRegistry: IndicatorRegistryEntry[] = [
  {
    id: 'sma',
    name: 'Simple Moving Average (SMA)',
    shortName: 'SMA',
    description: 'A simple moving average that smooths price data by calculating the arithmetic mean over a specified period.',
    overlay: true,
    metadata: smaIndicator.metadata,
    inputConfig: smaIndicator.inputConfig,
    plotConfig: smaIndicator.plotConfig,
    defaultInputs: { ...smaIndicator.defaultInputs },
    calculate: smaIndicator.calculate,
  },
  // Future indicators will be added here as new registry entries
  // Example:
  // {
  //   id: 'rsi',
  //   name: 'Relative Strength Index (RSI)',
  //   shortName: 'RSI',
  //   overlay: false,
  //   metadata: rsiIndicator.metadata,
  //   ...
  // },
];
