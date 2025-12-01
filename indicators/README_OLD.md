# OakScriptJS Indicators

This directory contains reusable technical indicators built with the OakScriptJS library.

## Structure

Each indicator is organized in its own subdirectory:

```
indicators/
├── sma/
│   ├── index.ts            # Module exports
│   ├── sma.ts              # Main indicator wrapper (metadata, inputs, calculate function)
│   └── sma-calculation.ts  # Core calculation logic using oakscriptjs
├── package.json            # Workspace package configuration
└── README.md               # This file
```

## Usage

### Importing Indicators

Indicators can be imported in any application that has access to this workspace:

```typescript
import { calculate, metadata, defaultInputs } from '../indicators/sma';

// Or import specific exports
import { calculateSMA, getSourceSeries } from '../indicators/sma';
```

### Indicator Structure

Each indicator exports:

- **metadata**: Title, short title, and overlay settings
- **inputConfig**: Input definitions for UI generation
- **plotConfig**: Plot styling information (colors, line widths)
- **defaultInputs**: Default input values
- **calculate**: Main function that computes indicator values

### Example Usage

```typescript
import { calculate, type SMAInputs } from '../indicators/sma';
import type { Bar } from '@deepentropy/oakscriptjs';

// Your bar data
const bars: Bar[] = [...];

// Calculate with default inputs
const result = calculate(bars);

// Or with custom inputs
const result = calculate(bars, {
  length: 20,
  source: 'close',
  offset: 0,
});

// Result contains plot data
console.log(result.plots.ma); // Array of { time, value } points
```

## Adding New Indicators

1. **Create a new directory** for your indicator:
   ```
   indicators/
   └── your-indicator/
       ├── index.ts
       ├── your-indicator.ts
       └── your-indicator-calculation.ts
   ```

2. **Implement the calculation logic** in `*-calculation.ts`:
   ```typescript
   import { Series, ta, type Bar } from '@deepentropy/oakscriptjs';

   export function calculateYourIndicator(
     bars: Bar[],
     // ... other parameters
   ): Array<{ time: number; value: number }> {
     // Use oakscriptjs Series and ta functions
     const close = Series.fromBars(bars, 'close');
     const result = ta.yourFunction(close, length);
     // ...
   }
   ```

3. **Create the main wrapper** in `your-indicator.ts`:
   ```typescript
   import type { Bar } from '@deepentropy/oakscriptjs';
   import { calculateYourIndicator } from './your-indicator-calculation';

   export const metadata = {
     title: 'Your Indicator',
     shortTitle: 'YI',
     overlay: true, // or false for separate pane
   };

   export interface YourIndicatorInputs {
     length: number;
     // ... other inputs
   }

   export const defaultInputs: YourIndicatorInputs = {
     length: 14,
   };

   export const inputConfig = [
     {
       id: 'length',
       type: 'int' as const,
       title: 'Length',
       defval: 14,
       min: 1,
       max: 500,
     },
   ];

   export const plotConfig = [
     {
       id: 'line',
       title: 'Line',
       color: '#2962FF',
       lineWidth: 2,
     },
   ];

   export function calculate(bars: Bar[], inputs: Partial<YourIndicatorInputs> = {}) {
     const { length } = { ...defaultInputs, ...inputs };
     const data = calculateYourIndicator(bars, length);
     return { plots: { line: data } };
   }
   ```

4. **Export from index.ts**:
   ```typescript
   export {
     metadata,
     defaultInputs,
     inputConfig,
     plotConfig,
     calculate,
     type YourIndicatorInputs,
   } from './your-indicator';

   export { calculateYourIndicator } from './your-indicator-calculation';
   ```

5. **Register in your application** (e.g., in `indicator-ui.ts`):
   ```typescript
   import * as yourIndicator from '../../indicators/your-indicator';

   const indicators: IndicatorDefinition[] = [
     // ... existing indicators
     {
       id: 'your-indicator',
       name: 'Your Indicator (YI)',
       metadata: yourIndicator.metadata,
       inputConfig: yourIndicator.inputConfig,
       plotConfig: yourIndicator.plotConfig,
       calculate: yourIndicator.calculate,
       defaultInputs: yourIndicator.defaultInputs,
     },
   ];
   ```

## Available Indicators

### SMA (Simple Moving Average)

A simple moving average indicator that smooths price data by calculating the arithmetic mean over a specified period.

**Inputs:**
- `length` (int): Number of periods for averaging (default: 9)
- `source` (source): Price source - open, high, low, close, hl2, hlc3, ohlc4 (default: close)
- `offset` (int): Horizontal offset for the line (default: 0)

**Original PineScript:**
```pine
//@version=6
indicator(title="Moving Average Simple", shorttitle="SMA", overlay=true)
len = input.int(9, minval=1, title="Length")
src = input(close, title="Source")
offset = input.int(title="Offset", defval=0, minval=-500, maxval=500)
out = ta.sma(src, len)
plot(out, color=color.blue, title="MA", offset=offset)
```

## Dependencies

- `@deepentropy/oakscriptjs`: Core technical analysis library with Series and ta functions

## License

MIT
