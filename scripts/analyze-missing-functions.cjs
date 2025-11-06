#!/usr/bin/env node

const fs = require('fs');

// Functions found in official indicators
const indicatorFunctions = `array.avg
array.copy
array.from
array.get
array.join
array.pop
array.push
array.remove
array.set
array.size
array.unshift
color.from_gradient
color.new
color.rgb
math.abs
math.acos
math.atan
math.avg
math.ceil
math.floor
math.log
math.max
math.min
math.pow
math.round
math.sign
math.sin
math.sqrt
math.sum
math.toradians
str.contains
str.format
str.format_time
str.replace_all
str.split
str.tonumber
str.tostring
str.upper
ta.alma
ta.atr
ta.barssince
ta.bb
ta.cci
ta.change
ta.correlation
ta.cross
ta.crossover
ta.crossunder
ta.cum
ta.dev
ta.ema
ta.highest
ta.highestbars
ta.linreg
ta.lowest
ta.lowestbars
ta.mfi
ta.percentile_nearest_rank
ta.percentrank
ta.pivot_point_levels
ta.pivothigh
ta.pivotlow
ta.rci
ta.rma
ta.roc
ta.rsi
ta.sar
ta.sma
ta.stdev
ta.stoch
ta.supertrend
ta.swma
ta.tr
ta.tsi
ta.valuewhen
ta.vwap
ta.vwma
ta.wma`.split('\n');

// Supported namespaces in oakscriptjs
const supportedNamespaces = ['ta', 'math', 'array', 'str', 'color', 'time'];

// Out of scope namespaces
const outOfScope = ['input', 'request', 'ticker', 'strategy', 'indicator'];

// Categorize
const byNamespace = {};
const outOfScopeFunctions = [];

indicatorFunctions.forEach(func => {
  const [namespace, name] = func.split('.');

  if (outOfScope.includes(namespace)) {
    outOfScopeFunctions.push(func);
  } else if (supportedNamespaces.includes(namespace)) {
    if (!byNamespace[namespace]) byNamespace[namespace] = [];
    byNamespace[namespace].push(name);
  }
});

console.log('=== FUNCTIONS USED IN OFFICIAL INDICATORS ===\n');

console.log('📦 SUPPORTED NAMESPACES (oakscriptjs scope):');
Object.keys(byNamespace).sort().forEach(ns => {
  console.log(`\n${ns.toUpperCase()} (${byNamespace[ns].length} functions):`);
  byNamespace[ns].sort().forEach(f => console.log(`  - ${ns}.${f}()`));
});

console.log('\n\n❌ OUT OF SCOPE NAMESPACES (not implemented):');
console.log(`\nThese ${outOfScopeFunctions.length} functions are from namespaces we don't support:`);
outOfScope.forEach(ns => {
  const funcs = outOfScopeFunctions.filter(f => f.startsWith(ns + '.'));
  if (funcs.length > 0) {
    console.log(`\n${ns.toUpperCase()} (${funcs.length} functions):`);
    funcs.forEach(f => console.log(`  - ${f}()`));
  }
});
