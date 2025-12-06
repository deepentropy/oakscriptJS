# OakScriptJS

**PineScript v6 compatible technical analysis library for JavaScript/TypeScript**

OakScriptJS provides the computational core of PineScript's API. It focuses on **calculations and data transformations** with a clean Series-based approach.

## Core Features

- **Series Class**: Lazy evaluation with operator chaining
- **BarData**: Versioned wrapper for automatic cache invalidation
- **Core Functions**: Pure array-based calculations (`taCore.*`)
- **TA-Series Wrappers**: Series-based technical analysis functions (`ta.*`)
- **Type Safety**: Full TypeScript support with type definitions

## Scope

**This library includes:**
- Technical Analysis (`ta.*`, `taCore.*`) - All indicators and calculations
- Mathematics (`math.*`) - All mathematical operations
- Arrays (`array.*`) - Array manipulation and operations
- Matrices (`matrix.*`) - Matrix operations
- Strings (`str.*`) - String manipulation
- Time (`time.*`) - Time calculations and conversions
- Color (`color.*`) - Color data structures and manipulation
- Drawing Objects (`line.*`, `box.*`, `label.*`, `linefill.*`) - Computational features only
- Series Class - Lazy evaluation with operator chaining

**This library does NOT include:**
- UI/Input functions (`input.*`) - Application responsibility
- Strategy execution (`strategy.*`) - Strategy engine responsibility
- Data fetching (`request.*`) - Data provider responsibility
- Alert systems (`alert.*`, `alertcondition.*`) - Application responsibility

## Installation

```bash
npm install @deepentropy/oakscriptjs
```

## Quick Start

### Array-based Calculations

```typescript
import { taCore } from '@deepentropy/oakscriptjs';

const prices = [100, 102, 101, 103, 105];
const sma = taCore.sma(prices, 3);
const rsi = taCore.rsi(prices, 14);
```

### Series-based Calculations

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

### BarData for Automatic Cache Invalidation

```typescript
import { BarData, Series, ta } from '@deepentropy/oakscriptjs';

// Create BarData wrapper
const barData = new BarData(bars);
const close = Series.fromBars(barData, 'close');
const sma = ta.sma(close, 20);

const values1 = sma.toArray(); // Computes and caches

// Add new bar - version increments
barData.push({ time: '2024-01-03', open: 106, high: 108, low: 105, close: 107 });

const values2 = sma.toArray(); // Detects change, recomputes
```

### Memory-Efficient Closure Breaking

```typescript
import { Series } from '@deepentropy/oakscriptjs';

// Complex expression creates closure chain
const complex = a.add(b).mul(c).div(d).sub(e);

// Break closure chain to free memory
const materialized = complex.materialize();
```

## Supported Namespaces

### Technical Analysis (`ta` and `taCore`)

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

### Math (`math`)

```typescript
math.abs(x), math.ceil(x), math.floor(x), math.round(x)
math.min(...values), math.max(...values), math.avg(...values)
math.sqrt(x), math.pow(x, y), math.exp(x), math.log(x)
math.sin(x), math.cos(x), math.tan(x)
```

### Array (`array`)

```typescript
array.new_float(size, initial)
array.push(arr, value)
array.get(arr, index)
array.sum(arr), array.avg(arr), array.sort(arr)
```

### Series Class

```typescript
class Series {
  // Constructor
  constructor(data: Bar[] | BarData, extractor: SeriesExtractor)

  // Properties
  get bars(): Bar[]
  get barData(): BarData

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

  // Memory management
  materialize(): Series  // Break closure chains
}
```

### BarData Class

```typescript
class BarData {
  constructor(bars: Bar[])
  
  get version(): number
  get bars(): Bar[]
  get length(): number
  
  push(bar: Bar): void
  pop(): Bar | undefined
  set(index: number, bar: Bar): void
  updateLast(bar: Bar): void
  setAll(bars: Bar[]): void
  invalidate(): void
}
```

### Drawing Objects

- **Line (`line`)**: `new()`, `get_price()`, getters/setters
- **Box (`box`)**: `new()`, getters/setters for gap detection
- **Label (`label`)**: `new()`, getters/setters
- **Linefill (`linefill`)**: `new()`, `set_color()`

## Examples

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

// Example 2: RSI
export function rsiIndicator(bars: any[]): IndicatorResult {
  const close = new Series(bars, (bar) => bar.close);
  const rsi = ta.rsi(close, 14);

  return {
    metadata: { title: "RSI", overlay: false },
    plots: [{
      data: rsi.toArray().map((v, i) => ({ time: bars[i].time, value: v })),
      options: { color: '#FF5722', linewidth: 2 }
    }],
    hlines: [
      { value: 70, options: { color: '#FF0000' } },
      { value: 30, options: { color: '#00FF00' } }
    ]
  };
}
```

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

## Documentation

- **[Complete Guide](../../docs/guide.md)** - User guide and examples
- **[Function Inventory](../../docs/inventory.md)** - Complete function list with status

## Acknowledgments

This library is inspired by TradingView's PineScript language. It is not affiliated with or endorsed by TradingView.
