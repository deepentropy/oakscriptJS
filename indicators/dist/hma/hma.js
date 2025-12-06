// indicators/hma/hma.ts
import {Series, ta, math} from "oakscriptjs";
var defaultInputs = {
  length: 9,
  src: "close"
};
function Hull_Moving_Average(bars, inputs = {}) {
  const { length, src } = { ...defaultInputs, ...inputs };
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
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
  const year = new Series(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const hullma = ta.wma(ta.wma(srcSeries, length / 2).mul(2).sub(ta.wma(srcSeries, length)), math.floor(math.sqrt(length)));
  return {
    metadata: { title: "Hull Moving Average", shorttitle: "HMA", overlay: true },
    plots: { "plot0": hullma.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Hull Moving Average", shortTitle: "HMA", overlay: true };
var inputConfig = [{ id: "length", type: "int", title: "Length", defval: 9, min: 2 }, { id: "src", type: "source", title: "Source", defval: "close" }];
var plotConfig = [{ id: "plot0", title: "hullma", color: "#2962FF", lineWidth: 2 }];
var calculate = Hull_Moving_Average;
export {
  Hull_Moving_Average,
  Hull_Moving_Average as Hull_Moving_AverageIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
