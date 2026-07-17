# Tier 1 visual outputs: design

Date: 17/07/2026
Status: plotshape, plotchar, bgcolor, barcolor implemented. plotcandle, plotbar designed only (see section 6).

## Goal

Add the stateless per-bar visual outputs to the script API (`oakscriptjs/script`). Each is a pure function of an already-computed Series, so no change to the execution model is needed. These outputs unlock about 142 additional official indicators (corpus coverage 22% to 40%) and are a precondition for the candlestick pattern port.

## Data flow

Same pattern as the existing plot()/hline()/fill():

1. The script body calls `plotshape(...)` / `plotchar(...)` / `bgcolor(...)` / `barcolor(...)`.
2. The collector records a declarative config (for the host UI: titles, editable colors) and the computed per-bar data (for the renderer).
3. `executeScript()` returns both inside `ScriptRunResult`:
   - `shapeConfig: ShapeConfig[]` (new)
   - `result.markers: MarkerData[]` (new)
   - `result.bgcolors: BarColorData[]` (new)
   - `result.barcolors: BarColorData[]` (new)

## API

Signatures follow the existing script API convention `(series, title?, options)` rather than PineScript positional arguments.

```typescript
plotshape(condition: Series, title?: string, options?: {
  style?: 'xcross'|'cross'|'triangleup'|'triangledown'|'flag'|'circle'|
          'arrowup'|'arrowdown'|'labelup'|'labeldown'|'square'|'diamond';  // default 'xcross'
  location?: 'abovebar'|'belowbar'|'top'|'bottom'|'absolute';               // default 'abovebar'
  color?: string;
  text?: string;
  textcolor?: string;
  size?: 'auto'|'tiny'|'small'|'normal'|'large'|'huge';                     // default 'auto'
  offset?: number;      // bars, displayed at bar i + offset
  tooltip?: string;     // extension over PineScript plotshape, needed to port label.new-based scripts
}): void

plotchar(condition: Series, title?: string, options?: {
  char?: string;        // default '*'
  location?: ...;       // same as plotshape, default 'abovebar'
  color?, text?, textcolor?, size?, offset?
}): void

bgcolor(colors: string | (string|undefined)[], options?: {
  offset?: number;      // baked into the emitted per-bar data
  title?: string;
}): void

barcolor(colors: string | (string|undefined)[], options?: { title?: string }): void
```

Semantics:
- `plotshape`/`plotchar` emit one marker per bar where the condition value is not na and not 0. With `location: 'absolute'` the marker carries `price` = the series value at that bar.
- `bgcolor`/`barcolor` accept a static color string or a per-bar array, normally produced by `color.when(cond, colorTrue, colorFalse?)`. `undefined` entries mean "no color on this bar" (PineScript `na`). `color.when` gains an optional third argument for exactly this.
- `offset` is baked at collection time: the value computed at bar i is emitted with the time of bar `i + offset`, entries falling outside the chart are dropped. This matches PineScript's display behavior for a full recompute model and keeps renderers trivial.

## Result types (src/types/metadata.ts)

```typescript
interface MarkerData {
  time: any;
  id: string;            // which plotshape/plotchar declaration produced it
  location: 'abovebar'|'belowbar'|'top'|'bottom'|'absolute';
  style: string;         // shape style, or 'char' for plotchar
  char?: string;
  color?: string;
  text?: string;
  textcolor?: string;
  size?: string;
  tooltip?: string;
  price?: number;        // set when location is 'absolute'
}

interface BarColorData { time: any; color: string; }
```

`IndicatorResult` gains `markers?`, `bgcolors?`, `barcolors?`.

## Renderer mapping (lightweight-charts v5)

- markers: `createSeriesMarkers` on the main series. Position map: abovebar -> aboveBar, belowbar -> belowBar, absolute -> inBar with `price`. Shape map: triangleup/arrowup -> arrowUp, triangledown/arrowdown -> arrowDown, circle -> circle, everything else -> square with `text` (lightweight-charts has 4 marker shapes; labelup/labeldown render as text markers). Markers from all declarations must be merged and sorted by time before `setMarkers`.
- bgcolors: no native background API per bar; render with a custom series primitive drawing full-height rectangles per bar (the same technique as session highlight primitives).
- barcolors: candlestick series per-bar color override (set `color`/`borderColor`/`wickColor` on the bar data points of the main series).

## 6. plotcandle / plotbar (designed, not implemented)

`plotcandle(open, high, low, close, title?, options)` needs four Series and per-bar wick/border/body colors. Result type would be `candles: Record<id, OhlcPoint[]>` plus a `CandleConfig`. Renderer maps to an extra candlestick series. `plotbar` is the same with a bar series. Both are used by ~30 corpus files, mostly "Multi-Time Period Charts" style, which also need request.security, so they are deferred until Tier 5.

## Out of scope for Tier 1

- `fill()` between plot and hline pairs beyond what exists.
- Per-bar `label.new`/`line.new`/`box.new` (Tier 2).
- `display.*` granularity, `editable`, `show_last` (accepted in options later without behavior change).
