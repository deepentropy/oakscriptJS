/**
 * Trading Strategy Example
 * Demonstrates a simple moving average crossover strategy
 */

import { ta, math } from '../src';

// Sample OHLC data
const data = {
  close: [
    100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
    111, 110, 112, 114, 113, 115, 117, 116, 118, 120,
    119, 121, 123, 122, 124, 126, 125, 127, 129, 128,
  ],
  high: [
    101, 103, 102, 104, 106, 105, 107, 109, 108, 110,
    112, 111, 113, 115, 114, 116, 118, 117, 119, 121,
    120, 122, 124, 123, 125, 127, 126, 128, 130, 129,
  ],
  low: [
    99, 101, 100, 102, 104, 103, 105, 107, 106, 108,
    110, 109, 111, 113, 112, 114, 116, 115, 117, 119,
    118, 120, 122, 121, 123, 125, 124, 126, 128, 127,
  ],
};

console.log('=== Moving Average Crossover Strategy ===\n');

// Strategy Parameters
const fastPeriod = 5;
const slowPeriod = 10;
const rsiPeriod = 14;
const rsiOverbought = 70;
const rsiOversold = 30;

// Calculate indicators
const fastMA = ta.sma(data.close, fastPeriod);
const slowMA = ta.sma(data.close, slowPeriod);
const rsi = ta.rsi(data.close, rsiPeriod);
const atrValue = ta.atr(14, data.high, data.low, data.close);

// Detect crossovers
const bullishCross = ta.crossover(fastMA, slowMA);
const bearishCross = ta.crossunder(fastMA, slowMA);

// Track signals
interface Signal {
  index: number;
  type: 'BUY' | 'SELL';
  price: number;
  fastMA: number;
  slowMA: number;
  rsi: number;
  atr: number;
}

const signals: Signal[] = [];

// Generate signals
for (let i = slowPeriod; i < data.close.length; i++) {
  // Buy signal: fast MA crosses over slow MA and RSI not overbought
  if (bullishCross[i] && rsi[i] < rsiOverbought) {
    signals.push({
      index: i,
      type: 'BUY',
      price: data.close[i],
      fastMA: fastMA[i],
      slowMA: slowMA[i],
      rsi: rsi[i],
      atr: atrValue[i],
    });
  }

  // Sell signal: fast MA crosses under slow MA or RSI overbought
  if (bearishCross[i] || rsi[i] > rsiOverbought) {
    signals.push({
      index: i,
      type: 'SELL',
      price: data.close[i],
      fastMA: fastMA[i],
      slowMA: slowMA[i],
      rsi: rsi[i],
      atr: atrValue[i],
    });
  }
}

// Display signals
console.log('Strategy Configuration:');
console.log(`- Fast MA Period: ${fastPeriod}`);
console.log(`- Slow MA Period: ${slowPeriod}`);
console.log(`- RSI Period: ${rsiPeriod}`);
console.log(`- RSI Overbought: ${rsiOverbought}`);
console.log(`- RSI Oversold: ${rsiOversold}`);
console.log();

console.log('Trading Signals:');
signals.forEach((signal, idx) => {
  console.log(`\nSignal #${idx + 1}:`);
  console.log(`  Type: ${signal.type}`);
  console.log(`  Bar Index: ${signal.index}`);
  console.log(`  Price: ${signal.price.toFixed(2)}`);
  console.log(`  Fast MA: ${signal.fastMA.toFixed(2)}`);
  console.log(`  Slow MA: ${signal.slowMA.toFixed(2)}`);
  console.log(`  RSI: ${signal.rsi.toFixed(2)}`);
  console.log(`  ATR: ${signal.atr.toFixed(2)}`);
});

// Calculate strategy statistics
console.log('\n=== Strategy Statistics ===');
console.log(`Total Signals: ${signals.length}`);
console.log(`Buy Signals: ${signals.filter(s => s.type === 'BUY').length}`);
console.log(`Sell Signals: ${signals.filter(s => s.type === 'SELL').length}`);

// Calculate simple returns (assuming alternating buy/sell)
let position = 0;
let totalReturn = 0;
let trades = 0;

for (const signal of signals) {
  if (signal.type === 'BUY' && position === 0) {
    position = signal.price;
    trades++;
  } else if (signal.type === 'SELL' && position > 0) {
    const returnPct = ((signal.price - position) / position) * 100;
    totalReturn += returnPct;
    console.log(`\nTrade #${trades}: Return = ${returnPct.toFixed(2)}%`);
    position = 0;
  }
}

if (trades > 0) {
  console.log(`\nTotal Return: ${totalReturn.toFixed(2)}%`);
  console.log(`Average Return per Trade: ${(totalReturn / trades).toFixed(2)}%`);
}

console.log('\n=== End of Strategy Example ===');
