/**
 * Smoke tests over every ported candlestick pattern and the
 * "*All Candlestick Patterns*" composite.
 */
import { executeScript } from '../../src/script';
import type { Bar } from '../../src/types';
import { ALL_PATTERNS, patternScript, allPatternsScript, familyOf } from '../../candlestick-port/code';

/** Deterministic pseudo-random OHLC walk (no Math.random for repeatability). */
function walkBars(count: number): Bar[] {
  const bars: Bar[] = [];
  let level = 100;
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < count; i++) {
    const open = level;
    const drift = (rnd() - 0.5) * 4;
    const close = Math.max(1, open + drift);
    const high = Math.max(open, close) + rnd() * 2;
    const low = Math.max(0.5, Math.min(open, close) - rnd() * 2);
    bars.push({ time: 1700000000 + i * 86400, open, high, low, close, volume: 1000 + i });
    level = close;
  }
  return bars;
}

const BARS = walkBars(300);

describe('registry', () => {
  test('has all 44 patterns with unique names', () => {
    expect(ALL_PATTERNS).toHaveLength(44);
    const names = new Set(ALL_PATTERNS.map((p) => p.name));
    expect(names.size).toBe(44);
  });

  test('every pattern maps to a known family', () => {
    const families = new Set(ALL_PATTERNS.map(familyOf));
    expect(families.size).toBe(37); // 37 family toggles in the composite
  });
});

describe('every pattern runs as a standalone indicator', () => {
  for (const def of ALL_PATTERNS) {
    test(`${def.name}`, () => {
      const run = executeScript(() => patternScript(def), BARS);
      // metadata mirrors the .pine file
      expect(run.metadata.title).toBe(def.name);
      expect(run.metadata.overlay).toBe(true);
      // one shape declaration, one bgcolor declaration, one alert
      expect(run.shapeConfig).toHaveLength(1);
      expect(run.barColorConfig).toHaveLength(1);
      expect(run.alertConfig).toHaveLength(1);
      // inputs: trend rule (when declared) + label color
      const types = run.inputConfig.map((i) => i.type);
      expect(types).toEqual(def.needsTrend ? ['string', 'color'] : ['color']);
      // markers, when present, carry the pattern label and tooltip
      for (const m of run.result.markers ?? []) {
        expect(m.text).toBe(def.labelText);
        expect(m.tooltip).toBe(def.tooltip);
      }
      // every marker time has bgcolor coverage on the same bar
      const bgTimes = new Set((run.result.bgcolors ?? []).map((b) => b.time));
      for (const m of run.result.markers ?? []) {
        expect(bgTimes.has(m.time)).toBe(true);
      }
    });
  }

  test('at least a few patterns fire on the random walk', () => {
    let fired = 0;
    for (const def of ALL_PATTERNS) {
      const run = executeScript(() => patternScript(def), BARS);
      if ((run.result.markers?.length ?? 0) > 0) fired++;
    }
    // sanity: the walk should contain common 1-2 candle patterns
    expect(fired).toBeGreaterThanOrEqual(5);
  });
});

describe('*All Candlestick Patterns* composite', () => {
  test('declares trend, colors, pattern type and 37 family toggles', () => {
    const run = executeScript(allPatternsScript, BARS);
    expect(run.metadata.title).toBe('*All Candlestick Patterns*');
    const boolInputs = run.inputConfig.filter((i) => i.type === 'bool');
    expect(boolInputs).toHaveLength(37);
    expect(run.inputConfig.filter((i) => i.type === 'color')).toHaveLength(3);
    const typeInput = run.inputConfig.find((i) => i.title === 'Pattern Type')!;
    expect(typeInput.options).toEqual(['Bullish', 'Bearish', 'Both']);
  });

  test('default toggles only emit the enabled families', () => {
    const run = executeScript(allPatternsScript, BARS);
    // defaults on: Abandoned Baby(2), Doji(1), Dragonfly Doji(1), Engulfing(2), Hammer(1) = 7 patterns
    expect(run.shapeConfig).toHaveLength(7);
  });

  test('Pattern Type filter drops bearish patterns but keeps neutral ones', () => {
    const all = executeScript(allPatternsScript, BARS, {
      pattern_type: 'Bullish',
      engulfing: true,
      doji: true,
      abandoned_baby: true,
      dragonfly_doji: true,
      hammer: true,
    });
    // Abandoned Baby bullish only(1), Doji neutral(1), Dragonfly(1), Engulfing bullish(1), Hammer(1)
    expect(all.shapeConfig).toHaveLength(5);
  });

  test('enabling every toggle emits all 44 patterns', () => {
    const everything: Record<string, unknown> = {};
    const run0 = executeScript(allPatternsScript, BARS);
    for (const input of run0.inputConfig) {
      if (input.type === 'bool') everything[input.id] = true;
    }
    const run = executeScript(allPatternsScript, BARS, everything);
    expect(run.shapeConfig).toHaveLength(44);
  });
});
