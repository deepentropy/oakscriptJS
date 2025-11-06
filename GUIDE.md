# OakScriptJS Complete Guide

**The ultimate resource for using OakScriptJS and transpiling PineScript indicators**

## Table of Contents

1. [Introduction](#introduction)
2. [For End Users: Using OakScriptJS](#for-end-users)
3. [For OakScriptEngine Developers: Transpilation Guide](#for-oakscriptengine-developers)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

OakScriptJS is a JavaScript/TypeScript library that mirrors PineScript's API, providing three levels of functionality:

### Level 1: Computational Core
Pure calculation functions matching PineScript signatures.

```typescript
import { ta } from '@deepentropy/oakscriptjs';

const prices = [10, 12, 11, 13, 15];
const sma = ta.sma(prices, 3);
```

### Level 2: PineScript DSL
Declarative API for writing indicators.

```typescript
import { indicator, plot, close, ta, compile } from '@deepentropy/oakscriptjs';

indicator("My RSI");
const rsi = ta.rsi(close, 14);
plot(rsi);
export default compile();
```

### Level 3: Native Operators (with Babel)
100% PineScript-like syntax with operators.

```typescript
import { indicator, plot, close, open, high, low, compile } from '@deepentropy/oakscriptjs';

indicator("BOP");
const bop = (close - open) / (high - low);  // Native operators!
plot(bop);
export default compile();
```

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
import { ta, math } from '@deepentropy/oakscriptjs';

// Price data
const closes = [100, 102, 101, 103, 105, 104, 106];

// Calculate indicators
const sma = ta.sma(closes, 5);
const ema = ta.ema(closes, 5);
const rsi = ta.rsi(closes, 14);

// Math operations
const avg = math.avg(...closes);
const max = math.max(...closes);
```

### Using with Lightweight Charts

Import transpiled indicators and use them directly:

```typescript
import { createChart } from 'lightweight-charts';
import bopIndicator from './indicators/balance-of-power';

// Setup chart
const chart = createChart(document.getElementById('chart'), {
  width: 800,
  height: 600
});

const candlestickSeries = chart.addCandlestickSeries();
candlestickSeries.setData(ohlcvData);

// Attach indicator
const bop = bopIndicator.bind(chart, candlestickSeries);
bop.attach();

// Control indicator
bop.setOptions({ length: 20 });  // Update parameters
bop.detach();  // Remove from chart
```

### Available Namespaces

#### Technical Analysis (`ta`)

```typescript
import { ta } from '@deepentropy/oakscriptjs';

// Moving averages
ta.sma(source, length)
ta.ema(source, length)
ta.wma(source, length)
ta.vwma(source, volume, length)

// Oscillators
ta.rsi(source, length)
ta.macd(source, fast, slow, signal)  // Returns [macd, signal, histogram]
ta.cci(source, length)
ta.stoch(source, high, low, length)

// Volatility
ta.bb(source, length, mult)  // Returns [upper, basis, lower]
ta.atr(data, length)
ta.stdev(source, length)

// Crossovers
ta.crossover(a, b)
ta.crossunder(a, b)
ta.cross(a, b)

// More: mom, roc, linreg, correlation, tr, etc.
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

This section is specifically for developers transpiling PineScript to JavaScript.

### Architecture Overview

```
PineScript Source
    ↓ (OakScriptEngine Parser)
TypeScript with DSL & Native Operators
    ↓ (Babel Plugin - Required)
TypeScript with Series Method Calls
    ↓ (TypeScript Compiler)
JavaScript Indicator Module
    ↓ (User's Application)
Lightweight Charts
```

### Transpilation Strategy

OakScriptJS uses **native operators with the Babel plugin** to achieve 100% PineScript similarity.

#### Native Operators (Required) ⭐

**Original PineScript**:
```pinescript
//@version=6
indicator("Balance of Power")
bop = (close - open) / (high - low)
plot(bop, color=color.red)
```

**Transpiled Output**:
```typescript
import { indicator, plot, close, open, high, low, color, compile } from '@deepentropy/oakscriptjs';

indicator("Balance of Power");
const bop = (close - open) / (high - low);  // Native operators!
plot(bop, {color: color.red});
export default compile();
```

**Requirements**:
- Babel plugin: `babel-plugin/pinescript-operators.cjs`
- Build pipeline: `babel src --out-dir dist`

**Setup**:

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

3. Generate code with operators (Babel transforms them automatically)

### Transpilation Mapping

#### 1. Indicator Declaration

**PineScript**:
```pinescript
indicator("My Indicator", overlay=true, precision=2)
```

**OakScriptJS**:
```typescript
indicator("My Indicator", {overlay: true, precision: 2});
```

#### 2. Built-in Series

**PineScript** → **OakScriptJS**:
- `close` → `close`
- `open` → `open`
- `high` → `high`
- `low` → `low`
- `volume` → `volume`
- `hl2` → `hl2`
- `hlc3` → `hlc3`
- `ohlc4` → `ohlc4`

#### 3. Technical Analysis

**PineScript** → **OakScriptJS**:

```pinescript
ta.sma(close, 20)       // PineScript
```
```typescript
ta.sma(close, 20)       // OakScriptJS (same!)
```

#### 4. Operators

With Babel plugin enabled:

**PineScript** → **OakScriptJS** (Before Babel) → **Runtime** (After Babel):

```pinescript
bop = (close - open) / (high - low)
```
```typescript
const bop = (close - open) / (high - low)  // Before Babel
```
```typescript
const bop = close.sub(open).div(high.sub(low))  // After Babel
```

#### 5. Plot Function

**PineScript**:
```pinescript
plot(bop, "BOP", color.red, 2, style=plot.style_line)
```

**OakScriptJS**:
```typescript
plot(bop, {title: "BOP", color: color.red, linewidth: 2, style: "line"});
```

#### 6. Horizontal Lines

**PineScript**:
```pinescript
hline(70, "Overbought", color.red, linestyle=hline.style_dashed)
```

**OakScriptJS**:
```typescript
hline(70, {title: "Overbought", color: color.red, linestyle: "dashed"});
```

#### 7. Conditions

With Babel plugin:

**PineScript**:
```pinescript
overbought = rsi > 70
oversold = rsi < 30
signal = overbought or oversold
```

**OakScriptJS**:
```typescript
const overbought = rsi > 70;
const oversold = rsi < 30;
const signal = overbought || oversold;
```

#### 8. Export

**Every indicator must end with**:
```typescript
export default compile();
```

This packages everything for chart binding.

### Complete Transpilation Example

**Input (PineScript)**:
```pinescript
//@version=6
indicator("RSI Signals", overlay=false)

length = input.int(14, "Length")
overbought = input.int(70, "Overbought")
oversold = input.int(30, "Oversold")

rsiValue = ta.rsi(close, length)
buySignal = rsiValue < oversold
sellSignal = rsiValue > overbought

plot(rsiValue, "RSI", color.purple, 2)
hline(overbought, "OB", color.red)
hline(oversold, "OS", color.green)
hline(50, "Middle", color.gray)
```

**Output (OakScriptJS with Babel)**:
```typescript
import { indicator, plot, hline, close, ta, color, compile } from '@deepentropy/oakscriptjs';

indicator("RSI Signals", {overlay: false});

// Note: input.* functions not yet implemented - use constants or options
const length = 14;
const overbought = 70;
const oversold = 30;

const rsiValue = ta.rsi(close, length);
const buySignal = rsiValue < oversold;      // Babel → rsiValue.lt(oversold)
const sellSignal = rsiValue > overbought;   // Babel → rsiValue.gt(overbought)

plot(rsiValue, {title: "RSI", color: color.purple, linewidth: 2});
hline(overbought, {title: "OB", color: color.red});
hline(oversold, {title: "OS", color: color.green});
hline(50, {title: "Middle", color: color.gray});

export default compile();
```

### Handling Input Parameters

Input parameters are **not yet fully implemented** in the DSL. Current workarounds:

#### Option 1: Use Constants (Simple)
```typescript
const length = 14;  // Replace input.int(14, "Length")
```

#### Option 2: Use Options Parameter (Better)
```typescript
// In indicator code:
const length = 14;  // Default

// User can override:
indicator.bind(chart, series, {length: 21});
```

#### Option 3: Wait for input.* Implementation (Coming Soon)
```typescript
// Future:
const length = input.int(14, "Length", {minval: 1, maxval: 200});
```

### Not Yet Supported

Features not yet implemented:

1. **input.* functions** - Use options parameter instead
2. **bgcolor/barcolor** - Background/bar coloring
3. **plotshape/plotchar** - Shape plotting
4. **fill()** - Fill between plots
5. **alertcondition** - Alerts
6. **strategy.* functions** - Strategy testing
7. **request.* functions** - Data fetching

### Babel Plugin Integration

The Babel plugin enables native operators by transforming them at build time.

**Installation in OakScriptEngine**:

```javascript
// transpiler.js
const babel = require('@babel/core');

function transpilePineScript(pinescriptCode) {
  // Step 1: Parse PineScript to TypeScript
  const tsCode = parsePineScriptToTypeScript(pinescriptCode);

  // Step 2: Transform operators with Babel
  const result = babel.transformSync(tsCode, {
    filename: 'indicator.ts',
    plugins: [
      require('@deepentropy/oakscriptjs/babel-plugin/pinescript-operators.cjs')
    ]
  });

  return result.code;
}
```

**Operator Transformations**:

| Input | After Babel | Notes |
|-------|-------------|-------|
| `close + 10` | `close.add(10)` | Arithmetic |
| `high - low` | `high.sub(low)` | Series operation |
| `a * b` | `a.mul(b)` | Multiplication |
| `a / b` | `a.div(b)` | Division |
| `a > b` | `a.gt(b)` | Comparison |
| `a && b` | `a.and(b)` | Logical AND |
| `-a` | `a.neg()` | Negation |
| `50 + 20` | `50 + 20` | **NOT transformed** (no Series) |

The plugin is **smart**: it only transforms when Series are involved.

---

## API Reference

### Core Namespaces

#### ta (Technical Analysis)

```typescript
// Moving Averages
ta.sma(source: series_float, length: number): series_float
ta.ema(source: series_float, length: number): series_float
ta.wma(source: series_float, length: number): series_float
ta.vwma(source: series_float, length: number): series_float

// Oscillators
ta.rsi(source: series_float, length: number): series_float
ta.cci(source: series_float, length: number): series_float
ta.mfi(data: Bar[], length: number): series_float

// MACD (returns tuple)
ta.macd(
  source: series_float,
  fastLength: number,
  slowLength: number,
  signalLength: number
): [series_float, series_float, series_float]

// Bollinger Bands (returns tuple)
ta.bb(
  source: series_float,
  length: number,
  mult: number
): [series_float, series_float, series_float]  // [upper, basis, lower]

// Volatility
ta.atr(data: Bar[], length: number): series_float
ta.tr(data: Bar[]): series_float
ta.stdev(source: series_float, length: number, biased?: boolean): series_float

// Crossovers
ta.crossover(a: series_float, b: series_float | number): series_bool
ta.crossunder(a: series_float, b: series_float | number): series_bool
ta.cross(a: series_float, b: series_float | number): series_bool

// Utilities
ta.change(source: series_float, length?: number): series_float
ta.mom(source: series_float, length: number): series_float
ta.roc(source: series_float, length: number): series_float
```

#### DSL Functions

```typescript
// Indicator declaration
indicator(title: string, options?: {
  shorttitle?: string;
  format?: 'price' | 'volume' | 'percent';
  precision?: number;
  overlay?: boolean;
}): void

// Plot series
plot(series: Series, options?: {
  title?: string;
  color?: any;
  linewidth?: number;
  style?: 'line' | 'histogram' | 'area';
}): void

// Horizontal line
hline(price: number, options?: {
  title?: string;
  color?: any;
  linestyle?: 'solid' | 'dashed' | 'dotted';
}): void

// Compile to chart-bindable object
compile(): CompiledIndicator
```

#### Series Class

```typescript
class Series {
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

  // History
  offset(n: number): Series  // Like close[1] in PineScript

  // Access
  get(index: number): number
  last(): number
  toArray(): number[]
}
```

#### Compiled Indicator Methods

After calling `compile()`, the returned object has a `bind()` method that returns a controller with these methods:

```typescript
const indicator = compile();
const controller = indicator.bind(chart, candlestickSeries, options);

// Available methods:
controller.attach();                    // Show indicator on chart
controller.detach();                    // Remove from chart
controller.update();                    // Recalculate (usually automatic)
controller.setOptions(options: any);    // Update parameters
```

---

## Examples

### Example 1: Simple Moving Average

```typescript
import { indicator, plot, close, ta, color, compile } from '@deepentropy/oakscriptjs';

indicator("SMA 20", {overlay: true});

const sma20 = ta.sma(close, 20);

plot(sma20, {color: color.blue, linewidth: 2});

export default compile();
```

### Example 2: RSI with Levels

```typescript
import { indicator, plot, hline, close, ta, color, compile } from '@deepentropy/oakscriptjs';

indicator("RSI", {overlay: false});

const rsi = ta.rsi(close, 14);

plot(rsi, {color: color.purple, linewidth: 2});
hline(70, {color: color.red, linestyle: "dashed"});
hline(30, {color: color.green, linestyle: "dashed"});
hline(50, {color: color.gray});

export default compile();
```

### Example 3: MACD

```typescript
import { indicator, plot, hline, close, ta, color, compile } from '@deepentropy/oakscriptjs';

indicator("MACD", {overlay: false});

const [macdLine, signalLine, histogram] = ta.macd(close, 12, 26, 9);

plot(macdLine, {color: color.blue, linewidth: 2});
plot(signalLine, {color: color.orange, linewidth: 1});
plot(histogram, {color: color.gray, style: "histogram"});
hline(0, {color: color.gray});

export default compile();
```

### Example 4: Native Operators

```typescript
import { indicator, plot, close, open, high, low, color, compile } from '@deepentropy/oakscriptjs';

indicator("Balance of Power");

// Native operators (requires Babel plugin)
const range = high - low;
const change = close - open;
const bop = change / range;

plot(bop, {color: color.red, linewidth: 2});

export default compile();
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

**Solution**: Enable Babel plugin (see [Babel Plugin Integration](#babel-plugin-integration))

### Runtime Issues

**Problem**: Indicator not showing on chart

**Solution**:
1. Verify `compile()` is called and exported
2. Check `attach()` was called
3. Verify data format: `{time, open, high, low, close, volume?}`

**Problem**: TypeScript errors with Series

**Solution**: Import Series type:
```typescript
import { Series } from '@deepentropy/oakscriptjs';
```

### Transpilation Issues

**Problem**: Generated code doesn't match PineScript

**Solution**: Ensure you're using the DSL functions (`indicator`, `plot`, etc.) and ending with `export default compile()`

**Problem**: Colors not working

**Solution**: Use Pine color names (`color.red`) not hex codes

---

## Additional Resources

- **Babel Plugin Guide**: `/docs/BABEL_PLUGIN_GUIDE.md`
- **Examples**: `/examples/indicators/`
- **API Source**: `/src/dsl/` and `/src/ta/`
- **GitHub**: https://github.com/deepentropy/oakscriptJS

---

## Summary

### For Users
- Install OakScriptJS
- Import pre-built indicators or create your own
- Use with Lightweight Charts via `.bind()` and `.attach()`

### For OakScriptEngine Developers
- Parse PineScript to TypeScript with DSL functions
- Use Babel plugin for native operators (recommended)
- Map PineScript functions 1:1 to OakScriptJS equivalents
- Always end with `export default compile()`

**Result**: Generated code looks 95-100% like PineScript!

---

**Version**: 0.1.3
**Last Updated**: January 2025
