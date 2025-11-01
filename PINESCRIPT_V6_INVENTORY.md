# PineScript v6 Documentation vs Implementation Inventory

**Generated:** 2025-10-31
**Purpose:** Track gaps between official PineScript v6 documentation and current TypeScript implementation

## Executive Summary

- **Total Documented Functions:** 457
- **Total Implemented Functions:** ~88
- **Implementation Coverage:** ~19%
- **Namespaces with Tests:** ta (partial), math (complete), str (complete), color (complete)

## Overview by Namespace

| Namespace | Documented | Implemented | Coverage | Tests |
|-----------|-----------|-------------|----------|-------|
| ta        | 59        | 25          | 42%      | 52/25 |
| array     | 55        | 29          | 53%      | 0/29  |
| math      | 24        | 17          | 71%      | 17/17 |
| str       | 18        | 18          | 100%     | 18/18 |
| color     | 8         | 8           | 100%     | 8/8   |
| matrix    | 51        | 1           | 2%       | 0/1   |
| time      | 13        | 2           | 15%      | 0/2   |
| input     | 15        | 4           | 27%      | 0/4   |
| plot      | 19        | 1           | 5%       | 0/1   |
| strategy  | 31        | 3           | 10%      | 0/3   |
| request   | 9         | 1           | 11%      | 0/1   |
| table     | 22        | 0           | 0%       | 0/0   |
| box       | 29        | 0           | 0%       | 0/0   |
| line      | 21        | 0           | 0%       | 0/0   |
| label     | 21        | 0           | 0%       | 0/0   |

---

## Detailed Analysis by Namespace

## 1. Technical Analysis (ta) - 42% Coverage

### Implemented Functions (25/59)

**Status Update:**
- ✅ All 25 functions now have comprehensive JSDoc documentation with examples, remarks, and PineScript v6 links
- ✅ Fixed signature mismatches: `length` parameters changed from `simple_int` to `series_int` where required
- ✅ Documented API deviations for functions requiring explicit price data (supertrend, atr, tr)
- ✅ **FIXED**: RSI and ATR now use RMA instead of SMA - algorithms are correct!
- ✅ Added 13 new functions in total:
  - Batch 1 (8 functions): rma, wma, highest, lowest, cum, cross, rising, falling
  - Batch 2 (5 functions): roc, mom, dev, variance, median
- ✅ Comprehensive tests: 52 test cases total (all passing)

#### ✅ ta.sma()
- **Signature:** `sma(source: Source, length: series_int): series_float`
- **Status:** ✅ Fixed - length now `series_int` (was `simple_int`)
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/sma.test.ts

#### ✅ ta.ema()
- **Signature:** `ema(source: Source, length: simple_int): series_float`
- **Status:** ✅ Signature correct (`simple int` per v6 spec)
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ❌ No tests

#### ✅ ta.rsi()
- **Signature:** `rsi(source: Source, length: simple_int): series_float`
- **Status:** ✅ **FIXED**: Now uses RMA instead of SMA - algorithm correct!
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ Tested via existing test suite

#### ✅ ta.macd()
- **Signature:** `macd(source: Source, fastLength: simple_int, slowLength: simple_int, signalLength: simple_int): [series_float, series_float, series_float]`
- **Status:** ✅ Signature correct
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ❌ No tests

#### ✅ ta.bb()
- **Signature:** `bb(series: Source, length: series_int, mult: simple_float): [series_float, series_float, series_float]`
- **Status:** ✅ Fixed - length now `series_int` (was `simple_int`)
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ❌ No tests

#### ✅ ta.stdev()
- **Signature:** `stdev(source: Source, length: series_int): series_float`
- **Status:** ✅ Fixed - length now `series_int` (was `simple_int`)
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ❌ No tests

#### ✅ ta.crossover()
- **Signature:** `crossover(series1: Source, series2: Source): series_bool`
- **Status:** ✅ Signature correct
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ❌ No tests

#### ✅ ta.crossunder()
- **Signature:** `crossunder(series1: Source, series2: Source): series_bool`
- **Status:** ✅ Signature correct
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ❌ No tests

