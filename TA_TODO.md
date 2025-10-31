# Technical Indicators - Implementation TODO List

This document lists all TA functions that need to be implemented for OakScriptJS to match PineScript functionality.

**Current Progress**: 11/59 documented functions implemented (18.6%)

---

## Priority 1: Has PineLib Source Code (1)

### ✅ Ready to Implement
- [ ] `ta.supertrend` - SuperTrend Indicator
  - Source: ta-v10.pine lines 568-622
  - Returns: [float, int] (superTrend value, trend direction)

---

## Priority 2: Core Building Blocks (9)

These are fundamental functions used by many other indicators and must be implemented first:

### Moving Averages
- [ ] `ta.wma` - Weighted Moving Average
- [ ] `ta.rma` - Rolling Moving Average (reference: rma2() in PineLib)
- [ ] `ta.vwma` - Volume Weighted Moving Average
- [ ] `ta.alma` - Arnaud Legoux Moving Average
- [ ] `ta.hma` - Hull Moving Average
- [ ] `ta.swma` - Symmetrically Weighted Moving Average

### Price Analysis
- [ ] `ta.highest` - Highest value over period
- [ ] `ta.lowest` - Lowest value over period
- [ ] `ta.highestbars` - Bars since highest value
- [ ] `ta.lowestbars` - Bars since lowest value
- [ ] `ta.max` - Maximum of two values
- [ ] `ta.min` - Minimum of two values
- [ ] `ta.range` - Range (highest - lowest)

### Utility Functions
- [ ] `ta.cum` - Cumulative sum
- [ ] `ta.cross` - Cross (either direction)

---

## Priority 3: Popular Oscillators & Indicators (15)

### Standard Oscillators
- [ ] `ta.stoch` - Stochastic Oscillator (reference: stochFull() in PineLib)
- [ ] `ta.cci` - Commodity Channel Index
- [ ] `ta.mfi` - Money Flow Index
- [ ] `ta.wpr` - Williams %R
- [ ] `ta.mom` - Momentum
- [ ] `ta.roc` - Rate of Change
- [ ] `ta.cmo` - Chande Momentum Oscillator
- [ ] `ta.tsi` - True Strength Index
- [ ] `ta.rci` - Rank Correlation Index
- [ ] `ta.dmi` - Directional Movement Index

### Bands & Channels
- [ ] `ta.bbw` - Bollinger Bands Width
- [ ] `ta.kc` - Keltner Channels
- [ ] `ta.kcw` - Keltner Channels Width

### Trend Indicators
- [ ] `ta.sar` - Parabolic SAR
- [ ] `ta.cog` - Center of Gravity

---

## Priority 4: Statistical Functions (10)

- [ ] `ta.variance` - Variance
- [ ] `ta.correlation` - Correlation coefficient
- [ ] `ta.dev` - Deviation
- [ ] `ta.median` - Median
- [ ] `ta.mode` - Mode
- [ ] `ta.percentile_linear_interpolation` - Percentile (linear interpolation)
- [ ] `ta.percentile_nearest_rank` - Percentile (nearest rank)
- [ ] `ta.percentrank` - Percent Rank
- [ ] `ta.linreg` - Linear Regression

---

## Priority 5: Advanced Indicators (6)

### Volume-Based
- [ ] `ta.vwap` - Volume Weighted Average Price

### Pivot Points
- [ ] `ta.pivot_point_levels` - Pivot point levels
- [ ] `ta.pivothigh` - Pivot high
- [ ] `ta.pivotlow` - Pivot low

### Conditional Functions
- [ ] `ta.barssince` - Bars since condition
- [ ] `ta.rising` - Is rising
- [ ] `ta.falling` - Is falling
- [ ] `ta.valuewhen` - Value when condition was true

---

## Bonus: PineLib-Only Functions (45)

These functions are implemented in PineLib but not in the official documentation. Consider adding them to expand OakScriptJS capabilities:

