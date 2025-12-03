# OakScriptJS Indicator Implementation Roadmap

**Document Purpose**: Track target indicators by complexity and identify missing transpiler/library features needed for implementation.

**Last Updated**: 2025-12-03

---

## Executive Summary

| Category | Count | Status |
|----------|-------|--------|
| **Target Indicators** | 120+ | In `docs/official/indicators_standard/` |
| **Implemented Indicators** | 11 | In `indicators/` folder |
| **Library Functions** | 303/304 (99.7%) | Nearly complete |
| **Regression Test Data** | 80+ columns | In `tests/SP_SPX, 1D_649c1. csv` |
| **Remaining Work** | Focus on transpiler features | See missing features below |

---

## Regression Test Data Available

The file `tests/SP_SPX, 1D_649c1.csv` contains pre-computed indicator values for validation. Available columns include:

| Category | Indicators with Test Data |
|----------|--------------------------|
| **Price Data** | time, open, high, low, close, Volume |
| **Moving Averages** | SMA, EMA, WMA, VWMA, RMA, DEMA, TEMA, HMA, LSMA, McGinley, ALMA |
| **Bollinger Bands** | BB Basis, BB Upper, BB Lower |
| **Momentum** | RSI, Stoch %K, MACD, CCI, Accelerator Osc, Ultimate Osc |
| **Trend** | SuperTrend, Aroon Down, Aroon Up, ADX, DI+, DI- |
| **Volume** | Volume MA, OBV, MFI, CMF, Chaikin Osc |
| **Volatility** | ATR, Keltner Upper/Lower, Donchian Upper/Lower |
| **Other** | Pivot Points, Williams %R, Parabolic SAR, Ichimoku components |

---

## Currently Implemented Indicators ✅

These indicators are fully transpiled and validated with regression tests:

| # | Indicator | Complexity | Key Functions Used | Has Test Data |
|---|-----------|------------|-------------------|---------------|
| 1 | SMA (Simple Moving Average) | 🟢 Simple | `ta.sma()` | ✅ Yes |
| 2 | Momentum | 🟢 Simple | `ta. mom()` | ✅ Yes |
| 3 | Balance of Power (BOP) | 🟢 Simple | Arithmetic only | ❌ No |
| 4 | DEMA (Double EMA) | 🟢 Simple | `ta. ema()` | ✅ Yes |
| 5 | TEMA (Triple EMA) | 🟢 Simple | `ta.ema()` | ✅ Yes |
| 6 | ROC (Rate of Change) | 🟢 Simple | `ta.roc()` | ✅ Yes |
| 7 | ADR (Average Day Range) | 🟢 Simple | `ta.sma()`, high/low | ❌ No |
| 8 | Mass Index | 🟡 Medium | `ta. ema()`, `ta.sum()` | ❌ No |
| 9 | McGinley Dynamic | 🟡 Medium | Custom formula with `nz()` | ✅ Yes |
| 10 | HMA (Hull Moving Average) | 🟡 Medium | `ta.wma()`, `math.sqrt()` | ✅ Yes |
| 11 | LSMA (Least Squares MA) | 🟡 Medium | `ta.linreg()` | ✅ Yes |

---

## Complexity Classification Criteria

Indicators are classified by **language features required**, NOT by file size:

| Tier | Criteria | Examples |
|------|----------|----------|
| 🟢 **Simple** | Basic arithmetic, core TA functions, simple `plot()` | BOP, SMA, Momentum |
| 🟡 **Medium** | `input.*`, `hline()`, `fill()` between hlines, simple UDFs | Stochastic, Williams %R, Aroon |
| 🟠 **Complex** | Drawing objects (`line`, `box`, `label`), `plotshape()`, arrays, `var` state | Pivot Points, Zig Zag, Gaps |
| 🔴 **Advanced** | `import` libraries, `request. security()`, `strategy.*` | Auto Fib, MTF indicators |

