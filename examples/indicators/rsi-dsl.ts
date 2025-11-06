/**
 * RSI Indicator - PineScript DSL Version
 *
 * Original PineScript:
 * ```pinescript
 * //@version=6
 * indicator("RSI", overlay=false)
 * rsiValue = ta.rsi(close, 14)
 * plot(rsiValue, "RSI", color.purple, 2)
 * hline(70, "Overbought", color.red, linestyle="dashed")
 * hline(30, "Oversold", color.green, linestyle="dashed")
 * hline(50, "Middle", color.gray)
 * ```
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
indicator("RSI", {overlay: false, precision: 2});

// Calculate RSI
const rsiValue = ta.rsi(close, 14);

// Plot RSI line
plot(rsiValue, {title: "RSI", color: color.purple, linewidth: 2});

// Reference lines
hline(70, {title: "Overbought", color: color.red, linestyle: "dashed"});
hline(30, {title: "Oversold", color: color.green, linestyle: "dashed"});
hline(50, {title: "Middle", color: color.gray});

// Compile and export
export default compile();
