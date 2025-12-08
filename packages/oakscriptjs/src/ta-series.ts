/**
 * @fileoverview Technical analysis functions that work with Series
 * Fixed wrappers around core ta.* functions with O(n) performance
 * @module ta-series
 */

import * as taCore from './ta';
import { Series } from './runtime/series';
import type { Bar } from './types';

/**
 * Simple Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with SMA values
 */
export function sma(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.sma(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Exponential Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with EMA values
 */
export function ema(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.ema(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Weighted Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with WMA values
 */
export function wma(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.wma(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Relative Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with RMA values
 */
export function rma(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.rma(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Relative Strength Index
 * @param source - Source series
 * @param length - Period length
 * @returns Series with RSI values
 */
export function rsi(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.rsi(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Moving Average Convergence Divergence
 * @param source - Source series
 * @param fastLength - Fast EMA period
 * @param slowLength - Slow EMA period
 * @param signalLength - Signal line period
 * @returns Tuple of [macdLine, signalLine, histogram] Series
 */
export function macd(
  source: Series,
  fastLength: number,
  slowLength: number,
  signalLength: number
): [Series, Series, Series] {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const [macdVals, signalVals, histVals] = taCore.macd(sourceValues, fastLength, slowLength, signalLength);

  const macdSeries = Series.fromArray(bars, macdVals);
  const signalSeries = Series.fromArray(bars, signalVals);
  const histSeries = Series.fromArray(bars, histVals);

  return [macdSeries, signalSeries, histSeries];
}

/**
 * Bollinger Bands
 * @param source - Source series
 * @param length - Period length
 * @param mult - Standard deviation multiplier
 * @returns Tuple of [upper, basis, lower] Series
 */
export function bb(source: Series, length: number, mult: number): [Series, Series, Series] {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const [upperVals, basisVals, lowerVals] = taCore.bb(sourceValues, length, mult);

  const upperSeries = Series.fromArray(bars, upperVals);
  const basisSeries = Series.fromArray(bars, basisVals);
  const lowerSeries = Series.fromArray(bars, lowerVals);

  return [upperSeries, basisSeries, lowerSeries];
}

/**
 * Standard Deviation
 * @param source - Source series
 * @param length - Period length
 * @returns Series with standard deviation values
 */
export function stdev(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.stdev(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Average True Range
 * @param bars - Bar data
 * @param length - Period length
 * @returns Series with ATR values
 */
export function atr(bars: Bar[], length: number): Series {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const result = taCore.atr(length, high, low, close);
  return Series.fromArray(bars, result);
}

/**
 * True Range
 * @param bars - Bar data
 * @param handle_na - How NaN values are handled (default: false)
 * @returns Series with TR values
 */
export function tr(bars: Bar[], handle_na: boolean = false): Series {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const result = taCore.tr(handle_na, high, low, close);
  return Series.fromArray(bars, result);
}

/**
 * Stochastic %K
 * @param source - Source series (typically close)
 * @param high - High series
 * @param low - Low series
 * @param length - Period length
 * @returns Series with stochastic values
 */
export function stoch(source: Series, high: Series, low: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const highValues = high.toArray();
  const lowValues = low.toArray();
  const result = taCore.stoch(sourceValues, highValues, lowValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Crossover detection
 * @param source1 - First series
 * @param source2 - Second series or number
 * @returns Series with 1 where crossover, 0 otherwise
 */
export function crossover(source1: Series, source2: Series | number): Series {
  const bars = source1.bars as Bar[];
  const vals1 = source1.toArray();
  const vals2 = typeof source2 === 'number'
    ? Array(bars.length).fill(source2)
    : source2.toArray();

  const result = taCore.crossover(vals1, vals2);
  // Convert boolean array to number array
  const numResult = result.map(b => b ? 1 : 0);
  return Series.fromArray(bars, numResult);
}

/**
 * Crossunder detection
 * @param source1 - First series
 * @param source2 - Second series or number
 * @returns Series with 1 where crossunder, 0 otherwise
 */
export function crossunder(source1: Series, source2: Series | number): Series {
  const bars = source1.bars as Bar[];
  const vals1 = source1.toArray();
  const vals2 = typeof source2 === 'number'
    ? Array(bars.length).fill(source2)
    : source2.toArray();

  const result = taCore.crossunder(vals1, vals2);
  // Convert boolean array to number array
  const numResult = result.map(b => b ? 1 : 0);
  return Series.fromArray(bars, numResult);
}

/**
 * Cross detection
 * @param source1 - First series
 * @param source2 - Second series or number
 * @returns Series with 1 where cross, 0 otherwise
 */
export function cross(source1: Series, source2: Series | number): Series {
  const bars = source1.bars as Bar[];
  const vals1 = source1.toArray();
  const vals2 = typeof source2 === 'number'
    ? Array(bars.length).fill(source2)
    : source2.toArray();

  const result = taCore.cross(vals1, vals2);
  // Convert boolean array to number array
  const numResult = result.map(b => b ? 1 : 0);
  return Series.fromArray(bars, numResult);
}

/**
 * Change (difference from previous value)
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with change values
 */
export function change(source: Series, length: number = 1): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.change(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Momentum
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with momentum values
 */
export function mom(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.mom(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Rate of Change
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with ROC values
 */
export function roc(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.roc(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Highest value in period
 * @param source - Source series
 * @param length - Period length
 * @returns Series with highest values
 */
export function highest(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.highest(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Lowest value in period
 * @param source - Source series
 * @param length - Period length
 * @returns Series with lowest values
 */
export function lowest(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.lowest(sourceValues, length);
  return Series.fromArray(bars, result);
}

/**
 * Rising detection
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with 1 where rising, 0 otherwise
 */
export function rising(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.rising(sourceValues, length);
  // Convert boolean array to number array
  const numResult = result.map(b => b ? 1 : 0);
  return Series.fromArray(bars, numResult);
}

/**
 * Falling detection
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with 1 where falling, 0 otherwise
 */
export function falling(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.falling(sourceValues, length);
  // Convert boolean array to number array
  const numResult = result.map(b => b ? 1 : 0);
  return Series.fromArray(bars, numResult);
}

/**
 * Cumulative sum
 * @param source - Source series
 * @returns Series with cumulative sum values
 */
export function cum(source: Series): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.cum(sourceValues);
  return Series.fromArray(bars, result);
}

/**
 * Supertrend indicator
 * @param bars - Bar data
 * @param factor - Multiplier factor
 * @param atrLength - ATR period length
 * @returns Tuple of [supertrend, direction] Series
 */
export function supertrend(bars: Bar[], factor: number, atrLength: number): [Series, Series] {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const [trendVals, dirVals] = taCore.supertrend(factor, atrLength, high, low, close);

  const trendSeries = Series.fromArray(bars, trendVals);
  const dirSeries = Series.fromArray(bars, dirVals);

  return [trendSeries, dirSeries];
}

/**
 * Volume Weighted Average Price
 * @param source - Source series (typically close or hlc3)
 * @param volume - Volume series
 * @returns Series with VWAP values
 */
export function vwap(source: Series, volume: Series): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const volumeValues = volume.toArray();
  const result = taCore.vwap(sourceValues, volumeValues);
  return Series.fromArray(bars, result);
}

/**
 * Ichimoku Kinko Hyo (Ichimoku Cloud)
 * @param bars - Bar data
 * @param conversionPeriods - Period for Tenkan-sen (default: 9)
 * @param basePeriods - Period for Kijun-sen (default: 26)
 * @param laggingSpan2Periods - Period for Senkou Span B (default: 52)
 * @param displacement - Displacement for Senkou Spans and Chikou Span (default: 26)
 * @returns Tuple of [tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan] Series
 */
export function ichimoku(
  bars: Bar[],
  conversionPeriods: number,
  basePeriods: number,
  laggingSpan2Periods: number,
  displacement: number
): [Series, Series, Series, Series, Series] {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const [tenkan, kijun, senkouA, senkouB, chikou] = taCore.ichimoku(
    conversionPeriods,
    basePeriods,
    laggingSpan2Periods,
    displacement,
    high,
    low,
    close
  );

  return [
    Series.fromArray(bars, tenkan),
    Series.fromArray(bars, kijun),
    Series.fromArray(bars, senkouA),
    Series.fromArray(bars, senkouB),
    Series.fromArray(bars, chikou),
  ];
}

/**
 * Volume Weighted Moving Average
 * @param source - Source series
 * @param length - Period length
 * @param volume - Volume series
 * @returns Series with VWMA values
 */
export function vwma(source: Series, length: number, volume: Series): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const volumeValues = volume.toArray();
  const result = taCore.vwma(sourceValues, length, volumeValues);
  return Series.fromArray(bars, result);
}

/**
 * Linear Regression
 * @param source - Source series
 * @param length - Period length
 * @param offset - Offset (default: 0)
 * @returns Series with linear regression values
 */
export function linreg(source: Series, length: number, offset: number = 0): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.linreg(sourceValues, length, offset);
  return Series.fromArray(bars, result);
}

/**
 * Arnaud Legoux Moving Average
 * @param source - Source series
 * @param length - Period length (default: 9)
 * @param offset - Controls tradeoff between smoothness and responsiveness (default: 0.85)
 * @param sigma - Standard deviation factor for sharpness (default: 6)
 * @param floor - Whether to floor the offset calculation (default: false)
 * @returns Series with ALMA values
 */
export function alma(source: Series, length: number = 9, offset: number = 0.85, sigma: number = 6, floor: boolean = false): Series {
    const bars = source.bars as Bar[];
    const sourceValues = source.toArray();
    const result = taCore.alma(sourceValues, length, offset, sigma, floor);
    return Series.fromArray(bars, result);
}

/**
 * ZigZag indicator - identifies significant trend reversals
 * @param bars - Bar data
 * @param deviation - Minimum percentage price change to form a new pivot (default: 5.0)
 * @param depth - Minimum bars between pivots (default: 10)
 * @param backstep - Bars to look back for confirmation (default: 3)
 * @returns Tuple of [zigzag values, direction, isPivot flags] Series
 * @remarks
 * - The isPivot Series contains numeric values (1 for pivot, 0 for non-pivot)
 *   converted from boolean for consistency with other Series-based functions
 * - The core ta.zigzag() function returns boolean isPivot values
 */
export function zigzag(
  bars: Bar[],
  deviation: number = 5,
  depth: number = 10,
  backstep: number = 3
): [Series, Series, Series] {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);

  const [zigzagVals, dirVals, pivotVals] = taCore.zigzag(
    deviation, depth, backstep, undefined, high, low
  );

  // Convert boolean pivot flags to numbers (1/0) for Series compatibility
  return [
    Series.fromArray(bars, zigzagVals),
    Series.fromArray(bars, dirVals),
    Series.fromArray(bars, pivotVals.map(b => b ? 1 : 0)),
  ];
}

/**
 * Commodity Channel Index
 * @param source - Source series (typically hlc3)
 * @param length - Period length
 * @returns Series with CCI values
 */
export function cci(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const sourceValues = source.toArray();
  const result = taCore.cci(sourceValues, length);
  return Series.fromArray(bars, result);
}

// Export as namespace object to match PineScript ta.* syntax
export const ta = {
  sma,
  ema,
  wma,
  vwma,
  rma,
  rsi,
  macd,
  bb,
  stdev,
  atr,
  tr,
  stoch,
  crossover,
  crossunder,
  cross,
  change,
  mom,
  roc,
  highest,
  lowest,
  rising,
  falling,
  cum,
  supertrend,
  vwap,
  ichimoku,
  linreg,
  alma,
  zigzag,
  cci,
};
