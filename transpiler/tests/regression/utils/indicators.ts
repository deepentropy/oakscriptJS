/**
 * Indicator calculation utilities using oakscriptjs array-based functions
 * These functions replicate the PineScript indicators for validation
 */

import { taCore, math as mathCore } from '@deepentropy/oakscriptjs';

export interface Bar {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Extract price/volume arrays from bars
 */
function extractArrays(bars: Bar[]) {
  const open = bars.map(b => b.open);
  const high = bars.map(b => b.high);
  const low = bars.map(b => b.low);
  const close = bars.map(b => b.close);
  const volume = bars.map(b => b.volume);
  const hl2 = bars.map((b, i) => (high[i] + low[i]) / 2);
  const hlc3 = bars.map((b, i) => (high[i] + low[i] + close[i]) / 3);
  
  return { open, high, low, close, volume, hl2, hlc3 };
}

/**
 * Calculate overlay indicators matching pine-overlay.pine
 */
export function calculateOverlayIndicators(bars: Bar[], length: number = 14) {
  const { close, high, low, volume, hl2 } = extractArrays(bars);
  
  // Moving Averages
  const sma = taCore.sma(close, length);
  const ema = taCore.ema(close, length);
  const wma = taCore.wma(close, length);
  const vwma = taCore.vwma(close, volume, length);
  const rma = taCore.rma(close, length);
  
  // DEMA - Double EMA
  const ema1 = taCore.ema(close, length);
  const ema2 = taCore.ema(ema1, length);
  const dema = ema1.map((v, i) => 2 * v - ema2[i]);
  
  // TEMA - Triple EMA
  const ema1_t = taCore.ema(close, length);
  const ema2_t = taCore.ema(ema1_t, length);
  const ema3_t = taCore.ema(ema2_t, length);
  const tema = ema1_t.map((v, i) => 3 * (v - ema2_t[i]) + ema3_t[i]);
  
  // HMA - Hull Moving Average
  const hmaHalf = taCore.wma(close, Math.floor(length / 2));
  const hmaFull = taCore.wma(close, length);
  const hmaSource = hmaHalf.map((v, i) => 2 * v - hmaFull[i]);
  const hma = taCore.wma(hmaSource, Math.round(Math.sqrt(length)));
  
  // LSMA - Linear Regression
  const lsma = taCore.linreg(close, length, 0);
  
  // McGinley Dynamic
  const mcginley: number[] = [];
  const emaInit = taCore.ema(close, length);
  for (let i = 0; i < close.length; i++) {
    if (i === 0 || !mcginley[i - 1]) {
      mcginley[i] = emaInit[i];
    } else {
      const prevMg = mcginley[i - 1];
      const currentClose = close[i];
      if (prevMg && currentClose && prevMg > 0) {
        const ratio = currentClose / prevMg;
        mcginley[i] = prevMg + (currentClose - prevMg) / (length * Math.pow(ratio, 4));
      } else {
        mcginley[i] = emaInit[i];
      }
    }
  }
  
  // ALMA
  const alma = taCore.alma(close, length, 0.85, 6);
  
  // SuperTrend
  const atr = taCore.atr(high, low, close, length);
  const supertrend_factor = 3.0;
  const upperBand = hl2.map((v, i) => v + supertrend_factor * atr[i]);
  const lowerBand = hl2.map((v, i) => v - supertrend_factor * atr[i]);
  
  const supertrend: number[] = [];
  let direction = 1;
  
  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      supertrend[i] = lowerBand[i];
      direction = 1;
    } else {
      const prevSupertrend = supertrend[i - 1] || lowerBand[i];
      
      if (direction === 1) {
        supertrend[i] = Math.max(lowerBand[i], prevSupertrend);
      } else {
        supertrend[i] = Math.min(upperBand[i], prevSupertrend);
      }
      
      if (close[i] > supertrend[i]) {
        direction = 1;
      } else if (close[i] < supertrend[i]) {
        direction = -1;
      }
    }
  }
  
  // Bollinger Bands
  const bbBasis = taCore.sma(close, length);
  const bbStdev = taCore.stdev(close, length);
  const bbUpper = bbBasis.map((v, i) => v + 2.0 * bbStdev[i]);
  const bbLower = bbBasis.map((v, i) => v - 2.0 * bbStdev[i]);
  
  return {
    SMA: sma,
    EMA: ema,
    WMA: wma,
    VWMA: vwma,
    RMA: rma,
    DEMA: dema,
    TEMA: tema,
    HMA: hma,
    LSMA: lsma,
    McGinley: mcginley,
    ALMA: alma,
    SuperTrend: supertrend,
    'BB Basis': bbBasis,
    'BB Upper': bbUpper,
    'BB Lower': bbLower,
  };
}

/**
 * Calculate non-overlay indicators matching pine-nonoverlay.pine
 */
