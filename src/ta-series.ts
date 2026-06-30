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

/**
 * Parabolic SAR (Stop and Reverse)
 * @param bars - Bar data
 * @param start - Initial acceleration factor (default: 0.02)
 * @param inc - Acceleration factor increment (default: 0.02)
 * @param max - Maximum acceleration factor (default: 0.2)
 * @returns Series with SAR values
 */
export function sar(bars: Bar[], start: number = 0.02, inc: number = 0.02, max: number = 0.2): Series {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const result = taCore.sar(start, inc, max, high, low, close);
  return Series.fromArray(bars, result);
}

/**
 * Deviation
 * @param source - Source series
 * @param length - Period length
 * @returns Series with deviation values
 */
export function dev(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.dev(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Variance
 * @param source - Source series
 * @param length - Period length
 * @param biased - Use biased estimation (default: true)
 * @returns Series with variance values
 */
export function variance(source: Series, length: number, biased: boolean = true): Series {
  const bars = source.bars as Bar[];
  const result = taCore.variance(source.toArray(), length, biased);
  return Series.fromArray(bars, result);
}

/**
 * Median
 * @param source - Source series
 * @param length - Period length
 * @returns Series with median values
 */
export function median(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.median(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Symmetrically Weighted Moving Average
 * @param source - Source series
 * @returns Series with SWMA values
 */
export function swma(source: Series): Series {
  const bars = source.bars as Bar[];
  const result = taCore.swma(source.toArray());
  return Series.fromArray(bars, result);
}

/**
 * Correlation
 * @param source1 - First source series
 * @param source2 - Second source series
 * @param length - Period length
 * @returns Series with correlation values
 */
export function correlation(source1: Series, source2: Series, length: number): Series {
  const bars = source1.bars as Bar[];
  const result = taCore.correlation(source1.toArray(), source2.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Percent Rank
 * @param source - Source series
 * @param length - Period length
 * @returns Series with percent rank values
 */
export function percentrank(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.percentrank(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Money Flow Index
 * @param source - Source series (typically hlc3)
 * @param length - Period length
 * @param volume - Volume series
 * @returns Series with MFI values
 */
export function mfi(source: Series, length: number, volume: Series): Series {
  const bars = source.bars as Bar[];
  const result = taCore.mfi(source.toArray(), length, volume.toArray());
  return Series.fromArray(bars, result);
}

/**
 * Hull Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with HMA values
 */
export function hma(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.hma(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Pivot High
 * @param source - Source series
 * @param leftbars - Number of bars to the left of the pivot
 * @param rightbars - Number of bars to the right of the pivot
 * @returns Series with pivot high values (NaN where no pivot)
 */
export function pivothigh(source: Series, leftbars: number, rightbars: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.pivothigh(source.toArray(), leftbars, rightbars);
  return Series.fromArray(bars, result);
}

/**
 * Pivot Low
 * @param source - Source series
 * @param leftbars - Number of bars to the left of the pivot
 * @param rightbars - Number of bars to the right of the pivot
 * @returns Series with pivot low values (NaN where no pivot)
 */
export function pivotlow(source: Series, leftbars: number, rightbars: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.pivotlow(source.toArray(), leftbars, rightbars);
  return Series.fromArray(bars, result);
}

/**
 * Bars Since condition was true
 * @param condition - Boolean series (1/0 values)
 * @returns Series with bar count since condition was last true
 */
export function barssince(condition: Series): Series {
  const bars = condition.bars as Bar[];
  const boolValues = condition.toArray().map(v => v === 1);
  const result = taCore.barssince(boolValues);
  return Series.fromArray(bars, result);
}

/**
 * Value When condition was true
 * @param condition - Boolean series (1/0 values)
 * @param source - Source series to extract values from
 * @param occurrence - Which occurrence to use (0 = most recent)
 * @returns Series with values from source when condition was true
 */
export function valuewhen(condition: Series, source: Series, occurrence: number): Series {
  const bars = condition.bars as Bar[];
  const boolValues = condition.toArray().map(v => v === 1);
  const result = taCore.valuewhen(boolValues, source.toArray(), occurrence);
  return Series.fromArray(bars, result);
}

/**
 * Directional Movement Index
 * @param bars - Bar data
 * @param diLength - DI period length
 * @param adxSmoothing - ADX smoothing period
 * @returns Tuple of [plusDI, minusDI, adx] Series
 */
export function dmi(bars: Bar[], diLength: number, adxSmoothing: number): [Series, Series, Series] {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const [plusDI, minusDI, adx] = taCore.dmi(diLength, adxSmoothing, high, low, close);
  return [
    Series.fromArray(bars, plusDI),
    Series.fromArray(bars, minusDI),
    Series.fromArray(bars, adx),
  ];
}

/**
 * True Strength Index
 * @param source - Source series
 * @param shortLength - Short smoothing period
 * @param longLength - Long smoothing period
 * @returns Series with TSI values
 */
export function tsi(source: Series, shortLength: number, longLength: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.tsi(source.toArray(), shortLength, longLength);
  return Series.fromArray(bars, result);
}

/**
 * Chande Momentum Oscillator
 * @param source - Source series
 * @param length - Period length
 * @returns Series with CMO values
 */
export function cmo(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.cmo(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Keltner Channel
 * @param bars - Bar data
 * @param source - Source series
 * @param length - Period length
 * @param mult - Multiplier
 * @param useTrueRange - Use true range (default: true)
 * @returns Tuple of [middle, upper, lower] Series
 */
export function kc(bars: Bar[], source: Series, length: number, mult: number, useTrueRange: boolean = true): [Series, Series, Series] {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const [middle, upper, lower] = taCore.kc(source.toArray(), length, mult, useTrueRange, high, low, close);
  return [
    Series.fromArray(bars, middle),
    Series.fromArray(bars, upper),
    Series.fromArray(bars, lower),
  ];
}

/**
 * Bollinger Bands Width
 * @param source - Source series
 * @param length - Period length
 * @param mult - Standard deviation multiplier
 * @returns Series with BBW values
 */
export function bbw(source: Series, length: number, mult: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.bbw(source.toArray(), length, mult);
  return Series.fromArray(bars, result);
}

/**
 * Williams %R
 * @param bars - Bar data
 * @param length - Period length (default: 14)
 * @returns Series with Williams %R values
 */
export function wpr(bars: Bar[], length: number = 14): Series {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const result = taCore.wpr(high, low, close, length);
  return Series.fromArray(bars, result);
}

/**
 * Keltner Channel Width
 * @param bars - Bar data
 * @param source - Source series
 * @param length - Period length (default: 20)
 * @param mult - Multiplier (default: 2)
 * @param useTrueRange - Use true range (default: true)
 * @returns Series with KCW values
 */
export function kcw(bars: Bar[], source: Series, length: number = 20, mult: number = 2, useTrueRange: boolean = true): Series {
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const result = taCore.kcw(source.toArray(), length, mult, useTrueRange, high, low, close);
  return Series.fromArray(bars, result);
}

/**
 * Range (high - low)
 * @param high - High series
 * @param low - Low series
 * @returns Series with range values
 */
export function range(high: Series, low: Series): Series {
  const bars = high.bars as Bar[];
  const result = taCore.range(high.toArray(), low.toArray());
  return Series.fromArray(bars, result);
}

/**
 * Highest Bars - offset to the highest value
 * @param source - Source series
 * @param length - Period length
 * @returns Series with bar offsets to highest value
 */
export function highestbars(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.highestbars(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Lowest Bars - offset to the lowest value
 * @param source - Source series
 * @param length - Period length
 * @returns Series with bar offsets to lowest value
 */
export function lowestbars(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.lowestbars(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Element-wise maximum
 * @param source1 - First series
 * @param source2 - Second series
 * @returns Series with max of each pair
 */
export function max(source1: Series, source2: Series): Series {
  const bars = source1.bars as Bar[];
  const result = taCore.max(source1.toArray(), source2.toArray());
  return Series.fromArray(bars, result);
}

/**
 * Element-wise minimum
 * @param source1 - First series
 * @param source2 - Second series
 * @returns Series with min of each pair
 */
export function min(source1: Series, source2: Series): Series {
  const bars = source1.bars as Bar[];
  const result = taCore.min(source1.toArray(), source2.toArray());
  return Series.fromArray(bars, result);
}

/**
 * Center of Gravity
 * @param source - Source series
 * @param length - Period length (default: 10)
 * @returns Series with COG values
 */
export function cog(source: Series, length: number = 10): Series {
  const bars = source.bars as Bar[];
  const result = taCore.cog(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Mode (most frequent value)
 * @param source - Source series
 * @param length - Period length
 * @returns Series with mode values
 */
export function mode(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.mode(source.toArray(), length);
  return Series.fromArray(bars, result);
}

/**
 * Percentile (linear interpolation)
 * @param source - Source series
 * @param length - Period length
 * @param percentage - Percentile percentage
 * @returns Series with percentile values
 */
export function percentile_linear_interpolation(source: Series, length: number, percentage: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.percentile_linear_interpolation(source.toArray(), length, percentage);
  return Series.fromArray(bars, result);
}

/**
 * Percentile (nearest rank)
 * @param source - Source series
 * @param length - Period length
 * @param percentage - Percentile percentage
 * @returns Series with percentile values
 */
export function percentile_nearest_rank(source: Series, length: number, percentage: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.percentile_nearest_rank(source.toArray(), length, percentage);
  return Series.fromArray(bars, result);
}

/**
 * Rank Correlation Index
 * @param source - Source series
 * @param length - Period length
 * @returns Series with RCI values
 */
export function rci(source: Series, length: number): Series {
  const bars = source.bars as Bar[];
  const result = taCore.rci(source.toArray(), length);
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
  sar,
  dev,
  variance,
  median,
  swma,
  correlation,
  percentrank,
  mfi,
  hma,
  pivothigh,
  pivotlow,
  barssince,
  valuewhen,
  dmi,
  tsi,
  cmo,
  kc,
  bbw,
  wpr,
  kcw,
  range,
  highestbars,
  lowestbars,
  max,
  min,
  cog,
  mode,
  percentile_linear_interpolation,
  percentile_nearest_rank,
  rci,
};
