/**
 * Technical Analysis (ta) namespace
 * Mirrors PineScript's ta.* functions for technical analysis indicators and calculations.
 *
 * @remarks
 * All technical analysis functions in this namespace follow PineScript v6 API specifications.
 *
 * @version 6
 */

import { series_float, series_bool, series_int, int, Source, simple_int, simple_float, simple_bool } from '../types';

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
export function sma(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = 0; j < length; j++) {
        sum += source[i - j]!;
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
    ema += source[i]!;
  }
  ema = ema / Math.min(length, source.length);

  for (let i = 0; i < source.length; i++) {
    if (i === 0) {
      result.push(source[i]!);
      ema = source[i]!;
    } else {
      ema = (source[i]! - ema) * multiplier + ema;
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
 * - Uses `ta.rma()` (Relative Moving Average) for smoothing, matching PineScript v6
 * - Formula: RSI = 100 - (100 / (1 + RS)), where RS = Average Gain / Average Loss
 * - Average Gain and Average Loss are calculated using RMA (alpha = 1 / length)
 * - `na` values in the source series are ignored
 *
 * @example
 * ```typescript
 * const rsi14 = ta.rsi(closePrices, 14);
 * // Identify overbought/oversold conditions
 * const overbought = rsi14.map(v => v > 70);
 * const oversold = rsi14.map(v => v < 30);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.rsi | PineScript ta.rsi}
 */
export function rsi(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < source.length; i++) {
    changes.push(source[i]! - source[i - 1]!);
  }

  // Separate gains and losses
  const gains: number[] = changes.map(c => c > 0 ? c : 0);
  const losses: number[] = changes.map(c => c < 0 ? -c : 0);

  // Calculate average gains and losses using RMA (not SMA)
  const avgGains = rma(gains, length);
  const avgLosses = rma(losses, length);

  result.push(NaN); // First value is NaN

  for (let i = 0; i < avgGains.length; i++) {
    if (avgLosses[i]! === 0) {
      result.push(100);
    } else {
      const rs = avgGains[i]! / avgLosses[i]!;
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
    macdLine.push(fastEma[i]! - slowEma[i]!);
  }

  const signalLine = ema(macdLine, signalLength);

  const histogram: series_float = [];
  for (let i = 0; i < source.length; i++) {
    histogram.push(macdLine[i]! - signalLine[i]!);
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
  length: simple_int,
  mult: simple_float
): [series_float, series_float, series_float] {
  const basis = sma(series, length);
  const dev = stdev(series, length);

  const upper: series_float = [];
  const lower: series_float = [];

  for (let i = 0; i < series.length; i++) {
    upper.push(basis[i]! + mult * dev[i]!);
    lower.push(basis[i]! - mult * dev[i]!);
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
export function stdev(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  const avg = sma(source, length);

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let sumSquares = 0;
      for (let j = 0; j < length; j++) {
        const diff = source[i - j]! - avg[i]!;
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
 * - True when: series1[i]! > series2[i]! AND series1[i-1] <= series2[i-1]
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
      result.push(series1[i]! > series2[i]! && series1[i - 1]! <= series2[i - 1]!);
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
 * - True when: series1[i]! < series2[i]! AND series1[i-1] >= series2[i-1]
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
      result.push(series1[i]! < series2[i]! && series1[i - 1]! >= series2[i - 1]!);
    }
  }

  return result;
}

/**
 * Change - calculates the difference between the current value and its value length bars ago.
 *
 * @param source - Series of values to process
 * @param length - Number of bars back (default: 1)
 * @returns Change series (source[i]! - source[i - length])
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
export function change(source: Source, length: simple_int = 1): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
    } else {
      result.push(source[i]! - source[i - length]!);
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
      result.push(high[i]! - low[i]!);
    } else {
      const prevClose = close[i - 1]!;

      // Handle na previous close based on handle_na parameter
      if (isNaN(prevClose)) {
        if (handle_na) {
          result.push(high[i]! - low[i]!);
        } else {
          result.push(NaN);
        }
      } else {
        const tr = Math.max(
          high[i]! - low[i]!,
          Math.abs(high[i]! - prevClose),
          Math.abs(low[i]! - prevClose)
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
 * - Uses `ta.rma()` (Relative Moving Average) for smoothing, matching PineScript v6
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
  return rma(trueRange, length);
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
    source.push((high[i]! + low[i]!) / 2);
  }

  // Calculate ATR
  const atrValues = atr(atrPeriod, high, low, close);

  // Track previous values across iterations
  let prevLowerBand = NaN;
  let prevUpperBand = NaN;
  let prevSuperTrend = NaN;

  for (let i = 0; i < source.length; i++) {
    const atrValue = atrValues[i]! * factor;

    // Skip calculation if ATR is not available yet
    if (isNaN(atrValue)) {
      supertrendValues.push(NaN);
      directions.push(1);
      continue;
    }

    // Calculate initial bands
    let upperBand = source[i]! + atrValue;
    let lowerBand = source[i]! - atrValue;

    // Determine which price to use for comparison
    const highPrice = wicks ? high[i]! : close[i]!;
    const lowPrice = wicks ? low[i]! : close[i]!;
    const prevLowPrice = i > 0 ? (wicks ? low[i - 1]! : close[i - 1]!) : 0;
    const prevHighPrice = i > 0 ? (wicks ? high[i - 1]! : close[i - 1]!) : 0;

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
/**
 * Relative Moving Average (RMA) - exponentially weighted moving average with alpha = 1 / length.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns RMA of source for length bars back
 *
 * @remarks
 * - Moving average used in RSI calculation
 * - Alpha = 1 / length (different from EMA which uses alpha = 2 / (length + 1))
 * - First value is initialized with SMA, then uses exponential smoothing
 * - Formula: `RMA = alpha * source + (1 - alpha) * RMA[1]`
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 *
 * @example
 * ```typescript
 * const rma14 = ta.rma(closePrices, 14);
 * // Used internally by RSI:
 * // avgGain = ta.rma(gains, 14);
 * // avgLoss = ta.rma(losses, 14);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.rma | PineScript ta.rma}
 */
export function rma(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  const alpha = 1 / length;

  // Initialize with SMA for the first value
  let rmaValue = 0;
  for (let i = 0; i < Math.min(length, source.length); i++) {
    rmaValue += source[i]!;
  }
  rmaValue = rmaValue / Math.min(length, source.length);

  for (let i = 0; i < source.length; i++) {
    if (i === 0) {
      result.push(rmaValue);
    } else {
      // RMA formula: alpha * source + (1 - alpha) * RMA[1]
      rmaValue = alpha * source[i]! + (1 - alpha) * rmaValue;
      result.push(rmaValue);
    }
  }

  return result;
}

/**
 * Weighted Moving Average (WMA) - moving average with linearly decreasing weights.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns WMA of source for length bars back
 *
 * @remarks
 * - Weighting factors decrease in arithmetical progression
 * - Most recent value has weight `length`, previous has `length-1`, etc.
 * - Formula: `sum(source[i]! * (length - i)) / sum(length - i)` for i = 0 to length-1
 * - `na` values in the source series are ignored
 * - More responsive to recent price changes than SMA
 *
 * @example
 * ```typescript
 * const wma20 = ta.wma(closePrices, 20);
 * // WMA gives more weight to recent prices
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.wma | PineScript ta.wma}
 */
export function wma(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      let weightSum = 0;

      for (let j = 0; j < length; j++) {
        const weight = length - j;
        sum += source[i - j]! * weight;
        weightSum += weight;
      }

      result.push(sum / weightSum);
    }
  }

  return result;
}

/**
 * Highest Value - returns the highest value over a specified number of bars.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Series containing the highest value for each bar
 *
 * @remarks
 * - Returns the maximum value in the lookback window
 * - `na` values in the source series are ignored
 * - Returns NaN for the first (length - 1) bars where there's insufficient data
 *
 * @example
 * ```typescript
 * const highest20 = ta.highest(closePrices, 20);
 * // Find resistance level
 * const resistance = ta.highest(high, 50);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.highest | PineScript ta.highest}
 */
export function highest(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let max = -Infinity;
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j]!)) {
          max = Math.max(max, source[i - j]!);
        }
      }
      result.push(max === -Infinity ? NaN : max);
    }
  }

  return result;
}

/**
 * Lowest Value - returns the lowest value over a specified number of bars.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Series containing the lowest value for each bar
 *
 * @remarks
 * - Returns the minimum value in the lookback window
 * - `na` values in the source series are ignored
 * - Returns NaN for the first (length - 1) bars where there's insufficient data
 *
 * @example
 * ```typescript
 * const lowest20 = ta.lowest(closePrices, 20);
 * // Find support level
 * const support = ta.lowest(low, 50);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.lowest | PineScript ta.lowest}
 */
export function lowest(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let min = Infinity;
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j]!)) {
          min = Math.min(min, source[i - j]!);
        }
      }
      result.push(min === Infinity ? NaN : min);
    }
  }

  return result;
}

/**
 * Cumulative Sum - returns the total sum of all elements from the beginning.
 *
 * @param source - Series of values to process
 * @returns Series containing the cumulative sum at each bar
 *
 * @remarks
 * - Returns the running total of all values from index 0 to current index
 * - Each value is the sum of all previous values plus the current value
 * - Useful for calculating total volume, total trades, etc.
 *
 * @example
 * ```typescript
 * const cumulativeVolume = ta.cum(volume);
 * const totalGains = ta.cum(gains);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.cum | PineScript ta.cum}
 */
export function cum(source: Source): series_float {
  const result: series_float = [];
  let sum = 0;

  for (let i = 0; i < source.length; i++) {
    sum += source[i]!;
    result.push(sum);
  }

  return result;
}

/**
 * Cross - returns true when two series cross each other (either direction).
 *
 * @param source1 - First series
 * @param source2 - Second series
 * @returns Boolean series (true at cross points)
 *
 * @remarks
 * - True when: (source1[i]! > source2[i]! AND source1[i-1] <= source2[i-1]) OR
 *              (source1[i]! < source2[i]! AND source1[i-1] >= source2[i-1])
 * - First value is always false (no previous value to compare)
 * - Detects any crossing (either over or under)
 * - Use `ta.crossover()` or `ta.crossunder()` for directional crosses
 *
 * @example
 * ```typescript
 * const crossed = ta.cross(fastMA, slowMA);
 * // Detect any MA crossover
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.cross | PineScript ta.cross}
 */
export function cross(source1: Source, source2: Source): series_bool {
  const result: series_bool = [];

  for (let i = 0; i < source1.length; i++) {
    if (i === 0) {
      result.push(false);
    } else {
      const crossedUp = source1[i]! > source2[i]! && source1[i - 1]! <= source2[i - 1]!;
      const crossedDown = source1[i]! < source2[i]! && source1[i - 1]! >= source2[i - 1]!;
      result.push(crossedUp || crossedDown);
    }
  }

  return result;
}

/**
 * Rising - returns true if source is rising for length bars.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Boolean series (true when rising)
 *
 * @remarks
 * - True if current source is greater than any previous source for length bars back
 * - Checks if value is consistently rising over the period
 * - `na` values in the source series are ignored
 * - Returns false for the first (length - 1) bars
 *
 * @example
 * ```typescript
 * const isRising = ta.rising(close, 3);
 * // Detect upward momentum
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.rising | PineScript ta.rising}
 */
export function rising(source: Source, length: simple_int): series_bool {
  const result: series_bool = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(false);
    } else {
      let isRising = true;
      for (let j = 1; j <= length; j++) {
        if (source[i - j + 1]! <= source[i - j]!) {
          isRising = false;
          break;
        }
      }
      result.push(isRising);
    }
  }

  return result;
}

