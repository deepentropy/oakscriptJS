/**
 * @fileoverview Technical analysis functions for DSL
 * Wraps existing ta.* functions to work with Series
 * @module dsl/ta
 */

import * as taCore from '../ta';
import { getContext } from '../runtime/context';
import { Series } from '../runtime/series';

/**
 * Technical Analysis namespace for PineScript DSL
 *
 * All functions return Series objects that can be composed.
 * Wraps the core ta.* functions from OakScriptJS.
 */

/**
 * Simple Moving Average
 * @param source - Source series
 * @param length - Period length
 * @returns Series with SMA values
 */
export function sma(source: Series, length: number): Series {
  return new Series(getContext(), (_bar, i, _data) => {
    const sourceValues = source._compute();
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
  return new Series(getContext(), (_bar, i, _data) => {
    const sourceValues = source._compute();
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
  return new Series(getContext(), (_bar, i, _data) => {
    const sourceValues = source._compute();
    const result = taCore.wma(sourceValues, length);
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
  return new Series(getContext(), (_bar, i, _data) => {
    const sourceValues = source._compute();
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
  const ctx = getContext();
  const sourceValues = source._compute();
  const [macdVals, signalVals, histVals] = taCore.macd(sourceValues, fastLength, slowLength, signalLength);

  const macdSeries = Series.fromArray(ctx, macdVals);
  const signalSeries = Series.fromArray(ctx, signalVals);
  const histSeries = Series.fromArray(ctx, histVals);

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
  const ctx = getContext();
  const sourceValues = source._compute();
  const [upperVals, basisVals, lowerVals] = taCore.bb(sourceValues, length, mult);

  const upperSeries = Series.fromArray(ctx, upperVals);
  const basisSeries = Series.fromArray(ctx, basisVals);
  const lowerSeries = Series.fromArray(ctx, lowerVals);

  return [upperSeries, basisSeries, lowerSeries];
}

/**
 * Standard Deviation
 * @param source - Source series
 * @param length - Period length
 * @returns Series with standard deviation values
 */
export function stdev(source: Series, length: number): Series {
  return new Series(getContext(), (_bar, i, _data) => {
    const sourceValues = source._compute();
    const result = taCore.stdev(sourceValues, length);
    return result[i]!;
  });
}

/**
 * Average True Range
 * @param length - Period length
 * @returns Series with ATR values
 */
export function atr(length: number): Series {
  const ctx = getContext();
  return new Series(ctx, (_bar, i, data) => {
    const high = data.map(b => b.high);
    const low = data.map(b => b.low);
    const close = data.map(b => b.close);
    const result = taCore.atr(length, high, low, close);
    return result[i]!;
  });
}

/**
 * True Range
 * @param _high - High price series (optional, uses built-in high)
 * @param _low - Low price series (optional, uses built-in low)
 * @param _close - Close price series (optional, uses built-in close)
 * @returns Series with TR values
 */
export function tr(_high?: Series, _low?: Series, _close?: Series): Series {
  const ctx = getContext();
  return new Series(ctx, (_bar, i, data) => {
    const high = data.map(b => b.high);
    const low = data.map(b => b.low);
    const close = data.map(b => b.close);
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
  return new Series(getContext(), (_bar, i, data) => {
    const vals1 = source1._compute();
    const vals2 = typeof source2 === 'number'
      ? Array(data.length).fill(source2)
      : source2._compute();

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
  return new Series(getContext(), (_bar, i, data) => {
    const vals1 = source1._compute();
    const vals2 = typeof source2 === 'number'
      ? Array(data.length).fill(source2)
      : source2._compute();

    const result = taCore.crossunder(vals1, vals2);
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
  return new Series(getContext(), (_bar, i, _data) => {
    const sourceValues = source._compute();
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
  return new Series(getContext(), (_bar, i, _data) => {
    const sourceValues = source._compute();
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
  return new Series(getContext(), (_bar, i, _data) => {
    const sourceValues = source._compute();
    const result = taCore.roc(sourceValues, length);
    return result[i]!;
  });
}

// Export as namespace object to match PineScript ta.* syntax
export const ta = {
  sma,
  ema,
  wma,
  rsi,
  macd,
  bb,
  stdev,
  atr,
  tr,
  crossover,
  crossunder,
  change,
  mom,
  roc,
};