---

## Target Indicators by Complexity

### 🟢 TIER 1: Simple (Ready to Implement)
*Indicators using only basic arithmetic and core TA functions.  No special transpiler features needed.*

| # | Indicator | Key Features | Blocking Features | Has Test Data |
|---|-----------|--------------|-------------------|---------------|
| 1 | Smoothed Moving Average | `ta.rma()` | ✅ None | ✅ Yes (RMA) |
| 2 | Moving Average Weighted | `ta.wma()` | ✅ None | ✅ Yes (WMA) |
| 3 | TRIX | `ta. ema()`, `ta.roc()` | ✅ None | ❌ No |
| 4 | Coppock Curve | `ta.wma()`, `ta.roc()` | ✅ None | ❌ No |
| 5 | Elder Force Index | `ta. ema()`, volume, `change()` | ✅ None | ❌ No |
| 6 | Ease of Movement | `ta.sma()`, volume, hl2 | ✅ None | ❌ No |
| 7 | Price Volume Trend | `ta.cum()`, `ta.change()` | ✅ None | ❌ No |
| 8 | Detrended Price Oscillator | `ta.sma()`, offset access `[n]` | ✅ None | ❌ No |
| 9 | Accumulation Distribution | `ta.cum()`, hlc3 | ✅ None | ❌ No |
| 10 | On Balance Volume | `ta. cum()`, `math.sign()` | ✅ None | ✅ Yes (OBV) |
| 11 | Net Volume | Simple conditionals, volume | ✅ None | ❌ No |
| 12 | Volume Oscillator | `ta. ema()` | ✅ None | ❌ No |
| 13 | VWMA | `ta.vwma()` | ✅ None | ✅ Yes (VWMA) |
| 14 | ALMA | `ta. alma()` | ✅ None | ✅ Yes (ALMA) |

**Estimated: ~15 indicators in this tier**

---

### 🟡 TIER 2: Medium (Minor Transpiler Work)
*Indicators using `input.*`, `hline()`, `fill()` between hlines, or simple user-defined functions.*

