# OakscriptJS Assessment

Date: 17/07/2026
Version assessed: 0.4.0
Scope: full library review with three questions: how to support more indicators, how to get closer to the PineScript DSL, how to simplify the user experience.

Data sources: source tree `src/`, tests, `docs/official/language-reference` (v6 function list), the 1046 PineScript sources in `docs/official/indicators_*`, and the two consumers (`D:/projects/opentrader`, `D:/projects/lightweight-charts-indicators`).

---

## 1. Current state

### 1.1 Function coverage

The computational namespaces are essentially complete:

| Namespace | Documented (v6) | Implemented | Coverage |
|---|---|---|---|
| ta.* | 59 | 59 (+ ichimoku, zigzag extras) | 100% |
| math.* | 24 | 24 | 100% |
| str.* | 18 | 18 | 100% |
| array.* | 55 | 54 (missing array.new_table) | 98% |
| matrix.* | 49 | 49 | 100% |
| color.* | 7 | 7 | 100% |

What is missing is everything around the computation:

| Missing area | Coverage |
|---|---|
| Visual outputs: plotshape, plotchar, plotcandle, plotbar, bgcolor, barcolor | 0% |
| request.* (multi-timeframe), timeframe.*, ticker.*, syminfo.* | 0% |
| barstate.*, bar_index, calendar time (year, dayofweek, time(), sessions) | 0% (src/time is a stub) |
| map.*, table.*, log.* | 0% |
| input.* variants (enum, timeframe, session, symbol, time, price, text_area) | 5 of 14 |
| strategy.* | 0% (out of scope for an indicator library) |

### 1.2 Portability against the official corpus

Measured on the 1046 indicators in `docs/official/indicators_*`:

| Corpus | Count | Portable today (strict) | Portable with simple var/if glue |
|---|---|---|---|
| indicators_standard | 134 | 42% (56) | 58% (78) |
| indicators_candlestick | 45 | 0% | 0% |
| indicators_community | 867 | 14% (118) | 18% (155) |
| Total | 1046 | ~17% | ~22% (233) |

Feature usage across the corpus (file counted once per feature):

| PineScript feature | Files using it | Supported today |
|---|---|---|
| plot / hline / fill | most | Yes |
| [] history on computed expressions | most | Yes (Series.offset) |
| ta.* composition | ~700 | Yes |
| := reassignment, per-bar if | ~640 | No |
| var / varip persistent state | 561 | Partial (init-once only) |
| bgcolor / barcolor | ~470 | No |
| line/box/label created per bar | ~500 | No (data structures exist, no runtime) |
| for / while loops | ~342 | No |
| plotshape / plotchar / plotcandle | ~330 | No |
| arrays/matrices mutated per bar | ~325 | No |
| barstate.* | ~308 | No |
| time() / timeframe.* / session | ~200 | No |
| UDT (type) / method syntax | ~150 | No |
| table.* | 138 | No |
| request.security (MTF) | 119 | No |
| library import | 66 | No |
| strategy.* | 84 | Out of scope |

### 1.3 Architecture

The architectural divide is the execution model. OakscriptJS is vectorized: every ta.* core function takes the whole bar array and returns a whole array, and `Series` is a lazy per-bar extractor over the full array. PineScript executes bar by bar with persistent state (`var`, `:=`), imperative `if`/`for`, and drawings created conditionally per bar.

What the current model already covers:
- The `[]` history operator, via `Series.offset()`.
- Simple ternaries, via `Series.iff()`.
- All stateless indicator math.

What it cannot express: any state machine, recursive definition, or loop written by the user (the library implements supertrend, sar, zigzag internally as special cases, but a user script cannot write such logic).

### 1.4 Three overlapping authoring APIs

1. The `indicator()` constructor convention (src/indicator.ts).
2. The global-context runtime (`setContext`/`plot`, src/runtime). It was designed as the output target for an "OakScriptEngine" PineScript transpiler. That transpiler does not exist anywhere (confirmed in this repo and in opentrader). The runtime API is vestigial.
3. The flat script API (src/script, v0.4.0): `indicator() / input.* / plot / hline / fill / alertcondition` collected by `executeScript()`.

