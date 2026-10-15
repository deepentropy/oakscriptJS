# Changelog

All notable changes to OakScriptJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ScriptRunResult.outputs`: the `plot()`, `plotshape()`, `plotchar()`, `plotarrow()`, `plotcandle()` and `plotbar()`
  declarations in the order the script made them (kind, id in its config, title), type `ScriptOutput`. PineScript
  numbers a script's outputs in this order (alert message placeholders `{{plot_<n>}}`).
- `result.outputValues`: per `plotshape()` / `plotchar()` / `plotarrow()` id, the value of its series on each bar where
  it is not na (a condition gives 1 or 0), at the bar it was computed on (the offset not applied), what the output
  gives in an alert message.

## [0.11.5] - 2026-10-14

### Added

- `volume` as a source: `SourceType`, `input.source` options, `getSource` and `getSourceSeries` (NaN for a bar
  without volume); `OHLC.volume` optional (#184).
- `syminfo.description` in the script API, from `ChartContext.description` and, inside `request.security` of another
  symbol, from `SymbolInfo.description` ("Apple Inc.", "Bitcoin / U.S. dollar") (#184).
- `input.text_area` (script API, `input_text_area`, core `input.text_area`): a multi-line string input,
  `InputConfig.type` `'text_area'`, display `none` by default as in PineScript (#184).
- `alert(message, freq)` in the script API with `alert.freq_all`, `alert.freq_once_per_bar` (default) and
  `alert.freq_once_per_bar_close`: the calls go to `result.alertCalls` (bar time, message, frequency) for the host's
  alert engine; inside `eachBar()` / `strategy.eachBar()` a call is on the current bar, at the top level of the
  script on every bar (a text or one text per bar, na makes no call). `ScriptRunResult.hasAlertFunction` tells that
  the run called it; types `AlertCall`, `AlertFrequency`.

### Changed

- `ta.roc` with a zero base divides by zero as PineScript: +/-Infinity (a -0 base gives the opposite sign), NaN for
  0 / 0; it was NaN (#184).
- `year`, `month`, `dayofmonth`, `dayofweek`, `weekofyear`, `hour`, `minute`, `second` of an na time give the fields
  of time 0 in the time zone, as PineScript (`year(na)` is 1970 in UTC, 1969 in America/New_York); they were NaN
  (#184).
- ZigZag library as the PineScript ZigZag library (v7 and v8): the first pivot moves its start with its end while it
  is the only pivot; a pivot's volume sums `nz(volume[depth])`, not the volume of the current bar; the extension adds
  `math.sum(volume, max(depth, 1))` of the last bar (#184). Ports that shifted the volume themselves must pass the bar
  volume again.

### Fixed

- `securityOther` / `request.security` on a lower timeframe with an open last bar (`lastBarConfirmed` false,
  `realtime`) showed the first lower bar of the chart bar; it shows the last lower bar so far, as PineScript (the
  realtime rule only applies to the chart timeframe and higher ones) (#184).

## [0.11.4] - 2026-10-13

### Added

- `alertcondition()` results (`result.alerts[]`) carry `times`: the times of the bars on which the condition is true
  (not na, not 0), so a host can read every bar of a condition, not only the last one (`triggered`).

## [0.11.3] - 2026-10-13

### Added

- `drawingOutputs` keeps `xloc: 'bar_time'` on the lines, labels, boxes and polylines whose x coordinates are times
  given by the script (xloc.bar_time), so a renderer can place a time after the last bar on the chart's own calendar
  (trading sessions); bar-index drawings have no `xloc`.

## [0.11.2] - 2026-10-12

### Added

- `periodTime(time, timeframe, chart, session?, timezone?)` and `periodClose(...)` take the session and time zone of
  PineScript `time(timeframe, session, timezone)` / `time_close(...)`, with the same rules as the script API, for code
  without a script run; `sessionPeriods` gives both functions of one call (#182).

### Changed

- Two-series `ta.rsi(x, y)` (PineScript v4) gives -Infinity when `x = -y` (`100 - 100 / 0`) instead of na. `na()` and
  `nz()` still treat it as na, but comparisons see it (`r < 30` is true) (#182).

### Fixed

- `table.new` and `table.set_position` delete only the live table at the same position with the same
  `force_overlay`: a table on the price pane (`force_overlay = true`) and one on the indicator pane share a
  position, also in an overlay script. `table.set_position` onto the position of a live table now deletes it (#182).
- `time("D", session, timezone)` / `time_close("D", ...)` with a session of several runs: the time between two runs of a
  day is inside the day (the period runs from the first start to the last end); it was na. 3,239,838 of 3,239,838
  probe values equal (BTCUSD 60 and 15, AAPL 60, 6 sessions, 3 time zones) (#182).
- +/-Infinity is skipped like na by `ta.highest`, `ta.lowest`, `ta.highestbars`, `ta.lowestbars`, `ta.max`, `ta.min`,
  `ta.range`, `ta.pivothigh`, `ta.pivotlow`, `ta.median`, `ta.mode`, `ta.rising`, `ta.falling` and the `callsite.*`
  sites of the highest family; the result was +/-Infinity (plotted na) or a wrong window. `ta.stoch` keeps the previous
  result only for an na (NaN) value: a zero range with `source != lowest` gives +/-Infinity, as `100 * x / 0`. 1,500,048
  of 1,500,048 probe values equal (BTCUSD and AAPL daily, 88 series) (#183).

## [0.11.1] - 2026-10-12

### Added

- Lower timeframes (#181): `request.security` on a timeframe lower than the chart's (chart symbol or another one)
  and `request.security_lower_tf(symbol, timeframe, expression, ignore_invalid_symbol)` in the script API, with the
  bars from `ChartContext.bars`; `securityLowerTf` (package root) for ports. Lookahead off: the last lower bar that
  closes by the close of the chart bar; lookahead on: the last one open at its open (by trading day only when both
  timeframes are D / W / M); `security_lower_tf`: the lower bars that close inside the chart bar. 142,940 of 142,947
  probe values equal (BTCUSD / AAPL 1D, BTCUSD 1W, AAPL 60 requesting 60 / D / 15, both symbols); the 7 others are
  the close of the live last bar.
- `ta.rsi(x, y)` with two series (PineScript v4 `rsi(x, y)`): 100 when `y` is within 1e-10 of zero, else 0 when `x`
  is, else `100 - 100 / (1 + x / y)`, na on a division by zero; 68,184 of 68,184 probe values equal (#180).
- `input.symbol` (script API, `input.symbol` / `input_symbol` of the other APIs) and the input type `'symbol'`, for a
  symbol picker (#180).
- `ChartContext.basecurrency` / `ChartContext.root` (also in `symbolInfo` for other symbols): `syminfo.basecurrency`
  and `syminfo.root` (#180).
- `request.security` of another symbol in the script API (#179): the host gives the bars with
  `ChartContext.bars(symbol, timeframe)` and the calendar with `ChartContext.symbolInfo(symbol)`; missing bars end the
  run with a `MissingSymbolDataError` listing every `{ symbol, timeframe }` request; a symbol with no bars ([]) stops
  with "Invalid symbol: X", or gives na with the new `ignore_invalid_symbol` argument. Merge as PineScript: lookahead
  off by close time, lookahead on by open time (intraday charts) or by trading day / week / month start (D / W / M
  charts), gaps on only where the shown bar changes. `securityOther` / `securityOtherValues` (package root) give the
  same merge to ports. 771,856 of 771,856 probe values equal (AAPL, MSFT, BTCUSD, ASX:BHP on 60 / D / W / M).
- PineScript session strings accept "F" after a start: one day before the day the run ends on ("1700F-1900:2" is
  Sunday 17:00 to Monday 19:00); `time.inSession` and `time(tf, session)` read the TVC:DXY session
  "1900-1900:3456|1700F-1900:2" (it threw "Invalid session") (#173).
- `setDrawingBar(barIndex, last, lastIndex)`: a third argument, the bar index of the last bar of the data; with it
  (and on the last bar), a bar index more than 500 bars after the last bar throws PineScript's RE10020 "Objects
  positioned using xloc.bar_index cannot be drawn further than 500 bars into the future." (`line.new`, `label.new`,
  `box.new`, `polyline.new` and the x setters); `eachBar` passes it (#174).

### Changed

- `time(tf, session, timezone)` / `time_close(tf, session, timezone)`: a timeframe of more than one day ("2D", "W",
  "M") has no session test and keeps the period's time (it was na outside the session hours); "D" tests the bar
  against the day's session period, placed on clock-change days as PineScript does (a skipped wall time moves past
  the gap, a repeated one is its first pass, the end is the minute before it plus one), and intraday timeframes align
  their periods on the run of `time.inSession` (#173).
- Script API `ta.vwap(source)`: the default anchor is the first bar and each bar whose trading day differs from the
  last bar that has one, so the day after an early close starts on its first bar; of the bars after an early close
  (no day), the first continues the day and each further one starts a new sum (#178); on D / W / M charts every bar,
  without the time zone or session (it threw "The exchange time zone is not known") (#173).
- `ta.pivot_point_levels` rewritten from the PineScript results: the fixed levels come from the previous period
  (its high and low, the close of the bar before the anchor; it took the anchor bar itself), na until the first
  anchor; developing levels from bar 0; Traditional R3 to S5, Classic R3 to S4, Woodie R3 to S4 (Woodie P uses the
  open of the current period) and Camarilla R5 / S5 formulas, R4 to S5 na for Fibonacci, R5 / S5 na for Classic and
  Woodie, DM from the close against the open of the period; the RE10128 text for a developing Woodie (#177).
- `ta.percentrank`: an na current value gives 0 from bar `length` on (it gave na) (#177).
- `table.new` at the position of a live table deletes that table, as PineScript keeps one table per position (200
  calls at one position left 200 live tables) (#176).
- A fractional bar index x of `line.new`, `box.new`, `label.new` and the x setters is truncated (PineScript's x is
  an int: 295.67 draws on bar 295); the object had no time before (#176).
- `array.get` / `set` / `insert` / `remove` and the other index functions: an index out of bounds throws the
  PineScript text "In 'array.get()' function. Index 5 is out of bounds, array size is 3." (#176).
- A length of 0 or less stops the script with PineScript's RE10001 text, as for a too long length since #164:
  "Error on bar 0: Invalid value of the 'length' argument (0.0) in the 'highest' function. It must be > 0." for
  `ta.highest`, `lowest`, `highestbars`, `lowestbars`, `sma`, `ema`, `rma`, `wma`, `hma`, `math.sum`, `stdev`
  ('stdev'->'variance'), `variance`, `linreg`, `rsi` (argument 'y'), `mom`, `change`, `roc`, `atr` ('atr'->'rma'),
  `dev`, `median`, `percentrank`, `cci`, `mfi`, `cmo`, `vwma` ('vwma'->'sma'), `alma`, `stoch` ('stoch'->'highest'),
  `correlation`, `rising`, `falling`, `mode`, `range`, `percentile_nearest_rank`, `percentile_linear_interpolation`,
  `rci`, `wpr`, `cog`, `bbw`, `bb`, `kc`, `tsi` ('tsi'->'ema'); `ta.hma(src, 1)` stops in its inner
  `wma(src, 0)`; a series length on the bar where it reaches 0. These returned na on every bar (#175).
- `line.get_price` reads the line as extended on both sides whatever its `extend` (it returned NaN outside the two
  points for `extend.none` / `left` / `right`), computes `y1 + (y2 - y1) * (x - x1) / (x2 - x1)` in that order (the
  slope form differed in the last bit on 1,474 of 131,780 probe values) and throws the PineScript text
  "'line.get_price' must be used with lines created using 'xloc=xloc.bar_index'." for a `bar_time` line (#174).
- `linefill.new` on two lines that are both in a live linefill returns that linefill with the new colour (the one
  created or returned last when several match), as PineScript keeps one linefill per pair; it created a new one
  (#174).

### Fixed

- `str.tostring` with a percent pattern keeps the sign of a negative value that rounds to zero ("#.#%": -0.0004 gives
  "-0%", it gave "0%"); without "%" and with `format.percent` it is still dropped; 63 of 63 texts equal (#180).
- `TradingCalendar(tz, { session }, 'pine')`: a session ending at 0000 belongs to the day it starts, as
  `time.inSession` (it was put on the next day) (#173).
- A bar that opens after an early close has no intraday period either: `time("240")`, `time("60")` and
  `time_close("240")` are na on it, `timeframe.change("240")` is false on it and on the next session open (#173).
- `request.security` / `resampleSession`: a bar after an early close is part of the D / W / M bar of its day (it was a
  D bar of its own with a na time) and an intraday bar of its own for "240"; the bar before it completes the day
  (#173).
- `array.covariance` sets its running co-moment to 0 when it is within 1e-10 of zero, as PineScript (five equal
  values gave -1.73e-18 instead of 0, and later sums differed in the last bit) (#177).
- Polylines on the last bar: once the polylines of the bars before are gone, the ones the script deleted on that
  bar count in the allowance before the next cut, so a script that deletes its polylines and creates N new ones keeps
  all N (max 100: 106 to 200 kept; the registry cut 6) (#176).
- `str.tostring(x)` without a format: the digits of the JVM's binary to decimal conversion rounded to 10 decimals
  half to even, the conversion deciding a tie on its last digit. 0.11.0 rounded the exact value and added a digit
  when the converted digits already had 10 decimals or fewer: `1791662400001 / 900000` gives "1990736.000001111"
  (0.11.0 "1990736.0000011111"), 78195689105219552 keeps its digits, 5e-11 gives "0" (#174).
- `barsUntil` rounds the time to the nearest second (a half second up) before finding its bar: 15 ms before a bar
  opens is on that bar (#174).

## [0.11.0] - 2026-10-12

### Added

- Package root exports for ports that do not run a whole script: `resetDrawings(limits)` / `setDrawingLimits(limits)`
  (the `max_lines_count` / `max_labels_count` / `max_boxes_count` / `max_polylines_count` of the drawing registry),
  and `resample`, `periodsOf`, `afterCompletion`, `mapToChart`, `heikinAshi` (same-symbol `request.security` on a
  higher timeframe, `ticker.heikinashi`) (#157).
- Doc comments of `LabelData`, `LineDrawingData`, `BoxData`, `PolylineData`, `TableCellData` and `TableData`: the
  PineScript value of each omitted property (v6 values, with the v4 / v5 value where it differs) (#172).

- `ta.wma(source, length)` with a series length (an array, or a Series in the Series and script APIs): each bar
  gives the result of its own length, as PineScript (#161).
- `setDrawingBar(barIndex)` (package root): tells the drawing functions the bar being calculated, for a port with
  its own bar loop; `eachBar` of the script API does it (#170).
- `str.tostring(array)` gives "[a, b]".
- `callsite.highestbars()` / `lowestbars()`: `ta.highestbars` / `ta.lowestbars` in a conditional block or a loop,
  called with `(barIndex, value, length)` (#160).
- `callsite.pivothigh()` / `pivotlow()`: `ta.pivothigh` / `ta.pivotlow` in a conditional block, called with
  `(barIndex, value, leftbars, rightbars)`; the lengths can change from one call to the next (#169).
- Series (per-bar) lengths: `ta.highest`, `ta.lowest`, `ta.highestbars`, `ta.lowestbars` take a length per bar, and
  `ta.pivothigh` / `ta.pivotlow` a left and a right length per bar (an array; a Series in the Series and script
  APIs). Each bar uses its own lengths, as PineScript (#160, #169).
- The session of a chart context without a script run, from the package root: `periodTime(time, timeframe, chart)`
  (`time(tf)`), `periodClose` (`time_close(tf)`), `tradingDayTime` (`time_tradingday`), `chartSessionFlags(times,
  chart)` (`session.*`), `resampleSession(bars, timeframe, chart)` (the higher-timeframe bars of `request.security`
  with the session, corrections and holidays of the context; use with `mapToChart`), and `chartSessions(chart)`,
  `TradingCalendar`, `SessionBars`, `sessionFlags` for anything else (#165).
- `barTimeAfter(time, count, chart)`: the open time of the `count`-th bar after a bar on the trading calendar of the
  context (closed hours, weekends and holidays skipped), and `barsUntil(from, to, chart)`: the number of bars to the
  bar of a later time (#165).
- Symbol sessions with sections and the "F" marker: `"1900-1900:3456|1700F-1900:2"` (each section has its days;
  "F" alone starts the period one day before the trading day) (#167).
- Drawing limit: an object held by a `var` variable of the drawing type is never deleted by `max_*_count`, and it
  still counts (measured for lines, labels and boxes). `varDrawing<T>()` is such a variable (`.value = obj` holds the
  new object and releases the one before); `holdDrawing(obj)` / `releaseDrawing(obj)` do it without a variable.
  From the package root and `oakscriptjs/script`. Linefills have their own rule (measured on one script): a fill
  is skipped while a `var` variable holds it and for 5,000 bars after its release; when the count is still above
  the maximum + 5, the oldest fills are deleted, the held ones too (#158).
- Chart context: `symbolType`, `currency`, `foregroundColor`, `backgroundColor`, `now`, read in a script as
  `syminfo.type`, `syminfo.currency`, `chart.fg_color`, `chart.bg_color` and `timenow` (a value that was not given
  throws; `timenow` defaults to the clock at the start of the run) (#165).

### Changed

- Drawing limit (`max_*_count`), measured on 213 probe series (#158):
  - the object that was just created is never deleted, and a `var` variable protects its object from the bar after
    the assignment. With more held objects than the maximum, the held ones and the newest object stay (8 held lines
    and a maximum of 5: 9 or 10 lines); 12 `var` lines created on the first bar with a maximum of 5 lose the first 6.
  - polylines: the polylines the script deleted are counted (P: a delete adds 1; a creation sets it to 0 when it is
    3 or more). A creation cuts when the count is above the maximum + 5 + P, down to the maximum + P, and the
    polylines of the cut are added to P. This is the "0, 1 or 2 bars late" of a script that deletes and creates a
    polyline on every bar; equal to PineScript on every closed bar of 34 probes.
  - the last bar has rules of its own (read from the count after each creation): a cut deletes the objects of the
    bars before first, at most those (a line takes its linefills with it); once none is left, it deletes objects of
    the last bar as on any bar. With 10 lines and a maximum of 10, 13 lines on the last bar leave these 13 instead
    of 11. Lines, labels and boxes also count the script deletes of the bars before (reset at 5) and allow that many
    more objects on the last bar ("above 58, down to 53" for a maximum of 50 after 3 deletes).
    `setDrawingBar(barIndex, true)` marks the last bar in a port with its own loop; `eachBar` of the script API does
    it. Lines, labels and boxes: the count after every operation of the last bar and the objects alive at the end
    are the same as PineScript on 72 of 72 runs checked after the rule was written, and on 290 of 290 runs in all.
  - polylines on the last bar (one calculation, read from the count after each creation): the P carried from the
    bar before counts twice; a cut deletes polylines of the bars before first, at most those, and adds them to P;
    once none is left, a cut deletes polylines of the last bar and P becomes the number of polylines of the bars
    before deleted on that bar. The polylines alive at the end are the same as PineScript on 271 of 281 probe runs
    (32 of 40 random shapes checked after the rule was chosen); the count inside the bar can differ when the script
    deletes polylines of the last bar.

- `ta.highest` / `ta.lowest` / `ta.highestbars` / `ta.lowestbars`: `na` values are skipped, as PineScript does today
  (measured on 11/10/2026; the former rule, "an `na` value ends the window", no longer matches). The result is the
  extreme of the last `length` non-na values (of all of them when there are fewer), also on a bar whose own value is
  `na`; `na` before bar `length - 1` and while no value was received. The offsets of `highestbars` / `lowestbars`
  count bars, so they can be below `-(length - 1)`, and are `na` (not 0) while there is no value. `ta.stoch` follows
  (an `na` high or low is skipped in the window).
- `ta.pivothigh` / `ta.pivotlow`: `na` values are skipped in the same way: the highest (lowest) of the last
  `leftbars + rightbars + 1` non-na values must be on the bar `rightbars` bars back (an `na` neighbour ended the check
  on its side).
- `callsite.lowestByBar()` / `highestByBar()` no longer keep a ring by bar: they keep the non-na values of their
  calls (rule above, `na` before bar `length - 1`), which is what PineScript gives today in `if` blocks, ternaries,
  user functions and loops, with a constant length or one that changes. Several calls on one bar (a loop) share one
  kept value. `callsite.lowest()` / `highest()` are the same sites, called with `(value, length, barIndex?)`: an `na`
  value no longer resets them (#159, #168).
- `ta.highest` / `ta.lowest` / `ta.highestbars` / `ta.lowestbars` and the `callsite.highest()` / `lowest()` /
  `highestByBar()` / `lowestByBar()` sites throw the PineScript runtime error when the length is above 15,000:
  "The 'highest' function references too many historical candles (15001), the limit is 15000." (#164).
- `math.sum`, `ta.sma`, `ta.variance`, `ta.stdev`, `ta.bb` and the `callsite.sum()` / `sma()` / `stdev()` sites throw
  the same error above 5,000, with the PineScript function names ('sum', 'sma', 'variance', 'stdev'->'variance',
  'bb'->'sma'): a constant length on bar 0, a series length on the bar where it passes the limit (#164).
- `line.new`, `box.new`, `label.new`, `polyline.new` and the setters of x (`line.set_x1` / `set_x2` / `set_xy1` /
  `set_xy2`, `box.set_left` / `set_right` / `set_lefttop` / `set_rightbottom`, `label.set_x` / `set_xy`) throw the
  PineScript runtime error when a bar index is more than 10,000 bars before the current bar: "Bar index value of the
  `left` argument (499) in `box.new()` is too far from the current bar index. Try using `time` instead." Only with
  `xloc.bar_index`, and only when the current bar is known (a script run, or `setDrawingBar`) (#170).

### Fixed

- `ta.highestbars` / `ta.lowestbars`: on equal values the newest bar wins, as PineScript (the oldest did) (#160).
- `ta.highest` / `ta.lowest` / `ta.highestbars` / `ta.lowestbars`: a fractional length is truncated, as PineScript
  casts it to int (7.5 is a window of 7 bars; it was 8) (#163).
- Script API `ta.vwap(source)` with its default anchor has values from the first bar: the sums start on the first
  loaded bar (a day in progress) and restart on each new trading day (it was `na` until the first day change). An
  anchor given by the script is unchanged (#166).
- `line.new(width = 0)` and `box.new(border_width = 0)` keep 0 (they became 1) (#172).
- `time.inSession` (and `time(tf, session, timezone)` of the script API with a session string):
  - a run that ends at 0000 ends at 24:00 of the day it starts and belongs to that day: `"2000-0000:23456"` is
    Monday to Friday 20:00 to midnight (it was Sunday to Thursday);
  - on the days around a clock change the runs are placed as PineScript places them, not by the wall clock of each
    bar: a wall time before the wall time of the change uses the offset before it, a later one the offset after it;
    a run that ends exactly on the wall time of the change uses the offset after it at both ends; when the clocks go
    back, a run that ends inside the repeated hour covers both passes;
  - the day before the clocks go back, a run with an end or a start on the wall time of the change is also true one
    hour (the amount of the change) later, from one bar after its usual end. This rule needs the bar duration:
    `time.inSession(time, session, timezone, barMs)`; the script API passes the chart timeframe.
  Measured on 5- to 60-minute bars in five time zones: 0 of 8,560,000 tests differ (#162).
- Session calendar of the script API (#167):
  - an intraday bar that opens after an early close (inside the usual hours of its day) has no day: `time("D")`,
    `time_close("D")` and `time_tradingday` are na on it, `timeframe.change("D")` is false on it and on the next
    bar, `session.islastbar` is false and `session.ismarket` true; `time("W")` keeps its value;
  - `session.isfirstbar` / `isfirstbar_regular` on the first loaded bar are true only when no earlier bar of its
    session can exist (they were always true).
- `str.tostring(x)` without a format rounds the exact value of the double to 10 decimals: 82325.10000000005 (exactly
  82325.10000000004947...) gives "82325.1", it gave "82325.1000000001". With a format the shortest decimal form is
  rounded as before (`"#.##########"` gives "82325.1000000001", `1.005` with "#.##" gives "1.01") (#171).

## [0.10.1] - 2026-10-07

### Added

- `InputConfig.active` (PineScript `active`): whether the input can be edited; an inactive input is greyed out in the
  settings and keeps its value. It is a boolean or an `InputCondition`, plain data naming the inputs it depends on:
  an input id (`'showMa1'`), `{ input, eq / ne }`, `{ not }`, `{ any: [] }`, `{ all: [] }`.
  `isInputActive(config, inputs, configs?)` evaluates it. Script API: `input.*(defval, title, { active })` (#156).
- Script API chart context: `minmove` and `pricescale`, read as `syminfo.minmove` and `syminfo.pricescale`. Without
  them they come from `mintick` (pricescale 10^decimals: 0.25 is 25 / 100); `syminfo.mintick` is
  `minmove / pricescale` when `mintick` is not given.
- `str.tostring(x, format.mintick, mintick, pricescale)`: a fourth argument for symbols priced in fractions (in a
  script: `syminfo.pricescale`). The text has floor(log10(pricescale)) decimals, the tick value rounded half even
  (1/32: 25.25 gives "25.2"; 2/8: no decimal) (#155).

### Fixed

- `str.tostring(x, format.mintick)` prints the tick's decimals with their trailing zeros ("1.00", "0.40" for tick
  0.01) and no longer uses `math.round_to_mintick` (unchanged): the double quotient `|x| / (1 / pricescale)` is
  rounded half away from zero (140.355 / 0.01 = 14035.499999999998 gives "140.35", it gave "140.36"), then brought
  to the tick with `floor(units / minmove + 0.5)` (tick 0.02: 0.005 gives "0.02", -0.01 gives "0.00") (#155).
- `InputConfig.display` doc: an unset `display` means 'none' for bool, color and time inputs, 'all' for the
  others (it said only color inputs default to 'none') (#154).

## [0.10.0] - 2026-10-05

One result shape for scripts and built-in indicators: `IndicatorResult` now has the names and shapes of the
`lightweight-charts-indicators` package, and the drawings of a script run (#153).

### Changed (breaking)

- `IndicatorResult.bgcolors` / `barcolors` are renamed `bgColors` / `barColors`. A bgcolor entry is a `BgColorData`
  with `forceOverlay: true` when the script gave `force_overlay = true`
- `MarkerData` has the lightweight-charts shape of the built-in indicators: `position` (`aboveBar`, `belowBar`, `top`,
  `bottom`, and for `location.absolute` `atPriceTop` / `atPriceBottom` / `atPriceMiddle` with `price`: a label pointing
  down sits above the price, a label pointing up below it, the other shapes on it) and `shape` (`triangleUp`,
  `labelDown`, ...) replace `location` and `style`; `textcolor` is `textColor`; `color` is always set (default
  `#2962FF`); `forceOverlay` is set on each marker. Script markers keep `id`, `tooltip`, and a plotchar marker has its
  character in `char` (shape `circle`). `ShapeConfig` keeps the PineScript `location` / `style`
