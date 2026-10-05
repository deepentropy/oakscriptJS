<p align="center">
  <img src="./logo.png" alt="OakScriptJS Logo" width="150">
</p>

<h1 align="center">OakScriptJS</h1>

OakScriptJS is a TypeScript/JavaScript library that provides PineScript v6 compatible technical analysis functions. Build trading indicators, write strategy logic for a backtesting engine of your choice (OakScriptJS does not fill orders), or integrate TA calculations into any JavaScript environment.

## Quick Start

### Install

```bash
npm install oakscriptjs
```

### Which API to use

| Need | API | Import |
|------|-----|--------|
| Write an indicator or a strategy the PineScript way | Script API | `oakscriptjs/script` |
| Compute an indicator on plain number arrays | Array API (`taCore`, `math`, `array`...) | `oakscriptjs` |
| Chain calculations on bar data in your own code | Series API (`Series`, `ta`) | `oakscriptjs` |

ES modules and CommonJS, with TypeScript types. Node.js 18+, browsers and web workers. No runtime dependencies.

### Calculate an indicator (array API)

```typescript
import { taCore } from 'oakscriptjs';

const closes = [44, 44.5, 45, 45.5, 46, 46.5, 47, 47.5, 48, 48.5];
const sma = taCore.sma(closes, 5);

console.log(sma); // number[]
```

### Write an indicator (script API)

The `oakscriptjs/script` entry reads like PineScript: one statement per fact.

```typescript
import { executeScript, indicator, input, plot, plotshape, bgcolor, ta, color, close } from 'oakscriptjs/script';
import type { Bar } from 'oakscriptjs';

// time: UNIX seconds (the lightweight-charts unit); oldest bar first
const bars: Bar[] = [
  { time: 1704067200, open: 100, high: 105, low: 99, close: 103, volume: 1200 },
  { time: 1704153600, open: 103, high: 107, low: 102, close: 106, volume: 1500 },
  // ...
];

function body() {
  indicator('SMA cross', { overlay: true });
  const fast = ta.sma(close, input.int(10, 'Fast'));
  const slow = ta.sma(close, input.int(30, 'Slow'));
  plot(fast, 'Fast', { color: color.blue });
  plot(slow, 'Slow', { color: color.orange });
  plotshape(ta.crossover(fast, slow), 'Cross up', { style: 'triangleup', location: 'belowbar', color: color.green });
  bgcolor(color.when(fast.gt(slow), color.new(color.green, 90)));
}

// The host runs the body over bars and collects everything it declared.
const run = executeScript(body, bars);
// run.result.plots / markers / bgColors / labels / lines / tables, run.inputConfig, run.plotConfig, ...
```

For stateful logic PineScript writes with `var`/`:=`/loops, use `eachBar` inside the script body. The values are plain numbers, so JS operators and `if`/`for` work. For PineScript comparison rules (1e-10 tolerance, `na` compares false), use `compare.gt(a, b)`, `compare.eq(a, b)`... from `oakscriptjs`.

```typescript
import { executeScript, indicator, plot, eachBar, close } from 'oakscriptjs/script';

executeScript(() => {
  indicator('Trend');
  let dir = 0;                              // var dir = 0
  const trend = eachBar((c) => {
    if (c.close > c.get(close, 1)) dir = 1; // dir := 1
    else if (c.close < c.get(close, 1)) dir = -1;
    return dir;
  });
  plot(trend, 'Trend');
}, bars);
```

## Documentation

- [Guide](./docs/guide.md) — Getting started, Series, script API, Tier 1 outputs, eachBar
- [Function Inventory](./docs/inventory.md) — All available functions and coverage