/**
 * Falling - returns true if source is falling for length bars.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Boolean series (true when falling)
 *
 * @remarks
 * - True if current source is less than any previous source for length bars back
 * - Checks if value is consistently falling over the period
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 * - Returns false for the first (length - 1) bars
 *
 * @example
 * ```typescript
 * const isFalling = ta.falling(close, 3);
 * // Detect downward momentum
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.falling | PineScript ta.falling}
 */
export function falling(source: Source, length: simple_int): series_bool {
  const result: series_bool = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(false);
    } else {
      let isFalling = true;
      for (let j = 1; j <= length; j++) {
        if (source[i - j + 1]! >= source[i - j]!) {
          isFalling = false;
          break;
        }
      }
      result.push(isFalling);
    }
  }

  return result;
}

/**
 * Rate of Change (ROC) - percentage change between current value and value length bars ago.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns ROC series as percentage
 *
 * @remarks
 * - Formula: `100 * change(source, length) / source[length]`
 * - Equivalent to: `100 * (source - source[length]) / source[length]`
 * - Returns percentage change, e.g., 5.0 means 5% increase
 * - `na` values in the source series are included in calculations and will produce an `na` result
 * - Useful for momentum analysis and trend strength measurement
 *
 * @example
 * ```typescript
 * const roc10 = ta.roc(closePrices, 10);
 * // Positive ROC indicates upward momentum
 * // Negative ROC indicates downward momentum
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.roc | PineScript ta.roc}
 */
export function roc(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
    } else {
      const oldValue = source[i - length]!;
      if (oldValue === 0 || isNaN(oldValue) || isNaN(source[i]!)) {
        result.push(NaN);
      } else {
        const changeValue = source[i]! - oldValue;
        result.push((100 * changeValue) / oldValue);
      }
    }
  }

  return result;
}

/**
 * Momentum (MOM) - difference between current value and value length bars ago.
 *
 * @param source - Series of values to process
 * @param length - Offset from current bar to previous bar
 * @returns Momentum series
 *
 * @remarks
 * - Formula: `source - source[length]`
 * - Equivalent to `ta.change(source, length)`
 * - Positive momentum indicates upward movement
 * - Negative momentum indicates downward movement
 * - `na` values in the source series are included in calculations and will produce an `na` result
 *
 * @example
 * ```typescript
 * const mom10 = ta.mom(closePrices, 10);
 * // Measures raw price momentum over 10 bars
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.mom | PineScript ta.mom}
 */
export function mom(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
    } else {
      if (isNaN(source[i]!) || isNaN(source[i - length]!)) {
        result.push(NaN);
      } else {
        result.push(source[i]! - source[i - length]!);
      }
    }
  }

  return result;
}

/**
 * Mean Absolute Deviation - measure of difference between series and its SMA.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Mean absolute deviation series
 *
 * @remarks
 * - Measures average absolute distance from the mean
 * - Formula: `sum(abs(source[i]! - sma)) / length` for i in 0 to length-1
 * - Less sensitive to outliers than standard deviation
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 *
 * @example
 * ```typescript
 * const dev10 = ta.dev(closePrices, 10);
 * // Measures volatility using mean absolute deviation
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.dev | PineScript ta.dev}
 */
export function dev(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  const meanValues = sma(source, length);

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1 || isNaN(meanValues[i]!)) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j]!)) {
          sum += Math.abs(source[i - j]! - meanValues[i]!);
        }
      }
      result.push(sum / length);
    }
  }

  return result;
}

/**
 * Variance - expectation of squared deviation from mean.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @param biased - Use biased (true) or unbiased (false) estimate (default: true)
 * @returns Variance series
 *
 * @remarks
 * - Measures how far values are spread out from their mean
 * - If `biased` is true: divides by `length` (population variance)
 * - If `biased` is false: divides by `length - 1` (sample variance)
 * - Formula (biased): `sum((source[i]! - mean)^2) / length`
 * - Formula (unbiased): `sum((source[i]! - mean)^2) / (length - 1)`
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 * - Relationship: `stdev = sqrt(variance)`
 *
 * @example
 * ```typescript
 * const variance20 = ta.variance(closePrices, 20);
 * const sampleVariance = ta.variance(closePrices, 20, false);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.variance | PineScript ta.variance}
 */
export function variance(source: Source, length: simple_int, biased: simple_bool = true): series_float {
  const result: series_float = [];
  const meanValues = sma(source, length);

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1 || isNaN(meanValues[i]!)) {
      result.push(NaN);
    } else {
      let sumSquares = 0;
      let count = 0;
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j]!)) {
          const diff = source[i - j]! - meanValues[i]!;
          sumSquares += diff * diff;
          count++;
        }
      }
      const divisor = biased ? count : count - 1;
      result.push(divisor > 0 ? sumSquares / divisor : NaN);
    }
  }

  return result;
}

/**
 * Median - returns the median (middle value) of the series.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Median series
 *
 * @remarks
 * - Returns the middle value when values are sorted
 * - For even-length series, returns average of two middle values
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 * - More robust to outliers than mean (SMA)
 *
 * @example
 * ```typescript
 * const median20 = ta.median(closePrices, 20);
 * // Median is less affected by extreme values than SMA
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.median | PineScript ta.median}
 */
export function median(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      // Collect non-NaN values
      const values: number[] = [];
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j]!)) {
          values.push(source[i - j]!);
        }
      }

      if (values.length === 0) {
        result.push(NaN);
      } else {
        // Sort values
        values.sort((a, b) => a - b);
        
        // Calculate median
        const mid = Math.floor(values.length / 2);
        if (values.length % 2 === 0) {
          // Even number of values - average of two middle values
          result.push((values[mid - 1]! + values[mid]!) / 2);
        } else {
          // Odd number of values - middle value
          result.push(values[mid]!);
        }
      }
    }
  }

  return result;
}

/**
 * Symmetrically Weighted Moving Average (SWMA) - fixed length 4 with symmetric weights.
 *
 * @param source - Series of values to process
 * @returns SWMA series
 *
 * @remarks
 * - Fixed length of 4 bars
 * - Weights: [1/6, 2/6, 2/6, 1/6] (symmetric)
 * - Formula: `source[3] * 1/6 + source[2] * 2/6 + source[1] * 2/6 + source[0] * 1/6`
 * - More weight given to middle values
 * - `na` values in the source series are included in calculations and will produce an `na` result
 * - Returns NaN for the first 3 bars
 *
 * @example
 * ```typescript
 * const swma = ta.swma(closePrices);
 * // Smoothed price with symmetric weighting
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.swma | PineScript ta.swma}
 */
export function swma(source: Source): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < 3) {
      result.push(NaN);
    } else {
      // Check for any NaN values in the window
      if (isNaN(source[i]!) || isNaN(source[i - 1]!) || isNaN(source[i - 2]!) || isNaN(source[i - 3]!)) {
        result.push(NaN);
      } else {
        const value = 
          source[i - 3]! * (1 / 6) +
          source[i - 2]! * (2 / 6) +
          source[i - 1]! * (2 / 6) +
          source[i]! * (1 / 6);
        result.push(value);
      }
    }
  }

  return result;
}

/**
 * Volume Weighted Moving Average (VWMA) - moving average weighted by volume.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @param volume - Volume series (required when not using context API)
 * @returns VWMA series
 *
 * @remarks
 * - **PineScript v6 signature**: `ta.vwma(source, length)` - uses implicit volume data
 * - **JavaScript signature**: Requires explicit `volume` OR use `createContext()`
 * - Formula: `sma(source * volume, length) / sma(volume, length)`
 * - Gives more weight to bars with higher volume
 * - `na` values in the source series are ignored
 * - Useful for price analysis considering volume significance
 *
 * @example
 * ```typescript
 * // Direct call with explicit volume
 * const vwma20 = ta.vwma(closePrices, 20, volumeData);
 *
 * // Or use context API for cleaner syntax
 * const { ta } = createContext({ chart: { high, low, close, volume } });
 * const vwma20 = ta.vwma(close, 20); // Matches PineScript!
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.vwma | PineScript ta.vwma}
 */
export function vwma(source: Source, length: simple_int, volume?: Source): series_float {
  if (!volume) {
    throw new Error(
      'ta.vwma() requires volume series. ' +
      'Either pass it explicitly or use createContext({ chart: { ..., volume } }) for implicit data.'
    );
  }

  // Calculate source * volume
  const sourceTimesVolume: series_float = [];
  for (let i = 0; i < source.length; i++) {
    sourceTimesVolume.push(source[i]! * volume[i]!);
  }

  const numerator = sma(sourceTimesVolume, length);
  const denominator = sma(volume, length);

  const result: series_float = [];
  for (let i = 0; i < source.length; i++) {
    if (denominator[i]! === 0 || isNaN(denominator[i]!)) {
      result.push(NaN);
    } else {
      result.push(numerator[i]! / denominator[i]!);
    }
  }

  return result;
}

/**
 * Linear Regression - line that best fits prices using least squares method.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @param offset - Offset (default: 0)
 * @returns Linear regression value
 *
 * @remarks
 * - Calculates line of best fit using least squares method
 * - Formula: `linreg = intercept + slope * (length - 1 - offset)`
 * - offset=0 gives current fitted value, offset<0 gives future projection
 * - `na` values in the source series are included in calculations and will produce an `na` result
 * - Useful for trend detection and prediction
 *
 * @example
 * ```typescript
 * const linreg20 = ta.linreg(closePrices, 20, 0);
 * const linregFuture = ta.linreg(closePrices, 20, -5); // Project 5 bars ahead
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.linreg | PineScript ta.linreg}
 */
export function linreg(source: Source, length: simple_int, offset: simple_int = 0): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      // Check for NaN values in window
      let hasNaN = false;
      for (let j = 0; j < length; j++) {
        if (isNaN(source[i - j]!)) {
          hasNaN = true;
          break;
        }
      }

      if (hasNaN) {
        result.push(NaN);
      } else {
        // Calculate least squares regression
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;

        for (let j = 0; j < length; j++) {
          const x = j;
          const y = source[i - (length - 1 - j)]!;
          sumX += x;
          sumY += y;
          sumXY += x * y;
          sumX2 += x * x;
        }

        const slope = (length * sumXY - sumX * sumY) / (length * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / length;

        // Calculate linreg value at offset
        const x = length - 1 - offset;
        result.push(intercept + slope * x);
      }
    }
  }

  return result;
}

/**
 * Correlation Coefficient - measures degree to which two series deviate from their means together.
 *
 * @param source1 - First series
 * @param source2 - Second series  
 * @param length - Number of bars (length)
 * @returns Correlation coefficient (-1 to +1)
 *
 * @remarks
 * - Returns value between -1 and +1
 * - +1 = perfect positive correlation
 * - -1 = perfect negative correlation
 * - 0 = no correlation
 * - Measures linear relationship between two series
 * - `na` values in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 *
 * @example
 * ```typescript
 * const corr = ta.correlation(series1, series2, 20);
 * // Values close to +1 or -1 indicate strong relationship
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.correlation | PineScript ta.correlation}
 */