| # | Indicator | Key Features | Blocking Features | Has Test Data |
|---|-----------|--------------|-------------------|---------------|
| 1 | Aroon | `input. int()`, `ta.highestbars()`, `ta.lowestbars()` | `input.int()` | ✅ Yes (Aroon Up/Down) |
| 2 | Stochastic | `input.int()`, `ta.stoch()`, `hline()`, `fill(h0, h1)` | `hline()`, `fill()` | ✅ Yes (Stoch %K) |
| 3 | Williams %R | `input()`, UDF `_pr()`, `hline()`, `fill()` | UDF, `hline()`, `fill()` | ✅ Yes (Williams %R) |
| 4 | Vortex Indicator | `input.int()`, `math.sum()`, `math.abs()`, `low[1]` | `input.int()` | ❌ No |
| 5 | Parabolic SAR | `ta.sar()` | ✅ None | ✅ Yes (Parabolic SAR) |
| 6 | Klinger Oscillator | `input.int()`, `ta. ema()`, volume | `input.int()` | ❌ No |
| 7 | Chaikin Money Flow | `input.int()`, `ta.sum()`, volume | `input.int()` | ✅ Yes (CMF) |
| 8 | Chaikin Oscillator | `input.int()`, `ta. ema()` | `input.int()` | ✅ Yes (Chaikin Osc) |
| 9 | Money Flow Index | `input.int()`, `ta.mfi()` | `input.int()` | ✅ Yes (MFI) |
| 10 | Relative Vigor Index | `ta.swma()`, `ta.sma()` | ✅ None | ❌ No |
| 11 | Ultimate Oscillator | `input.int()` × 3, `ta.sum()` | `input.int()` | ✅ Yes (Ultimate Osc) |
| 12 | Bull Bear Power | `input.int()`, `ta. ema()` | `input.int()` | ❌ No |
| 13 | Historical Volatility | `input.int()`, `ta.stdev()`, `math.log()` | `input.int()` | ❌ No |
| 14 | Chande Kroll Stop | `input.int()` × 3, `ta.atr()`, `ta.highest()`, `ta. lowest()` | `input.int()` | ❌ No |
| 15 | Correlation Coefficient | `input()`, `input.symbol()`, `ta.correlation()` | `input. symbol()` | ❌ No |
| 16 | Connors RSI | `input. int()` × 3, `ta.rsi()`, `ta.percentrank()` | `input.int()` | ❌ No |
| 17 | SMI Ergodic Indicator | `input.int()` × 3, `ta.tsi()` | `input.int()` | ❌ No |
| 18 | SMI Ergodic Oscillator | `input. int()` × 3, `ta. ema()` | `input.int()` | ❌ No |
| 19 | Directional Movement Index | `input. int()`, `ta. dmi()` | `input.int()` | ✅ Yes (DI+, DI-, ADX) |
| 20 | Average Directional Index | `input.int()`, `ta. dmi()`, `switch` for MA type | `switch` statement | ✅ Yes (ADX) |
| 21 | Envelope | `input.*`, `ta.sma()`/`ta. ema()` based on type | `switch` or conditional | ❌ No |
| 22 | MA Cross | `input.*`, `ta.sma()`, `ta.crossover()` | `input.*` | ❌ No |
| 23 | Moving Average Exponential | `input.*`, `ta. ema()`, `switch` for source | `switch` statement | ✅ Yes (EMA) |
| 24 | Moving Average Simple | `input.*`, `ta.sma()`, `switch` for source | `switch` statement | ✅ Yes (SMA) |
| 25 | Donchian Channels | `input. int()`, `ta.highest()`, `ta. lowest()`, `fill()` | `fill()` | ✅ Yes (Donchian Upper/Lower) |
| 26 | Average True Range | `input.int()`, `ta.atr()` | `input.int()` | ✅ Yes (ATR) |

**Estimated: ~40 indicators in this tier**

---

### 🟠 TIER 3: Complex (Significant Transpiler Work)
*Indicators using `switch` statements, `plotshape()`, `bgcolor()`, or complex conditional logic.*

