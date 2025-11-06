/**
 * Balance of Power Indicator - PineScript DSL Version
 *
 * This is what OakScriptEngine would generate from PineScript.
 * Notice how it looks EXACTLY like the original PineScript code!
 *
 * Original PineScript:
 * ```pinescript
 * //@version=6
 * indicator("Balance of Power", format=format.price, precision=2)
 * bop = (close - open) / (high - low)
 * plot(bop, "BOP", color.red, 2)
 * hline(0, "Zero Line", color.gray)
 * ```
 *
 * IMPORTANT: Requires Babel plugin for native operators!
 * See: babel-plugin/pinescript-operators.cjs
 */

import {
  indicator,
  plot,
  hline,
  close,
  open,
  high,
  low,
  color,
  format,
  compile
} from '@deepentropy/oakscriptjs';

// Indicator declaration - matches PineScript exactly
indicator("Balance of Power", {format: format.price, precision: 2});

// Calculation - Native operators (requires Babel plugin)
const bop = (close - open) / (high - low);

// Plot - clean DSL syntax
plot(bop, {title: "BOP", color: color.red, linewidth: 2});

// Horizontal line at zero
hline(0, {title: "Zero Line", color: color.gray});

// Compile and export
export default compile();

/**
 * Usage in web application:
 *
 * ```typescript
 * import { createChart } from 'lightweight-charts';
 * import bopIndicator from './balance-of-power-dsl';
 *
 * const chart = createChart(document.getElementById('chart')!, {
 *   width: 800,
 *   height: 600
 * });
 *
 * const candlestickSeries = chart.addCandlestickSeries();
 * candlestickSeries.setData(ohlcvData);
 *
 * // Bind and attach - that's it!
 * const bop = bopIndicator.bind(chart, candlestickSeries);
 * bop.attach();
 * ```
 */
