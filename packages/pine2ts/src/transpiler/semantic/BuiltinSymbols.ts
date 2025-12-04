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
        { type: PineTypes.int() },
        { type: PineTypes.series(PineTypes.float()) }
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
        { name: 'linewidth', type: PineTypes.int(), optional: true }
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
        { name: 'overlay', type: PineTypes.bool(), optional: true }
      ],
      PineTypes.void()
    ),
    isConst: true,
    isSeries: false,
    isReassignable: false,
  },
];
