# Babel Plugin: PineScript Operators

This Babel plugin transforms PineScript-style operators into Series method calls, enabling natural mathematical syntax in transpiled indicators.

## Problem

JavaScript doesn't support operator overloading, so Series objects can't use native operators:

```typescript
// ❌ Doesn't work - JavaScript limitation
const bop = (close - open) / (high - low);
```

Without this plugin, you must use method calls:

```typescript
// ✅ Works but verbose
const bop = close.sub(open).div(high.sub(low));
```

## Solution

This plugin transforms operators at build time:

```typescript
// Write this (looks like PineScript!)
const bop = (close - open) / (high - low);

// Babel transforms to this (what actually runs)
const bop = close.sub(open).div(high.sub(low));
```

## Installation

### For OakScriptEngine

1. **Install dependencies** (if not already installed):
```bash
npm install --save-dev @babel/core @babel/cli
```

2. **Copy the plugin** to your project or install OakScriptJS with the plugin included.

3. **Configure Babel** in your `babel.config.js`:
```javascript
module.exports = {
  presets: [
    '@babel/preset-typescript'
  ],
  plugins: [
    './node_modules/@deepentropy/oakscriptjs/babel-plugin/pinescript-operators.cjs'
  ]
};
```

4. **Add build script** to `package.json`:
```json
{
  "scripts": {
    "build": "babel src --out-dir dist --extensions '.ts,.tsx'"
  }
}
```

### For Manual Usage

If you're using this plugin directly:

```bash
npm install --save-dev @babel/core @babel/cli
```

```javascript
// babel.config.js
module.exports = {
  plugins: [
    './path/to/pinescript-operators.cjs'
  ]
};
```

## Supported Transformations

### Arithmetic Operators

| Operator | Method | Example |
|----------|--------|---------|
| `+` | `.add()` | `close + 10` → `close.add(10)` |
| `-` | `.sub()` | `close - open` → `close.sub(open)` |
| `*` | `.mul()` | `close * 2` → `close.mul(2)` |
| `/` | `.div()` | `close / high` → `close.div(high)` |
| `%` | `.mod()` | `close % 10` → `close.mod(10)` |

### Comparison Operators

| Operator | Method | Example |
|----------|--------|---------|
| `>` | `.gt()` | `close > open` → `close.gt(open)` |
| `<` | `.lt()` | `close < open` → `close.lt(open)` |
| `>=` | `.gte()` | `close >= 50` → `close.gte(50)` |
| `<=` | `.lte()` | `close <= 50` → `close.lte(50)` |
| `==` | `.eq()` | `close == open` → `close.eq(open)` |
| `!=` | `.neq()` | `close != open` → `close.neq(open)` |

### Logical Operators

| Operator | Method | Example |
|----------|--------|---------|
| `&&` | `.and()` | `a && b` → `a.and(b)` |
| `||` | `.or()` | `a || b` → `a.or(b)` |
| `!` | `.not()` | `!condition` → `condition.not()` |

### Unary Operators

| Operator | Method | Example |
|----------|--------|---------|
| `-` | `.neg()` | `-close` → `close.neg()` |

## Complete Examples

### Example 1: Balance of Power

**Input** (what you write):
```typescript
import { indicator, plot, close, open, high, low, color, compile } from '@deepentropy/oakscriptjs';

indicator("Balance of Power");

const range = high - low;
const change = close - open;
const bop = change / range;

plot(bop, {color: color.red});

export default compile();
```

**Output** (after Babel transformation):
```typescript
import { indicator, plot, close, open, high, low, color, compile } from '@deepentropy/oakscriptjs';

indicator("Balance of Power");

const range = high.sub(low);
const change = close.sub(open);
const bop = change.div(range);

plot(bop, {color: color.red});

export default compile();
```

### Example 2: RSI with Conditions

**Input**:
```typescript
import { indicator, plot, close, ta, color, compile } from '@deepentropy/oakscriptjs';

indicator("RSI Signals");

const rsi = ta.rsi(close, 14);
const overbought = rsi > 70;
const oversold = rsi < 30;
const signal = overbought || oversold;

plot(rsi, {color: color.purple});

export default compile();
```

**Output**:
```typescript
import { indicator, plot, close, ta, color, compile } from '@deepentropy/oakscriptjs';

indicator("RSI Signals");

const rsi = ta.rsi(close, 14);
const overbought = rsi.gt(70);
const oversold = rsi.lt(30);
const signal = overbought.or(oversold);

plot(rsi, {color: color.purple});

export default compile();
```

### Example 3: Complex Expression