export function correlation(source1: Source, source2: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source1.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      // Collect non-NaN pairs
      const pairs: Array<[number, number]> = [];
      for (let j = 0; j < length; j++) {
        if (!isNaN(source1[i - j]!) && !isNaN(source2[i - j]!)) {
          pairs.push([source1[i - j]!, source2[i - j]!]);
        }
      }

      if (pairs.length === 0) {
        result.push(NaN);
      } else {
        // Calculate means
        let sum1 = 0;
        let sum2 = 0;
        for (const [v1, v2] of pairs) {
          sum1 += v1;
          sum2 += v2;
        }
        const mean1 = sum1 / pairs.length;
        const mean2 = sum2 / pairs.length;

        // Calculate correlation components
        let numerator = 0;
        let sum1Sq = 0;
        let sum2Sq = 0;

        for (const [v1, v2] of pairs) {
          const dev1 = v1 - mean1;
          const dev2 = v2 - mean2;
          numerator += dev1 * dev2;
          sum1Sq += dev1 * dev1;
          sum2Sq += dev2 * dev2;
        }

        const denominator = Math.sqrt(sum1Sq * sum2Sq);
        if (denominator === 0) {
          result.push(NaN);
        } else {
          result.push(numerator / denominator);
        }
      }
    }
  }

  return result;
}

/**
 * Percent Rank - percentage of how many previous values were less than or equal to current value.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Percent rank (0 to 100)
 *
 * @remarks
 * - Returns value between 0 and 100
 * - 0 = current value is lowest in the period
 * - 100 = current value is highest in the period
 * - 50 = current value is at median
 * - Useful for identifying relative strength within a period
 * - `na` values in the source series are included in calculations and will produce an `na` result
 *
 * @example
 * ```typescript
 * const pctrank = ta.percentrank(closePrices, 100);
 * // Values near 100 indicate recent strength
 * // Values near 0 indicate recent weakness
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.percentrank | PineScript ta.percentrank}
 */
export function percentrank(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      // Check for NaN values
      let hasNaN = false;
      for (let j = 0; j < length; j++) {
        if (isNaN(source[i - j]!)) {
          hasNaN = true;
          break;
        }
      }

      if (hasNaN) {
        result.push(NaN);
      } else {
        const currentValue = source[i]!;
        let countLessOrEqual = 0;

        // Count how many values are less than or equal to current
        for (let j = 0; j < length; j++) {
          if (source[i - j]! <= currentValue) {
            countLessOrEqual++;
          }
        }

        // Calculate percent rank
        const percentRank = ((countLessOrEqual - 1) / (length - 1)) * 100;
        result.push(percentRank);
      }
    }
  }

  return result;
}

/**
 * Commodity Channel Index (CCI) - measures deviation from average price.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns CCI series
 *
 * @remarks
 * - CCI = (Typical Price - SMA of TP) / (0.015 * Mean Deviation)
 * - Typical Price = (High + Low + Close) / 3
 * - Mean Deviation = Average of absolute differences from mean
 * - Scaled by 0.015 to provide more readable numbers
 * - Values above +100 indicate overbought conditions
 * - Values below -100 indicate oversold conditions
 * - \`na\` values in the source series are ignored
 *
 * @example
 * \`\`\`typescript
 * const cci20 = ta.cci(typicalPrice, 20);
 * // Overbought when cci > 100
 * // Oversold when cci < -100
 * \`\`\`
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.cci | PineScript ta.cci}
 */
export function cci(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  const smaValues = sma(source, length);
  const devValues = dev(source, length);

  for (let i = 0; i < source.length; i++) {
    if (isNaN(smaValues[i]!) || isNaN(devValues[i]!) || devValues[i]! === 0) {
      result.push(NaN);
    } else {
      const cci = (source[i]! - smaValues[i]!) / (0.015 * devValues[i]!);
      result.push(cci);
    }
  }

  return result;
}

/**
 * Stochastic Oscillator - momentum indicator comparing closing price to price range.
 *
 * @param source - Source series (typically close)
 * @param high - High price series
 * @param low - Low price series
 * @param length - Number of bars (length)
 * @returns Stochastic %K series (values range from 0 to 100)
 *
 * @remarks
 * - Formula: 100 * (close - lowest(low, length)) / (highest(high, length) - lowest(low, length))
 * - Measures where close is relative to the high-low range
 * - Values above 80 typically indicate overbought
 * - Values below 20 typically indicate oversold
 * - Returns NaN when range is zero (high equals low)
 * - \`na\` values in the source series are ignored
 *
 * @example
 * \`\`\`typescript
 * const stochK = ta.stoch(close, high, low, 14);
 * // Smooth with SMA for %D line:
 * const stochD = ta.sma(stochK, 3);
 * \`\`\`
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.stoch | PineScript ta.stoch}
 */
export function stoch(source: Source, high: Source, low: Source, length: simple_int): series_float {
  const result: series_float = [];
  const lowestValues = lowest(low, length);
  const highestValues = highest(high, length);

  for (let i = 0; i < source.length; i++) {
    if (isNaN(lowestValues[i]!) || isNaN(highestValues[i]!)) {
      result.push(NaN);
    } else {
      const range = highestValues[i]! - lowestValues[i]!;
      if (range === 0) {
        result.push(NaN);
      } else {
        const stochValue = 100 * (source[i]! - lowestValues[i]!) / range;
        result.push(stochValue);
      }
    }
  }

  return result;
}


/**
 * Money Flow Index (MFI) - volume-weighted RSI measuring buying and selling pressure.
 *
 * @param source - Source series (typically hlc3 or close)
 * @param length - Number of bars (length)
 * @param volume - Volume series (required when not using context API)
 * @returns MFI series (values range from 0 to 100)
 *
 * @remarks
 * - **PineScript v6 signature**: `ta.mfi(source, length)` - uses implicit volume data
 * - **JavaScript signature**: Requires explicit `volume` OR use `createContext()`
 * - Combines price and volume to identify overbought/oversold conditions
 * - Formula: 100 - (100 / (1 + Positive Money Flow / Negative Money Flow))
 * - Values above 80 indicate overbought
 * - Values below 20 indicate oversold
 * - `na` values in the source series are ignored
 *
 * @example
 * ```typescript
 * // Direct call with explicit volume
 * const mfi14 = ta.mfi(hlc3, 14, volume);
 *
 * // Or use context API for cleaner syntax
 * const { ta } = createContext({ chart: { high, low, close, volume } });
 * const mfi14 = ta.mfi(hlc3, 14); // Matches PineScript!
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.mfi | PineScript ta.mfi}
 */
export function mfi(source: Source, length: simple_int, volume?: Source): series_float {
  if (!volume) {
    throw new Error(
      'ta.mfi() requires volume series. ' +
      'Either pass it explicitly or use createContext({ chart: { ..., volume } }) for implicit data.'
    );
  }

  const result: series_float = [];

  const changes: number[] = [NaN];
  for (let i = 1; i < source.length; i++) {
    changes.push(source[i]! - source[i - 1]!);
  }

  const positiveFlow: number[] = [];
  const negativeFlow: number[] = [];

  for (let i = 0; i < source.length; i++) {
    if (i === 0 || isNaN(changes[i]!)) {
      positiveFlow.push(0);
      negativeFlow.push(0);
    } else if (changes[i]! > 0) {
      positiveFlow.push(volume[i]! * source[i]!);
      negativeFlow.push(0);
    } else if (changes[i]! < 0) {
      positiveFlow.push(0);
      negativeFlow.push(volume[i]! * source[i]!);
    } else {
      positiveFlow.push(0);
      negativeFlow.push(0);
    }
  }

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
    } else {
      let posSum = 0;
      let negSum = 0;

      for (let j = 0; j < length; j++) {
        posSum += positiveFlow[i - j]!;
        negSum += negativeFlow[i - j]!;
      }

      if (negSum === 0) {
        result.push(100);
      } else {
        const moneyRatio = posSum / negSum;
        const mfiValue = 100 - (100 / (1 + moneyRatio));
        result.push(mfiValue);
      }
    }
  }

  return result;
}

/**
 * Hull Moving Average (HMA) - improved moving average with reduced lag.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Hull moving average series
 *
 * @remarks
 * - Formula: WMA(2 * WMA(src, len/2) - WMA(src, len), sqrt(len))
 * - Significantly reduces lag compared to traditional moving averages
 * - Smoother than WMA while being more responsive
 * - Created by Alan Hull
 * - `na` values in the source series are ignored
 *
 * @example
 * ```typescript
 * const hma20 = ta.hma(closePrices, 20);
 * // Faster response to price changes than SMA or EMA
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.hma | PineScript ta.hma}
 */
export function hma(source: Source, length: simple_int): series_float {
  const halfLength = Math.floor(length / 2);
  const sqrtLength = Math.floor(Math.sqrt(length));

  const wmaHalf = wma(source, halfLength);
  const wmaFull = wma(source, length);

  const diff: series_float = [];
  for (let i = 0; i < source.length; i++) {
    diff.push(2 * wmaHalf[i]! - wmaFull[i]!);
  }

  return wma(diff, sqrtLength);
}

/**
 * Parabolic SAR (Stop and Reverse) - trend-following indicator.
 *
 * @param start - Acceleration factor start value (typically 0.02)
 * @param inc - Acceleration factor increment (typically 0.02)
 * @param max - Maximum acceleration factor (typically 0.2)
 * @param high - High price series (required when not using context API)
 * @param low - Low price series (required when not using context API)
 * @param close - Close price series (required when not using context API)
 * @returns SAR series
 *
 * @remarks
 * - **PineScript v6 signature**: `ta.sar(start, inc, max)` - uses implicit chart data
 * - **JavaScript signature**: Requires explicit `high`, `low`, `close` OR use `createContext()`
 * - SAR below price indicates uptrend, above price indicates downtrend
 * - Created by J. Welles Wilder Jr.
 *
 * @example
 * ```typescript
 * const sar = ta.sar(0.02, 0.02, 0.2, high, low, close);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.sar | PineScript ta.sar}
 */
export function sar(
  start: simple_float,
  inc: simple_float,
  max: simple_float,
  high?: Source,
  low?: Source,
  close?: Source
): series_float {
  if (!high || !low || !close) {
    throw new Error(
      'ta.sar() requires high, low, and close series. ' +
      'Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data.'
    );
  }

  const result: series_float = [];
  let sarValue = NaN;
  let extremePoint = NaN;
  let acceleration = start;
  let isUpTrend = false;
  let isFirstTrendBar = false;

  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      result.push(NaN);
      continue;
    }

    if (i === 1) {
      if (close[i]! > close[i - 1]!) {
        isUpTrend = true;
        extremePoint = high[i]!;
        sarValue = low[i - 1]!;
      } else {
        isUpTrend = false;
        extremePoint = low[i]!;
        sarValue = high[i - 1]!;
      }
      isFirstTrendBar = true;
      acceleration = start;
    }

    sarValue = sarValue + acceleration * (extremePoint - sarValue);

    if (isUpTrend) {
      if (sarValue > low[i]!) {
        isFirstTrendBar = true;
        isUpTrend = false;
        sarValue = Math.max(high[i]!, extremePoint);
        extremePoint = low[i]!;
        acceleration = start;
      }
    } else {
      if (sarValue < high[i]!) {
        isFirstTrendBar = true;
        isUpTrend = true;
        sarValue = Math.min(low[i]!, extremePoint);
        extremePoint = high[i]!;
        acceleration = start;
      }
    }

    if (!isFirstTrendBar) {
      if (isUpTrend) {
        if (high[i]! > extremePoint) {
          extremePoint = high[i]!;
          acceleration = Math.min(acceleration + inc, max);
        }
      } else {
        if (low[i]! < extremePoint) {
          extremePoint = low[i]!;
          acceleration = Math.min(acceleration + inc, max);
        }
      }
    }

    if (isUpTrend) {
      sarValue = Math.min(sarValue, low[i - 1]!);
      if (i > 1) {
        sarValue = Math.min(sarValue, low[i - 2]!);
      }
    } else {
      sarValue = Math.max(sarValue, high[i - 1]!);
      if (i > 1) {
        sarValue = Math.max(sarValue, high[i - 2]!);
      }
    }

    result.push(sarValue);
    isFirstTrendBar = false;
  }

  return result;
}

