# OakScriptJS

**JavaScript mirror of the PineScript API with exact same signatures**

OakScriptJS is a TypeScript/JavaScript library that provides a complete implementation of the PineScript API, maintaining exact function signatures and behavior. This allows you to write trading indicators and strategies in JavaScript/TypeScript using the familiar PineScript syntax.

## Features

- **Exact API Match**: Function signatures match PineScript exactly
- **Type Safety**: Full TypeScript support with type definitions
- **Performance Optimized**: Efficient implementations for technical analysis
- **Comprehensive**: Covers all major PineScript namespaces
- **Well Tested**: Extensive test coverage ensuring accuracy
- **Zero Dependencies**: Lightweight with no external runtime dependencies

## Priorities

1. **Exact same signature as PineScript API** - Maintains 100% compatibility
2. **Accuracy** - Produces results matching PineScript calculations
3. **Performance** - Optimized for speed and efficiency

## Installation

```bash
npm install oakscriptjs
```

or

```bash
yarn add oakscriptjs
```

## Quick Start

```typescript
import { ta, math } from 'oakscriptjs';

// Calculate Simple Moving Average
const prices = [10, 12, 11, 13, 15, 14, 16, 18, 17, 19];
const sma20 = ta.sma(prices, 5);

// Calculate RSI
const rsi = ta.rsi(prices, 14);

// Calculate MACD
const [macdLine, signalLine, histogram] = ta.macd(prices, 12, 26, 9);

// Use math functions
const max = math.max(10, 20, 30); // 30
const avg = math.avg(10, 20, 30); // 20
```

## Supported Namespaces

### Technical Analysis (`ta`)

Complete implementation of PineScript's technical analysis functions:

- **Moving Averages**: `sma()`, `ema()`, `wma()`, `vwma()`, etc.
- **Oscillators**: `rsi()`, `stoch()`, `cci()`, `macd()`, etc.
- **Volatility**: `bb()`, `atr()`, `stdev()`, etc.
- **Crossovers**: `crossover()`, `crossunder()`, `cross()`
- **Other**: `change()`, `tr()`, and many more

### Math (`math`)

Mathematical functions and operations:

- **Basic**: `abs()`, `ceil()`, `floor()`, `round()`
- **Min/Max**: `min()`, `max()`, `avg()`
- **Powers**: `sqrt()`, `pow()`, `exp()`, `log()`
- **Trigonometry**: `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`
- **Utilities**: `sum()`, `sign()`, `random()`

### Array (`array`)

Array manipulation functions:

- **Creation**: `new_array()`, `from()`
- **Access**: `get()`, `set()`, `size()`
- **Modification**: `push()`, `pop()`, `shift()`, `unshift()`, `insert()`, `remove()`
- **Analysis**: `sum()`, `avg()`, `min()`, `max()`, `median()`, `stdev()`
- **Operations**: `sort()`, `reverse()`, `slice()`, `concat()`

### String (`str`)

String manipulation functions:

- **Conversion**: `tostring()`, `tonumber()`
- **Manipulation**: `substring()`, `split()`, `concat()`, `replace()`
- **Case**: `upper()`, `lower()`
- **Search**: `contains()`, `pos()`, `startswith()`, `endswith()`
- **Formatting**: `format()`, `trim()`

### Color (`color`)

Color creation and manipulation:

- **Creation**: `rgb()`, `from_hex()`, `new_color()`
- **Components**: `r()`, `g()`, `b()`, `t()`
- **Predefined Colors**: `red`, `green`, `blue`, `yellow`, etc.

## API Documentation

### ta.sma(source, length)

Simple Moving Average

```typescript
ta.sma(source: series_float, length: simple_int): series_float
```

**Parameters:**
- `source` - Source series (e.g., close prices)
- `length` - Number of bars to average

**Returns:** Series of SMA values

### ta.ema(source, length)

Exponential Moving Average

```typescript
ta.ema(source: series_float, length: simple_int): series_float
```

### ta.rsi(source, length)

Relative Strength Index

```typescript
ta.rsi(source: series_float, length: simple_int): series_float
```

### ta.macd(source, fastLength, slowLength, signalLength)

Moving Average Convergence Divergence

```typescript
ta.macd(
  source: series_float,
  fastLength: simple_int,
  slowLength: simple_int,
  signalLength: simple_int
): [series_float, series_float, series_float]
```

**Returns:** `[macdLine, signalLine, histogram]`

### ta.bb(source, length, mult)

Bollinger Bands

```typescript
ta.bb(
  source: series_float,
  length: simple_int,
  mult: simple_float
): [series_float, series_float, series_float]
```

**Returns:** `[basis, upper, lower]`

## Examples

See the `/examples` directory for complete examples:

- `basic-indicators.ts` - Basic indicator calculations
- `strategy-example.ts` - Trading strategy implementation
- `custom-indicator.ts` - Building custom indicators

## Type System

OakScriptJS uses TypeScript types that mirror PineScript's type system:

```typescript
type int = number;
type float = number;
type bool = boolean;
type series<T> = T[];
type series_float = series<float>;
type series_bool = series<bool>;
```

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Format

```bash
npm run format
npm run format:check
```

## Project Structure

```
oakscriptjs/
├── src/
│   ├── ta/          # Technical analysis functions
│   ├── math/        # Mathematical functions
│   ├── array/       # Array operations
│   ├── str/         # String operations
│   ├── color/       # Color functions
│   ├── types/       # Type definitions
│   ├── utils/       # Internal utilities
│   └── index.ts     # Main entry point
├── tests/           # Test files
├── examples/        # Usage examples
└── dist/           # Built output
```

## Roadmap

- [ ] Complete `matrix` namespace
- [ ] Complete `table` namespace
- [ ] Complete `time` namespace
- [ ] Complete `request` namespace
- [ ] Complete `plot` namespace
- [ ] Complete `input` namespace
- [ ] Complete `strategy` namespace
- [ ] Add chart data structures
- [ ] Performance benchmarks
- [ ] Comprehensive documentation site

## Contributing

Contributions are welcome! Please ensure:

1. Maintain exact PineScript API signatures
2. Add tests for new functionality
3. Follow the existing code style
4. Update documentation

## License

MIT

## Acknowledgments

This library is inspired by TradingView's PineScript language. It is not affiliated with or endorsed by TradingView.