**Input**:
```typescript
const ema9 = ta.ema(close, 9);
const ema21 = ta.ema(close, 21);
const bullish = (ema9 > ema21) && (close > ema9);
const momentum = (close - open) / close * 100;
```

**Output**:
```typescript
const ema9 = ta.ema(close, 9);
const ema21 = ta.ema(close, 21);
const bullish = ema9.gt(ema21).and(close.gt(ema9));
const momentum = close.sub(open).div(close).mul(100);
```

## How It Works

The plugin uses **static analysis** to detect Series expressions:

1. **Identifies Series**: Recognizes built-in series (`close`, `open`, etc.) and variables assigned from Series
2. **Transforms operators**: Converts operators to method calls
3. **Preserves non-Series**: Regular numbers and strings are not transformed

### Detection Logic

The plugin identifies Series by:
- Built-in identifiers: `close`, `open`, `high`, `low`, `volume`, `hl2`, `hlc3`, `ohlc4`, `bar_index`
- Function calls: `ta.*()` functions return Series
- Method calls: `.add()`, `.sub()`, etc. return Series
- Variable assignment: Variables assigned from Series are tracked

## Edge Cases

### Mixed Operations

```typescript
// Series with number - works!
const adjusted = close + 10;  // → close.add(10)

// Series with Series - works!
const spread = high - low;    // → high.sub(low)

// Number with number - preserved!
const threshold = 50 + 20;    // → 50 + 20 (not transformed)
```

### Nested Expressions

```typescript
// Complex nested expressions work
const value = ((close - open) / (high - low)) * 100;

// Transforms to:
const value = close.sub(open).div(high.sub(low)).mul(100);
```

### Array Access (Not Supported Yet)

```typescript
// PineScript style: close[1]
// Currently use: close.offset(1)

// Future enhancement may support:
// close[1] → close.offset(1)
```

## TypeScript Support

The plugin works seamlessly with TypeScript:

```typescript
import { Series, close, open } from '@deepentropy/oakscriptjs';

// Type inference works correctly
const bop: Series = (close - open) / (high - low);
//    ^^^^^^ TypeScript knows this is a Series
```

## Performance

- **Zero runtime overhead**: Transformation happens at build time
- **Same as method calls**: Generated code is identical to writing `.sub()` manually
- **Tree-shakeable**: Unused operators don't add to bundle size

## Debugging

### See transformed code

Run Babel with source maps:
```bash
babel src --out-dir dist --source-maps
```

### Verify transformation

Add `--no-comments` to see clean output:
```bash
babel src/indicator.ts --no-comments
```

### Common Issues

**Issue**: Operators not transformed
```typescript
// ❌ Plugin doesn't recognize 'price' as Series
const price = getData();
const result = price + 10;  // Not transformed
```

**Solution**: Use explicit type or Series constructor
```typescript
// ✅ Tell the plugin it's a Series
const price = ta.sma(close, 20);  // Recognized!
const result = price + 10;        // Transformed!
```

## Integration with OakScriptEngine

### Transpilation Flow

```
PineScript Source
    ↓
OakScriptEngine Parser
    ↓
TypeScript with Operators (close - open)
    ↓
Babel + This Plugin
    ↓
TypeScript with Method Calls (close.sub(open))
    ↓
TypeScript Compiler
    ↓
JavaScript Output
```

### Recommended Setup

```javascript
// OakScriptEngine's transpiler.js
const babel = require('@babel/core');

function transpileIndicator(pinescriptCode) {
  // Step 1: Parse PineScript to TypeScript AST
  const tsCode = parsePineScriptToTypeScript(pinescriptCode);

  // Step 2: Transform operators with Babel
  const result = babel.transformSync(tsCode, {
    plugins: [
      require('@deepentropy/oakscriptjs/babel-plugin/pinescript-operators.cjs')
    ],
    filename: 'indicator.ts'
  });

  return result.code;
}
```

## Limitations

1. **Array indexing**: `close[1]` not yet supported (use `close.offset(1)`)
2. **Ternary operators**: `a ? b : c` not supported (use separate if/else)
3. **Assignment operators**: `+=`, `-=` not supported (use `a = a + b`)

These may be added in future versions.

## Contributing

To improve the plugin:

1. **Add new operators**: Update `OPERATOR_TO_METHOD` map
2. **Improve detection**: Enhance `isSeries()` logic
3. **Add tests**: Create test cases in `__tests__` directory

## License

MIT - Same as OakScriptJS

## See Also

- [OakScriptJS Documentation](../../README.md)
- [PineScript DSL Guide](../../docs/proposals/pinescript-dsl-proposal.md)
- [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook)
