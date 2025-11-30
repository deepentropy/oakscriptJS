# OakScript Monorepo

**PineScript-compatible technical analysis and transpilation for JavaScript/TypeScript**

This monorepo contains the OakScript ecosystem for running PineScript-like code in JavaScript/TypeScript environments.

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@deepentropy/oakscriptjs`](./packages/oakscriptjs) | Technical analysis library with Series-based API | 0.3.0 |
| [`@deepentropy/oakscript-engine`](./packages/oakscript-engine) | PineScript to TypeScript transpiler | 0.3.0 |

## Quick Start

### Using the Technical Analysis Library

```bash
pnpm add @deepentropy/oakscriptjs
```

```typescript
import { Series, ta, taCore } from '@deepentropy/oakscriptjs';

const bars = [/* OHLCV data */];
const close = new Series(bars, (bar) => bar.close);
const rsi = ta.rsi(close, 14);

console.log(rsi.toArray());
```

### Using the Transpiler CLI

```bash
pnpm add @deepentropy/oakscript-engine

# Transpile PineScript to TypeScript
pine2ts script.pine output.ts
```

## Development

This is a [pnpm workspace](https://pnpm.io/workspaces) monorepo.

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Clean build outputs
pnpm clean
```

### Working with Individual Packages

```bash
# Build only oakscriptjs
pnpm --filter @deepentropy/oakscriptjs build

# Test only oakscript-engine
pnpm --filter @deepentropy/oakscript-engine test

# Run lint in oakscriptjs
pnpm --filter @deepentropy/oakscriptjs lint
```

## Project Structure

```
oakscript/
├── packages/
│   ├── oakscriptjs/           # @deepentropy/oakscriptjs
│   │   ├── src/
│   │   │   ├── ta/            # Technical analysis functions
│   │   │   ├── math/          # Math functions
│   │   │   ├── array/         # Array functions
│   │   │   ├── runtime/       # Series class
│   │   │   └── ...
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── oakscript-engine/      # @deepentropy/oakscript-engine
│       ├── src/
│       │   └── transpiler/    # PineScript parser and code generator
│       ├── bin/
│       │   └── pine2ts.js     # CLI tool
│       ├── examples/
│       └── package.json
│
├── docs/                      # Shared documentation
├── .github/workflows/         # CI/CD pipelines
├── package.json               # Root workspace config
├── pnpm-workspace.yaml        # pnpm workspace config
└── tsconfig.base.json         # Shared TypeScript config
```

## Features

### @deepentropy/oakscriptjs

- **Series Class**: Lazy evaluation with operator chaining
- **Technical Analysis**: Complete TA library (`ta.sma`, `ta.rsi`, `ta.macd`, etc.)
- **Mathematics**: Math functions (`math.abs`, `math.round`, etc.)
- **Array Operations**: PineScript-compatible array functions
- **Type Safety**: Full TypeScript support
- **Babel Plugin**: Native operator support (`close - open`)

### @deepentropy/oakscript-engine

- **Transpiler**: Convert PineScript to TypeScript
- **CLI Tool**: `pine2ts` command for easy transpilation
- **Parser**: Full PineScript v6 syntax support (in progress)
- **Code Generator**: Clean TypeScript output with imports

## Documentation

- [OakScriptJS Guide](./packages/oakscriptjs/README.md)
- [Transpiler CLI](./packages/oakscript-engine/README.md)
- [Function Inventory](./INVENTORY.md)
- [Complete Guide](./GUIDE.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT

---

**Maintained by [DeepEntropy](https://github.com/deepentropy)**
