# pine2ts CLI

The `pine2ts` command-line tool transpiles PineScript v6 code to TypeScript.

## Installation

```bash
# Install globally
pnpm add -g @deepentropy/oakscript-engine

# Or use via npx
npx @deepentropy/oakscript-engine pine2ts
```

## Usage

```bash
# Basic usage
pine2ts <input.pine> [output.ts]

# Show help
pine2ts --help

# Show version
pine2ts --version
```

### Examples

```bash
# Output to stdout
pine2ts script.pine

# Output to file
pine2ts script.pine output.ts

# Transpile multiple files (shell expansion)
for f in indicators/*.pine; do
  pine2ts "$f" "${f%.pine}.ts"
done
```

## Input Format

The transpiler accepts PineScript v6 source files with the `.pine` extension.

### Supported PineScript Features

Currently supported:
- `indicator()` declaration
- Variable assignments
- Binary operators (`+`, `-`, `*`, `/`, `>`, `<`, `>=`, `<=`, `==`, `!=`)
- Unary operators (`-`, `!`, `+`)
- Function calls (`ta.*`, `math.*`)
- `plot()` function
- Comments (`//`)
- Built-in series (`open`, `high`, `low`, `close`, `volume`)

### Example Input

```pinescript
// My RSI Indicator
indicator("RSI", overlay=false)

length = 14
rsi_value = ta.rsi(close, length)

// Plot the RSI
plot(rsi_value)
```

## Output Format

The transpiler generates TypeScript code that:
- Imports from `@deepentropy/oakscriptjs`
- Exports a function that takes OHLCV bars
- Returns an `IndicatorResult` object

### Example Output

```typescript
import { Series, ta, taCore, math, array, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function RSI(bars: any[]): IndicatorResult {
  // OHLCV Series
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume);

  const length = 14;
  const rsi_value = ta.rsi(close, length);

  return {
    metadata: { title: "RSI", overlay: false },
    plots: [{ data: rsi_value.toArray().map((v, i) => ({ time: bars[i].time, value: v })) }],
  };
}
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (missing input, file not found, parse error) |

## See Also

- [OakScriptJS Documentation](../packages/oakscriptjs/README.md)
- [OakScript Engine README](../packages/oakscript-engine/README.md)
