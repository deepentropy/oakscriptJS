#!/usr/bin/env node

const fs = require('fs');

// All functions extracted from indicators with their usage counts
const allFunctionsRaw = `163 input.int
111 color.new
55 ta.ema
55 input.string
52 ta.sma
46 strategy.entry
43 input.bool
41 input.float
30 input.color
25 runtime.error
22 ta.rma
21 str.tostring
21 request.security
19 ta.change
17 math.abs
17 line.new
16 strategy.cancel
16 color.rgb
15 ta.wma
15 math.sum
15 input.timeframe
14 timeframe.change
14 ta.stdev
14 math.sin
14 math.avg
13 math.min
12 ta.valuewhen
12 ta.lowest
12 ta.highest
12 math.floor
11 ta.crossunder
11 ta.crossover
11 math.max
11 array.size
10 ta.vwma
10 ta.atr
10 math.pow
10 array.from
9 timeframes.get
9 linefill.new
8 label.new
8 input.source
8 box.new
7 timeframe.in_seconds
7 math.sqrt
7 enabled.get
6 ta.cum
6 math.toradians
5 table.new
5 ta.rsi
5 ta.pivotlow
5 ta.pivothigh
5 str.format
5 point.from_index
5 color.from_gradient
4 ta.roc
4 ta.rci
4 strategy.order
4 line.delete
4 array.push
4 array.get
3 ta.tr
3 ta.swma
3 ta.stoch
3 strategy.exit
3 str.contains
3 point.copy
3 math.round
3 math.log
3 la.set_text
3 input.text_area
3 input.session
3 boxes.last
3 array.pop
2 ta.tsi
2 ta.supertrend
2 ta.pivot_point_levels
2 ta.correlation
2 ta.cci
2 ta.bb
2 ta.barssince
2 t.cell
2 str.upper
2 str.replace_all
2 pivots.get
2 math.sign
2 math.ceil
2 line.set_second_point
2 line.set_first_point
2 line.get_price
2 label.set_xy
2 label.set_textcolor
2 label.set_text
2 bx.set_border_color
2 bx.set_bgcolor
2 array.set
2 array.copy
1 ticker.standard
1 ticker.modify
1 ticker.inherit
1 ticker.heikinashi
1 table.cell
1 ta.vwap
1 ta.sar
1 ta.percentrank
1 ta.percentile_nearest_rank
1 ta.mfi
1 ta.lowestbars
1 ta.linreg
1 ta.highestbars
1 ta.dev
1 ta.cross
1 ta.alma
1 symbols.set
1 symbols.insert
1 symbols.includes
1 str.tonumber
1 str.split
1 str.format_time
1 risk.max_intraday_loss
1 risk.max_intraday_filled_orders
1 risk.allow_entry_in
1 request.splits
1 request.earnings
1 request.dividends
1 request.currency_rate
1 point.from_time
1 pivots.size
1 math.atan
1 math.acos
1 label.delete
1 la.get_text
1 input.symbol
1 input.enum
1 info.update
1 graphic.delete
1 enabled.set
1 bx.set_top
1 bx.set_right
1 bx.set_left
1 bx.set_bottom
1 boxes.push
1 array.unshift
1 array.remove
1 array.join
1 array.avg
1 _line.delete
1 _label.delete
1 _box.delete`;

// Parse the data
const functions = allFunctionsRaw.split('\n').map(line => {
  const match = line.trim().match(/^(\d+)\s+(.+)$/);
  if (!match) return null;
  const count = parseInt(match[1]);
  const funcName = match[2];
  const [namespace, name] = funcName.split('.');
  return { namespace, name, funcName, count };
}).filter(Boolean);

// Categorize by namespace
const byNamespace = {};
functions.forEach(f => {
  if (!byNamespace[f.namespace]) {
    byNamespace[f.namespace] = [];
  }
  byNamespace[f.namespace].push(f);
});

// Calculate totals
const namespaceTotals = {};
Object.keys(byNamespace).forEach(ns => {
  namespaceTotals[ns] = {
    count: byNamespace[ns].length,
    totalUsage: byNamespace[ns].reduce((sum, f) => sum + f.count, 0)
  };
});

