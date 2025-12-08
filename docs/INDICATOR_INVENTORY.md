# OakScriptJS Indicator Inventory

This document provides a comprehensive inventory of all PineScript indicators from TradingView's standard library,
ranked by complexity. It tracks implementation status in OakScriptJS.

## Summary Statistics

| Category               | Count |
|------------------------|-------|
| **Total Indicators**   | 134   |
| **Implemented**        | 23    |
| **Pending**            | 111   |
| **Very Complex (25+)** | 3     |
| **Complex (15-24)**    | 29    |
| **Medium (5-14)**      | 43    |
| **Simple (0-4)**       | 59    |

## Complexity Scoring

Complexity is calculated based on:

- Number of unique TA functions used
- Strategy functions (+20 points)
- Drawing functions (+10 points)
- `request.security` usage (+5 points)
- Table operations (+5 points)
- Array/Matrix operations (+5 points)

---

## Implemented Indicators

### Standalone Indicator Modules (in `indicators/` folder)

| Indicator               | Folder               | Complexity | Notes               |
|-------------------------|----------------------|------------|---------------------|
| Simple Moving Average   | `sma/`               | Simple     | Core TA function    |
| Exponential Moving Avg  | `ema/`               | Simple     | Core TA function    |
| Double EMA              | `dema/`              | Simple     | EMA-based           |
| Triple EMA              | `tema/`              | Simple     | EMA-based           |
| Hull Moving Average     | `hma/`               | Simple     | WMA-based           |
| Weighted Moving Average | `wma/`               | Simple     | Core TA function    |
| Volume Weighted MA      | `vwma/`              | Simple     | Volume-weighted     |
| Least Squares MA        | `lsma/`              | Simple     | Linear regression   |
| RMA (Wilder's MA)       | `rma/`               | Simple     | Smoothing function  |
| Arnaud Legoux MA        | `alma/`              | Simple     | Gaussian weighted   |
| Average Day Range       | `adr/`               | Simple     | Range calculation   |
| Balance of Power        | `bop/`               | Simple     | Price-volume ratio  |
| Momentum                | `momentum/`          | Simple     | Price change        |
| Rate of Change          | `roc/`               | Simple     | Percentage change   |
| Mass Index              | `mass-index/`        | Simple     | Range expansion     |
| McGinley Dynamic        | `mc-ginley-dynamic/` | Simple     | Adaptive MA         |
| On Balance Volume       | `obv/`               | Medium     | Volume flow         |
| Accum/Distribution      | `ad/`                | Simple     | Volume flow         |
| Relative Strength Index | `rsi/`               | Medium     | Momentum oscillator |
| MACD                    | `macd/`              | Simple     | Trend/momentum      |
| Bollinger Bands         | `bb/`                | Medium     | Volatility bands    |
| Stochastic              | `stoch/`             | Simple     | Momentum oscillator |
| Average True Range      | `atr/`               | Medium     | Volatility measure  |

### Core TA Functions (in `packages/oakscriptjs/src/ta/`)

These functions are implemented in the core `ta` module and can be used directly.
Creating a standalone indicator wrapper is trivial (just adds UI inputs).

| Function       | Status      | Notes                      |
|----------------|-------------|----------------------------|
| `ta.ema()`     | Implemented | Exponential Moving Average |
| `ta.sma()`     | Implemented | Simple Moving Average      |
| `ta.rma()`     | Implemented | Wilder's Smoothing (RMA)   |
| `ta.wma()`     | Implemented | Weighted Moving Average    |
| `ta.vwma()`    | Implemented | Volume Weighted MA         |
| `ta.rsi()`     | Implemented | Relative Strength Index    |
| `ta.stdev()`   | Implemented | Standard Deviation         |
| `ta.highest()` | Implemented | Highest value              |
| `ta.lowest()`  | Implemented | Lowest value               |
| `ta.change()`  | Implemented | Price change               |
| `ta.atr()`     | Implemented | Average True Range         |
| `ta.tr()`      | Implemented | True Range                 |

---

## Very Complex Indicators (Score 25+)

These indicators use multiple advanced features (strategies, drawings, tables, arrays, multi-timeframe).

| Indicator                  | Score | Strategy | Drawing | ReqSec | Tables | Arrays |
|----------------------------|-------|----------|---------|--------|--------|--------|
| Keltner Channels Strategy  | 27    | Yes      | No      | No     | No     | No     |
| Technical Ratings Strategy | 26    | Yes      | No      | Yes    | No     | No     |
| Seasonality                | 25    | No       | Yes     | Yes    | Yes    | Yes    |

---

## Complex Indicators (Score 15-24)

| Indicator                         | Score | Strategy | Drawing | ReqSec | Tables | Arrays |
|-----------------------------------|-------|----------|---------|--------|--------|--------|
| Stochastic Slow Strategy          | 24    | Yes      | No      | No     | No     | No     |
| Bollinger Bands Strategy          | 24    | Yes      | No      | No     | No     | No     |
| Bollinger Bands Strategy directed | 24    | Yes      | No      | No     | No     | No     |
| RSI Strategy                      | 23    | Yes      | No      | No     | No     | No     |
| MovingAvg2Line Cross              | 23    | Yes      | No      | No     | No     | No     |
| MACD Strategy                     | 23    | Yes      | No      | No     | No     | No     |
| Volty Expan Close Strategy        | 22    | Yes      | No      | No     | No     | No     |
| Supertrend Strategy               | 22    | Yes      | No      | No     | No     | No     |
| Price Channel Strategy            | 22    | Yes      | No      | No     | No     | No     |
| Pivot Reversal Strategy           | 22    | Yes      | No      | No     | No     | No     |
| Pivot Extension Strategy          | 22    | Yes      | No      | No     | No     | No     |
| ChannelBreakOutStrategy           | 22    | Yes      | No      | No     | No     | No     |
| Pivot Points Standard             | 21    | No       | Yes     | Yes    | No     | Yes    |
| MovingAvg Cross                   | 21    | Yes      | No      | No     | No     | No     |
| Gaps                              | 21    | No       | Yes     | No     | Yes    | Yes    |
| Rob Booker - ADX Breakout         | 20    | Yes      | No      | No     | No     | No     |
| Parabolic SAR Strategy            | 20    | Yes      | No      | No     | No     | No     |
| OutSide Bar Strategy              | 20    | Yes      | No      | No     | No     | No     |
| Momentum Strategy                 | 20    | Yes      | No      | No     | No     | No     |
| InSide Bar Strategy               | 20    | Yes      | No      | No     | No     | No     |
| Greedy Strategy                   | 20    | Yes      | No      | No     | No     | No     |
| Consecutive Up_Down Strategy      | 20    | Yes      | No      | No     | No     | No     |
| BarUpDn Strategy                  | 20    | Yes      | No      | No     | No     | No     |
| Technical Ratings                 | 17    | No       | No      | Yes    | Yes    | Yes    |
| Trading Sessions                  | 15    | No       | Yes     | No     | No     | Yes    |
| Price Target                      | 15    | No       | Yes     | No     | Yes    | No     |
| Multi-Time Period Charts          | 15    | No       | Yes     | Yes    | No     | No     |
| Auto Pitchfork                    | 15    | No       | Yes     | No     | No     | Yes    |
| Auto Fib Extension                | 15    | No       | Yes     | No     | No     | Yes    |

---

## Medium Complexity Indicators (Score 5-14)

| Indicator                     | Score | TA Funcs | Special Features | Status          |
|-------------------------------|-------|----------|------------------|-----------------|
| Pivot Points High Low         | 12    | 2        | Drawing          | Pending         |
| Relative Strength Index       | 11    | 11       | -                | **Implemented** |
| Auto Fib Retracement          | 11    | 1        | Drawing          | Pending         |
| Performance                   | 10    | 0        | ReqSec, Tables   | Pending         |
| Linear Regression Channel     | 10    | 0        | Drawing          | Pending         |
| On Balance Volume             | 8     | 8        | -                | **Implemented** |
| Relative Volatility Index     | 7     | 7        | -                | Pending         |
| Rank Correlation Index        | 7     | 7        | -                | Pending         |
| Commodity Channel Index       | 7     | 7        | -                | Pending         |
| Moving Average Simple         | 6     | 6        | -                | **Implemented** |
| Moving Average Exponential    | 6     | 6        | -                | **Implemented** |
| Moon Phases                   | 6     | 1        | Arrays           | Pending         |
| Cumulative Volume Index       | 6     | 1        | ReqSec           | Pending         |
| Correlation Coefficient       | 6     | 1        | ReqSec           | Pending         |
| Bollinger Bands               | 6     | 6        | -                | **Implemented** |
| Advance Decline Line          | 6     | 1        | ReqSec           | Pending         |
| Visible Average Price         | 5     | 0        | ReqSec           | Pending         |
| RSI Divergence Indicator      | 5     | 5        | Drawing          | Pending         |
| Rob Booker - Ziv Ghost Pivots | 5     | 0        | Drawing          | Pending         |
| Open Interest                 | 5     | 0        | ReqSec           | Pending         |
| Moving Average Ribbon         | 5     | 5        | -                | Pending         |
| Keltner Channels              | 5     | 5        | -                | Pending         |
| Average True Range            | 5     | 5        | -                | **Implemented** |
| Advance Decline Ratio         | 5     | 1        | ReqSec           | Pending         |
| Advance_Decline Ratio (Bars)  | 5     | 1        | ReqSec           | Pending         |
| 24-hour Volume                | 5     | 0        | ReqSec           | Pending         |

---

## Simple Indicators (Score 0-4)

### Score 0 (Minimal Complexity)

| Indicator                   | TA Funcs | Lines | Status          |
|-----------------------------|----------|-------|-----------------|
| Balance of Power            | 0        | 2     | **Implemented** |
| Bollinger Bars              | 0        | ~10   | Pending         |
| Chaikin Money Flow          | 0        | ~15   | Pending         |
| Momentum                    | 0        | 5     | **Implemented** |
| Rate Of Change              | 0        | ~5    | **Implemented** |
| Time Weighted Average Price | 0        | ~20   | Pending         |
| Ultimate Oscillator         | 0        | ~25   | Pending         |
| Williams Fractals           | 0        | ~15   | Pending         |
| Zig Zag                     | 0        | ~50   | Pending         |

### Score 1 (Basic TA Functions)

| Indicator                      | TA Funcs | Status          |
|--------------------------------|----------|-----------------|
| Accumulation_Distribution      | 1        | **Implemented** |
| Arnaud Legoux Moving Average   | 1        | **Implemented** |
| Average Day Range              | 1        | **Implemented** |
| Average Directional Index      | 1        | Pending         |
| Awesome Oscillator             | 1        | Pending         |
| BBTrend                        | 1        | Pending         |
| Bull Bear Power                | 1        | Pending         |
| Chande Momentum Oscillator     | 1        | Pending         |
| Cumulative Volume Delta        | 1        | Pending         |
| Detrended Price Oscillator     | 1        | Pending         |
| Double EMA                     | 1        | **Implemented** |
| Elder Force Index              | 1        | Pending         |
| Historical Volatility          | 1        | Pending         |
| Hull Moving Average            | 1        | **Implemented** |
| Ichimoku Cloud                 | 1        | Pending         |
| Least Squares Moving Average   | 1        | **Implemented** |
| MA Cross                       | 1        | Pending         |
| Mass Index                     | 1        | **Implemented** |
| McGinley Dynamic               | 1        | **Implemented** |
| Median                         | 1        | Pending         |
| Money Flow Index               | 1        | Pending         |
| Moving Average Weighted        | 1        | **Implemented** |
| Net Volume                     | 1        | Pending         |
| Parabolic SAR                  | 1        | Pending         |
| Price Volume Trend             | 1        | Pending         |
| RCI Ribbon                     | 1        | Pending         |
| Relative Vigor Index           | 1        | Pending         |
| Relative Volume at Time        | 1        | Pending         |
| Smoothed Moving Average        | 1        | Pending         |
| SMI Ergodic Indicator          | 1        | Pending         |
| SMI Ergodic Oscillator         | 1        | Pending         |
| Standard Deviation             | 1        | Pending         |
| Stochastic RSI                 | 1        | Pending         |
| Supertrend                     | 1        | Pending         |
| Trend Strength Index           | 1        | Pending         |
| Triple EMA                     | 1        | **Implemented** |
| True Strength Indicator        | 1        | Pending         |
| Volume Delta                   | 1        | Pending         |
| Volume Oscillator              | 1        | Pending         |
| Volume Weighted Moving Average | 1        | **Implemented** |
| Vortex Indicator               | 1        | Pending         |
| Williams Alligator             | 1        | Pending         |
| Williams %R                    | 1        | Pending         |
| Woodies CCI                    | 1        | Pending         |

### Score 2-4 (Multiple TA Functions)

| Indicator                             | Score | TA Funcs | Status          |
|---------------------------------------|-------|----------|-----------------|
| Aroon                                 | 2     | 2        | Pending         |
| Bollinger Bands %b                    | 2     | 2        | Pending         |
| Bollinger BandWidth                   | 2     | 2        | Pending         |
| Chaikin Oscillator                    | 2     | 2        | Pending         |
| Chande Kroll Stop                     | 2     | 2        | Pending         |
| Chop Zone                             | 2     | 2        | Pending         |
| Choppiness Index                      | 2     | 2        | Pending         |
| Connors RSI                           | 3     | 3        | Pending         |
| Coppock Curve                         | 2     | 2        | Pending         |
| Directional Movement Index            | 4     | 4        | Pending         |
| Donchian Channels                     | 2     | 2        | Pending         |
| Ease of Movement                      | 2     | 2        | Pending         |
| Envelope                              | 2     | 2        | Pending         |
| Fisher Transform                      | 2     | 2        | Pending         |
| Klinger Oscillator                    | 2     | 2        | Pending         |
| Know Sure Thing                       | 4     | 4        | Pending         |
| Moving Average Convergence Divergence | 2     | 2        | Pending         |
| Price Oscillator                      | 2     | 2        | Pending         |
| Stochastic                            | 2     | 2        | **Implemented** |
| Volume Profile Fixed Range            | 4     | 0        | Pending         |
| Volume Profile Visible Range          | 4     | 0        | Pending         |

---

## Implementation Priority Recommendations

### Tier 1: High-Value, Low Complexity (Recommended Next)

These are frequently used indicators with simple implementations:

1. ~~**Relative Strength Index (RSI)**~~ - **IMPLEMENTED**
2. ~~**MACD**~~ - **IMPLEMENTED**
3. ~~**Bollinger Bands**~~ - **IMPLEMENTED**
4. ~~**Stochastic**~~ - **IMPLEMENTED**
5. ~~**Average True Range (ATR)**~~ - **IMPLEMENTED**
6. ~~**Exponential Moving Average (EMA)**~~ - **IMPLEMENTED**
7. ~~**Accumulation/Distribution**~~ - **IMPLEMENTED**
8. ~~**CCI (Commodity Channel Index)**~~ - **IMPLEMENTED**

### Tier 2: Medium Complexity, High Utility

1. **Keltner Channels** - Volatility channels
2. **Ichimoku Cloud** - Comprehensive trend system
3. **Parabolic SAR** - Trend following
4. **Supertrend** - Popular overlay
5. **Donchian Channels** - Breakout system

### Tier 3: Advanced Features (Requires Infrastructure)

These need additional OakScriptJS capabilities:

1. **Auto Fib Retracement/Extension** - Requires drawing API
2. **Pivot Points Standard** - Requires multi-timeframe + drawing
3. **Technical Ratings** - Requires tables + request.security
4. **Volume Profile** - Requires advanced data structures

---

## File Reference

All source PineScript files are located in:

```
docs/official/indicators_standard/
```

Implemented indicators are in:

```
indicators/
```

---

*Last updated: December 2024*
