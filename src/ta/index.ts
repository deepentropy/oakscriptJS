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
    changes.push(source[i] - source[i - 1]);
  }

  // Separate gains and losses
  const gains: number[] = changes.map(c => c > 0 ? c : 0);
  const losses: number[] = changes.map(c => c < 0 ? -c : 0);

  // Calculate average gains and losses using RMA (not SMA)
  const avgGains = rma(gains, length);
  const avgLosses = rma(losses, length);

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
    rmaValue += source[i];
  }
  rmaValue = rmaValue / Math.min(length, source.length);

  for (let i = 0; i < source.length; i++) {
    if (i === 0) {
      result.push(rmaValue);
    } else {
      // RMA formula: alpha * source + (1 - alpha) * RMA[1]
      rmaValue = alpha * source[i] + (1 - alpha) * rmaValue;
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
 * - Formula: `sum(source[i] * (length - i)) / sum(length - i)` for i = 0 to length-1
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
export function wma(source: Source, length: series_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      let weightSum = 0;

      for (let j = 0; j < length; j++) {
        const weight = length - j;
        sum += source[i - j] * weight;
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
export function highest(source: Source, length: series_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let max = -Infinity;
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j])) {
          max = Math.max(max, source[i - j]);
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
export function lowest(source: Source, length: series_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      let min = Infinity;
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j])) {
          min = Math.min(min, source[i - j]);
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
    sum += source[i];
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
 * - True when: (source1[i] > source2[i] AND source1[i-1] <= source2[i-1]) OR
 *              (source1[i] < source2[i] AND source1[i-1] >= source2[i-1])
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
      const crossedUp = source1[i] > source2[i] && source1[i - 1] <= source2[i - 1];
      const crossedDown = source1[i] < source2[i] && source1[i - 1] >= source2[i - 1];
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
export function rising(source: Source, length: series_int): series_bool {
  const result: series_bool = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(false);
    } else {
      let isRising = true;
      for (let j = 1; j <= length; j++) {
        if (source[i - j + 1] <= source[i - j]) {
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
export function falling(source: Source, length: series_int): series_bool {
  const result: series_bool = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(false);
    } else {
      let isFalling = true;
      for (let j = 1; j <= length; j++) {
        if (source[i - j + 1] >= source[i - j]) {
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
export function roc(source: Source, length: series_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
    } else {
      const oldValue = source[i - length];
      if (oldValue === 0 || isNaN(oldValue) || isNaN(source[i])) {
        result.push(NaN);
      } else {
        const changeValue = source[i] - oldValue;
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
export function mom(source: Source, length: series_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
    } else {
      if (isNaN(source[i]) || isNaN(source[i - length])) {
        result.push(NaN);
      } else {
        result.push(source[i] - source[i - length]);
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
 * - Formula: `sum(abs(source[i] - sma)) / length` for i in 0 to length-1
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
export function dev(source: Source, length: series_int): series_float {
  const result: series_float = [];
  const meanValues = sma(source, length);

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1 || isNaN(meanValues[i])) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j])) {
          sum += Math.abs(source[i - j] - meanValues[i]);
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
 * - Formula (biased): `sum((source[i] - mean)^2) / length`
 * - Formula (unbiased): `sum((source[i] - mean)^2) / (length - 1)`
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
export function variance(source: Source, length: series_int, biased: series_bool = true): series_float {
  const result: series_float = [];
  const meanValues = sma(source, length);

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1 || isNaN(meanValues[i])) {
      result.push(NaN);
    } else {
      let sumSquares = 0;
      let count = 0;
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j])) {
          const diff = source[i - j] - meanValues[i];
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
export function median(source: Source, length: series_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      // Collect non-NaN values
      const values: number[] = [];
      for (let j = 0; j < length; j++) {
        if (!isNaN(source[i - j])) {
          values.push(source[i - j]);
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
          result.push((values[mid - 1] + values[mid]) / 2);
        } else {
          // Odd number of values - middle value
          result.push(values[mid]);
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
      if (isNaN(source[i]) || isNaN(source[i - 1]) || isNaN(source[i - 2]) || isNaN(source[i - 3])) {
        result.push(NaN);
      } else {
        const value = 
          source[i - 3] * (1 / 6) +
          source[i - 2] * (2 / 6) +
          source[i - 1] * (2 / 6) +
          source[i] * (1 / 6);
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
export function vwma(source: Source, length: series_int, volume?: Source): series_float {
  if (!volume) {
    throw new Error(
      'ta.vwma() requires volume series. ' +
      'Either pass it explicitly or use createContext({ chart: { ..., volume } }) for implicit data.'
    );
  }

  // Calculate source * volume
  const sourceTimesVolume: series_float = [];
  for (let i = 0; i < source.length; i++) {
    sourceTimesVolume.push(source[i] * volume[i]);
  }

  const numerator = sma(sourceTimesVolume, length);
  const denominator = sma(volume, length);

  const result: series_float = [];
  for (let i = 0; i < source.length; i++) {
    if (denominator[i] === 0 || isNaN(denominator[i])) {
      result.push(NaN);
    } else {
      result.push(numerator[i] / denominator[i]);
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
export function linreg(source: Source, length: series_int, offset: simple_int = 0): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      // Check for NaN values in window
      let hasNaN = false;
      for (let j = 0; j < length; j++) {
        if (isNaN(source[i - j])) {
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
          const y = source[i - (length - 1 - j)];
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
export function correlation(source1: Source, source2: Source, length: series_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source1.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      // Collect non-NaN pairs
      const pairs: Array<[number, number]> = [];
      for (let j = 0; j < length; j++) {
        if (!isNaN(source1[i - j]) && !isNaN(source2[i - j])) {
          pairs.push([source1[i - j], source2[i - j]]);
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
export function percentrank(source: Source, length: series_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
    } else {
      // Check for NaN values
      let hasNaN = false;
      for (let j = 0; j < length; j++) {
        if (isNaN(source[i - j])) {
          hasNaN = true;
          break;
        }
      }

      if (hasNaN) {
        result.push(NaN);
      } else {
        const currentValue = source[i];
        let countLessOrEqual = 0;

        // Count how many values are less than or equal to current
        for (let j = 0; j < length; j++) {
          if (source[i - j] <= currentValue) {
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
