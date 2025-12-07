// indicators/alma/alma.ts
import { Series, ta } from "oakscriptjs";
var defaultInputs = {
  lengthInput: 9,
  offsetInput: 0.85,
  sigmaInput: 6
};
function Arnaud_Legoux_Moving_Average(bars, inputs = {}) {
  const { lengthInput, offsetInput, sigmaInput } = { ...defaultInputs, ...inputs };
  const open = new Series(bars, (bar) => bar.open);
  const high = new Series(bars, (bar) => bar.high);
  const low = new Series(bars, (bar) => bar.low);
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const TT_OFFSET = "Controls tradeoff between smoothness (closer to 1) and responsiveness (closer to 0).";
  const TT_SIGMA = "This element is a standard deviation that is applied to the combo line in order for it to appear more sharp.";
  const source = close;
  return {
    metadata: { title: "Arnaud Legoux Moving Average", shorttitle: "ALMA", overlay: true },
    plots: { "plot0": ta.alma(source, lengthInput, offsetInput, sigmaInput).toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Arnaud Legoux Moving Average", shortTitle: "ALMA", overlay: true };
var inputConfig = [{ id: "lengthInput", type: "int", title: "Length", defval: 9, min: 1 }, { id: "offsetInput", type: "float", title: "Offset", defval: 0.85, step: 0.01 }, { id: "sigmaInput", type: "float", title: "Sigma", defval: 6 }];
var plotConfig = [{ id: "plot0", title: "Plot 0", color: "#2962FF", lineWidth: 2 }];
var calculate = Arnaud_Legoux_Moving_Average;
export {
  Arnaud_Legoux_Moving_Average,
  Arnaud_Legoux_Moving_Average as Arnaud_Legoux_Moving_AverageIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
