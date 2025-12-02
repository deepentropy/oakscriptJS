# PineScript Sources

This directory contains the source PineScript files for indicators.

When you commit changes to files in this directory, a GitHub Action will automatically:
1. Run the `pine2ts` transpiler
2. Generate TypeScript indicators in `indicators/`
3. Commit the generated files

## Adding a new indicator

1. Create a new `.pine` file in this directory
2. Use standard PineScript v6 syntax
3. Commit and push
4. The indicator will be auto-generated in `indicators/`

## Example

```pine
//@version=6
indicator(title="My Custom Indicator", shorttitle="MCI", overlay=true)
length = input.int(14, minval=1, title="Length")
src = input(close, title="Source")
result = ta.sma(src, length)
plot(result, "MCI", color=color.blue)
```
