/**
 * Custom Indicator Example
 * Demonstrates how to build custom indicators using OakScriptJS
 */

import { ta, math, array } from '../src';
import { series_float, series_bool, simple_int } from '../src/types';

/**
 * Custom Indicator: Triple EMA (TEMA)
 * TEMA = 3 * EMA - 3 * EMA(EMA) + EMA(EMA(EMA))
 */
function tema(source: series_float, length: simple_int): series_float {
  const ema1 = ta.ema(source, length);
  const ema2 = ta.ema(ema1, length);
  const ema3 = ta.ema(ema2, length);

  const result: series_float = [];
  for (let i = 0; i < source.length; i++) {
    result.push(3 * ema1[i] - 3 * ema2[i] + ema3[i]);
  }

  return result;
}

/**
 * Custom Indicator: Momentum
 * Simple price momentum over N periods
 */
function momentum(source: series_float, length: simple_int): series_float {
  return ta.change(source, length);
}

/**
 * Custom Indicator: Rate of Change (ROC)
 * ROC = ((close - close[n]) / close[n]) * 100
 */
function roc(source: series_float, length: simple_int): series_float {
  const result: series_float = [];

  for (let i = 0; i < source.length; i++) {
    if (i < length) {
      result.push(NaN);
    } else {
      const change = source[i] - source[i - length];
      const pct = (change / source[i - length]) * 100;
      result.push(pct);
    }
  }

  return result;
}

/**
 * Custom Indicator: Stochastic Momentum Index (SMI)
 */
function smi(
  high: series_float,
  low: series_float,
  close: series_float,
  kPeriod: simple_int,
  dPeriod: simple_int
): [series_float, series_float] {
  const highestHigh: series_float = [];
  const lowestLow: series_float = [];

  // Calculate highest high and lowest low
  for (let i = 0; i < close.length; i++) {
    if (i < kPeriod - 1) {
      highestHigh.push(NaN);
      lowestLow.push(NaN);
    } else {
      let maxHigh = -Infinity;
      let minLow = Infinity;
      for (let j = 0; j < kPeriod; j++) {
        maxHigh = Math.max(maxHigh, high[i - j]);
        minLow = Math.min(minLow, low[i - j]);
      }
      highestHigh.push(maxHigh);
      lowestLow.push(minLow);
    }
  }

  // Calculate SMI
  const smiValues: series_float = [];
  for (let i = 0; i < close.length; i++) {
    if (isNaN(highestHigh[i])) {
      smiValues.push(NaN);
    } else {
      const hl2 = (highestHigh[i] + lowestLow[i]) / 2;
      const diff = close[i] - hl2;
      const range = highestHigh[i] - lowestLow[i];
      smiValues.push(range !== 0 ? (diff / (range / 2)) * 100 : 0);
    }
  }

  // Calculate signal line (EMA of SMI)
  const signalLine = ta.ema(smiValues, dPeriod);

  return [smiValues, signalLine];
}

// Sample data
const closePrices = [
  100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
  111, 110, 112, 114, 113, 115, 117, 116, 118, 120,
  119, 121, 123, 122, 124, 126, 125, 127, 129, 128,
];

const highPrices = closePrices.map(p => p + 1);
const lowPrices = closePrices.map(p => p - 1);

console.log('=== Custom Indicators Example ===\n');

// 1. Triple EMA
console.log('1. Triple EMA (TEMA)');
const tema9 = tema(closePrices, 9);
console.log('TEMA(9) last 5 values:', tema9.slice(-5).map(v => v.toFixed(2)));
console.log('Current TEMA(9):', tema9[tema9.length - 1].toFixed(2));
console.log();

// 2. Momentum
console.log('2. Momentum');
const mom10 = momentum(closePrices, 10);
console.log('Momentum(10) last 5 values:', mom10.slice(-5).map(v => v.toFixed(2)));
console.log('Current Momentum(10):', mom10[mom10.length - 1].toFixed(2));
console.log();

// 3. Rate of Change
console.log('3. Rate of Change (ROC)');
const roc10 = roc(closePrices, 10);
console.log('ROC(10) last 5 values:', roc10.slice(-5).map(v => v.toFixed(2)));
console.log('Current ROC(10):', roc10[roc10.length - 1].toFixed(2));
console.log();

// 4. Stochastic Momentum Index
console.log('4. Stochastic Momentum Index (SMI)');
const [smiLine, smiSignal] = smi(highPrices, lowPrices, closePrices, 10, 3);
console.log('SMI last 5 values:', smiLine.slice(-5).map(v => v.toFixed(2)));
console.log('SMI Signal last 5 values:', smiSignal.slice(-5).map(v => v.toFixed(2)));
console.log('Current SMI:', smiLine[smiLine.length - 1].toFixed(2));
console.log('Current Signal:', smiSignal[smiSignal.length - 1].toFixed(2));
console.log();

// 5. Combining indicators for signals
console.log('5. Combining Indicators for Trading Signals');
const sma20 = ta.sma(closePrices, 20);
const rsi = ta.rsi(closePrices, 14);
const currentPrice = closePrices[closePrices.length - 1];
const currentSMA = sma20[sma20.length - 1];
const currentRSI = rsi[rsi.length - 1];
const currentMomentum = mom10[mom10.length - 1];

console.log(`Current Price: ${currentPrice}`);
console.log(`SMA(20): ${currentSMA.toFixed(2)}`);
console.log(`RSI(14): ${currentRSI.toFixed(2)}`);
console.log(`Momentum(10): ${currentMomentum.toFixed(2)}`);

const signal =
  currentPrice > currentSMA && currentRSI < 70 && currentMomentum > 0
    ? 'BULLISH'
    : currentPrice < currentSMA && currentRSI > 30 && currentMomentum < 0
    ? 'BEARISH'
    : 'NEUTRAL';

console.log(`Combined Signal: ${signal}`);
console.log();

console.log('=== End of Custom Indicators Example ===');
