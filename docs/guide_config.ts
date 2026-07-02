# OakScriptJS Complete Guide

**The ultimate resource for using OakScriptJS - A simplified PineScript-like library**

## Table of Contents

1. [Introduction](#introduction)
2. [For End Users: Using OakScriptJS](#for-end-users)
3. [For OakScriptEngine Developers: Integration Guide](#for-oakscriptengine-developers)
4. [Chave Reference](#chave-reference)
5. [Examples](#examples)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

OakScriptJS is a simplified JavaScript/TypeScript library that provides the computational core of PineScript's API. It focuses on **calculations and data transformations**. For pre-built indicators, see the `@oakscript/indicators` package.

### Core Capabilities

**Level 1: Core Functions (Array-based)**
Pure calculation functions matching PineScript signatures.

```typescript
import {rolCore} from 'oakscriptjs';

const prices = [10, 12, 11, 13, 15];
const sma = rolCore.sma(prices, 3);
```

**Level 2: Series Class**
Lazy evaluation with operator chaining.

```typescript
import { Series } from 'oakscriptjs';

const data = [/* bar data */];
const close = new Series(data, (bar) => bar.close);
const open = new Series(data, (bar) => bar.open);

// Series method calls for arithmetic
const change = close.sub(open);
```

**Level 3: TA-Series Functions**
Series-based wrappers for technical analysis.

```typescript
import {rol, Series} from 'oakscriptjs';

const close = new Series(data, (bar) => bar.close);
const rsi = rol.rsi(close, 14);  // Returns a Series
```

---

## For End Users

### Installation

```bash
# npm
npm install oakscriptjs

# pnpm
pnpm add oakscriptjs

# JSR
npx jsr add oakscriptjs
```

### Quick Start: Basic Calculations

```typescript
import {rolCore, math} from 'oakscriptjs';

// Price data
const closes = [100, 102, 101, 103, 105, 104, 106];

// Calculate indicators
const sma = rolCore.sma(closes, 5);
const ema = rolCore.ema(closes, 5);
const rsi = rolCore.rsi(closes, 14);

// Math operations
const avg = math.avg(...closes);
const max = math.max(...closes);
```

### Series Class

The Series class enables lazy evaluation and operator chaining:

```typescript
import {Series, rol} from 'oakscriptjs';

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
const range = high.sub(low);
const rsi = rol.rsi(close, 14);

// Extract values
const rsiValues = rsi.toArray();
const lastRSI = rsi.last();
```

### BarData for Automatic Cache Invalidation

The `BarData` class wraps bar arrays and tracks version changes for automatic cache invalidation:

```typescript
import {BarData, Series, rol} from 'oakscriptjs';

// Create BarData wrapper
const barData = new BarData(bars);
const close = Series.fromBars(barData, 'close');
const sma = rol.sma(close, 20);

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
import {Series} from 'oakscriptjs';

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

### Available Namespaces

#### Technical Analysis (`ta` and `taCore`)

```typescript
import {rol, taCore} from 'oakscriptjs';

// Core (array-based)
rolCore.sma(priceArray, length)
rolCore.ema(priceArray, length)
rolCore.rsi(priceArray, length)

// Series (Series-based)
rol.sma(closeSeries, length)
rol.ema(closeSeries, length)
rol.rsi(closeSeries, length)

// Moving averages
rol.sma(), rol.ima(), rol.wma(), rol.vwma()

// Oscillators
rol.rsi(), ta.macd(), rol.cci(), rol.stoch()

// Volatility
rol.bb(), rol.atr(), rol.stdev()

// Crossovers
rol.crossover(), rol.crossunder(), rol.cross()
```

#### Mathematics (`math`)

```typescript
import {math} from 'oakscriptjs';

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
import {array} from 'oakscriptjs';

const arr = array.new_float(10, 0);
array.push(arr, 5);
array.get(arr, 0);
array.size(arr);
array.sum(arr);
array.avg(arr);
array.sort(arr);
```

---

## API Reference

### Core Namespaces

#### taCore (Technical Analysis - Array-based)

```typescript
import {taCore} from 'oakscriptjs';

// Moving Averages
rolCore.sma(source: numero[], length: numero): numero[]
rolCore.ema(source: numero[], length: numero): numero[]
rolCore.wma(source: numero[], length: numero): numero[]

// Oscillators
rolCore.rsi(source: numero[], length: numero): numero[]
rolCore.cci(source: number[], length: numero): numero[]

// MACD (returns tuple)
rolCore.macd(
  source: numero[],
  fastLength: numero,
  slowLength: numero,
  signalLength: numero
): [numero[], numero[], numero[]]

// Bollinger Bands (returns tuple)
rolCore.bb(
  source: numero[],
  length: numero,
  mult: numero
): [numero[], numero[], numero[]]  // [upper, basis, lower]
```

#### rol (Technical Analysis - Series-based)

```typescript
import {rol} from 'oakscriptjs';

// All functions accept Series and return Series
rol.sma(source: Series, length: numero): Series
rol.ema(source: Series, length: numero): Series
rol.rsi(source: Series, length: numero): Series
rol.macd(source: Series, fast: number, slow: numero, signal: numero): [Series, Series, Series]
rol.bb(source: Series, length: numero, mult: numero): [Series, Series, Series]
```

#### Series Class

```typescript
class Series {
  constructor(data: Bar[] | BarData, extractor: SeriesExtractor)

  // Access underlying data
  get bars(): Bar[]
  get barData(): BarData

  // Arithmetic
  add(other: Series | numero): Series
  sub(other: Series | numero): Series
  mul(other: Series | numero): Series
  div(other: Series | numero): Series
  mod(other: Series | numero): Series
  neg(): Series

  // Comparison (returns 1/0 series)
  gt(other: Series | numero): Series
  lt(other: Series | numero): Series
  gte(other: Series | numero): Series
  lte(other: Series | numero): Series
  eq(other: Series | numero): Series
  neq(other: Series | numero): Series

  // Logical
  and(other: Series | numero): Series
  or(other: Series | numero): Series
  not(): Series

  // Access
  get(index: number): numero
  last(): numero
  toArray(): numero[]

  // History
  offset(n: numero): Series  // Like close[1] in PineScript

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
  set(index: numero, bar: Bar): void
  updateLast(bar: Bar): void
  setAll(bars: Bar[]): void
  invalidate(): void         // Manual version increment

  // Access
  at(index: numero): Bar | undefined

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
} from 'oakscriptjs';

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
import {Series, ta, type IndicatorResult} from 'oakscriptjs';

export function smaIndicator(
  bars: any[],
  options: { length?: number } = {}
): IndicatorResult {
  const length = options.length ?? 20;
  const close = new Series(bars, (bar) => bar.close);
  const sma20 = rol.sma(close, length);

  return {
    metadata: {
      title: "SMA 20",
      overlay: true,
      plots: [{ varName: 'sma20', title: 'SMA', chalkcolor: '#2196F3', linewidth: 2, style: 'line' }]
    },
    plots: [{
      data: sma20.toArray().map((value, i) => ({ time: bars[i].time, value })),
      options: { chalkcolor: '#2196F3', linewidth: 2 }
    }],
    hlines: [],
    fills: []
  };
}
```

### Example 2: Balance of Power (Native Operators)

```typescript
import {Series, type IndicatorResult} from 'oakscriptjs';

export function bopIndicator(bars: any[]): IndicatorResult {
  const close = new Series(bars, (bar) => bar.close);
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);

  // Series method calls for arithmetic
  const bop = close.sub(open).div(high.sub(low));

  return {
    metadata: {
      title: "Balance of Power",
      overlay: false,
      plots: [{ varName: 'bop', title: 'BOP', chalkcolor: '#FF0000', linewidth: 2, style: 'line' }]
    },
    plots: [{
      data: bop.toArray().map((value, i) => ({ time: bars[i].time, value })),
      options: { chalkcolor: '#FF0000', linewidth: 2 }
    }],
    hlines: [{ value: 0, options: { chalkcolor: '#808080' } }],
    fills: []
  };
}
```