| # | Indicator | Key Features | Blocking Features | Has Test Data |
|---|-----------|--------------|-------------------|---------------|
| 1 | Bollinger Bands | `input.string()`, `switch` for MA type, UDF `ma()` | `switch`, UDF | ✅ Yes (BB Basis/Upper/Lower) |
| 2 | Relative Strength Index | `input.*`, divergence logic, `switch` | `switch`, complex logic | ✅ Yes (RSI) |
| 3 | MACD | `input.*`, histogram color logic | Conditional colors | ✅ Yes (MACD) |
| 4 | Commodity Channel Index | `input.*`, `switch`, `ta.linreg()` | `switch` statement | ✅ Yes (CCI) |
| 5 | Bollinger Bands %b | `input.*`, `switch`, conditional colors | `switch`, conditional colors | ❌ No |
| 6 | Bollinger BandWidth | `input.*`, `switch`, UDF | `switch`, UDF | ❌ No |
| 7 | Keltner Channels | `input.*`, `ta.kc()`, `fill()` | `fill()` | ✅ Yes (Keltner Upper/Lower) |
| 8 | Ichimoku Cloud | UDF `donchian()`, `fill()`, offset plots | UDF, `fill()`, plot offset | ✅ Yes (Ichimoku components) |
| 9 | Chop Zone | `input.*`, `ta. ema()`, complex color conditions | Conditional colors | ❌ No |
| 10 | Supertrend | `input.*`, `ta. supertrend()`, conditional plot colors | Conditional colors | ✅ Yes (SuperTrend) |
| 11 | Fisher Transform | `input. int()`, `var` state, `math.log()` | `var` keyword | ❌ No |
| 12 | Stochastic RSI | `input.*`, `ta.rsi()`, `ta.stoch()`, `hline()`, `fill()` | `hline()`, `fill()` | ❌ No |
| 13 | Stochastic Momentum Index | `input.*`, `ta. ema()`, `hline()`, `fill()` | `hline()`, `fill()` | ❌ No |
| 14 | True Strength Index | `input.*`, `ta.tsi()`, `hline()` | `hline()` | ❌ No |
| 15 | Know Sure Thing | Multiple `input.*`, `ta.roc()`, `ta.sma()` | Multiple inputs | ❌ No |
| 16 | Choppiness Index | `input. int()`, `ta.atr()`, `math.log10()`, `hline()` | `hline()` | ❌ No |
| 17 | Awesome Oscillator | `ta.sma()`, histogram coloring | Conditional colors | ✅ Yes (Accelerator Osc) |
| 18 | BBTrend | `input.*`, `ta. bb()`, histogram coloring | Conditional colors | ❌ No |
| 19 | Williams Alligator | `input.*`, `ta. smma()`, offset plots | Plot offset | ❌ No |
| 20 | Moving Average Ribbon | Multiple plots with offsets, colors | Many plots | ❌ No |
| 21 | Median | `input.*`, `switch`, `ta.median()`, `ta.percentile_*()` | `switch` statement | ❌ No |
| 22 | Visible Average Price | `chart.left_visible_bar_time`, `var` state | Chart functions | ❌ No |
| 23 | Time Weighted Average Price | `input.*`, time-based reset | Time functions | ❌ No |
| 24 | Rank Correlation Index | `input.*`, `ta.rci()`, `hline()` | `hline()` | ❌ No |
| 25 | RCI Ribbon | `ta.rci()`, multiple plots | Multiple plots | ❌ No |
| 26 | Pivot Points Standard | Arrays, `var` state, time functions | `var`, arrays | ✅ Yes (Pivot Points) |

**Estimated: ~30 indicators in this tier**

---

### 🔴 TIER 4: Advanced (Major Transpiler/Library Work)
*Indicators using drawing objects, external libraries, or multi-timeframe data.*

#### Drawing Objects Required

| # | Indicator | Key Features | Blocking Features | Has Test Data |
|---|-----------|--------------|-------------------|---------------|
| 1 | Pivot Points High Low | `ta.pivothigh()`, `ta. pivotlow()`, `plotshape()` | `plotshape()` | ❌ No |
| 2 | Linear Regression Channel | `ta.linreg()`, `line. new()`, `linefill. new()` | Drawing objects | ❌ No |
| 3 | Gaps | `box. new()`, gap detection, `var` arrays | `box` management | ❌ No |
| 4 | Williams Fractals | `ta. pivothigh()`, `ta.pivotlow()`, `plotshape()` | `plotshape()` | ❌ No |
| 5 | Zig Zag | `ta.zigzag()` or custom, `line.new()` | Drawing objects | ❌ No |
| 6 | RSI Divergence Indicator | Divergence detection, `line.new()`, `label.new()` | Divergence + drawings | ❌ No |
| 7 | Rob Booker - ADX Breakout | Complex conditions, `plotshape()`, `alertcondition()` | `plotshape()` | ❌ No |
| 8 | Rob Booker - Ziv Ghost Pivots | `ta.pivothigh()`, `ta. pivotlow()`, drawings | Drawings | ❌ No |
| 9 | Volatility Stop | `var` state, `plotshape()`, conditional logic | `var`, `plotshape()` | ❌ No |

#### External Libraries Required

| # | Indicator | Key Features | Blocking Features | Has Test Data |
|---|-----------|--------------|-------------------|---------------|
| 1 | Auto Fib Retracement | `import PineScript/ZigZag/7`, complex drawings | **Library imports** | ❌ No |
| 2 | Auto Fib Extension | `import PineScript/ZigZag/7`, complex drawings | **Library imports** | ❌ No |
| 3 | Auto Pitchfork | `import PineScript/ZigZag/7`, polylines | **Library imports** | ❌ No |

