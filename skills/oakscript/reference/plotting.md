# Plotting

Every output is declared and filled in one call. Titles name the outputs in the host's legend, settings and
alerts: give each one a title.

## plot

`plot(series, title, { color, linewidth, style, linestyle, histbase, display, force_overlay, editable })`
returns a handle for `fill()`.

| `style` | Draws |
|---|---|
| `plot.style_line` (default), `plot.style_linebr` | a line; `linebr` leaves gaps on na bars |
| `plot.style_stepline`, `plot.style_steplinebr`, `plot.style_stepline_diamond` | steps |
| `plot.style_histogram` | bars from `histbase` (default 0) |
| `plot.style_columns` | columns from 0 |
| `plot.style_area`, `plot.style_areabr` | filled area |
| `plot.style_circles`, `plot.style_cross` | points |

`linestyle`: `plot.linestyle_solid` / `_dashed` / `_dotted`. `display`: `"all"`, `"none"` (hidden but listed),
`"data_window"`, `"status_line"`, `"pane"`. `force_overlay: true` draws on the price pane from a script in its
own pane. NaN values are not drawn.

```js
indicator("RSI with levels", { overlay: false });
const r = ta.rsi(close, 14);
plot(r, "RSI", { color: color.purple, linewidth: 2 });
plot(ta.sma(r, 14), "RSI MA", { color: color.orange, linestyle: plot.linestyle_dashed });
plot(r.sub(50), "Momentum", { style: plot.style_columns, color: color.when(r.gt(50), color.new(color.teal, 60), color.new(color.red, 60)) });
const upper = hline(70, "Overbought", { color: color.red });
const lower = hline(30, "Oversold", { color: color.green });
hline(50, "Middle", { color: color.gray, linestyle: hline.style_dotted });
fill(upper, lower, color.new(color.purple, 90), "Band");
```

## Colours

- Constants: `color.red`, `color.green`, `color.blue`, `color.orange`, `color.teal`, `color.purple`, `color.gray`,
  `color.white`, `color.black`, `color.yellow`, `color.aqua`, `color.lime`, `color.maroon`, `color.navy`,
  `color.olive`, `color.silver`, `color.fuchsia`; any CSS colour string (`"#2962FF"`, `"rgba(41,98,255,0.5)"`).
- `color.new(c, transp)` (0 opaque, 100 invisible), `color.rgb(r, g, b, transp?)`,
  `color.from_gradient(value, bottom, top, bottomColor, topColor)` (a Series argument gives a per-bar array),
  `color.r/g/b/t(c)`.
- **Per-bar colours** are arrays with one colour per bar (`undefined` = na, not drawn):
  `color.when(cond, colorTrue, colorFalse?)` for two colours, `color.from_gradient` on a Series for a gradient, a
  bar loop for anything else.

```js
indicator("RSI gradient", { overlay: false });
const r = ta.rsi(close, 14);
plot(r, "RSI", { color: color.from_gradient(r, 30, 70, color.red, color.green), linewidth: 2 }); // one colour per bar
```

## hline and fill

- `hline(price, title, { color, linestyle, linewidth })`: a constant level (default dashed);
  `linestyle: hline.style_solid / _dashed / _dotted`.
- `fill(handle1, handle2, color, title)` or `fill(h1, h2, { color, title })`: between two plots or two hlines.
  The colour can be a per-bar array.
- Gradient fill: `fill(p1, p2, topValue, bottomValue, topColor, bottomColor, title)` (values: numbers or Series).

```js
indicator("Bollinger fill", { overlay: true });
const [basis, upper, lower] = ta.bb(close, 20, 2);
plot(basis, "Basis", { color: color.orange });
const pu = plot(upper, "Upper", { color: color.blue });
const pl = plot(lower, "Lower", { color: color.blue });
fill(pu, pl, upper, lower, color.new(color.blue, 70), color.new(color.blue, 95), "Gradient");
```

Note: `ta.bb` returns `[basis, upper, lower]` as in Pine.

## Shapes, characters, arrows

