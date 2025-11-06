/**
 * Balance of Power Indicator - Native Operators Version
 *
 * This version uses NATIVE OPERATORS thanks to the Babel plugin!
 * It looks EXACTLY like PineScript.
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
 * IMPORTANT: This file requires the Babel plugin to work!
 * Configure Babel with: babel-plugin/pinescript-operators.cjs
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

// Calculation - NATIVE OPERATORS! 🎉
const bop = (close - open) / (high - low);

// Plot - clean DSL syntax
plot(bop, {title: "BOP", color: color.red, linewidth: 2});

// Horizontal line at zero
hline(0, {title: "Zero Line", color: color.gray});

// Compile and export
export default compile();

/**
 * Build Instructions:
 *
 * 1. Install Babel:
 *    npm install --save-dev @babel/core @babel/cli @babel/preset-typescript
 *
 * 2. Create babel.config.js:
 *    module.exports = {
 *      presets: ['@babel/preset-typescript'],
 *      plugins: [
 *        './node_modules/@deepentropy/oakscriptjs/babel-plugin/pinescript-operators.cjs'
 *      ]
 *    };
 *
 * 3. Build:
 *    npx babel balance-of-power-native-operators.ts --out-file balance-of-power.js
 *
 * The output will have operators transformed to method calls:
 *    const bop = close.sub(open).div(high.sub(low));
 *
 * But you write the clean operator version above! ✨
 */

/**
 * Usage in Application:
 *
 * ```typescript
 * import { createChart } from 'lightweight-charts';
 * import bopIndicator from './balance-of-power';  // The transformed version
 *
 * const chart = createChart(document.getElementById('chart')!, {
 *   width: 800,
 *   height: 600
 * });
 *
 * const candlestickSeries = chart.addCandlestickSeries();
 * candlestickSeries.setData(ohlcvData);
 *
 * // Bind and attach
 * const bop = bopIndicator.bind(chart, candlestickSeries);
 * bop.attach();
 * ```
 */