#### Multi-Timeframe / External Data Required

| # | Indicator | Key Features | Blocking Features | Has Test Data |
|---|-----------|--------------|-------------------|---------------|
| 1 | Multi-Time Period Charts | `request.security()` | **MTF requests** | ❌ No |
| 2 | Technical Ratings | Multiple indicators, scoring | Complex aggregation | ❌ No |
| 3 | Price Target | `request.earnings()`, `request. dividends()` | **Data requests** | ❌ No |
| 4 | Open Interest | `request. security()` | **MTF requests** | ❌ No |
| 5 | 24-hour Volume | `request. security()` | **MTF requests** | ❌ No |
| 6 | Cumulative Volume Delta | Intrabar analysis, `request.security_lower_tf()` | Tick data | ❌ No |
| 7 | Volume Delta | Intrabar analysis | Tick data | ❌ No |
| 8 | Advance Decline Line | `request.security()` for market breadth | **MTF requests** | ❌ No |
| 9 | Advance Decline Ratio | `request.security()` | **MTF requests** | ❌ No |
| 10 | Cumulative Volume Index | `request.security()` | **MTF requests** | ❌ No |
| 11 | Relative Volume at Time | Time-based aggregation | Time functions | ❌ No |
| 12 | Trading Sessions | Session detection, `bgcolor()` | `bgcolor()`, time | ❌ No |
| 13 | Seasonality | Complex time analysis, tables | Tables, time | ❌ No |
| 14 | Performance | Time-based calculations | Time functions | ❌ No |
| 15 | Moon Phases | Astronomical calculations | Complex math | ❌ No |

#### Strategy Indicators (Require `strategy.*` Namespace)

| # | Strategy | Blocking Features | Has Test Data |
|---|----------|-------------------|---------------|
| 1 | BarUpDn Strategy | `strategy.entry()`, `strategy. close()` | ❌ No |
| 2 | Bollinger Bands Strategy | `strategy.*` functions | ❌ No |
| 3 | Bollinger Bands Strategy directed | `strategy.*` functions | ❌ No |
| 4 | RSI Strategy | `strategy.*` functions | ❌ No |
| 5 | MACD Strategy | `strategy.*` functions | ❌ No |
| 6 | Momentum Strategy | `strategy.*` functions | ❌ No |
| 7 | Supertrend Strategy | `strategy.*` functions | ❌ No |
| 8 | Stochastic Slow Strategy | `strategy.*` functions | ❌ No |
| 9 | Keltner Channels Strategy | `strategy.*` functions | ❌ No |
| 10 | Parabolic SAR Strategy | `strategy.*` functions | ❌ No |
| 11 | MovingAvg Cross | `strategy.*` functions | ❌ No |
| 12 | MovingAvg2Line Cross | `strategy.*` functions | ❌ No |
| 13 | ChannelBreakOutStrategy | `strategy.*` functions | ❌ No |
| 14 | Consecutive Up_Down Strategy | `strategy.*` functions | ❌ No |
| 15 | Greedy Strategy | `strategy.*` functions | ❌ No |
| 16 | InSide Bar Strategy | `strategy.*` functions | ❌ No |
| 17 | OutSide Bar Strategy | `strategy.*` functions | ❌ No |
| 18 | Pivot Extension Strategy | `strategy.*` functions | ❌ No |
| 19 | Pivot Reversal Strategy | `strategy.*` functions | ❌ No |
| 20 | Price Channel Strategy | `strategy.*` functions | ❌ No |
| 21 | Technical Ratings Strategy | `strategy.*` functions | ❌ No |
| 22 | Volty Expan Close Strategy | `strategy.*` functions | ❌ No |

**Estimated: ~35 indicators in this tier**

