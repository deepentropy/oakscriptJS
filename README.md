<p align="center">
  <img src="./logo.png" alt="OakScriptJS Logo" width="150">
</p>

<h1 align="center">OakScriptJS</h1>

PineScript-compatible technical analysis for JavaScript/TypeScript.

OakScriptJS lets you run TradingView-style indicators in any JavaScript environment — browsers, Node.js, or your trading bot.

## Packages

| Package | Description |
|---------|-------------|
| [@deepentropy/oakscriptjs](./packages/oakscriptjs) | Technical analysis library with Series-based API |
| [@deepentropy/pine2ts](./packages/pine2ts) | PineScript to TypeScript transpiler |
| [@deepentropy/indicators](./indicators) | Ready-to-use indicators (SMA, RSI, MACD, etc.) |

## Quick Start

### Install the library

```bash
npm install @deepentropy/oakscriptjs
```

### Calculate an indicator

```typescript
import { Series, ta } from '@deepentropy/oakscriptjs';

const prices = [44, 44.5, 45, 45.5, 46, 46.5, 47, 47.5, 48, 48.5];
const close = new Series(prices);
const sma = ta.sma(close, 5);

console.log(sma.toArray());
```

### Transpile PineScript to TypeScript

```bash
npm install -g @deepentropy/pine2ts

pine2ts my-indicator.pine output.ts
```

## Live Demo

See the indicators in action: **[deepentropy.github.io/oakscriptJS](https://deepentropy.github.io/oakscriptJS/)**

## Documentation

- [Guide](./docs/guide.md) — Getting started and core concepts
- [Function Inventory](./docs/inventory.md) — All available TA functions
- [Indicator Implementation](./docs/indicator-implementation.md) — How to create indicators
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
pnpm --filter @deepentropy/oakscriptjs build
pnpm --filter @deepentropy/pine2ts test
```

## Project Structure

```
oakscriptJS/
├── packages/
│   ├── oakscriptjs/      # Technical analysis library
│   └── pine2ts/          # PineScript transpiler + CLI
├── indicators/           # Official converted indicators
├── example/              # Live demo (GitHub Pages)
└── docs/                 # Documentation + official examples
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit and push
6. Open a Pull Request

## License

MIT

---

Maintained by [DeepEntropy](https://github.com/deepentropy)
