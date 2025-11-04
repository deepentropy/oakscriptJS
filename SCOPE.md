# OakScriptJS Scope & Limitations

## Overview

OakScriptJS is a **calculation-focused** JavaScript/TypeScript library that mirrors PineScript's API for computational functions only. It does NOT attempt to replicate TradingView's platform features.

## Design Philosophy

**What we do:**
- Mirror PineScript's calculation and data manipulation APIs with exact signatures
- Provide accurate implementations of technical indicators
- Enable algorithmic trading development in JavaScript/TypeScript
- Support custom backtesting and analysis tools

**What we don't do:**
- Provide rendering or charting capabilities
- Implement UI controls or user interaction
- Execute trading strategies
- Fetch market data
- Manage alerts

## Included Namespaces

### ✅ `ta` - Technical Analysis
**All calculation functions for technical indicators**

- Moving averages (SMA, EMA, WMA, VWMA, SWMA, etc.)
- Oscillators (RSI, Stochastic, CCI, MFI, etc.)
- Volatility (Bollinger Bands, ATR, Standard Deviation, Variance)
- Momentum (ROC, MOM, PercentRank)
- Regression (LinReg, Correlation)
- Crossovers and changes
- Custom indicators (SuperTrend, etc.)

**Why included:** Pure mathematical calculations that can run anywhere

### ✅ `math` - Mathematics
**All mathematical operations**

- Basic math (abs, ceil, floor, round)
- Min/Max/Average
- Powers and logarithms
- Trigonometry
- Random numbers
- Unit conversions

**Why included:** Pure mathematical functions with no external dependencies

### ✅ `array` - Array Operations
**All array manipulation and analysis functions**

- Creation and access
- Modification (push, pop, shift, unshift, insert, remove)
- Analysis (sum, average, min, max, median, stdev)
- Operations (sort, reverse, slice, concat, indexOf)

**Why included:** Pure data manipulation

### ✅ `matrix` - Matrix Operations
**Matrix creation and operations**

- Creation and copying
- Multiplication and addition
- Transposition
- Element access

**Why included:** Pure mathematical operations for advanced calculations

### ✅ `str` - String Manipulation
**All string functions**

- Conversion (toString, toNumber)
- Manipulation (substring, split, concat, replace)
- Case conversion
- Search operations
- Formatting

**Why included:** Pure string operations

### ✅ `time` - Time Calculations
**Time-based calculations and conversions**

- Timestamp conversions
- Timeframe calculations
- Time component extraction

**Why included:** Pure computational functions for time-based logic

### ✅ `color` - Color Data
**Color creation and manipulation**

- RGB color creation
- Hex conversion
- Component extraction
- Predefined colors

**Why included:** Data structures for color values (useful for returning indicator metadata)

## Excluded Namespaces

### ❌ `plot.*` - Plotting Functions
**Why excluded:** Requires a rendering engine to draw on charts

Functions like:
- `plot()`, `plotshape()`, `plotchar()`, `plotarrow()`
- `plotbar()`, `plotcandle()`
- `bgcolor()`, `fill()`, `hline()`

**Alternative:** Your application should handle rendering based on the calculated indicator values

### ❌ `line.*`, `label.*`, `box.*` - Drawing Objects
**Why excluded:** Requires a rendering engine to draw on charts

These create visual objects on TradingView charts and have no computational equivalent.

**Alternative:** Use calculated values to draw these in your own charting library

### ❌ `table.*` - Table Rendering
**Why excluded:** Requires UI rendering capabilities

Tables are UI components displayed on TradingView charts.

**Alternative:** Format data as needed for your own UI framework

### ❌ `input.*` - User Input Controls
**Why excluded:** Requires UI framework and user interaction

Functions like:
- `input.int()`, `input.float()`, `input.bool()`, `input.string()`
- `input.source()`, `input.color()`, `input.timeframe()`

**Alternative:** Handle user input in your application and pass values as parameters

### ❌ `strategy.*` - Strategy Execution
**Why excluded:** Requires backtesting/execution engine and broker integration

Functions like:
- `strategy()`, `strategy.entry()`, `strategy.exit()`
- `strategy.close()`, `strategy.position_size`
- Order management and execution

**Alternative:** Use calculated indicator values to build your own backtesting or execution engine

### ❌ `request.*` - Data Fetching
**Why excluded:** Requires TradingView's market data infrastructure