/**
 * Pivot High - detects pivot high points in the price series.
 *
 * @param sourceOrLeftbars - Source series or leftbars (overloaded)
 * @param leftbarsOrRightbars - Leftbars or rightbars (overloaded)
 * @param rightbars - Number of bars to the right (optional)
 * @param high - High price series (used in 2-param version)
 * @returns Series with pivot high values (NaN when no pivot detected)
 *
 * @remarks
 * - Detects local maximum points
 * - Returns NaN when no pivot is detected
 * - Useful for identifying resistance levels
 *
 * @example
 * ```typescript
 * const pivotHighs = ta.pivothigh(high, 2, 2);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.pivothigh | PineScript ta.pivothigh}
 */
export function pivothigh(
  sourceOrLeftbars: Source | simple_int,
  leftbarsOrRightbars: simple_int,
  rightbars?: simple_int,
  high?: Source
): series_float {
  let source: Source;
  let leftbars: simple_int;
  let right: simple_int;

  if (rightbars === undefined) {
    if (!high) {
      throw new Error('ta.pivothigh() requires high series when using two-parameter version.');
    }
    source = high;
    leftbars = sourceOrLeftbars as simple_int;
    right = leftbarsOrRightbars;
  } else {
    source = sourceOrLeftbars as Source;
    leftbars = leftbarsOrRightbars;
    right = rightbars;
  }

  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < leftbars || i + right >= source.length) {
      result.push(NaN);
      continue;
    }

    const centerValue = source[i]!;
    let isPivot = true;

    for (let j = 1; j <= leftbars; j++) {
      if (source[i - j]! >= centerValue) {
        isPivot = false;
        break;
      }
    }

    if (isPivot) {
      for (let j = 1; j <= right; j++) {
        if (source[i + j]! >= centerValue) {
          isPivot = false;
          break;
        }
      }
    }

    result.push(isPivot ? centerValue : NaN);
  }

  return result;
}

/**
 * Pivot Low - detects pivot low points in the price series.
 *
 * @param sourceOrLeftbars - Source series or leftbars (overloaded)
 * @param leftbarsOrRightbars - Leftbars or rightbars (overloaded)
 * @param rightbars - Number of bars to the right (optional)
 * @param low - Low price series (used in 2-param version)
 * @returns Series with pivot low values (NaN when no pivot detected)
 *
 * @remarks
 * - Detects local minimum points
 * - Returns NaN when no pivot is detected
 * - Useful for identifying support levels
 *
 * @example
 * ```typescript
 * const pivotLows = ta.pivotlow(low, 2, 2);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.pivotlow | PineScript ta.pivotlow}
 */
export function pivotlow(
  sourceOrLeftbars: Source | simple_int,
  leftbarsOrRightbars: simple_int,
  rightbars?: simple_int,
  low?: Source
): series_float {
  let source: Source;
  let leftbars: simple_int;
  let right: simple_int;

  if (rightbars === undefined) {
    if (!low) {
      throw new Error('ta.pivotlow() requires low series when using two-parameter version.');
    }
    source = low;
    leftbars = sourceOrLeftbars as simple_int;
    right = leftbarsOrRightbars;
  } else {
    source = sourceOrLeftbars as Source;
    leftbars = leftbarsOrRightbars;
    right = rightbars;
  }

  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < leftbars || i + right >= source.length) {
      result.push(NaN);
      continue;
    }

    const centerValue = source[i]!;
    let isPivot = true;

    for (let j = 1; j <= leftbars; j++) {
      if (source[i - j]! <= centerValue) {
        isPivot = false;
        break;
      }
    }

    if (isPivot) {
      for (let j = 1; j <= right; j++) {
        if (source[i + j]! <= centerValue) {
          isPivot = false;
          break;
        }
      }
    }

    result.push(isPivot ? centerValue : NaN);
  }

  return result;
}

/**
 * Bars Since - returns number of bars since condition was true.
 *
 * @param condition - Boolean series condition
 * @returns Series with number of bars since condition was last true
 *
 * @remarks
 * - Returns 0 when condition is currently true
 * - Increments by 1 for each bar condition remains false
 * - Returns NaN if condition has never been true
 *
 * @example
 * ```typescript
 * const crossovers = ta.crossover(fastMA, slowMA);
 * const barsSinceCross = ta.barssince(crossovers);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.barssince | PineScript ta.barssince}
 */
export function barssince(condition: series_bool): series_float {
  const result: series_float = [];
  let barsSinceTrue = NaN;

  for (let i = 0; i < condition.length; i++) {
    if (condition[i]!) {
      barsSinceTrue = 0;
    } else if (!isNaN(barsSinceTrue)) {
      barsSinceTrue++;
    }
    result.push(barsSinceTrue);
  }

  return result;
}

/**
 * Value When - returns the value when condition was true.
 *
 * @param condition - Boolean series condition
 * @param source - Source series to get value from
 * @param occurrence - Which occurrence to get (0 = most recent)
 * @returns Series with values from when condition was true
 *
 * @remarks
 * - occurrence=0 returns value from most recent true condition
 * - occurrence=1 returns value from second most recent, etc.
 * - Returns NaN if condition hasn't been true occurrence+1 times yet
 *
 * @example
 * ```typescript
 * const crossovers = ta.crossover(fastMA, slowMA);
 * const lastCrossPrice = ta.valuewhen(crossovers, close, 0);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.valuewhen | PineScript ta.valuewhen}
 */
export function valuewhen(condition: series_bool, source: Source, occurrence: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < condition.length; i++) {
    let occurrenceCount = 0;
    let foundValue = NaN;

    for (let j = i; j >= 0; j--) {
      if (condition[j]) {
        if (occurrenceCount === occurrence) {
          foundValue = source[j]!;
          break;
        }
        occurrenceCount++;
      }
    }

    result.push(foundValue);
  }

  return result;
}

/**
 * Directional Movement Index - returns Directional Movement indicators.
 *
 * @param diLength - DI averaging length
 * @param adxSmoothing - ADX smoothing length
 * @returns Tuple of [plusDI, minusDI, ADX]
 *
 * @remarks
 * - +DI and -DI measure directional movement
 * - ADX measures trend strength (0-100)
 * - ADX above 25 typically indicates strong trend
 * - Requires high, low, and close data from context
 *
 * @example
 * ```typescript
 * const [plusDI, minusDI, adx] = ta.dmi(14, 14);
 * // When +DI > -DI and ADX > 25, strong uptrend
 * // When -DI > +DI and ADX > 25, strong downtrend
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.dmi | PineScript ta.dmi}
 */
export function dmi(
  diLength: simple_int,
  adxSmoothing: simple_int,
  high: Source,
  low: Source,
  close: Source
): [series_float, series_float, series_float] {
  const len = Math.max(high.length, low.length, close.length);
  const plusDM: series_float = [];
  const minusDM: series_float = [];
  const trueRangeValues = tr(false, high, low, close);

  // Calculate +DM and -DM
  for (let i = 0; i < len; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
    } else {
      const upMove = high[i]! - high[i - 1]!;
      const downMove = low[i - 1]! - low[i]!;

      let plusDMVal = 0;
      let minusDMVal = 0;

      if (upMove > downMove && upMove > 0) {
        plusDMVal = upMove;
      }
      if (downMove > upMove && downMove > 0) {
        minusDMVal = downMove;
      }

      plusDM.push(plusDMVal);
      minusDM.push(minusDMVal);
    }
  }

  // Smooth +DM, -DM, and TR using RMA
  const smoothedPlusDM = rma(plusDM, diLength);
  const smoothedMinusDM = rma(minusDM, diLength);
  const smoothedTR = rma(trueRangeValues, diLength);

  // Calculate +DI and -DI
  const plusDI: series_float = [];
  const minusDI: series_float = [];

  for (let i = 0; i < len; i++) {
    if (smoothedTR[i]! === 0) {
      plusDI.push(0);
      minusDI.push(0);
    } else {
      plusDI.push((smoothedPlusDM[i]! / smoothedTR[i]!) * 100);
      minusDI.push((smoothedMinusDM[i]! / smoothedTR[i]!) * 100);
    }
  }

  // Calculate DX
  const dx: series_float = [];
  for (let i = 0; i < len; i++) {
    const sum = plusDI[i]! + minusDI[i]!;
    if (sum === 0) {
      dx.push(0);
    } else {
      dx.push((Math.abs(plusDI[i]! - minusDI[i]!) / sum) * 100);
    }
  }

  // Calculate ADX (smoothed DX)
  const adx = rma(dx, adxSmoothing);

  return [plusDI, minusDI, adx];
}

/**
 * True Strength Index - momentum oscillator based on double smoothed momentum.
 *
 * @param source - Series of values to process
 * @param shortLength - Short smoothing length
 * @param longLength - Long smoothing length
 * @returns TSI series
 *
 * @remarks
 * - TSI oscillates between +100 and -100
 * - Positive values indicate bullish momentum
 * - Negative values indicate bearish momentum
 * - Crossovers of zero line can signal trend changes
 * - Less sensitive to short-term price fluctuations than RSI
 *
 * @example
 * ```typescript
 * const tsi = ta.tsi(close, 13, 25);
 * // TSI > 0: bullish momentum
 * // TSI < 0: bearish momentum
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.tsi | PineScript ta.tsi}
 */
export function tsi(source: Source, shortLength: simple_int, longLength: simple_int): series_float {
  const momentum: series_float = [];

  // Calculate momentum (price change)
  for (let i = 0; i < source.length; i++) {
    if (i === 0) {
      momentum.push(0);
    } else {
      momentum.push(source[i]! - source[i - 1]!);
    }
  }

  // Double smooth momentum
  const smoothedMomentum = ema(ema(momentum, longLength), shortLength);

  // Double smooth absolute momentum
  const absMomentum = momentum.map(Math.abs);
  const smoothedAbsMomentum = ema(ema(absMomentum, longLength), shortLength);

  // Calculate TSI
  const result: series_float = [];
  for (let i = 0; i < source.length; i++) {
    if (smoothedAbsMomentum[i]! === 0) {
      result.push(0);
    } else {
      result.push((smoothedMomentum[i]! / smoothedAbsMomentum[i]!) * 100);
    }
  }

  return result;
}

/**
 * Chande Momentum Oscillator - momentum indicator similar to RSI.
 *
 * @param source - Series of values to process
 * @param length - Number of bars
 * @returns CMO series
 *
 * @remarks
 * - CMO oscillates between +100 and -100
 * - CMO > +50: overbought conditions
 * - CMO < -50: oversold conditions
 * - Unlike RSI, CMO uses sum of gains/losses instead of averages
 * - More volatile than RSI
 *
 * @example
 * ```typescript
 * const cmo = ta.cmo(close, 14);
 * // CMO > 50: overbought
 * // CMO < -50: oversold
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.cmo | PineScript ta.cmo}
 */
