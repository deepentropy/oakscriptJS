# OakScriptJS Example - LightweightCharts v5 Demo

This example demonstrates how to use the OakScriptJS library with LightweightCharts v5 to display technical indicators on a chart.

## Features

- **Candlestick Chart**: Display OHLCV data using LightweightCharts v5
- **SMA Indicator**: Simple Moving Average indicator transpiled from PineScript
- **Dynamic Inputs**: Real-time indicator parameter adjustment
- **Dark Theme**: Professional trading chart appearance

## Quick Start

### Prerequisites

- Node.js 18 or later
- pnpm (recommended) or npm

### Installation

From the example directory:

```bash
# Install dependencies
pnpm install
```

Or from the root of the repository:

```bash
# Install all workspace dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
```

Open your browser to `http://localhost:5173` to see the chart.

### Production Build

```bash
# Build for production
pnpm build

# Preview the production build
pnpm preview
```

## Project Structure

```
example/
├── index.html          # Main HTML file
├── data/
│   └── SPX.csv         # S&P 500 historical data
├── src/
│   ├── main.ts         # Application entry point
│   ├── chart.ts        # LightweightCharts setup and management
│   ├── data-loader.ts  # CSV data loading utilities
│   └── indicator-ui.ts # UI for indicator selection and inputs
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Indicators

Indicators are located in the **repository root** at `../indicators/` for better reusability across different examples and applications. See the [indicators README](../indicators/README.md) for detailed documentation.

### Using Indicators

Indicators are imported from the root `indicators/` directory:

```typescript
import * as smaIndicator from '../../indicators/sma';
```

Each indicator exports:

- `metadata`: Title, short title, and overlay settings
- `inputConfig`: Input definitions for the UI
- `plotConfig`: Plot styling information
- `defaultInputs`: Default input values
- `calculate`: Function that computes the indicator values

### Adding New Indicators

New indicators should be added to the root `indicators/` directory. See the [indicators README](../indicators/README.md) for instructions on creating new indicators.

To use a new indicator in this example, register it in `src/indicator-ui.ts`:

```typescript
import * as newIndicator from '../../indicators/new-indicator';

const indicators: IndicatorDefinition[] = [
  // ... existing indicators
  {
    id: 'new-indicator',
    name: 'New Indicator',
    metadata: newIndicator.metadata,
    inputConfig: newIndicator.inputConfig,
    plotConfig: newIndicator.plotConfig,
    calculate: newIndicator.calculate,
    defaultInputs: newIndicator.defaultInputs,
  },
];
```

## Original PineScript

The SMA indicator was transpiled from this PineScript:

```pine
//@version=6
indicator(title="Moving Average Simple", shorttitle="SMA", overlay=true, timeframe="", timeframe_gaps=true)
len = input.int(9, minval=1, title="Length")
src = input(close, title="Source")
offset = input.int(title="Offset", defval=0, minval=-500, maxval=500, display = display.data_window)
out = ta.sma(src, len)
plot(out, color=color.blue, title="MA", offset=offset)
```

## Dependencies

- **@deepentropy/oakscriptjs**: Technical analysis library
- **@deepentropy/indicators**: Reusable indicators from the repository root
- **lightweight-charts**: TradingView's charting library (v5)
- **vite**: Build tool and dev server
- **typescript**: Type safety

## License

MIT
