# OakScriptJS Runtime API

The runtime module provides a global context pattern for transpiler-generated indicators, enabling clean separation between indicator calculation logic and chart/input integration.

## Overview

The runtime decouples chart access from the library core by requiring the host application to provide lightweight-charts and UI adapters at runtime. This leads to:

- Simpler indicator modules that only contain calculation logic
- Consistent semantics mapped to PineScript behaviors (idempotent inputs, plot references)
- Centralized chart code with consistent behavior across indicators

## Quick Start

### Host Application Setup

```typescript
import { 
  setContext, 
  recalculate 
} from '@deepentropy/oakscriptjs';
import { 
  LightweightChartsAdapter, 
  SimpleInputAdapter 
} from '@deepentropy/oakscriptjs';

// Create adapters
const inputAdapter = new SimpleInputAdapter();
inputAdapter.onInputChange(() => recalculate());

// Set up context before calling indicator
setContext({
  chart: new LightweightChartsAdapter(chart, candlestickSeries),
  inputs: inputAdapter,
  ohlcv: { time, open, high, low, close, volume },
  bar_index: time.length - 1,
});

// Import and run indicator
const mod = await import('./indicators/sma.mjs');
mod.calculate();
```

### Transpiler-Generated Indicator

```typescript
import { input_int, plot, registerCalculate, ta } from '@deepentropy/oakscriptjs';

export function calculate() {
  // Register for recalculation on input changes
  registerCalculate(calculate);
  
  // Get current input values (idempotent)
  const len = input_int(14, 'Length');
  
  // Calculate indicator
  const sma = ta.sma(close, len);
  
  // Plot on chart
  plot(sma.toArray(), `SMA(${len})`);
}
```

## API Reference

### Context Management

#### `setContext(ctx: OakScriptContext): void`

Set the global runtime context. Must be called before any indicator calculation.

```typescript
interface OakScriptContext {
  chart: ChartAdapter;
  inputs: InputAdapter;
  ohlcv: {
    time: number[];
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  };
  bar_index: number;
}
```

#### `clearContext(): void`

Clear the global context. Call when detaching an indicator or cleaning up.

#### `getContext(): OakScriptContext | null`

Get the current context, or null if not set.

### Calculate Registration

#### `registerCalculate(fn: () => void): void`

Register a calculate function for recalculation. Call this at the start of your calculate function.

```typescript
function calculate() {
  registerCalculate(calculate);
  // ... rest of calculation
}
```

#### `recalculate(): void`

Trigger recalculation. Clears existing plots and re-invokes the registered calculate function.

### Plot Functions

#### `plot(series, title?, color?, linewidth?, style?): string`

Plot a series on the chart.

| Parameter | Type | Description |
|-----------|------|-------------|
| series | `number[]` | Array of values to plot |
| title | `string?` | Plot title |
| color | `string?` | Plot color (hex or named) |
| linewidth | `number?` | Line width |
| style | `string?` | Plot style: 'line', 'histogram', 'area', etc. |

Returns a unique plot ID for reference.

```typescript
const sma = ta.sma(close, 14);
plot(sma.toArray(), 'SMA', '#2196F3', 2, 'line');
```

#### `hline(price, title?, color?, linestyle?, linewidth?): string`

Draw a horizontal line at a fixed price level.

| Parameter | Type | Description |
|-----------|------|-------------|
| price | `number` | Y-axis value |
| title | `string?` | Line title |
| color | `string?` | Line color |
| linestyle | `string?` | 'solid', 'dashed', 'dotted' |
| linewidth | `number?` | Line width |

```typescript
hline(50, 'Centerline', '#888888', 'dashed', 1);
hline(70, 'Overbought', '#FF5252');
hline(30, 'Oversold', '#4CAF50');
```

#### `clearPlots(): void`

Clear all active plots from the chart. Called internally by `recalculate()`.

### Input Functions

Input functions are **idempotent**:
- First call registers the input with the default value
- Subsequent calls return the current stored value (which may have been updated by the user)

This matches PineScript semantics where inputs are evaluated once and then maintain their user-set values.

#### `input_int(defval, title?, options?): number`

Register an integer input.

```typescript
const length = input_int(14, 'Length', { min: 1, max: 200, step: 1 });
```

#### `input_float(defval, title?, options?): number`

Register a float input.

```typescript
const factor = input_float(2.0, 'Factor', { min: 0.5, max: 5.0, step: 0.1 });
```

#### `input_bool(defval, title?): boolean`

Register a boolean input.

```typescript
const showLabels = input_bool(true, 'Show Labels');
```

#### `input_string(defval, title?, options?): string`

Register a string input with optional dropdown options.

```typescript
const maType = input_string('SMA', 'MA Type', ['SMA', 'EMA', 'WMA', 'RMA']);
```

#### `input_source(defval, title?): number[]`

Register a source input (returns OHLCV data based on selection).

```typescript
const src = input_source('close', 'Source');
// src will be the close array, or whatever the user selects:
// 'open', 'high', 'low', 'close', 'volume', 'hl2', 'hlc3', 'ohlc4'
```

## Adapters

### ChartAdapter

Interface for chart integration:

```typescript
interface ChartAdapter {
  addSeries(type: string, options?: SeriesOptions): SeriesHandle;
  removeSeries(series: SeriesHandle): void;
  getMainSeries?(): SeriesHandle | undefined;
  createPane?(): number;
}

interface SeriesHandle {
  setData(data: Array<{ time: number; value: number }>): void;
}

interface SeriesOptions {
  color?: string;
  lineWidth?: number;
  lineStyle?: number;
  priceScaleId?: string;
  pane?: number;
}
```

### LightweightChartsAdapter

Built-in adapter for lightweight-charts v5:

