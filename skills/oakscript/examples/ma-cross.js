// Moving-average cross on the price pane: two averages, a fill between them,
// markers on the crosses and two alert conditions.
indicator("MA Cross", { shorttitle: "MA X", overlay: true });

const src = input.source("close", "Source");
const fastLength = input.int(9, "Fast length", { minval: 1 });
const slowLength = input.int(21, "Slow length", { minval: 1 });
const maType = input.string("EMA", "MA type", { options: ["SMA", "EMA", "WMA"] });

// Inputs are plain values: a JS `if` on them is fine.
function ma(source, length) {
  if (maType === "SMA") return ta.sma(source, length);
  if (maType === "WMA") return ta.wma(source, length);
  return ta.ema(source, length);
}

const fast = ma(src, fastLength);
const slow = ma(src, slowLength);
const bullish = fast.gt(slow); // Series of 1 / 0: fast > slow

const fastPlot = plot(fast, "Fast", { color: color.teal, linewidth: 2 });
const slowPlot = plot(slow, "Slow", { color: color.orange, linewidth: 2 });
fill(fastPlot, slowPlot, {
  color: color.when(bullish, color.new(color.teal, 85), color.new(color.red, 85)),
  title: "Trend fill",
});

const crossUp = ta.crossover(fast, slow);
const crossDown = ta.crossunder(fast, slow);
plotshape(crossUp, "Cross up", { style: shape.triangleup, location: location.belowbar, color: color.teal, size: size.small });
plotshape(crossDown, "Cross down", { style: shape.triangledown, location: location.abovebar, color: color.red, size: size.small });

alertcondition(crossUp, "Cross up", "Fast MA crossed above the slow MA");
alertcondition(crossDown, "Cross down", "Fast MA crossed below the slow MA");
