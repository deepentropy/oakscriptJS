// indicators/bop/bop.ts
import { Series } from "oakscriptjs";
function Balance_of_Power(bars) {
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  return {
    metadata: { title: "Balance of Power", shorttitle: "Balance of Power", overlay: false },
    plots: { "plot0": close.sub(open).div(high.sub(low)).toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Balance of Power", shortTitle: "Balance of Power", overlay: false };
var defaultInputs = {};
var inputConfig = [];
var plotConfig = [{ id: "plot0", title: "Plot 0", color: "#FF0000", lineWidth: 2 }];
var calculate = Balance_of_Power;
export {
  Balance_of_Power,
  Balance_of_Power as Balance_of_PowerIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
