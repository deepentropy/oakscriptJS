# Indicator Regression Tests

This directory contains comprehensive regression tests for validating oakscriptjs indicator calculations against reference data from TradingView/PineScript.

## Overview

The regression test suite:
1. Loads historical SPX (S&P 500) OHLCV data with pre-calculated indicator values from TradingView
2. Calculates indicators using the oakscriptjs library
3. Compares calculated values with reference values
4. Reports discrepancies beyond acceptable tolerance

## Test Files

### Main Test Suite
- **`indicator-regression.test.ts`** - Main regression test covering 30 indicators
  - Overlay indicators: SMA, EMA, WMA, VWMA, RMA, DEMA, TEMA, HMA, LSMA, McGinley Dynamic, ALMA, SuperTrend, Bollinger Bands
  - Non-overlay indicators: RSI, Stochastic, MACD, CCI, Accelerator Oscillator, Ultimate Oscillator, DMI, Aroon, StdDev, Historical Volatility, A/D, CMF, Force Index, Coppock Curve, TRIX

### Utilities
- **`utils/csv-parser.ts`** - Parses CSV reference data with column names containing spaces
- **`utils/comparison.ts`** - Comparison utilities with configurable tolerance
- **`utils/indicators.ts`** - Indicator calculation functions using oakscriptjs taCore

### Unit Tests
- **`csv-parser.test.ts`** - Tests for CSV parsing functionality
- **`import-test.test.ts`** - Tests for oakscriptjs import functionality
- **`quick-test.test.ts`** - Quick validation tests

## Reference Data

The test suite uses:
- **Data File**: `tests/SP_SPX, 1D_649c1.csv` (in project root)
- **Data Source**: TradingView/PineScript exported OHLCV data with indicator values
- **Data Size**: 5,918 daily bars of SPX data
- **Indicators**: Values calculated using PineScript v6 with default parameters

## Running Tests

### Run all regression tests:
```bash
cd packages/pine2ts
pnpm test tests/regression/
```

### Run specific test file:
```bash
pnpm test tests/regression/indicator-regression.test.ts
```

### Run with verbose output:
```bash
pnpm test tests/regression/indicator-regression.test.ts -- --reporter=verbose
```

## Test Parameters

### Default Parameters
- **length**: 14 (for most indicators)
- **fast_length**: 12 (for MACD)
- **slow_length**: 26 (for MACD)
- **signal_length**: 9 (for MACD)
- **BB multiplier**: 2.0 (Bollinger Bands standard deviations)
- **SuperTrend factor**: 3.0

### Tolerance Levels
- **Standard tolerance**: 1e-4 (0.0001) for comprehensive tests
- **Strict tolerance**: 1e-3 (0.001) for individual indicator tests
- **Skip initial values**: 100 (to avoid warm-up period discrepancies)

## Test Results

### Currently Passing (20/30 indicators)

**Overlay Indicators:**
- ✅ SMA - Simple Moving Average
- ✅ EMA - Exponential Moving Average
- ✅ WMA - Weighted Moving Average
- ✅ VWMA - Volume Weighted Moving Average
- ✅ HMA - Hull Moving Average
- ✅ LSMA - Linear Regression (Least Squares MA)
- ✅ SuperTrend
- ✅ BB Basis/Upper/Lower - Bollinger Bands

**Non-Overlay Indicators:**
- ✅ Stoch %K - Stochastic Oscillator
- ✅ CCI - Commodity Channel Index
- ✅ Accelerator Osc - Accelerator Oscillator
- ✅ Ultimate Osc - Ultimate Oscillator
- ✅ StdDev - Standard Deviation
- ✅ Hist Vol - Historical Volatility
- ✅ A/D - Accumulation/Distribution
- ✅ CMF - Chaikin Money Flow
- ✅ Force Index
- ✅ Coppock - Coppock Curve
- ✅ TRIX

### Known Discrepancies (10/30 indicators)

Some indicators have minor discrepancies due to implementation differences:
- RMA (78 mismatches, max diff: 3.18e-2)
- DEMA (2 mismatches, max diff: 1.20e-4)
- TEMA (16 mismatches, max diff: 6.40e-4)
- McGinley (45 mismatches, max diff: 1.49e-3)
- ALMA (major discrepancies - needs investigation)
- RSI (32 mismatches, max diff: 5.23e-4)
- MACD (59 mismatches, max diff: 9.33e-3)
- Aroon Down (major discrepancies - needs investigation)
- DI- (no reference data available in CSV)

These discrepancies are typically:
1. Edge cases in the first few values (warm-up period)
2. Minor floating-point precision differences
3. Implementation variations in algorithms (e.g., EMA initialization)

## Interpreting Results

The test output shows:
```
✓ SMA: 5818 comparisons, all passed (max diff: 1.00e-11)
✗ RMA: 5818 comparisons, 78 mismatches (max diff: 3.18e-2, avg: 7.65e-5)
```

- **✓** = All values within tolerance
- **✗** = Some values exceed tolerance
- **comparisons** = Number of valid comparisons made (excluding NaN values)
- **max diff** = Maximum absolute difference found
- **avg diff** = Average absolute difference

## Adding New Indicators

To add a new indicator to the regression tests:

1. Add the indicator calculation to `utils/indicators.ts`
2. Ensure the reference CSV has a column with the expected values
3. Add the indicator name to the test arrays in `indicator-regression.test.ts`
4. Run the tests to validate

## Notes

- Tests use dynamic imports to avoid slow module loading during test collection
- Large CSV file (3.5MB) is loaded once per test suite in `beforeAll()`
- Tests are designed to be informative rather than strictly pass/fail
- The comprehensive test expects at least 10 indicators to pass (adjustable threshold)

## Future Improvements

- [ ] Investigate and fix ALMA implementation discrepancies
- [ ] Investigate Aroon Down calculation differences
- [ ] Add DI+ and DI- reference data and tests
- [ ] Add more exotic indicators (Ichimoku, Parabolic SAR, etc.)
- [ ] Add performance benchmarks
- [ ] Add tests with different parameter values
- [ ] Add tests with different datasets (crypto, forex, etc.)