export function cmo(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
      continue;
    }

    let sumGains = 0;
    let sumLosses = 0;

    for (let j = 0; j < length; j++) {
      const change = source[i - j]! - source[i - j - 1]!;
      if (change > 0) {
        sumGains += change;
      } else {
        sumLosses += Math.abs(change);
      }
    }

    const totalMovement = sumGains + sumLosses;
    if (totalMovement === 0) {
      result.push(0);
    } else {
      const cmoValue = ((sumGains - sumLosses) / totalMovement) * 100;
      result.push(cmoValue);
    }
  }

  return result;
}

/**
 * Keltner Channels - volatility-based envelope indicator.
 *
 * @param source - Series of values to process
 * @param length - Number of bars for EMA
 * @param mult - Multiplier for the range
 * @param useTrueRange - Use True Range (default: true) or high-low
 * @returns Tuple of [middle, upper, lower]
 *
 * @remarks
 * - Middle band is EMA of source
 * - Upper/lower bands are middle ± (range EMA × multiplier)
 * - When useTrueRange=true, uses ATR for volatility
 * - When useTrueRange=false, uses high-low range
 * - Price breaking out of bands may signal trend continuation
 * - Requires high, low, close data from context when useTrueRange=true
 *
 * @example
 * ```typescript
 * const [middle, upper, lower] = ta.kc(close, 20, 2, true);
 * // Price above upper: potential uptrend
 * // Price below lower: potential downtrend
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.kc | PineScript ta.kc}
 */
export function kc(
  source: Source,
  length: simple_int,
  mult: simple_float,
  useTrueRange: simple_bool = true,
  high?: Source,
  low?: Source,
  close?: Source
): [series_float, series_float, series_float] {
  // Calculate middle band (EMA of source)
  const middle = ema(source, length);

  // Calculate range
  let range: series_float;
  if (useTrueRange) {
    if (!high || !low || !close) {
      throw new Error('ta.kc() with useTrueRange=true requires high, low, and close data');
    }
    range = tr(false, high, low, close);
  } else {
    if (!high || !low) {
      throw new Error('ta.kc() requires high and low data');
    }
    range = [];
    for (let i = 0; i < high.length; i++) {
      range.push(high[i]! - low[i]!);
    }
  }

  // Smooth the range with EMA
  const rangeEma = ema(range, length);

  // Calculate upper and lower bands
  const upper: series_float = [];
  const lower: series_float = [];

  for (let i = 0; i < middle.length; i++) {
    upper.push(middle[i]! + rangeEma[i]! * mult);
    lower.push(middle[i]! - rangeEma[i]! * mult);
  }

  return [middle, upper, lower];
}

/**
 * Bollinger Bands Width - measures the width of Bollinger Bands.
 *
 * @param source - Series of values to process
 * @param length - Number of bars
 * @param mult - Standard deviation multiplier
 * @returns BBW series (percentage)
 *
 * @remarks
 * - BBW = ((upper band - lower band) / middle band) × 100
 * - Low BBW values indicate low volatility (potential breakout setup)
 * - High BBW values indicate high volatility
 * - BBW squeeze (narrowing bands) often precedes strong moves
 * - Works with existing bb() function
 *
 * @example
 * ```typescript
 * const bbw = ta.bbw(close, 20, 2);
 * // Low BBW: potential breakout coming
 * // High BBW: high volatility period
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.bbw | PineScript ta.bbw}
 */
export function bbw(source: Source, length: simple_int, mult: simple_float): series_float {
  const [basis, upper, lower] = bb(source, length, mult);
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (basis[i]! === 0) {
      result.push(NaN);
    } else {
      const width = ((upper[i]! - lower[i]!) / basis[i]!) * 100;
      result.push(width);
    }
  }

  return result;
}

/**
 * Williams %R (Williams Percent Range)
 *
 * Williams %R is a momentum indicator that measures overbought/oversold levels.
 * It compares the closing price to the high-low range over a specified period.
 *
 * Values range from -100 (oversold) to 0 (overbought):
 * - Above -20: Overbought
 * - Below -80: Oversold
 *
 * @param high - High price series
 * @param low - Low price series
 * @param close - Close price series
 * @param length - Lookback period (default: 14)
 * @returns Williams %R series
 *
 * @example
 * ```typescript
 * const wpr = ta.wpr(high, low, close, 14);
 * // wpr < -80: oversold
 * // wpr > -20: overbought
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.wpr | PineScript ta.wpr}
 */
export function wpr(high: Source, low: Source, close: Source, length: simple_int = 14): series_float {
  const result: series_float = [];

  for (let i = 0; i < close.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    // Find highest high and lowest low in the period
    let highestHigh = high[i - length + 1]!;
    let lowestLow = low[i - length + 1]!;

    for (let j = i - length + 2; j <= i; j++) {
      if (high[j]! > highestHigh) highestHigh = high[j]!;
      if (low[j]! < lowestLow) lowestLow = low[j]!;
    }

    const range = highestHigh - lowestLow;
    if (range === 0) {
      result.push(NaN);
    } else {
      // Formula: (Highest High - Close) / (Highest High - Lowest Low) * -100
      const wprValue = ((highestHigh! - close[i]!) / range) * -100;
      result.push(wprValue);
    }
  }

  return result;
}

/**
 * Volume Weighted Average Price (VWAP)
 *
 * VWAP is the average price weighted by volume, typically calculated from market open.
 * It's widely used by institutional traders to assess execution quality.
 *
 * This implementation calculates cumulative VWAP from the beginning of the series.
 * For intraday VWAP (reset at session start), additional session logic is needed.
 *
 * @param source - Price series (typically hlc3 or close)
 * @param volume - Volume series
 * @returns VWAP series
 *
 * @example
 * ```typescript
 * const hlc3 = high.map((h, i) => (h + low[i]! + close[i]!) / 3);
 * const vwapValue = ta.vwap(hlc3, volume);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.vwap | PineScript ta.vwap}
 */
export function vwap(source: Source, volume: Source): series_float {
  if (source.length !== volume.length) {
    throw new Error('ta.vwap: source and volume must have the same length');
  }

  const result: series_float = [];
  let cumulativePV = 0; // Cumulative price * volume
  let cumulativeVolume = 0; // Cumulative volume

  for (let i = 0; i < source.length; i++) {
    if (isNaN(source[i]!) || isNaN(volume[i]!)) {
      result.push(NaN);
      continue;
    }

    cumulativePV += source[i]! * volume[i]!;
    cumulativeVolume += volume[i]!;

    if (cumulativeVolume === 0) {
      result.push(NaN);
    } else {
      result.push(cumulativePV / cumulativeVolume);
    }
  }

  return result;
}

/**
 * Arnaud Legoux Moving Average (ALMA)
 *
 * ALMA uses a Gaussian distribution for weighting, reducing lag while maintaining smoothness.
 * It's particularly good at tracking price action with minimal lag.
 *
 * @param source - Source series
 * @param length - Window size (default: 9)
 * @param offset - Controls the center of the Gaussian curve. 0.85 = focus on recent prices (default: 0.85)
 * @param sigma - Standard deviation of the Gaussian. Controls smoothness (default: 6)
 * @returns ALMA series
 *
 * @example
 * ```typescript
 * const alma = ta.alma(close, 9, 0.85, 6);
 * // offset closer to 1: more responsive
 * // offset closer to 0: smoother
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.alma | PineScript ta.alma}
 */
export function alma(
  source: Source,
  length: simple_int = 9,
  offset: simple_float = 0.85,
  sigma: simple_float = 6
): series_float {
  const result: series_float = [];
  const m = Math.floor(offset * (length - 1));
  const s = length / sigma;

  // Pre-calculate weights
  const weights: number[] = [];
  let weightSum = 0;

  for (let i = 0; i < length; i++) {
    const weight = Math.exp(-1 * Math.pow(i - m, 2) / (2 * Math.pow(s, 2)));
    weights.push(weight);
    weightSum += weight;
  }

  // Normalize weights
  for (let i = 0; i < length; i++) {
    weights[i]! /= weightSum;
  }

  // Calculate ALMA
  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    let almaValue = 0;
    for (let j = 0; j < length; j++) {
      almaValue += source[i - length + 1 + j]! * weights[j]!;
    }

    result.push(almaValue);
  }

  return result;
}

/**
 * Keltner Channels Width (KCW)
 *
 * Measures the width of Keltner Channels as a percentage of the middle line.
 * Similar to BBW but uses ATR instead of standard deviation.
 *
 * Low KCW suggests consolidation/low volatility.
 * High KCW suggests expansion/high volatility.
 *
 * @param source - Source series
 * @param length - Number of bars for EMA and ATR (default: 20)
 * @param mult - ATR multiplier (default: 2)
 * @param useTrueRange - Use True Range instead of high-low (default: true)
 * @param high - High price series
 * @param low - Low price series
 * @param close - Close price series
 * @returns KCW series
 *
 * @example
 * ```typescript
 * const kcw = ta.kcw(close, 20, 2, true, high, low, close);
 * // Low KCW: potential breakout coming
 * // High KCW: high volatility period
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.kcw | PineScript ta.kcw}
 */
export function kcw(
  source: Source,
  length: simple_int = 20,
  mult: simple_float = 2,
  useTrueRange: simple_bool = true,
  high?: Source,
  low?: Source,
  close?: Source
): series_float {
  const [basis, upper, lower] = kc(source, length, mult, useTrueRange, high, low, close);
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (isNaN(basis[i]!) || basis[i]! === 0) {
      result.push(NaN);
    } else {
      const width = ((upper[i]! - lower[i]!) / basis[i]!) * 100;
      result.push(width);
    }
  }

  return result;
}

/**
 * Range (High - Low)
 *
 * Simple difference between high and low prices for each bar.
 * Represents the price range of each bar.
 *
 * @param high - High price series
 * @param low - Low price series
 * @returns Range series
 *
 * @example
 * ```typescript
 * const barRange = ta.range(high, low);
 * const avgRange = ta.sma(barRange, 20);
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.range | PineScript ta.range}
 */
export function range(high: Source, low: Source): series_float {
  if (high.length !== low.length) {
    throw new Error('ta.range: high and low must have the same length');
  }

  const result: series_float = [];

  for (let i = 0; i < high.length; i++) {
    if (isNaN(high[i]!) || isNaN(low[i]!)) {
      result.push(NaN);
    } else {
      result.push(high[i]! - low[i]!);
    }
  }

  return result;
}

/**
 * Highest Bars
 *
 * Returns the offset (number of bars back) to the highest value over a given period.
 * Returns 0 if the current bar is the highest, 1 if the previous bar, etc.
 *
 * @param source - Source series
 * @param length - Number of bars to look back
 * @returns Series with offset to highest value (0 = current bar, 1 = previous bar, etc.)
 *
 * @example
 * ```typescript
 * const offset = ta.highestbars(close, 10);
 * // If offset[i]! = 3, the highest value in last 10 bars was 3 bars ago
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.highestbars | PineScript ta.highestbars}
 */
export function highestbars(source: Source, length: simple_int): series_int {
  const result: series_int = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    let highestValue = source[i - length + 1]!;
    let highestOffset = length - 1;

    for (let j = i - length + 2; j <= i; j++) {
      if (source[j]! > highestValue) {
        highestValue = source[j]!;
        highestOffset = i - j;
      }
    }

    result.push(highestOffset);
  }

  return result;
}

/**
 * Lowest Bars
 *
 * Returns the offset (number of bars back) to the lowest value over a given period.
 * Returns 0 if the current bar is the lowest, 1 if the previous bar, etc.
 *
 * @param source - Source series
 * @param length - Number of bars to look back
 * @returns Series with offset to lowest value (0 = current bar, 1 = previous bar, etc.)
 *
 * @example
 * ```typescript
 * const offset = ta.lowestbars(close, 10);
 * // If offset[i]! = 5, the lowest value in last 10 bars was 5 bars ago
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.lowestbars | PineScript ta.lowestbars}
 */