- `plotshape(cond, title, { style, location, color, text, textcolor, size, offset, tooltip })`: a shape on
  each bar where `cond` is not 0 / na. `style`: `shape.xcross` (default), `shape.cross`, `shape.triangleup`,
  `shape.triangledown`, `shape.flag`, `shape.circle`, `shape.arrowup`, `shape.arrowdown`, `shape.labelup`,
  `shape.labeldown`, `shape.square`, `shape.diamond`. `location`: `location.abovebar` (default), `location.belowbar`,
  `location.top`, `location.bottom`, `location.absolute` (at the series value). `size`: `size.auto`, `size.tiny`,
  `size.small`, `size.normal`, `size.large`, `size.huge`.
- `plotchar(cond, title, { char, location, color, size, offset })`: a character.
- `plotarrow(series, title, { colorup, colordown, minheight, maxheight })`: an up arrow for a positive value,
  a down arrow for a negative one.

```js
indicator("Markers", { overlay: true });
const ema = ta.ema(close, 20);
plotshape(ta.crossover(close, ema), "Buy", { style: shape.labelup, location: location.belowbar, color: color.green, text: "Buy", textcolor: color.white });
plotshape(ta.crossunder(close, ema), "Sell", { style: shape.labeldown, location: location.abovebar, color: color.red, text: "Sell", textcolor: color.white });
// a pivot is known 5 bars later: offset -5 puts the mark on the pivot bar; "absolute" places it at the value
plotshape(ta.pivothigh(5, 5), "Pivot high", { style: shape.diamond, location: location.absolute, offset: -5, color: color.orange, size: size.tiny });
plotchar(ta.pivotlow(5, 5), "Pivot low", { char: "^", location: location.belowbar, offset: -5, color: color.teal });
plotarrow(ta.change(close, 3), "3-bar change", { colorup: color.teal, colordown: color.red });
plot(ema, "EMA");
```

## Background and bar colours

```js
indicator("Trend colours", { overlay: true });
const ema = ta.ema(close, 50);
plot(ema, "EMA", { color: color.gray });
barcolor(color.when(close.gt(ema), color.teal, color.red), { title: "Trend bars" });
bgcolor(color.when(ta.cross(close, ema), color.new(color.yellow, 80)), { title: "Cross" });
```

`bgcolor(colors, { offset, title, force_overlay })`, `barcolor(colors, { title })`: a colour or a per-bar array.

## Candles and bars

`plotcandle(o, h, l, c, title, { color, wickcolor, bordercolor })` and `plotbar(o, h, l, c, title, { color })`
draw OHLC from four Series (no candle on a bar with an na value).

```js
indicator("Heikin Ashi", { overlay: false });
const haClose = ohlc4;
const highs = [];
const lows = [];
const haOpen = eachBar((c) => {
  const o = c.i === 0 ? (c.open + c.close) / 2 : (c.prev() + c.get(haClose, 1)) / 2; // c.prev(): haOpen[1]
  highs.push(Math.max(c.high, o, c.get(haClose)));
  lows.push(Math.min(c.low, o, c.get(haClose)));
  return o;
});
plotcandle(haOpen, seriesOf(highs), seriesOf(lows), haClose, "HA", {
  color: color.when(haClose.gt(haOpen), color.teal, color.red),
  wickcolor: color.gray,
});
```

## Drawings

