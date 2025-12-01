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
├── indicators/
│   └── sma.ts          # SMA indicator (transpiled from PineScript)
├── src/
│   ├── main.ts         # Application entry point
│   ├── chart.ts        # LightweightCharts setup and management
│   ├── data-loader.ts  # CSV data loading utilities
│   └── indicator-ui.ts # UI for indicator selection and inputs
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## How It Works

### Indicator System

Indicators are defined in the `indicators/` directory. Each indicator exports:

- `metadata`: Title, short title, and overlay settings
- `inputConfig`: Input definitions for the UI
- `plotConfig`: Plot styling information
- `defaultInputs`: Default input values
- `calculate`: Function that computes the indicator values

### Adding New Indicators

1. Create a new file in `indicators/` (e.g., `ema.ts`)
2. Follow the structure of `sma.ts`:

```typescript
import { Series, ta, type Bar } from '@deepentropy/oakscriptjs';

export const metadata = {
  title: 'Exponential Moving Average',
  shortTitle: 'EMA',
  overlay: true,
};

export interface EMAInputs {
  length: number;
  source: 'open' | 'high' | 'low' | 'close';
}

export const defaultInputs: EMAInputs = {
  length: 20,
  source: 'close',
};

export const inputConfig = [
  {
    id: 'length',
    type: 'int' as const,
    title: 'Length',
    defval: 20,
    min: 1,
    max: 500,
  },
  // ... more inputs
];

export const plotConfig = [
  {
    id: 'ema',
    title: 'EMA',
    color: '#FF6D00',
    lineWidth: 2,
  },
];

export function calculate(bars: Bar[], inputs: Partial<EMAInputs>) {
  // ... calculation logic using ta.ema()
}
```

3. Register the indicator in `src/indicator-ui.ts`:

```typescript
import * as emaIndicator from '../indicators/ema';

const indicators: IndicatorDefinition[] = [
  // ... existing indicators
  {
    id: 'ema',
    name: 'Exponential Moving Average (EMA)',
    metadata: emaIndicator.metadata,
    inputConfig: emaIndicator.inputConfig,
    plotConfig: emaIndicator.plotConfig,
    calculate: emaIndicator.calculate,
    defaultInputs: emaIndicator.defaultInputs,
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
- **lightweight-charts**: TradingView's charting library (v5)
- **vite**: Build tool and dev server
- **typescript**: Type safety

## License

MIT