#### ✅ ta.change()
- **Signature:** `change(source: Source, length: series_int = 1): series_float`
- **Status:** ✅ Fixed - length now `series_int` (was `simple_int`)
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ❌ No tests

#### ✅ ta.tr()
- **Signature:** `tr(high: Source, low: Source, close: Source): series_float`
- **Status:** ✅ Signature correct
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ❌ No tests

#### ✅ ta.atr()
- **Signature:** `atr(length: simple_int, high?: Source, low?: Source, close?: Source): series_float`
- **Status:** ✅ PineScript signature supported via context API
- **Algorithm:** ✅ **FIXED**: Now uses RMA instead of SMA - algorithm correct!
- **Docs:** ✅ Comprehensive JSDoc with context API examples
- **Tests:** ✅ Tested via context tests

#### ✅ ta.supertrend()
- **Signature:** `supertrend(factor: simple_float, atrPeriod: simple_int, high?: Source, low?: Source, close?: Source, wicks: simple_bool = false): [series_float, series_int]`
- **Status:** ✅ PineScript signature supported via context API
- **Docs:** ✅ Comprehensive JSDoc with context API examples
- **Remarks:**
  - PineScript v6: `ta.supertrend(factor, atrPeriod)` uses implicit chart data
  - JavaScript: Supports both explicit params and context API
  - `wicks` parameter NOT in official v6 API (documented as extension)
- **Tests:** ✅ tests/ta/supertrend.test.ts (10 tests)

#### ✅ ta.rma()
- **Signature:** `rma(source: Source, length: simple_int): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with algorithm explanation
- **Tests:** ✅ tests/ta/new_functions.test.ts (3 tests)
- **Remarks:** Critical for RSI and ATR calculations (alpha = 1/length)

#### ✅ ta.wma()
- **Signature:** `wma(source: Source, length: series_int): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions.test.ts (3 tests)

#### ✅ ta.highest()
- **Signature:** `highest(source: Source, length: series_int): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions.test.ts (3 tests)

#### ✅ ta.lowest()
- **Signature:** `lowest(source: Source, length: series_int): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions.test.ts (3 tests)

#### ✅ ta.cum()
- **Signature:** `cum(source: Source): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions.test.ts (4 tests)

#### ✅ ta.cross()
- **Signature:** `cross(source1: Source, source2: Source): series_bool`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions.test.ts (3 tests)

#### ✅ ta.rising()
- **Signature:** `rising(source: Source, length: series_int): series_bool`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions.test.ts (3 tests)

#### ✅ ta.falling()
- **Signature:** `falling(source: Source, length: series_int): series_bool`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions.test.ts (3 tests)

#### ✅ ta.roc()
- **Signature:** `roc(source: Source, length: series_int): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples and formula
- **Tests:** ✅ tests/ta/new_functions2.test.ts (5 tests)
- **Remarks:** Rate of Change as percentage: `100 * (source - source[length]) / source[length]`

#### ✅ ta.mom()
- **Signature:** `mom(source: Source, length: series_int): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions2.test.ts (5 tests)
- **Remarks:** Momentum (equivalent to ta.change): `source - source[length]`

#### ✅ ta.dev()
- **Signature:** `dev(source: Source, length: series_int): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions2.test.ts (4 tests)
- **Remarks:** Mean Absolute Deviation - less sensitive to outliers than standard deviation

