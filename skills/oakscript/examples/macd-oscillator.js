// MACD in its own pane: a four-colour histogram, the MACD and signal lines,
// a zero level and a background on the signal crosses.
indicator("MACD Oscillator", { shorttitle: "MACD", overlay: false, precision: 4 });

const src = input.source("close", "Source");
const fastLength = input.int(12, "Fast length", { minval: 1 });
const slowLength = input.int(26, "Slow length", { minval: 1 });
const signalLength = input.int(9, "Signal smoothing", { minval: 1, maxval: 50 });

// A tuple comes back as an array: destructure it.
const [macdLine, signalLine, hist] = ta.macd(src, fastLength, slowLength, signalLength);

// Four colours: above / below zero, growing / falling. color.when() takes two colours,
// so build the per-bar array in a bar loop (one entry per bar, undefined = na).
const histColors = [];
eachBar((c) => {
  const h = c.get(hist);
  const previous = c.get(hist, 1);
  if (Number.isNaN(h)) histColors.push(undefined);
  else if (h >= 0) histColors.push(h > previous ? "#26A69A" : "#B2DFDB");
  else histColors.push(h < previous ? "#FF5252" : "#FFCDD2");
});

plot(hist, "Histogram", { style: plot.style_columns, color: histColors });
plot(macdLine, "MACD", { color: color.blue, linewidth: 2 });
plot(signalLine, "Signal", { color: color.orange });
hline(0, "Zero", { color: color.gray, linestyle: hline.style_dotted });

bgcolor(color.when(ta.cross(macdLine, signalLine), color.new(color.gray, 85)), { title: "Signal cross" });
