/**
 * OakScriptJS Indicators
 * Reusable technical indicators built with the OakScriptJS library
 */

import type { Bar } from '@deepentropy/oakscriptjs';

// Export all indicators
export * as sma from './sma';
export * as momentum from './momentum';
export * as bop from './bop';
export * as dema from './dema';
export * as tema from './tema';
export * as roc from './roc';
export * as adr from './adr';
export * as massIndex from './mass-index';
export * as mcginleyDynamic from './mcginley-dynamic';
export * as hma from './hma';
export * as lsma from './lsma';

// Import indicators for registry
import * as smaIndicator from './sma';
import * as momentumIndicator from './momentum';
import * as bopIndicator from './bop';
import * as demaIndicator from './dema';
import * as temaIndicator from './tema';
import * as rocIndicator from './roc';
import * as adrIndicator from './adr';
import * as massIndexIndicator from './mass-index';
import * as mcginleyDynamicIndicator from './mcginley-dynamic';
import * as hmaIndicator from './hma';
import * as lsmaIndicator from './lsma';

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
  {
    id: 'momentum',
    name: 'Momentum (MOM)',
    shortName: 'MOM',
    description: 'Measures the rate of change in price by comparing the current price to a price from a specified number of periods ago.',
    overlay: false,
    metadata: momentumIndicator.metadata,
    inputConfig: momentumIndicator.inputConfig,
    plotConfig: momentumIndicator.plotConfig,
    defaultInputs: { ...momentumIndicator.defaultInputs },
    calculate: momentumIndicator.calculate,
  },
  {
    id: 'bop',
    name: 'Balance of Power (BOP)',
    shortName: 'BOP',
    description: 'Measures the strength of buyers versus sellers by comparing the close to the open relative to the range.',
    overlay: false,
    metadata: bopIndicator.metadata,
    inputConfig: bopIndicator.inputConfig,
    plotConfig: bopIndicator.plotConfig,
    defaultInputs: { ...bopIndicator.defaultInputs },
    calculate: bopIndicator.calculate,
  },
  {
    id: 'dema',
    name: 'Double EMA (DEMA)',
    shortName: 'DEMA',
    description: 'A faster-reacting moving average that reduces lag by using a combination of two EMAs.',
    overlay: true,
    metadata: demaIndicator.metadata,
    inputConfig: demaIndicator.inputConfig,
    plotConfig: demaIndicator.plotConfig,
    defaultInputs: { ...demaIndicator.defaultInputs },
    calculate: demaIndicator.calculate,
  },
  {
    id: 'tema',
    name: 'Triple EMA (TEMA)',
    shortName: 'TEMA',
    description: 'A triple-smoothed exponential moving average with even less lag than DEMA.',
    overlay: true,
    metadata: temaIndicator.metadata,
    inputConfig: temaIndicator.inputConfig,
    plotConfig: temaIndicator.plotConfig,
    defaultInputs: { ...temaIndicator.defaultInputs },
    calculate: temaIndicator.calculate,
  },
  {
    id: 'roc',
    name: 'Rate of Change (ROC)',
    shortName: 'ROC',
    description: 'Measures the percentage change in price between the current price and a price from a specified number of periods ago.',
    overlay: false,
    metadata: rocIndicator.metadata,
    inputConfig: rocIndicator.inputConfig,
    plotConfig: rocIndicator.plotConfig,
    defaultInputs: { ...rocIndicator.defaultInputs },
    calculate: rocIndicator.calculate,
  },
  {
    id: 'adr',
    name: 'Average Day Range (ADR)',
    shortName: 'ADR',
    description: 'Calculates the average of the daily price range (high - low) over a specified period.',
    overlay: false,
    metadata: adrIndicator.metadata,
    inputConfig: adrIndicator.inputConfig,
    plotConfig: adrIndicator.plotConfig,
    defaultInputs: { ...adrIndicator.defaultInputs },
    calculate: adrIndicator.calculate,
  },
  {
    id: 'mass-index',
    name: 'Mass Index',
    shortName: 'MI',
    description: 'Uses the high-low range to identify trend reversals based on range expansion.',
    overlay: false,
    metadata: massIndexIndicator.metadata,
    inputConfig: massIndexIndicator.inputConfig,
    plotConfig: massIndexIndicator.plotConfig,
    defaultInputs: { ...massIndexIndicator.defaultInputs },
    calculate: massIndexIndicator.calculate,
  },
  {
    id: 'mcginley-dynamic',
    name: 'McGinley Dynamic',
    shortName: 'MGD',
    description: 'A dynamic moving average that automatically adjusts to market speed and reduces price separation.',
    overlay: true,
    metadata: mcginleyDynamicIndicator.metadata,
    inputConfig: mcginleyDynamicIndicator.inputConfig,
    plotConfig: mcginleyDynamicIndicator.plotConfig,
    defaultInputs: { ...mcginleyDynamicIndicator.defaultInputs },
    calculate: mcginleyDynamicIndicator.calculate,
  },
  {
    id: 'hma',
    name: 'Hull Moving Average (HMA)',
    shortName: 'HMA',
    description: 'A fast and smooth moving average that almost eliminates lag using weighted moving averages.',
    overlay: true,
    metadata: hmaIndicator.metadata,
    inputConfig: hmaIndicator.inputConfig,
    plotConfig: hmaIndicator.plotConfig,
    defaultInputs: { ...hmaIndicator.defaultInputs },
    calculate: hmaIndicator.calculate,
  },
  {
    id: 'lsma',
    name: 'Least Squares Moving Average (LSMA)',
    shortName: 'LSMA',
    description: 'Uses linear regression to calculate a moving average that fits the price data using the least squares method.',
    overlay: true,
    metadata: lsmaIndicator.metadata,
    inputConfig: lsmaIndicator.inputConfig,
    plotConfig: lsmaIndicator.plotConfig,
    defaultInputs: { ...lsmaIndicator.defaultInputs },
    calculate: lsmaIndicator.calculate,
  },
];