---

## Missing Transpiler/Library Features

### Priority 1: High Impact (Unlocks Many Indicators)

| Feature | Description | Indicators Blocked | Effort |
|---------|-------------|-------------------|--------|
| `input. int()` | Integer input with validation | 40+ | Medium |
| `input.float()` | Float input with validation | 30+ | Medium |
| `input.string()` | String input with options | 20+ | Medium |
| `input.source()` | Source selector (close, open, etc.) | 15+ | Medium |
| `input.bool()` | Boolean input | 10+ | Low |
| `switch` statement | PineScript switch expression | 15+ | Medium |
| `hline()` | Horizontal line function | 25+ | Low |
| `fill(h0, h1)` | Fill between hlines | 20+ | Low |

### Priority 2: Medium Impact

| Feature | Description | Indicators Blocked | Effort |
|---------|-------------|-------------------|--------|
| User-defined functions | Custom function definitions | 30+ | Medium |
| `fill(p1, p2)` | Fill between plots | 10+ | Low |
| `plotshape()` | Shape markers on chart | 15+ | Medium |
| `bgcolor()` | Background color function | 10+ | Low |
| Plot `offset` | Offset parameter for plots | 10+ | Low |
| `var` keyword | Persistent variable state | 15+ | Medium |
| Conditional colors | Dynamic color based on condition | 20+ | Medium |
| `nz()` function | Replace NaN with value | Many | Low |

### Priority 3: Lower Impact (Specialized)

| Feature | Description | Indicators Blocked | Effort |
|---------|-------------|-------------------|--------|
| `line.new()` management | Dynamic line creation/deletion | 10+ | High |
| `label.new()` management | Dynamic label creation/deletion | 10+ | High |
| `box.new()` management | Dynamic box creation/deletion | 5+ | High |
| `linefill.new()` | Fill between lines | 5+ | Medium |
| `alertcondition()` | Alert definitions | Many | Low |

### Priority 4: Advanced (Specialized Use Cases)

| Feature | Description | Indicators Blocked | Effort |
|---------|-------------|-------------------|--------|
| `import` libraries | External PineScript libraries | 3 | Very High |
| `request.security()` | Multi-timeframe data | 10+ | Very High |
| `request.earnings()` | Fundamental data | 2 | Very High |
| `strategy.*` namespace | Strategy functions | 20+ | Very High |
| Table support | `table. new()`, cells | 2 | Very High |

---

## Implementation Phases

### Phase 1: Quick Wins (Week 1-2)
**Goal: Implement 10-15 simple indicators + basic input support**

**Transpiler Tasks:**
- [ ] `input.int()` support
- [ ] `input.float()` support
- [ ] `input()` generic support
- [ ] `hline()` function
- [ ] `fill(h0, h1)` for hlines

**Indicators to Implement (with test data):**
- [ ] Smoothed Moving Average (RMA) ✅ Has test data
- [ ] Moving Average Weighted (WMA) ✅ Has test data
- [ ] VWMA ✅ Has test data
- [ ] ALMA ✅ Has test data
- [ ] On Balance Volume (OBV) ✅ Has test data
- [ ] Parabolic SAR ✅ Has test data
- [ ] Aroon ✅ Has test data
- [ ] ATR ✅ Has test data

**Indicators to Implement (no test data - need manual validation):**
- [ ] TRIX
- [ ] Coppock Curve
- [ ] Elder Force Index
- [ ] Ease of Movement
- [ ] Vortex Indicator

### Phase 2: Medium Complexity (Week 3-4)
**Goal: Handle control flow and user-defined functions**

**Transpiler Tasks:**
- [ ] `switch` statement transpilation
- [ ] User-defined function support
- [ ] `input.string()` with options
- [ ] `input.source()` support
- [ ] `fill(p1, p2)` for plots

