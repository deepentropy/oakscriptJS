// Multi-timeframe filter: a higher-timeframe EMA decides the trend, and a cross of the
// chart EMA gives a signal only when it agrees with that trend, once per trend.
indicator("MTF Trend Filter", { shorttitle: "MTF", overlay: true });

const filterTf = input.timeframe("D", "Filter timeframe");
const filterLength = input.int(20, "Filter EMA length", { minval: 1 });
const signalLength = input.int(10, "Signal EMA length", { minval: 1 });

// The expression runs on the higher-timeframe bars: compute every series INSIDE it.
// Returning an array gives one series per element (a PineScript tuple).
const [htfEma, htfClose] = request.security("", filterTf, () => [ta.ema(close, filterLength), close]);
const upTrend = htfClose.gt(htfEma);

const signalEma = ta.ema(close, signalLength);
plot(htfEma, "Filter EMA", { color: color.gray, linewidth: 2, style: plot.style_stepline });
plot(signalEma, "Signal EMA", { color: color.when(upTrend, color.teal, color.red) });

const crossUp = ta.crossover(close, signalEma);
const crossDown = ta.crossunder(close, signalEma);

// Stateful logic (PineScript `var` + `:=`): a closure variable in a bar loop.
let lastSignal = 0; // var int lastSignal = 0
const signal = eachBar((c) => {
  const up = c.get(upTrend) === 1;
  if (c.get(crossUp) === 1 && up && lastSignal !== 1) {
    lastSignal = 1;
    return 1;
  }
  if (c.get(crossDown) === 1 && !up && lastSignal !== -1) {
    lastSignal = -1;
    return -1;
  }
  return 0;
});

plotshape(signal.eq(1), "Long", { style: shape.labelup, location: location.belowbar, color: color.teal, text: "L", textcolor: color.white });
plotshape(signal.eq(-1), "Short", { style: shape.labeldown, location: location.abovebar, color: color.red, text: "S", textcolor: color.white });
bgcolor(color.when(upTrend, color.new(color.teal, 92), color.new(color.red, 92)), { title: "Trend" });

// One label on the last bar with the filter state.
eachBar((c) => {
  if (c.i === c.n - 1) {
    const text = (c.get(upTrend) === 1 ? "Uptrend " : "Downtrend ") + filterTf;
    label.new(c.i, c.high, text, { color: color.gray, style: label.style_label_down, textcolor: color.white });
  }
});
