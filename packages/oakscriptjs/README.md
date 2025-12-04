# OakScriptJS

**Simplified PineScript-like library for JavaScript - Series + TA functions**

OakScriptJS is a TypeScript/JavaScript library that provides the computational core of PineScript's API. It focuses on **calculations and data transformations** with a clean Series-based approach, leaving indicator structure to the OakScriptEngine transpiler.

📚 **[Read the Complete Guide →](./GUIDE.md)**

## Core Features

1. **Series Class**: Lazy evaluation with operator chaining
2. **Core Functions**: Pure array-based calculations
3. **TA-Series Wrappers**: Series-based technical analysis functions
4. **Metadata Types**: Type definitions for indicator results

## Why OakScriptJS?

**v0.2.0 Refactoring: Back to Simplicity**

We removed the DSL layer (`indicator()`, `plot()`, `compile()`) and context API to focus on what matters: **computational primitives**. The complexity of indicator structure is now handled by OakScriptEngine transpiler where it belongs.

**Before (v0.1.x):**
```typescript
// Complex DSL with global state
indicator("My Indicator");
const rsi = ta.rsi(close, 14);
plot(rsi);
export default compile();
```

**After (v0.2.0):**
```typescript
// Simple, explicit, testable
import { Series, ta, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function myIndicator(bars: any[]): IndicatorResult {
  const close = new Series(bars, (bar) => bar.close);
  const rsi = ta.rsi(close, 14);

  return {
    metadata: { title: "My Indicator", overlay: false },
    plots: [{ data: rsi.toArray().map((v, i) => ({ time: bars[i].time, value: v })) }]
  };
}
```

## Scope

**This library includes:**
- ✅ Technical Analysis (`ta.*`, `taCore.*`) - All indicators and calculations
- ✅ Mathematics (`math.*`) - All mathematical operations
- ✅ Arrays (`array.*`) - Array manipulation and operations
- ✅ Matrices (`matrix.*`) - Matrix operations (minimal, 2%)
- ✅ Strings (`str.*`) - String manipulation
- ✅ Time (`time.*`) - Time calculations and conversions
- ✅ Color (`color.*`) - Color data structures and manipulation
- ✅ **Drawing Objects** (`line.*`, `box.*`, `label.*`, `linefill.*`) - Computational features only
- ✅ **Series Class** - Lazy evaluation with operator chaining

**This library does NOT include:**
- ❌ DSL functions (`indicator()`, `plot()`, `compile()`) - Removed in v0.2.0
- ❌ UI/Input functions (`input.*`) - Application responsibility
- ❌ Strategy execution (`strategy.*`) - Strategy engine responsibility
- ❌ Data fetching (`request.*`) - Data provider responsibility
- ❌ Alert systems (`alert.*`, `alertcondition.*`) - Application responsibility

## Features

- **Native Operators**: With Babel plugin - write `(close - open) / (high - low)`
- **Exact API Match**: Function signatures match PineScript exactly
- **Type Safety**: Full TypeScript support with type definitions
- **Lazy Evaluation**: Series class evaluates on-demand
- **Performance Optimized**: Efficient implementations for technical analysis
- **Zero Runtime Dependencies**: Lightweight with no external runtime dependencies
- **Well Tested**: Extensive test coverage ensuring accuracy

## Installation

### JSR (Recommended)

```bash
# npm
npx jsr add @deepentropy/oakscriptjs

# pnpm (10.9+)
pnpm add jsr:@deepentropy/oakscriptjs

# yarn (4.9+)
yarn add jsr:@deepentropy/oakscriptjs

# Deno
deno add jsr:@deepentropy/oakscriptjs

# Bun
bunx jsr add @deepentropy/oakscriptjs
```

### npm

```bash
npm install @deepentropy/oakscriptjs
```

## Quick Start

### Option 1: Array-based Calculations

```typescript
import { taCore } from '@deepentropy/oakscriptjs';

const prices = [100, 102, 101, 103, 105];
const sma = taCore.sma(prices, 3);
const rsi = taCore.rsi(prices, 14);
```

### Option 2: Series-based Calculations

```typescript
import { Series, ta } from '@deepentropy/oakscriptjs';

const bars = [
  { time: '2024-01-01', open: 100, high: 105, low: 99, close: 103 },
  { time: '2024-01-02', open: 103, high: 107, low: 102, close: 106 }
];

const close = new Series(bars, (bar) => bar.close);
const rsi = ta.rsi(close, 14);

console.log(rsi.toArray());
```

