# PineScript Sources

Indicator source files are now located in `docs/official/indicators_standard/`.

To add or modify which indicators are generated:
1. Edit `indicators/sources.json` to add/remove indicator entries
2. Each entry should have an `id`, `name`, and `sourcePath` pointing to the official .pine file
3. Commit and push - the GitHub Action will automatically transpile the indicators

## Example Entry

```json
{
  "id": "sma",
  "name": "Simple Moving Average (SMA)",
  "sourcePath": "docs/official/indicators_standard/Moving Average Simple.pine"
}
```

## Local Development

To generate indicators locally, run:

```bash
pnpm generate-indicators
```

This reads from `indicators/sources.json` and transpiles each indicator to TypeScript.
