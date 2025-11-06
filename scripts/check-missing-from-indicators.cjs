#!/usr/bin/env node

const fs = require('fs');

// Functions used in official indicators (from our analysis)
const usedFunctions = {
  array: ['avg', 'copy', 'from', 'get', 'join', 'pop', 'push', 'remove', 'set', 'size', 'unshift'],
  color: ['from_gradient', 'new', 'rgb'],
  math: ['abs', 'acos', 'atan', 'avg', 'ceil', 'floor', 'log', 'max', 'min', 'pow', 'round', 'sign', 'sin', 'sqrt', 'sum', 'toradians'],
  str: ['contains', 'format', 'format_time', 'replace_all', 'split', 'tonumber', 'tostring', 'upper'],
  ta: ['alma', 'atr', 'barssince', 'bb', 'cci', 'change', 'correlation', 'cross', 'crossover', 'crossunder', 'cum', 'dev', 'ema', 'highest', 'highestbars', 'linreg', 'lowest', 'lowestbars', 'mfi', 'percentile_nearest_rank', 'percentrank', 'pivot_point_levels', 'pivothigh', 'pivotlow', 'rci', 'rma', 'roc', 'rsi', 'sar', 'sma', 'stdev', 'stoch', 'supertrend', 'swma', 'tr', 'tsi', 'valuewhen', 'vwap', 'vwma', 'wma']
};

// Functions we have implemented (from INVENTORY.md - marking as implemented)
const implemented = {
  array: ['abs', 'avg', 'binary_search', 'binary_search_leftmost', 'binary_search_rightmost', 'clear', 'concat', 'copy', 'covariance', 'every', 'fill', 'first', 'from', 'get', 'includes', 'indexof', 'insert', 'join', 'last', 'lastindexof', 'max', 'median', 'min', 'mode', 'new_array', 'new_bool', 'new_color', 'new_float', 'new_int', 'new_string', 'newtype', 'percentile_linear_interpolation', 'percentile_nearest_rank', 'percentrank', 'pop', 'push', 'range', 'remove', 'reverse', 'set', 'shift', 'size', 'slice', 'some', 'sort', 'sort_indices', 'standardize', 'stdev', 'sum', 'unshift', 'variance'],
  color: ['b', 'from_gradient', 'from_hex', 'g', 'new_color', 'r', 'rgb', 't'],
  math: ['abs', 'acos', 'asin', 'atan', 'avg', 'ceil', 'cos', 'exp', 'floor', 'log', 'log10', 'max', 'min', 'pow', 'random', 'round', 'round_to_mintick', 'sign', 'sin', 'sqrt', 'sum', 'tan', 'todegrees', 'toradians'],
  str: ['charAt', 'concat', 'contains', 'endswith', 'format', 'length', 'lower', 'match', 'pos', 'replace', 'split', 'startswith', 'substring', 'tonumber', 'tostring', 'trim', 'trimLeft', 'trimRight', 'upper'],
  ta: ['alma', 'atr', 'barssince', 'bb', 'bbw', 'cci', 'change', 'cmo', 'cog', 'correlation', 'cross', 'crossover', 'crossunder', 'cum', 'dev', 'dmi', 'ema', 'falling', 'highest', 'highestbars', 'hma', 'kc', 'kcw', 'linreg', 'lowest', 'lowestbars', 'macd', 'max', 'median', 'mfi', 'min', 'mode', 'mom', 'percentile_linear_interpolation', 'percentile_nearest_rank', 'percentrank', 'pivot_point_levels', 'pivothigh', 'pivotlow', 'range', 'rci', 'rising', 'rma', 'roc', 'rsi', 'sar', 'sma', 'stdev', 'stoch', 'supertrend', 'swma', 'tr', 'tsi', 'valuewhen', 'variance', 'vwap', 'vwma', 'wma', 'wpr']
};

console.log('=== MISSING FUNCTIONS ANALYSIS ===\n');
console.log('Functions used in official indicators but NOT YET implemented:\n');

let totalMissing = 0;

Object.keys(usedFunctions).sort().forEach(ns => {
  const used = usedFunctions[ns];
  const impl = implemented[ns] || [];
  const missing = used.filter(f => !impl.includes(f));

  if (missing.length > 0) {
    console.log(`\n${ns.toUpperCase()} - ${missing.length} missing:`);
    missing.forEach(f => {
      console.log(`  ❌ ${ns}.${f}()`);
      totalMissing++;
    });
  } else {
    console.log(`\n${ns.toUpperCase()} - ✅ All ${used.length} functions implemented!`);
  }
});

console.log(`\n\n=== SUMMARY ===`);
console.log(`Total missing functions: ${totalMissing}`);

if (totalMissing === 0) {
  console.log('\n🎉 ALL FUNCTIONS USED IN OFFICIAL INDICATORS ARE IMPLEMENTED!');
} else {
  console.log(`\n⚠️  ${totalMissing} functions need to be implemented for full indicator support.`);
}
