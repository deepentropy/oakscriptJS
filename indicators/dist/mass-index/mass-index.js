// indicators/mass-index/mass-index.ts
import { Series, ta, math } from "oakscriptjs";
var defaultInputs = {
  length: 10
};
function Mass_Index(bars, inputs = {}) {
  const { length } = { ...defaultInputs, ...inputs };
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const span = high.sub(low);
  const mi = math.sum(ta.ema(span, 9).div(ta.ema(ta.ema(span, 9), 9)), length);
  return {
    metadata: { title: "Mass Index", shorttitle: "Mass Index", overlay: false },
    plots: { "plot0": mi.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Mass Index", shortTitle: "Mass Index", overlay: false };
var inputConfig = [{ id: "length", type: "int", title: "length", defval: 10, min: 1 }];
var plotConfig = [{ id: "plot0", title: "mi", color: "#2962FF", lineWidth: 2 }];
var calculate = Mass_Index;
export {
  Mass_Index,
  Mass_Index as Mass_IndexIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
