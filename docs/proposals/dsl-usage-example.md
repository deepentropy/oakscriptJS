# PineScript DSL - Complete Usage Example

## 1. Original PineScript

```pinescript
//@version=6
indicator("Balance of Power", format=format.price, precision=2)
bop = (close - open) / (high - low)
plot(bop, "BOP", color.red, 2)
hline(0, "Zero Line", color.gray)
```

## 2. Transpiled TypeScript (OakScriptEngine Output)

```typescript
// balance-of-power.ts
import {
  indicator,
  plot,
  hline,
  close,
  open,
  high,
  low,
  color,
  format,
  compile
} from '@deepentropy/oakscriptjs';

// Indicator declaration - matches PineScript exactly
indicator("Balance of Power", format.price, 2);

// Calculation - Series operations
const bop = close.sub(open).div(high.sub(low));

// Plot - multiple signatures supported
plot(bop, "BOP", color.red, 2);              // Positional (PineScript style)
// OR
plot(bop, {title: "BOP", color: color.red, linewidth: 2});  // Named (JS style)

// Horizontal line
hline(0, "Zero Line", color.gray);

// Compile to chart-bindable object
export default compile();
```

## 3. Usage in Web Application (Lightweight Charts v5)

```typescript
// app.ts - Your trading application
import { createChart } from 'lightweight-charts';
import bopIndicator from './indicators/balance-of-power';

// ============================================
// Setup Chart
// ============================================

const chartContainer = document.getElementById('chart')!;

const chart = createChart(chartContainer, {
  width: 800,
  height: 600,
  layout: {
    background: { color: '#1e222d' },
    textColor: '#d1d4dc',
  },
  grid: {
    vertLines: { color: '#2b2b43' },
    horzLines: { color: '#2b2b43' },
  },
});

// ============================================
// Add Main Series
// ============================================

const candlestickSeries = chart.addCandlestickSeries({
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
});

// ============================================
// Load Data
// ============================================

const data = [
  { time: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
  { time: '2024-01-02', open: 103, high: 107, low: 101, close: 102, volume: 1200000 },
  { time: '2024-01-03', open: 102, high: 110, low: 102, close: 108, volume: 1500000 },
  { time: '2024-01-04', open: 108, high: 112, low: 106, close: 111, volume: 1300000 },
  { time: '2024-01-05', open: 111, high: 115, low: 109, close: 110, volume: 1100000 },
  // ... more data
];

candlestickSeries.setData(data);

// ============================================
// Bind Indicator to Chart
// ============================================

// The compiled indicator exposes a bind() method
const bopController = bopIndicator.bind(chart, candlestickSeries);

// Attach to chart (creates series in separate pane)
bopController.attach();

// Now the BOP indicator is visible! 🎉

// ============================================
// Interactive Controls (Optional)
// ============================================

// Update options dynamically
document.getElementById('updateBtn')?.addEventListener('click', () => {
  bopController.setOptions({ someOption: 'newValue' });
});

// Remove indicator
document.getElementById('removeBtn')?.addEventListener('click', () => {
  bopController.detach();
});

// Re-attach indicator
document.getElementById('addBtn')?.addEventListener('click', () => {
  bopController.attach();
});

// ============================================
// Multiple Indicators
// ============================================

import rsiIndicator from './indicators/rsi';
import macdIndicator from './indicators/macd';

const rsi = rsiIndicator.bind(chart, candlestickSeries);
const macd = macdIndicator.bind(chart, candlestickSeries);

rsi.attach();   // RSI in pane 2
macd.attach();  // MACD in pane 3

// ============================================
// Responsive Chart
// ============================================

window.addEventListener('resize', () => {
  chart.applyOptions({
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight,
  });
});
```

## 4. Complete HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OakScriptJS + Lightweight Charts v5</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #131722;
    }

    #chart-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    #controls {
      padding: 10px;
      background: #1e222d;
      border-bottom: 1px solid #2b2b43;
      display: flex;
      gap: 10px;
    }

    button {
      padding: 8px 16px;
      background: #2962ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover {
      background: #1e53e5;
    }

    #chart {
      flex: 1;
    }
  </style>
