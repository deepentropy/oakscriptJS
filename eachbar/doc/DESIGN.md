# eachBar: per-bar stateful execution for the script API

Date: 17/07/2026
Status: implemented in src/script/index.ts (`eachBar`, `seriesOf`, `BarContext`), tests in tests/script/eachbar.test.ts.

## Problem

OakscriptJS is vectorized: Series and ta.* compute whole arrays. PineScript executes bar by bar with persistent state. Any indicator that is a state machine, a recursive definition, or a loop cannot be written by a user in the vectorized model. This blocks ~600 of the 1046 official indicators.

## Design

`eachBar(fn)` runs the callback once per bar, in order, and collects the returned values into a normal Series. Inside the callback every value is a plain number, so native JS operators, `if`, `for`, `while` all work.

PineScript concept mapping:

| PineScript | eachBar equivalent |
|---|---|
| `var x = 0` | `let x = 0` declared before the eachBar call (closure state) |
| `x := expr` | `x = expr` |
| `close`, `high`, ... | `c.close`, `c.high`, ... (numbers) |
| `src[k]` | `c.get(src, k)` for any Series |
| self-reference `myVal[1]` | `c.prev()` / `c.prev(k)` |
| `bar_index` | `c.i` |
| per-bar `if` / `for` | native JS statements |
| returning a bool series | return a boolean, collected as 1/0 |
| `na` | return nothing (collected as NaN), test inputs with `na(v)` |

Example (direction state machine):

```typescript
import { indicator, plot, eachBar, close } from 'oakscriptjs/script';

indicator('Trend');
let dir = 0;                                   // var dir = 0
const trend = eachBar((c) => {
  if (c.close > c.get(close, 1)) dir = 1;      // dir := 1
  else if (c.close < c.get(close, 1)) dir = -1;
  return dir;
});
plot(trend);
```

Multiple outputs: accumulate side arrays in the closure and wrap them with `seriesOf(values)`.

## Implementation notes

- The vectorized path stays the fast path. `eachBar` materializes each Series the callback touches exactly once (`c.get` caches `src.toArray()` per call site), so cost is O(bars) per touched Series plus the callback loop. The whole script body is never re-run per bar, which is the drawback of designs that emulate PineScript by re-executing the full script for every bar.
- `c.prev(k)` clamps k to >= 1; before the start it returns NaN, matching PineScript `na` for out-of-range history.
- The returned Series participates in everything downstream: `plot(...)`, `ta.sma(s, n)`, `.offset()`, fills, markers.
- Lifecycle: `eachBar` only works inside `executeScript()` (same guard and error message as the declaration calls).

## Limits (by design, for now)

- One numeric output per eachBar call (side outputs via `seriesOf`).
- No per-bar drawing creation from inside the callback yet; that is the Tier 2 hook point (expose `c.label(...)`, `c.line(...)` later).
- No `varip` distinction (no realtime tick model in the library yet).
- Series created inside the callback per bar (e.g. calling ta.* inside the loop) is not supported usage; compute vectorized Series outside and read them with `c.get`. Calling ta.* inside the callback recomputes the full array every bar, which is O(n²): the cache keys by Series identity, and a new Series object is created on every call.

## Why this is the transpiler target

With eachBar, every PineScript construct has a direct JS target: declarations map to the script API, pure expressions map to vectorized Series/ta.*, and stateful blocks map to an eachBar body with closure variables. A future PineScript-to-JS transpiler can translate function-by-function without inventing an execution model.