### Moving Averages & Advanced Smoothing (10)
- [ ] `ta.dema` - Double Exponential Moving Average (PineLib: dema/dema2)
- [ ] `ta.tema` - Triple Exponential Moving Average (PineLib: tema/tema2)
- [ ] `ta.trima` - Triangular Moving Average
- [ ] `ta.t3` - Tilson Moving Average (T3)
- [ ] `ta.frama` - Fractal Adaptive Moving Average
- [ ] `ta.ema2` - EMA with series float length support
- [ ] `ta.rma2` - RMA with series float length support
- [ ] `ta.atr2` - ATR with series float length support

### Oscillators & Momentum (17)
- [ ] `ta.ao` - Awesome Oscillator
- [ ] `ta.aroon` - Aroon Oscillator
- [ ] `ta.coppock` - Coppock Curve
- [ ] `ta.dm` - Demarker Indicator
- [ ] `ta.eom` - Ease of Movement
- [ ] `ta.ft` - Fisher Transform
- [ ] `ta.ift` - Inverse Fisher Transform
- [ ] `ta.kvo` - Klinger Volume Oscillator
- [ ] `ta.pzo` - Price Zone Oscillator
- [ ] `ta.stc` - Schaff Trend Cycle
- [ ] `ta.stochFull` - Full Stochastic Oscillator
- [ ] `ta.stochRsi` - Stochastic RSI
- [ ] `ta.szo` - Sentiment Zone Oscillator
- [ ] `ta.trix` - TRIX indicator
- [ ] `ta.uo` - Ultimate Oscillator
- [ ] `ta.vhf` - Vertical Horizontal Filter
- [ ] `ta.vi` - Vortex Indicator
- [ ] `ta.vzo` - Volume Zone Oscillator
- [ ] `ta.wpo` - Wave Period Oscillator

### Channels & Bands (1)
- [ ] `ta.donchian` - Donchian Channel

### Trend & Direction (4)
- [ ] `ta.ht` - Hilbert Transform
- [ ] `ta.supertrend2` - SuperTrend with series float length
- [ ] `ta.vStop` - Volatility Stop
- [ ] `ta.vStop2` - Volatility Stop with series float length

### Pattern Detection (1)
- [ ] `ta.williamsFractal` - Williams' Fractal

### Statistical & Utility (6)
- [ ] `ta.cagr` - Compound Annual Growth Rate
- [ ] `ta.changePercent` - Calculate percentage change
- [ ] `ta.highestSince` - Highest value since condition
- [ ] `ta.lowestSince` - Lowest value since condition
- [ ] `ta.rms` - Root Mean Square
- [ ] `ta.rwi` - Random Walk Index

### Volume Analysis (3)
- [ ] `ta.relativeVolume` - Compare volume to historical average
- [ ] `ta.requestUpAndDownVolume` - Requests up/down volume data
- [ ] `ta.requestVolumeDelta` - Requests volume delta

### Advanced Indicators (1)
- [ ] `ta.ichimoku` - Ichimoku Cloud

---

## Implementation Notes

### Dependencies
Some functions depend on others being implemented first:
- `ta.bbw` requires `ta.bb` (✅ done)
- `ta.kcw` requires `ta.kc`
- `ta.stoch` is used by many other oscillators
- `ta.highest` and `ta.lowest` are used by many indicators
- `ta.wma` is used by several indicators

### Testing Strategy
Each implemented function should have:
1. Unit tests comparing output with PineScript
2. Edge case handling (NaN, empty arrays, etc.)
3. Performance benchmarks for large datasets

### Code Organization
Consider organizing implementations into separate files:
- `ta/moving-averages.ts`
- `ta/oscillators.ts`
- `ta/bands-channels.ts`
- `ta/statistical.ts`
- `ta/utility.ts`

---

## Summary

**Total Functions to Implement**: 104
- **Documented (missing)**: 48
- **PineLib-only**: 45
- **Already implemented**: 11

**Recommended Implementation Order**:
1. Core building blocks (wma, rma, highest, lowest, cum)
2. SuperTrend (has source code)
3. Popular oscillators (stoch, cci, mfi)
4. Statistical functions
5. Advanced indicators
6. PineLib-only enhancements
