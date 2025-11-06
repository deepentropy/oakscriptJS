# OakScriptJS

**JavaScript mirror of the PineScript API - with 100% PineScript-like Syntax**

OakScriptJS is a TypeScript/JavaScript library that mirrors PineScript's API, enabling you to write indicators that look exactly like PineScript. Perfect for building trading engines, backtesting systems, or transpiling PineScript with **OakScriptEngine**.

📚 **[Read the Complete Guide →](./GUIDE.md)**

## Three Levels of API

1. **Computational Core**: Pure calculation functions
2. **PineScript DSL**: Declarative indicator syntax
3. **Native Operators**: 100% PineScript-like with `close - open`

## Scope

**This library includes:**
- ✅ Technical Analysis (`ta.*`) - All indicators and calculations
- ✅ Mathematics (`math.*`) - All mathematical operations
- ✅ Arrays (`array.*`) - Array manipulation and operations
- ✅ Matrices (`matrix.*`) - Matrix operations
- ✅ Strings (`str.*`) - String manipulation
- ✅ Time (`time.*`) - Time calculations and conversions
- ✅ Color (`color.*`) - Color data structures and manipulation
- ✅ **Drawing Objects** (`line.*`, `box.*`, `label.*`, `linefill.*`) - Computational features only

**This library does NOT include:**
- ❌ Rendering functions (`plot.*`, `table.*`)
- ❌ UI/Input functions (`input.*`)
- ❌ Strategy execution (`strategy.*`)
- ❌ Data fetching (`request.*`)
- ❌ Alert systems (`alert.*`, `alertcondition.*`)

## Why Include Drawing Objects?

While drawing objects (`line`, `box`, `label`, `linefill`) are primarily visual in TradingView, they have **genuine computational value**:

- **`line.get_price()`** - Calculate trend line prices using linear interpolation for breakout detection
- **`box` getters** - Detect gap fills, range breakouts, and pattern recognition
- **`label` & `linefill`** - Primarily annotations, but useful for algorithmic context

These objects are implemented **without rendering** - focusing purely on their computational aspects.

## Why These Limitations?

The excluded namespaces require external infrastructure (rendering engines, UI frameworks, data feeds, backtesting systems) that are specific to TradingView's platform. OakScriptJS focuses on what can be accurately replicated in pure JavaScript: calculations and data transformations.

## Features

- **Exact API Match**: Function signatures match PineScript exactly
- **Type Safety**: Full TypeScript support with type definitions
- **Performance Optimized**: Efficient implementations for technical analysis
- **Calculation-Focused**: All computational functions from PineScript
- **Well Tested**: Extensive test coverage ensuring accuracy
- **Zero Dependencies**: Lightweight with no external runtime dependencies
- **PineScript DSL**: NEW! Write indicators that look exactly like PineScript

## Priorities

1. **Exact same signature as PineScript API** - Maintains 100% compatibility
2. **Accuracy** - Produces results matching PineScript calculations
3. **Performance** - Optimized for speed and efficiency

## Installation

### JSR (Recommended)

```bash
# npm
npx jsr add @deepentropy/oakscriptjs

# pnpm (10.9+)
pnpm add jsr:@deepentropy/oakscriptjs

# yarn (4.9+)
yarn add jsr:@deepentropy/oakscriptjs

# Deno
deno add jsr:@deepentropy/oakscriptjs

# Bun
bunx jsr add @deepentropy/oakscriptjs
```

### npm (Coming Soon)

```bash
npm install @deepentropy/oakscriptjs
```

## Quick Start

### Option 1: Basic Calculations

```typescript
import { ta } from '@deepentropy/oakscriptjs';

const closes = [100, 102, 101, 103, 105];
const sma = ta.sma(closes, 3);
const rsi = ta.rsi(closes, 14);
```

### Option 2: PineScript-Style Indicators

