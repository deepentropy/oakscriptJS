/**
 * Technical Analysis (ta) namespace
 * Mirrors PineScript's ta.* functions for technical analysis indicators and calculations.
 *
 * @remarks
 * All technical analysis functions in this namespace follow PineScript v6 API specifications.
 *
 * @version 6
 */

import type { series_float, series_bool, series_int, int, Source, simple_int, simple_float, simple_bool } from '../types/index.js';
import { eq, ge, gt, le, lt } from '../compare/index.js';
import { runningSum, runningSumSeries, runningVariance, runningVarianceSeries } from './running-sum.js';

/**
 * Simple Moving Average - returns the moving average (sum of last y values divided by y).
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length), or one length per bar (a series length)
 * @returns Simple moving average of source for length bars back
 *
 * @remarks
 * - `na` values (also +/-Infinity) in the source series are ignored: the mean of the last `length` non-`na`
 *   values, and a bar with an `na` source keeps the previous result (as in PineScript)
 * - Returns NaN until `length` non-`na` values are available
 * - The sum is a compensated running sum, as in PineScript, so the result can differ from the exact window mean in
 *   the last bits (bit for bit with PineScript)
 * - With a series length, the running sum is moved to the new length when the length changes, as PineScript does
 *   (see {@link math.sum}); a bar with an `na` source gives the mean of the last `length` earlier values
 *
 * @example
 * ```typescript
 * const closePrices = [10, 11, 12, 13, 14];
 * const sma5 = ta.sma(closePrices, 5); // Returns: [NaN, NaN, NaN, NaN, 12]
 * const smaVar = ta.sma(closePrices, [2, 2, 2, 3, 2]); // Returns: [NaN, 10.5, 11.5, 12, 13.5]
 * ```
 */
export function sma(source: Source, length: simple_int | ArrayLike<number>): series_float {
  if (typeof length !== 'number') {
    const sums = runningSumSeries(source, length, 'ta.sma');
    return sums.map((sum, i) => sum / Math.floor(length[i]!));
  }
  // Floor the length to match PineScript's auto-truncation of float to int
  const len = Math.floor(length);
  return runningSum(source, len).map((sum) => sum / len);
}

