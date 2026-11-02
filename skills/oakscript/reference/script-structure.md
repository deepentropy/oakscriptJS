# Script structure

## Execution model

Pine Script runs a script once per bar. OakScript runs the script body **once per calculation, over all the bars
at once**:

- Top-level code computes whole Series (one value per bar) with `ta.*` and the Series methods.
- Logic that needs the bars one by one (state, `if` on values, loops) goes in `eachBar((c) => ...)` or, for a
  strategy, `strategy.eachBar((c) => ...)`.
- The host runs the body again when bars arrive or an input changes; every run starts from scratch, so plain
  `let` variables are reset on each run (as Pine resets `var` on a recalculation).

Order of a script: declaration, inputs, Series math, bar loops, outputs. Outputs can appear anywhere after the
values they plot.

## Declaration

```js
indicator("Average True Range Bands", {
  shorttitle: "ATR Bands", // legend title
  overlay: true,           // default true: price pane; false: own pane
  precision: 2,            // decimals shown
  max_labels_count: 100,   // also max_lines_count, max_boxes_count, max_polylines_count (default 50)
});
const atr = ta.atr(14);
plot(close.add(atr.mul(2)), "Upper");
plot(close.sub(atr.mul(2)), "Lower");
```

`strategy(title, options)` replaces `indicator()` for a strategy (default `overlay: false`); its properties are in
[strategies.md](strategies.md). A script without a declaration runs with the title "Untitled" and overlay on.

## Inputs

Each `input.*` call declares the input for the host's settings and returns its current value: the host's
override when there is one, else the default.