Both real consumers hand-write TypeScript:
- lightweight-charts-indicators (~250 indicator files) uses the verbose `calculate()` + config convention (each input declared 3 times, each plot 2 times).
- opentrader user scripts use the script API inside a Monaco editor and a Web Worker.

### 1.5 Consumer pain points (glue they had to write)

From `D:/projects/opentrader/src/window/oakscript/`:
- A worker host with a blob-URL module shim so user `import "oakscriptjs"` resolves to the worker's bundled instance.
- A source rewrite that wraps script bodies in a re-runnable function (ESM runs once, Pine semantics need re-runs), with error line mapping back to user source.
- A watchdog that kills and respawns a hung worker (user code can infinite-loop).
- A stale-while-revalidate cache bridging the synchronous render path and the async worker.
- Monaco IntelliSense glue that inlines all 31 .d.ts files by hand because the package exports map does not expose the declaration files.
- A renderer (indicator-layer.ts) re-implemented from the library example; it notes that boxes, labels, lines, tables, bgcolor, barcolor are not yet drawn.

Other defects noticed:
- `VERSION` in src/index.ts says 0.3.0 while package.json says 0.4.0.
- `crossover/crossunder/cross/rising/falling` return booleans in src/ta but 1/0 numeric Series in src/ta-series.
- Several core functions document "na values are ignored" while the code propagates NaN (sma) or filters NaN (dev, variance, median, correlation). Behavior should be aligned with PineScript and the docstrings fixed.
- `ta.supertrend` has an extra `wicks` parameter not in v6.
- src/time exports only `now()` and `timestamp()`.
- docs/guide.md and docs/inventory.md are outdated.

---

## 2. How to support more indicators

Ranked by indicators unlocked per unit of work.

### Tier 1: stateless per-bar visual outputs
`plotshape`, `plotchar`, `plotcandle`, `bgcolor`, `barcolor`. Each is a pure function of an already-computed Series, so it fits the vectorized model with no new machinery: collector entries in src/script, `IndicatorResult` extensions, marker/background mapping in the renderer. This alone lifts corpus coverage from ~22% to ~40% (+142 indicators). Examples blocked today: Williams Fractals (triangle markers), RSI divergence labels, Chop Zone (bgcolor).

### Tier 2: conditional per-bar drawings
`label.new`, `line.new`, `box.new` created inside conditions. The data structures already exist; missing is a per-bar creation channel and a slot in `ScriptRunResult`. A vectorized helper covers most cases without a new execution model, for example `draw.labelWhen(condition, {y, text, ...})`. Unlocks all 45 candlestick patterns (they need exactly conditional label + bgcolor), Pivot Points, Auto Fib, session boxes. Direct unlock +19 files, gateway to ~500.

### Tier 3: time, barstate, bar_index
Cheap in the vectorized model: `dayofweek`, `hour`, `time(session)` are Series derived from bar.time; `bar_index` is an index Series; `barstate.islast` is `i === n-1`. Roughly 200 to 300 indicators touch these. src/time already contains the TODO list.

### Tier 4: per-bar stateful execution
`var`, `:=`, if/for state machines. The big architecture item, described in section 3. Gateway to ZigZag-from-scratch, profiles, ranking scans, and most complex community scripts (~600 files touch stateful features).

### Tier 5: request.security (multi-timeframe)
Needs a host-provided data adapter (`{getBars(symbol, timeframe)}`) plus a resampling engine (aggregate lower timeframe bars up, forward-fill higher timeframe values down). 119 files use it. The library cannot fetch data itself, so this must be an adapter interface.

Quick wins alongside: the missing input.* variants (trivial collector additions), `fixnan`, and shipping src/lib/zigzag as a substitute for the `TradingView/ZigZag/7` library import (unlocks Zig Zag and Auto Fib, +8 files).

---

## 3. How to get closer to the PineScript DSL

The gap has two layers: syntax (`close.gt(open).iff(a, b)` instead of `close > open ? a : b`) and semantics (no per-bar state).

### Recommended: a per-bar execution mode in the script API

A block whose callback runs once per bar, where sources are plain numbers, and state is a plain closure variable:

```typescript
indicator('Example');
let dir = 0;                                  // PineScript: var dir = 0
const trend = eachBar((c) => {
  // c.close is a number here, so native JS operators work
  const d = c.close > c.get(high, 1) ? 1 : dir;   // c.get(high, 1) = high[1]
  dir = d;                                     // PineScript: dir := d
  return d;                                    // collected into a Series
});
plot(trend);
```

This one feature solves three problems at once:
- Native JS operators replace the .add/.gt/.iff chains, because values are scalars inside the callback.
- `var`, `:=`, `if`, `for` become plain JS `let`, `=`, `if`, `for` (state lives in closure variables).
- Per-bar drawing creation becomes natural (Tier 2 hooks can be exposed on the bar context).

Keep the vectorized path as the fast path; `eachBar` is the escape hatch for stateful logic. Running only the stateful block per bar avoids re-running cheap vectorized parts N times, which is the drawback of designs that re-run the whole script body per bar.

### A transpiler becomes mostly mechanical after eachBar

Every PineScript construct then has a direct JS target: script API for declarations, vectorized ta.* for pure calls, eachBar for stateful blocks. Without eachBar a transpiler has no target for half the language. Treat the transpiler as a separate project (the opentrader assessment of 16/07/2026 reached the same conclusion) and build it only after the per-bar mode is stable.

### Not recommended

Operator overloading via a Babel plugin (mentioned in old doc comments). It ties every consumer to a build step, breaks the in-browser Monaco editing flow opentrader uses, and eachBar gets native operators without it.

### Semantic cleanups for DSL fidelity

- Unify boolean vs 1/0 returns between src/ta and src/ta-series.
- Align na handling with PineScript and fix the docstrings.
- Enforce or document the simple vs series parameter distinction where it matters.

---

## 4. How to simplify the user experience

1. **Consolidate on one authoring API.** Deprecate the global-context runtime (a transpiler target with no transpiler) and the `indicator()` constructor convention. The script API is the winner: it is what opentrader user scripts use, and it was created precisely because the old convention repeats every declaration. Migrating lightweight-charts-indicators' ~250 indicators to it removes most of that repo's boilerplate.

2. **Ship the execution host.** opentrader wrote a worker host, module shim, watchdog, error mapper, and async bridge. All of that is generic. An `oakscriptjs/host` entry point (worker script + main-thread client + message protocol) would make the library usable out of the box.

3. **Ship a reference renderer.** `ScriptRunResult` is only half the product; every consumer re-implements plot/fill/marker routing onto lightweight-charts. Promote a maintained `oakscriptjs/render-lwc` module and keep it in sync as new output types are added.

4. **Fix packaging.** The exports map only exposes `.`, `./runtime`, `./script`; opentrader had to inline all 31 .d.ts files into Monaco by hand. Add declaration files to the export map and publish a bundled types file intended for editor embedding. Fix the stale VERSION constant.

5. **Make the two ta layers consistent.** In the script API `ta.atr(14)` works (bars bound from context); in the root API the same call needs explicit bars. Document the root array API as the low-level layer and the script API as the user layer. Regenerate guide.md and inventory.md from source.

6. **One-line indicator use for non-chart consumers.** A helper like `runIndicator(body, bars, inputs)` returning plain arrays keyed by plot title, for backtesting-style use without chart concepts.

---

## My interpretation

The library has finished the easy half of the port (the functions) and now hits the hard half (the execution model and the output surface). The cheapest next step is also the biggest: plotshape/plotchar/bgcolor/barcolor are stateless, need no architecture change, and nearly double corpus coverage (22% to 40%). The candlestick folder is the best proof-of-value target: 45 indicators blocked by exactly two features.

The per-bar eachBar mode is the single decision that shapes everything after that. It simultaneously answers question 1 (var/loops/state, the gateway to ~600 more indicators), question 2 (native JS operators, and it is the missing transpiler target), and question 3 (users stop learning a chaining DSL).

Recommended sequence: Tier 1 outputs, then eachBar plus per-bar drawings, then time/barstate, then request.security, and the transpiler only after that.
