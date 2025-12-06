// indicators/wma/wma.ts
import {Series, ta} from "oakscriptjs";
var defaultInputs = {
  len: 9,
  src: "close"
};
function Moving_Average_Weighted(bars, inputs = {}) {
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
  const out = ta.wma(srcSeries, len);
  return {
    metadata: { title: "Moving Average Weighted", shorttitle: "WMA", overlay: true },
    plots: { "plot0": out.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Moving Average Weighted", shortTitle: "WMA", overlay: true };
var inputConfig = [{ id: "len", type: "int", title: "Length", defval: 9, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close", options: ["open", "high", "low", "close", "hl2", "hlc3", "ohlc4", "hlcc4"] }];
var plotConfig = [{ id: "plot0", title: "WMA", color: "#2962FF", lineWidth: 2 }];
var calculate = Moving_Average_Weighted;
export {
  Moving_Average_Weighted,
  Moving_Average_Weighted as Moving_Average_WeightedIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
