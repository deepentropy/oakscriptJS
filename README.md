# OakScriptJS

**JavaScript mirror of the PineScript API - Calculation & Indicator Functions**

OakScriptJS is a TypeScript/JavaScript library that mirrors PineScript's calculation and indicator API, maintaining exact function signatures and behavior. This library focuses on the computational core of PineScript - technical analysis, mathematics, and data manipulation - making it perfect for building custom trading engines, backtesting systems, or analysis tools in JavaScript/TypeScript.

## Scope

**This library includes:**
- ✅ Technical Analysis (`ta.*`) - All indicators and calculations
- ✅ Mathematics (`math.*`) - All mathematical operations
- ✅ Arrays (`array.*`) - Array manipulation and operations
- ✅ Matrices (`matrix.*`) - Matrix operations
- ✅ Strings (`str.*`) - String manipulation
- ✅ Time (`time.*`) - Time calculations and conversions
- ✅ Color (`color.*`) - Color data structures and manipulation

**This library does NOT include:**
- ❌ Rendering functions (`plot.*`, `line.*`, `label.*`, `box.*`, `table.*`)
- ❌ UI/Input functions (`input.*`)
- ❌ Strategy execution (`strategy.*`)
- ❌ Data fetching (`request.*`)
- ❌ Alert systems (`alert.*`, `alertcondition.*`)

## Why These Limitations?

These excluded namespaces require external infrastructure (rendering engines, UI frameworks, data feeds, backtesting systems) that are specific to TradingView's platform. OakScriptJS focuses on what can be accurately replicated in pure JavaScript: calculations and data transformations.

**📖 For detailed information about scope and limitations, see [SCOPE.md](SCOPE.md)**

## Features

- **Exact API Match**: Function signatures match PineScript exactly
- **Type Safety**: Full TypeScript support with type definitions
- **Performance Optimized**: Efficient implementations for technical analysis
- **Calculation-Focused**: All computational functions from PineScript
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

## Use Cases

OakScriptJS is perfect for:
- **Custom Trading Engines** - Build your own backtesting or execution system
- **Analysis Tools** - Create technical analysis applications
- **Data Processing** - Calculate indicators on market data
- **Algorithm Development** - Develop and test trading algorithms
- **Educational Projects** - Learn about technical indicators

## Supported Namespaces

### Technical Analysis (`ta`) ✅

Complete implementation of PineScript's technical analysis functions:

- **Moving Averages**: `sma()`, `ema()`, `wma()`, `vwma()`, `swma()`, etc.
- **Oscillators**: `rsi()`, `stoch()`, `cci()`, `macd()`, `mfi()`, etc.
- **Volatility**: `bb()`, `atr()`, `stdev()`, `variance()`, etc.
- **Momentum**: `mom()`, `roc()`, `percentrank()`, etc.
- **Regression**: `linreg()`, `correlation()`, etc.
- **Crossovers**: `crossover()`, `crossunder()`, `cross()`
- **Other**: `change()`, `tr()`, `supertrend()`, and many more

### Math (`math`) ✅

Mathematical functions and operations:

- **Basic**: `abs()`, `ceil()`, `floor()`, `round()`
- **Min/Max**: `min()`, `max()`, `avg()`
- **Powers**: `sqrt()`, `pow()`, `exp()`, `log()`, `log10()`
- **Trigonometry**: `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`, `atan2()`
- **Utilities**: `sum()`, `sign()`, `random()`, `todegrees()`, `toradians()`

### Array (`array`) ✅

Array manipulation functions:

- **Creation**: `new_array()`, `from()`
- **Access**: `get()`, `set()`, `size()`
- **Modification**: `push()`, `pop()`, `shift()`, `unshift()`, `insert()`, `remove()`
- **Analysis**: `sum()`, `avg()`, `min()`, `max()`, `median()`, `stdev()`, `variance()`
- **Operations**: `sort()`, `reverse()`, `slice()`, `concat()`, `includes()`, `indexof()`

### Matrix (`matrix`) ✅

Matrix operations for advanced calculations:

- **Creation**: `new()`, `copy()`
- **Operations**: `mult()`, `add()`, `transpose()`
- **Access**: `get()`, `set()`, `row()`, `col()`

### String (`str`) ✅

String manipulation functions:

- **Conversion**: `tostring()`, `tonumber()`
- **Manipulation**: `substring()`, `split()`, `concat()`, `replace()`
- **Case**: `upper()`, `lower()`
- **Search**: `contains()`, `pos()`, `startswith()`, `endswith()`
- **Formatting**: `format()`, `trim()`

### Time (`time`) ✅

Time calculations and conversions:

- **Conversions**: Convert between timestamps and time components
- **Calculations**: Work with timeframes and time-based logic

### Color (`color`) ✅

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

**Included Namespaces:**
- [ ] Complete `matrix` namespace implementation
- [ ] Complete `time` namespace implementation
- [x] `ta` namespace - Core indicators implemented
- [x] `math` namespace - Complete
- [x] `array` namespace - Complete
- [x] `str` namespace - Complete
- [x] `color` namespace - Complete

**Improvements:**
- [ ] Performance benchmarks
- [ ] Comprehensive documentation site
- [ ] Additional technical indicators
- [ ] More test coverage

**Explicitly Excluded** (require external infrastructure):
- ❌ `plot`, `line`, `label`, `box`, `table` - Rendering functions
- ❌ `input` - UI controls
- ❌ `strategy` - Strategy execution engine
- ❌ `request` - Data fetching
- ❌ `alert`, `alertcondition` - Alert system

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
