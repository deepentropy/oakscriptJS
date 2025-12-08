<p align="center">
  <img src="./logo.png" alt="OakScriptJS Logo" width="150">
</p>

<h1 align="center">OakScriptJS</h1>

**Live Demo**: [deepentropy.github.io/oakscriptJS](https://deepentropy.github.io/oakscriptJS/)

OakScriptJS is a TypeScript/JavaScript library that provides PineScript v6 compatible technical analysis functions. Build trading indicators, run backtests, or integrate TA calculations into any JavaScript environment.

## Packages

| Package                               | Description                                      |
|---------------------------------------|--------------------------------------------------|
| [oakscriptjs](./packages/oakscriptjs) | Technical analysis library with Series-based API |
| [@oakscript/indicators](./packages/indicators) | Pre-built technical indicators (SMA, EMA, RSI, MACD, BB, etc.) |

## Quick Start

### Install the library

```bash
npm install oakscriptjs
```

### Calculate an indicator

```typescript
import {Series, ta} from 'oakscriptjs';

const prices = [44, 44.5, 45, 45.5, 46, 46.5, 47, 47.5, 48, 48.5];
const close = new Series(prices);
const sma = ta.sma(close, 5);

console.log(sma.toArray());
```

### Use pre-built indicators

```typescript
import { SMA, RSI, MACD } from '@oakscript/indicators';

const bars = [...]; // OHLCV data
const smaResult = SMA.calculate(bars, { len: 20 });
const rsiResult = RSI.calculate(bars, { length: 14 });
```

## Documentation

- [Guide](./docs/guide.md) — Getting started and core concepts
- [Function Inventory](./docs/inventory.md) — All available TA functions
- [Official Examples](./docs/official/) — PineScript and JavaScript indicator examples

## Development

This is a [pnpm workspace](https://pnpm.io/workspaces) monorepo.

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

```bash
pnpm install    # Install dependencies
pnpm build      # Build all packages
pnpm test       # Run tests
pnpm typecheck  # Type check
```

### Working with packages

```bash
pnpm --filter oakscriptjs build
pnpm --filter @oakscript/indicators test
```

## Project Structure

```
oakscriptJS/
├── packages/
│   ├── oakscriptjs/      # Technical analysis library
│   └── indicators/       # Pre-built indicators package
├── example/              # Live demo (GitHub Pages)
└── docs/                 # Documentation + official examples
```

---

Maintained by [DeepEntropy](https://github.com/deepentropy)
