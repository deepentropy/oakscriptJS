/**
 * Basic Indicators Example
 * Demonstrates how to use common technical indicators
 */

import { ta, math } from '../src';

// Sample price data (close prices)
const closePrices = [
  100, 102, 101, 103, 105, 104, 106, 108, 107, 109,
  111, 110, 112, 114, 113, 115, 117, 116, 118, 120,
];

console.log('=== Basic Indicators Example ===\n');

// Simple Moving Average (SMA)
console.log('1. Simple Moving Average (SMA)');
const sma5 = ta.sma(closePrices, 5);
console.log('SMA(5) last 5 values:', sma5.slice(-5));
console.log('Current SMA(5):', sma5[sma5.length - 1]);
console.log();

// Exponential Moving Average (EMA)
console.log('2. Exponential Moving Average (EMA)');
const ema5 = ta.ema(closePrices, 5);
console.log('EMA(5) last 5 values:', ema5.slice(-5));
console.log('Current EMA(5):', ema5[ema5.length - 1]);
console.log();

// Relative Strength Index (RSI)
console.log('3. Relative Strength Index (RSI)');
const rsi14 = ta.rsi(closePrices, 14);
console.log('RSI(14) last 5 values:', rsi14.slice(-5));
console.log('Current RSI(14):', rsi14[rsi14.length - 1]);
console.log();

// MACD
console.log('4. MACD (Moving Average Convergence Divergence)');
const [macdLine, signalLine, histogram] = ta.macd(closePrices, 12, 26, 9);
console.log('MACD Line (last):', macdLine[macdLine.length - 1]);
console.log('Signal Line (last):', signalLine[signalLine.length - 1]);
console.log('Histogram (last):', histogram[histogram.length - 1]);
console.log();

// Bollinger Bands
console.log('5. Bollinger Bands');
const [basis, upper, lower] = ta.bb(closePrices, 20, 2);
console.log('Basis (last):', basis[basis.length - 1]);
console.log('Upper Band (last):', upper[upper.length - 1]);
console.log('Lower Band (last):', lower[lower.length - 1]);
console.log();

// Standard Deviation
console.log('6. Standard Deviation');
const stdev = ta.stdev(closePrices, 10);
console.log('StDev(10) last value:', stdev[stdev.length - 1]);
console.log();

// Crossover Detection
console.log('7. Crossover Detection');
const sma10 = ta.sma(closePrices, 10);
const sma20 = ta.sma(closePrices, 20);
const crossovers = ta.crossover(sma10, sma20);
const crossunders = ta.crossunder(sma10, sma20);

console.log('SMA(10) crosses over SMA(20):', crossovers.some(Boolean));
console.log('SMA(10) crosses under SMA(20):', crossunders.some(Boolean));
console.log();

// Math functions
console.log('8. Math Functions');
console.log('Max of last 5 prices:', math.max(...closePrices.slice(-5)));
console.log('Min of last 5 prices:', math.min(...closePrices.slice(-5)));
console.log('Average of last 5 prices:', math.avg(...closePrices.slice(-5)));
console.log('Square root of 100:', math.sqrt(100));
console.log();

console.log('=== End of Example ===');
