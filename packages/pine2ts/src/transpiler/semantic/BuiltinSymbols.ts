/**
 * Built-in PineScript symbols (variables, functions, constants)
 */

import type { Symbol } from './SymbolTable.js';
import { PineTypes } from './PineTypes.js';

/**
 * Built-in PineScript variables that are always available
 */
export const BUILTIN_VARIABLES: Omit<Symbol, 'scope' | 'declaredAt'>[] = [
  // Price data (Series)
  {
    name: 'open',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'high',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'low',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'close',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'volume',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  
  // Calculated price sources (Series)
  {
    name: 'hl2',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'hlc3',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'ohlc4',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'hlcc4',
    kind: 'variable',
    type: PineTypes.series(PineTypes.float()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  
  // Bar index (Series)
  {
    name: 'bar_index',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  
  // Time variables (Series)
  {
    name: 'time',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'year',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'month',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'weekofyear',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'dayofmonth',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'dayofweek',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'hour',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'minute',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  {
    name: 'second',
    kind: 'variable',
    type: PineTypes.series(PineTypes.int()),
    isConst: true,
    isSeries: true,
    isReassignable: false,
  },
  
  // NA constant
  {
    name: 'na',
    kind: 'variable',
    type: PineTypes.na(),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // Boolean constants
  {
    name: 'true',
    kind: 'variable',
    type: PineTypes.bool(),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'false',
    kind: 'variable',
    type: PineTypes.bool(),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
];

/**
 * Built-in PineScript functions
 * This is a subset - we'll expand this as needed
 */
export const BUILTIN_FUNCTIONS: Omit<Symbol, 'scope' | 'declaredAt'>[] = [
  // Technical analysis functions
  {
    name: 'ta.sma',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'ta.ema',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'ta.rsi',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'ta.vwma',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // Math functions
  {
    name: 'math.max',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() },
        { type: PineTypes.float() }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'math.min',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() },
        { type: PineTypes.float() }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // Display functions (we track these to check arity, even though they're skipped in codegen)
  {
    name: 'plot',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { name: 'title', type: PineTypes.string(), optional: true },
        { name: 'color', type: PineTypes.color(), optional: true },
        { name: 'linewidth', type: PineTypes.int(), optional: true },
        { name: 'style', type: PineTypes.int(), optional: true },
        { name: 'trackprice', type: PineTypes.bool(), optional: true },
        { name: 'histbase', type: PineTypes.float(), optional: true },
        { name: 'offset', type: PineTypes.int(), optional: true },
        { name: 'join', type: PineTypes.bool(), optional: true },
        { name: 'editable', type: PineTypes.bool(), optional: true },
        { name: 'show_last', type: PineTypes.int(), optional: true },
        { name: 'display', type: PineTypes.int(), optional: true },
        { name: 'force_overlay', type: PineTypes.bool(), optional: true },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'indicator',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.string() },
        { name: 'shorttitle', type: PineTypes.string(), optional: true },
        { name: 'overlay', type: PineTypes.bool(), optional: true },
        { name: 'format', type: PineTypes.string(), optional: true },
        { name: 'precision', type: PineTypes.int(), optional: true },
        { name: 'scale', type: PineTypes.int(), optional: true },
        { name: 'max_bars_back', type: PineTypes.int(), optional: true },
        { name: 'timeframe', type: PineTypes.string(), optional: true },
        { name: 'timeframe_gaps', type: PineTypes.bool(), optional: true },
        { name: 'explicit_plot_zorder', type: PineTypes.bool(), optional: true },
        { name: 'max_lines_count', type: PineTypes.int(), optional: true },
        { name: 'max_labels_count', type: PineTypes.int(), optional: true },
        { name: 'max_boxes_count', type: PineTypes.int(), optional: true },
        { name: 'max_polylines_count', type: PineTypes.int(), optional: true },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // Additional commonly used technical analysis functions
  {
    name: 'ta.wma',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'ta.highest',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'ta.lowest',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'ta.stdev',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'ta.atr',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.int() }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // Additional math functions
  {
    name: 'math.abs',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'math.round',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() },
        { type: PineTypes.int(), optional: true }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'math.floor',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'math.ceil',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'math.sqrt',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'math.pow',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() },
        { type: PineTypes.float() }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'math.log',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() }
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // Utility functions
  {
    name: 'nz',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.float(), optional: true }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'na',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) }
      ],
      PineTypes.bool()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'fixnan',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) }
      ],
      PineTypes.series(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // Additional display functions
  {
    name: 'hline',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() },
        { name: 'title', type: PineTypes.string(), optional: true },
        { name: 'color', type: PineTypes.color(), optional: true },
        { name: 'linestyle', type: PineTypes.int(), optional: true },
        { name: 'linewidth', type: PineTypes.int(), optional: true },
        { name: 'editable', type: PineTypes.bool(), optional: true },
        { name: 'display', type: PineTypes.int(), optional: true },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'plotshape',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.bool()) },
        { name: 'title', type: PineTypes.string(), optional: true },
        { name: 'style', type: PineTypes.string(), optional: true },
        { name: 'location', type: PineTypes.string(), optional: true },
        { name: 'color', type: PineTypes.color(), optional: true },
        { name: 'offset', type: PineTypes.int(), optional: true },
        { name: 'text', type: PineTypes.string(), optional: true },
        { name: 'textcolor', type: PineTypes.color(), optional: true },
        { name: 'editable', type: PineTypes.bool(), optional: true },
        { name: 'size', type: PineTypes.string(), optional: true },
        { name: 'show_last', type: PineTypes.int(), optional: true },
        { name: 'display', type: PineTypes.int(), optional: true },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'plotchar',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.bool()) },
        { name: 'char', type: PineTypes.string(), optional: true },
        { name: 'location', type: PineTypes.string(), optional: true },
        { name: 'color', type: PineTypes.color(), optional: true },
        { name: 'offset', type: PineTypes.int(), optional: true },
        { name: 'text', type: PineTypes.string(), optional: true },
        { name: 'textcolor', type: PineTypes.color(), optional: true },
        { name: 'editable', type: PineTypes.bool(), optional: true },
        { name: 'size', type: PineTypes.string(), optional: true },
        { name: 'show_last', type: PineTypes.int(), optional: true },
        { name: 'display', type: PineTypes.int(), optional: true },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'bgcolor',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.color() },
        { name: 'offset', type: PineTypes.int(), optional: true },
        { name: 'editable', type: PineTypes.bool(), optional: true },
        { name: 'show_last', type: PineTypes.int(), optional: true },
        { name: 'title', type: PineTypes.string(), optional: true },
        { name: 'display', type: PineTypes.int(), optional: true },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'fill',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.series(PineTypes.float()) },
        { type: PineTypes.series(PineTypes.float()) },
        { name: 'color', type: PineTypes.color(), optional: true },
        { name: 'title', type: PineTypes.string(), optional: true },
        { name: 'editable', type: PineTypes.bool(), optional: true },
        { name: 'show_last', type: PineTypes.int(), optional: true },
        { name: 'fillgaps', type: PineTypes.bool(), optional: true },
        { name: 'display', type: PineTypes.int(), optional: true },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'alertcondition',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.bool() },
        { name: 'title', type: PineTypes.string(), optional: true },
        { name: 'message', type: PineTypes.string(), optional: true },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // String functions
  {
    name: 'str.tostring',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.float() },
        { name: 'format', type: PineTypes.string(), optional: true },
      ],
      PineTypes.string()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  
  // Array functions
  {
    name: 'array.new_float',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.int(), optional: true },
        { type: PineTypes.float(), optional: true },
      ],
      PineTypes.array(PineTypes.float())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'array.new_int',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.int(), optional: true },
        { type: PineTypes.int(), optional: true },
      ],
      PineTypes.array(PineTypes.int())
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'array.push',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.array(PineTypes.float()) },
        { type: PineTypes.float() },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'array.get',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.array(PineTypes.float()) },
        { type: PineTypes.int() },
      ],
      PineTypes.float()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'array.set',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.array(PineTypes.float()) },
        { type: PineTypes.int() },
        { type: PineTypes.float() },
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
  {
    name: 'array.size',
    kind: 'function',
    type: PineTypes.function(
      [
        { type: PineTypes.array(PineTypes.float()) },
      ],
      PineTypes.int()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
];