```typescript
import { LightweightChartsAdapter } from '@deepentropy/oakscriptjs';

const chart = createChart(container);
const mainSeries = chart.addSeries(CandlestickSeries);

const adapter = new LightweightChartsAdapter(chart, mainSeries);
```

### InputAdapter

Interface for input management:

```typescript
interface InputAdapter {
  registerInput(config: InputConfig): any;
  getValue(id: string): any;
  setValue(id: string, value: any): void;
  onInputChange(callback: (id: string, value: any) => void): void;
}

interface InputConfig {
  id: string;
  type: 'int' | 'float' | 'bool' | 'string' | 'source';
  defval: any;
  title?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}
```

### SimpleInputAdapter

Built-in in-memory adapter for demos and simple applications:

```typescript
import { SimpleInputAdapter, recalculate } from '@deepentropy/oakscriptjs';

const inputAdapter = new SimpleInputAdapter();

// Auto-recalculate when inputs change
inputAdapter.onInputChange(() => recalculate());

// Later, programmatically update a value:
inputAdapter.setValue('Length', 20);

// Get all inputs for rendering a UI:
const allInputs = inputAdapter.getAllInputs();
for (const [id, { config, value }] of allInputs) {
  console.log(`${config.title}: ${value}`);
}
```

## Custom Adapters

### Custom Chart Adapter

```typescript
class MyChartAdapter implements ChartAdapter {
  private myChartLib: any;

  constructor(chart: any) {
    this.myChartLib = chart;
  }

  addSeries(type: string, options?: SeriesOptions): SeriesHandle {
    const series = this.myChartLib.createSeries(type, options);
    return {
      setData(data) {
        series.updateData(data);
      },
    };
  }

  removeSeries(series: SeriesHandle): void {
    this.myChartLib.deleteSeries(series);
  }
}
```

### Custom Input Adapter (React Example)

```typescript
class ReactInputAdapter implements InputAdapter {
  private store: Map<string, { config: InputConfig; value: any }> = new Map();
  private setStateCallback: (inputs: Map<string, any>) => void;
  private changeCallbacks: Array<(id: string, value: any) => void> = [];

  constructor(setStateCallback: (inputs: Map<string, any>) => void) {
    this.setStateCallback = setStateCallback;
  }

  registerInput(config: InputConfig): any {
    if (!this.store.has(config.id)) {
      this.store.set(config.id, { config, value: config.defval });
      this.notifyReact();
    }
    return this.store.get(config.id)!.value;
  }

  getValue(id: string): any {
    return this.store.get(id)?.value;
  }

  setValue(id: string, value: any): void {
    const input = this.store.get(id);
    if (input) {
      input.value = value;
      this.changeCallbacks.forEach(cb => cb(id, value));
      this.notifyReact();
    }
  }

  onInputChange(callback: (id: string, value: any) => void): void {
    this.changeCallbacks.push(callback);
  }

  private notifyReact(): void {
    const values = new Map();
    for (const [id, { value }] of this.store) {
      values.set(id, value);
    }
    this.setStateCallback(values);
  }
}
```

## Complete Example

### Host Application

```typescript
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { 
  setContext, 
  clearContext, 
  recalculate,
  LightweightChartsAdapter,
  SimpleInputAdapter 
} from '@deepentropy/oakscriptjs';

// Create chart
const chart = createChart(document.getElementById('chart'));
const candlestickSeries = chart.addSeries(CandlestickSeries);

// Load OHLCV data
const ohlcv = await fetchOHLCV('AAPL', '1D');
candlestickSeries.setData(ohlcv.bars);

// Set up adapters
const inputAdapter = new SimpleInputAdapter();
inputAdapter.onInputChange(() => recalculate());

// Initialize context
setContext({
  chart: new LightweightChartsAdapter(chart, candlestickSeries),
  inputs: inputAdapter,
  ohlcv: {
    time: ohlcv.bars.map(b => b.time),
    open: ohlcv.bars.map(b => b.open),
    high: ohlcv.bars.map(b => b.high),
    low: ohlcv.bars.map(b => b.low),
    close: ohlcv.bars.map(b => b.close),
    volume: ohlcv.bars.map(b => b.volume),
  },
  bar_index: ohlcv.bars.length - 1,
});

// Load and run indicator
const indicator = await import('./indicators/rsi.mjs');
indicator.calculate();

// Later, when changing symbol or cleaning up:
// clearContext();
```

### Indicator Module (RSI Example)

```typescript
import { 
  input_int, 
  input_source,
  plot, 
  hline, 
  registerCalculate 
} from '@deepentropy/oakscriptjs';
import { ta } from '@deepentropy/oakscriptjs';

export function calculate() {
  registerCalculate(calculate);
  
  // Inputs
  const length = input_int(14, 'RSI Length', { min: 1, max: 200 });
  const source = input_source('close', 'Source');
  
  // Calculate RSI
  const rsi = ta.rsi(source, length);
  
  // Plot
  plot(rsi, 'RSI', '#2196F3', 2);
  
  // Reference lines
  hline(70, 'Overbought', '#FF5252', 'dashed', 1);
  hline(30, 'Oversold', '#4CAF50', 'dashed', 1);
  hline(50, 'Midline', '#9E9E9E', 'dotted', 1);
}
```

## Best Practices

1. **Always call `registerCalculate` first** in your calculate function to enable proper recalculation.

2. **Use `input_*` functions idempotently** - they will return current values on subsequent calls.

3. **Don't call context-bound APIs at module import time** - indicators should only use the runtime API inside the calculate function.

4. **Clear context when done** - call `clearContext()` when removing an indicator or switching symbols.

5. **Handle missing context gracefully** - input functions return default values when no context is set.
