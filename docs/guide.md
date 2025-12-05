# OakScriptJS Complete Guide

**The ultimate resource for using OakScriptJS - A simplified PineScript-like library**

## Table of Contents

1. [Introduction](#introduction)
2. [For End Users: Using OakScriptJS](#for-end-users)
3. [For OakScriptEngine Developers: Integration Guide](#for-oakscriptengine-developers)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

OakScriptJS is a simplified JavaScript/TypeScript library that provides the computational core of PineScript's API. It focuses on **calculations and data transformations** while leaving indicator structure and rendering to the OakScriptEngine transpiler.

### Core Capabilities

**Level 1: Core Functions (Array-based)**
Pure calculation functions matching PineScript signatures.

```typescript
import { taCore } from '@deepentropy/oakscriptjs';

const prices = [10, 12, 11, 13, 15];
const sma = taCore.sma(prices, 3);
```

**Level 2: Series Class**
Lazy evaluation with operator chaining.

```typescript
import { Series } from '@deepentropy/oakscriptjs';

const data = [/* bar data */];
const close = new Series(data, (bar) => bar.close);
const open = new Series(data, (bar) => bar.open);

// With Babel plugin: Native operators!
const change = close - open;  // Transforms to: close.sub(open)
```

**Level 3: TA-Series Functions**
Series-based wrappers for technical analysis.

```typescript
import { ta, Series } from '@deepentropy/oakscriptjs';

const close = new Series(data, (bar) => bar.close);
const rsi = ta.rsi(close, 14);  // Returns a Series
```

### What's Different in v0.2.0

**Removed:**
- ❌ DSL functions (`indicator()`, `plot()`, `compile()`)
- ❌ Context API (`createContext()`)
- ❌ Built-in series (`close`, `open`, `high`, `low`)
- ❌ IndicatorController

**Focus:**
- ✅ Series class for lazy evaluation
- ✅ Core functions (array-based)
- ✅ TA-Series wrappers (Series-based)
- ✅ Metadata types for indicator results

**Why?** Simplicity. The transpiler (OakScriptEngine) handles the complexity of indicator structure. OakScriptJS focuses on what it does best: calculations.

---

## For End Users

### Installation

```bash
# npm
npm install @deepentropy/oakscriptjs

# pnpm
pnpm add @deepentropy/oakscriptjs

# JSR
npx jsr add @deepentropy/oakscriptjs
```

### Quick Start: Basic Calculations

```typescript
import { taCore, math } from '@deepentropy/oakscriptjs';

// Price data
const closes = [100, 102, 101, 103, 105, 104, 106];

// Calculate indicators
const sma = taCore.sma(closes, 5);
const ema = taCore.ema(closes, 5);
const rsi = taCore.rsi(closes, 14);

// Math operations
const avg = math.avg(...closes);
const max = math.max(...closes);
```

### Series Class

The Series class enables lazy evaluation and operator chaining:

```typescript
import { Series, ta } from '@deepentropy/oakscriptjs';

const bars = [
  { time: '2024-01-01', open: 100, high: 105, low: 99, close: 103 },
  { time: '2024-01-02', open: 103, high: 107, low: 102, close: 106 },
  // ... more bars
];

// Create Series
const close = new Series(bars, (bar) => bar.close);
const high = new Series(bars, (bar) => bar.high);
const low = new Series(bars, (bar) => bar.low);

// Calculate with Series
const range = high.sub(low);  // Or: high - low (with Babel plugin)
const rsi = ta.rsi(close, 14);

// Extract values
const rsiValues = rsi.toArray();
const lastRSI = rsi.last();
```

### BarData for Automatic Cache Invalidation

The `BarData` class wraps bar arrays and tracks version changes for automatic cache invalidation:

```typescript
import { BarData, Series, ta } from '@deepentropy/oakscriptjs';

// Create BarData wrapper
const barData = new BarData(bars);
const close = Series.fromBars(barData, 'close');
const sma = ta.sma(close, 20);

// First computation - values are cached
const values1 = sma.toArray();

// Add new bar - version increments automatically
barData.push({ time: '2024-01-03', open: 106, high: 108, low: 105, close: 107 });

// Series detects version change and recomputes automatically
const values2 = sma.toArray();  // Fresh computation with new data
```

**Benefits:**
- Automatic cache invalidation when data changes
- No manual cache management required
- Backward compatible - Series still accepts `Bar[]` directly
- Efficient for streaming/real-time data updates

### Breaking Closure Chains with materialize()

Complex Series expressions create closure chains that keep intermediate Series in memory. Use `materialize()` to break these chains:

```typescript
import { Series } from '@deepentropy/oakscriptjs';

const close = Series.fromBars(bars, 'close');
const open = Series.fromBars(bars, 'open');
const high = Series.fromBars(bars, 'high');
const low = Series.fromBars(bars, 'low');

// Without materialize: keeps all intermediate Series in memory
const complex = close.sub(open).mul(high).div(low).add(volume);

// With materialize: breaks chain after first operations
const materialized = close.sub(open).mul(high).materialize();
const result = materialized.div(low).add(volume);
// Now close, open, high can be garbage collected
```

**When to use materialize():**
- Complex expressions with many chained operations
- Long-running applications where memory is a concern
- After expensive computations to free intermediate results
- When you need a "snapshot" of computed values

### Native Operators with Babel Plugin

Enable PineScript-like syntax with the Babel plugin:

```typescript
// Without Babel plugin
const bop = close.sub(open).div(high.sub(low));

// With Babel plugin
const bop = (close - open) / (high - low);  // Transforms to the above!
```

**Setup:**

1. Install Babel:
```bash
npm install --save-dev @babel/core @babel/cli @babel/preset-typescript
```

2. Create `babel.config.js`:
```javascript
module.exports = {
  presets: ['@babel/preset-typescript'],
  plugins: [
    './node_modules/@deepentropy/oakscriptjs/babel-plugin/pinescript-operators.cjs'
  ]
};
```

3. Build with Babel:
```bash
npx babel src --out-dir dist
```

### Available Namespaces

#### Technical Analysis (`ta` and `taCore`)

```typescript
import { ta, taCore } from '@deepentropy/oakscriptjs';

// Core (array-based)
taCore.sma(priceArray, length)
taCore.ema(priceArray, length)
taCore.rsi(priceArray, length)

// Series (Series-based)
ta.sma(closeSeries, length)
ta.ema(closeSeries, length)
ta.rsi(closeSeries, length)

// Moving averages
ta.sma(), ta.ema(), ta.wma(), ta.vwma()

// Oscillators
ta.rsi(), ta.macd(), ta.cci(), ta.stoch()

// Volatility
ta.bb(), ta.atr(), ta.stdev()

// Crossovers
ta.crossover(), ta.crossunder(), ta.cross()
```

#### Mathematics (`math`)

```typescript
import { math } from '@deepentropy/oakscriptjs';

math.abs(x)
math.max(...values)
math.min(...values)
math.avg(...values)
math.sum(...values)
math.sqrt(x)
math.pow(x, y)
math.sin(x), math.cos(x), math.tan(x)
```

#### Arrays (`array`)

```typescript
import { array } from '@deepentropy/oakscriptjs';

const arr = array.new_float(10, 0);
array.push(arr, 5);
array.get(arr, 0);
array.size(arr);
array.sum(arr);
array.avg(arr);
array.sort(arr);
```

---

## For OakScriptEngine Developers

This section is for developers transpiling PineScript to JavaScript using OakScriptEngine.

### Architecture Overview

```
PineScript Source
    ↓ (OakScriptEngine Parser)
Indicator Function (TypeScript)
    ↓ (Babel Plugin - Optional but Recommended)
Transformed Indicator with Series Method Calls
    ↓ (TypeScript Compiler)
JavaScript Module
    ↓ (User's Application)
Chart Rendering (e.g., Lightweight Charts)
```

### Transpilation Strategy

**Old Approach (v0.1.x):**
- Generate code using DSL (`indicator()`, `plot()`, `compile()`)
- IndicatorController managed state and rendering

**New Approach (v0.2.0):**
- Generate functions that return `IndicatorResult`
- Transpiler handles indicator structure
- OakScriptJS provides computational primitives

### Example: Balance of Power

**PineScript Input:**
```pinescript
//@version=6
indicator("Balance of Power")
bop = (close - open) / (high - low)
plot(bop, color=color.red)
```

**Transpiled Output (Recommended):**
```typescript
import { Series, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function balanceOfPower(bars: any[]): IndicatorResult {
  // Create Series
  const close = new Series(bars, (bar) => bar.close);
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);

  // Calculate (with Babel plugin)
  const bop = (close - open) / (high - low);

  // Return structured result
  return {
    metadata: {
      title: "Balance of Power",
      overlay: false,
      plots: [
        { varName: 'bop', title: 'BOP', color: '#FF0000', linewidth: 1, style: 'line' }
      ]
    },
    plots: [
      {
        data: bop.toArray().map((value, i) => ({
          time: bars[i].time,
          value
        })),
        options: { color: '#FF0000', linewidth: 1 }
      }
    ],
    hlines: [],
    fills: []
  };
}
```

**Without Babel Plugin:**
```typescript
const bop = close.sub(open).div(high.sub(low));
```

### Transpilation Mapping

#### 1. Built-in Series

**PineScript** → **OakScriptJS**:
```typescript
// PineScript uses: close, open, high, low
// OakScriptJS: Create Series from bars

const close = new Series(bars, (bar) => bar.close);
const open = new Series(bars, (bar) => bar.open);
const high = new Series(bars, (bar) => bar.high);
const low = new Series(bars, (bar) => bar.low);
const volume = new Series(bars, (bar) => bar.volume);

// Derived series
const hl2 = high.add(low).div(2);
const hlc3 = high.add(low).add(close).div(3);
const ohlc4 = open.add(high).add(low).add(close).div(4);
```

#### 2. Technical Analysis

**PineScript** → **OakScriptJS**:

```pinescript
ta.sma(close, 20)       // PineScript
```
```typescript
ta.sma(close, 20)       // OakScriptJS (same!)
```

#### 3. Operators

With Babel plugin enabled:

| PineScript | OakScriptJS (Before Babel) | Runtime (After Babel) |
|------------|---------------------------|----------------------|
| `close - open` | `close - open` | `close.sub(open)` |
| `high + low` | `high + low` | `high.add(low)` |
| `close * 2` | `close * 2` | `close.mul(2)` |
| `a / b` | `a / b` | `a.div(b)` |
| `rsi > 70` | `rsi > 70` | `rsi.gt(70)` |
| `a && b` | `a && b` | `a.and(b)` |

#### 4. Indicator Result Structure

Every indicator function should return an `IndicatorResult`:

```typescript
import type { IndicatorResult } from '@deepentropy/oakscriptjs';

export function myIndicator(bars: any[], options?: any): IndicatorResult {
  // ... calculations ...

  return {
    metadata: {
      title: "My Indicator",
      overlay: false,
      precision: 2,
      inputs: [/* input metadata */],
      plots: [/* plot metadata */]
    },
    plots: [
      {
        data: values.map((value, i) => ({
          time: bars[i].time,
          value
        })),
        options: { color: '#FF0000', linewidth: 2 }
      }
    ],
    hlines: [
      { value: 70, options: { color: '#FF0000', linestyle: 'dashed' } }
    ],
    fills: []
  };
}
```

### Complete Example: RSI with Levels

**PineScript:**
```pinescript
//@version=6
indicator("RSI", overlay=false)
length = input.int(14, "Length")
rsiValue = ta.rsi(close, length)
plot(rsiValue, "RSI", color.purple, 2)
hline(70, "Overbought", color.red)
hline(30, "Oversold", color.green)
hline(50, "Middle", color.gray)
```

**Transpiled:**
```typescript
import { Series, ta, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function rsiIndicator(
  bars: any[],
  options: { length?: number } = {}
): IndicatorResult {
  const length = options.length ?? 14;

  // Create Series
  const close = new Series(bars, (bar) => bar.close);

  // Calculate
  const rsiValue = ta.rsi(close, length);

  // Return result
  return {
    metadata: {
      title: "RSI",
      overlay: false,
      precision: 2,
      inputs: [
        { type: 'int', name: 'length', title: 'Length', defval: 14, minval: 1 }
      ],
      plots: [
        { varName: 'rsiValue', title: 'RSI', color: '#9C27B0', linewidth: 2, style: 'line' }
      ]
    },
    plots: [
      {
        data: rsiValue.toArray().map((value, i) => ({
          time: bars[i].time,
          value
        })),
        options: { color: '#9C27B0', linewidth: 2 }
      }
    ],
    hlines: [
      { value: 70, options: { title: 'Overbought', color: '#FF0000', linestyle: 'dashed' } },
      { value: 30, options: { title: 'Oversold', color: '#00FF00', linestyle: 'dashed' } },
      { value: 50, options: { title: 'Middle', color: '#808080' } }
    ],
    fills: []
  };
}
```

### Handling Input Parameters

Input parameters are passed as an options object:

```typescript
export function myIndicator(
  bars: any[],
  options: {
    length?: number;
    multiplier?: number;
  } = {}
): IndicatorResult {
  const length = options.length ?? 14;
  const multiplier = options.multiplier ?? 2.0;

  // Use the parameters...
}
```

### Not Yet Supported

Features not in OakScriptJS (handle in transpiler):
1. **Indicator structure** - Transpiler responsibility
2. **Plot rendering** - Application responsibility
3. **Input UI** - Application responsibility
4. **bgcolor/barcolor** - Application responsibility
5. **strategy.*** - Strategy engine responsibility
6. **request.*** - Data fetching responsibility

---

## API Reference

### Core Namespaces

#### taCore (Technical Analysis - Array-based)

```typescript
import { taCore } from '@deepentropy/oakscriptjs';

// Moving Averages
taCore.sma(source: number[], length: number): number[]
taCore.ema(source: number[], length: number): number[]
taCore.wma(source: number[], length: number): number[]

// Oscillators
taCore.rsi(source: number[], length: number): number[]
taCore.cci(source: number[], length: number): number[]

// MACD (returns tuple)
taCore.macd(
  source: number[],
  fastLength: number,
  slowLength: number,
  signalLength: number
): [number[], number[], number[]]

// Bollinger Bands (returns tuple)
taCore.bb(
  source: number[],
  length: number,
  mult: number
): [number[], number[], number[]]  // [upper, basis, lower]
```

#### ta (Technical Analysis - Series-based)

```typescript
import { ta } from '@deepentropy/oakscriptjs';

// All functions accept Series and return Series
ta.sma(source: Series, length: number): Series
ta.ema(source: Series, length: number): Series
ta.rsi(source: Series, length: number): Series
ta.macd(source: Series, fast: number, slow: number, signal: number): [Series, Series, Series]
ta.bb(source: Series, length: number, mult: number): [Series, Series, Series]
```

#### Series Class

```typescript
class Series {
  constructor(data: Bar[] | BarData, extractor: SeriesExtractor)

  // Access underlying data
  get bars(): Bar[]
  get barData(): BarData

  // Arithmetic
  add(other: Series | number): Series
  sub(other: Series | number): Series
  mul(other: Series | number): Series
  div(other: Series | number): Series
  mod(other: Series | number): Series
  neg(): Series

  // Comparison (returns 1/0 series)
  gt(other: Series | number): Series
  lt(other: Series | number): Series
  gte(other: Series | number): Series
  lte(other: Series | number): Series
  eq(other: Series | number): Series
  neq(other: Series | number): Series

  // Logical
  and(other: Series | number): Series
  or(other: Series | number): Series
  not(): Series

  // Access
  get(index: number): number
  last(): number
  toArray(): number[]

  // History
  offset(n: number): Series  // Like close[1] in PineScript

  // Memory management
  materialize(): Series  // Break closure chains for memory efficiency
}
```

#### BarData Class

```typescript
class BarData {
  constructor(bars: Bar[])

  // Properties
  get version(): number      // Current version number
  get bars(): Bar[]          // Underlying bar array
  get length(): number       // Number of bars

  // Mutation methods (increment version)
  push(bar: Bar): void
  pop(): Bar | undefined
  set(index: number, bar: Bar): void
  updateLast(bar: Bar): void
  setAll(bars: Bar[]): void
  invalidate(): void         // Manual version increment

  // Access
  at(index: number): Bar | undefined

  // Factory
  static from(bars: Bar[]): BarData
}
```

#### Metadata Types

```typescript
import type {
  IndicatorResult,
  IndicatorMetadata,
  PlotData,
  PlotOptions,
  HLineData,
  HLineOptions,
  FillData,
  InputMetadata
} from '@deepentropy/oakscriptjs';

interface IndicatorResult {
  metadata: IndicatorMetadata;
  plots: PlotData[];
  hlines?: HLineData[];
  fills?: FillData[];
}
```

---

## Examples

### Example 1: Simple Moving Average

```typescript
import { Series, ta, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function smaIndicator(
  bars: any[],
  options: { length?: number } = {}
): IndicatorResult {
  const length = options.length ?? 20;
  const close = new Series(bars, (bar) => bar.close);
  const sma20 = ta.sma(close, length);

  return {
    metadata: {
      title: "SMA 20",
      overlay: true,
      plots: [{ varName: 'sma20', title: 'SMA', color: '#2196F3', linewidth: 2, style: 'line' }]
    },
    plots: [{
      data: sma20.toArray().map((value, i) => ({ time: bars[i].time, value })),
      options: { color: '#2196F3', linewidth: 2 }
    }],
    hlines: [],
    fills: []
  };
}
```

### Example 2: Balance of Power (Native Operators)

```typescript
import { Series, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function bopIndicator(bars: any[]): IndicatorResult {
  const close = new Series(bars, (bar) => bar.close);
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);

  // Native operators (requires Babel plugin)
  const bop = (close - open) / (high - low);

  return {
    metadata: {
      title: "Balance of Power",
      overlay: false,
      plots: [{ varName: 'bop', title: 'BOP', color: '#FF0000', linewidth: 2, style: 'line' }]
    },
    plots: [{
      data: bop.toArray().map((value, i) => ({ time: bars[i].time, value })),
      options: { color: '#FF0000', linewidth: 2 }
    }],
    hlines: [{ value: 0, options: { color: '#808080' } }],
    fills: []
  };
}
```

---

## Troubleshooting

### Build Issues

**Problem**: `Cannot find module '@deepentropy/oakscriptjs'`

**Solution**:
```bash
npm install @deepentropy/oakscriptjs
```

**Problem**: Operators not working (`close - open` gives error)

**Solution**: Enable Babel plugin (see [Native Operators](#native-operators-with-babel-plugin))

### Runtime Issues

**Problem**: Series calculations returning NaN

**Solution**: Ensure bar data has required fields (time, open, high, low, close)

**Problem**: TypeScript errors with Series

**Solution**: Import Series type:
```typescript
import { Series } from '@deepentropy/oakscriptjs';
```

---

## Additional Resources

- **Function Inventory**: `/INVENTORY.md` - Complete list of implemented functions
- **Official PineScript Reference**: `/docs/official/language-reference/`
- **GitHub**: https://github.com/deepentropy/oakscriptJS

---

## Summary

### For Users
- Install OakScriptJS
- Use core functions for calculations
- Use Series class for operator chaining
- Optional: Enable Babel plugin for native operators

### For OakScriptEngine Developers
- Generate functions that return `IndicatorResult`
- Use Series class for calculations
- Map PineScript functions 1:1 to OakScriptJS equivalents
- Use Babel plugin for native operators (recommended)

**Result**: Clean, maintainable code that's easy to understand and extend!

---

**Version**: 0.2.1
**Last Updated**: December 2025
