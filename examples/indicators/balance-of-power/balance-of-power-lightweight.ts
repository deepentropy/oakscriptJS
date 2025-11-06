/**
 * Balance of Power Indicator - Lightweight Charts Integration Example
 *
 * This example demonstrates using the PineScript DSL to create indicators
 * that can be integrated with Lightweight Charts.
 *
 * The DSL approach creates indicators that look exactly like PineScript,
 * making transpilation from PineScript straightforward.
 */

import { indicator, plot, compile, close, open, high, low, color } from '@deepentropy/oakscriptjs';

/**
 * Balance of Power indicator using PineScript DSL
 *
 * This matches PineScript syntax:
 * ```pinescript
 * //@version=6
 * indicator("Balance of Power", format=format.price, precision=4)
 * bop = (close - open) / (high - low)
 * plot(bop, color=color.red, linewidth=2)
 * ```
 */

// Define indicator metadata
indicator("Balance of Power", {
  format: "price",
  precision: 4,
  overlay: false
});

// Calculate Balance of Power
// BOP = (close - open) / (high - low)
// Note: Requires Babel plugin for native operators
const bop = (close - open) / (high - low);

// Plot the result
plot(bop, {
  title: "Balance of Power",
  color: color.red,
  linewidth: 2
});

// Export the compiled indicator
export default compile();

/**
 * Example usage in a web application:
 *
 * ```typescript
 * import { createChart } from 'lightweight-charts';
 * import balanceOfPowerIndicator from './balance-of-power-lightweight';
 *
 * // Create chart
 * const chart = createChart(document.getElementById('chart')!, {
 *   width: 800,
 *   height: 600
 * });
 *
 * // Add candlestick series
 * const candlestickSeries = chart.addSeries.Candlestick({
 *   upColor: '#26a69a',
 *   downColor: '#ef5350',
 * });
 *
 * // Set data
 * candlestickSeries.setData([
 *   { time: '2023-01-01', open: 100, high: 105, low: 98, close: 103 },
 *   { time: '2023-01-02', open: 103, high: 107, low: 101, close: 102 },
 *   // ... more data
 * ]);
 *
 * // Create and attach BOP indicator in separate pane
 * const bopController = balanceOfPowerIndicator.bind(chart, candlestickSeries);
 * bopController.attach();
 *
 * // Later: update options
 * // bopController.setOptions({ someOption: 'newValue' });
 *
 * // Later: remove indicator
 * // bopController.detach();
 * ```
 *
 * Note: This example uses native operators which require the Babel plugin.
 * See babel-plugin/pinescript-operators.cjs for setup instructions.
 */
