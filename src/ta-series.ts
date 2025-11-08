/**
 * @fileoverview Technical analysis functions that work with Series
 * Simplified wrappers around core ta.* functions
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
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.sma(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Exponential Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with EMA values
 */
export function ema(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.ema(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Weighted Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with WMA values
 */
export function wma(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.wma(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Relative Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with RMA values
 */
export function rma(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.rma(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Relative Strength Index
 * @param source - Source series
 * @param length - Period length
 * @returns Series with RSI values
 */
export function rsi(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.rsi(sourceValues, length);
    return result[i]!;
  });
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
  const bars = (source as any).data as Bar[];
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
  const bars = (source as any).data as Bar[];
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
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.stdev(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Average True Range
 * @param bars - Bar data
 * @param length - Period length
 * @returns Series with ATR values
 */
export function atr(bars: Bar[], length: number): Series {
  return new Series(bars, (_bar, i) => {
    const high = bars.map(b => b.high);
    const low = bars.map(b => b.low);
    const close = bars.map(b => b.close);
    const result = taCore.atr(length, high, low, close);
    return result[i]!;
  });
}

/**
 * True Range
 * @param bars - Bar data
 * @returns Series with TR values
 */
export function tr(bars: Bar[]): Series {
  return new Series(bars, (_bar, i) => {
    const high = bars.map(b => b.high);
    const low = bars.map(b => b.low);
    const close = bars.map(b => b.close);
    const result = taCore.tr(false, high, low, close);
    return result[i]!;
  });
}

/**
 * Crossover detection
 * @param source1 - First series
 * @param source2 - Second series or number
 * @returns Series with 1 where crossover, 0 otherwise
 */
export function crossover(source1: Series, source2: Series | number): Series {
  const bars = (source1 as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const vals1 = source1.toArray();
    const vals2 = typeof source2 === 'number'
      ? Array(bars.length).fill(source2)
      : source2.toArray();

    const result = taCore.crossover(vals1, vals2);
    return result[i] ? 1 : 0;
  });
}

/**
 * Crossunder detection
 * @param source1 - First series
 * @param source2 - Second series or number
 * @returns Series with 1 where crossunder, 0 otherwise
 */
export function crossunder(source1: Series, source2: Series | number): Series {
  const bars = (source1 as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const vals1 = source1.toArray();
    const vals2 = typeof source2 === 'number'
      ? Array(bars.length).fill(source2)
      : source2.toArray();

    const result = taCore.crossunder(vals1, vals2);
    return result[i] ? 1 : 0;
  });
}

/**
 * Cross detection
 * @param source1 - First series
 * @param source2 - Second series or number
 * @returns Series with 1 where cross, 0 otherwise
 */
export function cross(source1: Series, source2: Series | number): Series {
  const bars = (source1 as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const vals1 = source1.toArray();
    const vals2 = typeof source2 === 'number'
      ? Array(bars.length).fill(source2)
      : source2.toArray();

    const result = taCore.cross(vals1, vals2);
    return result[i] ? 1 : 0;
  });
}

/**
 * Change (difference from previous value)
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with change values
 */
export function change(source: Series, length: number = 1): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.change(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Momentum
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with momentum values
 */
export function mom(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.mom(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Rate of Change
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with ROC values
 */
export function roc(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.roc(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Highest value in period
 * @param source - Source series
 * @param length - Period length
 * @returns Series with highest values
 */
export function highest(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.highest(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Lowest value in period
 * @param source - Source series
 * @param length - Period length
 * @returns Series with lowest values
 */
export function lowest(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.lowest(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Rising detection
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with 1 where rising, 0 otherwise
 */
export function rising(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.rising(sourceValues, length);
    return result[i] ? 1 : 0;
  });
}

/**
 * Falling detection
 * @param source - Source series
 * @param length - Lookback period
 * @returns Series with 1 where falling, 0 otherwise
 */
export function falling(source: Series, length: number): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.falling(sourceValues, length);
    return result[i] ? 1 : 0;
  });
}

/**
 * Cumulative sum
 * @param source - Source series
 * @returns Series with cumulative sum values
 */
export function cum(source: Series): Series {
  const bars = (source as any).data as Bar[];
  return new Series(bars, (_bar, i) => {
    const sourceValues = source.toArray();
    const result = taCore.cum(sourceValues);
    return result[i]!;
  });
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

// Export as namespace object to match PineScript ta.* syntax
export const ta = {
  sma,
  ema,
  wma,
  rma,
  rsi,
  macd,
  bb,
  stdev,
  atr,
  tr,
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
};
