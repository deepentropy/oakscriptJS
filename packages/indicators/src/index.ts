/**
 * @oakscript/indicators
 *
 * Optimized technical indicators built with OakScriptJS.
 *
 * These indicators are hand-optimized versions that leverage the oakscriptjs
 * library for better performance and more idiomatic TypeScript code.
 */

import type { Bar } from 'oakscriptjs';

// SMA - Simple Moving Average
import * as smaIndicator from './sma';
export { SMA, calculate as calculateSMA } from './sma';
export type { SMAInputs } from './sma';

// ADR - Average Day Range
import * as adrIndicator from './adr';
export { ADR, calculate as calculateADR } from './adr';
export type { ADRInputs } from './adr';

// ALMA - Arnaud Legoux Moving Average
import * as almaIndicator from './alma';
export { ALMA, calculate as calculateALMA } from './alma';
export type { ALMAInputs } from './alma';

// ATR - Average True Range
import * as atrIndicator from './atr';
export { ATR, calculate as calculateATR } from './atr';
export type { ATRInputs } from './atr';

// BB - Bollinger Bands
import * as bbIndicator from './bb';
export { BollingerBands, calculate as calculateBB } from './bb';
export type { BBInputs } from './bb';

// BOP - Balance of Power
import * as bopIndicator from './bop';
export { BOP, calculate as calculateBOP } from './bop';
export type { BOPInputs } from './bop';

// CCI - Commodity Channel Index
import * as cciIndicator from './cci';
export { CCI, calculate as calculateCCI } from './cci';
export type { CCIInputs } from './cci';

// DEMA - Double Exponential Moving Average
import * as demaIndicator from './dema';
export { DEMA, calculate as calculateDEMA } from './dema';
export type { DEMAInputs } from './dema';

// EMA - Exponential Moving Average
import * as emaIndicator from './ema';
export { EMA, calculate as calculateEMA } from './ema';
export type { EMAInputs } from './ema';

// HMA - Hull Moving Average
import * as hmaIndicator from './hma';
export { HMA, calculate as calculateHMA } from './hma';
export type { HMAInputs } from './hma';

// Keltner Channels
import * as keltnerIndicator from './keltner';
export { KeltnerChannels, calculate as calculateKeltner } from './keltner';
export type { KeltnerInputs } from './keltner';

// LSMA - Least Squares Moving Average
import * as lsmaIndicator from './lsma';
export { LSMA, calculate as calculateLSMA } from './lsma';
export type { LSMAInputs } from './lsma';

// MACD - Moving Average Convergence Divergence
import * as macdIndicator from './macd';
export { MACD, calculate as calculateMACD } from './macd';
export type { MACDInputs } from './macd';

// Mass Index
import * as massIndexIndicator from './mass-index';
export { MassIndex, calculate as calculateMassIndex } from './mass-index';
export type { MassIndexInputs } from './mass-index';

// McGinley Dynamic
import * as mcGinleyDynamicIndicator from './mcginley-dynamic';
export { McGinleyDynamic, calculate as calculateMcGinleyDynamic } from './mcginley-dynamic';
export type { McGinleyDynamicInputs } from './mcginley-dynamic';

// Momentum
import * as momentumIndicator from './momentum';
export { Momentum, calculate as calculateMomentum } from './momentum';
export type { MomentumInputs } from './momentum';

// OBV - On Balance Volume
import * as obvIndicator from './obv';
export { OBV, calculate as calculateOBV } from './obv';
export type { OBVInputs } from './obv';

// RMA - Smoothed Moving Average
import * as rmaIndicator from './rma';
export { RMA, calculate as calculateRMA } from './rma';
export type { RMAInputs } from './rma';

// ROC - Rate of Change
import * as rocIndicator from './roc';
export { ROC, calculate as calculateROC } from './roc';
export type { ROCInputs } from './roc';

// RSI - Relative Strength Index
import * as rsiIndicator from './rsi';
export { RSI, calculate as calculateRSI } from './rsi';
export type { RSIInputs } from './rsi';

// Stochastic
import * as stochIndicator from './stoch';
export { Stochastic, calculate as calculateStochastic } from './stoch';
export type { StochasticInputs } from './stoch';

// TEMA - Triple Exponential Moving Average
import * as temaIndicator from './tema';
export { TEMA, calculate as calculateTEMA } from './tema';
export type { TEMAInputs } from './tema';

// VWMA - Volume Weighted Moving Average
import * as vwmaIndicator from './vwma';
export { VWMA, calculate as calculateVWMA } from './vwma';
export type { VWMAInputs } from './vwma';

// WMA - Weighted Moving Average
import * as wmaIndicator from './wma';
export { WMA, calculate as calculateWMA } from './wma';
export type { WMAInputs } from './wma';

/**
 * Input configuration type
 */
