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

// Donchian Channels
import * as donchianIndicator from './donchian';
export { DonchianChannels, calculate as calculateDonchian } from './donchian';
export type { DonchianInputs } from './donchian';

// EMA - Exponential Moving Average
import * as emaIndicator from './ema';
export { EMA, calculate as calculateEMA } from './ema';
export type { EMAInputs } from './ema';

// HMA - Hull Moving Average
import * as hmaIndicator from './hma';
export { HMA, calculate as calculateHMA } from './hma';
export type { HMAInputs } from './hma';

// Ichimoku Cloud
import * as ichimokuIndicator from './ichimoku';
export { IchimokuCloud, calculate as calculateIchimoku } from './ichimoku';
export type { IchimokuInputs } from './ichimoku';

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

// Parabolic SAR
import * as parabolicSarIndicator from './parabolic-sar';
export { ParabolicSAR, calculate as calculateParabolicSAR } from './parabolic-sar';
export type { ParabolicSARInputs } from './parabolic-sar';

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

// Supertrend
import * as supertrendIndicator from './supertrend';
export { Supertrend, calculate as calculateSupertrend } from './supertrend';
export type { SupertrendInputs } from './supertrend';

// ADX - Average Directional Index
import * as adxIndicator from './adx';
export { ADX, calculate as calculateADX } from './adx';
export type { ADXInputs } from './adx';

// Awesome Oscillator
import * as awesomeOscIndicator from './awesome-oscillator';
export { AwesomeOscillator, calculate as calculateAwesomeOscillator } from './awesome-oscillator';
export type { AwesomeOscillatorInputs } from './awesome-oscillator';

// BBTrend
import * as bbtrendIndicator from './bbtrend';
export { BBTrend, calculate as calculateBBTrend } from './bbtrend';
export type { BBTrendInputs } from './bbtrend';

// Bull Bear Power
import * as bullBearPowerIndicator from './bull-bear-power';
export { BullBearPower, calculate as calculateBullBearPower } from './bull-bear-power';
export type { BullBearPowerInputs } from './bull-bear-power';

// Chande Momentum Oscillator
import * as chandeMOIndicator from './chande-mo';
export { ChandeMO, calculate as calculateChandeMO } from './chande-mo';
export type { ChandeMOInputs } from './chande-mo';

// DPO - Detrended Price Oscillator
import * as dpoIndicator from './dpo';
export { DPO, calculate as calculateDPO } from './dpo';
export type { DPOInputs } from './dpo';

// Elder Force Index
import * as elderForceIndicator from './elder-force';
export { ElderForceIndex, calculate as calculateElderForce } from './elder-force';
export type { ElderForceInputs } from './elder-force';

// Historical Volatility
import * as histVolIndicator from './historical-volatility';
export { HistoricalVolatility, calculate as calculateHistoricalVolatility } from './historical-volatility';
export type { HistoricalVolatilityInputs } from './historical-volatility';

// MA Cross
import * as maCrossIndicator from './ma-cross';
export { MACross, calculate as calculateMACross } from './ma-cross';
export type { MACrossInputs } from './ma-cross';

// Median
import * as medianIndicator from './median';
export { Median, calculate as calculateMedian } from './median';
export type { MedianInputs } from './median';

// MFI - Money Flow Index
import * as mfiIndicator from './mfi';
export { MFI, calculate as calculateMFI } from './mfi';
export type { MFIInputs } from './mfi';

// PVT - Price Volume Trend
import * as pvtIndicator from './pvt';
export { PVT, calculate as calculatePVT } from './pvt';
export type { PVTInputs } from './pvt';

// RVI - Relative Vigor Index
import * as rviIndicator from './rvi';
export { RVI, calculate as calculateRVI } from './rvi';
export type { RVIInputs } from './rvi';

