// indicators/obv/obv.ts
import { Series, ta, math } from "@deepentropy/oakscriptjs";
var defaultInputs = {};
function On_Balance_Volume(bars, inputs = {}) {
  const close = new Series(bars, (bar) => bar.close);
  const volume = new Series(bars, (bar) => bar.volume ?? 0);
  const changeClose = ta.change(close, 1);
  const signChange = math.sign(changeClose);
  const signedVolume = signChange.mul(volume);
  const obv = ta.cum(signedVolume);
  return {
    metadata: { title: "On Balance Volume", shorttitle: "OBV", overlay: false },
    plots: { "plot0": obv.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "On Balance Volume", shortTitle: "OBV", overlay: false };
var inputConfig = [];
var plotConfig = [{ id: "plot0", title: "OnBalanceVolume", color: "#2962FF", lineWidth: 2 }];
var calculate = On_Balance_Volume;
export {
  On_Balance_Volume,
  On_Balance_Volume as On_Balance_VolumeIndicator,
  calculate,
  defaultInputs,
  inputConfig,
  metadata,
  plotConfig
};