**Indicators to Implement (with test data):**
- [ ] Stochastic ✅ Has test data
- [ ] Williams %R ✅ Has test data
- [ ] Bollinger Bands ✅ Has test data
- [ ] Keltner Channels ✅ Has test data
- [ ] Ichimoku Cloud ✅ Has test data
- [ ] MACD ✅ Has test data
- [ ] RSI ✅ Has test data
- [ ] Money Flow Index ✅ Has test data
- [ ] Chaikin Money Flow ✅ Has test data
- [ ] Donchian Channels ✅ Has test data

### Phase 3: Visual Features (Week 5-6)
**Goal: Enable visual indicators**

**Transpiler Tasks:**
- [ ] `var` keyword for state
- [ ] `plotshape()` implementation
- [ ] `bgcolor()` function
- [ ] Conditional colors in plots
- [ ] Plot `offset` parameter

**Indicators to Implement:**
- [ ] Supertrend ✅ Has test data
- [ ] Williams Fractals
- [ ] Pivot Points High Low
- [ ] Williams Alligator
- [ ] Fisher Transform
- [ ] Chop Zone

### Phase 4: Drawing Objects (Week 7-8)
**Goal: Enable dynamic drawings**

**Transpiler Tasks:**
- [ ] Line drawing management
- [ ] Label management
- [ ] Box management
- [ ] Linefill support

**Indicators to Implement:**
- [ ] Pivot Points Standard ✅ Has test data
- [ ] Linear Regression Channel
- [ ] Gaps
- [ ] Zig Zag
- [ ] RSI Divergence

### Phase 5: Advanced Features (Week 9+)
**Goal: Complete coverage (optional)**

**Transpiler Tasks:**
- [ ] Library import system
- [ ] `request.security()` for MTF
- [ ] Strategy namespace (if desired)

**Indicators to Implement:**
- [ ] Auto Fib Retracement
- [ ] Auto Fib Extension
- [ ] Multi-Time Period Charts
- [ ] Strategy indicators

---

## Progress Tracking

### Indicators Completed: 11 / 120+ (9%)

```
[████░░░░░░░░░░░░░░░░] 9%
```

### By Tier:
| Tier | Completed | Total | Percentage |
|------|-----------|-------|------------|
| 🟢 Simple | 7 | ~15 | 47% |
| 🟡 Medium | 4 | ~40 | 10% |
| 🟠 Complex | 0 | ~30 | 0% |
| 🔴 Advanced | 0 | ~35 | 0% |

### Test Data Coverage:
| Status | Count | Notes |
|--------|-------|-------|
| ✅ With Test Data | ~30 | Can validate automatically |
| ❌ Without Test Data | ~90 | Need manual validation or new test data |

---

## Next Steps

1. **Prioritize indicators WITH test data** - Faster validation cycle
2. **Implement `input.*` functions** - Unlocks 40+ indicators
3. **Add `hline()` and `fill()`** - Quick wins for oscillators
4. **Transpile Tier 1 remaining** - 8 more simple indicators (4 with test data)
5. **Add `switch` statement** - Unlocks MA-type selectors
6. **Iterate on Tier 2** - Build up to 50+ indicators

---

## Notes

- **Complexity is NOT based on file size** - A 300-byte indicator with `switch` is more complex than a 1KB indicator with only arithmetic
- **Library functions are 99. 7% complete** - Focus is on transpiler features
- **Test data file**: `tests/SP_SPX, 1D_649c1. csv` contains 80+ indicator columns
- **Strategy indicators are optional** - Require separate strategy engine
- **MTF indicators require data infrastructure** - May be deferred

---

## Contributing

When implementing an indicator:

1. Check the target `. pine` file in `docs/official/indicators_standard/`
2.  Identify any missing transpiler features
3.  Check if test data exists in `tests/SP_SPX, 1D_649c1.csv`
4. Update this document with findings
5. Submit PR with both indicator and any required transpiler changes
6.  Ensure regression tests pass (if test data available)