Functions like:
- `request.security()` - Multi-symbol/timeframe data
- `request.financial()`, `request.earnings()` - Fundamental data
- `request.dividends()`, `request.splits()`

**Alternative:** Fetch your own market data and pass it to OakScriptJS functions

### ❌ `alert.*`, `alertcondition.*` - Alert System
**Why excluded:** Requires TradingView's notification infrastructure

**Alternative:** Monitor calculated indicator values and implement your own notification system

## What Can You Build?

With OakScriptJS, you can build:

### ✅ Custom Backtesting Engines
```typescript
import { ta } from 'oakscriptjs';

// Calculate indicators
const rsi = ta.rsi(closes, 14);
const [macd, signal, hist] = ta.macd(closes, 12, 26, 9);

// Implement your own backtesting logic
for (let i = 0; i < closes.length; i++) {
  if (rsi[i] < 30 && macd[i] > signal[i]) {
    // Execute your buy logic
  }
}
```

### ✅ Real-time Analysis Tools
```typescript
import { ta, math } from 'oakscriptjs';

// Stream live data and calculate indicators
function onNewBar(bar) {
  const closes = [...historicalCloses, bar.close];
  const sma20 = ta.sma(closes, 20);
  const currentSMA = sma20[sma20.length - 1];

  // Use the calculated value in your application
  displayIndicator('SMA(20)', currentSMA);
}
```

### ✅ Trading Signal Generators
```typescript
import { ta } from 'oakscriptjs';

function generateSignals(ohlcv) {
  const { high, low, close } = ohlcv;

  const [supertrend, direction] = ta.supertrend(3, 10, high, low, close);
  const rsi = ta.rsi(close, 14);

  return {
    trend: direction[direction.length - 1],
    overbought: rsi[rsi.length - 1] > 70,
    oversold: rsi[rsi.length - 1] < 30,
    supertrend: supertrend[supertrend.length - 1]
  };
}
```

### ✅ Data Processing Pipelines
```typescript
import { ta, math, array } from 'oakscriptjs';

// Process market data through multiple indicators
function processData(marketData) {
  const indicators = {
    sma: ta.sma(marketData.close, 20),
    ema: ta.ema(marketData.close, 20),
    rsi: ta.rsi(marketData.close, 14),
    bb: ta.bb(marketData.close, 20, 2),
    atr: ta.atr(14, marketData.high, marketData.low, marketData.close)
  };

  return indicators;
}
```

## What You CANNOT Build (with OakScriptJS alone)

### ❌ TradingView Clone
You need charting/rendering libraries for visualization.

### ❌ Complete Strategy Platform
You need order execution and broker integration.

### ❌ Market Data Provider
You need access to market data feeds.

## Migration from PineScript

If you're converting a PineScript indicator to JavaScript:

**Can be converted directly:**
- All `ta.*` calculations
- All `math.*` operations
- All `array.*` operations
- Calculation logic and algorithms

**Needs alternative implementation:**
- `plot()` → Use calculated values with your charting library
- `input.*()` → Get parameters from your UI or config
- `request.security()` → Fetch data yourself and pass to functions
- `strategy.*()` → Build your own execution logic

**Example conversion:**
```pinescript
// PineScript
//@version=5
indicator("My Indicator")
length = input.int(14, "Length")
src = input.source(close, "Source")
myRSI = ta.rsi(src, length)
plot(myRSI, "RSI", color.blue)
hline(70, "Overbought")
hline(30, "Oversold")
```

```typescript
// OakScriptJS
import { ta } from 'oakscriptjs';

interface Config {
  length: number;
  source: number[];
}

function myIndicator(config: Config, chartData: ChartData) {
  const { length, source } = config;
  const myRSI = ta.rsi(source, length);

  // Return calculated values - your app handles rendering
  return {
    rsi: myRSI,
    overbought: 70,
    oversold: 30
  };
}

// Usage in your app
const config = { length: 14, source: marketData.close };
const result = myIndicator(config, marketData);

// You handle the plotting with your preferred library
myChart.addLine(result.rsi, { color: 'blue' });
myChart.addHorizontalLine(result.overbought);
myChart.addHorizontalLine(result.oversold);
```

## Summary

**OakScriptJS is:**
- A calculation engine
- An indicator library
- A PineScript API mirror (computational parts only)

**OakScriptJS is NOT:**
- A charting library
- A trading platform
- A data provider
- A strategy executor

Use OakScriptJS as the **calculation core** of your trading tools, and combine it with other libraries for rendering, data fetching, and execution as needed.