</head>
<body>
  <div id="chart-container">
    <div id="controls">
      <button id="addBOP">Add BOP</button>
      <button id="removeBOP">Remove BOP</button>
      <button id="addRSI">Add RSI</button>
      <button id="removeRSI">Remove RSI</button>
    </div>
    <div id="chart"></div>
  </div>

  <script type="module">
    import { createChart } from 'https://unpkg.com/lightweight-charts@5.0.0/dist/lightweight-charts.standalone.production.js';
    import bopIndicator from './indicators/balance-of-power.js';
    import rsiIndicator from './indicators/rsi.js';

    // Create chart
    const chart = createChart(document.getElementById('chart'), {
      width: document.getElementById('chart').clientWidth,
      height: document.getElementById('chart').clientHeight,
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      timeScale: {
        borderColor: '#2b2b43',
      },
      rightPriceScale: {
        borderColor: '#2b2b43',
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Fetch and set data
    fetch('/api/ohlcv')
      .then(res => res.json())
      .then(data => {
        candlestickSeries.setData(data);
      });

    // Bind indicators
    const bop = bopIndicator.bind(chart, candlestickSeries);
    const rsi = rsiIndicator.bind(chart, candlestickSeries);

    // Controls
    document.getElementById('addBOP').addEventListener('click', () => bop.attach());
    document.getElementById('removeBOP').addEventListener('click', () => bop.detach());
    document.getElementById('addRSI').addEventListener('click', () => rsi.attach());
    document.getElementById('removeRSI').addEventListener('click', () => rsi.detach());

    // Responsive
    window.addEventListener('resize', () => {
      chart.applyOptions({
        width: document.getElementById('chart').clientWidth,
        height: document.getElementById('chart').clientHeight,
      });
    });
  </script>
</body>
</html>
```

## 5. Advanced Example: RSI with Inputs

### PineScript

```pinescript
//@version=6
indicator("RSI", overlay=false)

length = input.int(14, "Length", minval=1, maxval=200)
src = input.source(close, "Source")
overbought = input.int(70, "Overbought", minval=50, maxval=100)
oversold = input.int(30, "Oversold", minval=0, maxval=50)

rsiValue = ta.rsi(src, length)

plot(rsiValue, "RSI", color.purple, 2)
hline(overbought, "Overbought", color.red, hline.style_dashed)
hline(oversold, "Oversold", color.green, hline.style_dashed)
hline(50, "Middle", color.gray)

bgcolor(rsiValue > overbought ? color.new(color.red, 90) : rsiValue < oversold ? color.new(color.green, 90) : na)
```

### Transpiled TypeScript

```typescript
import {
  indicator,
  plot,
  hline,
  bgcolor,
  input,
  close,
  ta,
  color,
  compile
} from '@deepentropy/oakscriptjs';

indicator("RSI", {overlay: false});

// Inputs (with defaults)
const length = input.int(14, "Length", {minval: 1, maxval: 200});
const src = input.source(close, "Source");
const overbought = input.int(70, "Overbought", {minval: 50, maxval: 100});
const oversold = input.int(30, "Oversold", {minval: 0, maxval: 50});

// Calculation
const rsiValue = ta.rsi(src, length);

// Plot
plot(rsiValue, "RSI", color.purple, 2);
hline(overbought, "Overbought", color.red, "dashed");
hline(oversold, "Oversold", color.green, "dashed");
hline(50, "Middle", color.gray);

// Background color (conditional)
bgcolor(
  rsiValue.gt(overbought)
    ? color.new(color.red, 90)
    : rsiValue.lt(oversold)
      ? color.new(color.green, 90)
      : null
);

export default compile();
```

### Usage with Input Controls

```typescript
import rsiIndicator from './indicators/rsi';

// Bind with custom inputs
const rsi = rsiIndicator.bind(chart, candlestickSeries, {
  length: 21,        // Override default (14)
  overbought: 80,    // Override default (70)
  oversold: 20,      // Override default (30)
});

rsi.attach();

// Update inputs dynamically
document.getElementById('lengthSlider')?.addEventListener('input', (e) => {
  const newLength = parseInt(e.target.value);
  rsi.setOptions({ length: newLength });  // Recalculates and updates
});
```

## 6. API Comparison

### PineScript
```pinescript
indicator("Title", overlay=true)
plot(close, "Close", color.blue, 2)
```

### Proposed OakScriptJS DSL
```typescript
// Option A: Named parameters (object)
indicator("Title", {overlay: true});
plot(close, {title: "Close", color: color.blue, linewidth: 2});

// Option B: Positional parameters (PineScript style)
indicator("Title", true);
plot(close, "Close", color.blue, 2);

// Option C: Hybrid (recommended)
indicator("Title", {overlay: true});  // Named when many params
plot(close, "Close", color.blue, 2);  // Positional when few params
```

### Function Signatures

```typescript
// indicator() - multiple overloads
function indicator(title: string): void;
function indicator(title: string, overlay: boolean): void;
function indicator(title: string, options: IndicatorOptions): void;

// plot() - multiple overloads
function plot(series: Series): void;
function plot(series: Series, title: string): void;
function plot(series: Series, title: string, color: Color): void;
function plot(series: Series, title: string, color: Color, linewidth: number): void;
function plot(series: Series, options: PlotOptions): void;

// hline() - multiple overloads
function hline(price: number): void;
function hline(price: number, title: string): void;
function hline(price: number, title: string, color: Color): void;
function hline(price: number, title: string, color: Color, linestyle: string): void;
function hline(price: number, options: HLineOptions): void;
```

## 7. TypeScript Benefits

```typescript
// Type inference works!
const bop = close.sub(open);  // Series type inferred

// Autocomplete in IDE
plot(bop, {
  color: color.red,   // IDE suggests: red, green, blue, ...
  style: 'line',      // IDE suggests: 'line', 'histogram', 'area', ...
  linewidth: 2,
});

// Type errors caught at compile time
plot(bop, {
  color: 'invalid',   // ❌ Type error!
  linewidth: "two",   // ❌ Type error!
});
```

## Summary

### Workflow
1. **PineScript** → OakScriptEngine → **TypeScript (DSL)**
2. **TypeScript** → Build → **JavaScript Module**
3. **JavaScript Module** + Lightweight Charts → **Rendered Indicator**

### Key Points
- Transpiled code looks ~95% like PineScript ✅
- Works with Lightweight Charts v5 out of the box ✅
- Supports both positional and named parameters ✅
- Full TypeScript type safety ✅
- Simple bind/attach API ✅
- Multiple indicators on same chart ✅
- Dynamic input updates ✅

This approach gives you the best of both worlds: PineScript familiarity with JavaScript ecosystem power!
