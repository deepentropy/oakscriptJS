var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// indicators/sma/index.ts
var sma_exports = {};
__export(sma_exports, {
  SMAIndicator: () => Moving_Average_Simple,
  calculate: () => calculate,
  calculateSMA: () => calculateSMA,
  defaultInputs: () => defaultInputs,
  getSourceSeries: () => getSourceSeries,
  inputConfig: () => inputConfig,
  metadata: () => metadata,
  plotConfig: () => plotConfig
});

// indicators/sma/sma.ts
import { Series, ta } from "oakscriptjs";
var defaultInputs = {
  len: 9,
  src: "close",
  offset: 0,
  maTypeInput: "None",
  maLengthInput: 14,
  bbMultInput: 2
};
function Moving_Average_Simple(bars, inputs = {}) {
  const { len, src, offset, maTypeInput, maLengthInput, bbMultInput } = { ...defaultInputs, ...inputs };
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
  const out = ta.sma(srcSeries, len);
  const GRP = "Smoothing";
  const TT_BB = "Only applies when 'SMA + Bollinger Bands' is selected. Determines the distance between the SMA and the bands.";
  const isBB = maTypeInput == "SMA + Bollinger Bands";
  const enableMA = maTypeInput != "None";
  function ma(source, length, MAtype) {
    return (() => {
      switch (MAtype) {
        case "SMA":
          return ta.sma(source, length);
        case "SMA + Bollinger Bands":
          return ta.sma(source, length);
        case "EMA":
          return ta.ema(source, length);
        case "SMMA (RMA)":
          return ta.rma(source, length);
        case "WMA":
          return ta.wma(source, length);
        case "VWMA":
          return ta.vwma(source, length, volume);
      }
    })();
  }
  const smoothingMA = enableMA ? ma(out, maLengthInput, maTypeInput) : new Series(bars, () => NaN);
  const smoothingStDev = isBB ? ta.stdev(out, maLengthInput).mul(bbMultInput) : new Series(bars, () => NaN);
  return {
    metadata: { title: "Moving Average Simple", shorttitle: "SMA", overlay: true },
    plots: { "plot0": out.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })), "plot1": smoothingMA.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })), "plot2": smoothingMA.add(smoothingStDev).toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })), "plot3": smoothingMA.sub(smoothingStDev).toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata = { title: "Moving Average Simple", shortTitle: "SMA", overlay: true };