/** Mean of the last `length` bars; na when the window holds an na value (used by ta.dev). */
function strictWindowMean(source: Source, length: simple_int): series_float {
  const len = Math.floor(length);
  return Array.from({ length: source.length }, (_, i) => {
    if (i < len - 1) return NaN;
    let sum = 0;
    for (let j = 0; j < len; j++) sum += source[i - j]!;
    return sum / len;
  });
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
 * - `na` values (also +/-Infinity) in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 * - May cause indicator repainting
 *
 * @example
 * ```typescript
 * const closePrices = [10, 11, 12, 13, 14];
 * const ema5 = ta.ema(closePrices, 5);
 * ```
 */
export function ema(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  const len = Math.floor(length);
  const multiplier = 2 / (len + 1);

  // SMA seed on the bar of the `len`-th valid value. An infinite value is na, as in PineScript.
  let firstValidIndex = -1;
  let validCount = 0;

  for (let i = 0; i < source.length; i++) {
    const val = source[i];
    if (val !== undefined && Number.isFinite(val) && ++validCount === len) {
      firstValidIndex = i;
      break;
    }
  }

  const emaInitialized = firstValidIndex >= 0;
  // The seed is ta.sma on that bar: the running sum of math.sum (PineScript bits), not a plain loop sum
  let emaValue = emaInitialized ? runningSum(source.slice(0, firstValidIndex + 1), len)[firstValidIndex]! / len : NaN;

  for (let i = 0; i < source.length; i++) {
    if (!emaInitialized || i < firstValidIndex) {
      result.push(NaN);
    } else if (i === firstValidIndex) {
      result.push(emaValue);
    } else {
      const val = source[i];
      if (val !== undefined && Number.isFinite(val)) {
        emaValue = (val - emaValue) * multiplier + emaValue;
        result.push(emaValue);
      } else {
        // na source: na on this bar; the next bar continues from the last value (as in PineScript)
        result.push(NaN);
      }
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
 * - As in PineScript (`down == 0 ? 100 : up == 0 ? 0 : ...`): 100 when the average loss is 0, else 0 when the
 *   average gain is 0, both with the 1e-10 tolerance of the comparison operators
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
 */
export function rsi(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < source.length; i++) {
    changes.push(source[i]! - source[i - 1]!);
  }

  // Separate gains and losses; a change from or to na is na (skipped by rma), not a 0 gain / loss
  const gains: number[] = changes.map(c => (Number.isNaN(c) ? NaN : c > 0 ? c : 0));
  const losses: number[] = changes.map(c => (Number.isNaN(c) ? NaN : c < 0 ? -c : 0));

  // Calculate average gains and losses using RMA (not SMA)
  const avgGains = rma(gains, length);
  const avgLosses = rma(losses, length);

  result.push(NaN); // First value is NaN

  for (let i = 0; i < avgGains.length; i++) {
    if (eq(avgLosses[i]!, 0)) {
      result.push(100);
    } else if (eq(avgGains[i]!, 0)) {
      result.push(0);
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
 * Standard deviation over the last `length` non-na values.
 *
 * @param source - Series of values to process
 * @param length - Number of values, or one length per bar (a series length, see {@link sma})
 * @param biased - true (default): biased estimate (divides by `length`); false: unbiased (by `length - 1`)
 * @returns Standard deviation series (na until `length` non-na values exist)
 *
 * @remarks
 * As in PineScript: `na` values (also +/-Infinity) are skipped, the window holds the last
 * `length` non-na values, and a bar whose own value is `na` keeps the previous result.
 * The result is the square root of {@link variance} (0 when the variance is not positive), computed from
 * compensated running sums of the values and of their squares, bit for bit as PineScript.
 */
export function stdev(
  source: Source,
  length: simple_int | ArrayLike<number>,
  biased: simple_bool = true
): series_float {
  return varianceOf(source, length, biased, 'ta.stdev').map((v) => (Number.isNaN(v) ? NaN : v > 0 ? Math.sqrt(v) : 0));
}

/**
 * The last `length` non-na values up to bar `i` (the bar itself may be na), or null when fewer exist.
 * `isNa` tells which values are skipped (NaN by default).
 */
function lastValues(source: Source, i: number, length: number): number[] | null {
  const values: number[] = [];
  for (let j = i; j >= 0 && values.length < length; j--) {
    const x = source[j]!;
    if (!Number.isNaN(x)) values.push(x);
  }
  return values.length === length ? values : null;
}

/**
 * The extreme of the window of `length` bars ending at each bar, in one pass (monotonic deque): the bar index of
 * the oldest highest (or lowest) value, or -1 when the window is empty. As PineScript does for ta.highest /
 * ta.lowest / ta.highestbars / ta.lowestbars, the window stops at the first `na` value going back, so a bar whose
 * own value is `na` has an empty window. `zeros[i]` tells whether the window holds a +0 (highest) or a -0
 * (lowest), the zero that `Math.max` / `Math.min` return when the extreme is 0.
 */
function windowExtremes(source: Source, length: number, lowest: boolean): { at: Int32Array; zeros: Uint8Array } {
  const n = source.length;
  const span = length > 0 ? Math.ceil(length) : 0; // the bars j = 0, 1... with j < length
  const at = new Int32Array(n).fill(-1);
  const zeros = new Uint8Array(n);
  const queue = new Int32Array(n); // bar indices; values from best to worst, the oldest first among equal values
  const preferredZero = lowest ? -0 : 0;
  let head = 0;
  let tail = 0;
  let zeroCount = 0; // preferred zeros in the queue
  let lastNa = -1;
  const isPreferredZero = (k: number) => Object.is(source[k], preferredZero);
  for (let i = 0; i < n; i++) {
    const x = source[i]!;
    if (Number.isNaN(x)) {
      lastNa = i;
      head = tail = 0;
      zeroCount = 0;
      continue;
    }
    // drop the values that the new one beats; equal values stay (the oldest wins ties)
    while (tail > head && (lowest ? source[queue[tail - 1]!]! > x : source[queue[tail - 1]!]! < x)) {
      if (isPreferredZero(queue[--tail]!)) zeroCount--;
    }
    queue[tail++] = i;
    if (isPreferredZero(i)) zeroCount++;
    const start = Math.max(i - span + 1, lastNa + 1);
    while (head < tail && queue[head]! < start) {
      if (isPreferredZero(queue[head++]!)) zeroCount--;
    }
    if (head < tail) {
      at[i] = queue[head]!;
      zeros[i] = zeroCount > 0 ? 1 : 0;
    }
  }
  return { at, zeros };
}

/** Offset of the best value of the window; on ties the oldest bar wins. 0 when the window is empty. */
function extremeOffset(source: Source, length: simple_int, lowest: boolean): series_int {
  const { at } = windowExtremes(source, length, lowest);
  // -(i - at): -0 when the extreme is the current bar, as the offset -j of the window scan
  return source.map((_, i) => (i < length - 1 ? NaN : at[i]! < 0 ? 0 : -(i - at[i]!)));
}

/** Best value of the window (`na` when the window is empty), with the zero sign of `Math.max` / `Math.min`. */
function extremeValue(source: Source, length: simple_int, lowest: boolean): series_float {
  const { at, zeros } = windowExtremes(source, length, lowest);
  return source.map((_, i) => {
    if (i < length - 1 || at[i]! < 0) return NaN;
    const v = source[at[i]!]!;
    return v === 0 && zeros[i] ? (lowest ? -0 : 0) : v;
  });
}

/**
 * Compares each bar with the last earlier bar where both values were not na (PineScript rule for ta.crossover,
 * ta.crossunder and ta.cross): false while there is no such bar, and false on a bar with an na value.
 *
 * @internal
 */
function crossTest(
  series1: Source,
  series2: Source,
  test: (a: number, b: number, prevA: number, prevB: number) => boolean,
): series_bool {
  const result: series_bool = [];
  let prevA = NaN;
  let prevB = NaN;
  for (let i = 0; i < series1.length; i++) {
    const a = series1[i]!;
    const b = series2[i]!;
    result.push(test(a, b, prevA, prevB));
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      prevA = a;
      prevB = b;
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
 * - True when: series1[i] > series2[i] AND series1[j] <= series2[j], where j is the last bar before i where both
 *   values were not na (PineScript rule: a crossing right after an na bar is not missed)
 * - First value is always false (no previous value to compare)
 * - Comparisons are exact (no tolerance)
 * - Useful for detecting bullish signals (e.g., fast MA crossing over slow MA)
 *
 * @example
 * ```typescript
 * const crossUp = ta.crossover(fastMA, slowMA);
 * ```
 */
export function crossover(series1: Source, series2: Source): series_bool {
  return crossTest(series1, series2, (a, b, pa, pb) => a > b && pa <= pb);
}

/**
 * Crossunder - returns true when series1 crosses under series2 (moves from above to below).
 *
 * @param series1 - First series
 * @param series2 - Second series
 * @returns Boolean series (true at crossunder points)
 *
 * @remarks
 * - True when: series1[i] < series2[i] AND series1[j] >= series2[j], where j is the last bar before i where both
 *   values were not na
 * - First value is always false (no previous value to compare)
 * - Comparisons are exact (no tolerance)
 * - Useful for detecting bearish signals (e.g., fast MA crossing under slow MA)
 *
 * @example
 * ```typescript
 * const crossDown = ta.crossunder(fastMA, slowMA);
 * ```
 */
export function crossunder(series1: Source, series2: Source): series_bool {
  return crossTest(series1, series2, (a, b, pa, pb) => a < b && pa >= pb);
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
      // First bar: the previous close is na
      result.push(handle_na ? high[i]! - low[i]! : NaN);
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
 */
export function atr(length: simple_int, high?: Source, low?: Source, close?: Source): series_float {
  if (!high || !low || !close) {
    throw new Error(
      'ta.atr() requires high, low, and close series. ' +
      'Either pass them explicitly or use createContext({ chart: { high, low, close } }) for implicit data.'
    );
  }

  // PineScript: ta.atr uses ta.tr(true), so bar 0 is high - low
  const trueRange = tr(true, high, low, close);
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
 * - As in PineScript (`nz` of the previous bands): 0 on bar 0, na on the next bars while the ATR is na
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

  // PineScript reference implementation (bar by bar):
  //   prevLowerBand = nz(lowerBand[1]), prevUpperBand = nz(upperBand[1])
  //   lowerBand := lowerBand > prevLowerBand or close[1] < prevLowerBand ? lowerBand : prevLowerBand
  //   upperBand := upperBand < prevUpperBand or close[1] > prevUpperBand ? upperBand : prevUpperBand
  //   direction = na(atr[1]) ? 1 : prevSuperTrend == prevUpperBand ? (close > upperBand ? -1 : 1) : (close < lowerBand ? 1 : -1)
  // A comparison with na is false: on bar 0 (close[1] na) both bands take nz(na) = 0, so the supertrend is 0.
  const nz = (v: number) => (isNaN(v) ? 0 : v);
  let lastLowerBand = NaN;
  let lastUpperBand = NaN;
  let prevSuperTrend = NaN;

  for (let i = 0; i < source.length; i++) {
    const atrValue = atrValues[i]! * factor;
    let upperBand = source[i]! + atrValue;
    let lowerBand = source[i]! - atrValue;
    const prevLowerBand = nz(lastLowerBand);
    const prevUpperBand = nz(lastUpperBand);

    // Price compared with the bands: close, or low / high with wicks
    const highPrice = wicks ? high[i]! : close[i]!;
    const lowPrice = wicks ? low[i]! : close[i]!;
    const prevLowPrice = i > 0 ? (wicks ? low[i - 1]! : close[i - 1]!) : NaN;
    const prevHighPrice = i > 0 ? (wicks ? high[i - 1]! : close[i - 1]!) : NaN;

    lowerBand = lowerBand > prevLowerBand || prevLowPrice < prevLowerBand ? lowerBand : prevLowerBand;
    upperBand = upperBand < prevUpperBand || prevHighPrice > prevUpperBand ? upperBand : prevUpperBand;

    let currentDirection: int;
    if (i === 0 || isNaN(atrValues[i - 1]!)) {
      currentDirection = 1;
    } else if (prevSuperTrend === prevUpperBand) {
      // Was in downtrend (following upper band)
      currentDirection = highPrice > upperBand ? -1 : 1;
    } else {
      // Was in uptrend (following lower band)
      currentDirection = lowPrice < lowerBand ? 1 : -1;
    }

    const superTrendValue = currentDirection === -1 ? lowerBand : upperBand;
    supertrendValues.push(superTrendValue);
    directions.push(currentDirection);

    lastLowerBand = lowerBand;
    lastUpperBand = upperBand;
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
 * - Formula: `RMA = (source + (length - 1) * RMA[1]) / length`, evaluated in this order as in PineScript
 *   (equal to `alpha * source + (1 - alpha) * RMA[1]`, but bit for bit)
 * - `na` values (also +/-Infinity) in the source series are ignored
 * - The function calculates on the `length` quantity of non-`na` values
 *
 * @example
 * ```typescript
 * const rma14 = ta.rma(closePrices, 14);
 * // Used internally by RSI:
 * // avgGain = ta.rma(gains, 14);
 * // avgLoss = ta.rma(losses, 14);
 * ```
 */
export function rma(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  // Floor the length to match PineScript's auto-truncation of float to int
  const len = Math.floor(length);

  // Find the first index where we have enough non-na values for SMA initialization.
  // An infinite value is na, as in PineScript.
  let firstValidIndex = -1;
  let validCount = 0;
  let initSum = 0;

  for (let i = 0; i < source.length; i++) {
    const val = source[i];
    if (val !== undefined && Number.isFinite(val)) {
      initSum += val;
      validCount++;
      if (validCount === len) {
        firstValidIndex = i;
        break;
      }
    }
  }

  // Initialize RMA value with SMA of first `length` non-NaN values
  let rmaValue = validCount > 0 ? initSum / validCount : NaN;
  const rmaInitialized = firstValidIndex >= 0;

  for (let i = 0; i < source.length; i++) {
    if (!rmaInitialized || i < firstValidIndex) {
      // Not enough data yet for RMA
      result.push(NaN);
    } else if (i === firstValidIndex) {
      // First valid RMA value
      result.push(rmaValue);
    } else {
      const val = source[i];
      if (val !== undefined && Number.isFinite(val)) {
        // PineScript evaluates (source + (length - 1) * RMA[1]) / length; the form
        // alpha * source + (1 - alpha) * RMA[1] differs in the last bits
        rmaValue = (val + (len - 1) * rmaValue) / len;
        result.push(rmaValue);
      } else {
        // na source: na on this bar; the next bar continues from the last value (as in PineScript)
        result.push(NaN);
      }
    }
  }

  return result;
}

/**
 * One step of the PineScript ta.wma sum: `a + b`, or 0 when `|a + b| <= 1e-10 * max(1, |a| + |b|)`.
 * Measured bit for bit: a sum that cancels to a tiny residue (relative to the operands, or below 1e-10) is 0.
 */
function wmaAdd(a: number, b: number): number {
  const sum = a + b;
  return Math.abs(sum) <= 1e-10 * Math.max(1, Math.abs(a) + Math.abs(b)) ? 0 : sum;
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
 * - As in PineScript: na on a bar whose source is `na` (also +/-Infinity) and until `length` non-`na` values were
 *   received; an `na` value inside the window is replaced by the previous non-`na` value
 * - Summed from the oldest value to the newest; as PineScript, a partial sum `s + t` with
 *   `|s + t| <= 1e-10 * max(1, |s| + |t|)` is 0 (a cancellation residue, or values below 1e-10)
 * - More responsive to recent price changes than SMA
 *
 * @example
 * ```typescript
 * const wma20 = ta.wma(closePrices, 20);
 * // WMA gives more weight to recent prices
 * ```
 */
export function wma(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  // Floor the length to match PineScript's auto-truncation of float to int
  const len = Math.floor(length);
  // PineScript: na on a bar with an na source (also +/-Infinity) and until `len` non-na values were received;
  // otherwise the last `len` bars, each na replaced by the previous non-na value
  const filled: number[] = [];
  let last = NaN;
  let count = 0;
  for (let i = 0; i < source.length; i++) {
    const v = source[i];
    const isNa = v === undefined || v === null || !Number.isFinite(v);
    if (!isNa) {
      last = v;
      count++;
    }
    filled.push(last);
    if (isNa || count < len) {
      result.push(NaN);
      continue;
    }
    // Summed from the oldest bar (weight 1) to the newest (weight len), as PineScript (bit for bit)
    let sum = 0;
    let weightSum = 0;
    for (let j = len - 1; j >= 0; j--) {
      const weight = len - j;
      sum = wmaAdd(sum, filled[i - j]! * weight);
      weightSum += weight;
    }
    result.push(sum / weightSum);
  }
  return result;
}

/**
 * Highest value over the last `length` bars.
 *
 * @param source - Series of values to process
 * @param length - Number of bars
 * @returns Highest value series (na on the first `length - 1` bars)
 *
 * @remarks
 * As in PineScript: an `na` value ends the window, so only the values after the last `na`
 * count, and a bar whose own value is `na` gives `na`.
 * PineScript `ta.highest(length)` (source = high) is `ta.highest(length)` in the script API.
 */
export function highest(source: Source, length: simple_int): series_float {
  return extremeValue(source, length, false);
}

/**
 * Lowest value over the last `length` bars.
 *
 * @param source - Series of values to process
 * @param length - Number of bars
 * @returns Lowest value series (na on the first `length - 1` bars)
 *
 * @remarks
 * As in PineScript: an `na` value ends the window, so only the values after the last `na`
 * count, and a bar whose own value is `na` gives `na`.
 */
export function lowest(source: Source, length: simple_int): series_float {
  return extremeValue(source, length, true);
}

/**
 * Cumulative Sum - returns the total sum of all elements from the beginning.
 *
 * @param source - Series of values to process
 * @returns Series containing the cumulative sum at each bar
 *
 * @remarks
 * - Returns the running total of all values from index 0 to current index
 * - As in PineScript: an `na` value adds nothing to the sum,
 *   and the result is `na` on that bar only; the sum continues on the next bars
 * - Useful for calculating total volume, total trades, etc.
 *
 * @example
 * ```typescript
 * const cumulativeVolume = ta.cum(volume);
 * const totalGains = ta.cum(gains);
 * ```
 */
export function cum(source: Source): series_float {
  let sum = 0;
  return source.map((v) => {
    // PineScript: an na value (also +/-Infinity) gives na on its bar and is not added
    if (!Number.isFinite(v)) return NaN;
    sum += v;
    return sum;
  });
}

/**
 * Cross - returns true when two series cross each other (either direction).
 *
 * @param source1 - First series
 * @param source2 - Second series
 * @returns Boolean series (true at cross points)
 *
 * @remarks
 * - True when: (source1[i] > source2[i] AND source1[j] <= source2[j]) OR
 *              (source1[i] < source2[i] AND source1[j] >= source2[j]),
 *   where j is the last bar before i where both values were not na
 * - First value is always false (no previous value to compare)
 * - Detects any crossing (either over or under)
 * - Use `ta.crossover()` or `ta.crossunder()` for directional crosses
 *
 * @example
 * ```typescript
 * const crossed = ta.cross(fastMA, slowMA);
 * // Detect any MA crossover
 * ```
 */
export function cross(source1: Source, source2: Source): series_bool {
  return crossTest(source1, source2, (a, b, pa, pb) => (a > b && pa <= pb) || (a < b && pa >= pb));
}

/**
 * ta.rising / ta.falling: true when each of the `length` steps between the last `length + 1` non-na values (up to
 * the current bar) passes `step(newer, older)`; false when there are fewer non-na values.
 *
 * @internal
 */
function monotonic(source: Source, length: simple_int, step: (newer: number, older: number) => boolean): series_bool {
  const result: series_bool = [];
  const values: number[] = []; // non-na values so far
  for (let i = 0; i < source.length; i++) {
    const v = source[i]!;
    if (!Number.isNaN(v)) values.push(v);
    const n = values.length;
    let ok = n > length;
    for (let j = 1; ok && j <= length; j++) ok = step(values[n - j]!, values[n - j - 1]!);
    result.push(ok);
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
 * PineScript rules:
 * - each of the `length` steps is a rise larger than the 1e-10 tolerance
 * - `na` values are skipped: the steps are between the last `length + 1` non-`na` values up to the current bar
 *   (on an `na` bar, the result of the last non-`na` bar)
 * - false while there are fewer than `length + 1` non-`na` values
 *
 * @example
 * ```typescript
 * const isRising = ta.rising(close, 3);
 * // Detect upward momentum
 * ```
 */
export function rising(source: Source, length: simple_int): series_bool {
  return monotonic(source, length, gt);
}

/**
 * Falling - returns true if source is falling for length bars.
 *
 * @param source - Series of values to process
 * @param length - Number of bars (length)
 * @returns Boolean series (true when falling)
 *
 * @remarks
 * PineScript rules:
 * - each of the `length` steps is a fall larger than the 1e-10 tolerance
 * - `na` values are skipped: the steps are between the last `length + 1` non-`na` values up to the current bar
 *   (on an `na` bar, the result of the last non-`na` bar)
 * - false while there are fewer than `length + 1` non-`na` values
 *
 * @example
 * ```typescript
 * const isFalling = ta.falling(close, 3);
 * // Detect downward momentum
 * ```
 */
export function falling(source: Source, length: simple_int): series_bool {
  return monotonic(source, length, lt);
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
 */
export function dev(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  // PineScript: na when the window of `length` bars holds an na value
  const meanValues = strictWindowMean(source, length);

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
 * - Computed as PineScript, bit for bit, from compensated running sums of the values and of their squares:
 *   biased `sumSq / length - mean * mean`, unbiased `sumSq / (length - 1) - mean * sum / (length - 1)`
 *
 * @example
 * ```typescript
 * const variance20 = ta.variance(closePrices, 20);
 * const sampleVariance = ta.variance(closePrices, 20, false);
 * ```
 */
export function variance(
  source: Source,
  length: simple_int | ArrayLike<number>,
  biased: simple_bool = true
): series_float {
  return varianceOf(source, length, biased, 'ta.variance');
}

/** {@link variance} with a fixed or a series length; `name` is used in the error messages. */
function varianceOf(
  source: Source,
  length: simple_int | ArrayLike<number>,
  biased: boolean,
  name: string
): series_float {
  if (typeof length !== 'number') {
    const result = runningVarianceSeries(source, length, biased, name);
    return biased ? result : result.map((v, i) => (Math.floor(length[i]!) > 1 ? v : NaN));
  }
  const len = Math.floor(length);
  // PineScript: the last `len` non-na values (also +/-Infinity skipped), as ta.sma
  if ((biased ? len : len - 1) <= 0) return source.map(() => NaN);
  return runningVariance(source, len, biased);
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
 * - For an even length, returns the average of the two middle values
 * - As in PineScript: `na` values are skipped, the window holds the last `length` non-na values
 *   (going back as many bars as needed), and a bar whose own value is `na` still gets a result
 * - Returns NaN until `length` non-na values exist
 * - More robust to outliers than mean (SMA)
 *
 * @example
 * ```typescript
 * const median20 = ta.median(closePrices, 20);
 * // Median is less affected by extreme values than SMA
 * ```
 */
export function median(source: Source, length: simple_int): series_float {
  const len = Math.floor(length);
  const n = source.length;
  const out: series_float = new Array<number>(n).fill(NaN);
  if (!(len >= 1)) return out;
  // The last `len` non-na values, sorted; equal values (also +0 / -0) from the newest to the oldest, which is the
  // order a stable sort of the window gives, so the middle values are the same numbers.
  const sorted: number[] = [];
  const kept = new Float64Array(n); // the non-na values in bar order
  let count = 0;
  /** First position whose value is >= v (`after`: > v). */
  const bound = (v: number, after: boolean): number => {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (after ? sorted[m]! <= v : sorted[m]! < v) lo = m + 1;
      else hi = m;
    }
    return lo;
  };
  const mid = Math.floor(len / 2);
  for (let i = 0; i < n; i++) {
    const x = source[i]!;
    if (!Number.isNaN(x)) {
      kept[count++] = x;
      sorted.splice(bound(x, false), 0, x); // before the equal values: the newest first
      // the value leaving the window is the oldest, so the last of its equal values
      if (count > len) sorted.splice(bound(kept[count - 1 - len]!, true) - 1, 1);
    }
    if (count >= len) out[i] = len % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  }
  return out;
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
 * - As PineScript (bit for bit): x = 1 (oldest) .. length (newest), sums from the oldest value,
 *   `slope = (length * sumXY - sumX * sumY) / (length * sumX2 - sumX * sumX)`,
 *   `intercept = sumY / length - slope * sumX / length + slope`
 * - offset=0 gives current fitted value, offset<0 gives future projection
 * - `na` values in the source series are included in calculations and will produce an `na` result
 * - Useful for trend detection and prediction
 *
 * @example
 * ```typescript
 * const linreg20 = ta.linreg(closePrices, 20, 0);
 * const linregFuture = ta.linreg(closePrices, 20, -5); // Project 5 bars ahead
 * ```
 */
export function linreg(source: Source, length: simple_int, offset: simple_int = 0): series_float {
  const result: series_float = [];
    // Floor the length to match PineScript's auto-truncation of float to int
    const len = Math.floor(length);

  for (let i = 0; i < source.length; i++) {
      if (i < len - 1) {
      result.push(NaN);
    } else {
      // Check for NaN values in window
      let hasNaN = false;
          for (let j = 0; j < len; j++) {
        if (isNaN(source[i - j]!)) {
          hasNaN = true;
          break;
        }
      }

      if (hasNaN) {
        result.push(NaN);
      } else {
        // Least squares as PineScript: x = 1 (oldest) .. len (newest), summed from the oldest value; the intercept
        // is the fitted value at x = 1
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;
        for (let j = 0; j < len; j++) {
          const x = j + 1;
          const y = source[i - (len - 1 - j)]!;
          sumX += x;
          sumY += y;
          sumXY += x * y;
          sumX2 += x * x;
        }
        const slope = (len * sumXY - sumX * sumY) / (len * sumX2 - sumX * sumX);
        const intercept = sumY / len - (slope * sumX) / len + slope;
        result.push(intercept + slope * (len - 1 - offset));
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
 */
export function correlation(source1: Source, source2: Source, length: simple_int): series_float {
  const result: series_float = [];
  // the non-NaN pairs of the window, newest first (reused on every bar)
  const span = length > 0 ? Math.ceil(length) : 0;
  const a = new Float64Array(span);
  const b = new Float64Array(span);

  for (let i = 0; i < source1.length; i++) {
    if (i < length - 1) {
      result.push(NaN);
      continue;
    }
    let m = 0;
    for (let j = 0; j < length; j++) {
      const v1 = source1[i - j]!;
      const v2 = source2[i - j]!;
      if (!isNaN(v1) && !isNaN(v2)) {
        a[m] = v1;
        b[m] = v2;
        m++;
      }
    }
    if (m === 0) {
      result.push(NaN);
      continue;
    }

    // Calculate means
    let sum1 = 0;
    let sum2 = 0;
    for (let k = 0; k < m; k++) {
      sum1 += a[k]!;
      sum2 += b[k]!;
    }
    const mean1 = sum1 / m;
    const mean2 = sum2 / m;

    // Calculate correlation components
    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;
    for (let k = 0; k < m; k++) {
      const dev1 = a[k]! - mean1;
      const dev2 = b[k]! - mean2;
      numerator += dev1 * dev2;
      sum1Sq += dev1 * dev1;
      sum2Sq += dev2 * dev2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    result.push(denominator === 0 ? NaN : numerator / denominator);
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
 *
 * PineScript rules:
 * - percentrank = count(source[k] <= source, k = 1..length) * 100 / length (in this order: the PineScript bits)
 * - a value from bar `length` on, when the current source is not `na`; an `na` value in the window counts as not
 *   `<=` the current value
 * - the comparison uses the 1e-10 tolerance
 *
 * @example
 * ```typescript
 * const pctrank = ta.percentrank(closePrices, 100);
 * // Values near 100 indicate recent strength
 * // Values near 0 indicate recent weakness
 * ```
 */
export function percentrank(source: Source, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    const currentValue = source[i]!;
    if (i < length || Number.isNaN(currentValue)) {
      result.push(NaN);
      continue;
    }
    // le() is false for an na value in the window
    let countLessOrEqual = 0;
    for (let j = 1; j <= length; j++) {
      if (le(source[i - j]!, currentValue)) countLessOrEqual++;
    }
    result.push((countLessOrEqual * 100) / length);
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
 * - As in PineScript: when the mean deviation is 0 (1e-10 tolerance, a flat window), the CCI of the previous bar
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
 */
export function cci(source: Source, length: simple_int): series_float {
  const result: series_float = [];
  const smaValues = sma(source, length);
  const devValues = dev(source, length);

  for (let i = 0; i < source.length; i++) {
    if (isNaN(smaValues[i]!) || isNaN(devValues[i]!)) {
      result.push(NaN);
    } else if (eq(devValues[i]!, 0)) {
      result.push(i > 0 ? result[i - 1]! : NaN);
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
 * - As PineScript: when the source, \`highest(high, length)\` or \`lowest(low, length)\` is \`na\`, or the range is 0, the
 *   result is the previous result of the call (\`na\` until a first value)
 *
 * @example
 * \`\`\`typescript
 * const stochK = ta.stoch(close, high, low, 14);
 * // Smooth with SMA for %D line:
 * const stochD = ta.sma(stochK, 3);
 * \`\`\`
 */
export function stoch(source: Source, high: Source, low: Source, length: simple_int): series_float {
  const result: series_float = [];
  const lowestValues = lowest(low, length);
  const highestValues = highest(high, length);

  // PineScript: an na input or a zero range keeps the previous result
  let previous = NaN;
  for (let i = 0; i < source.length; i++) {
    const value = source[i]!;
    const lo = lowestValues[i]!;
    const range = highestValues[i]! - lo;
    if (!Number.isNaN(value) && !Number.isNaN(range) && range !== 0) previous = (100 * (value - lo)) / range;
    result.push(previous);
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
 */
export function mfi(source: Source, length: simple_int, volume?: Source): series_float {
  if (!volume) {
    throw new Error(
      'ta.mfi() requires volume series. ' +
      'Either pass it explicitly or use createContext({ chart: { ..., volume } }) for implicit data.'
    );
  }

  // PineScript reference:
  //   upper = math.sum(volume * (ta.change(src) <= 0 ? 0 : src), length)
  //   lower = math.sum(volume * (ta.change(src) >= 0 ? 0 : src), length)
  // A comparison with na is false, so a bar with an na change (bar 0) adds its money flow to both sums.
  // The comparisons use the 1e-10 tolerance of Pine operators.
  const upperFlow: number[] = [];
  const lowerFlow: number[] = [];
  for (let i = 0; i < source.length; i++) {
    const change = i === 0 ? NaN : source[i]! - source[i - 1]!;
    const flow = volume[i]! * source[i]!;
    upperFlow.push(le(change, 0) ? 0 : flow);
    lowerFlow.push(ge(change, 0) ? 0 : flow);
  }
  // math.sum: the compensated running sum of the last `length` non-na values (as PineScript, bit for bit)
  const upper = runningSum(upperFlow, length);
  const lower = runningSum(lowerFlow, length);

  return upper.map((u, i) => {
    const l = lower[i]!;
    if (Number.isNaN(u) || Number.isNaN(l)) return NaN;
    if (l === 0) return 100;
    return 100 - 100 / (1 + u / l);
  });
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
 * Pivot detection as PineScript computes it.
 *
 * The value of the pivot bar is returned `rightbars` bars later, on the bar where the pivot is
 * confirmed, so no future bar is used. A pivot high may equal values on its left but must be higher
 * than every value on its right (a pivot low: equal on the left, lower on the right). An `na`
 * neighbour ends the check on its side; an `na` pivot value gives no pivot.
 */
function pivot(source: Source, leftbars: simple_int, rightbars: simple_int, isHigh: boolean): series_float {
  // "beats" = the neighbour prevents the pivot
  const beatsLeft = isHigh ? (x: number, v: number) => x > v : (x: number, v: number) => x < v;
  const beatsRight = isHigh ? (x: number, v: number) => x >= v : (x: number, v: number) => x <= v;

  return source.map((_, i) => {
    const center = i - rightbars;
    if (center - leftbars < 0) return NaN;
    const v = source[center]!;
    if (Number.isNaN(v)) return NaN;
    for (let j = 1; j <= leftbars; j++) {
      const x = source[center - j]!;
      if (Number.isNaN(x)) break;
      if (beatsLeft(x, v)) return NaN;
    }
    for (let j = 1; j <= rightbars; j++) {
      const x = source[center + j]!;
      if (Number.isNaN(x)) break;
      if (beatsRight(x, v)) return NaN;
    }
    return v;
  });
}

/**
 * Pivot High - detects pivot high points in the price series.
 *
 * @param sourceOrLeftbars - Source series or leftbars (overloaded)
 * @param leftbarsOrRightbars - Leftbars or rightbars (overloaded)
 * @param rightbars - Number of bars to the right (optional)
 * @param high - High price series (used in 2-param version)
 * @returns Series with the pivot high value on the bar where the pivot is confirmed
 *   (`rightbars` bars after the pivot bar), NaN elsewhere
 *
 * @remarks
 * - As in PineScript, the value appears `rightbars` bars after the pivot bar: the pivot bar
 *   index is `i - rightbars`
 * - A pivot high may equal values on its left but must be higher than all values on its right
 * - An `na` neighbour ends the check on its side
 *
 * @example
 * ```typescript
 * const pivotHighs = ta.pivothigh(high, 2, 2);
 * // pivotHighs[i] is high[i - 2] when bar i - 2 is a pivot high
 * ```
 */
export function pivothigh(
  sourceOrLeftbars: Source | simple_int,
  leftbarsOrRightbars: simple_int,
  rightbars?: simple_int,
  high?: Source
): series_float {
  if (rightbars === undefined) {
    if (!high) {
      throw new Error('ta.pivothigh() requires high series when using two-parameter version.');
    }
    return pivot(high, sourceOrLeftbars as simple_int, leftbarsOrRightbars, true);
  }
  return pivot(sourceOrLeftbars as Source, leftbarsOrRightbars, rightbars, true);
}

/**
 * Pivot Low - detects pivot low points in the price series.
 *
 * @param sourceOrLeftbars - Source series or leftbars (overloaded)
 * @param leftbarsOrRightbars - Leftbars or rightbars (overloaded)
 * @param rightbars - Number of bars to the right (optional)
 * @param low - Low price series (used in 2-param version)
 * @returns Series with the pivot low value on the bar where the pivot is confirmed
 *   (`rightbars` bars after the pivot bar), NaN elsewhere
 *
 * @remarks
 * - As in PineScript, the value appears `rightbars` bars after the pivot bar: the pivot bar
 *   index is `i - rightbars`
 * - A pivot low may equal values on its left but must be lower than all values on its right
 * - An `na` neighbour ends the check on its side
 *
 * @example
 * ```typescript
 * const pivotLows = ta.pivotlow(low, 2, 2);
 * // pivotLows[i] is low[i - 2] when bar i - 2 is a pivot low
 * ```
 */
export function pivotlow(
  sourceOrLeftbars: Source | simple_int,
  leftbarsOrRightbars: simple_int,
  rightbars?: simple_int,
  low?: Source
): series_float {
  if (rightbars === undefined) {
    if (!low) {
      throw new Error('ta.pivotlow() requires low series when using two-parameter version.');
    }
    return pivot(low, sourceOrLeftbars as simple_int, leftbarsOrRightbars, false);
  }
  return pivot(sourceOrLeftbars as Source, leftbarsOrRightbars, rightbars, false);
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
 */
export function dmi(
  diLength: simple_int,
  adxSmoothing: simple_int,
  high: Source,
  low: Source,
  close: Source
): [series_float, series_float, series_float] {
  // PineScript reference (built-in DMI):
  //   up = ta.change(high), down = -ta.change(low)
  //   plusDM = na(up) ? na : (up > down and up > 0 ? up : 0), minusDM likewise
  //   trur = ta.rma(ta.tr, len)
  //   plus = fixnan(100 * ta.rma(plusDM, len) / trur), minus likewise
  //   adx = 100 * ta.rma(math.abs(plus - minus) / (sum == 0 ? 1 : sum), lensig)
  const len = Math.max(high.length, low.length, close.length);
  const plusDM: series_float = [];
  const minusDM: series_float = [];
  for (let i = 0; i < len; i++) {
    const up = i === 0 ? NaN : high[i]! - high[i - 1]!;
    const down = i === 0 ? NaN : low[i - 1]! - low[i]!;
    plusDM.push(Number.isNaN(up) ? NaN : gt(up, down) && gt(up, 0) ? up : 0);
    minusDM.push(Number.isNaN(down) ? NaN : gt(down, up) && gt(down, 0) ? down : 0);
  }

  const trur = rma(tr(false, high, low, close), diLength);
  const smoothedPlus = rma(plusDM, diLength);
  const smoothedMinus = rma(minusDM, diLength);
  // x / 0 is na; fixnan keeps the previous value
  const directional = (smoothed: series_float): series_float => {
    let last = NaN;
    return smoothed.map((v, i) => {
      const t = trur[i]!;
      const value = t === 0 ? NaN : (100 * v) / t;
      if (!Number.isNaN(value)) last = value;
      return last;
    });
  };
  const plusDI = directional(smoothedPlus);
  const minusDI = directional(smoothedMinus);

  const dx = plusDI.map((plus, i) => {
    const minus = minusDI[i]!;
    const sum = plus + minus;
    return Math.abs(plus - minus) / (eq(sum, 0) ? 1 : sum);
  });
  const adx = rma(dx, adxSmoothing).map((v) => 100 * v);

  return [plusDI, minusDI, adx];
}

/**
 * True Strength Index - momentum oscillator based on double smoothed momentum.
 *
 * @param source - Series of values to process
 * @param shortLength - Short smoothing length
 * @param longLength - Long smoothing length
 * @returns TSI series, a value in [-1, 1]
 *
 * @remarks
 * - As PineScript: `ta.ema(ta.ema(m, longLength), shortLength) / ta.ema(ta.ema(math.abs(m), longLength), shortLength)`
 *   with `m = source - source[1]` (not scaled by 100)
 * - na when the denominator is 0 (a constant source), as a PineScript division by zero
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
 */
export function tsi(source: Source, shortLength: simple_int, longLength: simple_int): series_float {
  const momentum: series_float = [];

  // Calculate momentum (price change)
  for (let i = 0; i < source.length; i++) {
    if (i === 0) {
      momentum.push(NaN);
    } else {
      momentum.push(source[i]! - source[i - 1]!);
    }
  }

  // Double smooth momentum
  const smoothedMomentum = ema(ema(momentum, longLength), shortLength);

  // Double smooth absolute momentum
  const absMomentum = momentum.map(Math.abs);
  const smoothedAbsMomentum = ema(ema(absMomentum, longLength), shortLength);

  // PineScript: a value in [-1, 1]; a division by zero is na
  return smoothedMomentum.map((m, i) => {
    const d = smoothedAbsMomentum[i]!;
    return d === 0 ? NaN : m / d;
  });
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
 * - As in PineScript: the sums are the running sums of `math.sum` (bit for bit), and a flat window (every change 0)
 *   is `0 / 0` = na
 * - More volatile than RSI
 *
 * @example
 * ```typescript
 * const cmo = ta.cmo(close, 14);
 * // CMO > 50: overbought
 * // CMO < -50: oversold
 * ```
 */
export function cmo(source: Source, length: simple_int): series_float {
  // PineScript definition: mom = ta.change(src), sm1 = math.sum(mom >= 0 ? mom : 0, length),
  // sm2 = math.sum(mom >= 0 ? 0 : -mom, length), cmo = 100 * (sm1 - sm2) / (sm1 + sm2), with the running sums of
  // math.sum (bit for bit). A comparison with na is false: an na change adds 0 to sm1 and na (skipped) to sm2.
  const up: number[] = [];
  const down: number[] = [];
  for (let i = 0; i < source.length; i++) {
    const mom = i > 0 ? source[i]! - source[i - 1]! : NaN;
    up.push(mom >= 0 ? mom : 0);
    down.push(mom >= 0 ? 0 : -mom);
  }
  const sm1 = runningSum(up, length);
  const sm2 = runningSum(down, length);
  // a flat window is 0 / 0 = na
  return sm1.map((s1, i) => (100 * (s1 - sm2[i]!)) / (s1 + sm2[i]!));
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
    // PineScript reference: ta.tr, which is na on bar 0
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
 * Volume Weighted Average Price, restarted on each bar where `anchor` is true.
 *
 * @param source - Source series (PineScript default `hlc3`)
 * @param volume - Volume series
 * @param anchor - Reset condition per bar (PineScript `anchor`). Without it the sums never restart;
 *   PineScript's default anchor is a new day (`timeframe.change("1D")`), which needs the exchange session
 * @param stdev_mult - When given, also returns the bands `vwap ± stdev_mult × stdev`
 * @returns The VWAP series, or `[vwap, upper, lower]` when `stdev_mult` is given
 *
 * @remarks
 * As in PineScript: the sums restart on anchor bars; the standard deviation is
 * `sqrt(Σ(volume × source²) / Σvolume − vwap²)`.
 */
export function vwap(source: Source, volume: Source, anchor?: ArrayLike<boolean | number>): series_float;
export function vwap(
  source: Source,
  volume: Source,
  anchor: ArrayLike<boolean | number> | undefined,
  stdev_mult: simple_float
): [series_float, series_float, series_float];
export function vwap(
  source: Source,
  volume: Source,
  anchor?: ArrayLike<boolean | number>,
  stdev_mult?: simple_float
): series_float | [series_float, series_float, series_float] {
  if (source.length !== volume.length) {
    throw new Error('ta.vwap: source and volume must have the same length');
  }
  const mid: series_float = [];
  const upper: series_float = [];
  const lower: series_float = [];
  let sumPV = 0;
  let sumV = 0;
  let sumPPV = 0;
  for (let i = 0; i < source.length; i++) {
    if (anchor && anchor[i]) {
      sumPV = 0;
      sumV = 0;
      sumPPV = 0;
    }
    const s = source[i]!;
    const v = volume[i]!;
    if (!Number.isNaN(s) && !Number.isNaN(v)) {
      sumPV += s * v;
      sumV += v;
      sumPPV += s * s * v;
    }
    const m = sumV === 0 ? NaN : sumPV / sumV;
    mid.push(m);
    if (stdev_mult !== undefined) {
      const sd = Math.sqrt(Math.max(0, sumPPV / sumV - m * m));
      upper.push(m + stdev_mult * sd);
      lower.push(m - stdev_mult * sd);
    }
  }
  return stdev_mult === undefined ? mid : [mid, upper, lower];
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
 */
export function alma(
  source: Source,
  length: simple_int = 9,
  offset: simple_float = 0.85,
  sigma: simple_float = 6,
  floor: boolean = false
): series_float {
  const result: series_float = [];
    const m = floor ? Math.floor(offset * (length - 1)) : offset * (length - 1);
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
 * Difference between the highest and the lowest value over the last `length` non-na values
 * (PineScript `ta.range(source, length)`).
 *
 * @remarks
 * As in PineScript: `na` values are skipped (the window holds the last `length` non-na
 * values), and a bar whose own value is `na` still gets a result.
 */
export function range(source: Source, length: simple_int): series_float {
  return source.map((_, i) => {
    const values = lastValues(source, i, length);
    return values ? Math.max(...values) - Math.min(...values) : NaN;
  });
}

/**
 * Offset to the bar with the highest value over the last `length` bars: 0 for the current bar,
 * -1 for the previous bar, and so on (as in PineScript, the offset is negative).
 *
 * @remarks
 * As in PineScript: on equal values the oldest bar wins; an `na` value ends the window;
 * 0 when the window has no value.
 */
export function highestbars(source: Source, length: simple_int): series_int {
  return extremeOffset(source, length, false);
}

/**
 * Offset to the bar with the lowest value over the last `length` bars: 0 for the current bar,
 * -1 for the previous bar, and so on (as in PineScript, the offset is negative).
 *
 * @remarks
 * As in PineScript: on equal values the oldest bar wins; an `na` value ends the window;
 * 0 when the window has no value.
 */
export function lowestbars(source: Source, length: simple_int): series_int {
  return extremeOffset(source, length, true);
}

/**
 * All-time highest value of `source` up to each bar (PineScript `ta.max(source)`).
 *
 * @remarks
 * As in PineScript: `na` values are skipped, the value carries over `na` bars, and the
 * result is `na` until the first non-na value.
 */
export function max(source: Source): series_float {
  let best = NaN;
  return source.map((x) => {
    if (!Number.isNaN(x) && !(x <= best)) best = x;
    return best;
  });
}

/**
 * All-time lowest value of `source` up to each bar (PineScript `ta.min(source)`).
 *
 * @remarks
 * As in PineScript: `na` values are skipped, the value carries over `na` bars, and the
 * result is `na` until the first non-na value.
 */
export function min(source: Source): series_float {
  let best = NaN;
  return source.map((x) => {
    if (!Number.isNaN(x) && !(x >= best)) best = x;
    return best;
  });
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
 * - The result will NOT always be a member of the input data set
 * - Uses linear interpolation between adjacent values when needed
 * - Returns NaN for the first (length - 1) values where there's insufficient data
 *
 * PineScript rules:
 * - position in the sorted window: `percentage / 100 * length - 0.5`, clamped to the first / last value, linear
 *   interpolation between the two neighbours (na when a neighbour is na, also at an exact position)
 * - `na` values stay in the window (window size = `length`). The window is kept sorted from bar to bar: the new
 *   value is inserted before the first value `>=` it, passing the `na` values (an `na` goes last), then the value
 *   leaving the window is removed. So the place of an `na` depends on the history: at the start of a series the
 *   `na` values are before all numbers
 */
export function percentile_linear_interpolation(
  source: Source,
  length: simple_int,
  percentage: number
): series_float {
  return sortedWindow(source, length, (s) => {
    const pos = (percentage / 100) * length - 0.5;
    if (pos <= 0) return s[0]!;
    if (pos >= length - 1) return s[length - 1]!;
    const lo = Math.floor(pos);
    return s[lo]! + (pos - lo) * (s[lo + 1]! - s[lo]!);
  });
}

/**
 * Sorted window of ta.percentile_*, as PineScript keeps it: each bar first inserts the new value before the first
 * value `>=` it (scanning from the start; an `na` is never `>=`, so a value passes the `na` values and an `na` goes
 * last), then removes the value of the bar leaving the window. `fn` reads the sorted window (`length` values).
 * na for the first `length - 1` bars.
 *
 * @internal
 */
function sortedWindow(source: Source, length: simple_int, fn: (sorted: number[]) => number): series_float {
  const result: series_float = [];
  const values: number[] = []; // sorted window
  const bars: number[] = []; // bar index of each value
  for (let i = 0; i < source.length; i++) {
    const v = source[i]!;
    let k = 0;
    while (k < values.length && !(values[k]! >= v)) k++;
    values.splice(k, 0, v);
    bars.splice(k, 0, i);
    if (i >= length) {
      const old = bars.indexOf(i - length);
      values.splice(old, 1);
      bars.splice(old, 1);
    }
    result.push(i < length - 1 ? NaN : fn(values));
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
 * - The result will ALWAYS be a member of the input data set
 * - The 100th percentile is defined as the largest value
 * - Using this method on lengths < 100 may result in the same value for multiple percentiles
 * - Returns NaN for the first (length - 1) values where there's insufficient data
 *
 * PineScript rules:
 * - the value at rank `ceil(percentage / 100 * length)` of the sorted window (na when that rank holds an `na`)
 * - `na` values stay in the window, sorted from bar to bar as in `ta.percentile_linear_interpolation`
 */
export function percentile_nearest_rank(
  source: Source,
  length: simple_int,
  percentage: number
): series_float {
  const rank = Math.min(length, Math.max(1, Math.ceil((percentage / 100) * length)));
  return sortedWindow(source, length, (s) => s[rank - 1]!);
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

    // Calculate D² = sum of (price_rank - time_rank)²
    let sumSquaredDiff = 0;
    for (let j = 0; j < length; j++) {
      const timeRank = j + 1;
      const diff = ranks[j] - timeRank;
      sumSquaredDiff += diff * diff;
    }

    const n = length;
    const base = (n * n * n - n) / 12;

    // Compute tie correction for price ranks
    // Count tied groups from the sorted array
    let tieCorrection = 0;
    for (let j = 0; j < sorted.length; ) {
      let tieCount = 1;
      while (j + tieCount < sorted.length && sorted[j]!.value === sorted[j + tieCount]!.value) {
        tieCount++;
      }
      if (tieCount > 1) {
        tieCorrection += (tieCount * tieCount * tieCount - tieCount) / 12;
      }
      j += tieCount;
    }

    const A = base - tieCorrection; // Corrected for tied price ranks
    const B = base;                 // Time ranks have no ties

    let rho: number;
    if (A === 0 || B === 0) {
      rho = 0;
    } else {
      rho = (A + B - sumSquaredDiff) / (2 * Math.sqrt(A * B));
    }

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

    case 'DM': {
      // DM (Demark) only calculates P, R1, S1
      const x = h + l + (c * 2) + (isNaN(o) ? c : o);
      const newP = x / (isNaN(o) ? 4 : 5);
      levels[0] = newP;
      levels[1] = x / 2 - l;  // R1
      levels[2] = x / 2 - h;  // S1
      // R2-S5 remain NaN
      break;
    }

    case 'Camarilla': {
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
 * @returns Tuple of [zigzag values, direction, pivot flags (boolean)]
 *
 * @remarks
 * - **Parameter order differs from PineScript**: JavaScript signature puts deviation first,
 *   while PineScript uses `ta.zigzag(source, deviation, depth, backstep)`. This allows
 *   deviation to have a default value and makes the API more ergonomic for JS users.
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
 * const [zigzag, direction, isPivot] = ta.zigzag(5, 10, 3, undefined, high, low);
 *
 * // Find pivot prices
 * for (let i = 0; i < zigzag.length; i++) {
 *   if (!isNaN(zigzag[i]!)) {
 *     console.log(`Pivot at bar ${i}: ${zigzag[i]!}, direction: ${direction[i]! === 1 ? 'UP' : 'DOWN'}`);
 *   }
 * }
 * ```
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
    // Use epsilon threshold to avoid numerical instability with very small values
    if (Math.abs(price1) < 1e-10 || isNaN(price1) || isNaN(price2)) return 0;
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
  let startIndex: number;
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

// ── Volume built-in variables (ta.obv, ta.pvt, ta.accdist, ta.nvi, ta.pvi, ta.iii, ta.wad, ta.wvad) ──
//
// In PineScript these are series variables computed from the chart bars. Here they take the
// bar series explicitly.

/**
 * On Balance Volume: `ta.cum(math.sign(ta.change(close)) * volume)`.
 *
 * @param close - Close price series
 * @param volume - Volume series
 * @returns OBV series (`na` on the first bar, and on bars without volume)
 */
export function obv(close: Source, volume: Source): series_float {
  return cum(close.map((c, i) => (i === 0 ? NaN : Math.sign(c - close[i - 1]!) * volume[i]!)));
}

/**
 * Price-Volume Trend: `ta.cum((ta.change(close) / close[1]) * volume)`.
 *
 * @param close - Close price series
 * @param volume - Volume series
 * @returns PVT series (`na` on the first bar, and on bars without volume)
 */
export function pvt(close: Source, volume: Source): series_float {
  return cum(
    close.map((c, i) => (i === 0 ? NaN : ((c - close[i - 1]!) / close[i - 1]!) * volume[i]!))
  );
}

/**
 * Accumulation/Distribution index: the running sum of
 * `(2 * close - low - high) / (high - low) * volume`, with 0 on bars where `high == low`.
 */
export function accdist(high: Source, low: Source, close: Source, volume: Source): series_float {
  return cum(
    close.map((c, i) => {
      const h = high[i]!;
      const l = low[i]!;
      return h === l ? 0 : ((2 * c - l - h) / (h - l)) * volume[i]!;
    })
  );
}

/**
 * Intraday Intensity Index: `(2 * close - high - low) / (high - low) * volume`.
 *
 * The PineScript built-in value is this formula. The formula shown in the PineScript reference,
 * `(2 * close - high - low) / ((high - low) * volume)`, gives other values.
 *
 * @returns III series (`na` where `high == low`)
 */
export function iii(high: Source, low: Source, close: Source, volume: Source): series_float {
  return close.map((c, i) => {
    const range = high[i]! - low[i]!;
    return range === 0 ? NaN : ((2 * c - high[i]! - low[i]!) / range) * volume[i]!;
  });
}

/**
 * Williams Variable Accumulation/Distribution: `(close - open) / (high - low) * volume`.
 *
 * @returns WVAD series (`na` where `high == low`)
 */
export function wvad(open: Source, high: Source, low: Source, close: Source, volume: Source): series_float {
  return close.map((c, i) => {
    const range = high[i]! - low[i]!;
    return range === 0 ? NaN : ((c - open[i]!) / range) * volume[i]!;
  });
}

/**
 * Williams Accumulation/Distribution: the running sum of `close - min(low, close[1])` on up
 * closes, `close - max(high, close[1])` on down closes, and 0 otherwise (first bar included).
 */
export function wad(high: Source, low: Source, close: Source): series_float {
  return cum(
    close.map((c, i) => {
      const prev = i === 0 ? NaN : close[i - 1]!;
      const mom = c - prev;
      if (mom > 0) return c - Math.min(low[i]!, prev);
      if (mom < 0) return c - Math.max(high[i]!, prev);
      return 0;
    })
  );
}

/** Volume index shared by NVI and PVI: moves with the close change on bars selected by `use`. */
function volumeIndex(close: Source, volume: Source, use: (v: number, prevV: number) => boolean): series_float {
  const result: series_float = [];
  let prevIndex = NaN;
  for (let i = 0; i < close.length; i++) {
    const prev = !prevIndex ? 1 : prevIndex; // nz(index[1], 0) == 0 ? 1 : index[1]
    const c = close[i]!;
    const prevC = i === 0 ? NaN : close[i - 1]!;
    let value = prev;
    if (c && prevC) {
      const prevV = i === 0 || Number.isNaN(volume[i - 1]!) ? 0 : volume[i - 1]!;
      if (use(volume[i]!, prevV)) value = prev + ((c - prevC) / prevC) * prev;
    }
    result.push(value);
    prevIndex = value;
  }
  return result;
}

/**
 * Negative Volume Index: moves with the close change only on bars where volume falls.
 * Starts at 1.
 */
export function nvi(close: Source, volume: Source): series_float {
  return volumeIndex(close, volume, (v, prevV) => v < prevV);
}

/**
 * Positive Volume Index: moves with the close change only on bars where volume rises.
 * Starts at 1.
 */
export function pvi(close: Source, volume: Source): series_float {
  return volumeIndex(close, volume, (v, prevV) => v > prevV);
}
