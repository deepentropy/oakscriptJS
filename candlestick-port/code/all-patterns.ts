/**
 * Port of "_All Candlestick Patterns_.pine": every pattern in one indicator,
 * with the per-family enable toggles, the Pattern Type filter and the three
 * label-color inputs of the original. Pattern detection is reused from the
 * individual PatternDef modules via the registry.
 */
import { indicator, input, color } from '../../src/script';
import { candleProps, trendInputs } from './candle-props';
import { emitPattern, type PatternDef, type PatternDirection } from './pattern-runner';
import { ALL_PATTERNS } from './registry';

/** Family toggle titles and defaults, in the order the Pine script declares them. */
const FAMILY_DEFAULTS: ReadonlyArray<readonly [string, boolean]> = [
  ['Abandoned Baby', true],
  ['Dark Cloud Cover', false],
  ['Doji', true],
  ['Doji Star', false],
  ['Downside Tasuki Gap', false],
  ['Dragonfly Doji', true],
  ['Engulfing', true],
  ['Evening Doji Star', false],
  ['Evening Star', false],
  ['Falling Three Methods', false],
  ['Falling Window', false],
  ['Gravestone Doji', false],
  ['Hammer', true],
  ['Hanging Man', false],
  ['Harami Cross', false],
  ['Harami', false],
  ['Inverted Hammer', false],
  ['Kicking', false],
  ['Long Lower Shadow', false],
  ['Long Upper Shadow', false],
  ['Marubozu Black', false],
  ['Marubozu White', false],
  ['Morning Doji Star', false],
  ['Morning Star', false],
  ['On Neck', false],
  ['Piercing', false],
  ['Rising Three Methods', false],
  ['Rising Window', false],
  ['Shooting Star', false],
  ['Spinning Top Black', false],
  ['Spinning Top White', false],
  ['Three Black Crows', false],
  ['Three White Soldiers', false],
  ['Tri-Star', false],
  ['Tweezer Bottom', false],
  ['Tweezer Top', false],
  ['Upside Tasuki Gap', false],
];

/** "Engulfing - Bullish" → family "Engulfing"; neutral names map to themselves. */
export function familyOf(def: PatternDef): string {
  return def.name.replace(/ - (Bullish|Bearish)$/, '');
}

/** Full script body for the "*All Candlestick Patterns*" indicator. */
export function allPatternsScript(): void {
  indicator('*All Candlestick Patterns*', { shorttitle: 'All Patterns', overlay: true });
  const trend = trendInputs();
  const props = candleProps();
  const labelColors: Record<PatternDirection, string> = {
    bullish: input.color(color.blue, 'Label Color Bullish'),
    bearish: input.color(color.red, 'Label Color Bearish'),
    neutral: input.color(color.gray, 'Label Color Neutral'),
  };
  const candleType = input.string('Both', 'Pattern Type', {
    options: ['Bullish', 'Bearish', 'Both'],
  });
  const toggles = new Map<string, boolean>();
  for (const [family, defval] of FAMILY_DEFAULTS) {
    toggles.set(family, input.bool(defval, family));
  }
  for (const def of ALL_PATTERNS) {
    if (!toggles.get(familyOf(def))) continue;
    // neutral patterns ignore the Pattern Type filter, as in the original
    if (def.direction === 'bullish' && candleType === 'Bearish') continue;
    if (def.direction === 'bearish' && candleType === 'Bullish') continue;
    emitPattern(def, def.detect(props, trend), labelColors[def.direction]);
  }
}