- `polyline.new(curved = true)` no longer warns: the flag goes to the renderer

### Added

- `IndicatorResult` fields `labels`, `lines`, `boxes`, `linefills`, `polylines`, `tables`: `executeScript` returns
  the drawings alive after the last bar (deleted ones and the ones over `max_*_count` are gone). A `bar_index` x is
  the time of the bar, or of a future bar after the last bar; a `bar_time` x (UNIX ms) is converted to the unit of
  the bar times; an object with an `na` coordinate is not drawn; a property the script did not set is omitted, a
  colour set to `na` is `'transparent'`. Types `LabelData`, `LineDrawingData`, `BoxData`, `LinefillData`,
  `PolylineData`, `TableData`, `TableCellData`, `TableMergeData` (the PineScript styles, sizes, alignments, fonts and
  formatting included)
- `drawingOutputs(bars, timeUnit?)`: the same fields for drawings made outside a script run; `barInterval(bars)` and
  `barTime(bars, index)`: the time of a bar index, future bars included (last bar time + k times the most frequent gap)
- `table.*` (22 functions and `table.all`): `new`, `cell`, the 11 `cell_set_*`, `merge_cells`, `clear`, the 6 `set_*`,
  `delete`; a column or row outside the table throws. `position.*` constants, `text.align_*` and `text.wrap_*`
  constants, `array.new_table()`