```typescript
import { indicator, plot, close, ta, color, compile } from '@deepentropy/oakscriptjs';

indicator("My RSI");
const rsi = ta.rsi(close, 14);
plot(rsi, {color: color.purple});

export default compile();
```

### Option 3: Native Operators (100% PineScript-like!)

```typescript
import { indicator, plot, close, open, high, low, compile } from '@deepentropy/oakscriptjs';

indicator("Balance of Power");
const bop = (close - open) / (high - low);  // Native operators!
plot(bop);

export default compile();
```

📚 **[See Complete Examples in the Guide →](./GUIDE.md#examples)**

## Use Cases

- 🎯 **OakScriptEngine Integration** - Transpile PineScript to JavaScript
- 📊 **Custom Trading Engines** - Build backtesting or execution systems
- 📈 **Analysis Tools** - Create technical analysis applications
- 🤖 **Algorithm Development** - Develop trading algorithms
- 📚 **Educational Projects** - Learn technical indicators

## For OakScriptEngine Developers

OakScriptJS is designed to make PineScript transpilation straightforward:

```typescript
// PineScript
indicator("My Indicator")
bop = (close - open) / (high - low)
plot(bop)

// Transpiles to (with Babel plugin)
import { indicator, plot, close, open, high, low, compile } from '@deepentropy/oakscriptjs';
indicator("My Indicator");
const bop = (close - open) / (high - low);
plot(bop);
export default compile();
```

**95-100% similarity to PineScript!**

📚 **[Complete Transpilation Guide →](./GUIDE.md#for-oakscriptengine-developers)**

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

### Drawing Objects ✅

**NEW**: Drawing objects with computational features (no rendering):

#### Line (`line`) - High Computational Value

- **Creation**: `new()` - Create trend lines with coordinates
- **Computation**: `get_price()` - Linear interpolation for breakout detection
- **Getters**: `get_x1()`, `get_y1()`, `get_x2()`, `get_y2()`
- **Setters**: `set_x1()`, `set_y1()`, `set_xy1()`, `set_color()`, `set_style()`, etc.
- **Operations**: `copy()`, `delete()`

#### Box (`box`) - High Computational Value

- **Creation**: `new()` - Create rectangles for ranges
- **Computation**: `get_top()`, `get_bottom()`, `get_left()`, `get_right()` - Gap detection & range analysis
- **Setters**: `set_top()`, `set_bottom()`, `set_bgcolor()`, `set_border_color()`, etc.
- **Operations**: `copy()`, `delete()`

#### Label (`label`) - Annotation

- **Creation**: `new()` - Create labels at coordinates
- **Getters**: `get_x()`, `get_y()`, `get_text()`
- **Setters**: `set_xy()`, `set_text()`, `set_color()`, `set_style()`, etc.
- **Operations**: `copy()`, `delete()`

#### Linefill (`linefill`) - Annotation

- **Creation**: `new()` - Fill between two lines
- **Getters**: `get_line1()`, `get_line2()`
- **Setters**: `set_color()`
- **Operations**: `delete()`

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
- [x] **`line`, `box`, `label`, `linefill`** - Drawing objects (computational features only)

**Improvements:**
- [ ] Performance benchmarks
- [ ] Comprehensive documentation site
- [ ] Additional technical indicators
- [ ] More test coverage

**Explicitly Excluded** (require external infrastructure):
- ❌ `plot`, `table` - Rendering functions
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

## Documentation

- 📚 **[Complete Guide](./GUIDE.md)** - User guide + OakScriptEngine transpilation guide
- 🔌 **[Babel Plugin Guide](./docs/BABEL_PLUGIN_GUIDE.md)** - Native operators setup
- 📊 **[Examples](./examples/indicators/)** - Working indicator examples
- 🎯 **[API Reference](./GUIDE.md#api-reference)** - Complete API documentation

## Acknowledgments

This library is inspired by TradingView's PineScript language. It is not affiliated with or endorsed by TradingView.