var inputConfig = [{ id: "len", type: "int", title: "Length", defval: 9, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close" }, { id: "offset", type: "int", title: "Offset", defval: 0, min: -500, max: 500 }, { id: "maTypeInput", type: "string", title: "Type", defval: "None", options: ["None", "SMA", "SMA + Bollinger Bands", "EMA", "SMMA (RMA)", "WMA", "VWMA"] }, { id: "maLengthInput", type: "int", title: "Length", defval: 14 }, { id: "bbMultInput", type: "float", title: "BB StdDev", defval: 2, min: 1e-3, max: 50, step: 0.5 }];
var plotConfig = [{ id: "plot0", title: "MA", color: "#2962FF", lineWidth: 2 }, { id: "plot1", title: "smoothingMA", color: "#FFFF00", lineWidth: 2 }, { id: "plot2", title: "Upper Bollinger Band", color: "#00FF00", lineWidth: 2 }, { id: "plot3", title: "Lower Bollinger Band", color: "#00FF00", lineWidth: 2 }];
var calculate = Moving_Average_Simple;

// indicators/sma/sma-calculation.ts
import { Series as Series2, ta as ta2 } from "oakscriptjs";
function getSourceSeries(bars, sourceName) {
  switch (sourceName) {
    case "open":
      return Series2.fromBars(bars, "open");
    case "high":
      return Series2.fromBars(bars, "high");
    case "low":
      return Series2.fromBars(bars, "low");
    case "close":
      return Series2.fromBars(bars, "close");
    case "hl2": {
      const high = Series2.fromBars(bars, "high");
      const low = Series2.fromBars(bars, "low");
      return high.add(low).div(2);
    }
    case "hlc3": {
      const high = Series2.fromBars(bars, "high");
      const low = Series2.fromBars(bars, "low");
      const close = Series2.fromBars(bars, "close");
      return high.add(low).add(close).div(3);
    }
    case "ohlc4": {
      const open = Series2.fromBars(bars, "open");
      const high = Series2.fromBars(bars, "high");
      const low = Series2.fromBars(bars, "low");
      const close = Series2.fromBars(bars, "close");
      return open.add(high).add(low).add(close).div(4);
    }
    default:
      return Series2.fromBars(bars, "close");
  }
}
function calculateSMA(bars, length, source, offset) {
  const src = getSourceSeries(bars, source);
  const smaValues = ta2.sma(src, length);
  const smaArray = smaValues.toArray();
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const offsetIndex = i + offset;
    if (offsetIndex >= 0 && offsetIndex < bars.length) {
      const value = smaArray[i];
      const offsetBar = bars[offsetIndex];
      if (offsetBar && value !== void 0 && !Number.isNaN(value)) {
        data.push({ time: offsetBar.time, value });
      }
    }
  }
  return data;
}

// indicators/momentum/index.ts
var momentum_exports = {};
__export(momentum_exports, {
  MomentumIndicator: () => Momentum,
  calculate: () => calculate2,
  calculateMomentum: () => calculateMomentum,
  defaultInputs: () => defaultInputs2,
  inputConfig: () => inputConfig2,
  metadata: () => metadata2,
  plotConfig: () => plotConfig2
});

// indicators/momentum/momentum.ts
import { Series as Series3 } from "oakscriptjs";
var defaultInputs2 = {
  len: 10,
  src: "close"
};
function Momentum(bars, inputs = {}) {
  const { len, src } = { ...defaultInputs2, ...inputs };
  const open = new Series3(bars, (bar) => bar.open);
  const high = new Series3(bars, (bar) => bar.high);
  const low = new Series3(bars, (bar) => bar.low);
  const close = new Series3(bars, (bar) => bar.close);
  const volume = new Series3(bars, (bar) => bar.volume ?? 0);
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
  const year = new Series3(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series3(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series3(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series3(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series3(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series3(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const mom = srcSeries.sub(srcSeries.offset(len));
  return {
    metadata: { title: "Momentum", shorttitle: "Mom", overlay: false },
    plots: { "plot0": mom.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata2 = { title: "Momentum", shortTitle: "Mom", overlay: false };
var inputConfig2 = [{ id: "len", type: "int", title: "Length", defval: 10, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close" }];
var plotConfig2 = [{ id: "plot0", title: "MOM", color: "#2962FF", lineWidth: 2 }];
var calculate2 = Momentum;

// indicators/momentum/momentum-calculation.ts
import { ta as ta4 } from "oakscriptjs";
function calculateMomentum(bars, length, source) {
  const src = getSourceSeries(bars, source);
  const momValues = ta4.mom(src, length);
  const momArray = momValues.toArray();
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const value = momArray[i];
    const bar = bars[i];
    if (bar && value !== void 0 && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }
  return data;
}

// indicators/bop/index.ts
var bop_exports = {};
__export(bop_exports, {
  BOPIndicator: () => Balance_of_Power,
  calculate: () => calculate3,
  calculateBOP: () => calculateBOP,
  defaultInputs: () => defaultInputs3,
  inputConfig: () => inputConfig3,
  metadata: () => metadata3,
  plotConfig: () => plotConfig3
});

// indicators/bop/bop.ts
import { Series as Series5 } from "oakscriptjs";
function Balance_of_Power(bars) {
  const open = new Series5(bars, (bar) => bar.open);
  const high = new Series5(bars, (bar) => bar.high);
  const low = new Series5(bars, (bar) => bar.low);
  const close = new Series5(bars, (bar) => bar.close);
  const volume = new Series5(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const year = new Series5(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series5(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series5(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series5(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series5(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series5(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  return {
    metadata: { title: "Balance of Power", shorttitle: "Balance of Power", overlay: false },
    plots: { "plot0": close.sub(open).div(high.sub(low)).toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata3 = { title: "Balance of Power", shortTitle: "Balance of Power", overlay: false };
var defaultInputs3 = {};
var inputConfig3 = [];
var plotConfig3 = [{ id: "plot0", title: "Plot 0", color: "#FF0000", lineWidth: 2 }];
var calculate3 = Balance_of_Power;

// indicators/bop/bop-calculation.ts
function calculateBOP(bars) {
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar) {
      const range = bar.high - bar.low;
      const value = range !== 0 ? (bar.close - bar.open) / range : 0;
      if (!Number.isNaN(value)) {
        data.push({ time: bar.time, value });
      }
    }
  }
  return data;
}

// indicators/dema/index.ts
var dema_exports = {};
__export(dema_exports, {
  DEMAIndicator: () => Double_EMA,
  calculate: () => calculate4,
  calculateDEMA: () => calculateDEMA,
  defaultInputs: () => defaultInputs4,
  inputConfig: () => inputConfig4,
  metadata: () => metadata4,
  plotConfig: () => plotConfig4
});

// indicators/dema/dema.ts
import { Series as Series6, ta as ta6 } from "oakscriptjs";
var defaultInputs4 = {
  length: 9,
  src: "close"
};
function Double_EMA(bars, inputs = {}) {
  const { length, src } = { ...defaultInputs4, ...inputs };
  const open = new Series6(bars, (bar) => bar.open);
  const high = new Series6(bars, (bar) => bar.high);
  const low = new Series6(bars, (bar) => bar.low);
  const close = new Series6(bars, (bar) => bar.close);
  const volume = new Series6(bars, (bar) => bar.volume ?? 0);
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
  const year = new Series6(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series6(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series6(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series6(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series6(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series6(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const e1 = ta6.ema(srcSeries, length);
  const e2 = ta6.ema(e1, length);
  const dema = e1.mul(2).sub(e2);
  return {
    metadata: { title: "Double EMA", shorttitle: "DEMA", overlay: true },
    plots: { "plot0": dema.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata4 = { title: "Double EMA", shortTitle: "DEMA", overlay: true };
var inputConfig4 = [{ id: "length", type: "int", title: "length", defval: 9, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close" }];
var plotConfig4 = [{ id: "plot0", title: "dema", color: "#43A047", lineWidth: 2 }];
var calculate4 = Double_EMA;

// indicators/dema/dema-calculation.ts
import { ta as ta7 } from "oakscriptjs";
function calculateDEMA(bars, length, source) {
  const src = getSourceSeries(bars, source);
  const ema1 = ta7.ema(src, length);
  const ema2 = ta7.ema(ema1, length);
  const dema = ema1.mul(2).sub(ema2);
  const demaArray = dema.toArray();
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const value = demaArray[i];
    const bar = bars[i];
    if (bar && value !== void 0 && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }
  return data;
}

// indicators/tema/index.ts
var tema_exports = {};
__export(tema_exports, {
  TEMAIndicator: () => Triple_EMA,
  calculate: () => calculate5,
  calculateTEMA: () => calculateTEMA,
  defaultInputs: () => defaultInputs5,
  inputConfig: () => inputConfig5,
  metadata: () => metadata5,
  plotConfig: () => plotConfig5
});

// indicators/tema/tema.ts
import { Series as Series8, ta as ta8 } from "oakscriptjs";
var defaultInputs5 = {
  length: 9
};
function Triple_EMA(bars, inputs = {}) {
  const { length } = { ...defaultInputs5, ...inputs };
  const open = new Series8(bars, (bar) => bar.open);
  const high = new Series8(bars, (bar) => bar.high);
  const low = new Series8(bars, (bar) => bar.low);
  const close = new Series8(bars, (bar) => bar.close);
  const volume = new Series8(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const year = new Series8(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series8(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series8(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series8(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series8(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series8(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const ema1 = ta8.ema(close, length);
  const ema2 = ta8.ema(ema1, length);
  const ema3 = ta8.ema(ema2, length);
  const out = ema1.sub(ema2).mul(3).add(ema3);
  return {
    metadata: { title: "Triple EMA", shorttitle: "TEMA", overlay: true },
    plots: { "plot0": out.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata5 = { title: "Triple EMA", shortTitle: "TEMA", overlay: true };
var inputConfig5 = [{ id: "length", type: "int", title: "length", defval: 9, min: 1 }];
var plotConfig5 = [{ id: "plot0", title: "out", color: "#2962FF", lineWidth: 2 }];
var calculate5 = Triple_EMA;

// indicators/tema/tema-calculation.ts
import { ta as ta9 } from "oakscriptjs";
function calculateTEMA(bars, length, source) {
  const src = getSourceSeries(bars, source);
  const ema1 = ta9.ema(src, length);
  const ema2 = ta9.ema(ema1, length);
  const ema3 = ta9.ema(ema2, length);
  const tema = ema1.sub(ema2).mul(3).add(ema3);
  const temaArray = tema.toArray();
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const value = temaArray[i];
    const bar = bars[i];
    if (bar && value !== void 0 && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }
  return data;
}

// indicators/roc/index.ts
var roc_exports = {};
__export(roc_exports, {
  ROCIndicator: () => Rate_Of_Change,
  calculate: () => calculate6,
  calculateROC: () => calculateROC,
  defaultInputs: () => defaultInputs6,
  inputConfig: () => inputConfig6,
  metadata: () => metadata6,
  plotConfig: () => plotConfig6
});

// indicators/roc/roc.ts
import { Series as Series10 } from "oakscriptjs";
var defaultInputs6 = {
  length: 9,
  source: "close"
};
function Rate_Of_Change(bars, inputs = {}) {
  const { length, source } = { ...defaultInputs6, ...inputs };
  const open = new Series10(bars, (bar) => bar.open);
  const high = new Series10(bars, (bar) => bar.high);
  const low = new Series10(bars, (bar) => bar.low);
  const close = new Series10(bars, (bar) => bar.close);
  const volume = new Series10(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const sourceSeries = (() => {
    switch (source) {
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
  const year = new Series10(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series10(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series10(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series10(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series10(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series10(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const roc = sourceSeries.sub(sourceSeries.offset(length)).mul(100).div(sourceSeries.offset(length));
  return {
    metadata: { title: "Rate Of Change", shorttitle: "ROC", overlay: false },
    plots: { "plot0": roc.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata6 = { title: "Rate Of Change", shortTitle: "ROC", overlay: false };
var inputConfig6 = [{ id: "length", type: "int", title: "length", defval: 9, min: 1 }, { id: "source", type: "source", title: "Source", defval: "close" }];
var plotConfig6 = [{ id: "plot0", title: "ROC", color: "#2962FF", lineWidth: 2 }];
var calculate6 = Rate_Of_Change;

// indicators/roc/roc-calculation.ts
import { ta as ta11 } from "oakscriptjs";
function calculateROC(bars, length, source) {
  const src = getSourceSeries(bars, source);
  const rocValues = ta11.roc(src, length);
  const rocArray = rocValues.toArray();
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const value = rocArray[i];
    const bar = bars[i];
    if (bar && value !== void 0 && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }
  return data;
}

// indicators/adr/index.ts
var adr_exports = {};
__export(adr_exports, {
  ADRIndicator: () => Average_Day_Range,
  calculate: () => calculate7,
  calculateADR: () => calculateADR,
  defaultInputs: () => defaultInputs7,
  inputConfig: () => inputConfig7,
  metadata: () => metadata7,
  plotConfig: () => plotConfig7
});

// indicators/adr/adr.ts
import { Series as Series12, ta as ta12 } from "oakscriptjs";
var defaultInputs7 = {
  lengthInput: 14
};
function Average_Day_Range(bars, inputs = {}) {
  const { lengthInput } = { ...defaultInputs7, ...inputs };
  const open = new Series12(bars, (bar) => bar.open);
  const high = new Series12(bars, (bar) => bar.high);
  const low = new Series12(bars, (bar) => bar.low);
  const close = new Series12(bars, (bar) => bar.close);
  const volume = new Series12(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const year = new Series12(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series12(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series12(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series12(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series12(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series12(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const adr = ta12.sma(high.sub(low), lengthInput);
  return {
    metadata: { title: "Average Day Range", shorttitle: "ADR", overlay: false },
    plots: { "plot0": adr.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata7 = { title: "Average Day Range", shortTitle: "ADR", overlay: false };
var inputConfig7 = [{ id: "lengthInput", type: "int", title: "Length", defval: 14 }];
var plotConfig7 = [{ id: "plot0", title: "ADR", color: "#2962FF", lineWidth: 2 }];
var calculate7 = Average_Day_Range;

// indicators/adr/adr-calculation.ts
import { Series as Series13, ta as ta13 } from "oakscriptjs";
function calculateADR(bars, length) {
  const high = Series13.fromBars(bars, "high");
  const low = Series13.fromBars(bars, "low");
  const range = high.sub(low);
  const adrValues = ta13.sma(range, length);
  const adrArray = adrValues.toArray();
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const value = adrArray[i];
    const bar = bars[i];
    if (bar && value !== void 0 && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }
  return data;
}

// indicators/mass-index/index.ts
var mass_index_exports = {};
__export(mass_index_exports, {
  MassIndexIndicator: () => Mass_Index,
  calculate: () => calculate8,
  calculateMassIndex: () => calculateMassIndex,
  defaultInputs: () => defaultInputs8,
  inputConfig: () => inputConfig8,
  metadata: () => metadata8,
  plotConfig: () => plotConfig8
});

// indicators/mass-index/mass-index.ts
import { Series as Series14, ta as ta14, math as math8 } from "oakscriptjs";
var defaultInputs8 = {
  length: 10
};
function Mass_Index(bars, inputs = {}) {
  const { length } = { ...defaultInputs8, ...inputs };
  const open = new Series14(bars, (bar) => bar.open);
  const high = new Series14(bars, (bar) => bar.high);
  const low = new Series14(bars, (bar) => bar.low);
  const close = new Series14(bars, (bar) => bar.close);
  const volume = new Series14(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const year = new Series14(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series14(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series14(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series14(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series14(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series14(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const span = high.sub(low);
  const mi = math8.sum(ta14.ema(span, 9).div(ta14.ema(ta14.ema(span, 9), 9)), length);
  return {
    metadata: { title: "Mass Index", shorttitle: "Mass Index", overlay: false },
    plots: { "plot0": mi.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata8 = { title: "Mass Index", shortTitle: "Mass Index", overlay: false };
var inputConfig8 = [{ id: "length", type: "int", title: "length", defval: 10, min: 1 }];
var plotConfig8 = [{ id: "plot0", title: "mi", color: "#2962FF", lineWidth: 2 }];
var calculate8 = Mass_Index;

// indicators/mass-index/mass-index-calculation.ts
import { Series as Series15, ta as ta15 } from "oakscriptjs";
function calculateMassIndex(bars, length) {
  const high = Series15.fromBars(bars, "high");
  const low = Series15.fromBars(bars, "low");
  const span = high.sub(low);
  const ema1 = ta15.ema(span, 9);
  const ema2 = ta15.ema(ema1, 9);
  const ratio = ema1.div(ema2);
  const ratioArray = ratio.toArray();
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < length - 1) {
      continue;
    }
    let sum = 0;
    let hasNaN = false;
    for (let j = 0; j < length; j++) {
      const val = ratioArray[i - j];
      if (val === void 0 || Number.isNaN(val)) {
        hasNaN = true;
        break;
      }
      sum += val;
    }
    const bar = bars[i];
    if (bar && !hasNaN) {
      data.push({ time: bar.time, value: sum });
    }
  }
  return data;
}

// indicators/mc-ginley-dynamic/index.ts
var mc_ginley_dynamic_exports = {};
__export(mc_ginley_dynamic_exports, {
  McGinleyDynamicIndicator: () => McGinley_Dynamic,
  calculate: () => calculate9,
  defaultInputs: () => defaultInputs9,
  inputConfig: () => inputConfig9,
  metadata: () => metadata9,
  plotConfig: () => plotConfig9
});

// indicators/mc-ginley-dynamic/mc-ginley-dynamic.ts
import { Series as Series16, ta as ta16, math as math9 } from "oakscriptjs";
function na(value) {
  return value === null || value === void 0 || Number.isNaN(value);
}
var defaultInputs9 = {
  length: 14
};
function McGinley_Dynamic(bars, inputs = {}) {
  const { length } = { ...defaultInputs9, ...inputs };
  const open = new Series16(bars, (bar) => bar.open);
  const high = new Series16(bars, (bar) => bar.high);
  const low = new Series16(bars, (bar) => bar.low);
  const close = new Series16(bars, (bar) => bar.close);
  const volume = new Series16(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const year = new Series16(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series16(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series16(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series16(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series16(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series16(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const source = close;
  let mg = new Series16(bars, () => 0);
  const mgValues = new Array(bars.length).fill(NaN);
  for (let i = 0; i < bars.length; i++) {
    const mgPrev = i > 0 ? mgValues[i - 1] : NaN;
    mgValues[i] = na(mgPrev) ? ta16.ema(source, length).get(i) : (mgPrev + (source.get(i) - mgPrev)) / (length * math9.pow(source.get(i) / mgPrev, 4));
  }
  mg = Series16.fromArray(bars, mgValues);
  return {
    metadata: { title: "McGinley Dynamic", shorttitle: "McGinley Dynamic", overlay: true },
    plots: { "plot0": mg.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata9 = { title: "McGinley Dynamic", shortTitle: "McGinley Dynamic", overlay: true };
var inputConfig9 = [{ id: "length", type: "int", title: "length", defval: 14, min: 1 }];
var plotConfig9 = [{ id: "plot0", title: "mg", color: "#2962FF", lineWidth: 2 }];
var calculate9 = McGinley_Dynamic;

// indicators/hma/index.ts
var hma_exports = {};
__export(hma_exports, {
  HMAIndicator: () => Hull_Moving_Average,
  calculate: () => calculate10,
  calculateHMA: () => calculateHMA,
  defaultInputs: () => defaultInputs10,
  inputConfig: () => inputConfig10,
  metadata: () => metadata10,
  plotConfig: () => plotConfig10
});

// indicators/hma/hma.ts
import { Series as Series17, ta as ta17, math as math10 } from "oakscriptjs";
var defaultInputs10 = {
  length: 9,
  src: "close"
};
function Hull_Moving_Average(bars, inputs = {}) {
  const { length, src } = { ...defaultInputs10, ...inputs };
  const open = new Series17(bars, (bar) => bar.open);
  const high = new Series17(bars, (bar) => bar.high);
  const low = new Series17(bars, (bar) => bar.low);
  const close = new Series17(bars, (bar) => bar.close);
  const volume = new Series17(bars, (bar) => bar.volume ?? 0);
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
  const year = new Series17(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series17(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series17(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series17(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series17(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series17(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const hullma = ta17.wma(ta17.wma(srcSeries, length / 2).mul(2).sub(ta17.wma(srcSeries, length)), math10.floor(math10.sqrt(length)));
  return {
    metadata: { title: "Hull Moving Average", shorttitle: "HMA", overlay: true },
    plots: { "plot0": hullma.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata10 = { title: "Hull Moving Average", shortTitle: "HMA", overlay: true };
var inputConfig10 = [{ id: "length", type: "int", title: "Length", defval: 9, min: 2 }, { id: "src", type: "source", title: "Source", defval: "close" }];
var plotConfig10 = [{ id: "plot0", title: "hullma", color: "#2962FF", lineWidth: 2 }];
var calculate10 = Hull_Moving_Average;

// indicators/hma/hma-calculation.ts
import { ta as ta18 } from "oakscriptjs";
function calculateHMA(bars, length, source) {
  const src = getSourceSeries(bars, source);
  const halfLength = Math.max(1, Math.floor(length / 2));
  const sqrtLength = Math.max(1, Math.floor(Math.sqrt(length)));
  const wmaHalf = ta18.wma(src, halfLength);
  const wmaFull = ta18.wma(src, length);
  const diff = wmaHalf.mul(2).sub(wmaFull);
  const hma = ta18.wma(diff, sqrtLength);
  const hmaArray = hma.toArray();
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const value = hmaArray[i];
    const bar = bars[i];
    if (bar && value !== void 0 && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }
  return data;
}

// indicators/lsma/index.ts
var lsma_exports = {};
__export(lsma_exports, {
  LSMAIndicator: () => Least_Squares_Moving_Average,
  calculate: () => calculate11,
  calculateLSMA: () => calculateLSMA,
  defaultInputs: () => defaultInputs11,
  inputConfig: () => inputConfig11,
  metadata: () => metadata11,
  plotConfig: () => plotConfig11
});

// indicators/lsma/lsma.ts
import { Series as Series19, ta as ta19 } from "oakscriptjs";
var defaultInputs11 = {
  length: 25,
  offset: 0,
  src: "close"
};
function Least_Squares_Moving_Average(bars, inputs = {}) {
  const { length, offset, src } = { ...defaultInputs11, ...inputs };
  const open = new Series19(bars, (bar) => bar.open);
  const high = new Series19(bars, (bar) => bar.high);
  const low = new Series19(bars, (bar) => bar.low);
  const close = new Series19(bars, (bar) => bar.close);
  const volume = new Series19(bars, (bar) => bar.volume ?? 0);
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
  const year = new Series19(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series19(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series19(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series19(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series19(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series19(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const lsma = ta19.linreg(srcSeries, length, offset);
  return {
    metadata: { title: "Least Squares Moving Average", shorttitle: "LSMA", overlay: true },
    plots: { "plot0": lsma.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata11 = { title: "Least Squares Moving Average", shortTitle: "LSMA", overlay: true };
var inputConfig11 = [{ id: "length", type: "int", title: "Length", defval: 25 }, { id: "offset", type: "int", title: "Offset", defval: 0 }, { id: "src", type: "source", title: "Source", defval: "close" }];
var plotConfig11 = [{ id: "plot0", title: "lsma", color: "#2962FF", lineWidth: 2 }];
var calculate11 = Least_Squares_Moving_Average;

// indicators/lsma/lsma-calculation.ts
import { taCore as taCore12 } from "oakscriptjs";
function calculateLSMA(bars, length, offset, source) {
  const src = getSourceSeries(bars, source);
  const srcArray = src.toArray();
  const lsmaValues = taCore12.linreg(srcArray, length, offset);
  const data = [];
  for (let i = 0; i < bars.length; i++) {
    const value = lsmaValues[i];
    const bar = bars[i];
    if (bar && value !== void 0 && !Number.isNaN(value)) {
      data.push({ time: bar.time, value });
    }
  }
  return data;
}

// indicators/rma/index.ts
var rma_exports = {};
__export(rma_exports, {
  Smoothed_Moving_Average: () => Smoothed_Moving_Average,
  calculate: () => calculate12,
  defaultInputs: () => defaultInputs12,
  inputConfig: () => inputConfig12,
  metadata: () => metadata12,
  plotConfig: () => plotConfig12
});

// indicators/rma/rma.ts
import { Series as Series21, ta as ta20 } from "oakscriptjs";
function na2(value) {
  return value === null || value === void 0 || Number.isNaN(value);
}
var defaultInputs12 = {
  len: 7,
  src: "close"
};
function Smoothed_Moving_Average(bars, inputs = {}) {
  const { len, src } = { ...defaultInputs12, ...inputs };
  const open = new Series21(bars, (bar) => bar.open);
  const high = new Series21(bars, (bar) => bar.high);
  const low = new Series21(bars, (bar) => bar.low);
  const close = new Series21(bars, (bar) => bar.close);
  const volume = new Series21(bars, (bar) => bar.volume ?? 0);
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
  const year = new Series21(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series21(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series21(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series21(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series21(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series21(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  let smma = new Series21(bars, () => 0);
  const smmaValues = new Array(bars.length).fill(NaN);
  for (let i = 0; i < bars.length; i++) {
    const smmaPrev = i > 0 ? smmaValues[i - 1] : NaN;
    smmaValues[i] = na2(smmaPrev) ? ta20.sma(srcSeries, len).get(i) : (smmaPrev * (len - 1) + srcSeries.get(i)) / len;
  }
  smma = Series21.fromArray(bars, smmaValues);
  return {
    metadata: { title: "Smoothed Moving Average", shorttitle: "SMMA", overlay: true },
    plots: { "plot0": smma.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata12 = { title: "Smoothed Moving Average", shortTitle: "SMMA", overlay: true };
var inputConfig12 = [{ id: "len", type: "int", title: "Length", defval: 7, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close" }];
var plotConfig12 = [{ id: "plot0", title: "smma", color: "#673AB7", lineWidth: 2 }];
var calculate12 = Smoothed_Moving_Average;

// indicators/wma/index.ts
var wma_exports = {};
__export(wma_exports, {
  Moving_Average_Weighted: () => Moving_Average_Weighted,
  calculate: () => calculate13,
  defaultInputs: () => defaultInputs13,
  inputConfig: () => inputConfig13,
  metadata: () => metadata13,
  plotConfig: () => plotConfig13
});

// indicators/wma/wma.ts
import { Series as Series22, ta as ta21 } from "oakscriptjs";
var defaultInputs13 = {
  len: 9,
  src: "close",
  offset: 0
};
function Moving_Average_Weighted(bars, inputs = {}) {
  const { len, src, offset } = { ...defaultInputs13, ...inputs };
  const open = new Series22(bars, (bar) => bar.open);
  const high = new Series22(bars, (bar) => bar.high);
  const low = new Series22(bars, (bar) => bar.low);
  const close = new Series22(bars, (bar) => bar.close);
  const volume = new Series22(bars, (bar) => bar.volume ?? 0);
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
  const year = new Series22(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series22(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series22(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series22(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series22(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series22(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const out = ta21.wma(srcSeries, len);
  return {
    metadata: { title: "Moving Average Weighted", shorttitle: "WMA", overlay: true },
    plots: { "plot0": out.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata13 = { title: "Moving Average Weighted", shortTitle: "WMA", overlay: true };
var inputConfig13 = [{ id: "len", type: "int", title: "Length", defval: 9, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close" }, { id: "offset", type: "int", title: "Offset", defval: 0, min: -500, max: 500 }];
var plotConfig13 = [{ id: "plot0", title: "WMA", color: "#2962FF", lineWidth: 2 }];
var calculate13 = Moving_Average_Weighted;

// indicators/vwma/index.ts
var vwma_exports = {};
__export(vwma_exports, {
  Volume_Weighted_Moving_Average: () => Volume_Weighted_Moving_Average,
  calculate: () => calculate14,
  defaultInputs: () => defaultInputs14,
  inputConfig: () => inputConfig14,
  metadata: () => metadata14,
  plotConfig: () => plotConfig14
});

// indicators/vwma/vwma.ts
import { Series as Series23, ta as ta22 } from "oakscriptjs";
var defaultInputs14 = {
  len: 20,
  src: "close",
  offset: 0
};
function Volume_Weighted_Moving_Average(bars, inputs = {}) {
  const { len, src, offset } = { ...defaultInputs14, ...inputs };
  const open = new Series23(bars, (bar) => bar.open);
  const high = new Series23(bars, (bar) => bar.high);
  const low = new Series23(bars, (bar) => bar.low);
  const close = new Series23(bars, (bar) => bar.close);
  const volume = new Series23(bars, (bar) => bar.volume ?? 0);
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
  const year = new Series23(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series23(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series23(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series23(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series23(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series23(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const ma = ta22.vwma(srcSeries, len, volume);
  return {
    metadata: { title: "Volume Weighted Moving Average", shorttitle: "VWMA", overlay: true },
    plots: { "plot0": ma.toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata14 = { title: "Volume Weighted Moving Average", shortTitle: "VWMA", overlay: true };
var inputConfig14 = [{ id: "len", type: "int", title: "Length", defval: 20, min: 1 }, { id: "src", type: "source", title: "Source", defval: "close" }, { id: "offset", type: "int", title: "Offset", defval: 0, min: -500, max: 500 }];
var plotConfig14 = [{ id: "plot0", title: "VWMA", color: "#2962FF", lineWidth: 2 }];
var calculate14 = Volume_Weighted_Moving_Average;

// indicators/alma/index.ts
var alma_exports = {};
__export(alma_exports, {
  Arnaud_Legoux_Moving_Average: () => Arnaud_Legoux_Moving_Average,
  calculate: () => calculate15,
  defaultInputs: () => defaultInputs15,
  inputConfig: () => inputConfig15,
  metadata: () => metadata15,
  plotConfig: () => plotConfig15
});

// indicators/alma/alma.ts
import { Series as Series24, ta as ta23 } from "oakscriptjs";
var defaultInputs15 = {
  lengthInput: 9,
  offsetInput: 0.85,
  sigmaInput: 6
};
function Arnaud_Legoux_Moving_Average(bars, inputs = {}) {
  const { lengthInput, offsetInput, sigmaInput } = { ...defaultInputs15, ...inputs };
  const open = new Series24(bars, (bar) => bar.open);
  const high = new Series24(bars, (bar) => bar.high);
  const low = new Series24(bars, (bar) => bar.low);
  const close = new Series24(bars, (bar) => bar.close);
  const volume = new Series24(bars, (bar) => bar.volume ?? 0);
  const hl2 = high.add(low).div(2);
  const hlc3 = high.add(low).add(close).div(3);
  const ohlc4 = open.add(high).add(low).add(close).div(4);
  const hlcc4 = high.add(low).add(close).add(close).div(4);
  const year = new Series24(bars, (bar) => new Date(bar.time).getFullYear());
  const month = new Series24(bars, (bar) => new Date(bar.time).getMonth() + 1);
  const dayofmonth = new Series24(bars, (bar) => new Date(bar.time).getDate());
  const dayofweek = new Series24(bars, (bar) => new Date(bar.time).getDay() + 1);
  const hour = new Series24(bars, (bar) => new Date(bar.time).getHours());
  const minute = new Series24(bars, (bar) => new Date(bar.time).getMinutes());
  const last_bar_index = bars.length - 1;
  const TT_OFFSET = "Controls tradeoff between smoothness (closer to 1) and responsiveness (closer to 0).";
  const TT_SIGMA = "This element is a standard deviation that is applied to the combo line in order for it to appear more sharp.";
  const source = close;
  return {
    metadata: { title: "Arnaud Legoux Moving Average", shorttitle: "ALMA", overlay: true },
    plots: { "plot0": ta23.alma(source, lengthInput, offsetInput, sigmaInput).toArray().map((v, i) => ({ time: bars[i].time, value: v ?? NaN })) }
  };
}
var metadata15 = { title: "Arnaud Legoux Moving Average", shortTitle: "ALMA", overlay: true };
var inputConfig15 = [{ id: "lengthInput", type: "int", title: "Length", defval: 9, min: 1 }, { id: "offsetInput", type: "float", title: "Offset", defval: 0.85, step: 0.01 }, { id: "sigmaInput", type: "float", title: "Sigma", defval: 6 }];
var plotConfig15 = [{ id: "plot0", title: "Plot 0", color: "#2962FF", lineWidth: 2 }];
var calculate15 = Arnaud_Legoux_Moving_Average;

// indicators/index.ts
var indicatorRegistry = [
  {
    id: "sma",
    name: "Simple Moving Average (SMA)",
    shortName: "SMA",
    description: "A simple moving average that smooths price data by calculating the arithmetic mean over a specified period.",
    overlay: true,
    metadata,
    inputConfig,
    plotConfig,
    defaultInputs: { ...defaultInputs },
    calculate
  },
  {
    id: "momentum",
    name: "Momentum (MOM)",
    shortName: "MOM",
    description: "Measures the rate of change in price by comparing the current price to a price from a specified number of periods ago.",
    overlay: false,
    metadata: metadata2,
    inputConfig: inputConfig2,
    plotConfig: plotConfig2,
    defaultInputs: { ...defaultInputs2 },
    calculate: calculate2
  },
  {
    id: "bop",
    name: "Balance of Power (BOP)",
    shortName: "BOP",
    description: "Measures the strength of buyers versus sellers by comparing the close to the open relative to the range.",
    overlay: false,
    metadata: metadata3,
    inputConfig: inputConfig3,
    plotConfig: plotConfig3,
    defaultInputs: { ...defaultInputs3 },
    calculate: calculate3
  },
  {
    id: "dema",
    name: "Double EMA (DEMA)",
    shortName: "DEMA",
    description: "A faster-reacting moving average that reduces lag by using a combination of two EMAs.",
    overlay: true,
    metadata: metadata4,
    inputConfig: inputConfig4,
    plotConfig: plotConfig4,
    defaultInputs: { ...defaultInputs4 },
    calculate: calculate4
  },
  {
    id: "tema",
    name: "Triple EMA (TEMA)",
    shortName: "TEMA",
    description: "A triple-smoothed exponential moving average with even less lag than DEMA.",
    overlay: true,
    metadata: metadata5,
    inputConfig: inputConfig5,
    plotConfig: plotConfig5,
    defaultInputs: { ...defaultInputs5 },
    calculate: calculate5
  },
  {
    id: "roc",
    name: "Rate of Change (ROC)",
    shortName: "ROC",
    description: "Measures the percentage change in price between the current price and a price from a specified number of periods ago.",
    overlay: false,
    metadata: metadata6,
    inputConfig: inputConfig6,
    plotConfig: plotConfig6,
    defaultInputs: { ...defaultInputs6 },
    calculate: calculate6
  },
  {
    id: "adr",
    name: "Average Day Range (ADR)",
    shortName: "ADR",
    description: "Calculates the average of the daily price range (high - low) over a specified period.",
    overlay: false,
    metadata: metadata7,
    inputConfig: inputConfig7,
    plotConfig: plotConfig7,
    defaultInputs: { ...defaultInputs7 },
    calculate: calculate7
  },
  {
    id: "mass-index",
    name: "Mass Index",
    shortName: "MI",
    description: "Uses the high-low range to identify trend reversals based on range expansion.",
    overlay: false,
    metadata: metadata8,
    inputConfig: inputConfig8,
    plotConfig: plotConfig8,
    defaultInputs: { ...defaultInputs8 },
    calculate: calculate8
  },
  {
    id: "mc-ginley-dynamic",
    name: "McGinley Dynamic",
    shortName: "MGD",
    description: "A dynamic moving average that automatically adjusts to market speed and reduces price separation.",
    overlay: true,
    metadata: metadata9,
    inputConfig: inputConfig9,
    plotConfig: plotConfig9,
    defaultInputs: { ...defaultInputs9 },
    calculate: calculate9
  },
  {
    id: "hma",
    name: "Hull Moving Average (HMA)",
    shortName: "HMA",
    description: "A fast and smooth moving average that almost eliminates lag using weighted moving averages.",
    overlay: true,
    metadata: metadata10,
    inputConfig: inputConfig10,
    plotConfig: plotConfig10,
    defaultInputs: { ...defaultInputs10 },
    calculate: calculate10
  },
  {
    id: "lsma",
    name: "Least Squares Moving Average (LSMA)",
    shortName: "LSMA",
    description: "Uses linear regression to calculate a moving average that fits the price data using the least squares method.",
    overlay: true,
    metadata: metadata11,
    inputConfig: inputConfig11,
    plotConfig: plotConfig11,
    defaultInputs: { ...defaultInputs11 },
    calculate: calculate11
  },
  {
    id: "rma",
    name: "Smoothed Moving Average (RMA)",
    shortName: "RMA",
    description: "A smoothed moving average, also known as SMMA or RMA, that gives more weight to recent data.",
    overlay: true,
    metadata: metadata12,
    inputConfig: inputConfig12,
    plotConfig: plotConfig12,
    defaultInputs: { ...defaultInputs12 },
    calculate: calculate12
  },
  {
    id: "wma",
    name: "Weighted Moving Average (WMA)",
    shortName: "WMA",
    description: "A moving average that gives linearly decreasing weights to older data points.",
    overlay: true,
    metadata: metadata13,
    inputConfig: inputConfig13,
    plotConfig: plotConfig13,
    defaultInputs: { ...defaultInputs13 },
    calculate: calculate13
  },
  {
    id: "vwma",
    name: "Volume Weighted Moving Average (VWMA)",
    shortName: "VWMA",
    description: "A moving average that gives more weight to periods with higher volume.",
    overlay: true,
    metadata: metadata14,
    inputConfig: inputConfig14,
    plotConfig: plotConfig14,
    defaultInputs: { ...defaultInputs14 },
    calculate: calculate14
  },
  {
    id: "alma",
    name: "Arnaud Legoux Moving Average (ALMA)",
    shortName: "ALMA",
    description: "A moving average using a Gaussian distribution to reduce lag while maintaining smoothness.",
    overlay: true,
    metadata: metadata15,
    inputConfig: inputConfig15,
    plotConfig: plotConfig15,
    defaultInputs: { ...defaultInputs15 },
    calculate: calculate15
  }
  // OBV excluded: requires bar-by-bar loop support for 'var' variable persistence
];
export {
  Average_Day_Range as ADRIndicator,
  Balance_of_Power as BOPIndicator,
  Double_EMA as DEMAIndicator,
  Hull_Moving_Average as HMAIndicator,
  Least_Squares_Moving_Average as LSMAIndicator,
  Mass_Index as MassIndexIndicator,
  McGinley_Dynamic as McGinleyDynamicIndicator,
  Momentum as MomentumIndicator,
  Rate_Of_Change as ROCIndicator,
  Moving_Average_Simple as SMAIndicator,
  Triple_EMA as TEMAIndicator,
  adr_exports as adr,
  alma_exports as alma,
  bop_exports as bop,
  dema_exports as dema,
  hma_exports as hma,
  indicatorRegistry,
  lsma_exports as lsma,
  mass_index_exports as massIndex,
  mc_ginley_dynamic_exports as mcginleyDynamic,
  momentum_exports as momentum,
  rma_exports as rma,
  roc_exports as roc,
  sma_exports as sma,
  tema_exports as tema,
  vwma_exports as vwma,
  wma_exports as wma
};
