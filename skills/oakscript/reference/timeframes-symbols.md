# Other timeframes and symbols

## request.security

`request.security(symbol, timeframe, expression, gaps?, lookahead?, ignore_invalid_symbol?)` runs `expression` on
the bars of `symbol` on `timeframe` and returns its values aligned on the chart bars (a Series).

- `symbol`: `""` or `syminfo.tickerid` for the chart symbol, a ticker id (`"NASDAQ:AAPL"`, from
  `input.symbol`) for another one, `ticker.heikinashi(syminfo.tickerid)` for Heikin Ashi bars.
- `timeframe`: `"1"`, `"5"`, `"60"`, `"240"`, `"D"`, `"W"`, `"M"`, `"2D"`...; `""` is the chart timeframe.
- `expression`: a **function** that computes the series. Everything it needs on that timeframe is computed
  inside it: `() => ta.ema(close, 20)`. A Series computed outside runs on the chart bars, and the call throws
  "the expression returned a series computed on the chart bars".
- Return an array for several values (a Pine tuple): `const [h, l] = request.security("", "D", () => [high, low]);`
- Inputs and plain numbers from outside can be used inside (`() => ta.ema(close, length)`).

```js
indicator("Daily levels", { overlay: true });
const length = input.int(20, "Daily EMA length", { minval: 1 });
const dailyEma = request.security("", "D", () => ta.ema(close, length));
const [prevHigh, prevLow] = request.security("", "D", () => [high.offset(1), low.offset(1)]);
plot(dailyEma, "Daily EMA", { color: color.orange, style: plot.style_stepline });
plot(prevHigh, "Previous day high", { color: color.green, style: plot.style_linebr });
plot(prevLow, "Previous day low", { color: color.red, style: plot.style_linebr });
```

### Lookahead and gaps

- `barmerge.lookahead_off` (default): a higher-timeframe value appears on the chart bar that completes its
  period; before that, the bars show the previous period's value. This is the setting without future leak.
- `barmerge.lookahead_on`: the value of the period appears from its first chart bar. With a series that is not
  offset (`close`, `ta.ema(close, 20)`) this reads the future on history bars: use it only with
  `high.offset(1)`-style expressions (the previous period) or for display.
- `barmerge.gaps_on`: the value only on the bar where it appears, NaN elsewhere (use `plot.style_linebr`).

```js
indicator("Weekly open", { overlay: true });
const weekOpen = request.security("", "W", () => open, { lookahead: barmerge.lookahead_on });
plot(weekOpen, "Week open", { color: color.purple, style: plot.style_stepline });
```

The arguments after the expression are Pine's, by position (`gaps, lookahead, ignore_invalid_symbol`) or by name in an
object (`{ gaps, lookahead, ignore_invalid_symbol }`); an unknown name throws with the closest names. `currency` and
`calc_bars_count` are not supported (they throw).

### Other symbols

```js
indicator("Relative strength", { overlay: false });
const other = input.symbol("NASDAQ:AAPL", "Compare with");
const otherClose = request.security(other, "", () => close);
const ratio = close.div(otherClose);
plot(ratio, "Ratio", { color: color.blue });
plot(ta.sma(ratio, 50), "Ratio SMA", { color: color.orange });
```

The library fetches nothing: the host gives the bars of the other symbol. An app loads them when the script asks
(the first run reports what it needs, the app loads it and runs again); in your own `executeScript` call, pass
`bars(symbol, timeframe)` and `symbolInfo(symbol)` in the chart context and catch `MissingSymbolDataError`
(`error.requests` lists the `{ symbol, timeframe }` to load). A symbol with no bars stops the script with
"Invalid symbol: X" (or gives NaN with `ignore_invalid_symbol = true`).

The values are merged by time: with lookahead off a chart bar shows the last bar of the other symbol that closed
at or before its own close.

### Lower timeframes

`request.security` on a timeframe below the chart's reads the lower-timeframe bars (given by the host as for
another symbol) and shows, per chart bar, the value on the last lower bar inside it.
`request.security_lower_tf(symbol, timeframe, expression)` returns, for each chart bar, an **array of numbers**:
the values on all the lower bars inside that bar (a plain `number[][]`, not a Series). Read it in a bar loop:

```js
indicator("Intrabar up volume", { overlay: false });
const vols = request.security_lower_tf("", "15", () => volume.mul(close.gt(open).iff(1, 0)));
const upVolume = eachBar((c) => vols[c.i].reduce((sum, v) => sum + v, 0));
plot(upVolume, "Up volume", { style: plot.style_columns, color: color.teal });
```

## Timeframe values

- `timeframe.period` (`"60"`, `"1D"`...), `timeframe.multiplier`, `timeframe.isintraday`, `timeframe.isdaily`,
  `timeframe.isweekly`, `timeframe.ismonthly`, `timeframe.isdwm`, `timeframe.isminutes`, `timeframe.isseconds`.
- `timeframe.change("D")`: 1 on the first chart bar of each new period.
- `timeframe.in_seconds(tf?)`, `timeframe.from_seconds(s)`.
- `input.timeframe("D", "Timeframe")` lets the user choose; `""` is the chart timeframe.
- `time("D")`, `time("240", "0930-1600")`: open time of the period of each bar, NaN outside the session.

A timeframe below the chart's with `request.security_lower_tf` and a higher one with `request.security` are the
normal cases; `request.security_lower_tf` on a higher timeframe throws.

## What the host must give

Session-aware values (`request.security` on another timeframe, `time()`, `timeframe.change`, `session.*`,
`ta.vwap` on an intraday chart) need the chart timeframe, the exchange time zone and the session. An app gives
them; a direct `executeScript` call passes `{ timeframe, timezone, session }` in the chart context
(`session: "24x7"` for a symbol that always trades, `"0930-1600"` for regular stock hours).
