# Changelog

All notable changes to OakScriptJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `linestyle` of plots (`'solid' | 'dashed' | 'dotted'`, as for hlines; PineScript `plot(..., linestyle)`) in
  `PlotConfig`, `PlotOptions` and the script API `plot()` options, passed to the plot config. Not set means solid.
  PineScript accepts it with every plot style; the value is a constant or an input, not a per-bar series (#105).
- Script API constants: `plot.style_*` (line, linebr, stepline, steplinebr, stepline_diamond, histogram, columns,
  area, areabr, circles, cross), `plot.linestyle_solid / _dotted / _dashed`, `hline.style_solid / _dotted / _dashed`.
  `stepline_diamond` is added to the plot style type.

### Changed

- `hline()` draws dashed when no line style is given, as PineScript: the script API sets `linestyle: 'dashed'` in the
  hline config, and the runtime `hline()` draws dashed (before: not set / solid).

### Fixed

- `color.new` and `color.rgb` clamp the transparency to 0..100 (`color.new(c, 140)` is fully transparent,
  `color.new(c, -5)` is opaque; before: an invalid `rgba()` text); an `na` transparency is fully transparent (#102).
- `color.rgb` takes an `na` channel as 0 (`color.rgb(255, 0, na)` is red; before: `'rgb(255, 0, NaN)'`) and truncates
  a fractional channel (`127.6` is 127; before: the text kept the fraction and `color.r` read it as black) (#102).
- `color.t` returns an integer, from the alpha byte (`color.t(color.new(c, 33.3))` is 33) (#102).
- `color.from_gradient` truncates the mixed alpha byte, and mixes the channels in another operation order. On 5,000
  PineScript cases the alpha is equal on all (before: 2,649), the RGB channels on 4,627 (before: 3,724); the other
  cases differ by 1 unit, when the exact channel is an integer (#102).
- `ta.percentrank` gives a value from bar `length` on when the current value is not na; an na value in the window
  counts as not `<=` (before: na until the window held `length` non-na values). The comparison uses the 1e-10
  tolerance (#103).
- `ta.percentile_linear_interpolation`: position `p / 100 * length - 0.5` in the sorted window (before:
  `p / 100 * (length - 1)`); na values stay in the window (before: an na in the window gave na) (#104).
- `ta.percentile_nearest_rank`: rank `ceil(p / 100 * length)` of the full window, na values included (before: the na
  values were removed) (#104).
- Both `ta.percentile_*` functions keep the window sorted from bar to bar, as PineScript: the new value is inserted
  before the first value `>=` it (passing the na values; an na goes last), then the value leaving the window is
  removed. The place of an na value depends on the history (at the start of a series, before all numbers) (#104).
- `array.percentile_linear_interpolation` / `array.percentile_nearest_rank` no longer use the `ta.*` functions:
  same position / rank formulas, na values sorted after the numbers; with an na in the array, a position between two
  values gives na (#104).
- `ta.rising` / `ta.falling` skip na values (the steps are between the last `length + 1` non-na values; before: a step
  with an na value counted as a rise / fall) and need a step larger than the 1e-10 tolerance (#104).

## [0.8.0] - 2026-09-30

### Added

- `callsite` namespace: per-call history of `ta.*` calls in a conditional block. `callsite.whenCalled(called, fn,
  ...sources)` runs an array function on the bars where the call runs only; `callsite.crossover()`,
  `callsite.crossunder()` and `callsite.cross()` are stateful call sites for bar loops (false on their first call).
- Script API chart context: `mintick`, `pointvalue`, `mincontract`, read as `syminfo.mintick`, `syminfo.pointvalue`,
  `syminfo.mincontract`. The script API `math.round_to_mintick(x)` uses `syminfo.mintick` when no tick is given.
- Script API `strategy()` declaration and `strategy.*` API. OakScriptJS does not fill orders: the host passes an
  order engine (`StrategyEngine`) in `executeScript(body, bars, inputs, chart, { strategyEngine })`, and the order
  calls (`entry`, `order`, `exit`, `close`, `close_all`, `cancel`, `cancel_all`), the `strategy.*` variables, the
  trades (`strategy.opentrade(i)`, `strategy.closedtrade(i)`), `strategy.risk.*` and `strategy.default_entry_qty`
  are forwarded to it. `strategy.eachBar(fn)` runs the strategy logic per bar between the engine's `processBar(i)`
  and `processClose(i)`. The run result has the resolved properties in `strategyConfig` (PineScript defaults in
  `STRATEGY_DEFAULTS`).
- `at(source, i, offset)`: history reference `x[offset]` on arrays; a negative offset throws. `div(a, b)`: division
  where `a / 0` is na. `getSource(bars, name)` is exported from the main entry point.

### Fixed

- `ta.tr(false)` (the default) returns na on bar 0, where the previous close is na (before: `high - low`).
  `ta.atr` uses `ta.tr(true)`.
- `ta.dmi` follows the PineScript reference: +DM and -DM are na on bar 0, the true range is `ta.tr` (na on bar 0),
  +DI / -DI keep the previous value when the smoothed true range is 0 (`fixnan`), comparisons use the 1e-10
  tolerance. The first +DI / -DI value is one bar later than before, and the early values differ until the RMA
  smoothing converges.
- `ta.kc` with `useTrueRange` uses `ta.tr` (na on bar 0), as the PineScript reference: the bands start one bar
  later.
- `ta.mfi` follows the reference formula: a bar with an na change (bar 0) adds its money flow to both sums, so the
  first value is on bar `length - 1`, and a change within 1e-10 of 0 counts as unchanged.

## [0.7.2] - 2026-09-30

### Changed

- Documentation comments reworded. No change in behaviour.

## [0.7.1] - 2026-09-30

### Fixed

na handling of window functions:
- `ta.sma`, `math.sum`, `ta.variance` (and `ta.vwma`, `ta.bb`): the last `length` non-na values; a bar with an na
  source keeps the previous result (before: na for every window with an na value).
- `ta.ema`: na on a bar with an na source, then continues from the last value (before: the previous value).
- `ta.wma` (and `ta.hma`): na on a bar with an na source; otherwise the last `length` bars with each na replaced by the
  previous value.
- `ta.dev` / `ta.cci`: unchanged behaviour (na when the window holds an na value), now independent of `ta.sma`.

## [0.7.0] - 2026-09-30

### Added

- Gradient fills (issue #83): `FillData.gradient` and `FillConfig.gradient` (`FillGradient`: per-bar `topValue`,
  `bottomValue`, `topColor`, `bottomColor`). Script API `fill()` follows the three PineScript overloads with positional
  arguments: `fill(p1, p2, color, title)` and `fill(p1, p2, top_value, bottom_value, top_color, bottom_color, title)`
  for plots and hlines (values: number or Series; colours: colour, na or `color.when()` array). The options object
  form still works.

### Fixed

- `color.from_gradient` follows PineScript: premultiplied byte alpha, truncated channels, transparent result for na
  inputs or an empty range, hex colours with alpha (before: its own parser lost the alpha of `#RRGGBBAA`).

## [0.6.1] - 2026-09-30

### Fixed

- Comparison operators: new `compare` namespace (`eq`, `ne`, `lt`, `le`, `gt`, `ge`, `EPSILON`) with PineScript's
  absolute tolerance of 1e-10 (`0.1 + 0.2 == 0.3` is true) and false for an `na` operand. The `Series` methods
  `gt`, `gte`, `lt`, `lte`, `eq`, `neq` use it (before: exact comparisons; `neq` was true with `na`).
- `ta.rsi`: a change from or to `na` is `na`, not a 0 gain / loss. `ta.rma`: an `na` source gives `na` on that bar
  (the next bar continues from the last value).
- `color.new`, `color.r/g/b/t`: hex colours (`#RRGGBB`, `#RRGGBBAA`) are read; before they became black.

### Changed

- The `color` constants are the PineScript v6 palette (for example `color.green` #4CAF50,
  `color.red` #F23645, `color.teal` #089981); before they were HTML colours (`#00FF00`, `#FF0000`, `#008080`).
  Charts that use these constants change colour.

## [0.6.0] - 2026-09-30

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
  written, as in PineScript (`"D"` stays `"D"`, `""` is the chart timeframe).
- `InputConfig.type` and `InputType` gained `timeframe`, `session` and `time`. `SimpleInputAdapter`
  checks `options` for timeframe and session inputs like for string inputs.

**fixnan and volume variables (issue #99, level 1):**
- `fixnan(source)`: numeric arrays and color arrays in the main entry; Series and color arrays in
  `oakscriptjs/script`.
- `ta.obv`, `ta.pvt`, `ta.accdist`, `ta.nvi`, `ta.pvi`, `ta.iii`, `ta.wad`, `ta.wvad`: context-bound
  Series in `oakscriptjs/script` (PineScript variables), `ta.obv(bars)` in the Series layer and
  `taCore.obv(close, volume)` (and the others) in the array layer. They follow the PineScript
  built-in values: an `na` input adds nothing to the running sums; `ta.iii` is
  `(2 * close - high - low) / (high - low) * volume` (the formula shown in the PineScript reference
  divides by volume too, which the built-in value does not do).

**map namespace (issue #99, level 1):**
- `map.new_map`, `put`, `put_all`, `get`, `contains`, `remove`, `size`, `clear`, `keys`, `values`,
  `copy`, and the `PineMap<K, V>` type. A map is a JS `Map`: insertion order, exact key equality,
  `put`/`remove` return the previous value or `undefined` (`na`), at most 50,000 pairs
  (`RangeError` above, as the PineScript runtime error).

**Drawing objects (issue #99, level 1):**
- Drawing registry (`src/drawing/registry.ts`) for lines, labels, boxes, polylines and linefills,
  with the PineScript rules: `all()` lists live objects in creation order (a copy);
  `delete` removes the object and makes it `na` (getters return NaN, setters do nothing, `na(obj)`
  is true); `line.delete` also deletes the linefills of the line; when a creation brings the count
  above `max_*_count + 5`, the oldest objects are deleted down to `max_*_count` (default 50; linefills
  use `max_lines_count`); copies count as creations. `executeScript` resets the registry at every run.
- `line.set_first_point` / `set_second_point`, `label.set_point`, `box.set_top_left_point` /
  `set_bottom_right_point` (`point.index` for `bar_index` objects, `point.time` for `bar_time` ones),
  `label.set_text_formatting`, `box.set_text_formatting` and the `text` namespace
  (`format_none` 0, `format_bold` 1, `format_italic` 2, as PineScript encodes them).
- `line.all()`, `label.all()`, `box.all()`, `linefill.all()`, `polyline.all()`, and `delete` aliases.
- `oakscriptjs/script`: `line`, `label`, `box`, `linefill`, `polyline` (with `line.all` etc. read as
  properties), `text`, `chart.point` with `chart.point.now(price?)` (current `eachBar` bar), and
  `indicator()` options `max_lines_count`, `max_labels_count`, `max_boxes_count`, `max_polylines_count`.

**Chart context (issue #100):**
- `executeScript(body, bars, inputs, chart)`: `chart` gives the chart timeframe, the exchange time zone,
  the session type, the session of the bars and the regular hours in the symbol session format (hours,
  corrections, holidays), and the unit of `Bar.time` (default seconds).
- `oakscriptjs/script`: `timeframe.period / multiplier / isintraday / isdaily / isweekly / ismonthly /
  isminutes / isseconds / isticks / isdwm / main_period`, `timeframe.in_seconds()` of the chart,
  `timeframe.change(tf)`; `syminfo.timezone / session`; calendar functions, `timestamp(y, m, d...)`,
  `str.format_time` and `str.format` dates in the exchange time zone by default; `time` and `time_close`
  as Series that can be called (`time("D")`, `time_close("W")`, `time(tf, session, timezone)`);
  `time_tradingday`; `session.isfirstbar / islastbar / ismarket / ispremarket / ispostmarket /
  isfirstbar_regular / islastbar_regular`; `ta.vwap(source)` restarts each trading day.
- Trading calendar (`src/session`): symbol session format with `F` day offsets, dated session
  changes, corrections (early closes, days off) and holidays.

**Same-symbol request.security (issue #101):**
- `oakscriptjs/script`: `request.security(symbol, timeframe, expression, gaps?, lookahead?)` for the chart
  symbol (`syminfo.tickerid`, `""`, `ticker.heikinashi(...)`, `ticker.standard(...)`) and a timeframe equal to
  or higher than the chart's. The higher-timeframe bars are built from the chart bars with the session rules
  of #100 (D / W / M periods follow the regular hours); `expression` is a function that runs on them and may
  return a Series, a number or a tuple. `barmerge.*`, `ticker.*`, `syminfo.tickerid` (chart context
  `tickerid`). Other symbols and lower timeframes throw.
- Values differ where the exchange's bars differ from bars built from the chart (official auction prices,
  settlement, consolidated volume).

**Multi-period timeframes (follow-up of #100 and #101):**
- `time(tf)`, `time_close(tf)`, `timeframe.change(tf)`, `time_tradingday` and `request.security` accept daily,
  weekly and monthly timeframes with a multiplier ("3D", "2W", "3M", "12M"), and multi-period charts. Periods
  restart each calendar year: "nD" groups n trading days, "nW" n weeks from the first Monday of the year, "nM"
  n months from January. On intraday charts `time_close("nD")` is the start of the next period.
- `request.security`: a chart bar completes its period only when it closes at or after the period end; a period
  whose last bars are missing completes on the first bar of the next period.

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

**PineScript signatures and behaviour (issue #99, part B):**
- `ta.highestbars` / `ta.lowestbars` return 0 or negative offsets (0.5.0: positive); ties go to the
  oldest bar. `ta.highest` / `ta.lowest` / `*bars`: an `na` value ends the window.
- `ta.stdev(source, length, biased = true)` skips `na` values; `ta.range(source, length)` (0.5.0:
  `(high, low)`); `ta.max(source)` / `ta.min(source)` are all-time values (0.5.0: element-wise of two
  series); `ta.vwap(source, volume, anchor?, stdev_mult?)` with anchor reset and bands (`vwapBands` in
  the Series layer).
- Script API: `ta.highest(length)`, `ta.lowest(length)`, `ta.highestbars(length)`, `ta.lowestbars(length)`
  on the chart high / low, and `ta.vwap(source, anchor?, stdev_mult?)` with the chart volume.
- `str.tostring` formats as PineScript (Java DecimalFormat patterns, half away from zero,
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
- Refactored indicator sources to use the official PineScript reference

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
