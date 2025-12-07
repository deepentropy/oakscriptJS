// indicators/mc-ginley-dynamic/mc-ginley-dynamic.ts
import { Series, ta, math } from "oakscriptjs";
function na(value) {
  return value === null || value === void 0 || Number.isNaN(value);
}
var defaultInputs = {
  length: 14
};
function McGinley_Dynamic(bars, inputs = {}) {
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
  const year = new Series(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const source = close;
  let mg = new Series(bars, () => 0);
  const mgValues = new Array(bars.length).fill(NaN);
  for (let i = 0; i < bars.length; i++) {
    const mgPrev = i > 0 ? mgValues[i - 1] : NaN;
    mgValues[i] = na(mgPrev) ? ta.ema(source, length).get(i) : (mgPrev + (source.get(i) - mgPrev)) / (length * math.pow(source.get(i) / mgPrev, 4));
  }
  mg = Series.fromArray(bars, mgValues);
  return {
    metadata: { title: "McGinley Dynamic", shorttitle: "McGinley Dynamic", overlay: true },
    plots: { "plot0": mg.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "McGinley Dynamic", shortTitle: "McGinley Dynamic", overlay: true };
var inputConfig = [{ id: "length", type: "int", title: "length", defval: 14, min: 1 }];
var plotConfig = [{ id: "plot0", title: "mg", color: "#2962FF", lineWidth: 2 }];
var calculate = McGinley_Dynamic;
export {
  McGinley_Dynamic,
  McGinley_Dynamic as McGinley_DynamicIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
