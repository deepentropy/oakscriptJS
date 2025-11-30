/**
 * MACD Indicator - Native Operators Version
 *
 * Demonstrates complex calculations with multiple plots
 *
 * Original PineScript:
 * ```pinescript
 * //@version=6
 * indicator("MACD", overlay=false)
 * [macdLine, signalLine, histogram] = ta.macd(close, 12, 26, 9)
 * bullish = macdLine > signalLine
 * bearish = macdLine < signalLine
 * strength = histogram * 2
 * plot(macdLine, "MACD", color.blue, 2)
 * plot(signalLine, "Signal", color.orange, 1)
 * plot(histogram, "Histogram", color.gray, 1)
 * hline(0, "Zero", color.gray)
 * ```
 *
 * REQUIRES: Babel plugin for operator transformation
 */

import {
  indicator,
  plot,
  hline,
  close,
  ta,
  color,
  compile
} from '@deepentropy/oakscriptjs';

// Indicator declaration
indicator("MACD", {overlay: false, precision: 4});

// Calculate MACD (returns tuple of Series)
const [macdLine, signalLine, histogram] = ta.macd(close, 12, 26, 9);

// Conditions using NATIVE OPERATORS! 🎉
const bullish = macdLine > signalLine;    // → macdLine.gt(signalLine)
const bearish = macdLine < signalLine;    // → macdLine.lt(signalLine)

// Calculation with operators
const strength = histogram * 2;            // → histogram.mul(2)

// Plot all three lines
plot(macdLine, {title: "MACD", color: color.blue, linewidth: 2});
plot(signalLine, {title: "Signal", color: color.orange, linewidth: 1});
plot(histogram, {title: "Histogram", color: color.gray, style: "histogram"});

// Zero line
hline(0, {title: "Zero", color: color.gray});

// Compile and export
export default compile();

/**
 * After Babel transformation:
 *
 * const [macdLine, signalLine, histogram] = ta.macd(close, 12, 26, 9);
 * const bullish = macdLine.gt(signalLine);
 * const bearish = macdLine.lt(signalLine);
 * const strength = histogram.mul(2);
 *
 * Clean and readable! ✨
 */