export function lowestbars(source: Source, length: simple_int): series_int {
  const result: series_int = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    let lowestValue = source[i - length + 1]!;
    let lowestOffset = length - 1;

    for (let j = i - length + 2; j <= i; j++) {
      if (source[j]! < lowestValue) {
        lowestValue = source[j]!;
        lowestOffset = i - j;
      }
    }

    result.push(lowestOffset);
  }

  return result;
}

/**
 * Maximum of Two Values
 *
 * Returns the greater of two values. Different from `highest()` which finds
 * the maximum over a series of bars.
 *
 * @param source1 - First source series
 * @param source2 - Second source series
 * @returns Series with maximum of the two values at each bar
 *
 * @example
 * ```typescript
 * const maxValue = ta.max(close, open);
 * // Returns the higher of close or open at each bar
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.max | PineScript ta.max}
 */
export function max(source1: Source, source2: Source): series_float {
  if (source1.length !== source2.length) {
    throw new Error('ta.max: source1 and source2 must have the same length');
  }

  const result: series_float = [];

  for (let i = 0; i < source1.length; i++) {
    if (isNaN(source1[i]!) || isNaN(source2[i]!)) {
      result.push(NaN);
    } else {
      result.push(Math.max(source1[i]!, source2[i]!));
    }
  }

  return result;
}

/**
 * Minimum of Two Values
 *
 * Returns the lesser of two values. Different from `lowest()` which finds
 * the minimum over a series of bars.
 *
 * @param source1 - First source series
 * @param source2 - Second source series
 * @returns Series with minimum of the two values at each bar
 *
 * @example
 * ```typescript
 * const minValue = ta.min(close, open);
 * // Returns the lower of close or open at each bar
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.min | PineScript ta.min}
 */
export function min(source1: Source, source2: Source): series_float {
  if (source1.length !== source2.length) {
    throw new Error('ta.min: source1 and source2 must have the same length');
  }

  const result: series_float = [];

  for (let i = 0; i < source1.length; i++) {
    if (isNaN(source1[i]!) || isNaN(source2[i]!)) {
      result.push(NaN);
    } else {
      result.push(Math.min(source1[i]!, source2[i]!));
    }
  }

  return result;
}

/**
 * Center of Gravity (COG)
 *
 * The Center of Gravity indicator is an oscillator developed by John Ehlers.
 * It identifies turning points with minimal lag and provides clear signals.
 *
 * The COG calculates a weighted average where more recent prices have higher weights,
 * similar to a moving average but with a focus on momentum shifts.
 *
 * @param source - Source series (typically close)
 * @param length - Lookback period (default: 10)
 * @returns COG series
 *
 * @example
 * ```typescript
 * const cogValue = ta.cog(close, 10);
 * // Use COG crossovers as signals:
 * // - COG crossing above 0: potential buy signal
 * // - COG crossing below 0: potential sell signal
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.cog | PineScript ta.cog}
 */
export function cog(source: Source, length: simple_int = 10): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    let numerator = 0;
    let denominator = 0;

    for (let j = 0; j < length; j++) {
      const weight = j + 1;
      const price = source[i - length + 1 + j]!;
      numerator += weight * price;
      denominator += price;
    }

    if (denominator === 0) {
      result.push(NaN);
    } else {
      // COG formula: -1 * (sum of (weight * price) / sum of prices) + (length + 1) / 2
      const cog = -1 * (numerator / denominator) + (length + 1) / 2;
      result.push(cog);
    }
  }

  return result;
}

/**
 * Mode (Most Frequent Value)
 *
 * Returns the mode of the series - the most frequently occurring value.
 * If there are several values with the same frequency, it returns the smallest value.
 *
 * @param source - Series of values to process
 * @param length - Number of bars to look back
 * @returns The most frequently occurring value
 *
 * @example
 * ```typescript
 * const values = [1, 2, 2, 3, 3, 3, 4, 4];
 * const modeValue = ta.mode(values, 8); // Returns 3 (most frequent)
 * ```
 *
 * @remarks
 * - `na` values in the source series are ignored
 * - If no mode exists, returns the smallest value
 * - Returns NaN for the first (length - 1) values where there's insufficient data
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.mode | PineScript ta.mode}
 */
export function mode(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    // Collect non-NaN values in the window
    const values: number[] = [];
    for (let j = 0; j < length; j++) {
      const value = source[i - j]!;
      if (!isNaN(value)) {
        values.push(value);
      }
    }

    if (values.length === 0) {
      result.push(NaN);
      continue;
    }

    // Count frequency of each value
    const frequencyMap = new Map<number, number>();
    for (const value of values) {
      frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
    }

    // Find the maximum frequency
    let maxFrequency = 0;
    frequencyMap.forEach((freq) => {
      if (freq > maxFrequency) {
        maxFrequency = freq;
      }
    });

    // Find all values with max frequency, then return the smallest
    const modesWithMaxFreq: number[] = [];
    frequencyMap.forEach((freq, value) => {
      if (freq === maxFrequency) {
        modesWithMaxFreq.push(value);
      }
    });

    result.push(Math.min(...modesWithMaxFreq));
  }

  return result;
}

/**
 * Percentile (Linear Interpolation Method)
 *
 * Calculates the percentile using the method of linear interpolation between
 * the two nearest ranks. This method may return values that are not members
 * of the input data set.
 *
 * @param source - Series of values to process
 * @param length - Number of bars to look back
 * @param percentage - Percentile to calculate (0-100)
 * @returns The calculated percentile value
 *
 * @example
 * ```typescript
 * const p50 = ta.percentile_linear_interpolation(close, 20, 50); // Median
 * const p75 = ta.percentile_linear_interpolation(close, 20, 75); // 75th percentile
 * ```
 *
 * @remarks
 * - `na` values in the source series are included and will produce an `na` result
 * - The result will NOT always be a member of the input data set
 * - Uses linear interpolation between adjacent values when needed
 * - Returns NaN for the first (length - 1) values where there's insufficient data
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.percentile_linear_interpolation | PineScript ta.percentile_linear_interpolation}
 */
export function percentile_linear_interpolation(
  source: Source,
  length: simple_int,
  percentage: number
): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    // Collect values in the window (including NaN)
    const values: number[] = [];
    for (let j = 0; j < length; j++) {
      const value = source[i - j]!;
      values.push(value);
    }

    // If any value is NaN, the result is NaN
    if (values.some(v => isNaN(v))) {
      result.push(NaN);
      continue;
    }

    // Sort values
    const sorted = [...values].sort((a, b) => a - b);

    // Calculate position using linear interpolation formula
    const position = (percentage / 100) * (sorted.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);

    if (lowerIndex === upperIndex) {
      // Exact position
      result.push(sorted[lowerIndex]!);
    } else {
      // Linear interpolation between two values
      const fraction = position - lowerIndex;
      const interpolated = sorted[lowerIndex]! + fraction * (sorted[upperIndex]! - sorted[lowerIndex]!);
      result.push(interpolated);
    }
  }

  return result;
}

/**
 * Percentile (Nearest Rank Method)
 *
 * Calculates the percentile using the Nearest Rank method. This method
 * always returns a value that is a member of the input data set.
 *
 * @param source - Series of values to process
 * @param length - Number of bars to look back
 * @param percentage - Percentile to calculate (0-100)
 * @returns The calculated percentile value
 *
 * @example
 * ```typescript
 * const p50 = ta.percentile_nearest_rank(close, 20, 50); // Median
 * const p90 = ta.percentile_nearest_rank(close, 20, 90); // 90th percentile
 * ```
 *
 * @remarks
 * - `na` values in the source series are ignored
 * - The result will ALWAYS be a member of the input data set
 * - The 100th percentile is defined as the largest value
 * - Using this method on lengths < 100 may result in the same value for multiple percentiles
 * - Returns NaN for the first (length - 1) values where there's insufficient data
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.percentile_nearest_rank | PineScript ta.percentile_nearest_rank}
 */
export function percentile_nearest_rank(
  source: Source,
  length: simple_int,
  percentage: number
): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    // Collect non-NaN values in the window
    const values: number[] = [];
    for (let j = 0; j < length; j++) {
      const value = source[i - j]!;
      if (!isNaN(value)) {
        values.push(value);
      }
    }

    if (values.length === 0) {
      result.push(NaN);
      continue;
    }

    // Sort values
    const sorted = [...values].sort((a, b) => a - b);

    // Special case: 100th percentile is the largest value
    if (percentage >= 100) {
      result.push(sorted[sorted.length - 1]!);
      continue;
    }

    // Calculate rank using nearest rank method
    // Formula: ceil(P/100 * N) where P is percentile and N is count
    const rank = Math.ceil((percentage / 100) * sorted.length);

    // Ranks are 1-indexed, so subtract 1 for 0-indexed array
    const index = Math.max(0, rank - 1);

    result.push(sorted[index]!);
  }

  return result;
}

/**
 * Rank Correlation Index (RCI)
 *
 * Calculates the Rank Correlation Index using Spearman's rank correlation coefficient.
 * RCI measures the directional consistency of price movements, indicating whether
 * the source consistently increased (positive values) or decreased (negative values).
 *
 * @param source - Series of values to process
 * @param length - Number of bars to look back
 * @returns RCI value scaled to range -100 to 100
 *
 * @example
 * ```typescript
 * const rci9 = ta.rci(close, 9);
 * // RCI near +100: strong upward consistency
 * // RCI near -100: strong downward consistency
 * // RCI near 0: no clear trend
 * ```
 *
 * @remarks
 * - Result is scaled to -100 to 100 range
 * - +100 indicates source consistently increased over the period
 * - -100 indicates source consistently decreased over the period
 * - 0 indicates no directional consistency
 * - Returns NaN for the first (length - 1) values where there's insufficient data
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.rci | PineScript ta.rci}
 */
export function rci(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }

    // Collect values in the window
    const values: number[] = [];
    for (let j = 0; j < length; j++) {
      values.push(source[i - length + 1 + j]!);
    }

    // Check for NaN values
    if (values.some(v => isNaN(v))) {
      result.push(NaN);
      continue;
    }

    // Create array of indices with their values for ranking
    const indexed = values.map((value, index) => ({ value, index }));

    // Sort by value to get ranks
    const sorted = [...indexed].sort((a, b) => a.value - b.value);

    // Assign ranks (handling ties by averaging ranks)
    const ranks = new Array(length).fill(0);
    let currentRank = 1;
    for (let j = 0; j < sorted.length; j++) {
      // Count ties
      let tieCount = 1;
      while (j + tieCount < sorted.length && sorted[j]!.value === sorted[j + tieCount]!.value) {
        tieCount++;
      }

      // Average rank for ties
      const avgRank = (currentRank + (currentRank + tieCount - 1)) / 2;

      // Assign average rank to all tied values
      for (let k = 0; k < tieCount; k++) {
        ranks[sorted[j + k]!.index] = avgRank;
      }

      j += tieCount - 1;
      currentRank += tieCount;
    }

    // Calculate Spearman's rank correlation
    // Formula: 1 - (6 * sum(d^2)) / (n * (n^2 - 1))
    // where d is the difference between time rank and value rank
    let sumSquaredDiff = 0;
    for (let j = 0; j < length; j++) {
      const timeRank = j + 1; // Time rank: 1, 2, 3, ..., length
      const valueRank = ranks[j];
      const diff = timeRank - valueRank;
      sumSquaredDiff += diff * diff;
    }

    const n = length;
    const rho = 1 - (6 * sumSquaredDiff) / (n * (n * n - 1));

    // Scale to -100 to 100
    result.push(rho * 100);
  }

  return result;
}

