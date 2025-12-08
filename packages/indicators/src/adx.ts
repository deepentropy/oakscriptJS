/**
 * Average Directional Index (ADX) Indicator
 *
 * Measures trend strength regardless of direction.
 * Uses +DI and -DI to calculate directional movement.
 */

import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig, type Bar } from 'oakscriptjs';

export interface ADXInputs {
  /** ADX smoothing period */
  adxSmoothing: number;
  /** DI period length */
  diLength: number;
}

export const defaultInputs: ADXInputs = {
  adxSmoothing: 14,
  diLength: 14,
};

export const inputConfig: InputConfig[] = [
  { id: 'adxSmoothing', type: 'int', title: 'ADX Smoothing', defval: 14, min: 1 },
  { id: 'diLength', type: 'int', title: 'DI Length', defval: 14, min: 1 },
];

export const plotConfig: PlotConfig[] = [
  { id: 'plot0', title: 'ADX', color: '#FF9800', lineWidth: 1 },
];

export const metadata = {
  title: 'Average Directional Index',
  shortTitle: 'ADX',
  overlay: false,
};

export function calculate(bars: Bar[], inputs: Partial<ADXInputs> = {}): IndicatorResult {
  const { adxSmoothing, diLength } = { ...defaultInputs, ...inputs };

  const high = new Series(bars, b => b.high);
  const low = new Series(bars, b => b.low);

  // Calculate True Range
  const trValues = ta.tr(bars, true);
  const trRma = ta.rma(trValues, diLength);
  const trRmaArr = trRma.toArray();

  // Calculate +DM and -DM
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
      continue;
    }
    const up = high.get(i) - high.get(i - 1);
    const down = low.get(i - 1) - low.get(i);
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
  }

  // Create Series from arrays for RMA
  const plusDMSeries = new Series(bars, (_, i) => plusDM[i]);
  const minusDMSeries = new Series(bars, (_, i) => minusDM[i]);

  // Smooth +DM and -DM
  const plusDMRma = ta.rma(plusDMSeries, diLength);
  const minusDMRma = ta.rma(minusDMSeries, diLength);
  const plusDMRmaArr = plusDMRma.toArray();
  const minusDMRmaArr = minusDMRma.toArray();

  // Calculate +DI and -DI
  const plusDI: number[] = [];
  const minusDI: number[] = [];

  for (let i = 0; i < bars.length; i++) {
    const tr = trRmaArr[i] ?? 0;
    if (tr === 0 || isNaN(tr)) {
      plusDI.push(NaN);
      minusDI.push(NaN);
    } else {
      plusDI.push(100 * (plusDMRmaArr[i] ?? 0) / tr);
      minusDI.push(100 * (minusDMRmaArr[i] ?? 0) / tr);
    }
  }

  // Calculate DX and ADX
  const dx: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const sum = plusDI[i] + minusDI[i];
    if (isNaN(plusDI[i]) || isNaN(minusDI[i]) || sum === 0) {
      dx.push(NaN);
    } else {
      dx.push(100 * Math.abs(plusDI[i] - minusDI[i]) / sum);
    }
  }

  const dxSeries = new Series(bars, (_, i) => dx[i]);
  const adxValues = ta.rma(dxSeries, adxSmoothing);
  const adxArr = adxValues.toArray();

  const adxData = adxArr.map((value: number | null, i: number) => ({
    time: bars[i].time,
    value: value ?? NaN,
  }));

  return {
    metadata: {
      title: metadata.title,
      shorttitle: metadata.shortTitle,
      overlay: metadata.overlay,
    },
    plots: {
      'plot0': adxData,
    },
  };
}

export const ADX = {
  calculate,
  metadata,
  defaultInputs,
  inputConfig,
  plotConfig,
};
