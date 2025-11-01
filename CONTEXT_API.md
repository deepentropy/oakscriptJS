# Context API

The Context API allows you to set implicit chart data once and use it across multiple function calls, matching PineScript's cleaner API style.

## Quick Start

```typescript
import { createContext } from 'oakscriptjs';

// Setup context once with your chart data
const { ta, math, str } = createContext({
  chart: { high, low, close, open, volume }
});

// Now use ta functions without repeating chart data
const [supertrend, direction] = ta.supertrend(3, 10);  // ✅ Clean!
const atr14 = ta.atr(14);                               // ✅ Clean!
const trueRange = ta.tr();                              // ✅ Clean!

// Functions with explicit parameters work as normal
const sma20 = ta.sma(close, 20);
const ema50 = ta.ema(close, 50);
```

## The Problem It Solves

### Without Context (Repetitive)

```typescript
import { ta } from 'oakscriptjs';

// Need to pass high, low, close every time
const [st1, dir1] = ta.supertrend(3, 10, high, low, close);
const [st2, dir2] = ta.supertrend(5, 15, high, low, close);
const atr14 = ta.atr(14, high, low, close);
const trueRange = ta.tr(high, low, close);
```

### With Context (Clean)

```typescript
import { createContext } from 'oakscriptjs';

const { ta } = createContext({ chart: { high, low, close } });

// Chart data is implicit - just like PineScript!
const [st1, dir1] = ta.supertrend(3, 10);
const [st2, dir2] = ta.supertrend(5, 15);
const atr14 = ta.atr(14);
const trueRange = ta.tr();
```

## API Reference

### createContext(config)

Creates a context with implicit data for cleaner function calls.

**Parameters:**
- `config.chart` (optional): Chart data (OHLCV)
  - `high`: High prices array
  - `low`: Low prices array
  - `close`: Close prices array
  - `open`: Open prices array (optional)
  - `volume`: Volume array (optional)
- `config.syminfo` (optional): Symbol information
  - `mintick`: Minimum tick size
  - `ticker`: Ticker symbol (optional)

**Returns:**
- Object with all namespaces (`ta`, `math`, `str`, `color`, `array`)

### Wrapped Functions

Only these 3 functions use implicit chart data:

| Function | Without Context | With Context |
|----------|----------------|--------------|
| **supertrend** | `supertrend(factor, atrPeriod, high, low, close, wicks?)` | `supertrend(factor, atrPeriod, wicks?)` |
| **atr** | `atr(length, high?, low?, close?)` | `atr(length)` |
| **tr** | `tr(high, low, close)` | `tr()` |

All other functions work unchanged - they already have explicit parameters.

## Usage Patterns

### Pattern 1: Full Destructuring (Recommended)

```typescript
const { ta, math, str, color } = createContext({
  chart: { high, low, close, open, volume }
});

// Use all namespaces directly
const [st, dir] = ta.supertrend(3, 10);
const rounded = math.round(value, 2);
const upper = str.upper(text);
```

### Pattern 2: Partial Destructuring

```typescript
const { ta } = createContext({ chart: { high, low, close } });

// Only need ta namespace
const [supertrend, direction] = ta.supertrend(3, 10);
const atr14 = ta.atr(14);
```

### Pattern 3: Multiple Contexts

```typescript
// Different datasets can coexist
const btc = createContext({ chart: btcData });
const eth = createContext({ chart: ethData });

const [btcST, btcDir] = btc.ta.supertrend(3, 10);
const [ethST, ethDir] = eth.ta.supertrend(3, 10);
```

### Pattern 4: No Context (Original API)

```typescript
// Still works - for maximum flexibility
import { ta } from 'oakscriptjs';

const [st, dir] = ta.supertrend(3, 10, high, low, close);
const atr14 = ta.atr(14, high, low, close);
```

## Examples

### Basic Indicator

```typescript
import { createContext } from 'oakscriptjs';

// Your chart data
const high = [10, 11, 12, 13, 14, 15];
const low = [8, 9, 10, 11, 12, 13];
const close = [9, 10, 11, 12, 13, 14];

// Create context
const { ta } = createContext({ chart: { high, low, close } });

// Calculate indicators
const [supertrend, direction] = ta.supertrend(3, 10);
const atr14 = ta.atr(14);
const sma20 = ta.sma(close, 20);

// Use results
console.log('Supertrend:', supertrend);
console.log('Direction:', direction);
console.log('ATR(14):', atr14);
```

### Multiple Timeframes

```typescript
import { createContext } from 'oakscriptjs';

const tf1 = createContext({
  chart: { high: high1m, low: low1m, close: close1m }
});

const tf2 = createContext({
  chart: { high: high5m, low: low5m, close: close5m }
});

// Compare indicators across timeframes
const [st1m, dir1m] = tf1.ta.supertrend(3, 10);
const [st5m, dir5m] = tf2.ta.supertrend(3, 10);

if (dir1m === -1 && dir5m === -1) {
  console.log('Uptrend on both timeframes!');
}
```

