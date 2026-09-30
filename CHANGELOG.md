# Changelog

All notable changes to OakScriptJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

**Calendar and timeframe functions (issue #99, level 1):**
- `time.year/month/dayofmonth/dayofweek/weekofyear/hour/minute/second(time, timezone)`.
  Time zones: UTC/GMT offset notation (`"UTC-5"`, `"GMT+0530"`, `"UTC+05:30"`, up to ±18:00) or
  time zone database names (`"America/New_York"`, case-sensitive), converted with
  `Intl.DateTimeFormat`. `dayofweek`: Sunday = 1. `weekofyear`: ISO 8601 weeks (Monday start).
- `time.timestamp(dateString)` (RFC 2822 / ISO 8601, GMT+0 when no time zone is given) and
  `time.timestamp(timezone, year, month, day, hour?, minute?, second?)` (a repeated wall-clock
  time gives the later instant, a missing one is shifted forward).
- `time.inSession(time, session, timezone)`: the session test of PineScript
  `time(timeframe, session, timezone)` (`"0930-1600:23456"`, several periods, overnight
  periods, `"24x7"`; several periods without days cover Monday to Friday).
- `timeframe` namespace: `in_seconds(timeframe)` and `from_seconds(seconds)`.
- `oakscriptjs/script` exports `timestamp`, the calendar functions, `inSession` and `timeframe`.

**Inputs (issue #99, level 1):**
- `input.timeframe(defval, title?, { options })`, `input.session(defval, title?, { options })` and
  `input.time(defval, title?)` in `oakscriptjs/script`; `input.timeframe/session/time` in the `input`
  helpers; `input_timeframe`, `input_session`, `input_time` in the runtime. The default is returned as
  written (`"D"` stays `"D"`, `""` is the chart timeframe): see `input-check/doc/README.md`.
- `InputConfig.type` and `InputType` gained `timeframe`, `session` and `time`. `SimpleInputAdapter`
  checks `options` for timeframe and session inputs like for string inputs.

**fixnan and volume variables (issue #99, level 1):**
- `fixnan(source)`: numeric arrays and color arrays in the main entry; Series and color arrays in
  `oakscriptjs/script`.
- `ta.obv`, `ta.pvt`, `ta.accdist`, `ta.nvi`, `ta.pvi`, `ta.iii`, `ta.wad`, `ta.wvad`: context-bound
  Series in `oakscriptjs/script` (PineScript variables), `ta.obv(bars)` in the Series layer and
  `taCore.obv(close, volume)` (and the others) in the array layer. They follow PineScript's
  built-in values: an `na` input adds nothing to the running sums; `ta.iii` is
  `(2 * close - high - low) / (high - low) * volume` (the formula shown in the PineScript reference
  divides by volume too, which does not do).

**map namespace (issue #99, level 1):**
- `map.new_map`, `put`, `put_all`, `get`, `contains`, `remove`, `size`, `clear`, `keys`, `values`,
  `copy`, and the `PineMap<K, V>` type. A map is a JS `Map`: insertion order, exact key equality,
  `put`/`remove` return the previous value or `undefined` (`na`), at most 50,000 pairs
  (`RangeError` above, as the runtime error on PineScript).

**Drawing objects (issue #99, level 1):**
- Drawing registry (`src/drawing/registry.ts`) for lines, labels, boxes, polylines and linefills,
  with the rules: `all()` lists live objects in creation order (a copy);
  `delete` removes the object and makes it `na` (getters return NaN, setters do nothing, `na(obj)`
  is true); `line.delete` also deletes the linefills of the line; when a creation brings the count
  above `max_*_count + 5`, the oldest objects are deleted down to `max_*_count` (default 50; linefills
  use `max_lines_count`); copies count as creations. `executeScript` resets the registry at every run.
- `line.set_first_point` / `set_second_point`, `label.set_point`, `box.set_top_left_point` /
  `set_bottom_right_point` (`point.index` for `bar_index` objects, `point.time` for `bar_time` ones),
  `label.set_text_formatting`, `box.set_text_formatting` and the `text` namespace
  (`format_none` 0, `format_bold` 1, `format_italic` 2, as encodes them).
- `line.all()`, `label.all()`, `box.all()`, `linefill.all()`, `polyline.all()`, and `delete` aliases.
- `oakscriptjs/script`: `line`, `label`, `box`, `linefill`, `polyline` (with `line.all` etc. read as
  properties), `text`, `chart.point` with `chart.point.now(price?)` (current `eachBar` bar), and
  `indicator()` options `max_lines_count`, `max_labels_count`, `max_boxes_count`, `max_polylines_count`.

**Verification:**
- The calendar, timestamp, session and timeframe functions were compared with values computed by
  (30/09/2026): 100,000 calendar values, 256,000 session tests and 227
  timestamp/timeframe/time zone items. See `calendar-check/doc/README.md` for the method, the rules
  found and the 3 remaining differences. The input defaults were checked the same way
  (`input-check/doc/README.md`). The volume variables and `fixnan` match on 381,415
  values over 8 runs (`volume-check/doc/README.md`). The map behaviour was checked with 15 scripts
  and 5 float-key probes (`map-check/doc/README.md`). The drawing rules were checked with 25 scripts
  and 14 per-bar count studies; the registry matches the 14,000 per-bar counts of PineScript
  (`drawing-check/doc/README.md`).

### Changed (breaking)

- `ta.pivothigh` / `ta.pivotlow` (`taCore` and Series layer): the pivot value now appears `rightbars`
  bars after the pivot bar, as in PineScript. Before, it was written on the pivot bar itself, which
  used `rightbars` future bars (lookahead). Ties now follow PineScript: equal values are allowed on
  the left, not on the right; an `na` neighbour ends the check on its side. Code that shifted the
  result by `rightbars` to undo the old placement must remove that shift.
- `ta.cum`: an `na` value now adds nothing to the sum and gives `na` on that bar only, as in
  PineScript. Before, every value after an `na` was NaN.
- `oakscriptjs/script`: `ta.pivothigh(leftbars, rightbars)` and `ta.pivotlow(leftbars, rightbars)`
  (2-argument form on the chart high / low) are accepted.
- Both were: 377,299 values, 0 differences (`pivot-check/doc/README.md`).

**Part B of issue #99: PineScript signatures and behaviour** (checked on PineScript,
see `partb-check/doc/README.md`):
- `ta.highestbars` / `ta.lowestbars` return 0 or negative offsets (0.5.0: positive); ties go to the
  oldest bar. `ta.highest` / `ta.lowest` / `*bars`: an `na` value ends the window.
- `ta.stdev(source, length, biased = true)` skips `na` values; `ta.range(source, length)` (0.5.0:
  `(high, low)`); `ta.max(source)` / `ta.min(source)` are all-time values (0.5.0: element-wise of two
  series); `ta.vwap(source, volume, anchor?, stdev_mult?)` with anchor reset and bands (`vwapBands` in
  the Series layer).
- Script API: `ta.highest(length)`, `ta.lowest(length)`, `ta.highestbars(length)`, `ta.lowestbars(length)`
  on the chart high / low, and `ta.vwap(source, anchor?, stdev_mult?)` with the chart volume.
- `str.tostring` formats as (Java DecimalFormat patterns, half away from zero,
  `format.percent`, `format.volume`; `format.mintick` throws: it needs `syminfo.mintick`).
  `str.format` follows Java MessageFormat (number, integer, percent, currency, patterns, date, time,
  choice). `str.format_time(time, format, timezone)` with Java SimpleDateFormat letters.
- `array.from(...values)` (0.5.0: copy of an array), `array.some(id)` / `array.every(id)` on bool arrays
  (0.5.0: predicate), `array.max(id, nth)` / `array.min(id, nth)`, `array.stdev(id, biased)` /
  `array.variance(id, biased)`; na values are skipped.
- `line.new` / `label.new` / `box.new` accept chart points, `force_overlay` and `text_formatting`;
  `box.new` uses PineScript's parameter order after `bottom` (`border_color, border_width,
  border_style, extend, xloc, bgcolor, ...`); `label.set_yloc(id, yloc)`.

## [0.5.0] - 2026-07-17

### Added

**Tier 1 visual outputs (`oakscriptjs/script`):**
- `plotshape(condition, title?, options)` and `plotchar(condition, title?, options)` —
  per-bar markers where the condition holds. Options: `style`, `location`
  (`abovebar`/`belowbar`/`top`/`bottom`/`absolute`), `color`, `text`, `textcolor`,
  `size`, `offset`, and `tooltip` (extension over PineScript, for label ports).
  Emitted as `IndicatorResult.markers` (`MarkerData[]`); declared as `ShapeConfig`.
- `bgcolor(colors, options?)` and `barcolor(colors, options?)` — per-bar
  background / candle colors from a static color or a per-bar array. Emitted as
  `IndicatorResult.bgcolors` / `barcolors` (`BarColorData[]`); declared as `BarColorConfig`.
- `color.when(cond, colorTrue, colorFalse?)` — `colorFalse` is now optional; an
  omitted false-color leaves the bar uncolored (PineScript `na`), which
  `bgcolor()`/`barcolor()` skip.

**Per-bar execution:**
- `eachBar(fn)` — runs a callback once per bar and collects the returns into a
  Series. Inside the callback values are plain numbers, so native JS operators,
  `if`/`for`/`while` and closure `let` variables replace PineScript
  `var`/`:=`/loops. `c.get(src, k)` is `src[k]`, `c.prev(k)` is self-reference,
  `c.i` is `bar_index`. `seriesOf(values)` wraps a side-output array as a Series.

### Changed
- `ScriptRunResult` gained `shapeConfig` and `barColorConfig`; `IndicatorResult`
  gained optional `markers`, `bgcolors`, `barcolors`. All additive — existing
  consumers are unaffected.
- Fixed the stale `VERSION` constant (was `0.3.0`).

## [0.4.0] - 2026-07-16

### Added

**Script API (`oakscriptjs/script`):**
- New package entry for writing indicators as flat PineScript-style scripts:
  `indicator()`, `input.*` (declares AND returns the current value), `plot()`,
  `hline()`, `fill()`, `alertcondition()` — one statement per fact, no
  calculate() function and no separate config objects
- Context-bound OHLCV builtins (`open`, `high`, `low`, `close`, `volume`,
  `hl2`, `hlc3`, `ohlc4`, `hlcc4`) backed by a shared versioned BarData, so
  derived Series memoize across identical runs
- `ta.*` re-exported with the chart-implicit (bars-first) functions bound to
  the context: `ta.tr(true)`, `ta.atr(14)`, `ta.sar()`, `ta.supertrend()`,
  `ta.dmi()`, `ta.kc()`, `ta.kcw()`, `ta.wpr()`, `ta.ichimoku()`
- `color.when(cond, a, b)` — per-bar conditional colors for plot()/fill();
  `color.new` alias for `new_color`
- `executeScript(body, bars, inputs)` host entry collecting metadata,
  inputConfig/plotConfig/hlineConfig/fillConfig, defaultInputs and the
  IndicatorResult in one run — re-run on data/input changes (the PineScript
  recalculation model)
- `Series.pow(exponent)` — elementwise power

### Changed
- docs/guide.md: replaced the stale OakScriptEngine section (the transpiler
  project no longer exists) with the Script API guide

## [0.1.5] - 2025-12-06

### Added

**Series Enhancements:**
- **BarData Class**: Versioned wrapper around `Bar[]` array for automatic cache invalidation
- **materialize() Method**: Breaks closure chains for memory efficiency
- **barData Property**: Access to underlying BarData source from Series instances

**Transpiler Improvements:**
- Modular architecture with semantic analysis
- Enhanced PineScript compatibility
- Better error reporting and diagnostics
- Fixed builtin function signatures and added missing functions

**Testing:**
- Added comprehensive Series unit tests (453+ test cases)
- Added overlay indicators integration tests
- Added TA-Series integration tests

**Build & CI:**
- Improved indicator generation workflow
- Refactored indicator sources to use docs/official

### Fixed

- Fixed ta-series functions accessing non-existent .data property
- Fixed overlay indicators returning empty plot data
- Fixed .data to .bars references in crossover/crossunder/cross functions

### Performance

- Automatic cache invalidation reduces redundant computation
- Memory-efficient closure chain breaking with `materialize()`
- Better garbage collection for long-running applications

---

## [0.2.1] - 2025-12-05

### Added

**Series Enhancements:**
- **BarData Class**: Versioned wrapper around `Bar[]` array for automatic cache invalidation
  - Tracks version number that increments on mutations (`push()`, `pop()`, `set()`, `updateLast()`, `setAll()`)
  - Series automatically detect stale caches when underlying BarData version changes
  - Backward compatible - Series still accepts `Bar[]` directly
- **materialize() Method**: Breaks closure chains for memory efficiency
  - Eagerly computes values and creates new Series without closure dependencies
  - Useful for complex expressions to free intermediate Series memory
  - Enables better garbage collection in long-running applications
- **barData Property**: Access to underlying BarData source from Series instances

**Transpiler Improvements:**
- Modular architecture with semantic analysis
- Enhanced PineScript compatibility
- Better error reporting and diagnostics

### Performance

- Automatic cache invalidation reduces redundant computation
- Memory-efficient closure chain breaking with `materialize()`
- Better garbage collection for long-running applications

### Examples

```typescript
// Automatic cache invalidation with BarData
const barData = new BarData(bars);
const close = Series.fromBars(barData, 'close');
const values1 = close.toArray(); // Computes and caches

barData.push(newBar); // Increments version
const values2 = close.toArray(); // Detects stale cache, recomputes

// Breaking closure chains for memory efficiency
const complex = a.add(b).mul(c).div(d).sub(e);
const materialized = complex.materialize(); // Breaks closure chain, frees memory
```

---

## [0.2.0] - 2025-11-10

### Major Refactoring - Back to Simplicity

This version represents a significant architectural simplification, removing the DSL layer and focusing on computational primitives.

### Removed (Breaking Changes)

- **DSL Layer**: Removed `indicator()`, `plot()`, `hline()`, `fill()`, `compile()` functions
- **Context API**: Removed `createContext()` and global context management
- **Built-in Series**: Removed global `close`, `open`, `high`, `low`, `volume` variables
- **IndicatorController**: Removed controller infrastructure (moved to OakScriptEngine)

### Changed

- **Architecture**: Simplified to two-layer approach (Core TA + TA-Series wrappers)
- **Series Class**: Standalone lazy evaluation without global context
- **TA-Series Functions**: Now use eager computation (O(n)) instead of lazy (was O(n²))
- **Export Structure**: Clean exports with `ta` namespace and convenience exports

### Added

- **TA-Series Wrapper**: `ta.vwap()` - Volume Weighted Average Price
- **Convenience Exports**: Added `cum` and `vwap` to top-level exports
- **Metadata Types**: Comprehensive types for `IndicatorResult`, `PlotData`, etc.
- **Performance**: All TA-Series functions now O(n) instead of O(n²)

### Fixed

- **CRITICAL**: Fixed O(n²) performance bug in all TA-Series wrappers
  - Before: 26.5 seconds to convert 4 MAs (13,570 bars)
  - After: 2.82ms to convert 4 MAs (13,570 bars)
  - **16,734x performance improvement!**
- **Documentation**: Complete rewrite of README, GUIDE, and INVENTORY
- **Series.offset()**: Verified no data corruption issues (bug report was for old version)

### Performance

**Benchmark (13,570 bars, 4 moving averages):**
- v0.1.3: 47,144ms (47 seconds)
- v0.2.0: 2.82ms (0.003 seconds)
- **Improvement: 16,734x faster**

### Migration Guide from v0.1.x

**Old DSL Approach (v0.1.x):**
```typescript
import { indicator, plot, close, ta, compile } from 'oakscriptjs';

indicator("My Indicator");
const rsi = ta.rsi(close, 14);
plot(rsi);
export default compile();
```

**New Function-Based Approach (v0.2.0):**
```typescript
import {Series, ta, type IndicatorResult} from 'oakscriptjs';

export function myIndicator(bars: any[]): IndicatorResult {
  const close = Series.fromBars(bars, 'close');
  const rsi = ta.rsi(close, 14);

  return {
    metadata: { title: "My Indicator", overlay: false },
    plots: [{
      data: rsi.toArray().map((v, i) => ({ time: bars[i].time, value: v }))
    }]
  };
}
```

### Technical Details

**Files Changed:**
- `src/index.ts` - Simplified exports, removed DSL
- `src/ta-series.ts` - Fixed O(n²) bug in all wrappers, added `vwap()`
- `src/runtime/series.ts` - Standalone Series class
- `src/types/metadata.ts` - New metadata types
- Removed: `src/dsl/*`, `src/context.ts`, `src/indicator/*`

**Lines of Code:**
- Removed: ~3,900 lines (DSL, Context, IndicatorController)
- Added: ~200 lines (metadata types)
- Net: ~3,700 lines removed

### Documentation

- **README.md**: Complete rewrite for v0.2.0 architecture
- **GUIDE.md**: Complete rewrite with function-based examples
- **INVENTORY.md**: Updated to reflect new architecture
- **CHANGELOG.md**: Added (this file)

### Breaking Changes

All DSL-based code will need to be rewritten. The OakScriptEngine transpiler is responsible for generating the new function-based structure.

---

## [0.1.3] - 2025-01-06

### Added

- Complete `ta` namespace (59 functions, 100% coverage)
- Complete `math` namespace (24 functions, 100% coverage)
- Complete `str` namespace (20 functions, 100% coverage)
- Complete `color` namespace (8 functions, 100% coverage)
- Complete `line`, `box`, `label`, `linefill` namespaces
- Drawing objects with computational features
- DSL functions: `indicator()`, `plot()`, `hline()`, `fill()`, `compile()`
- Context API with `createContext()`
- IndicatorController for chart binding

### Known Issues

- O(n²) performance in TA-Series wrappers (fixed in v0.2.0)
- Complex DSL layer with global state (removed in v0.2.0)

---

## [0.1.0] - 2024-12-01

### Initial Release

- Basic TA functions (SMA, EMA, RSI, MACD, etc.)
- Series class for lazy evaluation
- Array-based core functions
- TypeScript support

[0.1.5]: https://github.com/deepentropy/oakscriptJS/compare/v0.1.4-before-monorepo...v0.1.5
[0.2.0]: https://github.com/deepentropy/oakscriptJS/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/deepentropy/oakscriptJS/releases/tag/v0.1.3
[0.1.0]: https://github.com/deepentropy/oakscriptJS/releases/tag/v0.1.0
