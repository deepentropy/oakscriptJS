# Errors and how to read them

A script fails in one of three ways: it does not compile, it stops with a runtime error, or it runs and gives a
wrong output. Fix them in that order, then check the values. `npx oakscript check script.js` ([check](check.md))
reports all three, with the lines, and warns about the silent mistakes of the last table.

## Type-check errors

| Error | Cause | Fix |
|---|---|---|
| `TS2362` / `TS2363` `The left-hand (right-hand) side of an arithmetic operation must be of type...` | `close - open`, `rsi * 2` | Series methods: `close.sub(open)`, `rsi.mul(2)` |
| `TS2365` `Operator '>' cannot be applied to types 'Series' and 'number'` | `rsi > 50`, `c.close > ta.sma(close, 5)` in a loop | `rsi.gt(50)`; in a loop `c.close > c.get(sma)` with `sma` computed before |
| `TS2339` / `TS2551` `Property 'smaa' does not exist on type...` | a misspelt or Pine-only name | the name it suggests, [pine-differences.md](pine-differences.md) |
| `TS2322` `Type '"triangel"' is not assignable to type 'ShapeStyle'` | a bad constant string | one of the strings it lists |
| `TS2561` / `TS2353` `Object literal may only specify known properties` | a misspelt option (`colour`) | the option it suggests |
| `TS2554` `Expected 4 arguments, but got 3` | a missing argument (`ta.stoch(close, high, low)`) | pass it: `ta.stoch(close, high, low, 14)` |
| `TS2339` `Property 'entry_price' does not exist on type 'number'` | `strategy.opentrades.entry_price(0)` (`strategy.opentrades` is the count) | `strategy.opentrade(0)?.entry_price`, `strategy.closedtrade(i)?.profit` |
| `TS2769` `No overload matches this call` on a drawing | a misspelt named argument (`{ textcolour: ... }`) | the Pine name (`textcolor`) |
| `TS8010` `Type annotations can only be used in TypeScript files` | TypeScript syntax | remove the types |

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
| `TypeError: JavaScript operators (+ - * / % ** < > <= >= ==) do not work on a Series: use its methods...` | an operator on a Series: `close - open`, `rsi > 50`, `fast > slow ? a : b` | the method it lists: `close.sub(open)`, `rsi.gt(50)`, `fast.gt(slow).iff(a, b)`; a colour: `color.when(fast.gt(slow), a, b)` |
| `TypeError: A Series is not a text...` | a Series in a text: `` `RSI ${rsi}` ``, `"RSI " + rsi` | in a loop: `str.tostring(c.get(rsi))` |
| `ta.sma() was called inside eachBar(): a ta.* call computes the whole Series at once...` | a `ta.*` function in a bar callback | compute it before the loop, read it with `c.get(x)`; a Pine call in an `if` block: `callsite.*` |
| `TypeError: ta.smaa does not exist. Did you mean ta.sma?` (also `math.`, `str.`, `color.`, `input.`, `request.`) | a misspelt or Pine-only member | a suggested name, [pine-differences.md](pine-differences.md) |
| `TypeError: series.toArray is not a function` | a number or NaN passed where a Series is expected: `plot(5)`, `ta.sma(c.close, 10)` | a Series; a constant level: `hline(5)` |
| `xyz is not defined` | a global that does not exist (Pine-only name such as `shape`, `location`, `size`, `xloc`, `bar_index`) | [pine-differences.md](pine-differences.md): strings for the constants, `c.i` for `bar_index` |
| `TypeError: Cannot read properties of undefined (reading 'toArray')` | a missing Series argument, e.g. `ta.stoch(close, high, low)` | pass it: `ta.stoch(close, high, low, 14)` |
| `TypeError: label.new(): unknown argument "textcolour". Did you mean textcolor?` | a misspelt named argument of a drawing | the name it suggests |
| `TypeError: input.int(): unknown argument "min". Did you mean minval?` | an input option that is not Pine's (`min`, `max`, `choices`) | Pine's name: `minval`, `maxval`, `options` |
| `TypeError: request.security(): unknown argument "lookahed"...` | a misspelt named argument of `request.security` | `gaps`, `lookahead`, `ignore_invalid_symbol` |
| `TypeError: label.new(): argument 1 is a Series, a drawing takes one value: call label.new() inside eachBar()...` | a drawing created at the top level with a Series (`label.new(bar_index, high)`) | create it in a bar loop |
| `TypeError: strategy.opentrades.entry_price is not a function` | `strategy.opentrades` is the count | `strategy.opentrade(0)?.entry_price` |
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
| a branch taken on every bar | `if (ta.crossover(a, b))`, `cond ? x : y`, `!cond`, `cond && x` with a Series `cond`: an object is always true | `cond.iff(x, y)`, `cond.not()`, `cond.and(x)`, or `c.get(cond) === 1` in a loop |
| one colour on every bar | `color: cond ? color.green : color.red` with a Series `cond` | `color.when(cond, color.green, color.red)` |
| an empty plot | NaN on every bar: a division by zero, a NaN input | guard divisions (`range.gt(0).iff(x.div(range), 0)`) |
| a plot that starts late | the warm-up of long lengths, or of a higher timeframe (20 daily bars on an hourly chart is 480 bars) | expected; shorter lengths or more bars |
| values that look like the future (backtests too good) | `barmerge.lookahead_on` on a series that is not offset | lookahead off, or `.offset(1)` inside the expression |
| a strategy without trades | conditions read as `c.get(cond)` on NaN-only Series, orders placed outside the conditions you expect, `pyramiding: 0` blocking a second entry in the same direction | plot the conditions (`plotshape`) and check them first |
| an input never changes the output | the input value is not used, or its title changed (new id) | use the returned value; keep titles stable |

## Checking the output

After a clean run, read the values instead of trusting the code:

- the last values of each plot (`run.result.plots.plot0.slice(-5)` in a direct call; the app shows them in the
  data window and the legend);
- the number of markers / labels (a signal on every bar, or none, is a bug);
- for a strategy, the trade count and a few trades (entry and exit bars and prices).