| Call | Returns |
|---|---|
| `input.int(defval, title, { minval, maxval, step })` | integer (rounded) |
| `input.float(defval, title, { minval, maxval, step })` | number |
| `input.bool(defval, title)` | boolean |
| `input.string(defval, title, { options: [...] })` | string (a choice list with `options`) |
| `input.text_area(defval, title)` | multi-line string |
| `input.color(defval, title)` | colour string |
| `input.source("close", title)` | Series (`open high low close volume hl2 hlc3 ohlc4 hlcc4`, or another script's output when the host allows it) |
| `input.timeframe("D", title, { options })` | timeframe string (`""`: the chart timeframe) |
| `input.session("0930-1600", title)` | session string |
| `input.symbol("NASDAQ:AAPL", title)` | ticker id for `request.security` |
| `input.time(timestamp("2024-01-01"), title)` | UNIX time in ms |

Options of every kind: `group`, `inline`, `tooltip`, `confirm`, `display`, `active` (false greys the input out).

```js
indicator("Inputs demo");
const showMa = input.bool(true, "Show MA", { group: "Average", inline: "ma" });
const maLength = input.int(20, "Length", { minval: 1, maxval: 500, group: "Average", inline: "ma", active: showMa });
const maColor = input.color(color.blue, "Colour", { group: "Average" });
const mode = input.string("Close", "Price", { options: ["Close", "HL2"], tooltip: "Price of the average" });
const src = mode === "HL2" ? hl2 : close; // inputs are plain values: JS operators work on them
plot(ta.sma(src, maLength), "MA", { color: maColor, display: showMa ? "all" : "none" });
```

**Input ids.** The host sets inputs by id: the title in snake case (`"Fast length"` is `fast_length`, a repeated
title gets `_2`, `_3`). Keep titles stable: renaming one resets the user's value.

## Series

`close`, `open`, `high`, `low`, `volume`, `hl2`, `hlc3`, `ohlc4`, `hlcc4`, the `ta.*` results and the inputs from
`input.source` are `Series`: one number per bar, NaN for na.

| Pine | Series method |
|---|---|
| `a + b`, `a - b`, `a * b`, `a / b`, `a % b`, `-a`, `math.pow(a, n)` | `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)`, `a.mod(b)`, `a.neg()`, `a.pow(n)` |
| `a > b`, `a >= b`, `a < b`, `a <= b`, `a == b`, `a != b` | `a.gt(b)`, `a.gte(b)`, `a.lt(b)`, `a.lte(b)`, `a.eq(b)`, `a.neq(b)` (1 / 0, false with na) |
| `a and b`, `a or b`, `not a` | `a.and(b)`, `a.or(b)`, `a.not()` |
| `cond ? x : y` | `cond.iff(x, y)` (na and 0 are false) |
| `a[n]` | `a.offset(n)` (n >= 0) |

`b` can be a Series or a number. Comparisons follow the Pine rules (1e-10 tolerance). `series.toArray()` gives
the values as a `number[]` (oldest first); `seriesOf(numbers)` turns an array with one value per bar back into a
Series.

```js
indicator("Body ratio", { overlay: false });
const body = close.sub(open);
const range = high.sub(low);
const ratio = range.gt(0).iff(body.div(range), 0);           // guard the division
plot(ratio, "Body / range", { style: plot.style_columns, color: color.when(ratio.gt(0), color.teal, color.red) });
hline(0);
```

`ta.*` takes Series and lengths (a plain number; `ta.sma`, `ta.wma`, `ta.stdev`, `ta.variance`, `ta.highest`,
`ta.lowest` also accept a Series of lengths) and returns a Series, or an array of Series for the Pine tuples
(`ta.macd`, `ta.bb`, `ta.kc`, `ta.dmi`, `ta.supertrend`, `ta.ichimoku`, `ta.vwap(src, anchor, mult)`). The chart
functions read the bars themselves: `ta.atr(14)`, `ta.tr(true)`, `ta.sar()`, `ta.supertrend(3, 10)`,
`ta.dmi(14, 14)`, `ta.wpr(14)`, `ta.mfi(hlc3, 14)`, `ta.highest(20)` (high), `ta.pivothigh(5, 5)`. The volume
indicators are variables: `ta.obv`, `ta.accdist`, `ta.pvt`, `ta.nvi`, `ta.pvi`, `ta.iii`, `ta.wad`, `ta.wvad`.

## Bar loops: eachBar

`eachBar(fn)` calls `fn(c)` once per bar, oldest first, and returns a Series of the values it returns
(`true` / `false` become 1 / 0, no return value becomes NaN).

| `c.` | Value |
|---|---|
| `i`, `n` | bar index (Pine `bar_index`), number of bars (`c.i === c.n - 1` is the last bar) |
| `time` | bar open time, in the unit of the bars (UNIX seconds by default) |
| `open`, `high`, `low`, `close`, `volume` | the bar's prices |
| `get(series, k = 0)` | `series[k]` as a number (NaN before the first bar) |
| `prev(k = 1)` | this loop's own return value k bars back (Pine self-reference) |

```js
indicator("ATR trailing stop", { overlay: true });
const atr = ta.atr(14);
let stop = NaN; // var float stop = na
let dir = 1;    // var int dir = 1
const dirs = [];
const trail = eachBar((c) => {
  const offset = 3 * c.get(atr);
  if (Number.isNaN(offset)) { dirs.push(NaN); return NaN; }
  if (dir === 1) {
    stop = Number.isNaN(stop) ? c.close - offset : Math.max(stop, c.close - offset);
    if (c.close < stop) { dir = -1; stop = c.close + offset; }
  } else {
    stop = Math.min(stop, c.close + offset);
    if (c.close > stop) { dir = 1; stop = c.close - offset; }
  }
  dirs.push(dir);
  return stop;
});
const up = seriesOf(dirs).eq(1);
plot(trail, "Stop", { style: plot.style_linebr, color: color.when(up, color.teal, color.red) });
plotshape(up.and(up.offset(1).not()), "Flip up", { style: "circle", location: "belowbar", color: color.teal, size: "tiny" });
```

- A `let` before the loop is Pine `var`: it keeps its value from bar to bar. A `const` inside the callback is a
  plain per-bar variable.
- Several outputs from one loop: push into arrays declared before the loop, then `seriesOf(array)`.
- Plain `Math.*` is fine on numbers; Pine's `math.*` is available too (`math.max`, `math.round`...).
- History: `c.get(x, k)` and `x.offset(k)` reach at most 5000 bars back (the built-in prices have no limit).
- `varip(initial)` (declare it at the top level, use `.value`) keeps its value through the intrabar runs of a
  strategy; without them it is a plain variable.
- A `ta.*` call in an `if` block or in the right side of `&&` / `||` sees only some bars in Pine. To port that
  exactly, use the call sites of `callsite` (`import { callsite } from "oakscriptjs";`), e.g.
  `const since = callsite.barssince();` then `since(cond)` in the loop.

## Builtins

| Name | Value |
|---|---|
| `time`, `time_close`, `time_tradingday`, `timenow` | Series of UNIX ms |
| `time(tf, session?, timezone?)`, `time_close(tf, ...)` | period open / close time, NaN outside the session |
| `year(t)`, `month(t)`, `dayofmonth(t)`, `dayofweek(t)`, `hour(t)`, `minute(t)`, `second(t)`, `weekofyear(t)` | calendar fields of a time (number or Series) in the exchange time zone (or the given one) |
| `timestamp("2024-01-01")`, `timestamp(2024, 1, 1, 9, 30)` | UNIX ms |
| `barstate.isfirst / islast / isconfirmed / isrealtime / isnew / ishistory / islastconfirmedhistory` | Series of 1 / 0 |
| `session.isfirstbar / islastbar / ismarket / ispremarket / ispostmarket` | Series of 1 / 0 |
| `timeframe.period`, `timeframe.isintraday`, `timeframe.isdaily`, `timeframe.multiplier`..., `timeframe.change("W")`, `timeframe.in_seconds()` | chart timeframe values |
| `syminfo.tickerid`, `syminfo.mintick`, `syminfo.timezone`, `syminfo.currency`, `syminfo.type`... | symbol values |
| `str.tostring(x, "#.##")`, `str.format("{0} / {1}", a, b)`, `str.*` | text |
| `math.*`, `color.*`, `compare.*` | as in Pine; `compare` gives the Pine comparison of two numbers |

The time, session, timeframe and symbol values come from the host's chart context. An app supplies them; in your
own `executeScript` call pass them in the 4th argument, or the script stops with "... is not known: pass it as
executeScript(body, bars, inputs, { ... })".

```js
indicator("Session marks", { overlay: true });
const newDay = timeframe.change("D");
bgcolor(color.when(newDay, color.new(color.blue, 80)), { title: "New day" });
plotchar(barstate.islast, "Last", { char: "L", location: "abovebar" });
plot(close, "Close", { display: "none" });
```

## Drawings

`label.new`, `line.new`, `box.new`, `polyline.new`, `linefill.new` and `table.new` create objects; the host draws
the ones alive after the last bar. Create them in a bar loop with bar indexes (`c.i`) or bar times. Old objects
are deleted above `max_*_count` (default 50). To keep one object and move it, store it in a variable and update
it with the `set_*` functions, or hold it with `varDrawing()` (Pine `var line l = na`). See
[plotting.md](plotting.md#drawings).
