// indicators/rma/rma.ts
import { Series, ta } from "@deepentropy/oakscriptjs";
var defaultInputs = {
  len: 7,
  src: "close"
};
function Smoothed_Moving_Average(bars, inputs = {}) {
  const { len, src } = { ...defaultInputs, ...inputs };
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const srcSeries = (() => {
    switch (src) {
      case "open":
        return open;
      case "high":
        return high;
      case "low":
        return low;
      case "close":
        return close;
      case "hl2":
        return hl2;
      case "hlc3":
        return hlc3;
      case "ohlc4":
        return ohlc4;
      case "hlcc4":
        return hlcc4;
      default:
        return close;
    }
  })();
  const smma = ta.rma(srcSeries, len);
  return {
    metadata: { title: "Smoothed Moving Average", shorttitle: "SMMA", overlay: true },
    plots: { "plot0": smma.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Smoothed Moving Average", shortTitle: "SMMA", overlay: true };
var inputConfig = [{ id: "len", type: "int", title: "Length", defval: 7, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close", options: ["open", "high", "low", "close", "hl2", "hlc3", "ohlc4", "hlcc4"] }];
var plotConfig = [{ id: "plot0", title: "SMMA", color: "#673AB7", lineWidth: 2 }];
var calculate = Smoothed_Moving_Average;
export {
  Smoothed_Moving_Average,
  Smoothed_Moving_Average as Smoothed_Moving_AverageIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
