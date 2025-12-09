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

### Calculate an indicator

```typescript
import { Series, ta } from 'oakscriptjs';

const prices = [44, 44.5, 45, 45.5, 46, 46.5, 47, 47.5, 48, 48.5];
const close = new Series(prices);
const sma = ta.sma(close, 5);

console.log(sma.toArray());
```

## Documentation

- [Guide](./docs/guide.md) — Getting started and core concepts
- [Function Inventory](./docs/inventory.md) — All available TA functions

## Development

### Prerequisites

- Node.js >= 18.0.0

### Setup

```bash
npm install     # Install dependencies
npm run build   # Build
npm test        # Run tests
npm run typecheck  # Type check
```

## Project Structure

```
oakscriptJS/
├── src/        # Source code
├── tests/      # Test suite
├── dist/       # Build output
└── docs/       # Documentation
```

---

Maintained by [DeepEntropy](https://github.com/deepentropy)