export function calculateNonOverlayIndicators(
  bars: Bar[],
  length: number = 14,
  fastLength: number = 12,
  slowLength: number = 26,
  signalLength: number = 9
) {
  const { close, high, low, volume, hl2, hlc3 } = extractArrays(bars);
  
  // RSI
  const rsi = taCore.rsi(close, length);
  
  // Stochastic %K
  const stochK = taCore.stoch(close, high, low, length);
  
  // MACD
  const [macd, signal, hist] = taCore.macd(close, fastLength, slowLength, signalLength);
  
  // CCI
  const cci = taCore.cci(hlc3, high, low, length);
  
  // Awesome Oscillator
  const ao5 = taCore.sma(hl2, 5);
  const ao34 = taCore.sma(hl2, 34);
  const ao = ao5.map((v, i) => v - ao34[i]);
  
  // Accelerator Oscillator
  const aoSma = taCore.sma(ao, 5);
  const ac = ao.map((v, i) => v - aoSma[i]);
  
  // Ultimate Oscillator
  const bp: number[] = [];
  const tr_uo: number[] = [];
  
  for (let i = 0; i < bars.length; i++) {
    const currentClose = close[i];
    const currentLow = low[i];
    const currentHigh = high[i];
    const prevClose = i > 0 ? close[i - 1] : currentClose;
    
    bp[i] = currentClose - Math.min(currentLow, prevClose);
    tr_uo[i] = Math.max(currentHigh, prevClose) - Math.min(currentLow, prevClose);
  }
  
  const bp7 = taCore.sma(bp, 7);
  const tr7 = taCore.sma(tr_uo, 7);
  const bp14 = taCore.sma(bp, 14);
  const tr14 = taCore.sma(tr_uo, 14);
  const bp28 = taCore.sma(bp, 28);
  const tr28 = taCore.sma(tr_uo, 28);
  
  const avg7 = bp7.map((v, i) => tr7[i] !== 0 ? v / tr7[i] : 0);
  const avg14 = bp14.map((v, i) => tr14[i] !== 0 ? v / tr14[i] : 0);
  const avg28 = bp28.map((v, i) => tr28[i] !== 0 ? v / tr28[i] : 0);
  const uo = avg7.map((v7, i) => 100 * (4 * v7 + 2 * avg14[i] + avg28[i]) / 7);
  
  // DMI
  const [diPlus, diMinus, adx] = taCore.dmi(high, low, close, length, length);
  
  // Aroon Down
  const aroonDown: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < length) {
      aroonDown[i] = NaN;
    } else {
      let lowestIndex = i;
      let lowestValue = low[i];
      
      for (let j = i; j > i - length - 1 && j >= 0; j--) {
        if (low[j] <= lowestValue) {
          lowestValue = low[j];
          lowestIndex = j;
        }
      }
      
      aroonDown[i] = 100 * (i - lowestIndex) / length;
    }
  }
  
  // Standard Deviation
  const stdev = taCore.stdev(close, length);
  
  // Historical Volatility
  const logReturns: number[] = [NaN];
  for (let i = 1; i < bars.length; i++) {
    if (close[i] && close[i - 1] && close[i - 1] > 0) {
      logReturns[i] = Math.log(close[i] / close[i - 1]);
    } else {
      logReturns[i] = NaN;
    }
  }
  const logReturnStdev = taCore.stdev(logReturns, length);
  const histVol = logReturnStdev.map(v => v * Math.sqrt(252) * 100);
  
  // Accumulation/Distribution
  const ad: number[] = [];
  let cumSum = 0;
  for (let i = 0; i < bars.length; i++) {
    const h = high[i];
    const l = low[i];
    const c = close[i];
    const v = volume[i];
    
    if (h !== l) {
      const mfm = ((c - l) - (h - c)) / (h - l);
      cumSum += mfm * v;
    }
    ad[i] = cumSum;
  }
  
  // CMF - Chaikin Money Flow
  const mfv: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const h = high[i];
    const l = low[i];
    const c = close[i];
    const v = volume[i];
    
    if (h !== l) {
      mfv[i] = ((c - l) - (h - c)) / (h - l) * v;
    } else {
      mfv[i] = 0;
    }
  }
  const mfvSum = taCore.sma(mfv, length);
  const volumeSum = taCore.sma(volume, length);
  const cmf = mfvSum.map((v, i) => volumeSum[i] !== 0 ? v / volumeSum[i] : 0);
  
  // Force Index
  const forceIndex: number[] = [NaN];
  for (let i = 1; i < bars.length; i++) {
    forceIndex[i] = (close[i] - close[i - 1]) * volume[i];
  }
  const forceIndexEma = taCore.ema(forceIndex, length);
  
  // Coppock Curve
  const roc1 = taCore.roc(close, 14);
  const roc2 = taCore.roc(close, 11);
  const rocSum = roc1.map((v, i) => v + roc2[i]);
  const coppock = taCore.wma(rocSum, 10);
  
  // TRIX
  const ema1 = taCore.ema(close, length);
  const ema2 = taCore.ema(ema1, length);
  const ema3 = taCore.ema(ema2, length);
  const trix: number[] = [NaN];
  for (let i = 1; i < bars.length; i++) {
    if (ema3[i] && ema3[i - 1] && ema3[i - 1] !== 0) {
      trix[i] = 100 * (ema3[i] - ema3[i - 1]) / ema3[i - 1];
    } else {
      trix[i] = NaN;
    }
  }
  
  return {
    RSI: rsi,
    'Stoch %K': stochK,
    MACD: macd,
    CCI: cci,
    'Accelerator Osc': ac,
    'Ultimate Osc': uo,
    'DI-': diMinus,
    'Aroon Down': aroonDown,
    StdDev: stdev,
    'Hist Vol': histVol,
    'A/D': ad,
    CMF: cmf,
    'Force Index': forceIndexEma,
    Coppock: coppock,
    TRIX: trix,
  };
}
