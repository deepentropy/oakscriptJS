# Checking a script: `oakscript check`

`oakscript check` runs a script the way an app runs it (the declarations on zero bars, then a run on bars) and
prints what it declares and what it outputs, the errors with their line, warnings for the mistakes that give no error,
and the result of a spec: the inputs, outputs and signals the user asked for.

```sh
npx oakscript check my-indicator.js                       # synthetic bars (1,500, hourly)
npx oakscript check my-indicator.js --spec spec.json      # + the user's spec (and its checks file)
npx oakscript check my-indicator.js --scenarios           # + edge-case bars
npx oakscript check my-port.js --export chart-export.csv  # + bars and expected values of a chart export
```

Exit code: `0` clean, `2` warnings only, `1` an error or a failed spec / reference check. Run it after each change
until it gives `0` (or `2` with warnings you have read and explained).

## Workflow

1. Write the spec from the user's request **before** the script (below): title, pane, inputs with their defaults,
   outputs, what the signals should look like; and a checks file for the behaviour the spec cannot count ("Buy only
   when the RSI is below 30"). Add `"scenarios": true`.
2. Write the script.
3. `npx oakscript check script.js --spec spec.json`; fix the errors, then the failed spec items and checks, then
   read the warnings.
4. For a port of a Pine script with known values, add `--export` (or `--bars` and `--reference`).

## What it checks

| Stage | Reports |
|---|---|
| types | TypeScript errors of the script with the script globals (`TS2362` operator on a Series, `TS2551` unknown name...), when `typescript` is installed in the project; `--no-types` skips it |
| syntax | the JavaScript syntax error and its line |
| declaration | errors of the top-level code (the declaration run of an app), e.g. `close - open` |
| run | errors on the bars (inside `eachBar`), with the line |
| timeout | a run longer than `--timeout` (default 10 s) |
| spec | an unknown key or a wrong value in the spec (`"signal"` for `"signals"`): a misspelt spec would check nothing |
| scenario | an error on the edge-case bars of `--scenarios` |

Then, on a clean run: the inputs (id, type, default, options), each plot (number of values, first bar, min / max,
last 5 values, colours), each signal (shapes, characters, arrows, alert conditions, background and bar colours: bars,
share, first and last bar), drawings, `alert()` calls, and for a strategy the trades (count, wins, net profit, the
first trades) on a small built-in order engine (next-bar-open fills, stop / limit exits).

## Warnings

| Code | Meaning |
|---|---|
| `empty-plot` | a plot with no value (na on every bar) |
| `constant-plot` | the same value on every bar (a level is an `hline()`) |
| `late-start` | the first value after half of the bars |
| `signal-never` | a signal that is never true |
| `signal-everywhere` | a signal on more than half of the bars: often a Series used as a JavaScript boolean |
| `one-colour` | per-bar colours that are the same on every bar |
| `unused-input` | changing the input changes no output (the check runs again with each input changed) |
| `input-error` | another valid value of the input stops the script |
| `no-trades` | a strategy without any trade |
| `no-output` | nothing is drawn |

A warning is not always a mistake (a rare signal on 1,500 bars): read it and keep it when it is what the user wants.

## The spec

A JSON file; every entry is optional and only the given ones are checked. Inputs, plots and signals are found by id
or title (case insensitive). An unknown key or a wrong value is an error (with the closest key), so a misspelt entry
does not pass unchecked. Its JSON Schema is `node_modules/oakscriptjs/skills/oakscript/spec.schema.json`: point
`$schema` at it to get the keys in an editor.

```json
{
  "$schema": "./node_modules/oakscriptjs/skills/oakscript/spec.schema.json",
  "kind": "indicator",
  "title": "MACD Histogram",
  "overlay": false,
  "inputs": {
    "fast_length": { "type": "int", "defval": 12 },
    "Source": { "type": "source", "defval": "close" },
    "MA type": { "options": ["SMA", "EMA"] }
  },
  "outputs": ["MACD", "Signal", { "title": "Zero", "kind": "hline" }],
  "plots": { "MACD": { "warmup": 40 }, "RSI": { "min": 0, "max": 100 } },
  "signals": { "Buy": { "min": 1, "maxShare": 0.1 } },
  "trades": { "min": 1 },
  "checks": "checks.js",
  "scenarios": true,
  "reference": "expected.csv",
  "tolerance": 1e-10
}
```

- `outputs`: titles that must exist; `kind` is one of `plot`, `shape`, `char`, `arrow`, `candle`, `bar`, `hline`,
  `bgcolor`, `barcolor`, `alertcondition`.
- `plots`: `min` / `max` bound every value, `warmup` is the latest bar of the first value.
- `signals`: `min` / `max` count bars, `minShare` / `maxShare` the share of the bars (0 to 1).
- `checks`, `scenarios`, `reference`, `export`, `tolerance`: as `--checks`, `--scenarios`, `--reference`, `--export`,
  `--tolerance` (paths relative to the spec file).

## Behaviour checks

What a spec cannot write as counts and ranges goes in a checks file: plain JavaScript, the body of a function of `t`
(no import or export). `t.plot(name)` gives a plot per bar (`values`, `at(i)`, `colors`), `t.signal(name)` the bars of
a signal (`bars`, `on(i)`), `t.trades` the closed trades of a strategy, `t.input(name)` the value of an input, `t.bars`
and `t.n` the bars. Record each check with `t.expect(name, ok, detail?)` or `t.everyBar(name, (i) => ..., { from, to })`
(it fails on the first bar where the function is false).

```js
const rsi = t.plot("RSI");
t.everyBar("RSI between 0 and 100", (i) => rsi.at(i) === null || (rsi.at(i) >= 0 && rsi.at(i) <= 100));
t.expect("Buy only when the RSI is below 30", t.signal("Buy").bars.every((i) => rsi.at(i) < 30));
t.expect("Buy right after the RSI was at or above 30", t.signal("Buy").bars.every((i) => rsi.at(i - 1) >= 30));
```

The checks run on the main run; their results come after the spec items. An error in the file (an unknown plot, a
typo) fails the checks with its line.

## Scenarios

`--scenarios` (or `"scenarios": true`) runs the script again on edge-case bars: 30 bars (a short history), 800 daily
bars, 1,000 one-minute bars, 200 flat bars (zero ranges, no volume), 500 bars without volume, and a 3-day gap. An
error there fails the check; a plot with no value that the main run does not have is listed per scenario (on 30
bars it is often expected, a division by a zero range is not).

## Bars and reference files

- `--bars`: CSV with the columns `time` (UNIX seconds or milliseconds, or a date), `open`, `high`, `low`, `close`,
  optional `volume`; or a JSON array of `{ time, open, high, low, close, volume }`. The timeframe comes from the bar
  spacing unless `--timeframe` gives it. Other symbols of `request.security` get synthetic bars.
- `--reference`: CSV with a `time` column and one column per plot (id or title); empty or `na` is na. A value is
  equal when `|a - b| <= tolerance * max(1, |a|, |b|)` (default `1e-10`) or both are na. Use the bars the reference
  was computed on. The bar columns (`open`, `high`, `low`, `close`, `volume`) are skipped.
- `--export`: one CSV with both: the chart data exported with the original script on the chart (a `time` column,
  the bars, then one column per plot title, as charting apps export them). The bars are the bars of the run, the
  other columns the expected values; a column with no plot of that title (another script on the chart) is ignored.

## Other options

`--inputs '{"length": 50}'` (input values by id), `--count 3000` (synthetic bars), `--timeframe D`, `--no-sweep`
(no reruns for unused inputs), `--json` (the whole report as JSON).

## From code

```ts
import { assertCheck, checkScript } from 'oakscriptjs/check';
const report = checkScript(source, { spec, bars, scenarios: true, checks: (t) => { /* as a checks file */ } });
// report.ok, errors, warnings, plots, signals, spec, reference, scenarios

// in a test of any runner: throws the report as text when the check fails ({ warnings: false }: also on warnings)
assertCheck(checkScript(source, { spec }));
```

`checkScript` runs anywhere (no Node API); the command adds the file lines, the time limit and the type check.