- Script API `plotcandle(open, high, low, close, title?, { color, wickcolor, bordercolor, display, force_overlay })`
  and `plotbar(open, high, low, close, title?, { color, display, force_overlay })`: `result.plotCandles` /
  `result.plotBars` keyed by id, declarations in `candleConfig`. No candle on a bar with an `na` value; a per-bar
  colour array with an `na` entry gives a transparent candle. Types `PlotCandleData`, `PlotBarData`, `CandleConfig`

## [0.9.6] - 2026-10-05

### Added

- `math.constant()`: the value PineScript gives to a constant expression such as `1 / 255` (computed before the
  script runs): from 0.001 up, the exact value rounded to 16 decimals, ties to even (`1 / 255` -> 0.003921568627451,
  `1 / 7` -> 0.1428571428571428). Wrap the constant expressions of a port with it. Math functions of constants
  follow the same rule with JavaScript's `Math` (`math.log10(c)` is `ln c / ln 10` there), which explains the
  constant results of #130. Measured on 5,060 / 5,060 PineScript values (#151)

- `callsite.sum()` / `callsite.sma()`: `math.sum` / `ta.sma` called inside a `for` / `while` loop, called with
  `(barIndex, value, length)`. PineScript keeps one history value per bar (the value of the last call on that bar);
  every call on a bar starts from the earlier bars; a bar without a call is not in the history; same compensated
  running sum as `math.sum` (bit for bit) (#139)
- `ta.sma()`, `ta.stdev()`, `ta.variance()`, `math.sum()`: a series length (one length per bar, array or Series), as
  PineScript's series int length. When the length changes, PineScript moves the running sum to the new length with
  Kahan steps of the raw values (a smaller length removes the leaving values, oldest first; a larger length adds back
  the earlier values, newest first); an `na` bar applies the new length and gives the sum of the last `length` earlier
  values. Bit for bit with PineScript on 625,058 probe values (#140)
- `callsite.sum()` / `callsite.sma()` accept a different length on each call (one call site in a loop over several
  lengths): every call starts from the state of the earlier bars and moves it to its own length as a series length
  does; the last call of the bar is kept. New `callsite.stdev()` with the same rules. Bit for bit with PineScript on
  221,377 probe values (#143)

### Fixed

- `str.tonumber()`: scientific notation (`"1e3"`), `"Infinity"` and `"-Infinity"` give na, as in PineScript (before:
  1000, Infinity); only the characters U+0000 to U+0020 around the number are removed (a no-break space gives na).
  Equal to PineScript on 62 / 62 probe texts (#152)
- `ta.tsi()`: a value in [-1, 1] as PineScript (it was 100 times that value); na when the denominator is 0 (a
  constant source), as a PineScript division by zero (#141)
- `ta.wma()` (and `ta.hma()`): as PineScript, a partial sum `s + t` of the weighted values (oldest first) is 0
  when `|s + t| <= 1e-10 * max(1, |s| + |t|)`: a sum that cancels to a tiny residue, or a value below 1e-10. Bit
  for bit with PineScript on 203,242 wma and 85,145 hma probe values (#136)
- `ta.linreg()` (and `callsite.linreg()`): PineScript's least-squares arithmetic, bit for bit: x = 1 (oldest) ..
  length, sums from the oldest value, `intercept = sumY / length - slope * sumX / length + slope` (the fitted value at
  x = 1), result `intercept + slope * (length - 1 - offset)`. Was within 1.7e-15 (relative) before; now 0 different
  on 255,265 probe values (15 series, offsets -2 to 9)
- `array.sum()`: skips na elements as PineScript (it returned NaN); an array without values gives NaN. Added from left
  to right; the running sum is set to 0 after a step when its absolute value is <= 1e-10 (an absolute threshold,
  unlike `ta.wma`); `array.avg()` does not use this rule (#144)
- Running sums of `math.sum()`, `ta.sma()`, `ta.stdev()`, `ta.variance()`, `ta.mfi()`: the resync test is now
  `|fl(x + |c|) - x| < |c|` (the compensation moved toward +infinity in floating point). Same results as before on all
  real data; also right for a positive value just below a power of two (it was wrong on 5 designed series). 0
  different on 546,176 saved and 999,544 new probe values (#142)
- `ta.stoch()`: when the source, `highest(high, length)` or `lowest(low, length)` is na, or the range is 0, the result
  is the previous result of the call (na until a first value), as PineScript (it was na). 0 different on 204,348 probe
  values (#145)
- `color.from_gradient()`: PineScript's mixing order, bit for bit: premultiplied channels
  `((alpha / 255) * channel) * weight`, divided by the byte-alpha mix / 255, truncated. At an end (k = 0 / 1) this is
  the end colour or one unit less (e.g. green 98 with transparency 7 gives 97). 0 different on 116,927 probe channels
  (the order was found in PyneCore's open source and checked on our probes) (#146)
- `ta.rci()`: as PineScript, bit for bit: first value on bar `length`; ranks from an ascending sweep where a group
  collects the values less than 1e-10 above its smallest value (average rank, counted from the largest value); a
  window where all values are ties gives na; moment-form variances of the bar positions and the ranks and
  `(100 * cov) / (sd_x * sd_y)` (the arithmetic order was found in PyneCore's open source and checked on our probes).
  The values sit in a ring of `length + 1` slots by bar index, 0 at the start and not written on na bars: a bar with
  an na source keeps the previous result, and a later window sees the value of `length + 1` bars earlier where the
  na was. 0 different on 292,799 probe values (ties, na, double na, early bars) (#147)
- `ta.correlation()`: PineScript's running-sum formula `cov = sma(x * y) - sma(x) * sma(y)`,
  `r = cov / sqrt(variance(x) * variance(y))` (each running sum skips its own na values); `|cov| <= 1e-10` gives 0, a
  zero variance gives na. 0 different on 170,300 probe values (the measured limit lies between 9.999999999999986e-11
  and 1.0000000000000007e-10) (#148)


### Changed (PineScript rules found with PyneCore's open source and checked on our probes)

Each rule below was measured on the PineScript runtime (probes on NASDAQ:AAPL and BITSTAMP:BTCUSD daily). Some calls
that returned na or a clamped value now throw, as PineScript stops with a runtime error.

- `math.round()`: ties away from zero (-2.5 -> -3); with a precision the decimal value is rounded (1.005, 2 -> 1.01;
  -1.45, 1 -> -1.5); a negative precision rounds to an integer (1234.5678, -2 -> 1235); an infinite value gives na
- `math.round_to_mintick()`: tick-grid rounding with ties away from zero (-1.075 -> -1.08, 1.005 -> 1.01, 0.3 -> 0.3)
- `math.avg()` with 3 or more values: compensated sum (0.1, 0.2, 0.3 -> 0.19999999999999998); `math.rphi` last bit
- `array.get / set / remove / insert`: a negative index counts from the end; an index out of range throws
- `array.includes / indexof / lastindexof`: numbers equal within 1e-10; na is never found
- `array.concat()` appends to and returns the first array; `array.slice()` is a live view of the array
- `array.sort() / sort_indices()`: na last ascending, first descending
- `array.min() / max()`: an nth out of range throws; `array.median() / mode()` skip na; a `mode` tie gives the
  smallest value
- `array.variance() / stdev() / standardize()`: moment form (`E[x^2] - mean^2`); a flat array standardizes to 1
- `array.covariance()` skips na pairs; `array.percentrank()`: `(count - 1) * 100 / (size - 1)` (one element: na);
  `array.percentile_nearest_rank() / percentile_linear_interpolation()`: PineScript operation order
- `str.replace()`: replaces only the nth occurrence (default the first); `str.pos()` not found -> na;
  `str.match()` returns the first match (na when none), not a bool; `str.repeat(s, 0)` -> na; `str.tonumber()` of a
  partial number -> na; `str.split("", "")` -> `[""]`; `str.substring(s, begin, na)` throws
- `str.tostring()`: patterns with a `;` negative part; na / infinity print `NaN` (`NaN%` with `format.percent`); at
  most 16 decimals; `format.mintick` (tick of the symbol in a script, or a third argument); `str.format()` prints an
  array as `[a, b]` and caps decimals the same way
- `color.t(na)` is 100; `color.new(na, t)` is black with transparency t, as before (#150: an earlier change of this
  release made it na, which is PineScript's compile-time result for the constant `color(na)` only)
- `timestamp()`: "2025" and "2025-06" are accepted; "01 Jan 2022 GMT+3" (a zone without a time) gives na; dates
  before 1582-10-15 use the Julian calendar
- `label.new()`: the default text is `""`
- `ta.cog()`: `-sum(src[i] * (i + 1)) / math.sum(src, length)` (the old formula was wrong on every bar)
- `ta.kcw()`: `(upper - lower) / basis` (no `* 100`)
- `ta.cross()` / `callsite.cross()`: true when the values move strictly to the other side of the last strict side
- `ta.rising() / falling()`: a counter of strict steps; a step from or to an na bar leaves it unchanged
- `ta.rma()` (and `rsi`, `atr`, `dmi`, `supertrend`): seed from the running-sum `ta.sma`
- `ta.dev()` / `ta.cci()`: mean from the running sums, absolute deviations newest first; `ta.cci` on a flat window
  keeps the last value, or 0 at the start
- `ta.mfi()`: running sums within 1e-10 of 0 are 0; a zero `1 + up / down` gives na
- `ta.mode()`: window of the last `length` non-na values; `ta.vwap()` with an anchor: na before the first anchor
- `ta.swma()`, `ta.wpr()`, `ta.accdist()`: PineScript operation order (last bits)
- Session strings (`time(tf, session)`, `time.inSession`): PineScript grammar: "|" sections (a later section naming a
  day replaces the earlier ones on that day; the default section takes the other weekdays), trailing "," / ":" / "|",
  hours and minutes modulo one day ("0930-2500" is 09:30 to 01:00), a strict "HHMM-HHMM" form ("1100 -1400" throws);
  a name that does not start with a digit ("regular", "extended") is the symbol session in `time(tf, session)`
- `math.random(min, max, seed)`: PineScript's seeded sequence (`java.util.Random(seed).nextDouble()`), one generator
  per seed, started again by `executeScript`; new `callsite.random(seed)` for one generator per call site
- `timestamp(tz, y, m, d, ...)`: an na field counts as 0
- `linefill.new()` with an na line gives na
- `matrix.get / set` with an na index: na / no change; `matrix.det()`: LU for every size with an absolute
  singularity threshold of 1e-11; `matrix.rank()`: singular values above `max(rows, columns) * largest * 2^-52`
- `array.fill()`: an na bound is the start / the end, a bound past the end throws; `array.first() / last()` of an
  empty array throw
- History limit of script series (PineScript runtime error RE10008): `c.get(x, k)` in `eachBar()` and
  `x.offset(k)` with `k > 5000` throw; in `eachBar()` the history buffer of a script series grows as measured (242
  bars, then x 1.618034 when the largest reference of a bar goes past it, a jump sets it to the reference) and a
  buffer above 5000 stops the script on the next bar (`x[bar_index]` stops on bar 4348, "7032 bars back"). The
  built-in price series keep the whole history. 62 of 66 measured runs exact; 4 designed jump-then-grow runs stop
  1 to 5 bars later in PineScript (#149)

## [0.9.5] - 2026-10-02

### Added

- `callsite.lowestByBar()` / `callsite.highestByBar()`: `ta.lowest` / `ta.highest` in a conditional branch with the
  history kept by bar, called with `(barIndex, value, length)`. PineScript keeps the values in a ring of `length + 1`
  slots indexed by the bar index, filled with 0 at the start; a value that passes the kept extreme replaces it, else
  the window is read again from the ring when the kept extreme is `length` bars old; na before bar `length - 1` (#138)

### Changed

- `prepare` script (was `prepublishOnly`): `dist/` is built when the package is installed from a git commit
  (`npm install github:deepentropy/oakScriptJS#<sha>`); `dist/` is not in git.

### Fixed

- `ta.cmo` uses the PineScript definition with the running sums of `math.sum`
  (`100 * (sm1 - sm2) / (sm1 + sm2)`): equal to PineScript bit for bit (was equal in the last bits on 55 of 5,477
  bars; a true value of 0 could change sign) (#132)
- `array.binary_search_rightmost`: a value above every element gives the array size (was -1);
  `array.binary_search_leftmost`: a value below every element gives 0 (was -1). `na` counts as greater than every
  number in both (#133)
- `ta.crossover` / `ta.crossunder` / `ta.cross` and `callsite.crossover()` / `crossunder()` / `cross()`: after a bar
  (or call) with an na value, compared with the last bar where both values were not na, as PineScript (was the
  previous bar only, so a crossing right after an na bar was missed). Comparisons stay exact (#134)
- `math.sign(na)` is na, as PineScript (was 0) (#135)
- `ta.percentrank` gives the bits of `count * 100 / length`, as PineScript (`(count / length) * 100` differed in the
  last bit, e.g. 28.999999999999996 instead of 29) (#137)
- `ta.ema`: the first value is `ta.sma` on that bar (the running sum of `math.sum`), as PineScript (was a plain loop
  sum, different in the last bits) (#136)
- `math.sum` / `ta.sma` / `ta.stdev` / `ta.variance` running sum: the resync test rounds on the grid of the new value
  toward +infinity, which is half as fine for a negative power of two. A value of -1, -2, -4... after a compensation
  of the same sign now keeps the Kahan step, as PineScript (#136)

## [0.9.4] - 2026-10-02

### Added

- `callsite.linreg()`: `ta.linreg` in a conditional block, called with `(barIndex, value, length, offset)`. PineScript
  keeps the window in a ring of `length + 1` slots by bar index, 0 at the start and written only on called bars: the
  bars before the first call count as 0, a bar without a call holds the value of the call `length + 1` bars earlier.
  Equal to PineScript on every bar of a daily history (4 call patterns, first call on bar 5 or 20, every bar or every
  second bar) (#131)

## [0.9.3] - 2026-10-02

### Documentation

- `math.log10`, `math.exp`, `math.log`, `math.pow`, `math.sin`, `math.cos`, `math.tan`: known difference of 1 or 2
  units in the last place from PineScript on part of the inputs (JavaScript `Math` is used) (#130)

## [0.9.2] - 2026-10-01

### Fixed

- `ta.supertrend` follows the PineScript reference implementation (`nz` of the previous bands): the supertrend is 0
  on bar 0 (was na), na on the next bars while the ATR is na. Equal to PineScript on every bar of two full daily
  histories (5,490 and 11,536 bars) (#128)
- `ta.cmo` is na on a flat window (`0 / 0`); it returned 0 (#127)

## [0.9.1] - 2026-10-01

### Added

- `callsite.lowest()` / `callsite.highest()`: `ta.lowest` / `ta.highest` with a series length (a different length on
  each call), called with `(value, length)`. PineScript keeps a state between calls for a series length; equal to
  PineScript on every bar of two full daily histories (5,490 and 11,536 bars, 4 series each) (#126)

### Fixed

- `color.from_gradient` with an inverted range (`bottom_value > top_value`) returns `bottom_color` wherever the value
  is; it returned `top_color` when the value was above both ends (#121)
- `color.from_gradient`, `color.t`: an `rgba()` alpha is read as its byte `round(alpha * 255)`; `rgba(r, g, b, 0.1)`
  gave the byte 25 instead of 26. `color.new(c, 90)` keeps the byte 25, as in PineScript (#122)
- `input.color` default: PineScript keeps an alpha of 2 decimals for the default (`(100 - trunc(t)) / 100` for
  `color.new` / `color.rgb`, `round(AA / 255, 2)` for a hex literal), then the byte `round(255 * alpha)`. An input
  default `color.new(c, 90)` now has the byte 26 (25 before), `color.new(c, 9.9)` the byte 232 (230 before). Equal
  to PineScript on 1,338 defaults. A value given by the host is not changed (#122)
- `ta.rsi` is 100 when the average loss is 0 within 1e-10 and 0 when the average gain is 0 within 1e-10
  (PineScript `down == 0 ? 100 : up == 0 ? 0 : ...`) (#123)
- `array.avg` skips na elements (na when there is none) (#124)
- `ta.cci` keeps the previous value when the mean deviation is 0 within 1e-10 (flat window); it returned na (#125)

## [0.9.0] - 2026-10-01

### Fixed

- `request.security` D / W / M on extended-hours charts used future values: the premarket bars of the next trading
  day were added to the previous period's higher-timeframe bar, whose value appears on the last bar of its own
  trading day (e.g. the daily close shown at 19:00 was the close of 09:00 the next morning). A higher-timeframe bar
  now holds only the chart bars up to the bar that completes it. The mapping rules (when a period's value appears)
  do not change.
- `request.security` read a series computed outside its expression (e.g. `const e = ta.ema(close, 10)` then
  `request.security('', 'D', () => e)`) by higher-timeframe bar index, which gave wrong values with no error. It now
  throws and asks to compute the series inside the expression.
- A negative history offset read future bars: `Series.offset(-1)` and `c.get(src, -1)` now throw a `RangeError`.
- `LightweightChartsAdapter` did not work with lightweight-charts v5: it passed `{ type: 'Line' }` objects, which
  `chart.addSeries()` rejects. The host now passes the library's own series definitions:
  `new LightweightChartsAdapter(chart, { LineSeries, HistogramSeries }, mainSeries)` (breaking: the second argument
  was the main series). `SeriesOptions.pane` is passed to lightweight-charts as the pane index.
- Docs: the guide examples run as written (the script body is a function passed to `executeScript()`, numeric bar
  times, `math.sum(source, length)`, `ta.*` results are not recomputed by `BarData`); removed the references to a
  transpiler, a Babel plugin, a JSR package and `@oakscript/indicators`; added the bar shape, which API to use,
  `request.security` and the PineScript comparison rules (`compare.*`) in `eachBar()`.
- `strategy.*` per-bar values (`position_size`, `equity`, `opentrade(i)`, `closedtrade(i)`,
  `default_entry_qty()`...) could be read outside `strategy.eachBar()`, where they returned the engine's final
  state (a future value for every earlier bar). They now throw outside the loop. `strategy.initial_capital` and
  `strategy.account_currency` can still be read anywhere.

### Changed

- Package layout: unbundled ES modules in `dist/esm` and CommonJS modules in `dist/cjs`, each with its own type
  declarations. The types now resolve with every TypeScript `moduleResolution` (`node16`, `nodenext`, `bundler`,
  `node10`), for `import` and `require`. The root, `/runtime` and `/script` entries share their modules, so
  `Series`, `BarData` and the drawing registry are the same objects in all entries (before: each entry had its own
  copy). `"sideEffects": false` lets bundlers drop unused code (e.g. `import { compare } from 'oakscriptjs'` bundles
  to 0.5 KB instead of 87 KB). Deep imports of the old `dist/index.mjs` / `dist/script/index.cjs` files no longer
  work; use the package entries.
- The type declarations keep the documentation comments (editor hover help); the sources are shipped for the
  source maps.
- `lightweight-charts` is an optional peer dependency (no code imports it).
- Faster, with the same results bit for bit (checked against v0.8.2 on 721 cases: na windows, ties, +0 / -0,
  infinities, non-integer and negative lengths, 8 time zones over 1990-2037):
  - `ta.highest`, `ta.lowest`, `ta.highestbars`, `ta.lowestbars`: one pass over the bars (monotonic queue) instead
    of a scan of each window. 1M bars, length 200: 3,174 ms to 37 ms.
  - `ta.median`: a sorted window updated on each bar instead of a sort of each window. 1M bars, length 101:
    7,411 ms to 109 ms.
  - `ta.correlation`: no arrays created per bar. 1M bars, length 20: 608 ms to 74 ms.
  - Time zone offsets (`hour()`, `dayofweek()`, `time()` sessions, `timeframe.change()`...): computed once per UTC
    hour and cached, instead of one `Intl` call per bar. `hour(time, 'America/New_York')` on 1M bars: 3,222 ms
    to 127 ms.
- LICENSE: copyright line `2025-2026 Odyssée` (was `2024 OakScriptJS`).

## [0.8.2] - 2026-10-01

### Added

- `force_overlay` option (PineScript `force_overlay`) in the script API `plot()`, `plotshape()`, `plotchar()`,
  `plotarrow()` and `bgcolor()`, copied to `PlotConfig.forceOverlay`, `ShapeConfig.forceOverlay`,
  `ArrowConfig.forceOverlay` and `BarColorConfig.forceOverlay` (bgcolor), and `force_overlay` in `PlotOptions`. A host
  draws these outputs on the main chart pane when the script is not an overlay. Not set means false. PineScript has no
  `force_overlay` on `fill()`, `hline()` and `barcolor()`: a fill between two force_overlay plots follows its
  plots (#115, #117).

### Changed

- `math.sum`, `ta.sma`, `ta.stdev`, `ta.variance` and `ta.mfi` compute their window sums as PineScript does, bit for
  bit: a compensated (Kahan) running sum that removes the compensated value stored for the value leaving the window,
  and takes the sum again from the window values (newest first) when the compensation would be lost on the new value
  (#114). The results can differ from the exact window sum in the last bits, as in PineScript (e.g. `ta.sma` of a
  window `[0, 0]` can be `1.8e-15`, `ta.stdev` `1.7e-7`), which changes `z = std > 0 ? ... : 0` style tests.
  Checked against PineScript on two full daily histories (BTCUSD 5,490 bars, AAPL 11,535 bars): `ta.sma` lengths 2 to
  70, `ta.stdev` / `ta.variance` biased and unbiased, `math.sum`, `ta.mfi(hlc3, 14)`, series with na values: 0
  different values out of about 430,000.
- `ta.stdev` / `ta.variance`: biased `sumSq / n - mean * mean`, unbiased `sumSq / (n - 1) - mean * sum / (n - 1)`
  from the running sums (before: two-pass deviations); `ta.stdev` is 0 when the variance is not positive.
- `math.sum` and `ta.variance` skip +/-Infinity like na (before: only NaN).
- `ta.rma` (and so `ta.rsi`, `ta.atr`, `ta.dmi`) evaluates `(source + (length - 1) * rma[1]) / length`, as
  PineScript (before: `alpha * source + (1 - alpha) * rma[1]`, equal in theory but different in the last bits).
  `ta.rsi(close, 14)` is now bit-identical to PineScript on all bars of two full daily histories (5,476 and 11,521
  bars; before: 2,493 and 4,865) (#118).
- `ta.ema`, `ta.rma`, `ta.wma` and `ta.stdev` treat +/-Infinity as na, as PineScript (before: an infinite input gave
  Infinity on its bar and NaN on every later bar for `ta.ema` / `ta.rma`) (#119).

### Fixed

- `ta.wma` (and so `ta.hma`) gives na until `length` non-na source values were received (before: a value as soon as
  the last `length` bars, na bars included, were filled), and sums the window from the oldest bar to the newest, as
  PineScript. Equal to PineScript, bit for bit, on two full daily histories (BTCUSD 5,490 bars, AAPL 11,535 bars) for
  `ta.wma` / `ta.hma` of close, volume and of series with na values (24 series, 0 different values; before, the
  summation order alone differed on 1,520 to 6,971 bars per series) (#120).
- `ta.median` skips na values: the median of the last `length` non-na values (going back as many bars as needed), na
  until `length` non-na values exist; a bar with an na value still gets a result (before: the median of the non-na
  values of the last `length` bars). Equal to PineScript on all 11,535 bars of a full daily history (#116).

## [0.8.1] - 2026-09-30

### Added

- `linestyle` of plots (`'solid' | 'dashed' | 'dotted'`, as for hlines; PineScript `plot(..., linestyle)`) in
  `PlotConfig`, `PlotOptions` and the script API `plot()` options, passed to the plot config. Not set means solid.
  PineScript accepts it with every plot style; the value is a constant or an input, not a per-bar series (#105).
- Script API constants: `plot.style_*` (line, linebr, stepline, steplinebr, stepline_diamond, histogram, columns,
  area, areabr, circles, cross), `plot.linestyle_solid / _dotted / _dashed`, `hline.style_solid / _dotted / _dashed`.
  `stepline_diamond` is added to the plot style type.
- Script API `barstate.*` (`isfirst`, `islast`, `ishistory`, `isrealtime`, `isnew`, `isconfirmed`,
  `islastconfirmedhistory`) as 1 / 0 Series. All bars but the last are confirmed history bars; the state of the last
  bar comes from the new `ChartContext` flags `lastBarConfirmed` (default false), `realtime` (default false) and
  `lastBarNew` (default true). Without live updates the last bar is a history bar that is not confirmed, as in
  PineScript (#112).
- Script API `plotarrow(series, title?, { colorup, colordown, offset, minheight, maxheight, display })`: the
  declaration goes to `arrowConfig` (PineScript defaults `#00FF00`, `#FF0000`, 5, 100), the arrows (value and color
  per bar, 0 / na: none) to `result.arrows` (#111).
- `input.*` options `group`, `inline`, `tooltip`, `confirm`, `display` for every input kind, copied to
  `InputConfig` (#109).
- `callsite.barssince()`: a `ta.barssince` call site for bar loops. The `callsite` documentation and the guide
  explain the lazy `and` / `or` of PineScript v6: a `ta.*` call in a right operand runs only when the left operand
  does not decide the result (#113).

### Changed

- `STRATEGY_DEFAULTS` has the PineScript v6 values: `default_qty_type` `percent_of_equity`, `default_qty_value`
  100, `initial_capital` 100000 (before: the v5 values `fixed`, 1, 1000000) (#106).
- Division by zero follows PineScript: `x / 0` is +/-Infinity in `Series.div` and `div()` (before: na); `0 / 0` is
  na. PineScript keeps the infinite value in comparisons (`1 / 0 > 0` is true) and treats it as na elsewhere, so
  `na()` is true for +/-Infinity, `nz()` replaces it, the script API `plot()` draws it as na, `ta.sma` skips it and
  `ta.cum` is na on its bar; `fixnan()` keeps it, as in PineScript (#108).
- `hline()` draws dashed when no line style is given, as PineScript: the script API sets `linestyle: 'dashed'` in the
  hline config, and the runtime `hline()` draws dashed (before: not set / solid).

### Fixed

- `color.rgb`, `color.from_hex`, `color.new` and `color.from_gradient` are typed as returning `string` (they always
  return a CSS color), so their results are accepted by `plot`, `fill`, `plotshape`, `bgcolor`, `barcolor` and
  `input.color` (#107).
- Script API `ta.mfi(source, length)` uses the chart volume, as PineScript (before: a third `volume` argument was
  needed) (#110).
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
