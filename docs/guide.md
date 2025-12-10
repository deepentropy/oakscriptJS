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

OakScriptJS is a simplified JavaScript/TypeScript library that provides the computational core of PineScript's API. It focuses on **calculations and data transformations**. For pre-built indicators, see the `@oakscript/indicators` package.

### Core Capabilities

**Level 1: Core Functions (Array-based)**
Pure calculation functions matching PineScript signatures.

```typescript
import {taCore} from 'oakscriptjs';

const prices = [10, 12, 11, 13, 15];
const sma = taCore.sma(prices, 3);
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
import {ta, Series} from 'oakscriptjs';

const close = new Series(data, (bar) => bar.close);
const rsi = ta.rsi(close, 14);  // Returns a Series
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
import {taCore, math} from 'oakscriptjs';

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
import {Series, ta} from 'oakscriptjs';

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
const rsi = ta.rsi(close, 14);

// Extract values
const rsiValues = rsi.toArray();
const lastRSI = rsi.last();
```

### BarData for Automatic Cache Invalidation

The `BarData` class wraps bar arrays and tracks version changes for automatic cache invalidation:

```typescript
import {BarData, Series, ta} from 'oakscriptjs';

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
import {ta, taCore} from 'oakscriptjs';

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
import {ta} from 'oakscriptjs';

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
