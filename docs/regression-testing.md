# Regression Testing Documentation

> **⚠️ NOTICE**: Regression tests are temporarily disabled pending restoration of the test data file (`tests/SP_SPX, 1D_649c1.csv`). The test file was removed in a previous commit and will be restored in a future update.

## Overview

This project includes a comprehensive regression test suite that validates indicator calculations against reference data from TradingView/PineScript. The test suite ensures that the oakscriptjs library produces accurate results matching industry-standard implementations.

## Quick Start

### Run all tests
```bash
pnpm test
```

### Run only regression tests
```bash
pnpm test:regression
```

## Test Coverage

The regression test suite validates **30 technical indicators** against 5,918 bars of SPX (S&P 500) historical data:

### Overlay Indicators (15)
- **Moving Averages**: SMA, EMA, WMA, VWMA, RMA, DEMA, TEMA, HMA, LSMA
- **Advanced MAs**: McGinley Dynamic, ALMA
- **Bands/Channels**: Bollinger Bands (Basis, Upper, Lower)
- **Trend**: SuperTrend

### Non-Overlay Indicators (15)
- **Momentum**: RSI, Stochastic %K, MACD, CCI
- **Oscillators**: Accelerator Osc, Ultimate Osc
- **Trend Strength**: DMI (DI-), Aroon Down
- **Volatility**: Standard Deviation, Historical Volatility
- **Volume**: A/D, CMF, Force Index
- **Other**: Coppock Curve, TRIX

## Test Results

### Current Status: ✅ 20/30 Perfect Match, 10/30 Within Relaxed Tolerance

**Perfect Matches (tolerance < 1e-4):**
- SMA, EMA, WMA, VWMA, HMA, LSMA
- SuperTrend
- Bollinger Bands (all components)
- Stochastic %K, CCI
- Accelerator Osc, Ultimate Osc
- StdDev, Historical Volatility
- A/D, CMF, Force Index
- Coppock Curve, TRIX

**Within Relaxed Tolerance (tolerance < 1e-3 to 0.01):**
- RMA, DEMA, TEMA, McGinley Dynamic
- RSI, MACD

**Known Issues:**
- ALMA - Implementation differences (under investigation)
- Aroon Down - Algorithm variation (under investigation)

## Test Data

- **Source**: TradingView/PineScript v6
- **Symbol**: SPX (S&P 500 Index)
- **Timeframe**: Daily (1D)
- **Period**: 5,918 bars of historical data
- **File**: `tests/SP_SPX, 1D_649c1.csv`
- **Size**: 3.5 MB

## Implementation Details

The regression tests use:
- **Test Framework**: Vitest
- **Library Functions**: oakscriptjs taCore (array-based functions)
- **Comparison**: Configurable floating-point tolerance
- **Warm-up Skip**: First 100 values excluded from comparison to avoid initialization artifacts

## Test Location

All regression tests are located in:
```
transpiler/tests/regression/
├── README.md                    # Detailed test documentation
├── indicator-regression.test.ts # Main test suite
└── utils/
    ├── csv-parser.ts           # CSV parsing utilities
    ├── comparison.ts           # Value comparison with tolerance
    └── indicators.ts           # Indicator calculation functions
```

## Adding New Indicators

To add a new indicator to the regression suite:

1. **Add reference data**: Ensure the CSV file has a column with the expected values
2. **Implement calculation**: Add the indicator to `utils/indicators.ts`
3. **Add to test**: Include the indicator name in the test arrays in `indicator-regression.test.ts`
4. **Run tests**: Execute `pnpm test:regression` to validate

## Performance

The full regression test suite:
- Loads and parses 3.5 MB of CSV data
- Calculates 30 indicators across 5,918 bars
- Performs ~174,000 individual value comparisons
- **Completes in ~105 seconds**

## Continuous Integration

Regression tests are part of the standard test suite and run on:
- Every pull request
- Every commit to main branch
- Release builds

## For More Information

See the detailed documentation in `transpiler/tests/regression/README.md` for:
- Detailed test results
- Tolerance levels and interpretation
- Known discrepancies and their causes
- Future improvement plans
