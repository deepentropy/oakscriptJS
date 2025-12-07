// indicators/momentum/momentum.ts
import { Series } from "oakscriptjs";
var defaultInputs = {
  len: 10,
  src: "close"
};
function Momentum(bars, inputs = {}) {
  const { len, src } = { ...defaultInputs, ...inputs };
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
  const mom = srcSeries.sub(srcSeries.offset(len));
  return {
    metadata: { title: "Momentum", shorttitle: "Mom", overlay: false },
    plots: { "plot0": mom.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Momentum", shortTitle: "Mom", overlay: false };
var inputConfig = [{ id: "len", type: "int", title: "Length", defval: 10, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close" }];
var plotConfig = [{ id: "plot0", title: "MOM", color: "#2962FF", lineWidth: 2 }];
var calculate = Momentum;
export {
  Momentum,
  Momentum as MomentumIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
