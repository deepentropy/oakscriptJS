# Technical Indicators: PineLib Source Code Analysis

This document analyzes the `docs/pinelib/ta-v10.pine` source code to identify which missing functions have PineScript implementations available.

## Summary

- **Missing functions with PineLib implementations**: 1
- **Missing functions WITHOUT PineLib implementations**: 47
- **PineLib-only functions (not in docs)**: 45

---

## ✅ Missing Functions Found in PineLib (1)

These missing functions are documented AND have implementations in the PineLib source:

1. ✅ **`ta.supertrend`** - SuperTrend Indicator
   - PineLib exports: `supertrend()` and `supertrend2()` (alternate version with series float length)
   - Implementation: Lines 568-622 in ta-v10.pine

---

## ❌ Missing Functions NOT in PineLib (47)

These documented functions are NOT implemented in the PineLib source code:

### Moving Averages & Smoothing (6)
1. ❌ `ta.alma` - Arnaud Legoux Moving Average
2. ❌ `ta.hma` - Hull Moving Average
3. ❌ `ta.rma` - Rolling Moving Average (note: `rma2()` exists in PineLib as alternate)
4. ❌ `ta.swma` - Symmetrically Weighted Moving Average
5. ❌ `ta.vwma` - Volume Weighted Moving Average
6. ❌ `ta.wma` - Weighted Moving Average

### Oscillators & Momentum (10)
7. ❌ `ta.cci` - Commodity Channel Index
8. ❌ `ta.cmo` - Chande Momentum Oscillator
9. ❌ `ta.mfi` - Money Flow Index
10. ❌ `ta.mom` - Momentum
11. ❌ `ta.roc` - Rate of Change
12. ❌ `ta.stoch` - Stochastic
13. ❌ `ta.tsi` - True Strength Index
14. ❌ `ta.wpr` - Williams %R
15. ❌ `ta.rci` - Rank Correlation Index
16. ❌ `ta.dmi` - Directional Movement Index

### Bands & Channels (3)
17. ❌ `ta.bbw` - Bollinger Bands Width
18. ❌ `ta.kc` - Keltner Channels
19. ❌ `ta.kcw` - Keltner Channels Width

### Trend & Direction (2)
20. ❌ `ta.sar` - Parabolic SAR
21. ❌ `ta.cog` - Center of Gravity

### Statistical Functions (10)
22. ❌ `ta.correlation` - Correlation coefficient
23. ❌ `ta.dev` - Deviation
24. ❌ `ta.linreg` - Linear Regression
25. ❌ `ta.median` - Median
26. ❌ `ta.mode` - Mode
27. ❌ `ta.percentile_linear_interpolation` - Percentile (linear interpolation)
28. ❌ `ta.percentile_nearest_rank` - Percentile (nearest rank)
29. ❌ `ta.percentrank` - Percent Rank
30. ❌ `ta.variance` - Variance
31. ❌ `ta.vwap` - Volume Weighted Average Price

### Price Analysis (7)
32. ❌ `ta.highest` - Highest value
33. ❌ `ta.highestbars` - Highest value bars ago
34. ❌ `ta.lowest` - Lowest value
35. ❌ `ta.lowestbars` - Lowest value bars ago
36. ❌ `ta.max` - Maximum
37. ❌ `ta.min` - Minimum
38. ❌ `ta.range` - Range (highest - lowest)

### Pivot Points (3)
39. ❌ `ta.pivot_point_levels` - Pivot point levels
40. ❌ `ta.pivothigh` - Pivot high
41. ❌ `ta.pivotlow` - Pivot low

### Conditional & Utility (6)
42. ❌ `ta.barssince` - Bars since condition
43. ❌ `ta.cross` - Cross (either direction)
44. ❌ `ta.cum` - Cumulative sum
45. ❌ `ta.falling` - Is falling
46. ❌ `ta.rising` - Is rising
47. ❌ `ta.valuewhen` - Value when condition was true

---

## 🆕 PineLib-Only Functions (45)

These functions are implemented in PineLib but NOT documented in `docs/reference/functions/ta.*.md`:

### Moving Averages & Advanced Smoothing (10)
1. `ao()` - Awesome Oscillator (SMA-based)
2. `dema()` / `dema2()` - Double Exponential Moving Average
3. `ema2()` - Exponential Moving Average (alternate, allows series float length)
4. `frama()` - Fractal Adaptive Moving Average
5. `rma2()` - Rolling Moving Average (alternate, allows series float length)
6. `t3()` / `t3Alt()` - Tilson Moving Average (T3)
7. `tema()` / `tema2()` - Triple Exponential Moving Average
8. `trima()` - Triangular Moving Average

### Oscillators & Momentum (11)
9. `aroon()` - Aroon Oscillator
10. `coppock()` - Coppock Curve
11. `dm()` - Demarker Indicator
12. `eom()` - Ease of Movement
13. `ft()` - Fisher Transform
14. `ift()` - Inverse Fisher Transform
15. `kvo()` - Klinger Volume Oscillator
16. `pzo()` - Price Zone Oscillator
17. `stc()` - Schaff Trend Cycle
18. `stochFull()` - Full Stochastic Oscillator
19. `stochRsi()` - Stochastic RSI
20. `szo()` - Sentiment Zone Oscillator
21. `trix()` - TRIX indicator
22. `uo()` - Ultimate Oscillator
23. `vhf()` - Vertical Horizontal Filter
24. `vi()` - Vortex Indicator
25. `vzo()` - Volume Zone Oscillator
26. `wpo()` - Wave Period Oscillator

### Channels & Bands (1)
27. `donchian()` - Donchian Channel

### Trend & Direction (4)
28. `ht()` - Hilbert Transform
29. `supertrend2()` - SuperTrend (alternate version)
30. `vStop()` / `vStop2()` - Volatility Stop

### Pattern Detection (1)
31. `williamsFractal()` - Williams' Fractal

### Statistical & Utility (3)
32. `atr2()` - Average True Range (alternate, allows series float length)
33. `cagr()` - Compound Annual Growth Rate
34. `changePercent()` - Calculate percentage change
35. `highestSince()` - Highest value since condition
36. `lowestSince()` - Lowest value since condition
37. `rms()` - Root Mean Square
38. `rwi()` - Random Walk Index

### Volume Analysis (3)
39. `relativeVolume()` - Compare volume to its historical average
40. `requestUpAndDownVolume()` - Requests up/down volume data
41. `requestVolumeDelta()` - Requests volume delta

### Advanced Indicators (1)
42. `ichimoku()` - Ichimoku Cloud

---

## 📊 Implementation Priority Recommendations

### Tier 1: Implement Immediately (Has PineLib Source)
1. **`ta.supertrend`** - Very popular indicator with complete source code available

### Tier 2: Core Building Blocks (No PineLib, but essential)
These are fundamental functions used by many other indicators:
1. `ta.wma` - Weighted Moving Average (used by many indicators)
2. `ta.rma` - Rolling Moving Average (can use `rma2()` from PineLib as reference)
3. `ta.highest` / `ta.lowest` - Price analysis (used in many indicators)
4. `ta.highestbars` / `ta.lowestbars` - Bar counting (used in Aroon, etc.)
5. `ta.cum` - Cumulative sum (building block)

### Tier 3: Popular Standard Indicators (No PineLib)
1. `ta.stoch` - Stochastic (very popular, can reference `stochFull()` from PineLib)
2. `ta.cci` - Commodity Channel Index
3. `ta.mfi` - Money Flow Index
4. `ta.wpr` - Williams %R
5. `ta.vwap` - Volume Weighted Average Price

### Tier 4: Statistical Functions (No PineLib)
1. `ta.correlation` - Correlation coefficient
2. `ta.variance` - Variance
3. `ta.median` - Median
4. `ta.dev` - Deviation
5. `ta.linreg` - Linear Regression

### Tier 5: Consider Adding PineLib-Only Functions to Docs
Many advanced indicators in PineLib are not documented. Consider:
1. Adding documentation for useful PineLib functions like `dema`, `tema`, `ichimoku`, etc.
2. Implementing these in OakScriptJS
3. This would significantly expand the library's capabilities

---

## Notes

- The PineLib library contains many advanced indicators not in the standard documentation
- Only 1 documented missing function has a direct PineLib implementation (`supertrend`)
- Most documented functions will need to be implemented from scratch or from PineScript built-ins
- The PineLib source can serve as a reference for implementation patterns and algorithms
- Several PineLib functions have "alternate" versions (e.g., `ema2`, `atr2`, `rma2`) that accept series float lengths instead of simple int
