# Changelog

All notable changes to OakScriptJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2025-12-06

### Added

**Series Enhancements:**
- **BarData Class**: Versioned wrapper around `Bar[]` array for automatic cache invalidation
- **materialize() Method**: Breaks closure chains for memory efficiency
- **barData Property**: Access to underlying BarData source from Series instances

**Transpiler Improvements:**
- Modular architecture with semantic analysis
- Enhanced PineScript compatibility
- Better error reporting and diagnostics
- Fixed builtin function signatures and added missing functions

**Testing:**
- Added comprehensive Series unit tests (453+ test cases)
- Added overlay indicators integration tests
- Added TA-Series integration tests

**Build & CI:**
- Improved indicator generation workflow
- Refactored indicator sources to use docs/official

### Fixed

- Fixed ta-series functions accessing non-existent .data property
- Fixed overlay indicators returning empty plot data
- Fixed .data to .bars references in crossover/crossunder/cross functions

### Performance

- Automatic cache invalidation reduces redundant computation
- Memory-efficient closure chain breaking with `materialize()`
- Better garbage collection for long-running applications

---

## [0.2.1] - 2025-12-05

### Added

**Series Enhancements:**
- **BarData Class**: Versioned wrapper around `Bar[]` array for automatic cache invalidation
  - Tracks version number that increments on mutations (`push()`, `pop()`, `set()`, `updateLast()`, `setAll()`)
  - Series automatically detect stale caches when underlying BarData version changes
  - Backward compatible - Series still accepts `Bar[]` directly
- **materialize() Method**: Breaks closure chains for memory efficiency
  - Eagerly computes values and creates new Series without closure dependencies
  - Useful for complex expressions to free intermediate Series memory
  - Enables better garbage collection in long-running applications
- **barData Property**: Access to underlying BarData source from Series instances

**Transpiler Improvements:**
- Modular architecture with semantic analysis
- Enhanced PineScript compatibility
- Better error reporting and diagnostics

### Performance

- Automatic cache invalidation reduces redundant computation
- Memory-efficient closure chain breaking with `materialize()`
- Better garbage collection for long-running applications

### Examples

```typescript
// Automatic cache invalidation with BarData
const barData = new BarData(bars);
const close = Series.fromBars(barData, 'close');
const values1 = close.toArray(); // Computes and caches

barData.push(newBar); // Increments version
const values2 = close.toArray(); // Detects stale cache, recomputes

// Breaking closure chains for memory efficiency
const complex = a.add(b).mul(c).div(d).sub(e);
const materialized = complex.materialize(); // Breaks closure chain, frees memory
```

---

## [0.2.0] - 2025-11-10

### Major Refactoring - Back to Simplicity

This version represents a significant architectural simplification, removing the DSL layer and focusing on computational primitives.

### Removed (Breaking Changes)

- **DSL Layer**: Removed `indicator()`, `plot()`, `hline()`, `fill()`, `compile()` functions
- **Context API**: Removed `createContext()` and global context management
- **Built-in Series**: Removed global `close`, `open`, `high`, `low`, `volume` variables
- **IndicatorController**: Removed controller infrastructure (moved to OakScriptEngine)

### Changed

- **Architecture**: Simplified to two-layer approach (Core TA + TA-Series wrappers)
- **Series Class**: Standalone lazy evaluation without global context
- **TA-Series Functions**: Now use eager computation (O(n)) instead of lazy (was O(n²))
- **Export Structure**: Clean exports with `ta` namespace and convenience exports

### Added

- **TA-Series Wrapper**: `ta.vwap()` - Volume Weighted Average Price
- **Convenience Exports**: Added `cum` and `vwap` to top-level exports
- **Metadata Types**: Comprehensive types for `IndicatorResult`, `PlotData`, etc.
- **Performance**: All TA-Series functions now O(n) instead of O(n²)

### Fixed

- **CRITICAL**: Fixed O(n²) performance bug in all TA-Series wrappers
  - Before: 26.5 seconds to convert 4 MAs (13,570 bars)
  - After: 2.82ms to convert 4 MAs (13,570 bars)
  - **16,734x performance improvement!**
- **Documentation**: Complete rewrite of README, GUIDE, and INVENTORY
- **Series.offset()**: Verified no data corruption issues (bug report was for old version)

### Performance

**Benchmark (13,570 bars, 4 moving averages):**
- v0.1.3: 47,144ms (47 seconds)
- v0.2.0: 2.82ms (0.003 seconds)
- **Improvement: 16,734x faster**

### Migration Guide from v0.1.x

**Old DSL Approach (v0.1.x):**
```typescript
import { indicator, plot, close, ta, compile } from '@deepentropy/oakscriptjs';

indicator("My Indicator");
const rsi = ta.rsi(close, 14);
plot(rsi);
export default compile();
```

**New Function-Based Approach (v0.2.0):**
```typescript
import { Series, ta, type IndicatorResult } from '@deepentropy/oakscriptjs';

export function myIndicator(bars: any[]): IndicatorResult {
  const close = Series.fromBars(bars, 'close');
  const rsi = ta.rsi(close, 14);

  return {
    metadata: { title: "My Indicator", overlay: false },
    plots: [{
      data: rsi.toArray().map((v, i) => ({ time: bars[i].time, value: v }))
    }]
  };
}
```

### Technical Details

**Files Changed:**
- `src/index.ts` - Simplified exports, removed DSL
- `src/ta-series.ts` - Fixed O(n²) bug in all wrappers, added `vwap()`
- `src/runtime/series.ts` - Standalone Series class
- `src/types/metadata.ts` - New metadata types
- Removed: `src/dsl/*`, `src/context.ts`, `src/indicator/*`

**Lines of Code:**
- Removed: ~3,900 lines (DSL, Context, IndicatorController)
- Added: ~200 lines (metadata types)
- Net: ~3,700 lines removed

### Documentation

- **README.md**: Complete rewrite for v0.2.0 architecture
- **GUIDE.md**: Complete rewrite with function-based examples
- **INVENTORY.md**: Updated to reflect new architecture
- **CHANGELOG.md**: Added (this file)

### Breaking Changes

All DSL-based code will need to be rewritten. The OakScriptEngine transpiler is responsible for generating the new function-based structure.

---

## [0.1.3] - 2025-01-06

### Added

- Complete `ta` namespace (59 functions, 100% coverage)
- Complete `math` namespace (24 functions, 100% coverage)
- Complete `str` namespace (20 functions, 100% coverage)
- Complete `color` namespace (8 functions, 100% coverage)
- Complete `line`, `box`, `label`, `linefill` namespaces
- Drawing objects with computational features
- DSL functions: `indicator()`, `plot()`, `hline()`, `fill()`, `compile()`
- Context API with `createContext()`
- IndicatorController for chart binding

### Known Issues

- O(n²) performance in TA-Series wrappers (fixed in v0.2.0)
- Complex DSL layer with global state (removed in v0.2.0)

---

## [0.1.0] - 2024-12-01

### Initial Release

- Basic TA functions (SMA, EMA, RSI, MACD, etc.)
- Series class for lazy evaluation
- Array-based core functions
- TypeScript support

[0.1.5]: https://github.com/deepentropy/oakscriptJS/compare/v0.1.4-before-monorepo...v0.1.5
[0.2.0]: https://github.com/deepentropy/oakscriptJS/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/deepentropy/oakscriptJS/releases/tag/v0.1.3
[0.1.0]: https://github.com/deepentropy/oakscriptJS/releases/tag/v0.1.0
