/**
 * Function name mapping utilities for PineScript to TypeScript
 */

/**
 * Translate PineScript function names to TypeScript equivalents
 */
export function translateFunctionName(name: string): string {
  // PineScript namespace mapping
  const mappings: Record<string, string> = {
    'sma': 'ta.sma',
    'ema': 'ta.ema',
    'rsi': 'ta.rsi',
    'macd': 'ta.macd',
    'bb': 'ta.bb',
    'atr': 'ta.atr',
    'stoch': 'ta.stoch',
    'wma': 'ta.wma',
    'vwma': 'ta.vwma',
    'crossover': 'ta.crossover',
    'crossunder': 'ta.crossunder',
    'highest': 'ta.highest',
    'lowest': 'ta.lowest',
    'sum': 'math.sum',
    'abs': 'math.abs',
    'round': 'math.round',
    'ceil': 'math.ceil',
    'floor': 'math.floor',
    'max': 'math.max',
    'min': 'math.min',
    'sqrt': 'math.sqrt',
    'pow': 'math.pow',
    'log': 'math.log',
    'exp': 'math.exp',
  };

  if (mappings[name]) {
    return mappings[name];
  }

  return name;
}
