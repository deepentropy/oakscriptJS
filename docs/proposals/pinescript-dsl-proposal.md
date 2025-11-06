# Proposal: PineScript-Style DSL for OakScriptJS

## Problem Statement

The current `IndicatorController` implementation is too imperative and breaks from PineScript's declarative paradigm. OakScriptEngine transpiles PineScript to TypeScript, but the generated code doesn't resemble the original PineScript structure.

**Current approach**:
- 100+ lines → 10 lines (good!)
- But completely different syntax (bad!)
- Requires metadata objects instead of function calls
- Calculation logic wrapped in callbacks

**Goal**: Generated TypeScript should look almost identical to PineScript.

## Proposed Solution

Implement a **declarative DSL** that mirrors PineScript's syntax while leveraging OakScriptJS's computational core.

### Core Principles

1. **Implicit Context**: Global runtime context (like PineScript's implicit `close`, `open`, etc.)
2. **Declarative Registration**: `indicator()` and `plot()` register intent, don't execute
3. **Lazy Compilation**: `compile()` packages everything for chart binding
4. **Series as First-Class**: `close`, `open`, etc. behave like PineScript series
5. **Type Safety**: Full TypeScript support despite global state

## API Design

### 1. Built-in Series (Implicit Context)

```typescript
// Available globally after context initialization
import { close, open, high, low, volume, hl2, hlc3, ohlc4, time } from '@deepentropy/oakscriptjs';

// These are reactive Series objects that automatically reference current bar
const price = close;           // Current close price
const range = high.sub(low);   // High - Low for each bar
```

### 2. Indicator Declaration

```typescript
import { indicator } from '@deepentropy/oakscriptjs';

// Matches PineScript signature
indicator(title: string, options?: {
  shorttitle?: string;
  format?: 'price' | 'volume' | 'percent';
  precision?: number;
  overlay?: boolean;
  timeframe?: string;
  timeframe_gaps?: boolean;
});

// Example
indicator("Balance of Power", {
  format: "price",
  precision: 2,
  overlay: false
});
```

### 3. Plot Function

```typescript
import { plot, color } from '@deepentropy/oakscriptjs';

// Matches PineScript signature
plot(series: Series, options?: {
  title?: string;
  color?: Color;
  linewidth?: number;
  style?: 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns';
  trackprice?: boolean;
  histbase?: number;
  offset?: number;
  join?: boolean;
  editable?: boolean;
  display?: 'all' | 'none';
});

// Example
plot(bop, {
  color: color.red,
  linewidth: 2,
  title: "BOP"
});
```

### 4. Series Type

```typescript
// Series represents a time-series of values
class Series {
  // Arithmetic operations
  add(other: Series | number): Series;
  sub(other: Series | number): Series;
  mul(other: Series | number): Series;
  div(other: Series | number): Series;

  // Comparison (returns boolean series)
  gt(other: Series | number): Series;
  lt(other: Series | number): Series;
  eq(other: Series | number): Series;

  // Access
  get(index: number): number;        // Access specific bar
  offset(offset: number): Series;    // Reference past bars (e.g., close[1])

  // Conversions
  toArray(): number[];

  // Internal
  _compute(): number[];  // Compute actual values from context
}

// Operator overloading approximation
const bop = close.sub(open).div(high.sub(low));
```

### 5. Compilation & Chart Binding

```typescript
import { compile } from '@deepentropy/oakscriptjs';

// Compile registered indicator + plots into chart-bindable object
const compiled = compile();

// Usage in chart application
import bopIndicator from './balance-of-power';

const controller = bopIndicator.bind(chart, candlestickSeries);
controller.attach();  // Renders to chart
controller.detach();  // Removes from chart
```

## Complete Example

### Original PineScript

```pinescript
//@version=6
indicator("RSI with MA", overlay=false)

length = input.int(14, "RSI Length", minval=1)
maLength = input.int(9, "MA Length", minval=1)

rsiValue = ta.rsi(close, length)
rsiMA = ta.sma(rsiValue, maLength)

plot(rsiValue, "RSI", color=color.purple, linewidth=2)
plot(rsiMA, "MA", color=color.orange, linewidth=1)
hline(70, "Overbought", color=color.red, linestyle=hline.style_dashed)
hline(30, "Oversold", color=color.green, linestyle=hline.style_dashed)
```

### Transpiled TypeScript (Target)

```typescript
import {
  indicator,
  plot,
  hline,
  input,
  close,
  ta,
  color,
  compile
} from '@deepentropy/oakscriptjs';

indicator("RSI with MA", { overlay: false });

const length = input.int(14, "RSI Length", { minval: 1 });
const maLength = input.int(9, "MA Length", { minval: 1 });

const rsiValue = ta.rsi(close, length);
const rsiMA = ta.sma(rsiValue, maLength);

plot(rsiValue, { title: "RSI", color: color.purple, linewidth: 2 });
plot(rsiMA, { title: "MA", color: color.orange, linewidth: 1 });
hline(70, { title: "Overbought", color: color.red, linestyle: "dashed" });
hline(30, { title: "Oversold", color: color.green, linestyle: "dashed" });

export default compile();
```

**Similarity to PineScript**: ~95% 🎯

## Implementation Architecture

### 1. Runtime Context (Global State)

```typescript
// src/runtime/context.ts
class RuntimeContext {
  private data: Bar[] = [];
  private currentIndex: number = 0;
  private indicatorMeta: IndicatorMetadata | null = null;
  private plots: PlotRegistration[] = [];
  private hlines: HLineRegistration[] = [];
  private inputs: InputRegistration[] = [];

  // Set chart data (called during compilation)
  setData(data: Bar[]): void {
    this.data = data;
  }

  // Register indicator metadata
  registerIndicator(meta: IndicatorMetadata): void {
    this.indicatorMeta = meta;
  }

  // Register a plot
  registerPlot(plot: PlotRegistration): void {
    this.plots.push(plot);
  }

  // Get built-in series
  getSeries(name: 'close' | 'open' | 'high' | 'low' | 'volume'): Series {
    return new Series(this, (bar) => bar[name]);
  }

  // Compute all values for chart binding
  compile(): CompiledIndicator {
    // Execute all registered computations
    // Return chart-bindable object
  }
}

// Global singleton
let globalContext = new RuntimeContext();

export function getContext(): RuntimeContext {
  return globalContext;
}

export function resetContext(): void {
  globalContext = new RuntimeContext();
}
```

### 2. Series Implementation

```typescript
// src/runtime/series.ts
export class Series {
  private context: RuntimeContext;
  private extractor: (bar: Bar, index: number, data: Bar[]) => number;
  private cached: number[] | null = null;

  constructor(
    context: RuntimeContext,
    extractor: (bar: Bar, index: number, data: Bar[]) => number
  ) {
    this.context = context;
    this.extractor = extractor;
  }

  // Arithmetic
  add(other: Series | number): Series {
    return new Series(this.context, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a + b;
    });
  }

  sub(other: Series | number): Series {
    return new Series(this.context, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a - b;
    });
  }

  div(other: Series | number): Series {
    return new Series(this.context, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return b !== 0 ? a / b : NaN;
    });
  }

  mul(other: Series | number): Series {
    return new Series(this.context, (bar, i, data) => {
      const a = this.extractor(bar, i, data);
      const b = typeof other === 'number' ? other : other.extractor(bar, i, data);
      return a * b;
    });
  }

  // Offset (for accessing previous bars)
  offset(n: number): Series {
    return new Series(this.context, (bar, i, data) => {
      const targetIndex = i - n;
      if (targetIndex < 0 || targetIndex >= data.length) return NaN;
      return this.extractor(data[targetIndex], targetIndex, data);
    });
  }

  // Compute all values
  _compute(): number[] {
    if (this.cached) return this.cached;

    const data = this.context.getData();
    this.cached = data.map((bar, i) => this.extractor(bar, i, data));
    return this.cached;
  }

  // Clear cache (when data changes)
  _invalidate(): void {
    this.cached = null;
  }

  // Convert to regular array
  toArray(): number[] {
    return this._compute();
  }

  // Get specific value
  get(index: number): number {
    return this._compute()[index];
  }
}
```

### 3. Built-in Series Exports

```typescript
// src/runtime/builtins.ts
import { getContext } from './context';
import { Series } from './series';

// Built-in series (match PineScript)
export const close = new Series(getContext(), (bar) => bar.close);
export const open = new Series(getContext(), (bar) => bar.open);
export const high = new Series(getContext(), (bar) => bar.high);
export const low = new Series(getContext(), (bar) => bar.low);
export const volume = new Series(getContext(), (bar) => bar.volume || 0);

// Derived series
export const hl2 = high.add(low).div(2);
export const hlc3 = high.add(low).add(close).div(3);
export const ohlc4 = open.add(high).add(low).add(close).div(4);

// Time series
export const time = new Series(getContext(), (bar) =>
  typeof bar.time === 'string' ? new Date(bar.time).getTime() : bar.time
);
```

### 4. DSL Functions

```typescript
// src/dsl/indicator.ts
import { getContext } from '../runtime/context';

export function indicator(title: string, options: IndicatorOptions = {}): void {
  getContext().registerIndicator({
    title,
    shorttitle: options.shorttitle,
    format: options.format || 'price',
    precision: options.precision || 4,
    overlay: options.overlay ?? false,
    timeframe: options.timeframe || '',
    timeframe_gaps: options.timeframe_gaps ?? true,
  });
}
```

```typescript
// src/dsl/plot.ts
import { getContext } from '../runtime/context';
import { Series } from '../runtime/series';

export function plot(series: Series, options: PlotOptions = {}): void {
  getContext().registerPlot({
    series,
    title: options.title,
    color: options.color,
    linewidth: options.linewidth || 1,
    style: options.style || 'line',
    trackprice: options.trackprice,
    histbase: options.histbase,
    offset: options.offset || 0,
    join: options.join,
    editable: options.editable,
    display: options.display || 'all',
  });
}
```

```typescript
// src/dsl/compile.ts
import { getContext } from '../runtime/context';
import { IndicatorController } from '../indicator';

export function compile() {
  const context = getContext();

  return {
    // Bind to chart (replaces old createIndicator)
    bind(chart: any, mainSeries: any) {
      // Extract metadata
      const metadata = context.getMetadata();

      // Create calculation function
      const calculateFn = (data: any[], options: any) => {
        // Reset context with new data
        context.setData(data);

        // Compute all registered plots
        const plotResults = context.getPlots().map(plot => {
          const values = plot.series._compute();
          return data.map((bar, i) => ({
            time: bar.time,
            value: values[i]
          }));
        });

        // For now, return first plot (multi-plot support later)
        return plotResults[0] || [];
      };

      // Use existing IndicatorController
      return new IndicatorController(
        chart,
        mainSeries,
        metadata,
        calculateFn,
        options
      );
    }
  };
}
```

### 5. Technical Analysis Integration

```typescript
// src/dsl/ta.ts
import * as taCore from '../ta';  // Existing OakScriptJS ta functions
import { Series } from '../runtime/series';
import { getContext } from '../runtime/context';

export const ta = {
  sma(source: Series, length: number): Series {
    return new Series(getContext(), (bar, i, data) => {
      const sourceValues = source._compute();
      const result = taCore.sma(sourceValues, length);
      return result[i];
    });
  },

  rsi(source: Series, length: number): Series {
    return new Series(getContext(), (bar, i, data) => {
      const sourceValues = source._compute();
      const result = taCore.rsi(sourceValues, length);
      return result[i];
    });
  },

  // Wrap all existing ta.* functions...
};
```

## Usage Flow

### 1. OakScriptEngine Transpilation

PineScript → TypeScript (using DSL functions)

### 2. User Application

```typescript
// Import transpiled indicator
import rsiIndicator from './indicators/rsi';  // Generated by OakScriptEngine

// Bind to chart
const controller = rsiIndicator.bind(chart, candlestickSeries);
controller.attach();

// Later: update inputs
controller.setOptions({ length: 20 });

// Later: remove
controller.detach();
```

### 3. Runtime Execution

1. Import loads indicator module
2. DSL functions (`indicator`, `plot`) register declarations to global context
3. `compile()` creates bindable object
4. `bind()` creates IndicatorController with computation logic
5. `attach()` renders to chart using Lightweight Charts API

## Benefits

1. **~95% PineScript similarity**: Generated code looks almost identical
2. **Type-safe**: Full TypeScript support
3. **Performant**: Compiles to efficient code (no interpretation)
4. **Familiar**: Developers see PineScript-like syntax
5. **Maintainable**: Changes to PineScript → minimal changes to TypeScript
6. **Reusable**: Compiled indicators are portable

## Comparison: Before vs After

### Before (Current IndicatorController)

```typescript
export function createBalanceOfPowerIndicator(chart, mainSeries, overlay, options) {
  return createIndicator(
    chart,
    mainSeries,
    {
      title: 'Balance of Power',
      version: 6,
      overlay: false,
      description: 'Measures buyer vs seller strength',
      plots: [{
        varName: 'bop',
        title: 'BOP',
        color: 'red',
        linewidth: 2,
        style: 'line'
      }]
    },
    (data, options) => data.map(item => ({
      time: item.time,
      value: (item.close - item.open) / (item.high - item.low)
    })),
    options
  );
}
```

### After (PineScript DSL)

```typescript
import { indicator, plot, close, open, high, low, color, compile } from '@deepentropy/oakscriptjs';

indicator("Balance of Power");

const bop = close.sub(open).div(high.sub(low));

plot(bop, { color: color.red, linewidth: 2, title: "BOP" });

export default compile();
```

**Much closer to original PineScript!** ✨

## Implementation Phases

### Phase 1: Core DSL (This PR)
- [ ] Runtime context system
- [ ] Series class with arithmetic operations
- [ ] Built-in series (close, open, high, low, etc.)
- [ ] `indicator()` function
- [ ] `plot()` function
- [ ] `compile()` function
- [ ] Integration with existing IndicatorController

### Phase 2: Extended DSL
- [ ] `hline()` function
- [ ] `input.*` functions (input.int, input.float, etc.)
- [ ] `fill()` function
- [ ] `bgcolor()` function
- [ ] Conditional expressions (ternary operator support)

### Phase 3: Advanced Features
- [ ] `plotshape()`, `plotchar()`, `plotarrow()`
- [ ] `barcolor()`, `linecolor()`
- [ ] Arrays and loops
- [ ] Custom functions
- [ ] Multi-timeframe support

## Open Questions

1. **Global state concerns**: How to handle multiple indicators on same page?
   - Answer: Each indicator gets isolated context, reset on import

2. **Input handling**: Should inputs be reactive or static?
   - Answer: Static for Phase 1, reactive in Phase 2

3. **Performance**: Is per-bar computation efficient enough?
   - Answer: Cache computed series, invalidate on data change

4. **Type inference**: How to maintain TypeScript types with DSL?
   - Answer: Strong typing on Series class, type definitions for all DSL functions

## Breaking Changes

None! This is additive:
- Existing `IndicatorController` API remains
- New DSL is opt-in
- Both can coexist

## References

- [PineScript v6 Reference](https://www.tradingview.com/pine-script-reference/v6/)
- [indicator() function](https://www.tradingview.com/pine-script-reference/v6/#fun_indicator)
- [plot() function](https://www.tradingview.com/pine-script-reference/v6/#fun_plot)
- Current implementation: `src/indicator/index.ts`