export interface InputConfig {
  id: string;
  type: 'int' | 'float' | 'bool' | 'source' | 'string';
  title?: string;
  defval: unknown;
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
  visible?: boolean | string;
  display?: 'all' | 'none' | 'data_window' | 'status_line' | 'pane';
  offset?: number;
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
  calculate: (bars: Bar[], inputs?: any) => any;
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
    inputConfig: smaIndicator.inputConfig as InputConfig[],
    plotConfig: smaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...smaIndicator.defaultInputs },
    calculate: smaIndicator.calculate,
  },
  {
    id: 'adr',
    name: 'Average Day Range (ADR)',
    shortName: 'ADR',
    description: 'Calculates the average of the daily price range (high - low) over a specified period.',
    overlay: false,
    metadata: adrIndicator.metadata,
    inputConfig: adrIndicator.inputConfig as InputConfig[],
    plotConfig: adrIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...adrIndicator.defaultInputs },
    calculate: adrIndicator.calculate,
  },
  {
    id: 'alma',
    name: 'Arnaud Legoux Moving Average (ALMA)',
    shortName: 'ALMA',
    description: 'A moving average using a Gaussian distribution to reduce lag while maintaining smoothness.',
    overlay: true,
    metadata: almaIndicator.metadata,
    inputConfig: almaIndicator.inputConfig as InputConfig[],
    plotConfig: almaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...almaIndicator.defaultInputs },
    calculate: almaIndicator.calculate,
  },
  {
    id: 'atr',
    name: 'Average True Range (ATR)',
    shortName: 'ATR',
    description: 'Measures market volatility by calculating the average range between high and low prices.',
    overlay: false,
    metadata: atrIndicator.metadata,
    inputConfig: atrIndicator.inputConfig as InputConfig[],
    plotConfig: atrIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...atrIndicator.defaultInputs },
    calculate: atrIndicator.calculate,
  },
  {
    id: 'bb',
    name: 'Bollinger Bands (BB)',
    shortName: 'BB',
    description: 'Volatility bands placed above and below a moving average, using standard deviation.',
    overlay: true,
    metadata: bbIndicator.metadata,
    inputConfig: bbIndicator.inputConfig as InputConfig[],
    plotConfig: bbIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...bbIndicator.defaultInputs },
    calculate: bbIndicator.calculate,
  },
  {
    id: 'bop',
    name: 'Balance of Power (BOP)',
    shortName: 'BOP',
    description: 'Measures the strength of buyers vs sellers by comparing close-open to high-low range.',
    overlay: false,
    metadata: bopIndicator.metadata,
    inputConfig: bopIndicator.inputConfig as InputConfig[],
    plotConfig: bopIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...bopIndicator.defaultInputs },
    calculate: bopIndicator.calculate,
  },
  {
    id: 'cci',
    name: 'Commodity Channel Index (CCI)',
    shortName: 'CCI',
    description: 'Measures the variation of a security\'s price from its statistical mean.',
    overlay: false,
    metadata: cciIndicator.metadata,
    inputConfig: cciIndicator.inputConfig as InputConfig[],
    plotConfig: cciIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...cciIndicator.defaultInputs },
    calculate: cciIndicator.calculate,
  },
  {
    id: 'dema',
    name: 'Double EMA (DEMA)',
    shortName: 'DEMA',
    description: 'Reduces lag by applying EMA twice.',
    overlay: true,
    metadata: demaIndicator.metadata,
    inputConfig: demaIndicator.inputConfig as InputConfig[],
    plotConfig: demaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...demaIndicator.defaultInputs },
    calculate: demaIndicator.calculate,
  },
  {
    id: 'ema',
    name: 'Exponential Moving Average (EMA)',
    shortName: 'EMA',
    description: 'A weighted moving average giving more weight to recent prices.',
    overlay: true,
    metadata: emaIndicator.metadata,
    inputConfig: emaIndicator.inputConfig as InputConfig[],
    plotConfig: emaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...emaIndicator.defaultInputs },
    calculate: emaIndicator.calculate,
  },
  {
    id: 'hma',
    name: 'Hull Moving Average (HMA)',
    shortName: 'HMA',
    description: 'Reduces lag while maintaining smoothness using weighted moving averages.',
    overlay: true,
    metadata: hmaIndicator.metadata,
    inputConfig: hmaIndicator.inputConfig as InputConfig[],
    plotConfig: hmaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...hmaIndicator.defaultInputs },
    calculate: hmaIndicator.calculate,
  },
  {
    id: 'keltner',
    name: 'Keltner Channels (KC)',
    shortName: 'KC',
    description: 'Volatility-based envelope using EMA and ATR.',
    overlay: true,
    metadata: keltnerIndicator.metadata,
    inputConfig: keltnerIndicator.inputConfig as InputConfig[],
    plotConfig: keltnerIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...keltnerIndicator.defaultInputs },
    calculate: keltnerIndicator.calculate,
  },
  {
    id: 'lsma',
    name: 'Least Squares Moving Average (LSMA)',
    shortName: 'LSMA',
    description: 'Uses linear regression to fit a line through recent prices.',
    overlay: true,
    metadata: lsmaIndicator.metadata,
    inputConfig: lsmaIndicator.inputConfig as InputConfig[],
    plotConfig: lsmaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...lsmaIndicator.defaultInputs },
    calculate: lsmaIndicator.calculate,
  },
  {
    id: 'macd',
    name: 'MACD',
    shortName: 'MACD',
    description: 'Trend-following momentum indicator showing relationship between two EMAs.',
    overlay: false,
    metadata: macdIndicator.metadata,
    inputConfig: macdIndicator.inputConfig as InputConfig[],
    plotConfig: macdIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...macdIndicator.defaultInputs },
    calculate: macdIndicator.calculate,
  },
  {
    id: 'mass-index',
    name: 'Mass Index',
    shortName: 'MI',
    description: 'Identifies trend reversals by examining range between high and low.',
    overlay: false,
    metadata: massIndexIndicator.metadata,
    inputConfig: massIndexIndicator.inputConfig as InputConfig[],
    plotConfig: massIndexIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...massIndexIndicator.defaultInputs },
    calculate: massIndexIndicator.calculate,
  },
  {
    id: 'mc-ginley-dynamic',
    name: 'McGinley Dynamic',
    shortName: 'MD',
    description: 'An adaptive moving average that adjusts to market speed.',
    overlay: true,
    metadata: mcGinleyDynamicIndicator.metadata,
    inputConfig: mcGinleyDynamicIndicator.inputConfig as InputConfig[],
    plotConfig: mcGinleyDynamicIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...mcGinleyDynamicIndicator.defaultInputs },
    calculate: mcGinleyDynamicIndicator.calculate,
  },
  {
    id: 'momentum',
    name: 'Momentum',
    shortName: 'Mom',
    description: 'Measures the rate of change of price over a specified period.',
    overlay: false,
    metadata: momentumIndicator.metadata,
    inputConfig: momentumIndicator.inputConfig as InputConfig[],
    plotConfig: momentumIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...momentumIndicator.defaultInputs },
    calculate: momentumIndicator.calculate,
  },
  {
    id: 'obv',
    name: 'On Balance Volume (OBV)',
    shortName: 'OBV',
    description: 'Cumulative volume indicator based on price direction.',
    overlay: false,
    metadata: obvIndicator.metadata,
    inputConfig: obvIndicator.inputConfig as InputConfig[],
    plotConfig: obvIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...obvIndicator.defaultInputs },
    calculate: obvIndicator.calculate,
  },
  {
    id: 'rma',
    name: 'Smoothed Moving Average (RMA)',
    shortName: 'RMA',
    description: 'Wilder smoothing with alpha = 1/length.',
    overlay: true,
    metadata: rmaIndicator.metadata,
    inputConfig: rmaIndicator.inputConfig as InputConfig[],
    plotConfig: rmaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...rmaIndicator.defaultInputs },
    calculate: rmaIndicator.calculate,
  },
  {
    id: 'roc',
    name: 'Rate of Change (ROC)',
    shortName: 'ROC',
    description: 'Measures percentage change in price over a specified period.',
    overlay: false,
    metadata: rocIndicator.metadata,
    inputConfig: rocIndicator.inputConfig as InputConfig[],
    plotConfig: rocIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...rocIndicator.defaultInputs },
    calculate: rocIndicator.calculate,
  },
  {
    id: 'rsi',
    name: 'Relative Strength Index (RSI)',
    shortName: 'RSI',
    description: 'Momentum oscillator measuring speed and magnitude of price changes.',
    overlay: false,
    metadata: rsiIndicator.metadata,
    inputConfig: rsiIndicator.inputConfig as InputConfig[],
    plotConfig: rsiIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...rsiIndicator.defaultInputs },
    calculate: rsiIndicator.calculate,
  },
  {
    id: 'stoch',
    name: 'Stochastic',
    shortName: 'Stoch',
    description: 'Compares closing price to its price range over a given period.',
    overlay: false,
    metadata: stochIndicator.metadata,
    inputConfig: stochIndicator.inputConfig as InputConfig[],
    plotConfig: stochIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...stochIndicator.defaultInputs },
    calculate: stochIndicator.calculate,
  },
  {
    id: 'tema',
    name: 'Triple EMA (TEMA)',
    shortName: 'TEMA',
    description: 'Further reduces lag with triple exponential smoothing.',
    overlay: true,
    metadata: temaIndicator.metadata,
    inputConfig: temaIndicator.inputConfig as InputConfig[],
    plotConfig: temaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...temaIndicator.defaultInputs },
    calculate: temaIndicator.calculate,
  },
  {
    id: 'vwma',
    name: 'Volume Weighted Moving Average (VWMA)',
    shortName: 'VWMA',
    description: 'A moving average weighted by volume.',
    overlay: true,
    metadata: vwmaIndicator.metadata,
    inputConfig: vwmaIndicator.inputConfig as InputConfig[],
    plotConfig: vwmaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...vwmaIndicator.defaultInputs },
    calculate: vwmaIndicator.calculate,
  },
  {
    id: 'wma',
    name: 'Weighted Moving Average (WMA)',
    shortName: 'WMA',
    description: 'A moving average with linearly increasing weights.',
    overlay: true,
    metadata: wmaIndicator.metadata,
    inputConfig: wmaIndicator.inputConfig as InputConfig[],
    plotConfig: wmaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...wmaIndicator.defaultInputs },
    calculate: wmaIndicator.calculate,
  },
];

// Package version
export const version = '0.1.0';
