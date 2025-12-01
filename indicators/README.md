# Indicators

> ⚠️ **AUTO-GENERATED FILES** ⚠️
> 
> The indicator files in this directory are **automatically generated** by the `pine2ts` transpiler.
> 
> **DO NOT EDIT THESE FILES MANUALLY** - your changes will be overwritten on the next commit.

## How it works

1. PineScript source files are stored in the `pinescript/` directory
2. On each commit to `main`, a GitHub Action runs the `pine2ts` transpiler
3. Generated TypeScript indicators are placed in this `indicators/` directory
4. The generated files use the `oakscriptjs` library for calculations

## To modify an indicator

1. Edit the source PineScript file in `pinescript/`
2. Commit and push your changes
3. The GitHub Action will automatically regenerate the TypeScript version

## To add a new indicator

1. Add your PineScript file to `pinescript/` (e.g., `pinescript/MyIndicator.pine`)
2. Commit and push
3. A new folder will be created: `indicators/my-indicator/`

## Directory Structure

```
indicators/
├── README.md           # This file (not auto-generated)
├── index.ts            # Registry of all indicators (auto-generated)
├── sma/
│   ├── index.ts        # Exports (auto-generated)
│   └── sma.ts          # Indicator implementation (auto-generated)
├── momentum/
│   ├── index.ts
│   └── momentum.ts
└── ...
```

## Manual Generation

To manually regenerate indicators locally:

```bash
# Install dependencies
pnpm install

# Build the transpiler
pnpm --filter @deepentropy/oakscript-engine build

# Transpile a single indicator
node ./transpiler/bin/pine2ts.js pinescript/SMA.pine --output indicators/sma/

# Or transpile all indicators
pnpm generate-indicators
```

## Related

- [oakscriptjs](../oakscriptjs/) - Technical analysis library used by generated indicators
- [transpiler](../transpiler/) - The pine2ts transpiler
- [example](../example/) - Demo application showing indicators in action
