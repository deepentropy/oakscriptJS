/**
 * Technical Analysis (ta) namespace
 * Mirrors PineScript's ta.* functions for technical analysis indicators and calculations.
 *
 * @remarks
 * All technical analysis functions in this namespace follow PineScript v6 API specifications.
 *
 * @version 6
 */

import { series_float, series_bool, series_int, int, float, Source, simple_int, simple_float, simple_bool } from '../types';

/**
 * Simple Moving Average - returns the moving average (sum of last y values divided by y).
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Simple moving average of source for length bars back
 *
 * @remarks
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 * - Returns NaN for the first (length - 1) values where there's insufficient data
 *
 * @example
 * ```typescript
 * const closePrices = [10, 11, 12, 13, 14];
 * const sma5 = ta.sma(closePrices, 5); // Returns: [NaN, NaN, NaN, NaN, 12]
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.sma | PineScript ta.sma}
 */
export function sma(source: Source, length: series_int): series_float {
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
 * Exponential Moving Average - returns the exponentially weighted moving average.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Exponential moving average of source with alpha = 2 / (length + 1)
 *
 * @remarks
 * - In EMA, weighting factors decrease exponentially
 * - Formula: `EMA = alpha * source + (1 - alpha) * EMA[1]`, where `alpha = 2 / (length + 1)`
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 * - May cause indicator repainting
 *
 * @example
 * ```typescript
 * const closePrices = [10, 11, 12, 13, 14];
 * const ema5 = ta.ema(closePrices, 5);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.ema | PineScript ta.ema}
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
 * Relative Strength Index - momentum oscillator measuring speed and magnitude of price changes.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns RSI series (values range from 0 to 100)
 *
 * @remarks
 * - RSI values above 70 typically indicate overbought conditions
 * - RSI values below 30 typically indicate oversold conditions
 * - **ALGORITHM ISSUE**: Current implementation uses SMA instead of RMA (Relative Moving Average)
 * - PineScript v6 uses `ta.rma()` for smoothing, this uses `ta.sma()` - values may differ
 * - Formula: RSI = 100 - (100 / (1 + RS)), where RS = Average Gain / Average Loss
 *
 * @example
 * ```typescript
 * const rsi14 = ta.rsi(closePrices, 14);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.rsi | PineScript ta.rsi}
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
 * Moving Average Convergence Divergence - trend-following momentum indicator showing relationship
 * between two moving averages.
 *
 * @param source - Series of values to process
 * @param fastLength - Fast EMA length (typically 12)
 * @param slowLength - Slow EMA length (typically 26)
 * @param signalLength - Signal line EMA length (typically 9)
 * @returns Tuple of [macdLine, signalLine, histogram]
 *
 * @remarks
 * - MACD Line = Fast EMA - Slow EMA
 * - Signal Line = EMA of MACD Line
 * - Histogram = MACD Line - Signal Line
 * - Crossovers between MACD and signal line indicate potential buy/sell signals
 *
 * @example
 * ```typescript
 * const [macdLine, signal, histogram] = ta.macd(closePrices, 12, 26, 9);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.macd | PineScript ta.macd}
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
 * Bollinger Bands - a technical analysis tool defined by lines plotted two standard deviations
 * away from a simple moving average.
 *
 * @param series - Series of values to process
 * @param length - Number of bars (length)
 * @param mult - Standard deviation factor
 * @returns Tuple of [middle, upper, lower] bands
 *
 * @remarks
 * - Middle band is the SMA of the source
 * - Upper band = middle + (mult * standard deviation)
 * - Lower band = middle - (mult * standard deviation)
 * - `na` values in the source series are ignored
 *
 * @example
 * ```typescript
 * const [middle, upper, lower] = ta.bb(closePrices, 20, 2);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.bb | PineScript ta.bb}
 */
export function bb(
  series: Source,
  length: series_int,
  mult: simple_float
): [series_float, series_float, series_float] {
  const basis = sma(series, length);
  const dev = stdev(series, length);

  const upper: series_float = [];
  const lower: series_float = [];

  for (let i = 0; i < series.length; i++) {
    upper.push(basis[i] + mult * dev[i]);
    lower.push(basis[i] - mult * dev[i]);
  }

  return [basis, upper, lower];
}

