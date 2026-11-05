---
name: oakscript
description: Write, port, review or fix OakScript scripts - indicators and strategies written in JavaScript with the oakscriptjs/script API, a Pine Script v6-style API. Use when asked to create or debug an indicator, oscillator, overlay, signal, alert or backtest strategy for OakScriptJS or for an app that runs OakScript scripts (such as the OpenTrader script editor), or to port a Pine Script v6 script to JavaScript.
---

# Writing OakScript scripts

An OakScript script is **plain JavaScript** that reads like Pine Script v6. The host (a chart app, a worker,
a test) runs the whole script body on all the bars at once, and runs it again when the bars or the inputs change.

```js
indicator("My SMA", { overlay: true });                      // one declaration: indicator() or strategy()
const length = input.int(20, "Length", { minval: 1 });       // an input: declared AND read here
const sma = ta.sma(close, length);                           // Series math, all bars at once
plot(sma, "SMA", { color: color.blue, linewidth: 2 });       // an output
plotshape(ta.crossover(close, sma), "Cross", { style: shape.triangleup, location: location.belowbar });
```

## The script format

- The file is the script body: top-level statements, no wrapper function, no `export`.
- Every export of `oakscriptjs/script` is a global: `indicator`, `strategy`, `input`, `plot`, `ta`, `color`,
  `close`, `request`, `eachBar`, `label`, `table`... No import is needed.
- Write JavaScript, not TypeScript: the app editor runs the source without a compile step, so type annotations
  are syntax errors.
- Other modules: `import { array, matrix, map, callsite } from "oakscriptjs";` at the top of the script (these
  are not globals). Use JS arrays and `Map` when you can.