Drawings are created in a bar loop, with the Pine arguments: the first ones by position, the others by name in an
object after them (Pine's named arguments), e.g. `label.new(c.i, c.high, "A", { style: label.style_label_down })`.
Every argument can be named (`line.new({ x1, y1, x2, y2, extend: extend.right })`); an unknown name throws with the
closest names. In the loop, a Series argument is its value on the current bar: `label.new(bar_index, high, "A")` is
`label.new(c.i, c.high, "A")`.

| Call | Arguments |
|---|---|
| `label.new` | `x, y, text, xloc (xloc.bar_index / xloc.bar_time), yloc (yloc.price / yloc.abovebar / yloc.belowbar), color, style, textcolor, size, textalign, tooltip, text_font_family, force_overlay, text_formatting` |
| `line.new` | `x1, y1, x2, y2, xloc, extend (extend.none / left / right / both), color, style (line.style_solid / dashed / dotted / arrow_left / arrow_right / arrow_both), width, force_overlay` |
| `box.new` | `left, top, right, bottom, border_color, border_width, border_style, extend, xloc, bgcolor, text, text_size, text_color, text_halign, text_valign, text_wrap, text_font_family, force_overlay, text_formatting` |
| `table.new` | `position, columns, rows, bgcolor, frame_color, frame_width, border_color, border_width` |
| `table.cell` | `table_id, column, row, text, width, height, text_color, text_halign, text_valign, text_size, bgcolor, tooltip, text_font_family, text_formatting` |
| `polyline.new` | `points (chart.point.from_index(i, price)...), curved, closed, xloc, line_color, fill_color, line_style, line_width` |
| `linefill.new` | `line1, line2, color` |

Label styles: `label.style_label_down`, `label.style_label_up`, `label.style_label_left`, `label.style_label_right`,
`label.style_label_center`, `label.style_none`, and `label.style_<shape>`. `x` is a bar index (`c.i`, or `c.i + 10`
for a future bar) or, with `xloc.bar_time`, a UNIX time in ms. The constants are the strings (`"label_down"`), which
also work.
Positions of tables: `position.top_right`, `position.bottom_left`...

```js
indicator("Drawings", { overlay: true, max_labels_count: 20 });
const ph = ta.pivothigh(5, 5);
const hi = ta.highest(50);
const lo = ta.lowest(50);
eachBar((c) => {
  const p = c.get(ph);
  if (!Number.isNaN(p)) {
    label.new(c.i - 5, p, str.tostring(p, "#.##"), { color: color.red, style: label.style_label_down, textcolor: color.white, size: size.small });
  }
  if (c.i === c.n - 1) {
    line.new(c.i - 49, c.get(hi), c.i + 10, c.get(hi), { color: color.green, style: line.style_dashed, width: 2 });
    box.new(c.i - 49, c.get(hi), c.i, c.get(lo), { border_color: color.gray, border_style: line.style_dotted, bgcolor: color.new(color.gray, 90), text: "50-bar range" });
    const t = table.new(position.bottom_right, 1, 1, color.new(color.black, 30));
    table.cell(t, 0, 0, "Range " + str.tostring(c.get(hi) - c.get(lo), "#.##"), 0, 0, color.white);
  }
});
plot(close, "Close", { display: "none" });
```

- Keep one object and update it (`line.set_xy1(l, x, y)`, `label.set_text(lb, t)`, `box.set_top(b, y)`...)
  rather than creating one per bar when only the last one matters.
- Objects above `max_labels_count` / `max_lines_count` / `max_boxes_count` / `max_polylines_count` (default 50)
  are deleted oldest first; `label.delete(lb)` deletes one. `const keep = varDrawing();` then
  `keep.value = line.new(...)` is Pine's `var line keep = na` (that object is never deleted by the limit).
- `label.all`, `line.all`... list the live objects.

## Alerts

- `alertcondition(cond, title, message)`: a condition the user can create an alert on.
- `alert(message, freq)` inside a bar loop: an alert call on that bar; `freq`: `alert.freq_once_per_bar`
  (default), `alert.freq_once_per_bar_close`, `alert.freq_all`.

```js
indicator("Alerts", { overlay: true });
const ma = ta.sma(close, 20);
const up = ta.crossover(close, ma);
plot(ma, "SMA");
alertcondition(up, "Cross up", "Close crossed above the SMA");
eachBar((c) => {
  if (c.get(up) === 1) alert("Close " + str.tostring(c.close, "#.##") + " crossed above the SMA", alert.freq_once_per_bar_close);
});
```

## Logs

- `log.info(message, ...args)`, `log.warning(...)`, `log.error(...)`: a message in the host's logs panel. Inside a bar
  loop it is made on that bar; at the top level, on every bar. With arguments, `message` is a `str.format()` pattern
  and a Series argument gives its value on the bar. The messages of a run are in `result.logs` (bar, time, level,
  message, and the script line when the host resolves it with `setLogLineResolver`), by bar, the newest 10,000.

```js
indicator("Logs");
const ma = ta.sma(close, 20);
eachBar((c) => {
  if (c.i === c.n - 1) log.info("Last close {0}, SMA {1}", c.close, c.get(ma));
  if (c.volume === 0) log.warning("No volume on bar {0}", c.i);
});
```
