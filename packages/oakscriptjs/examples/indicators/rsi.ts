/**
 * RSI Indicator - Native Operators Version
 *
 * Shows complex expressions with native operators
 *
 * Original PineScript:
 * ```pinescript
 * //@version=6
 * indicator("RSI with Signals", overlay=false)
 * rsiValue = ta.rsi(close, 14)
 * overbought = rsiValue > 70
 * oversold = rsiValue < 30
 * signal = overbought or oversold
 * plot(rsiValue, "RSI", color.purple, 2)
 * hline(70, "Overbought", color.red)
 * hline(30, "Oversold", color.green)
 * hline(50, "Middle", color.gray)
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
indicator("RSI with Signals", {overlay: false, precision: 2});

// Calculate RSI
const rsiValue = ta.rsi(close, 14);

// Conditions using NATIVE OPERATORS! 🎉
const overbought = rsiValue > 70;   // Transforms to: rsiValue.gt(70)
const oversold = rsiValue < 30;      // Transforms to: rsiValue.lt(30)
const signal = overbought || oversold;  // Transforms to: overbought.or(oversold)

// Plot RSI line
plot(rsiValue, {title: "RSI", color: color.purple, linewidth: 2});

// Reference lines
hline(70, {title: "Overbought", color: color.red, linestyle: "dashed"});
hline(30, {title: "Oversold", color: color.green, linestyle: "dashed"});
hline(50, {title: "Middle", color: color.gray});

// Compile and export
export default compile();

/**
 * After Babel transformation, this becomes:
 *
 * const rsiValue = ta.rsi(close, 14);
 * const overbought = rsiValue.gt(70);
 * const oversold = rsiValue.lt(30);
 * const signal = overbought.or(oversold);
 *
 * But you write the clean version above! ✨
 */