/**
 * Pivot Point Levels
 *
 * Calculates pivot point levels using various calculation methods.
 * Returns an array containing: [P, R1, S1, R2, S2, R3, S3, R4, S4, R5, S5]
 *
 * @param type - Calculation type: "Traditional", "Fibonacci", "Woodie", "Classic", "DM", "Camarilla"
 * @param anchor - Condition that triggers reset of calculations
 * @param developing - If true, pivots recalculate continuously; if false, use last anchor values
 * @param high - High price series (optional, uses context if not provided)
 * @param low - Low price series (optional, uses context if not provided)
 * @param close - Close price series (optional, uses context if not provided)
 * @param open - Open price series (optional, uses context if not provided)
 * @returns Array of 11 pivot levels
 *
 * @example
 * ```typescript
 * const weekChange = [false, false, false, false, true, false, ...]; // Weekly anchor
 * const pivots = ta.pivot_point_levels("Traditional", weekChange, false, high, low, close);
 * // pivots[i]! = [P, R1, S1, R2, S2, R3, S3, R4, S4, R5, S5]
 * ```
 *
 * @remarks
 * - Woodie type cannot use developing=true (will error in PineScript)
 * - DM type only calculates P, R1, S1 (other levels are NaN)
 * - All calculations follow PineScript v6 specifications
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.pivot_point_levels | PineScript ta.pivot_point_levels}
 */
export function pivot_point_levels(
  type: series_float | string,
  anchor: series_bool,
  developing: series_bool | boolean = false,
  high?: Source,
  low?: Source,
  close?: Source,
  open?: Source
): series_float[] {
  // For simplicity, we need to handle the case where type is a string array
  // But according to the docs, type is "series string", meaning it can change per bar
  // For this implementation, we'll support constant type strings

  const typeStr = typeof type === 'string' ? type : String(type[0]);
  const isDeveloping = typeof developing === 'boolean' ? developing : developing[0];

  // Woodie cannot be developing
  if (typeStr === 'Woodie' && isDeveloping) {
    throw new Error('ta.pivot_point_levels: Woodie type cannot use developing=true');
  }

  // Ensure all series have the same length
  const length = anchor.length;
  if (high && high.length !== length) throw new Error('High series length mismatch');
  if (low && low.length !== length) throw new Error('Low series length mismatch');
  if (close && close.length !== length) throw new Error('Close series length mismatch');
  if (open && open.length !== length) throw new Error('Open series length mismatch');

  // Initialize result arrays for all 11 levels
  const results: series_float[] = Array.from({ length: 11 }, () => []);

  // Track the last anchor point data
  let lastH = NaN, lastL = NaN, lastC = NaN, lastO = NaN;
  let lastAnchorIndex = -1;

  for (let i = 0; i < length; i++) {
    // Check if anchor triggered
    if (anchor[i]!) {
      lastAnchorIndex = i;
      // Store OHLC at anchor point (these will be used for calculations)
      lastH = high ? high[i]! : NaN;
      lastL = low ? low[i]! : NaN;
      lastC = close ? close[i]! : NaN;
      lastO = open ? open[i]! : NaN;
    }

    // Calculate data to use
    let h: number, l: number, c: number, o: number;

    if (isDeveloping && lastAnchorIndex >= 0) {
      // Developing: use max/min/last since anchor
      h = high ? Math.max(...high.slice(lastAnchorIndex, i + 1).filter(v => !isNaN(v))) : NaN;
      l = low ? Math.min(...low.slice(lastAnchorIndex, i + 1).filter(v => !isNaN(v))) : NaN;
      c = close ? close[i]! : NaN;
      o = open && lastAnchorIndex >= 0 ? open[lastAnchorIndex]! : NaN;
    } else {
      // Not developing: use last anchor values
      h = lastH;
      l = lastL;
      c = lastC;
      o = lastO;
    }

    // Calculate pivot levels based on type
    const levels = calculatePivotLevels(typeStr, h, l, c, o);

    // Push to results
    for (let j = 0; j < 11; j++) {
      results[j]!.push(levels[j]!);
    }
  }

  return results;
}

/**
 * Helper function to calculate pivot levels
 */
function calculatePivotLevels(
  type: string,
  h: number,
  l: number,
  c: number,
  o: number
): number[] {
  // Return NaN array if data is insufficient
  if (isNaN(h) || isNaN(l) || isNaN(c)) {
    return Array(11).fill(NaN);
  }

  const levels: number[] = Array(11).fill(NaN);

  // Calculate pivot point (P)
  let P: number;

  switch (type) {
    case 'Traditional':
    case 'Fibonacci':
    case 'Classic':
      P = (h + l + c) / 3;
      break;
    case 'Woodie':
      P = (h + l + 2 * c) / 4;
      break;
    case 'DM':
      P = (h + l + c) / 3;
      break;
    case 'Camarilla':
      P = (h + l + c) / 3;
      break;
    default:
      P = (h + l + c) / 3;
  }

  levels[0] = P; // P is at index 0

  // Calculate resistance and support levels based on type
  switch (type) {
    case 'Traditional':
    case 'Classic':
      levels[1] = 2 * P - l;  // R1
      levels[2] = 2 * P - h;  // S1
      levels[3] = P + (h - l);  // R2
      levels[4] = P - (h - l);  // S2
      levels[5] = h + 2 * (P - l);  // R3
      levels[6] = l - 2 * (h - P);  // S3
      levels[7] = levels[5] + (h - l);  // R4
      levels[8] = levels[6] - (h - l);  // S4
      levels[9] = levels[7] + (h - l);  // R5
      levels[10] = levels[8] - (h - l);  // S5
      break;

    case 'Fibonacci':
      levels[1] = P + 0.382 * (h - l);  // R1
      levels[2] = P - 0.382 * (h - l);  // S1
      levels[3] = P + 0.618 * (h - l);  // R2
      levels[4] = P - 0.618 * (h - l);  // S2
      levels[5] = P + (h - l);  // R3
      levels[6] = P - (h - l);  // S3
      levels[7] = levels[5] + 0.618 * (h - l);  // R4
      levels[8] = levels[6] - 0.618 * (h - l);  // S4
      levels[9] = levels[7] + 0.382 * (h - l);  // R5
      levels[10] = levels[8] - 0.382 * (h - l);  // S5
      break;

    case 'Woodie':
      levels[1] = 2 * P - l;  // R1
      levels[2] = 2 * P - h;  // S1
      levels[3] = P + (h - l);  // R2
      levels[4] = P - (h - l);  // S2
      levels[5] = h + 2 * (P - l);  // R3
      levels[6] = l - 2 * (h - P);  // S3
      levels[7] = levels[5] + (h - l);  // R4
      levels[8] = levels[6] - (h - l);  // S4
      levels[9] = levels[7] + (h - l);  // R5
      levels[10] = levels[8] - (h - l);  // S5
      break;

    case 'DM':
      // DM (Demark) only calculates P, R1, S1
      const x = h + l + (c * 2) + (isNaN(o) ? c : o);
      const newP = x / (isNaN(o) ? 4 : 5);
      levels[0] = newP;
      levels[1] = x / 2 - l;  // R1
      levels[2] = x / 2 - h;  // S1
      // R2-S5 remain NaN
      break;

    case 'Camarilla':
      const range = h - l;
      levels[1] = c + range * 1.1 / 12;  // R1
      levels[2] = c - range * 1.1 / 12;  // S1
      levels[3] = c + range * 1.1 / 6;   // R2
      levels[4] = c - range * 1.1 / 6;   // S2
      levels[5] = c + range * 1.1 / 4;   // R3
      levels[6] = c - range * 1.1 / 4;   // S3
      levels[7] = c + range * 1.1 / 2;   // R4
      levels[8] = c - range * 1.1 / 2;   // S4
      levels[9] = h;  // R5 (high)
      levels[10] = l; // S5 (low)
      break;
  }

  return levels;
}

/**
 * Ichimoku Kinko Hyo (Ichimoku Cloud) - Japanese charting technique for trend identification.
 *
 * @param conversionPeriods - Period for Tenkan-sen (Conversion Line), default: 9
 * @param basePeriods - Period for Kijun-sen (Base Line), default: 26
 * @param laggingSpan2Periods - Period for Senkou Span B (Leading Span B), default: 52
 * @param displacement - Displacement for Senkou Spans and Chikou Span, default: 26
 * @param high - High price series
 * @param low - Low price series
 * @param close - Close price series
 * @returns Tuple of [tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan]
 *
 * @remarks
 * - **Tenkan-sen (Conversion Line)**: `(highest(high, conversionPeriods) + lowest(low, conversionPeriods)) / 2`
 * - **Kijun-sen (Base Line)**: `(highest(high, basePeriods) + lowest(low, basePeriods)) / 2`
 * - **Senkou Span A (Leading Span A)**: `(tenkan + kijun) / 2` offset forward by `displacement` periods
 * - **Senkou Span B (Leading Span B)**: `(highest(high, laggingSpan2Periods) + lowest(low, laggingSpan2Periods)) / 2` offset forward by `displacement` periods
 * - **Chikou Span (Lagging Span)**: `close` offset backward by `displacement` periods
 *
 * The forward offset for Senkou Spans means they are projected into the future (NaN values at the end).
 * The backward offset for Chikou Span means it shows past prices (NaN values at the beginning).
 *
 * @example
 * ```typescript
 * const [tenkan, kijun, senkouA, senkouB, chikou] = ta.ichimoku(9, 26, 52, 26, high, low, close);
 *
 * // Tenkan-sen crosses above Kijun-sen = bullish signal
 * const bullishSignal = ta.crossover(tenkan, kijun);
 *
 * // Price above cloud = bullish trend
 * // Cloud = area between senkouSpanA and senkouSpanB
 * ```
 *
 * @see {@link https://www.tradingview.com/pine-script-reference/v6/#fun_ta.ichimoku | PineScript ta.ichimoku}
 */
