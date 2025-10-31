/**
 * Technical Analysis (ta) namespace
 * Mirrors PineScript's ta.* functions
 */

import { series_float, series_bool, int, float, Source, simple_int, simple_float, simple_string } from '../types';

/**
 * Simple Moving Average
 * @param source - Source series
 * @param length - Number of bars (length)
 * @returns Moving average series
 */
export function sma(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = 0; j < length; j++) {
        sum += source[i - j];
      }
      result.push(sum / length);
    }
  }

  return result;
}

/**
 * Exponential Moving Average
 * @param source - Source series
 * @param length - Number of bars (length)
 * @returns Exponential moving average series
 */
export function ema(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  const multiplier = 2 / (length + 1);

  // First value is SMA
  let ema = 0;
  for (let i = 0; i < Math.min(length, source.length); i++) {
    ema += source[i];
  }
  ema = ema / Math.min(length, source.length);

  for (let i = 0; i < source.length; i++) {
    if (i === 0) {
      result.push(source[i]);
      ema = source[i];
    } else {
      ema = (source[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }

  return result;
}

/**
 * Relative Strength Index
 * @param source - Source series
 * @param length - Number of bars (length)
 * @returns RSI series
 */
export function rsi(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < source.length; i++) {
    changes.push(source[i] - source[i - 1]);
  }

  // Separate gains and losses
  const gains: number[] = changes.map(c => c > 0 ? c : 0);
  const losses: number[] = changes.map(c => c < 0 ? -c : 0);

  // Calculate average gains and losses
  const avgGains = sma(gains, length);
  const avgLosses = sma(losses, length);

  result.push(NaN); // First value is NaN

  for (let i = 0; i < avgGains.length; i++) {
    if (avgLosses[i] === 0) {
      result.push(100);
    } else {
      const rs = avgGains[i] / avgLosses[i];
      result.push(100 - (100 / (1 + rs)));
    }
  }

  return result;
}

/**
 * Moving Average Convergence Divergence
 * @param source - Source series
 * @param fastLength - Fast length
 * @param slowLength - Slow length
 * @param signalLength - Signal length
 * @returns [macd, signal, histogram]
 */
export function macd(
  source: Source,
  fastLength: simple_int,
  slowLength: simple_int,
  signalLength: simple_int
): [series_float, series_float, series_float] {
  const fastEma = ema(source, fastLength);
  const slowEma = ema(source, slowLength);

  const macdLine: series_float = [];
  for (let i = 0; i < source.length; i++) {
    macdLine.push(fastEma[i] - slowEma[i]);
  }

  const signalLine = ema(macdLine, signalLength);

  const histogram: series_float = [];
  for (let i = 0; i < source.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }

  return [macdLine, signalLine, histogram];
}

/**
 * Bollinger Bands
 * @param source - Source series
 * @param length - Number of bars (length)
 * @param mult - Standard deviation multiplier
 * @returns [middle, upper, lower]
 */
export function bb(
  source: Source,
  length: simple_int,
  mult: simple_float
): [series_float, series_float, series_float] {
  const basis = sma(source, length);
  const dev = stdev(source, length);

  const upper: series_float = [];
  const lower: series_float = [];

  for (let i = 0; i < source.length; i++) {
    upper.push(basis[i] + mult * dev[i]);
    lower.push(basis[i] - mult * dev[i]);
  }

  return [basis, upper, lower];
}

/**
 * Standard Deviation
 * @param source - Source series
 * @param length - Number of bars (length)
 * @returns Standard deviation series
 */
export function stdev(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  const avg = sma(source, length);

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let sumSquares = 0;
      for (let j = 0; j < length; j++) {
        const diff = source[i - j] - avg[i];
        sumSquares += diff * diff;
      }
      result.push(Math.sqrt(sumSquares / length));
    }
  }

  return result;
}

/**
 * Crossover - true when series1 crosses over series2
 * @param series1 - First series
 * @param series2 - Second series
 * @returns Boolean series
 */
export function crossover(series1: Source, series2: Source): series_bool {
  const result: series_bool = [];

  for (let i = 0; i < series1.length; i++) {
    if (i === 0) {
      result.push(false);
    } else {
      result.push(series1[i] > series2[i] && series1[i - 1] <= series2[i - 1]);
    }
  }

  return result;
}

/**
 * Crossunder - true when series1 crosses under series2
 * @param series1 - First series
 * @param series2 - Second series
 * @returns Boolean series
 */
export function crossunder(series1: Source, series2: Source): series_bool {
  const result: series_bool = [];

  for (let i = 0; i < series1.length; i++) {
    if (i === 0) {
      result.push(false);
    } else {
      result.push(series1[i] < series2[i] && series1[i - 1] >= series2[i - 1]);
    }
  }

  return result;
}