- Outside an app, a host passes the body as a function: see [Running a script](#running-a-script).
- A source that exports `calculate(bars, inputs, chart)` is an older format (built-in indicator sources use it).
  Write new scripts in the format above; a strategy must use it.

## Workflow

0. **Write the spec first** when you can run a command: the user's request as a small JSON file (title, pane,
   inputs and defaults, outputs, what the signals look like, `"scenarios": true`) and, for the behaviour it cannot
   count ("Buy only when the RSI is below 30"), a checks file; `oakscript check` checks both (step 6). An unknown spec
   key is an error. See [check](reference/check.md#the-spec).
1. **Declare** with `indicator(title, { overlay })` (overlay `true`: on the price pane; `false`, the default: own pane) or
   `strategy(title, { ...properties })`. Exactly one declaration, at the top.
2. **Inputs**: `input.int / float / bool / string / color / source / timeframe / session / symbol / time`.
   They return plain values (a Series for `input.source`). The input id is the title in snake case
   ("Fast length" is `fast_length`): hosts pass overrides by id.
3. **Compute with Series** before any loop: `ta.*`, the price builtins and the Series methods
   (`.add .sub .mul .div .gt .lt .eq .and .or .not .iff .offset`).
4. **Per-bar state** (Pine `var`, `:=`, `if` on series values, loops): `eachBar((c) => ...)`; for a strategy,
   `strategy.eachBar((c) => ...)` holds the orders.
5. **Outputs**: `plot`, `hline`, `fill`, `plotshape`, `plotchar`, `plotarrow`, `bgcolor`, `barcolor`,
   `plotcandle`, drawings (`label.new`, `line.new`, `box.new`, `table.new`), `alertcondition`, `alert`.
6. **Check it**: `npx oakscript check script.js --spec spec.json` type-checks the script, runs it on 1,500 bars
   and reports errors with their line, the inputs and outputs, the values and signal counts, the failed spec items and
   warnings (an empty plot, a signal on every bar or never, an input that changes nothing). Fix until the exit code is
   0, or 2 with warnings you have read. For a port, `--export chart-export.csv` compares the values bar by bar. See
   [check](reference/check.md).
7. **Without a command**, check by hand: compile errors, runtime errors, then the plot values on the last bars
   (an empty plot means NaN everywhere). See [errors](reference/errors.md).
8. Start from the closest [example](#examples) rather than from scratch.

## Rules

1. **No operators on Series.** JavaScript has no operator overloading: `close - open`, `rsi > 50` and
   `` `${rsi}` `` throw a TypeError, and `if (ta.crossover(a, b))` is always true (an object, no error). Write `close.sub(open)`, `a.gt(b)`, `cond.iff(x, y)`,
   `x.offset(1)` (Pine `x[1]`), `a.and(b)`, `a.not()`. Conditions are Series of 1 / 0.
2. **Plain numbers inside the bar loops.** In `eachBar` / `strategy.eachBar`, `c.close`, `c.get(series)`,
   `c.get(series, 1)` are numbers: JS operators, `if`, `for` work. A condition reads `c.get(cond) === 1`.
3. **Compute `ta.*` outside the loops.** A `ta.*` call inside a bar callback throws: compute the Series before
   the loop and read it with `c.get()`.
4. **Pine constants exist** as in Pine: `shape.*`, `location.*`, `size.*`, `xloc.*`, `yloc.*`, `extend.*`,
   `display.*`, `format.*`, `font.*`, `scale.*`, `order.*`, `currency.*`, `label.style_*`, `line.style_*`,
   `dayofweek.*`, `color.*`, `plot.style_*`, `plot.linestyle_*`, `hline.style_*`, `strategy.*`, `barmerge.*`,
   `position.*`, `text.*`, `alert.freq_*`, `session.*`, `barstate.*`. Their values are strings
   (`shape.triangleup` is `"triangleup"`), which also work.
5. **Arguments**: Pine's named arguments are an object after the leading arguments, with Pine's names:
   `plot(series, title, { color, linewidth, style })`, `input.int(14, { title: "Length", minval: 1 })`,
   `request.security(sym, "W", () => open, { lookahead: barmerge.lookahead_on })`, `strategy.exit(id, { from_entry, stop })`,
   `label.new(c.i, c.high, "A", { style: label.style_label_down, textcolor: color.white })`. Drawing functions
   also take all their arguments by name (`line.new({ x1, y1, x2, y2, extend: extend.right })`); an unknown name
   throws with the closest names. In a bar loop a Series argument of a drawing is its value on the current bar
   (`label.new(bar_index, high, "A")`).
6. **na is NaN.** There is no `na` constant: use `NaN` (`undefined` for a colour). `na(x)` and `nz(x, y)` take
   a Series (`na(x)` is a Series of 1 / 0, `nz(x, open)` a Series) or numbers in a bar loop; `fixnan(x)` too.
   Plots skip NaN bars. JS comparisons with NaN are false; for the Pine rules (1e-10 tolerance) use
   `compare.gt(a, b)`, `compare.eq(a, b)`...
7. **Per-bar colours** are arrays with one colour per bar: `color.when(cond, colorTrue, colorFalse?)`
   (omitted: na), or an array you fill in a bar loop. `color.new(c, transp)` sets the transparency (0-100).
8. **Strategies**: order calls (`strategy.entry/exit/close/...`) and per-bar reads (`strategy.position_size`,
   `strategy.equity`, `strategy.netprofit`...) only inside `strategy.eachBar()`, which runs once per script.
9. **Other timeframes**: compute the series **inside** the expression:
   `request.security("", "D", () => ta.ema(close, 20))`, never `() => myEma`.
10. **No future bars**: offsets are 0 or positive; history reaches at most 5000 bars back.
11. **Self-contained and fast**: no network, timers or DOM; the same bars give the same output. Hosts stop a
    run that takes too long (seconds), so avoid nested loops over all bars.

## Pine Script v6 at a glance

| Pine Script v6 | OakScript |
|---|---|
| `//@version=6` | nothing |
| `a + b`, `a > b`, `c ? x : y` (series) | `a.add(b)`, `a.gt(b)`, `c.iff(x, y)` |
| `close[1]` | `close.offset(1)`; in a loop `c.get(close, 1)` |
| `var x = 0` / `x := ...` | `const x = persist(0)` before `eachBar`, `x.value = ...` in the callback (or a `let x = 0` before `eachBar`; see reference/script-structure.md) |
| `bar_index`, `last_bar_index` | the Series `bar_index`, `last_bar_index`; in a bar loop `c.i`, `c.n - 1` |
| `plot(x, "T", color=c, linewidth=2)` | `plot(x, "T", { color: c, linewidth: 2 })` |
| `[a, b, c] = ta.macd(...)` | `const [a, b, c] = ta.macd(...)` |
| `if cond` + `strategy.entry(...)` | `strategy.eachBar((c) => { if (c.get(cond) === 1) strategy.entry(...) })` |

Full table, the deviations and the unsupported parts: [reference/pine-differences.md](reference/pine-differences.md).

## Common mistakes

- `if (series)`, `series ? a : b` at the top level: always true, with no error; use Series methods (rule 1).
- `close - open`, `ma > 50`: a TypeError; use Series methods (rule 1).
- `ta.sma(...)` inside `eachBar`: an error; compute it before the loop (rule 3).
- `ta.stoch(close, high, low, 14)` takes all four arguments, as in Pine.
- A per-bar colour from a JS ternary on a Series (`cond ? green : red`): one colour; use `color.when()`.
- `strategy.position_size` at the top level: read it inside `strategy.eachBar()`.
- Two `indicator()` calls, or `indicator()` and `strategy()` in one script: one declaration only.
- Pine named arguments with `=` (`label.new(x, y, text = "A", style = ...)`): an object, `{ style: ... }`.
- `strategy.opentrades.entry_price(0)`: `strategy.opentrades` is the count (a number); use
  `strategy.opentrade(0)?.entry_price` (same for `strategy.closedtrades.*` with `strategy.closedtrade(i)`).

## Reading errors

- **Syntax errors** come with the line and column of your source (the app editor maps them to your lines).
- **Runtime errors** stop the run: the message names the call and the fix, e.g. `strategy.entry() must be
  called inside strategy.eachBar().`, `ta.smaa does not exist. Did you mean ta.sma?`, `JavaScript operators
  (+ - * / ...) do not work on a Series: use its methods...` A host that runs a declaration pass first (zero bars) reports declaration
  errors when the script is saved.
- **No error, wrong output**: an empty plot (NaN everywhere: a NaN input to the math, a division by zero),
  a branch taken on every bar (a Series used as a JS boolean). Check the plot values on the last bars.

The messages and their fixes: [reference/errors.md](reference/errors.md).

## Examples

Complete scripts, run by the package's CI on synthetic bars:

- [examples/ma-cross.js](examples/ma-cross.js): overlay, inputs (incl. a choice list), two MAs, a per-bar
  coloured fill, cross markers, alert conditions.
- [examples/macd-oscillator.js](examples/macd-oscillator.js): own pane, tuple from `ta.macd`, four-colour
  histogram built in a bar loop, zero line, background.
- [examples/mtf-trend-filter.js](examples/mtf-trend-filter.js): `request.security` on a higher timeframe
  (tuple), `var`-style state in `eachBar`, signal labels, a label on the last bar.
- [examples/ma-cross-strategy.js](examples/ma-cross-strategy.js): `strategy()` with sizing and commission,
  long / short entries, stop loss and take profit with `strategy.exit`, a results table.

## Reference

- [reference/script-structure.md](reference/script-structure.md): declarations, inputs, Series, `eachBar`,
  builtins (`time`, `barstate`, `timeframe`, `syminfo`), drawings' lifetime.
- [reference/plotting.md](reference/plotting.md): lines, histograms, shapes, characters, arrows, fills,
  colours, background and bar colours, candles, labels, lines, boxes, tables, alerts.
- [reference/timeframes-symbols.md](reference/timeframes-symbols.md): `request.security` (higher and lower
  timeframes, other symbols, tuples, lookahead), `request.security_lower_tf`, `timeframe.*`.
- [reference/strategies.md](reference/strategies.md): properties, sizing, orders, exits, reading the results,
  risk rules, the host's order engine.
- [reference/pine-differences.md](reference/pine-differences.md): Pine Script v6 to OakScript, what is not
  supported.
- [reference/errors.md](reference/errors.md): compiler and runtime errors, silent mistakes.
- [reference/check.md](reference/check.md): `oakscript check`, its warnings, the spec and reference files.

## Type-checking

`oakscript check` runs this type check itself. On its own: `oakscriptjs/script/globals` types the script globals; a
`tsconfig.json` next to the scripts, then `npx tsc -p .` (one error per mistake, with its line; no output means no
type error):

```json
{
  "compilerOptions": {
    "allowJs": true, "checkJs": true, "noEmit": true, "strict": true, "noImplicitAny": false,
    "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler", "moduleDetection": "force",
    "lib": ["ES2022"], "types": ["oakscriptjs/script/globals"]
  },
  "include": ["*.js"]
}
```

It needs `oakscriptjs` and `typescript` installed in the project. The checker does not see a Series used as a
JavaScript boolean (`if (cond)`, `cond ? a : b` with a Series `cond`): check those by hand (rule 1).

## Running a script

In an app (OpenTrader's script editor) save the script: the app compiles it, then runs it on the chart bars.
In your own code, wrap the body in a function and pass it to `executeScript` (imports needed there):

```ts
import { executeScript, indicator, input, plot, ta, close } from 'oakscriptjs/script';

const run = executeScript(() => {
  indicator('My SMA', { overlay: true });
  plot(ta.sma(close, input.int(20, 'Length')), 'SMA');
}, bars, { length: 50 }, { timeframe: '60', timezone: 'Etc/UTC', session: '24x7' });
// run.result.plots.plot0 -> [{ time, value }, ...]; run.inputConfig, run.plotConfig, run.strategyConfig...
```

Bars are `{ time, open, high, low, close, volume }`, oldest first, `time` in UNIX seconds. The chart context
(4th argument) gives the timeframe, time zone and session that `request.security`, `time()` and
`timeframe.*` need. A strategy also needs an order engine: see [strategies](reference/strategies.md#the-host-side).