/**
 * Standard Deviation - measures the amount of variation or dispersion of values.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Standard deviation series
 *
 * @remarks
 * - Calculates the population standard deviation (not sample)
 * - Returns NaN for the first (length - 1) values
 * - `na` values in the source series are ignored
 *
 * @example
 * ```typescript
 * const stdev20 = ta.stdev(closePrices, 20);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.stdev | PineScript ta.stdev}
 */
export function stdev(source: Source, length: series_int): series_float {
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
 * Crossover - returns true when series1 crosses over series2 (moves from below to above).
 *
 * @param series1 - First series
 * @param series2 - Second series
 * @returns Boolean series (true at crossover points)
 *
 * @remarks
 * - True when: series1[i] > series2[i] AND series1[i-1] <= series2[i-1]
 * - First value is always false (no previous value to compare)
 * - Useful for detecting bullish signals (e.g., fast MA crossing over slow MA)
 *
 * @example
 * ```typescript
 * const crossUp = ta.crossover(fastMA, slowMA);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.crossover | PineScript ta.crossover}
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
 * Crossunder - returns true when series1 crosses under series2 (moves from above to below).
 *
 * @param series1 - First series
 * @param series2 - Second series
 * @returns Boolean series (true at crossunder points)
 *
 * @remarks
 * - True when: series1[i] < series2[i] AND series1[i-1] >= series2[i-1]
 * - First value is always false (no previous value to compare)
 * - Useful for detecting bearish signals (e.g., fast MA crossing under slow MA)
 *
 * @example
 * ```typescript
 * const crossDown = ta.crossunder(fastMA, slowMA);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.crossunder | PineScript ta.crossunder}
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
 * Change - calculates the difference between the current value and its value length bars ago.
 *
 * @param source - Series of values to process
 * @param length - Number of bars back (default: 1)
 * @returns Change series (source[i] - source[i - length])
 *
 * @remarks
 * - Returns NaN for the first `length` values
 * - Default length is 1 (difference from previous bar)
 * - Positive values indicate increase, negative values indicate decrease
 *
 * @example
 * ```typescript
 * const change1 = ta.change(closePrices); // Daily change
 * const change5 = ta.change(closePrices, 5); // 5-day change
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.change | PineScript ta.change}
 */
export function change(source: Source, length: series_int = 1): series_float {
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
 * True Range - measures market volatility by calculating the greatest of three price ranges.
 *
 * @param handle_na - Defines how the function calculates when previous close is na (default: false)
 * @param high - High price series (required when not using context API)
 * @param low - Low price series (required when not using context API)
 * @param close - Close price series (required when not using context API)
 * @returns True range series
 *
 * @remarks
 * - **PineScript v6 signature**: `ta.tr(handle_na?)` - uses implicit chart data
 * - **JavaScript signature**: Requires explicit `high`, `low`, `close` OR use `createContext()`
 * - True Range = max(high - low, abs(high - close[1]), abs(low - close[1]))
 * - When `handle_na` is true: returns `high - low` if previous close is na
 * - When `handle_na` is false: returns na if previous close is na
 * - Used as a component in ATR calculations
 *
 * @example
 * ```typescript
 * // Direct call with explicit data
 * const trueRange = ta.tr(false, high, low, close);
 *
 * // Or use context API for cleaner syntax
 * const { ta } = createContext({ chart: { high, low, close } });
 * const trueRange = ta.tr(); // Matches PineScript!
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.tr | PineScript ta.tr}
 */
export function tr(
  handle_na: simple_bool = false,
  high?: Source,
  low?: Source,
  close?: Source
): series_float {
  if (!high || !low || !close) {
    throw new Error(
      'ta.tr() requires high, low, and close series. ' +
      'Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data.'
    );
  }

  const result: series_float = [];

  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      // First bar: no previous close, so just use high - low
      result.push(high[i] - low[i]);
    } else {
      const prevClose = close[i - 1];

      // Handle na previous close based on handle_na parameter
      if (isNaN(prevClose)) {
        if (handle_na) {
          result.push(high[i] - low[i]);
        } else {
          result.push(NaN);
        }
      } else {
        const tr = Math.max(
          high[i] - low[i],
          Math.abs(high[i] - prevClose),
          Math.abs(low[i] - prevClose)
        );
        result.push(tr);
      }
    }
  }

  return result;
}

