/**
 * Candlestick pattern port: public entry point.
 *
 * - 44 individual patterns as PatternDef objects (registry)
 * - patternScript(def) turns one PatternDef into a full script body
 * - allPatternsScript() is the "*All Candlestick Patterns*" composite
 */
export { candleProps, trendInputs, noTrend, type CandleProps, type TrendFlags } from './candle-props';
export { patternScript, emitPattern, type PatternDef, type PatternDirection } from './pattern-runner';
export { ALL_PATTERNS, getPattern } from './registry';
export { allPatternsScript, familyOf } from './all-patterns';