/**
 * Change - difference between current and previous value
 * @param source - Source series
 * @param length - Number of bars back
 * @returns Change series
 */
export function change(source: Source, length: simple_int = 1): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
    } else {
      result.push(source[i] - source[i - length]);
    }
  }

  return result;
}

/**
 * True Range
 * @param high - High series
 * @param low - Low series
 * @param close - Close series
 * @returns True range series
 */
export function tr(high: Source, low: Source, close: Source): series_float {
  const result: series_float = [];

  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      result.push(high[i] - low[i]);
    } else {
      const tr = Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      );
      result.push(tr);
    }
  }

  return result;
}

/**
 * Average True Range
 * @param length - Number of bars (length)
 * @param high - High series
 * @param low - Low series
 * @param close - Close series
 * @returns ATR series
 */
export function atr(length: simple_int, high?: Source, low?: Source, close?: Source): series_float {
  // Note: In actual implementation, high, low, close would come from chart data if not provided
  if (!high || !low || !close) {
    throw new Error('ATR requires high, low, and close series');
  }

  const trueRange = tr(high, low, close);
  return sma(trueRange, length);
}

/**
 * SuperTrend Indicator - Calculates the values of the SuperTrend indicator with the ability
 * to take candle wicks into account, rather than only the closing price.
 * @param factor - Multiplier for the ATR value
 * @param atrLength - Length for the ATR smoothing parameter calculation
 * @param high - High price series
 * @param low - Low price series
 * @param close - Close price series
 * @param wicks - Condition to determine whether to take candle wicks into account when reversing trend, or to use the close price. Default is false.
 * @returns [superTrend, direction] - A tuple of the superTrend value and trend direction (1 for uptrend, -1 for downtrend)
 */
export function supertrend(
  factor: simple_float,
  atrLength: simple_int,
  high: Source,
  low: Source,
  close: Source,
  wicks: simple_bool = false
): [series_float, series_int] {
  const supertrendValues: series_float = [];
  const directions: series_int = [];

  // Calculate hl2 (average of high and low)
  const source: series_float = [];
  for (let i = 0; i < high.length; i++) {
    source.push((high[i] + low[i]) / 2);
  }

  // Calculate ATR
  const atrValues = atr(atrLength, high, low, close);

  // Track previous values across iterations
  let prevLowerBand = NaN;
  let prevUpperBand = NaN;
  let prevSuperTrend = NaN;

  for (let i = 0; i < source.length; i++) {
    const atrValue = atrValues[i] * factor;

    // Skip calculation if ATR is not available yet
    if (isNaN(atrValue)) {
      supertrendValues.push(NaN);
      directions.push(1);
      continue;
    }

    // Calculate initial bands
    let upperBand = source[i] + atrValue;
    let lowerBand = source[i] - atrValue;

    // Determine which price to use for comparison
    const highPrice = wicks ? high[i] : close[i];
    const lowPrice = wicks ? low[i] : close[i];
    const prevLowPrice = i > 0 ? (wicks ? low[i - 1] : close[i - 1]) : 0;
    const prevHighPrice = i > 0 ? (wicks ? high[i - 1] : close[i - 1]) : 0;

    // Update bands conditionally (trailing behavior) - only if previous bands are valid
    if (i > 0 && !isNaN(prevLowerBand) && !isNaN(prevUpperBand)) {
      lowerBand = (lowerBand > prevLowerBand || prevLowPrice < prevLowerBand) ? lowerBand : prevLowerBand;
      upperBand = (upperBand < prevUpperBand || prevHighPrice > prevUpperBand) ? upperBand : prevUpperBand;
    }

    // Determine trend direction
    let currentDirection: int;
    if (isNaN(prevSuperTrend)) {
      // Initial direction when we don't have previous supertrend
      currentDirection = 1;
    } else if (prevSuperTrend === prevUpperBand) {
      // Was in downtrend (following upper band)
      currentDirection = highPrice > upperBand ? -1 : 1;
    } else {
      // Was in uptrend (following lower band)
      currentDirection = lowPrice < lowerBand ? 1 : -1;
    }

    // Calculate supertrend value based on direction
    const superTrendValue = currentDirection === -1 ? lowerBand : upperBand;

    supertrendValues.push(superTrendValue);
    directions.push(currentDirection);

    // Update previous values for next iteration
    prevLowerBand = lowerBand;
    prevUpperBand = upperBand;
    prevSuperTrend = superTrendValue;
  }

  return [supertrendValues, directions];
}