// SMI Ergodic
import * as smiErgodicIndicator from './smi-ergodic';
export { SMIErgodic, calculate as calculateSMIErgodic } from './smi-ergodic';
export type { SMIErgodicInputs } from './smi-ergodic';

// SMI Ergodic Oscillator
import * as smiErgodicOscIndicator from './smi-ergodic-oscillator';
export { SMIErgodicOscillator, calculate as calculateSMIErgodicOsc } from './smi-ergodic-oscillator';
export type { SMIErgodicOscInputs } from './smi-ergodic-oscillator';

// SMMA - Smoothed Moving Average
import * as smmaIndicator from './smma';
export { SMMA, calculate as calculateSMMA } from './smma';
export type { SMMAInputs } from './smma';

// Standard Deviation
import * as stdevIndicator from './stdev';
export { StandardDeviation, calculate as calculateStDev } from './stdev';
export type { StDevInputs } from './stdev';

// Stochastic RSI
import * as stochRsiIndicator from './stoch-rsi';
export { StochRSI, calculate as calculateStochRSI } from './stoch-rsi';
export type { StochRSIInputs } from './stoch-rsi';

// Trend Strength Index
import * as trendStrengthIndicator from './trend-strength';
export { TrendStrengthIndex, calculate as calculateTrendStrength } from './trend-strength';
export type { TrendStrengthInputs } from './trend-strength';

// TSI - True Strength Index
import * as tsiIndicator from './tsi';
export { TSI, calculate as calculateTSI } from './tsi';
export type { TSIInputs } from './tsi';

// Volume Oscillator
import * as volumeOscIndicator from './volume-oscillator';
export { VolumeOscillator, calculate as calculateVolumeOsc } from './volume-oscillator';
export type { VolumeOscillatorInputs } from './volume-oscillator';

// Vortex Indicator
import * as vortexIndicator from './vortex';
export { VortexIndicator, calculate as calculateVortex } from './vortex';
export type { VortexInputs } from './vortex';

// Williams Alligator
import * as williamsAlligatorIndicator from './williams-alligator';
export { WilliamsAlligator, calculate as calculateWilliamsAlligator } from './williams-alligator';
export type { WilliamsAlligatorInputs } from './williams-alligator';

// Williams %R
import * as williamsRIndicator from './williams-r';
export { WilliamsPercentRange, calculate as calculateWilliamsR } from './williams-r';
export type { WilliamsRInputs } from './williams-r';

