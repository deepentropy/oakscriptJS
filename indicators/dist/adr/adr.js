// indicators/adr/adr.ts
import { Series, ta } from "oakscriptjs";
var defaultInputs = {
  lengthInput: 14
};
function Average_Day_Range(bars, inputs = {}) {
  const { lengthInput } = { ...defaultInputs, ...inputs };
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const year = new Series(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const adr = ta.sma(high.sub(low), lengthInput);
  return {
    metadata: { title: "Average Day Range", shorttitle: "ADR", overlay: false },
    plots: { "plot0": adr.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Average Day Range", shortTitle: "ADR", overlay: false };
var inputConfig = [{ id: "lengthInput", type: "int", title: "Length", defval: 14 }];
var plotConfig = [{ id: "plot0", title: "ADR", color: "#2962FF", lineWidth: 2 }];
var calculate = Average_Day_Range;
export {
  Average_Day_Range,
  Average_Day_Range as Average_Day_RangeIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
