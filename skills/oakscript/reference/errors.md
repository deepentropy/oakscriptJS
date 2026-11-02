# Errors and how to read them

A script fails in one of three ways: it does not compile, it stops with a runtime error, or it runs and gives a
wrong output. Fix them in that order, then check the values.

## Compile errors (syntax)

The source is loaded as JavaScript: a syntax error comes with a line and a column of your source.

| Message | Cause | Fix |
|---|---|---|
| `Missing initializer in const declaration`, `Unexpected token ':'` | a TypeScript annotation (`const a: number = 5`) | remove the types: the script is JavaScript |
| `Unexpected identifier`, `Unexpected token '='` | Pine syntax: `x := 1`, `var x = 0`, `a = b ? c : d` on one line without `const`, `=>` functions, named arguments `f(a, length = 5)` | JS syntax: `x = 1`, `let x = 0`, `const a = ...`, `function f() {}`, options objects |
| `Unexpected token 'export'` / `'import'` at a wrong place | an import below other code, an export | imports first, no exports |

A host that compiles a script also runs it once on zero bars (a declaration pass: title, inputs, plots,
strategy properties). Errors in the declarations or in top-level code show up there, with the line.

## Runtime errors

The run stops at the first error; the message names the call. The ones you will meet:

| Message | Cause | Fix |
|---|---|---|
| `TypeError: series.toArray is not a function` | a number or NaN passed where a Series is expected: `plot(close - open)`, `plot(5)`, `ta.sma(a * 2, 10)` | Series methods: `close.sub(open)`, `a.mul(2)`; a constant level: `hline(5)` |
| `TypeError: ta.xyz is not a function` / `xyz is not defined` | a name that does not exist (typo, Pine-only name such as `shape`, `location`, `size`, `xloc`, `bar_index`) | [pine-differences.md](pine-differences.md): strings for the constants, `c.i` for `bar_index` |
| `TypeError: Cannot read properties of undefined (reading 'toArray')` | a missing Series argument, e.g. `ta.vwma(close, 20)` | pass it: `ta.vwma(close, 20, volume)` |
| `Error on bar N: Invalid value of the 'length' argument (0.0) in the 'sma' function. It must be > 0.` | a length of 0, negative or NaN (often an input) | `minval: 1` on the input, or guard the value |
| `Error on bar N: The 'sma' function references too many historical candles (6000), the limit is 5000.` | a window longer than 5000 bars | a shorter length |
| `Error on bar N: The script attempts to reference historical data that is too far from the current bar (K bars back)...` | `x.offset(k)` / `c.get(x, k)` with k above 5000, or a history that keeps growing (`c.get(x, c.i)`) | bounded offsets |
| `c.get(): the offset cannot be negative` / `Series.offset(-1)...` | reading a future bar | offsets >= 0; for a left shift of a marker use `offset` of `plotshape` |
| `indicator(): the script already declared indicator(); a script has one declaration.` | two declarations | one `indicator()` or `strategy()` |
| `strategy.entry() must be called inside strategy.eachBar().` | an order at the top level | move it into `strategy.eachBar((c) => ...)` |
| `strategy.position_size must be read inside strategy.eachBar().` | a per-bar strategy value at the top level | read it in the loop; return it from the loop to plot it |
| `strategy.eachBar(): declare the script with strategy() first.` | `strategy.*` in an `indicator()` script | declare `strategy(...)` |
| `strategy.eachBar() runs once per script run.` | two strategy loops | one loop with all the logic |
| `strategy.X is not provided by the strategy engine.` | the host's engine lacks a variable or a risk rule | use another value, or ask the host |
| `request.security(): the expression returned a series computed on the chart bars...` | `request.security("", "D", () => myEma)` | compute inside: `() => ta.ema(close, 20)` |
| `request.security needs the bars of X (D): pass them with ChartContext.bars.` (`MissingSymbolDataError`) | another symbol whose bars the host has not loaded | an app loads them and runs again; in your own host give `bars()` |
| `Invalid symbol: X` | a symbol without bars | check the ticker id, or `ignore_invalid_symbol = true` |
| `Invalid timeframe "XYZ"` | a bad timeframe string | `"1"`, `"60"`, `"240"`, `"D"`, `"W"`, `"M"`... |
| `request.security_lower_tf: timeframe "D" is higher than the chart timeframe "60".` | `security_lower_tf` on a higher timeframe | `request.security` for higher timeframes |
| `The chart timeframe is not known: pass it as executeScript(body, bars, inputs, { timeframe }).` (also time zone, session, `syminfo.*`) | a direct `executeScript` call without the chart context | pass `{ timeframe, timezone, session, ... }`; an app gives them |
| `chart.point.now() needs a current bar: call it inside eachBar().` | a per-bar call at the top level | call it in a bar loop |
| `oakscriptjs/script functions can only run inside executeScript()` | a script API call outside a run (e.g. from a timer, or a Node module that calls `plot` at import) | only the host runs the body |
| `Script did not finish within Ns and was stopped.` (app) | an endless or very slow loop | bound the loops, compute Series outside the bar loops |

## Silent mistakes (no error, wrong output)

| Symptom | Cause | Fix |
|---|---|---|
| a branch taken on every bar, or never | `if (ta.crossover(a, b))`, `cond ? x : y`, `a > b` with Series at the top level: an object is always true, an object comparison always false | `cond.iff(x, y)`, `a.gt(b)`, or `c.get(cond) === 1` in a loop |
| one colour on every bar | `color: fast > slow ? color.green : color.red` | `color.when(fast.gt(slow), color.green, color.red)` |
| an empty plot | NaN on every bar: a `ta.*` Series returned from a bar loop, a division by zero, a NaN input | compute `ta.*` before the loop, guard divisions (`range.gt(0).iff(x.div(range), 0)`) |
| a plot that starts late | the warm-up of long lengths, or of a higher timeframe (20 daily bars on an hourly chart is 480 bars) | expected; shorter lengths or more bars |
| values that look like the future (backtests too good) | `barmerge.lookahead_on` on a series that is not offset | lookahead off, or `.offset(1)` inside the expression |
| a strategy without trades | conditions read as `c.get(cond)` on NaN-only Series, orders placed outside the conditions you expect, `pyramiding: 0` blocking a second entry in the same direction | plot the conditions (`plotshape`) and check them first |
| `na(series)` / `nz(series)` has no effect | they take numbers | in a loop on `c.get(x)`, or `x.iff(x, 0)` |
| an input never changes the output | the input value is not used, or its title changed (new id) | use the returned value; keep titles stable |

## Checking the output

After a clean run, read the values instead of trusting the code:

- the last values of each plot (`run.result.plots.plot0.slice(-5)` in a direct call; the app shows them in the
  data window and the legend);
- the number of markers / labels (a signal on every bar, or none, is a bug);
- for a strategy, the trade count and a few trades (entry and exit bars and prices).