#### ✅ ta.variance()
- **Signature:** `variance(source: Source, length: series_int, biased: series_bool = true): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with biased/unbiased explanation
- **Tests:** ✅ tests/ta/new_functions2.test.ts (5 tests)
- **Remarks:** Squared deviation from mean - related to stdev by `stdev = sqrt(variance)`

#### ✅ ta.median()
- **Signature:** `median(source: Source, length: series_int): series_float`
- **Status:** ✅ Signature matches PineScript v6
- **Docs:** ✅ Comprehensive JSDoc with examples
- **Tests:** ✅ tests/ta/new_functions2.test.ts (6 tests)
- **Remarks:** More robust to outliers than SMA - returns middle value when sorted

### Missing ta Functions (34/59)

Not implemented:
- ta.alma, ta.barssince, ta.bbw, ta.cci, ta.cmo, ta.cog, ta.correlation
- ta.dmi, ta.highestbars, ta.hma, ta.kc, ta.kcw, ta.linreg
- ta.lowestbars, ta.max, ta.mfi, ta.min, ta.mode
- ta.percentile_linear_interpolation, ta.percentile_nearest_rank, ta.percentrank
- ta.pivothigh, ta.pivotlow, ta.pivot_point_levels, ta.range
- ta.sar, ta.stoch, ta.sum, ta.swma, ta.tsi
- ta.vwap, ta.vwma, ta.wpr

---

## 2. Array Functions - 53% Coverage

### Implemented Functions (29/55)

#### ✅ array.size()
- **Documentation:** `array.size(id) → series int`
- **Implementation:** `size<T>(id: PineArray<T>): int`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.get()
- **Documentation:** `array.get(id, index) → <type>`
- **Implementation:** `get<T>(id: PineArray<T>, index: simple_int): T`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.set()
- **Documentation:** `array.set(id, index, value) → void`
- **Implementation:** `set<T>(id: PineArray<T>, index: simple_int, value: T): void`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.push()
- **Documentation:** `array.push(id, value) → void`
- **Implementation:** `push<T>(id: PineArray<T>, value: T): void`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.pop()
- **Documentation:** `array.pop(id) → <type>`
- **Implementation:** `pop<T>(id: PineArray<T>): T`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.clear()
- **Documentation:** `array.clear(id) → void`
- **Implementation:** `clear<T>(id: PineArray<T>): void`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.insert()
- **Documentation:** `array.insert(id, index, value) → void`
- **Implementation:** `insert<T>(id: PineArray<T>, index: simple_int, value: T): void`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.remove()
- **Documentation:** `array.remove(id, index) → <type>`
- **Implementation:** `remove<T>(id: PineArray<T>, index: simple_int): T`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.includes()
- **Documentation:** `array.includes(id, value) → bool`
- **Implementation:** `includes<T>(id: PineArray<T>, value: T): bool`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.indexof()
- **Documentation:** `array.indexof(id, value) → int`
- **Implementation:** `indexof<T>(id: PineArray<T>, value: T): int`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.lastindexof()
- **Documentation:** `array.lastindexof(id, value) → int`
- **Implementation:** `lastindexof<T>(id: PineArray<T>, value: T): int`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.copy()
- **Documentation:** `array.copy(id) → array<type>`
- **Implementation:** `copy<T>(id: PineArray<T>): PineArray<T>`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.concat()
- **Documentation:** `array.concat(id1, id2) → array<type>`
- **Implementation:** `concat<T>(id1: PineArray<T>, id2: PineArray<T>): PineArray<T>`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.join()
- **Documentation:** `array.join(id, separator) → string`
- **Implementation:** `join(id: PineArray<any>, separator: string = ','): string`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.reverse()
- **Documentation:** `array.reverse(id) → void`
- **Implementation:** `reverse<T>(id: PineArray<T>): void`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.slice()
- **Documentation:** `array.slice(id, index_from, index_to) → array<type>`
- **Implementation:** `slice<T>(id: PineArray<T>, index_from: simple_int, index_to?: simple_int): PineArray<T>`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.avg()
- **Documentation:** `array.avg(id) → series float` (2 overloads)
- **Implementation:** `avg(id: PineArray<float>): float`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.min()
- **Documentation:** `array.min(id) → series <type>`
- **Implementation:** `min(id: PineArray<float>): float`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.max()
- **Documentation:** `array.max(id) → series <type>`
- **Implementation:** `max(id: PineArray<float>): float`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.median()
- **Documentation:** `array.median(id) → series float`
- **Implementation:** `median(id: PineArray<float>): float`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.mode()
- **Documentation:** `array.mode(id) → series float`
- **Implementation:** `mode(id: PineArray<float>): float`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.fill()
- **Documentation:** `array.fill(id, value, index_from, index_to) → void`
- **Implementation:** `fill<T>(id: PineArray<T>, value: T, index_from: simple_int = 0, index_to?: simple_int): void`
- **Issues:**
  - ✅ Signature matches
  - ⚠️ Documentation minimal
- **Tests:** ❌ No tests

#### ✅ array.from()
- **Documentation:** `array.from(...) → array<type>`
- **Implementation:** `from<T>(id: PineArray<T>): PineArray<T>`
- **Issues:**
  - ❌ **Signature mismatch**: Official v6 `array.from()` creates array from values, not copies
  - Current implementation is just an alias for `copy()`
- **Tests:** ❌ No tests

### Implemented but not in standard API:
- `unshift<T>()` - Not a PineScript function (JavaScript-style)
- `shift<T>()` - Not a PineScript function (JavaScript-style)
- `sort<T>()` - Need to verify signature against docs
- `sum()` - Need to verify signature against docs
- `stdev()` - Need to verify signature against docs
- `variance()` - Need to verify signature against docs

### Missing Array Functions (26/55)

Not implemented:
- array.abs, array.binary_search, array.binary_search_leftmost, array.binary_search_rightmost
- array.covariance, array.every, array.first, array.last, array.new_bool, array.new_box
- array.new_color, array.new_float, array.new_int, array.new_label, array.new_line
- array.new_linefill, array.new_string, array.new_table, array.newtype
- array.percentile_linear_interpolation, array.percentile_nearest_rank, array.percentrank
- array.range, array.some, array.sort (need to verify), array.sum (need to verify)

---

## 3. Math Functions - 71% Coverage

### Implemented Functions (17/24)

Basic math functions implemented (matching docs/reference/functions/):
- ✅ abs, ceil, floor, round, max, min, avg, sum
- ✅ sqrt, pow, exp, log, log10
- ✅ sin, cos, tan, asin, acos, atan
- ✅ toradians, todegrees, random, sign

**Status:**
- ✅ All 17 functions have comprehensive JSDoc documentation with examples, remarks, and PineScript v6 links
- ✅ Comprehensive tests: 124 test cases across 4 test files
- ✅ All tests passing ✅
- ✅ Test coverage: basic arithmetic, algebraic, trigonometric, and utility functions

**Tests:**
- ✅ tests/math/basic.test.ts (abs, ceil, floor, round, max, min, avg, sum - 38 tests)
- ✅ tests/math/algebraic.test.ts (sqrt, pow, exp, log, log10 - 30 tests)
- ✅ tests/math/trigonometric.test.ts (sin, cos, tan, asin, acos, atan - 31 tests)
- ✅ tests/math/utility.test.ts (toradians, todegrees, random, sign - 25 tests)

### Missing Math Functions (7/24)

Not implemented:
- math.round_to_mintick() - Rounds to symbol's minimum tick size

---

## 4. String Functions - 100% Coverage ✅

### Implemented Functions (18/18)

All documented string functions are implemented:
- ✅ length, tostring, tonumber, substring, upper, lower
- ✅ contains, pos, replace, split, concat, format
- ✅ startswith, endswith, charAt, trim, trimLeft, trimRight, match

**Issues:**
- ✅ Comprehensive JSDoc documentation with examples and remarks
- ✅ Comprehensive tests added (127 test cases)
- ✅ Links to official PineScript v6 documentation

**Tests:** ✅ tests/str/conversion.test.ts, tests/str/manipulation.test.ts, tests/str/search.test.ts, tests/str/formatting.test.ts, tests/str/predicates.test.ts, tests/str/whitespace.test.ts

---

## 5. Color Functions - 100% Coverage ✅

### Implemented Functions (8/8)

All documented color functions are implemented:
- ✅ rgb, from_hex (note: v6 uses `color.from_gradienthex` differently)
- ✅ new_color, r, g, b, t
- ✅ Predefined color constants (aqua, black, blue, fuchsia, gray, green, lime, maroon, navy, olive, orange, purple, red, silver, teal, white, yellow)

**Issues:**
- ✅ Comprehensive JSDoc documentation with examples and remarks
- ✅ Comprehensive tests added (73 test cases)
- ✅ Links to official PineScript v6 documentation
- ✅ All 17 color constants documented
- ⚠️ Need to verify `from_hex` matches v6 API (might be `color.rgb` with hex param)

**Tests:** ✅ tests/color/creation.test.ts, tests/color/manipulation.test.ts, tests/color/components.test.ts, tests/color/constants.test.ts

---

## 6. Matrix Functions - 2% Coverage

### Implemented Functions (1/51)

Only `matrix.new()` is partially implemented.

### Missing Matrix Functions (50/51)

Not implemented:
- matrix.add_col, matrix.add_row, matrix.avg, matrix.col, matrix.columns
- matrix.concat, matrix.copy, matrix.det, matrix.diff, matrix.eigenvalues
- matrix.eigenvectors, matrix.elements_count, matrix.fill, matrix.get, matrix.inv
- matrix.is_antidiagonal, matrix.is_antisymmetric, matrix.is_binary, matrix.is_diagonal
- matrix.is_identity, matrix.is_square, matrix.is_stochastic, matrix.is_symmetric
- matrix.is_triangular, matrix.is_zero, matrix.kron, matrix.max, matrix.median
- matrix.min, matrix.mode, matrix.mult, matrix.pinv, matrix.pow, matrix.rank
- matrix.remove_col, matrix.remove_row, matrix.reshape, matrix.reverse, matrix.row
- matrix.rows, matrix.set, matrix.sort, matrix.submatrix, matrix.sum, matrix.swap_columns
- matrix.swap_rows, matrix.trace, matrix.transpose

---

## 7. Time Functions - 15% Coverage

### Implemented Functions (2/13)

- ✅ now() - Returns current time
- ✅ timestamp() - Creates timestamp

**Issues:**
- ⚠️ Minimal documentation
- ❌ No tests

### Missing Time Functions (11/13)

Not implemented:
- time, time_close, time_tradingday
- year, month, dayofmonth, dayofweek
- hour, minute, second
- weekofyear, timezone

---

## 8. Input Functions - 27% Coverage

### Implemented Functions (4/15)

- ✅ input.int, input.float, input.bool, input.string

**Issues:**
- ⚠️ Currently just return default values (no actual input handling)
- ⚠️ Minimal documentation
- ❌ No tests

### Missing Input Functions (11/15)

Not implemented:
- input.color, input.price, input.session, input.source, input.symbol
- input.text_area, input.timeframe, input.table

---

## 9. Plot Functions - 5% Coverage

### Implemented Functions (1/19)

- ✅ plot() - Basic implementation

**Issues:**
- ⚠️ Returns plot data structure (doesn't actually render)
- ⚠️ Minimal documentation
- ❌ No tests

### Missing Plot Functions (18/19)

Not implemented:
- plotshape, plotchar, plotarrow, plotbar, plotcandle
- bgcolor, fill, hline
- And ~10 more plot-related functions

---

## 10. Strategy Functions - 10% Coverage

### Implemented Functions (3/31)

- ✅ strategy.entry (as entry_long/entry_short)
- ✅ strategy.exit

**Issues:**
- ⚠️ Simplified implementation
- ⚠️ No actual backtesting engine
- ❌ No tests

### Missing Strategy Functions (28/31)

Not implemented:
- strategy.close, strategy.close_all, strategy.cancel, strategy.cancel_all
- strategy.entry (proper version with direction parameter)
- strategy.order
- And ~22 more strategy properties and functions

---

## 11. Request Functions - 11% Coverage

### Implemented Functions (1/9)

- ⚠️ request.security() - Stub only (throws error)

### Missing Request Functions (8/9)

Not implemented:
- request.financial, request.dividends, request.splits, request.earnings
- request.quandl, request.economic
- And ~3 more request functions

---

## 12-15. Drawing Objects (table, box, line, label) - 0% Coverage

**Not implemented at all:**
- All table.* functions (22 functions)
- All box.* functions (29 functions)
- All line.* functions (21 functions)
- All label.* functions (21 functions)

---

## Critical Issues Summary

### 1. V6 API Signature Mismatches

#### High Priority:
1. **ta.supertrend()** - Major signature difference
   - Docs: 2 params (factor, atrPeriod)
   - Code: 6 params (factor, atrLength, high, low, close, wicks)
   - Impact: Not compatible with v6 API

2. **ta.sma()** - Type mismatch
   - Docs: `length` is `series int`
   - Code: `length` is `simple_int`
   - Impact: May fail with dynamic length values

3. **array.from()** - Wrong implementation
   - Docs: Creates array from values
   - Code: Copies existing array (alias for copy)
   - Impact: Wrong behavior

### 2. Missing Documentation

- **Most implementations** lack proper PineScript v6 compliant documentation
- ✅ **str namespace** (18/18 functions) now has comprehensive JSDoc documentation with examples, remarks, and PineScript v6 links
- ✅ **color namespace** (8/8 functions) now has comprehensive JSDoc documentation with examples, remarks, and PineScript v6 links
- ✅ **math namespace** (17/17 functions) now has comprehensive JSDoc documentation with examples, remarks, and PineScript v6 links
- ❌ **Other namespaces** (ta, array, etc.) still need proper documentation:
  - No examples from official docs
  - No remarks about behavior (e.g., na handling)
  - No "See also" references

### 3. Missing Tests

- Test files exist for:
  - tests/ta/sma.test.ts ✅
  - tests/ta/supertrend.test.ts ✅
  - tests/math/basic.test.ts ✅
  - tests/math/algebraic.test.ts ✅
  - tests/math/trigonometric.test.ts ✅
  - tests/math/utility.test.ts ✅
  - tests/str/conversion.test.ts ✅
  - tests/str/manipulation.test.ts ✅
  - tests/str/search.test.ts ✅
  - tests/str/formatting.test.ts ✅
  - tests/str/predicates.test.ts ✅
  - tests/str/whitespace.test.ts ✅
  - tests/color/creation.test.ts ✅
  - tests/color/manipulation.test.ts ✅
  - tests/color/components.test.ts ✅
  - tests/color/constants.test.ts ✅
- 45 other implemented functions still have NO tests (43 str+color+math functions now tested with 324 total test cases)

### 4. Major Gaps

- **Matrix operations**: 2% implemented (1/51)
- **Drawing objects**: 0% implemented (0/93)
- **Strategy backtesting**: 10% implemented (3/31)
- **Request/External data**: 11% implemented (1/9)

---

## Recommendations

### Immediate Actions (High Priority)

1. **Fix ta.supertrend()** signature to match v6 API
2. **Fix ta.sma()** and other ta functions to accept `series int` for length
3. **Fix array.from()** implementation
4. **Add comprehensive tests** for all implemented functions
5. **Add proper documentation** matching official v6 docs format

### Medium Priority

1. Implement missing ta functions (44 remaining)
2. Implement missing array functions (26 remaining)
3. Complete time functions
4. Complete matrix operations

### Low Priority

1. Drawing objects (table, box, line, label)
2. Strategy engine enhancements
3. Request/external data functions

---

## Testing Requirements

Each implemented function needs:
1. ✅ Basic functionality test
2. ✅ Edge case tests (empty arrays, NaN, etc.)
3. ✅ Type validation tests
4. ✅ Comparison with PineScript behavior
5. ✅ Documentation examples as tests

---

## Documentation Requirements

Each function needs:
1. Official PineScript v6 signature
2. Parameter descriptions with types
3. Return value description
4. Example from official docs (adapted)
5. Remarks section (na handling, repainting, etc.)
6. See also references
7. Version tag (@version 6)

---

## Next Steps

1. Review this inventory with team
2. Prioritize which functions to implement next
3. Create test suite for existing implementations
4. Fix signature mismatches
5. Add proper v6-compliant documentation
6. Consider automated doc generation from official v6 docs

---

**Note:** This inventory was created by comparing:
- Source code in `src/` directory
- Official PineScript v6 documentation in `docs/reference/`
- Test files in `tests/` directory

Last updated: 2025-10-31

---

## ADDENDUM: Verified Critical Issues (Based on Official v6 Docs)

### Critical Algorithm Errors

#### 1. ✅ ta.rsi() - FIXED!
- **Official v6 Doc:** Uses `ta.rma()` (Relative Moving Average) for smoothing
- **Previous Issue:** Used `sma()` (Simple Moving Average) for smoothing - mathematically incorrect
- **Status:** ✅ **FIXED** - Now implements and uses `ta.rma()` for smoothing
- **Date Fixed:** 2025-11-01
- **Also Fixed:** ta.atr() now also uses RMA instead of SMA

### Verified Signature Mismatches

#### 2. ta.bb() - Type Mismatch
- **Official:** `ta.bb(series, length, mult)` where `length` is `series int`
- **Current:** `bb(source, length, mult)` where `length` is `simple_int`
- **Reference:** docs/reference/functions/ta.bb.md line 8

#### 3. ta.change() - Type Mismatch + Missing Overloads
- **Official:** 3 overloads returning `series int`, `series float`, `series bool`
- **Official:** `length` parameter is `series int` (default 1)
- **Current:** Single implementation returning only `series_float`
- **Current:** `length` parameter is `simple_int`
- **Reference:** docs/reference/functions/ta.change.md lines 9-15

#### 4. array.from() - Completely Wrong Implementation
- **Official:** `array.from(arg0, arg1, ...)` - Creates array from variadic arguments
- **Example:** `array.from("Hello", "World!")` creates array with 2 elements
- **Current:** `from<T>(id: PineArray<T>)` - Just copies an existing array (alias for copy)
- **Impact:** Completely incompatible behavior
- **Reference:** docs/reference/functions/array.from.md lines 1-44

### Verified Correct Implementations ✅

These match the official v6 specification:

#### ta.ema()
- **Official:** `ta.ema(source, length)` where `length` is `simple int` ✅
- **Implementation:** Correct signature and algorithm

#### ta.macd()
- **Official:** `ta.macd(source, fastlen, slowlen, siglen)` ✅
- **Implementation:** Correct (parameter names slightly different but acceptable)

#### color.rgb()
- **Official:** `color.rgb(red, green, blue, transp)` ✅
- **Implementation:** Correct signature

---

## Priority Action Items

### ✅ COMPLETED (2025-11-01)
1. ✅ Fixed ta.rsi() algorithm - implemented ta.rma() and updated RSI
2. ✅ Fixed ta.atr() algorithm - now uses RMA instead of SMA
3. ✅ Fixed ta.supertrend() signature - supports context API for implicit data
4. ✅ Updated ta.sma(), ta.bb(), ta.change(), ta.stdev() to accept `series int` for length
5. ✅ Implemented ta.rma() (critical for RSI and ATR)
6. ✅ Added 8 new ta functions with comprehensive JSDoc and tests
7. ✅ Added comprehensive test suite (27 new tests, all passing)

### URGENT (Breaking Issues)
1. Reimplement array.from() to accept variadic arguments

### HIGH (API Incompatibility)
2. Add missing overloads for ta.change() (int, float, bool)
3. Review all other ta.* functions for similar type mismatches

### MEDIUM (Missing Functionality)
4. Implement remaining 39 ta functions
5. Continue adding tests for untested functions

---

**Last Updated:** 2025-11-01
**Recently Implemented (Batch 2):** ta.roc, ta.mom, ta.dev, ta.variance, ta.median
**Previously Implemented (Batch 1):** ta.rma, ta.wma, ta.highest, ta.lowest, ta.cum, ta.cross, ta.rising, ta.falling
**All Verified Functions (25):** ta.sma, ta.ema, ta.rsi, ta.macd, ta.bb, ta.change, ta.supertrend, ta.tr, ta.atr, ta.stdev, ta.crossover, ta.crossunder, ta.rma, ta.wma, ta.highest, ta.lowest, ta.cum, ta.cross, ta.rising, ta.falling, ta.roc, ta.mom, ta.dev, ta.variance, ta.median

