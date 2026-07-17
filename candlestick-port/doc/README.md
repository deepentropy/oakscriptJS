# Candlestick pattern port

Date: 17/07/2026
Source: docs/official/indicators_candlestick (45 TradingView official .pine scripts)
Target: oakscriptjs script API with the Tier 1 outputs (plotshape, bgcolor)

## Structure

```
candlestick-port/code/
  candle-props.ts     shared C_* candle property block + trend detection input
  pattern-runner.ts   PatternDef interface + generic runner (alert, label marker, bg highlight)
  patterns/*.ts       one PatternDef per official pattern (44 files)
  registry.ts         ALL_PATTERNS list + name lookup
  all-patterns.ts     port of "_All Candlestick Patterns_" (family toggles + Pattern Type filter)
  index.ts            public entry: registry, runner, composite
tests/candlestick/    infra tests with constructed patterns + smoke tests over all 44
```

All 45 official scripts share one template: a trend detection input (some skip it), a candle property block (body, shadows, doji conditions), one pattern condition, then `label.new` on the condition and `bgcolor` highlighting the N candles of the pattern. The port factors the template into `candle-props.ts` and `pattern-runner.ts`; each pattern file only holds its metadata and detection condition. The composite indicator reuses the same PatternDefs, which the original could not do (it repeats every block inline).

## Usage

Single pattern:

```typescript
import { executeScript } from 'oakscriptjs/script';       // in-repo: ../../src/script
import { patternScript, getPattern } from './candlestick-port/code';

const run = executeScript(() => patternScript(getPattern('Engulfing - Bullish')!), bars);
// run.result.markers  → label markers (text 'BE', tooltip, belowbar)
// run.result.bgcolors → pattern highlight (2 bars, blue 90% transparent)
// run.inputConfig     → trend rule + label color inputs
```

All patterns in one indicator:

```typescript
import { allPatternsScript } from './candlestick-port/code';
const run = executeScript(allPatternsScript, bars, { pattern_type: 'Bullish' });
```

## Porting decisions

- `label.new(bar_index, posLow/posHigh, ...)` is rendered as `plotshape` with location belowbar (bullish, neutral) or abovebar (bearish) and styles labelup/labeldown. The ATR-based absolute label position of the original is not ported: lightweight-charts markers position relative to the bar, which matches the visual intent. The tooltip text is carried on the marker (`tooltip` field).
- `bgcolor(ta.highest(cond?1:0, N) != 0 ? color : na, offset=-(N-1))` is ported as `bgcolor(color.when(ta.highest(cond, N).gt(0), color), { offset: -(N-1) })`. `.gt(0)` instead of `!= 0` keeps the NaN warm-up bars of highest() uncolored (Pine's na comparison behaves the same).
- The offset is baked into the emitted per-bar data. Consequence, identical to Pine on a live chart: when a pattern ends on the very last bar, only part of the highlight exists until more bars arrive, because the highest() windows after the last bar do not exist yet.
- Division by zero inside shadowEquals returns NaN (Series.div), and NaN is falsy in and/or chains, matching Pine's na semantics.
- alertcondition evaluates on the last bar of the run, like the host re-running the script per bar in PineScript's model.
- Alert messages use a plain hyphen instead of the original en dash.

## Fidelity limits

- The `SMA50`/`SMA50, SMA200` trend rules depend on ta.sma warm-up: the first 49 (or 199) bars have no trend, so no pattern that requires a trend can fire there. Pine behaves the same.
- TradingView label styling (rounded label balloon) depends on the host renderer; the data layer carries style labelup/labeldown, text, colors and tooltip.