### Option 3: Native Operators (with Babel Plugin)

```typescript
import { Series } from '@deepentropy/oakscriptjs';

const close = new Series(bars, (bar) => bar.close);
const open = new Series(bars, (bar) => bar.open);
const high = new Series(bars, (bar) => bar.high);
const low = new Series(bars, (bar) => bar.low);

// Native operators! 🎉
const bop = (close - open) / (high - low);
```

**Setup Babel Plugin:**

```javascript
// babel.config.js
module.exports = {
  presets: ['@babel/preset-typescript'],
  plugins: [
    './node_modules/@deepentropy/oakscriptjs/babel-plugin/pinescript-operators.cjs'
  ]
};
```

📚 **[See Complete Examples in the Guide →](./GUIDE.md#examples)**

## Use Cases

- 🎯 **OakScriptEngine Integration** - Transpile PineScript to JavaScript
- 📊 **Custom Trading Engines** - Build backtesting or execution systems
- 📈 **Analysis Tools** - Create technical analysis applications
- 🤖 **Algorithm Development** - Develop trading algorithms
- 📚 **Educational Projects** - Learn technical indicators

## For OakScriptEngine Developers

OakScriptJS makes PineScript transpilation straightforward:

```typescript
// PineScript
indicator("My Indicator")
bop = (close - open) / (high - low)
plot(bop)

// Transpiles to (with Babel plugin)
import { Series, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function myIndicator(bars: any[]): IndicatorResult {
  const close = new Series(bars, (bar) => bar.close);
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);

  const bop = (close - open) / (high - low);

  return {
    metadata: { title: "My Indicator", overlay: false },
    plots: [{
      data: bop.toArray().map((value, i) => ({ time: bars[i].time, value }))
    }]
  };
}
```

📚 **[Complete Transpilation Guide →](./GUIDE.md#for-oakscriptengine-developers)**

## What's New in v0.2.0

**Major Refactoring: Back to Simplicity**

- ✅ **Removed DSL Layer**: No more `indicator()`, `plot()`, `compile()`
- ✅ **Removed Context API**: No more `createContext()`, global state
- ✅ **Removed IndicatorController**: Complexity moved to transpiler
- ✅ **Focus on Core**: Series class + computation functions
- ✅ **Better Architecture**: Transpiler handles structure, library handles calculations

**Migration from v0.1.x:**

The DSL approach is deprecated. Use the new function-based approach with `IndicatorResult`. See the [Complete Guide](./GUIDE.md) for details.

## Supported Namespaces

### Technical Analysis (`ta` and `taCore`) ✅

Complete implementation of PineScript's technical analysis functions:

```typescript
// Core (array-based)
import { taCore } from '@deepentropy/oakscriptjs';
taCore.sma(prices, 20)
taCore.ema(prices, 20)
taCore.rsi(prices, 14)

// Series (Series-based)
import { ta } from '@deepentropy/oakscriptjs';
ta.sma(closeSeries, 20)
ta.ema(closeSeries, 20)
ta.rsi(closeSeries, 14)
```

- **Moving Averages**: `sma()`, `ema()`, `wma()`, `vwma()`, `swma()`, etc.
- **Oscillators**: `rsi()`, `stoch()`, `cci()`, `macd()`, `mfi()`, etc.
- **Volatility**: `bb()`, `atr()`, `stdev()`, `variance()`, etc.
- **Momentum**: `mom()`, `roc()`, `percentrank()`, etc.
- **Regression**: `linreg()`, `correlation()`, etc.
- **Crossovers**: `crossover()`, `crossunder()`, `cross()`

### Math (`math`) ✅

```typescript
math.abs(x), math.ceil(x), math.floor(x), math.round(x)
math.min(...values), math.max(...values), math.avg(...values)
math.sqrt(x), math.pow(x, y), math.exp(x), math.log(x)
math.sin(x), math.cos(x), math.tan(x)
```

### Array (`array`) ✅

```typescript
array.new_float(size, initial)
array.push(arr, value)
array.get(arr, index)
array.sum(arr), array.avg(arr), array.sort(arr)
```

### Series Class ✅

```typescript
class Series {
  // Arithmetic
  add(other: Series | number): Series
  sub(other: Series | number): Series
  mul(other: Series | number): Series
  div(other: Series | number): Series

  // Comparison
  gt(other: Series | number): Series
  lt(other: Series | number): Series

  // Logical
  and(other: Series | number): Series
  or(other: Series | number): Series

  // Access
  toArray(): number[]
  last(): number
  offset(n: number): Series  // Like close[1]
}
```

### Drawing Objects ✅

**NEW**: Drawing objects with computational features (no rendering):

- **Line (`line`)**: `new()`, `get_price()`, getters/setters
- **Box (`box`)**: `new()`, getters/setters for gap detection
- **Label (`label`)**: `new()`, getters/setters
- **Linefill (`linefill`)**: `new()`, `set_color()`

## API Documentation

### Series Example

```typescript
import { Series, ta } from '@deepentropy/oakscriptjs';

const bars = [/* OHLCV data */];

// Create Series
const close = new Series(bars, (bar) => bar.close);
const high = new Series(bars, (bar) => bar.high);
const low = new Series(bars, (bar) => bar.low);

// Calculations
const range = high.sub(low);  // Or: high - low (with Babel)
const rsi = ta.rsi(close, 14);

// Extract values
const values = rsi.toArray();
const last = rsi.last();
```

### Core Functions Example

```typescript
import { taCore, math } from '@deepentropy/oakscriptjs';

const prices = [100, 102, 101, 103, 105];
const sma = taCore.sma(prices, 3);
const avg = math.avg(...prices);
```

## Examples

Complete working examples:

```typescript
// Example 1: Simple Moving Average
import { Series, ta, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function smaIndicator(bars: any[]): IndicatorResult {
  const close = new Series(bars, (bar) => bar.close);
  const sma20 = ta.sma(close, 20);

  return {
    metadata: { title: "SMA 20", overlay: true },
    plots: [{
      data: sma20.toArray().map((v, i) => ({ time: bars[i].time, value: v })),
      options: { color: '#2196F3', linewidth: 2 }
    }]
  };
}

// Example 2: Balance of Power (with native operators)
export function bopIndicator(bars: any[]): IndicatorResult {
  const close = new Series(bars, (bar) => bar.close);
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);

  // Native operators!
  const bop = (close - open) / (high - low);

  return {
    metadata: { title: "Balance of Power", overlay: false },
    plots: [{
      data: bop.toArray().map((v, i) => ({ time: bars[i].time, value: v })),
      options: { color: '#FF0000', linewidth: 2 }
    }],
    hlines: [{ value: 0, options: { color: '#808080' } }]
  };
}
```

See `/examples/indicators/` for more examples.

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Lint & Format

```bash
npm run lint
npm run format
```

## Project Structure

```
oakscriptjs/
├── src/
│   ├── ta/              # Technical analysis (array-based)
│   ├── ta-series.ts     # TA wrappers (Series-based)
│   ├── math/            # Mathematical functions
│   ├── array/           # Array operations
│   ├── str/             # String operations
│   ├── color/           # Color functions
│   ├── runtime/
│   │   └── series.ts    # Series class
│   ├── types/           # Type definitions
│   │   └── metadata.ts  # Indicator result types
│   └── index.ts         # Main entry point
├── tests/               # Test files
├── examples/            # Usage examples
└── dist/                # Built output
```

## Roadmap

**Current Focus:**
- [x] Core functions (array-based) - Complete
- [x] Series class with lazy evaluation - Complete
- [x] TA-Series wrappers - Complete
- [x] Metadata types for indicators - Complete
- [ ] Complete `matrix` namespace (currently 2%)
- [ ] Performance optimizations

**Explicitly Removed** (handled by transpiler/application):
- ❌ DSL functions (`indicator()`, `plot()`, `compile()`)
- ❌ Context API (`createContext()`)
- ❌ IndicatorController
- ❌ Built-in series (`close`, `open`, etc.)

## Contributing

Contributions are welcome! Please ensure:

1. Maintain exact PineScript API signatures
2. Add tests for new functionality
3. Follow the existing code style
4. Update documentation

## License

MIT

## Documentation

- 📚 **[Complete Guide](./GUIDE.md)** - User guide + OakScriptEngine integration
- 📊 **[Function Inventory](./INVENTORY.md)** - Complete function list with status
- 🎯 **[API Reference](./GUIDE.md#api-reference)** - Complete API documentation

## Acknowledgments

This library is inspired by TradingView's PineScript language. It is not affiliated with or endorsed by TradingView.

---

**Version**: 0.2.0
**Last Updated**: November 2025
