<p align="center">
  <img src="./logo.png" alt="OakScriptJS Logo" width="150">
</p>

<h1 align="center">OakScriptJS</h1>

OakScriptJS is a TypeScript/JavaScript library that provides PineScript v6 compatible technical analysis functions. Build trading indicators, run backtests, or integrate TA calculations into any JavaScript environment.

## Quick Start

### Install

```bash
npm install oakscriptjs
```

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
// run.result.plots / markers / bgcolors, run.inputConfig, run.plotConfig, ...
```

For stateful logic PineScript writes with `var`/`:=`/loops, use `eachBar` (values are plain numbers, so native JS operators work):

```typescript
import { eachBar, close } from 'oakscriptjs/script';

let dir = 0;                              // var dir = 0
const trend = eachBar((c) => {
  if (c.close > c.get(close, 1)) dir = 1; // dir := 1
  else if (c.close < c.get(close, 1)) dir = -1;
  return dir;
});
```

## Documentation

- [Guide](./docs/guide.md) — Getting started, Series, script API, Tier 1 outputs, eachBar
- [Function Inventory](./docs/inventory.md) — All available functions and coverage
