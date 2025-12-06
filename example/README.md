# OakScriptJS Example - LightweightCharts v5 Demo

This example demonstrates how to use the OakScriptJS library with LightweightCharts v5 to display technical indicators on a chart.

## 🚀 Live Demo

**[View Live Demo on GitHub Pages](https://deepentropy.github.io/oakscriptJS/)**

## Features

- **Candlestick Chart**: Display OHLCV data using LightweightCharts v5
- **Dynamic Indicator Loading**: All indicators from the `indicators/` folder are automatically loaded
- **Dynamic Inputs**: Real-time indicator parameter adjustment
- **Dark Theme**: Professional trading chart appearance

## Automatic Deployment

This example is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch.

### How It Works

1. Push changes to the `main` branch
2. GitHub Actions workflow (`deploy-pages.yml`) automatically:
   - Installs dependencies
   - Builds the example with the correct base path
   - Deploys to GitHub Pages
3. The live demo is updated at https://deepentropy.github.io/oakscriptJS/

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
# Build for production (local)
pnpm build

# Build for GitHub Pages (with /oakscriptJS/ base path)
pnpm build:pages

# Preview the production build
pnpm preview
```

## Project Structure

```
example/
├── index.html          # Main HTML file
├── public/
│   └── data/
│       └── SPX.csv     # S&P 500 historical data
├── src/
│   ├── main.ts         # Application entry point
│   ├── chart.ts        # LightweightCharts setup and management
│   ├── data-loader.ts  # CSV data loading utilities
│   └── indicator-ui.ts # UI for indicator selection and inputs
├── vite.config.ts      # Vite configuration with GitHub Pages support
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Indicators

Indicators are located in the **repository root** at `../indicators/` for better reusability across different examples and applications. See the [indicators README](../indicators/README.md) for detailed documentation.

The example uses an **indicator registry** (`indicators/index.ts`) that automatically populates the dropdown with all available indicators.

### Adding New Indicators to the Demo

To add a new indicator that will appear in the demo:

1. **Create the indicator** in the `indicators/` directory following the existing pattern (see [indicators README](../indicators/README.md))

2. **Register it** in `indicators/index.ts`:

```typescript
// Import the new indicator
import * as myIndicator from './my-indicator';

// Add to the registry
export const indicatorRegistry: IndicatorRegistryEntry[] = [
  // ... existing indicators
  {
    id: 'my-indicator',
    name: 'My Indicator (MI)',
    shortName: 'MI',
    description: 'Description of what this indicator does',
    overlay: true, // or false for separate pane
    metadata: myIndicator.metadata,
    inputConfig: myIndicator.inputConfig,
    plotConfig: myIndicator.plotConfig,
    defaultInputs: { ...myIndicator.defaultInputs },
    calculate: myIndicator.calculate,
  },
];
```

3. **Push to main** - The demo will automatically update with your new indicator!

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

- **oakscriptjs**: Technical analysis library
- **@deepentropy/indicators**: Reusable indicators from the repository root
- **lightweight-charts**: TradingView's charting library (v5)
- **vite**: Build tool and dev server
- **typescript**: Type safety

## License

MIT
