// indicators/tema/tema.ts
import { Series, ta } from "@deepentropy/oakscriptjs";
var defaultInputs = {
  length: 9
};
function Triple_EMA(bars, inputs = {}) {
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
  const ema1 = ta.ema(close, length);
  const ema2 = ta.ema(ema1, length);
  const ema3 = ta.ema(ema2, length);
  const out = ema1.sub(ema2).mul(3).add(ema3);
  return {
    metadata: { title: "Triple EMA", shorttitle: "TEMA", overlay: true },
    plots: { "plot0": out.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Triple EMA", shortTitle: "TEMA", overlay: true };
var inputConfig = [{ id: "length", type: "int", title: "length", defval: 9, min: 1 }];
var plotConfig = [{ id: "plot0", title: "out", color: "#2962FF", lineWidth: 2 }];
var calculate = Triple_EMA;
export {
  Triple_EMA,
  Triple_EMA as Triple_EMAIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
