# Pine Script v6 and OakScript

The names, arguments, defaults and results follow Pine Script v6 (the `ta.*`, `math.*`, `str.*`, `array.*`,
`matrix.*`, `map.*` and drawing functions are covered almost entirely). The differences come from JavaScript and
from the vectorized execution.

## Translation table

| Pine Script v6 | OakScript |
|---|---|
| `//@version=6` | nothing |
| `indicator("T", overlay=true)` | `indicator("T", { overlay: true })` |
| `len = input.int(14, "Length", minval=1)` | `const len = input.int(14, "Length", { minval: 1 })` or `input.int(14, { title: "Length", minval: 1 })` |
| `src = input.source(close, "Source")` | `const src = input.source(close, "Source")` |
| `a + b`, `a - b`, `a * b`, `a / b` on series | `a.add(b)`, `a.sub(b)`, `a.mul(b)`, `a.div(b)` |
| `a > b`, `a == b`, `a and b`, `not a` on series | `a.gt(b)`, `a.eq(b)`, `a.and(b)`, `a.not()` |
| `cond ? x : y` on series | `cond.iff(x, y)` |
| `x[1]` | `x.offset(1)`; in a bar loop `c.get(x, 1)` |
| `na`, `na(x)`, `nz(x)` | `NaN`, `na(x)` / `nz(x)` (a Series: `na` gives 1 / 0; or numbers in a bar loop) |
| `var float s = na` + `s := ...` | `let s = NaN;` before `eachBar((c) => { s = ...; })` |
| `if close > open` (per bar) | in a bar loop: `if (c.close > c.open)` |
| `for i = 0 to n - 1` | `for (let i = 0; i < n; i++)` in a bar loop |
| `switch` / `if` returning a value | JS `switch` / `if` in a bar loop, or `iff` chains on Series |
| `bar_index`, `last_bar_index` | the Series `bar_index`, `last_bar_index`; in a bar loop `c.i`, `c.n - 1` |
| `myFunc(x) => ...` | a JS `function`; on Series it composes Series methods |
| `[a, b] = f()` | `const [a, b] = f()` |
| `plot(x, "T", color=c, style=plot.style_columns)` | `plot(x, "T", { color: c, style: plot.style_columns })` |
| `plot(x, color = cond ? c1 : c2)` | `plot(x, "T", { color: color.when(cond, c1, c2) })` |
| `plotshape(cond, style=shape.triangleup, location=location.belowbar, size=size.small)` | `plotshape(cond, "T", { style: shape.triangleup, location: location.belowbar, size: size.small })` |
| `label.new(bar_index, high, "A", style=label.style_label_down)` (in an `if`) | in a bar loop: `label.new(bar_index, high, "A", { style: label.style_label_down })` (or `c.i`, `c.high`) |
| `line.new(x1, y1, x2, y2, extend=extend.right)` | `line.new(x1, y1, x2, y2, { extend: extend.right })` |
| `xloc.bar_time`, `yloc.abovebar`, `line.style_dashed`, `format.volume`, `display.none`, `dayofweek.monday` | the same |
| `request.security(sym, "D", ta.ema(close, 20))` | `request.security(sym, "D", () => ta.ema(close, 20))` |
| `request.security(sym, "W", high[1], lookahead = barmerge.lookahead_on)` | `request.security(sym, "W", () => high.offset(1), { lookahead: barmerge.lookahead_on })` |
| `strategy.entry("L", strategy.long, when = cond)` | `strategy.eachBar((c) => { if (c.get(cond) === 1) strategy.entry("L", strategy.long); })` |
| `strategy.opentrades.entry_price(0)` | `strategy.opentrade(0)?.entry_price` (`strategy.opentrades` is the count: a JavaScript number cannot also hold the functions) |
| `strategy.closedtrades.profit(i)` | `strategy.closedtrade(i)?.profit` |
| `array.new_float(10, 0)`, `matrix.new<float>()`, `map.new<string, float>()` | `import { array, matrix, map } from "oakscriptjs";` then `array.new_float(10, 0)`, `matrix.new_matrix(...)`, `map.new_map()`; or plain JS arrays / `Map` |
| `log.info("x = " + str.tostring(x))` | not available: plot it with `display: "data_window"` or put it in a label |

