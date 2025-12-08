/**
 * Trend Strength Index
 *
 * Measures trend direction and strength using directional indicators.
 * Range: -1 to 1, where positive = uptrend, negative = downtrend.
 * Formula: (DI+ - DI-) / (DI+ + DI-)
 */

import { Series, ta, type IndicatorResult, type InputConfig, type PlotConfig, type Bar } from 'oakscriptjs';

export interface TrendStrengthInputs {
  /** Period length */
  length: number;
}

export const defaultInputs: TrendStrengthInputs = {
  length: 14,
};

export const inputConfig: InputConfig[] = [
  { id: 'length', type: 'int', title: 'Length', defval: 14, min: 1 },
];

export const plotConfig: PlotConfig[] = [
  { id: 'plot0', title: 'Trend Strength Index', color: '#2962FF', lineWidth: 1 },
];

export const metadata = {
  title: 'Trend Strength Index',
  shortTitle: 'TSI',
  overlay: false,
};

export function calculate(bars: Bar[], inputs: Partial<TrendStrengthInputs> = {}): IndicatorResult {
  const { length } = { ...defaultInputs, ...inputs };

  // Calculate directional movement
  const plusDM: number[] = [NaN];
  const minusDM: number[] = [NaN];
  const tr: number[] = [NaN];

  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevHigh = bars[i - 1].high;
    const prevLow = bars[i - 1].low;
    const prevClose = bars[i - 1].close;

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  // Smooth with RMA
  const plusDMSeries = new Series(bars, (_, i) => plusDM[i]);
  const minusDMSeries = new Series(bars, (_, i) => minusDM[i]);
  const trSeries = new Series(bars, (_, i) => tr[i]);

  const smoothPlusDM = ta.rma(plusDMSeries, length);
  const smoothMinusDM = ta.rma(minusDMSeries, length);
  const smoothTR = ta.rma(trSeries, length);

  const plusDMArr = smoothPlusDM.toArray();
  const minusDMArr = smoothMinusDM.toArray();
  const trArr = smoothTR.toArray();

  // Calculate DI+ and DI-
  const diPlus: number[] = [];
  const diMinus: number[] = [];

  for (let i = 0; i < bars.length; i++) {
    const pDM = plusDMArr[i];
    const mDM = minusDMArr[i];
    const atr = trArr[i];

    if (pDM == null || mDM == null || atr == null || atr === 0) {
      diPlus.push(NaN);
      diMinus.push(NaN);
    } else {
      diPlus.push(100 * pDM / atr);
      diMinus.push(100 * mDM / atr);
    }
  }

  // Trend Strength = (DI+ - DI-) / (DI+ + DI-)
  // Range: -1 to 1
  const tsValues: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const plus = diPlus[i];
    const minus = diMinus[i];

    if (isNaN(plus) || isNaN(minus)) {
      tsValues.push(NaN);
    } else {
      const sum = plus + minus;
      if (sum === 0) {
        tsValues.push(0);
      } else {
        tsValues.push((plus - minus) / sum);
      }
    }
  }

  const tsData = tsValues.map((value, i) => ({
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
      'plot0': tsData,
    },
  };
}

export const TrendStrengthIndex = {
  calculate,
  metadata,
  defaultInputs,
  inputConfig,
  plotConfig,
};