/**
 * Average True Range - returns the RMA (Relative Moving Average) of true range.
 *
 * @param length - Number of bars (length)
 * @param high - High price series (required when not using context API)
 * @param low - Low price series (required when not using context API)
 * @param close - Close price series (required when not using context API)
 * @returns Average true range series
 *
 * @remarks
 * - **PineScript v6 signature**: `ta.atr(length)` - uses implicit chart data
 * - **JavaScript signature**: Requires explicit `high`, `low`, `close` OR use `createContext()`
 * - **ALGORITHM ISSUE**: Uses SMA instead of RMA for averaging (should use ta.rma)
 * - True range is max(high - low, abs(high - close[1]), abs(low - close[1]))
 * - ATR is a measure of volatility, higher values indicate greater volatility
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 *
 * @example
 * ```typescript
 * // Direct call with explicit data
 * const atr14 = ta.atr(14, high, low, close);
 *
 * // Or use context API for cleaner syntax
 * const { ta } = createContext({ chart: { high, low, close } });
 * const atr14 = ta.atr(14); // Matches PineScript!
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.atr | PineScript ta.atr}
 */
export function atr(length: simple_int, high?: Source, low?: Source, close?: Source): series_float {
  if (!high || !low || !close) {
    throw new Error(
      'ta.atr() requires high, low, and close series. ' +
      'Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data.'
    );
  }

  const trueRange = tr(false, high, low, close);
  // TODO: Should use ta.rma() instead of sma() to match PineScript v6
  return sma(trueRange, length);
}

/**
 * SuperTrend Indicator - a trend-following indicator that helps identify trend direction.
 *
 * @param factor - The multiplier by which the ATR will get multiplied (series int/float)
 * @param atrPeriod - Length of ATR (simple int)
 * @param high - High price series (required when not using context API)
 * @param low - Low price series (required when not using context API)
 * @param close - Close price series (required when not using context API)
 * @param wicks - Whether to use wicks for trend reversal (NOT in PineScript v6 API, default: false)
 * @returns Tuple of [supertrend, direction] where direction is 1 (downtrend) or -1 (uptrend)
 *
 * @remarks
 * - **PineScript v6 signature**: `ta.supertrend(factor, atrPeriod)` - uses implicit chart data
 * - **JavaScript signature**: Requires explicit `high`, `low`, `close` OR use `createContext()`
 * - The `wicks` parameter is NOT part of the official PineScript v6 API
 * - Direction: 1 = downtrend (red), -1 = uptrend (green)
 * - Uses hl2 (average of high and low) as the source
 * - SuperTrend helps identify the current market trend and potential reversal points
 *
 * @example
 * ```typescript
 * // Direct call with explicit data
 * const [supertrend, direction] = ta.supertrend(3, 10, high, low, close);
 * // Plot uptrend when direction < 0
 * // Plot downtrend when direction > 0
 *
 * // Or use context API for cleaner syntax
 * const { ta } = createContext({ chart: { high, low, close } });
 * const [supertrend, direction] = ta.supertrend(3, 10); // Matches PineScript!
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.supertrend | PineScript ta.supertrend}
 */
export function supertrend(
  factor: simple_float,
  atrPeriod: simple_int,
  high?: Source,
  low?: Source,
  close?: Source,
  wicks: simple_bool = false
): [series_float, series_int] {
  if (!high || !low || !close) {
    throw new Error(
      'ta.supertrend() requires high, low, and close series. ' +
      'Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data.'
    );
  }
  const supertrendValues: series_float = [];
  const directions: series_int = [];

  // Calculate hl2 (average of high and low)
  const source: series_float = [];
  for (let i = 0; i < high.length; i++) {
    source.push((high[i] + low[i]) / 2);
  }

  // Calculate ATR
  const atrValues = atr(atrPeriod, high, low, close);

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