// Woodies CCI
import * as woodiesCCIIndicator from './woodies-cci';
export { WoodiesCCI, calculate as calculateWoodiesCCI } from './woodies-cci';
export type { WoodiesCCIInputs } from './woodies-cci';

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
    id: 'ichimoku',
    name: 'Ichimoku Cloud',
    shortName: 'Ichimoku',
    description: 'Comprehensive trend system showing support/resistance and momentum.',
    overlay: true,
    metadata: ichimokuIndicator.metadata,
    inputConfig: ichimokuIndicator.inputConfig as InputConfig[],
    plotConfig: ichimokuIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...ichimokuIndicator.defaultInputs },
    calculate: ichimokuIndicator.calculate,
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
  {
    id: 'donchian',
    name: 'Donchian Channels (DC)',
    shortName: 'DC',
    description: 'Shows the highest high and lowest low over a period, used for breakout trading.',
    overlay: true,
    metadata: donchianIndicator.metadata,
    inputConfig: donchianIndicator.inputConfig as InputConfig[],
    plotConfig: donchianIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...donchianIndicator.defaultInputs },
    calculate: donchianIndicator.calculate,
  },
  {
    id: 'parabolic-sar',
    name: 'Parabolic SAR',
    shortName: 'SAR',
    description: 'A trend-following indicator that provides potential entry and exit points.',
    overlay: true,
    metadata: parabolicSarIndicator.metadata,
    inputConfig: parabolicSarIndicator.inputConfig as InputConfig[],
    plotConfig: parabolicSarIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...parabolicSarIndicator.defaultInputs },
    calculate: parabolicSarIndicator.calculate,
  },
  {
    id: 'supertrend',
    name: 'Supertrend',
    shortName: 'ST',
    description: 'A trend-following overlay that uses ATR to calculate dynamic support/resistance.',
    overlay: true,
    metadata: supertrendIndicator.metadata,
    inputConfig: supertrendIndicator.inputConfig as InputConfig[],
    plotConfig: supertrendIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...supertrendIndicator.defaultInputs },
    calculate: supertrendIndicator.calculate,
  },
  {
    id: 'adx',
    name: 'Average Directional Index (ADX)',
    shortName: 'ADX',
    description: 'Measures trend strength regardless of direction.',
    overlay: false,
    metadata: adxIndicator.metadata,
    inputConfig: adxIndicator.inputConfig as InputConfig[],
    plotConfig: adxIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...adxIndicator.defaultInputs },
    calculate: adxIndicator.calculate,
  },
  {
    id: 'awesome-oscillator',
    name: 'Awesome Oscillator',
    shortName: 'AO',
    description: 'Shows market momentum using SMA difference.',
    overlay: false,
    metadata: awesomeOscIndicator.metadata,
    inputConfig: awesomeOscIndicator.inputConfig as InputConfig[],
    plotConfig: awesomeOscIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...awesomeOscIndicator.defaultInputs },
    calculate: awesomeOscIndicator.calculate,
  },
  {
    id: 'bbtrend',
    name: 'BBTrend',
    shortName: 'BBT',
    description: 'Measures trend using Bollinger Bands.',
    overlay: false,
    metadata: bbtrendIndicator.metadata,
    inputConfig: bbtrendIndicator.inputConfig as InputConfig[],
    plotConfig: bbtrendIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...bbtrendIndicator.defaultInputs },
    calculate: bbtrendIndicator.calculate,
  },
  {
    id: 'bull-bear-power',
    name: 'Bull Bear Power',
    shortName: 'BBP',
    description: 'Measures buying/selling pressure relative to EMA.',
    overlay: false,
    metadata: bullBearPowerIndicator.metadata,
    inputConfig: bullBearPowerIndicator.inputConfig as InputConfig[],
    plotConfig: bullBearPowerIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...bullBearPowerIndicator.defaultInputs },
    calculate: bullBearPowerIndicator.calculate,
  },
  {
    id: 'chande-mo',
    name: 'Chande Momentum Oscillator',
    shortName: 'CMO',
    description: 'Measures momentum on a scale of -100 to +100.',
    overlay: false,
    metadata: chandeMOIndicator.metadata,
    inputConfig: chandeMOIndicator.inputConfig as InputConfig[],
    plotConfig: chandeMOIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...chandeMOIndicator.defaultInputs },
    calculate: chandeMOIndicator.calculate,
  },
  {
    id: 'dpo',
    name: 'Detrended Price Oscillator',
    shortName: 'DPO',
    description: 'Removes trend to identify cycles.',
    overlay: false,
    metadata: dpoIndicator.metadata,
    inputConfig: dpoIndicator.inputConfig as InputConfig[],
    plotConfig: dpoIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...dpoIndicator.defaultInputs },
    calculate: dpoIndicator.calculate,
  },
  {
    id: 'elder-force',
    name: 'Elder Force Index',
    shortName: 'EFI',
    description: 'Combines price and volume for force measurement.',
    overlay: false,
    metadata: elderForceIndicator.metadata,
    inputConfig: elderForceIndicator.inputConfig as InputConfig[],
    plotConfig: elderForceIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...elderForceIndicator.defaultInputs },
    calculate: elderForceIndicator.calculate,
  },
  {
    id: 'hist-volatility',
    name: 'Historical Volatility',
    shortName: 'HV',
    description: 'Annualized standard deviation of log returns.',
    overlay: false,
    metadata: histVolIndicator.metadata,
    inputConfig: histVolIndicator.inputConfig as InputConfig[],
    plotConfig: histVolIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...histVolIndicator.defaultInputs },
    calculate: histVolIndicator.calculate,
  },
  {
    id: 'ma-cross',
    name: 'MA Cross',
    shortName: 'MAC',
    description: 'Two moving averages for crossover signals.',
    overlay: true,
    metadata: maCrossIndicator.metadata,
    inputConfig: maCrossIndicator.inputConfig as InputConfig[],
    plotConfig: maCrossIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...maCrossIndicator.defaultInputs },
    calculate: maCrossIndicator.calculate,
  },
  {
    id: 'median',
    name: 'Median',
    shortName: 'MED',
    description: 'Median price with ATR bands.',
    overlay: true,
    metadata: medianIndicator.metadata,
    inputConfig: medianIndicator.inputConfig as InputConfig[],
    plotConfig: medianIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...medianIndicator.defaultInputs },
    calculate: medianIndicator.calculate,
  },
  {
    id: 'mfi',
    name: 'Money Flow Index',
    shortName: 'MFI',
    description: 'Volume-weighted RSI measuring buying/selling pressure.',
    overlay: false,
    metadata: mfiIndicator.metadata,
    inputConfig: mfiIndicator.inputConfig as InputConfig[],
    plotConfig: mfiIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...mfiIndicator.defaultInputs },
    calculate: mfiIndicator.calculate,
  },
  {
    id: 'pvt',
    name: 'Price Volume Trend',
    shortName: 'PVT',
    description: 'Cumulative volume weighted by price changes.',
    overlay: false,
    metadata: pvtIndicator.metadata,
    inputConfig: pvtIndicator.inputConfig as InputConfig[],
    plotConfig: pvtIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...pvtIndicator.defaultInputs },
    calculate: pvtIndicator.calculate,
  },
  {
    id: 'rvi',
    name: 'Relative Vigor Index',
    shortName: 'RVI',
    description: 'Measures conviction of price action.',
    overlay: false,
    metadata: rviIndicator.metadata,
    inputConfig: rviIndicator.inputConfig as InputConfig[],
    plotConfig: rviIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...rviIndicator.defaultInputs },
    calculate: rviIndicator.calculate,
  },
  {
    id: 'smi-ergodic',
    name: 'SMI Ergodic Indicator',
    shortName: 'SMII',
    description: 'TSI-based momentum oscillator with signal line.',
    overlay: false,
    metadata: smiErgodicIndicator.metadata,
    inputConfig: smiErgodicIndicator.inputConfig as InputConfig[],
    plotConfig: smiErgodicIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...smiErgodicIndicator.defaultInputs },
    calculate: smiErgodicIndicator.calculate,
  },
  {
    id: 'smi-ergodic-osc',
    name: 'SMI Ergodic Oscillator',
    shortName: 'SMIO',
    description: 'Difference between SMI and signal as histogram.',
    overlay: false,
    metadata: smiErgodicOscIndicator.metadata,
    inputConfig: smiErgodicOscIndicator.inputConfig as InputConfig[],
    plotConfig: smiErgodicOscIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...smiErgodicOscIndicator.defaultInputs },
    calculate: smiErgodicOscIndicator.calculate,
  },
  {
    id: 'smma',
    name: 'Smoothed Moving Average',
    shortName: 'SMMA',
    description: 'Wilder smoothing moving average.',
    overlay: true,
    metadata: smmaIndicator.metadata,
    inputConfig: smmaIndicator.inputConfig as InputConfig[],
    plotConfig: smmaIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...smmaIndicator.defaultInputs },
    calculate: smmaIndicator.calculate,
  },
  {
    id: 'stdev',
    name: 'Standard Deviation',
    shortName: 'StDev',
    description: 'Measures price volatility.',
    overlay: false,
    metadata: stdevIndicator.metadata,
    inputConfig: stdevIndicator.inputConfig as InputConfig[],
    plotConfig: stdevIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...stdevIndicator.defaultInputs },
    calculate: stdevIndicator.calculate,
  },
  {
    id: 'stoch-rsi',
    name: 'Stochastic RSI',
    shortName: 'StochRSI',
    description: 'Stochastic applied to RSI values.',
    overlay: false,
    metadata: stochRsiIndicator.metadata,
    inputConfig: stochRsiIndicator.inputConfig as InputConfig[],
    plotConfig: stochRsiIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...stochRsiIndicator.defaultInputs },
    calculate: stochRsiIndicator.calculate,
  },
  {
    id: 'trend-strength',
    name: 'Trend Strength Index',
    shortName: 'TSI',
    description: 'Measures trend strength based on directional movement.',
    overlay: false,
    metadata: trendStrengthIndicator.metadata,
    inputConfig: trendStrengthIndicator.inputConfig as InputConfig[],
    plotConfig: trendStrengthIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...trendStrengthIndicator.defaultInputs },
    calculate: trendStrengthIndicator.calculate,
  },
  {
    id: 'tsi',
    name: 'True Strength Index',
    shortName: 'TSI',
    description: 'Double-smoothed momentum oscillator.',
    overlay: false,
    metadata: tsiIndicator.metadata,
    inputConfig: tsiIndicator.inputConfig as InputConfig[],
    plotConfig: tsiIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...tsiIndicator.defaultInputs },
    calculate: tsiIndicator.calculate,
  },
  {
    id: 'volume-osc',
    name: 'Volume Oscillator',
    shortName: 'VO',
    description: 'Percentage difference between volume EMAs.',
    overlay: false,
    metadata: volumeOscIndicator.metadata,
    inputConfig: volumeOscIndicator.inputConfig as InputConfig[],
    plotConfig: volumeOscIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...volumeOscIndicator.defaultInputs },
    calculate: volumeOscIndicator.calculate,
  },
  {
    id: 'vortex',
    name: 'Vortex Indicator',
    shortName: 'VI',
    description: 'Identifies trend start and direction.',
    overlay: false,
    metadata: vortexIndicator.metadata,
    inputConfig: vortexIndicator.inputConfig as InputConfig[],
    plotConfig: vortexIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...vortexIndicator.defaultInputs },
    calculate: vortexIndicator.calculate,
  },
  {
    id: 'williams-alligator',
    name: 'Williams Alligator',
    shortName: 'Alligator',
    description: 'Three smoothed moving averages for trend detection.',
    overlay: true,
    metadata: williamsAlligatorIndicator.metadata,
    inputConfig: williamsAlligatorIndicator.inputConfig as InputConfig[],
    plotConfig: williamsAlligatorIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...williamsAlligatorIndicator.defaultInputs },
    calculate: williamsAlligatorIndicator.calculate,
  },
  {
    id: 'williams-r',
    name: 'Williams %R',
    shortName: '%R',
    description: 'Momentum indicator showing overbought/oversold levels.',
    overlay: false,
    metadata: williamsRIndicator.metadata,
    inputConfig: williamsRIndicator.inputConfig as InputConfig[],
    plotConfig: williamsRIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...williamsRIndicator.defaultInputs },
    calculate: williamsRIndicator.calculate,
  },
  {
    id: 'woodies-cci',
    name: 'Woodies CCI',
    shortName: 'WCCI',
    description: 'CCI with turbo for faster signals.',
    overlay: false,
    metadata: woodiesCCIIndicator.metadata,
    inputConfig: woodiesCCIIndicator.inputConfig as InputConfig[],
    plotConfig: woodiesCCIIndicator.plotConfig as PlotConfig[],
    defaultInputs: { ...woodiesCCIIndicator.defaultInputs },
    calculate: woodiesCCIIndicator.calculate,
  },
];

// Package version
export const version = '0.1.0';
