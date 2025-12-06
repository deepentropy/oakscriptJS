// indicators/alma/alma.ts
import {Series, taCore} from "oakscriptjs";
var defaultInputs = {
  lengthInput: 9,
  offsetInput: 0.85,
  sigmaInput: 6
};
function Arnaud_Legoux_Moving_Average(bars, inputs = {}) {
  const { lengthInput, offsetInput, sigmaInput } = { ...defaultInputs, ...inputs };
  const close = new Series(bars, (bar) => bar.close);
  const closeArray = close.toArray();
  const almaArray = taCore.alma(closeArray, lengthInput, offsetInput, sigmaInput);
  const almaValues = new Series(bars, (bar, i) => almaArray[i] ?? NaN);
  return {
    metadata: { title: "Arnaud Legoux Moving Average", shorttitle: "ALMA", overlay: true },
    plots: { "plot0": almaValues.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Arnaud Legoux Moving Average", shortTitle: "ALMA", overlay: true };
var inputConfig = [
  { id: "lengthInput", type: "int", title: "Length", defval: 9, min: 1 },
  { id: "offsetInput", type: "float", title: "Offset", defval: 0.85, step: 0.01 },
  { id: "sigmaInput", type: "float", title: "Sigma", defval: 6 }
];
var plotConfig = [{ id: "plot0", title: "ALMA", color: "#2962FF", lineWidth: 2 }];
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