export function ichimoku(
  conversionPeriods: simple_int,
  basePeriods: simple_int,
  laggingSpan2Periods: simple_int,
  displacement: simple_int,
  high: Source,
  low: Source,
  close: Source
): [series_float, series_float, series_float, series_float, series_float] {
  const length = high.length;

  // Calculate Tenkan-sen (Conversion Line): (highest(high, 9) + lowest(low, 9)) / 2
  const highestConversion = highest(high, conversionPeriods);
  const lowestConversion = lowest(low, conversionPeriods);
  const tenkanSen: series_float = [];
  for (let i = 0; i < length; i++) {
    if (isNaN(highestConversion[i]!) || isNaN(lowestConversion[i]!)) {
      tenkanSen.push(NaN);
    } else {
      tenkanSen.push((highestConversion[i]! + lowestConversion[i]!) / 2);
    }
  }

  // Calculate Kijun-sen (Base Line): (highest(high, 26) + lowest(low, 26)) / 2
  const highestBase = highest(high, basePeriods);
  const lowestBase = lowest(low, basePeriods);
  const kijunSen: series_float = [];
  for (let i = 0; i < length; i++) {
    if (isNaN(highestBase[i]!) || isNaN(lowestBase[i]!)) {
      kijunSen.push(NaN);
    } else {
      kijunSen.push((highestBase[i]! + lowestBase[i]!) / 2);
    }
  }

  // Calculate Senkou Span A (Leading Span A): (tenkan + kijun) / 2, offset forward by displacement
  // This means at index i, we store the value that would normally be at index (i - displacement)
  // Result: first 'displacement' values are NaN, and last 'displacement' calculated values are lost
  const senkouSpanA: series_float = [];
  for (let i = 0; i < length; i++) {
    const sourceIndex = i - displacement;
    if (sourceIndex < 0 || isNaN(tenkanSen[sourceIndex]!) || isNaN(kijunSen[sourceIndex]!)) {
      senkouSpanA.push(NaN);
    } else {
      senkouSpanA.push((tenkanSen[sourceIndex]! + kijunSen[sourceIndex]!) / 2);
    }
  }

  // Calculate Senkou Span B (Leading Span B): (highest(high, 52) + lowest(low, 52)) / 2, offset forward by displacement
  const highestLagging = highest(high, laggingSpan2Periods);
  const lowestLagging = lowest(low, laggingSpan2Periods);
  const senkouSpanB: series_float = [];
  for (let i = 0; i < length; i++) {
    const sourceIndex = i - displacement;
    if (sourceIndex < 0 || isNaN(highestLagging[sourceIndex]!) || isNaN(lowestLagging[sourceIndex]!)) {
      senkouSpanB.push(NaN);
    } else {
      senkouSpanB.push((highestLagging[sourceIndex]! + lowestLagging[sourceIndex]!) / 2);
    }
  }

  // Calculate Chikou Span (Lagging Span): close, offset backward by displacement
  // This means at index i, we store the close value from index (i + displacement)
  // Result: last 'displacement' values are NaN
  const chikouSpan: series_float = [];
  for (let i = 0; i < length; i++) {
    const sourceIndex = i + displacement;
    if (sourceIndex >= length || isNaN(close[sourceIndex]!)) {
      chikouSpan.push(NaN);
    } else {
      chikouSpan.push(close[sourceIndex]!);
    }
  }

  return [tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan];
}

/**
 * ZigZag indicator - identifies significant trend reversals by filtering out minor price movements.
 *
 * @param deviation - Minimum percentage price change to form a new pivot (default: 5.0)
 * @param depth - Minimum bars between pivots for pivot detection (default: 10)
 * @param backstep - Bars to look back for confirmation (default: 3)
 * @param source - Price source (optional, typically close)
 * @param high - High price series (optional, for high/low mode)
 * @param low - Low price series (optional, for high/low mode)
 * @returns Tuple of [zigzag values, direction, pivot flags]
 *
 * @remarks
 * - **PineScript v6 signature**: `ta.zigzag(source, deviation, depth, backstep)` - uses implicit chart data
 * - **JavaScript signature**: Requires explicit `source`, `high`, `low` OR use `createContext()`
 * - Returns the pivot price at pivot points, NaN for non-pivot bars
 * - Direction: 1 = uptrend (from low to high), -1 = downtrend (from high to low)
 * - The ZigZag indicator **repaints** by design - the last segment can change as new data arrives
 * - Supports two modes:
 *   - Single source mode: uses same series for highs and lows
 *   - High/Low mode: uses high for pivot highs, low for pivot lows
 *
 * @example
 * ```typescript
 * // Using high/low for more accurate pivots
 * const [zigzag, direction, isPivot] = ta.zigzag(5, 10, 3, null, high, low);
 *
 * // Find pivot prices
 * for (let i = 0; i < zigzag.length; i++) {
 *   if (!isNaN(zigzag[i]!)) {
 *     console.log(`Pivot at bar ${i}: ${zigzag[i]!}, direction: ${direction[i]! === 1 ? 'UP' : 'DOWN'}`);
 *   }
 * }
 * ```
 *
 * @see {@link https://www.tradingview.com/support/solutions/43000591664-zig-zag/ | TradingView ZigZag Documentation}
 */
export function zigzag(
  deviation: simple_float = 5.0,
  depth: simple_int = 10,
  backstep: simple_int = 3,
  source?: Source,
  high?: Source,
  low?: Source
): [series_float, series_int, series_bool] {
  // Determine which mode we're in
  let highSource: Source;
  let lowSource: Source;
  
  if (high && low) {
    // High/Low mode
    highSource = high;
    lowSource = low;
  } else if (source) {
    // Single source mode
    highSource = source;
    lowSource = source;
  } else {
    throw new Error(
      'ta.zigzag() requires either source series or high/low series. ' +
      'Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data.'
    );
  }

  const length = highSource.length;
  if (lowSource.length !== length) {
    throw new Error('ta.zigzag: high and low must have the same length');
  }

  // Result arrays
  const zigzagValues: series_float = new Array(length).fill(NaN);
  const directions: series_int = new Array(length).fill(0);
  const isPivot: series_bool = new Array(length).fill(false);

  // Helper function to calculate percentage deviation
  const getDeviation = (price1: number, price2: number): number => {
    if (price1 === 0 || isNaN(price1) || isNaN(price2)) return 0;
    return Math.abs((price2 - price1) / price1) * 100;
  };

  // Track pivot state
  interface Pivot {
    index: number;
    price: number;
    type: 'high' | 'low';
  }

  let lastConfirmedPivot: Pivot | null = null;
  let potentialPivot: Pivot | null = null;
  let currentDirection = 0; // 0 = undefined, 1 = up, -1 = down

  // Store confirmed pivots for final zigzag construction
  const confirmedPivots: Pivot[] = [];

  // First pass: Find initial pivot to start
  let startIndex = -1;
  let initialHighest = -Infinity;
  let initialLowest = Infinity;
  let initialHighIndex = -1;
  let initialLowIndex = -1;

  // Find the first significant pivot using depth bars
  for (let i = 0; i < Math.min(depth, length); i++) {
    if (!isNaN(highSource[i]!) && highSource[i]! > initialHighest) {
      initialHighest = highSource[i]!;
      initialHighIndex = i;
    }
    if (!isNaN(lowSource[i]!) && lowSource[i]! < initialLowest) {
      initialLowest = lowSource[i]!;
      initialLowIndex = i;
    }
  }

  // Determine starting direction based on which came first
  if (initialHighIndex >= 0 && initialLowIndex >= 0) {
    if (initialLowIndex <= initialHighIndex) {
      // Low came first or same - start with low, direction will be up
      lastConfirmedPivot = { index: initialLowIndex, price: initialLowest, type: 'low' };
      currentDirection = 1;
    } else {
      // High came first - start with high, direction will be down
      lastConfirmedPivot = { index: initialHighIndex, price: initialHighest, type: 'high' };
      currentDirection = -1;
    }
    confirmedPivots.push(lastConfirmedPivot);
    startIndex = lastConfirmedPivot.index + 1;
  } else {
    startIndex = depth;
  }

  // Main loop: process bars
  for (let i = Math.max(startIndex, depth); i < length; i++) {
    const currentHigh = highSource[i]!;
    const currentLow = lowSource[i]!;

    if (isNaN(currentHigh) || isNaN(currentLow)) {
      directions[i] = currentDirection;
      continue;
    }

    // Check for potential pivot high
    let isPotentialHigh = true;
    for (let j = 1; j <= backstep && i - j >= 0; j++) {
      if (!isNaN(highSource[i - j]!) && highSource[i - j]! >= currentHigh) {
        isPotentialHigh = false;
        break;
      }
    }

    // Check for potential pivot low
    let isPotentialLow = true;
    for (let j = 1; j <= backstep && i - j >= 0; j++) {
      if (!isNaN(lowSource[i - j]!) && lowSource[i - j]! <= currentLow) {
        isPotentialLow = false;
        break;
      }
    }

    if (currentDirection === 1) {
      // Looking for pivot high (uptrend ending)
      if (isPotentialHigh) {
        if (potentialPivot === null || potentialPivot.type !== 'high') {
          // New potential high
          if (lastConfirmedPivot && getDeviation(lastConfirmedPivot.price, currentHigh) >= deviation) {
            potentialPivot = { index: i, price: currentHigh, type: 'high' };
          }
        } else {
          // Already have a potential high - update if this is higher
          if (currentHigh > potentialPivot.price) {
            potentialPivot = { index: i, price: currentHigh, type: 'high' };
          }
        }
      }

      // Check if we should confirm the potential high and start looking for a low
      if (potentialPivot && potentialPivot.type === 'high') {
        const deviationFromPotential = getDeviation(potentialPivot.price, currentLow);
        if (deviationFromPotential >= deviation && i - potentialPivot.index >= backstep) {
          // Confirm the high pivot
          confirmedPivots.push(potentialPivot);
          lastConfirmedPivot = potentialPivot;
          currentDirection = -1;
          potentialPivot = null;
        }
      }
    } else if (currentDirection === -1) {
      // Looking for pivot low (downtrend ending)
      if (isPotentialLow) {
        if (potentialPivot === null || potentialPivot.type !== 'low') {
          // New potential low
          if (lastConfirmedPivot && getDeviation(lastConfirmedPivot.price, currentLow) >= deviation) {
            potentialPivot = { index: i, price: currentLow, type: 'low' };
          }
        } else {
          // Already have a potential low - update if this is lower
          if (currentLow < potentialPivot.price) {
            potentialPivot = { index: i, price: currentLow, type: 'low' };
          }
        }
      }

      // Check if we should confirm the potential low and start looking for a high
      if (potentialPivot && potentialPivot.type === 'low') {
        const deviationFromPotential = getDeviation(potentialPivot.price, currentHigh);
        if (deviationFromPotential >= deviation && i - potentialPivot.index >= backstep) {
          // Confirm the low pivot
          confirmedPivots.push(potentialPivot);
          lastConfirmedPivot = potentialPivot;
          currentDirection = 1;
          potentialPivot = null;
        }
      }
    } else {
      // Initial state - determine direction based on first significant move
      if (lastConfirmedPivot) {
        if (lastConfirmedPivot.type === 'low' && getDeviation(lastConfirmedPivot.price, currentHigh) >= deviation) {
          currentDirection = 1;
        } else if (lastConfirmedPivot.type === 'high' && getDeviation(lastConfirmedPivot.price, currentLow) >= deviation) {
          currentDirection = -1;
        }
      }
    }

    directions[i] = currentDirection;
  }

  // Include the last potential pivot if it exists (repaint behavior)
  // This shows where the zigzag line extends to, but doesn't change direction
  const lastPotentialWasAdded = potentialPivot !== null;
  if (potentialPivot) {
    confirmedPivots.push(potentialPivot);
  }

  // Build the final zigzag output
  for (const pivot of confirmedPivots) {
    zigzagValues[pivot.index] = pivot.price;
    isPivot[pivot.index] = true;
  }

  // Set directions for all bars based on confirmed pivots
  // Direction represents the current trend at each bar:
  // - After a LOW pivot, trend is UP (1) until the next HIGH
  // - After a HIGH pivot, trend is DOWN (-1) until the next LOW
  let currentDir = 0;
  let pivotIdx = 0;
  const numConfirmed = lastPotentialWasAdded ? confirmedPivots.length - 1 : confirmedPivots.length;
  
  for (let i = 0; i < length; i++) {
    // Move to next confirmed pivot if we passed the current one
    // Don't count the last potential pivot for direction changes
    while (pivotIdx < numConfirmed && confirmedPivots[pivotIdx]!.index <= i) {
      const pivot = confirmedPivots[pivotIdx]!;
      currentDir = pivot.type === 'low' ? 1 : -1;
      pivotIdx++;
    }
    directions[i] = currentDir;
  }

  return [zigzagValues, directions, isPivot];
}
