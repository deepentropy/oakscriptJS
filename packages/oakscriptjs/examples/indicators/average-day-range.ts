/**
 * Average Day Range (ADR) Indicator - Complete DSL Example
 *
 * This example demonstrates:
 * 1. Using input.int() for dynamic parameters
 * 2. Metadata exposure via compile()
 * 3. Series expressions in ta.sma()
 *
 * Original PineScript:
 * ```pinescript
 * //@version=6
 * indicator("Average Day Range", overlay=false, precision=2)
 * lengthInput = input.int(14, "Length", minval=1, maxval=500)
 * adr = ta.sma(high - low, lengthInput)
 * plot(adr, title="ADR", color=color.blue)
 * ```
 */

import {
  indicator,
  input,
  plot,
  compile,
  high,
  low,
  ta,
  color
} from '@deepentropy/oakscriptjs';

// Indicator declaration - matches PineScript exactly
indicator("Average Day Range", { overlay: false, precision: 2 });

// Dynamic input parameter - users can customize this value
const lengthInput = input.int(14, "Length", {
  minval: 1,
  maxval: 500,
  tooltip: "Period for calculating average range"
});

// Calculate Average Day Range using Series expression
const adr = ta.sma(high - low, lengthInput);

// Plot the result
plot(adr, { title: "ADR", color: color.blue });

// Compile and export
const compiled = compile();
export default compiled;

/**
 * Metadata Inspection Example:
 *
 * ```typescript
 * import adrIndicator from './average-day-range';
 *
 * // Access metadata before binding
 * console.log(adrIndicator.metadata);
 * // {
 * //   title: "Average Day Range",
 * //   overlay: false,
 * //   precision: 2,
 * //   inputs: [{
 * //     type: 'int',
 * //     name: 'length',
 * //     title: 'Length',
 * //     defval: 14,
 * //     minval: 1,
 * //     maxval: 500,
 * //     tooltip: "Period for calculating average range"
 * //   }],
 * //   plots: [{
 * //     varName: 'plot0',
 * //     title: 'ADR',
 * //     color: '#2962FF'
 * //   }]
 * // }
 *
 * // Bind with default parameters
 * const controller1 = adrIndicator.bind(chart, candlestickSeries);
 * controller1.attach();
 *
 * // Bind with custom length
 * const controller2 = adrIndicator.bind(chart, candlestickSeries, {
 *   length: 20  // Override default of 14
 * });
 * controller2.attach();
 *
 * // Update parameter at runtime
 * controller2.setOptions({ length: 30 });
 * ```
 */

/**
 * UI Generation Example:
 *
 * ```typescript
 * // Generate settings form from metadata
 * adrIndicator.metadata.inputs.forEach(input => {
 *   const field = createInputField({
 *     label: input.title,
 *     type: input.type,
 *     defaultValue: input.defval,
 *     min: input.minval,
 *     max: input.maxval,
 *     step: input.step,
 *     tooltip: input.tooltip
 *   });
 *   settingsForm.appendChild(field);
 * });
 * ```
 */