The Pine constants exist with their Pine names: `shape.*`, `location.*`, `size.*`, `xloc.*`, `yloc.*`,
`extend.*`, `display.*`, `format.*`, `font.family_*`, `scale.*`, `order.*`, `currency.*`, `adjustment.*`,
`label.style_*`, `line.style_*`, `dayofweek.*`, `color.*`, `plot.style_*`, `plot.linestyle_*`, `hline.style_*`,
`strategy.long / short / fixed / cash / percent_of_equity`, `strategy.commission.*`, `strategy.direction.*`,
`strategy.oca.*`, `barmerge.*`, `position.*`, `text.align_* / wrap_* / format_*`, `alert.freq_*`,
`session.regular / extended`, `math.pi / e / phi / rphi`. Their values are the strings the functions take
(`shape.triangleup` is `"triangleup"`).

## Execution differences

- **Vectorized**: top-level code runs once on all bars. A Pine statement that runs per bar becomes either a
  Series expression or a bar-loop statement. Top-level JS `if` / ternaries see plain values only (inputs,
  constants), never per-bar values.
- **`ta.*` in conditional code**: in Pine a `ta.*` call inside an `if` (or the right side of `and` / `or`) keeps
  a history of the bars where it ran. Computing it before the loop sees every bar, which can differ. For exact
  ports use `callsite` (`import { callsite } from "oakscriptjs";`): `callsite.crossover()`, `barssince()`,
  `highest()`, `lowest()`, `sma()`, `sum()`, `stdev()`, `linreg()`, `pivothigh()`... called with plain values in the
  loop, or `callsite.whenCalled(calledSeries, fn, ...sources)`. A `ta.crossover` / `ta.crossunder` inside a `for`
  loop (several calls per bar) is `callsite.crossoverByBar()` / `crossunderByBar()`, called with `(bar_index, a, b)`:
  every call compares with the last call of the previous bar.
- **Recalculation**: no rollback per tick in indicators; the host runs the script again on new data. Strategies
  can run inside the bar (`calc_on_order_fills`, bar magnifier ticks); `varip(initial)` keeps its value through
  those runs.
- **History**: at most 5000 bars back (`max_bars_back` is fixed), as Pine's default.
- **Time unit**: `time`, `time_close`, `timestamp()` and `input.time` are in ms as in Pine; `c.time` is the bar's
  own time (UNIX seconds unless the host uses ms).

## API differences

- `plot()` has no `show_last`, `trackprice` or `join` option. `offset` shifts the plot as in Pine (values past the
  first or last bar are not drawn).
- `fill()` accepts `show_last` / `fillgaps` / `display` and ignores them.
- `input.enum` does not exist (no `enum` declarations): use `input.string(..., { options })`.
- `request.*`: only `request.security` and `request.security_lower_tf`. No `request.financial`,
  `request.dividends`, `request.earnings`, `request.splits`, `request.economic`, `request.seed`,
  `request.currency_rate`, `request.footprint`. `ticker.*`: only `ticker.heikinashi` and `ticker.standard`.
- `math.random(min, max, seed)`: with a seed, Pine's sequence, but one generator per seed value (Pine has one
  per call site): two calls with the same seed need `callsite.random(seed)`.
- `math.log`, `math.exp`, `math.pow`, `math.sin`, `math.cos`, `math.tan`, `math.log10` can differ from Pine in
  the last digit. Pine rounds constant expressions (`1 / 255`) to 16 decimals: wrap them in `math.constant()`
  when a script truncates them (`math.constant(1 / 255)`).
- Strategy results come from the host's engine; the deprecated `when` argument does not exist.
- No Pine libraries (`import user/lib/1`), no `type` / `method` / `enum` declarations: use JS objects, classes
  and functions. No type keywords (`float`, `series int`...).
- `syminfo.*`, `timeframe.*`, `time()`, `session.*` need the host's chart context (an app gives it).
- Strings: JS strings; `+` concatenates; `str.tostring(x, "#.##")`, `str.format("{0} {1}", a, b)`.