### Trading Strategy

```typescript
import { createContext } from 'oakscriptjs';

function checkEntry(high, low, close) {
  const { ta } = createContext({ chart: { high, low, close } });

  const [supertrend, direction] = ta.supertrend(3, 10);
  const atr14 = ta.atr(14);
  const sma50 = ta.sma(close, 50);
  const sma200 = ta.sma(close, 200);

  const currentIdx = close.length - 1;
  const prevIdx = currentIdx - 1;

  // Check for uptrend reversal
  const longSignal =
    direction[currentIdx] === -1 &&     // Currently uptrend
    direction[prevIdx] === 1 &&          // Was downtrend
    close[currentIdx] > sma50[currentIdx] && // Above 50 SMA
    sma50[currentIdx] > sma200[currentIdx];  // 50 above 200

  return {
    signal: longSignal ? 'LONG' : 'WAIT',
    supertrend: supertrend[currentIdx],
    atr: atr14[currentIdx],
    stopLoss: close[currentIdx] - (2 * atr14[currentIdx])
  };
}
```

## Benefits

### 1. Cleaner Code

```typescript
// Before
const [st1, d1] = ta.supertrend(3, 10, high, low, close);
const [st2, d2] = ta.supertrend(5, 15, high, low, close);
const [st3, d3] = ta.supertrend(7, 20, high, low, close);

// After
const { ta } = createContext({ chart: { high, low, close } });
const [st1, d1] = ta.supertrend(3, 10);
const [st2, d2] = ta.supertrend(5, 15);
const [st3, d3] = ta.supertrend(7, 20);
```

### 2. Matches PineScript Style

```pine
// PineScript v6
[supertrend, direction] = ta.supertrend(3, 10)
atr14 = ta.atr(14)
```

```typescript
// OakScriptJS with context
const { ta } = createContext({ chart: { high, low, close } });
const [supertrend, direction] = ta.supertrend(3, 10);
const atr14 = ta.atr(14);
```

### 3. No Global State

Each context is independent - no hidden dependencies or global state issues.

### 4. TypeScript Support

Full type safety and IntelliSense support:

```typescript
import { createContext, ChartData } from 'oakscriptjs';

const chartData: ChartData = { high, low, close };
const { ta } = createContext({ chart: chartData });

// TypeScript knows the exact signatures
const [supertrend, direction] = ta.supertrend(3, 10);
//    ^series_float  ^series_int
```

### 5. Flexible

Mix and match - use context for convenience, explicit parameters for flexibility:

```typescript
const { ta } = createContext({ chart: chart1 });

// Use implicit data
const [st1] = ta.supertrend(3, 10);

// Or use explicit data
const [st2] = ta.supertrend(3, 10, chart2.high, chart2.low, chart2.close);
```

## Error Handling

Context-wrapped functions throw clear errors when required data is missing:

```typescript
const { ta } = createContext({});  // No chart data

try {
  ta.supertrend(3, 10);
} catch (error) {
  console.error(error.message);
  // "Chart context required for ta.supertrend().
  //  Call createContext({ chart: { high, low, close } }) first."
}
```

## Design Principles

1. **No Global State**: Each context is independent
2. **Minimal Wrapping**: Only 3 functions need wrapping
3. **Backward Compatible**: Original API still works
4. **Type Safe**: Full TypeScript support
5. **Explicit Errors**: Clear messages when context is missing
6. **PineScript-like**: Matches PineScript's API style

## Future Extensions

The context API is designed to be extensible:

```typescript
// Future possibilities
const { ta, math, plot } = createContext({
  chart: { high, low, close },
  syminfo: { mintick: 0.01, ticker: 'AAPL' },
  plot: { renderer: myRenderer }
});

// Could use implicit mintick
math.round_to_mintick(123.456);

// Could use implicit renderer
plot.plot(series);
```

## Comparison with Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Context API (this)** | ✅ Clean syntax<br>✅ No global state<br>✅ Multiple contexts | ⚠️ Need destructuring |
| **Global State** | ✅ No destructuring | ❌ Global state<br>❌ Testing issues<br>❌ Only one context |
| **Explicit Parameters** | ✅ Maximum flexibility | ❌ Verbose<br>❌ Repetitive |

## See Also

- [PINESCRIPT_V6_INVENTORY.md](./PINESCRIPT_V6_INVENTORY.md) - Full API coverage
- [src/context.ts](./src/context.ts) - Implementation details
- [tests/context.test.ts](./tests/context.test.ts) - Usage examples