// Define namespace categories
const categories = {
  'Calculation & Analysis': ['ta', 'math', 'array', 'matrix'],
  'Data & Text': ['str', 'color', 'time'],
  'Data Fetching': ['request', 'ticker'],
  'UI & Input': ['input', 'indicator'],
  'Strategy & Risk': ['strategy', 'risk'],
  'Drawing & Graphics': ['line', 'label', 'box', 'table', 'linefill', 'graphic'],
  'Utility & Internal': ['runtime', 'timeframe', 'timeframes', 'point', 'pivots', 'symbols', 'enabled', 'info', 'boxes', 'la', 'bx', 't'],
  'Unknown/Special': ['_line', '_label', '_box']
};

// Supported in oakscriptjs
const oakscriptSupported = ['ta', 'math', 'array', 'str', 'color', 'time', 'matrix'];

console.log('═══════════════════════════════════════════════════════════════');
console.log('  COMPLETE FUNCTION USAGE ANALYSIS - OFFICIAL PINESCRIPT INDICATORS');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Total unique functions found: ${functions.length}`);
console.log(`Total function calls: ${functions.reduce((sum, f) => sum + f.count, 0)}`);
console.log(`Namespaces found: ${Object.keys(byNamespace).length}\n`);

// Print by category
Object.keys(categories).forEach(category => {
  const nsInCategory = categories[category];
  const relevantNs = nsInCategory.filter(ns => byNamespace[ns]);

  if (relevantNs.length === 0) return;

  console.log(`\n${'='.repeat(70)}`);
  console.log(`${category.toUpperCase()}`);
  console.log(`${'='.repeat(70)}\n`);

  relevantNs.forEach(ns => {
    const isSupported = oakscriptSupported.includes(ns);
    const marker = isSupported ? '✅' : '❌';
    const status = isSupported ? 'SUPPORTED' : 'OUT OF SCOPE';

    console.log(`${marker} ${ns.toUpperCase()} - ${status}`);
    console.log(`   Functions: ${namespaceTotals[ns].count} | Total Usage: ${namespaceTotals[ns].totalUsage} calls\n`);

    // Sort by usage count
    const sorted = [...byNamespace[ns]].sort((a, b) => b.count - a.count);

    sorted.forEach(f => {
      const usageBar = '█'.repeat(Math.ceil(f.count / 5));
      console.log(`   ${f.count.toString().padStart(4)} × ${f.funcName.padEnd(35)} ${usageBar}`);
    });
    console.log('');
  });
});

// Summary by support status
console.log(`\n${'='.repeat(70)}`);
console.log('SUMMARY BY OAKSCRIPTJS SUPPORT');
console.log(`${'='.repeat(70)}\n`);

const supported = functions.filter(f => oakscriptSupported.includes(f.namespace));
const notSupported = functions.filter(f => !oakscriptSupported.includes(f.namespace));

const supportedUsage = supported.reduce((sum, f) => sum + f.count, 0);
const notSupportedUsage = notSupported.reduce((sum, f) => sum + f.count, 0);
const totalUsage = supportedUsage + notSupportedUsage;

console.log(`✅ SUPPORTED NAMESPACES (calculation/data functions):`);
console.log(`   Functions: ${supported.length} (${((supported.length / functions.length) * 100).toFixed(1)}%)`);
console.log(`   Usage: ${supportedUsage} calls (${((supportedUsage / totalUsage) * 100).toFixed(1)}%)`);
console.log(`   Namespaces: ${oakscriptSupported.join(', ')}\n`);

console.log(`❌ OUT OF SCOPE (UI/strategy/infrastructure):`);
console.log(`   Functions: ${notSupported.length} (${((notSupported.length / functions.length) * 100).toFixed(1)}%)`);
console.log(`   Usage: ${notSupportedUsage} calls (${((notSupportedUsage / totalUsage) * 100).toFixed(1)}%)`);

const outOfScopeNs = [...new Set(notSupported.map(f => f.namespace))];
console.log(`   Namespaces: ${outOfScopeNs.join(', ')}\n`);

// Top 20 most used functions
console.log(`\n${'='.repeat(70)}`);
console.log('TOP 20 MOST USED FUNCTIONS');
console.log(`${'='.repeat(70)}\n`);

const top20 = [...functions].sort((a, b) => b.count - a.count).slice(0, 20);
top20.forEach((f, i) => {
  const marker = oakscriptSupported.includes(f.namespace) ? '✅' : '❌';
  const bar = '█'.repeat(Math.ceil(f.count / 5));
  console.log(`${(i + 1).toString().padStart(2)}. ${marker} ${f.funcName.padEnd(30)} ${f.count.toString().padStart(4)} × ${bar}`);
});

console.log(`\n${'='.repeat(70)}\n`);
