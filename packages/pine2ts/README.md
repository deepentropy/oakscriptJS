# @deepentropy/oakscript-engine

**PineScript to TypeScript Transpiler**

Transform PineScript v6 code into TypeScript that runs with `oakscriptjs`.

## Installation

```bash
pnpm add @deepentropy/oakscript-engine
```

## CLI Usage

The `pine2ts` command transpiles PineScript files to TypeScript:

```bash
# Transpile and output to stdout
pine2ts script.pine

# Transpile and save to file
pine2ts script.pine output.ts

# Show help
pine2ts --help

# Show version
pine2ts --version
```

## Programmatic Usage

```typescript
import { transpile } from '@deepentropy/oakscript-engine';

const pineScript = `
indicator("My RSI")
rsi_value = ta.rsi(close, 14)
plot(rsi_value)
`;

const typescript = transpile(pineScript);
console.log(typescript);
```

### Output Example

The transpiler converts PineScript to TypeScript functions:

**Input (PineScript):**
```pinescript
indicator("RSI Indicator")
rsi_val = ta.rsi(close, 14)
plot(rsi_val)
```

**Output (TypeScript):**
```typescript
import {Series, ta, taCore, math, array, type IndicatorResult} from 'oakscriptjs';

export function RSI_Indicator(bars: any[]): IndicatorResult {
  // OHLCV Series
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume);

  const rsi_val = ta.rsi(close, 14);

  return {
    metadata: { title: "RSI Indicator", overlay: false },
    plots: [{ data: rsi_val.toArray().map((v, i) => ({ time: bars[i].time, value: v })) }],
  };
}
```

## API Reference

### `transpile(source: string, options?: TranspileOptions): string`

Transpile PineScript source code to TypeScript.

**Parameters:**
- `source` - PineScript source code
- `options` - Optional transpile options

**Options:**
```typescript
interface TranspileOptions {
  filename?: string;        // Source filename for error messages
  sourcemap?: boolean;      // Generate sourcemap
  format?: 'function' | 'class';  // Output format
  includeImports?: boolean; // Include import statements
}
```

### `transpileWithResult(source: string, options?: TranspileOptions): TranspileResult`

Transpile with detailed result including errors and warnings.

```typescript
interface TranspileResult {
  code: string;
  sourcemap?: string;
  errors: TranspileError[];
  warnings: TranspileWarning[];
}
```

### `PineParser`

Low-level parser for PineScript syntax.

```typescript
import { PineParser } from '@deepentropy/oakscript-engine';

const parser = new PineParser();
const { ast, errors } = parser.parse(pineSource);
```

## Supported PineScript Features

### Currently Supported
- ✅ `indicator()` declaration
- ✅ Variable assignments
- ✅ Binary operators (`+`, `-`, `*`, `/`, `>`, `<`, `>=`, `<=`, `==`, `!=`)
- ✅ Unary operators (`-`, `!`, `+`)
- ✅ Function calls (`ta.*`, `math.*`)
- ✅ `plot()` function
- ✅ Comments (`//`)
- ✅ Built-in series (`open`, `high`, `low`, `close`, `volume`)

### Planned Features
- [ ] `if`/`else` conditionals
- [ ] `for` loops
- [ ] `while` loops
- [ ] `switch` statements
- [ ] User-defined functions
- [ ] Type annotations
- [ ] Multi-line strings
- [ ] Array operations
- [ ] Tuple unpacking

## Related Packages

- [`oakscriptjs`](../oakscriptjs) - Runtime library for technical analysis

## License

MIT
