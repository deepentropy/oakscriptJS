# GitHub Issue: Add IndicatorController for Lightweight Charts Integration

**Title:** Add IndicatorController class to simplify indicator creation with Lightweight Charts

**Labels:** enhancement, feature-request

---

## Summary

Add a standardized `IndicatorController` class and `createIndicator()` factory function to OakScriptJS to handle plot functionality and indicator metadata management, eliminating ~90% of boilerplate code when creating indicators.

## Problem

Currently, every indicator using OakScriptJS with Lightweight Charts must implement identical boilerplate (~100 lines per indicator):

- Pine color → hex conversion (17 color mappings)
- Series creation and lifecycle management
- Pane index calculation (overlay vs separate pane)
- Data subscription/updates
- Attach/detach logic
- Options management

**Example:** See [balance-of-power.js](https://github.com/deepentropy/oakscript-engine/blob/main/examples/indicators/balance-of-power.js) - 100+ lines of code where only the calculation function is unique.

This creates:
- ❌ Code duplication across every indicator
- ❌ Inconsistent implementations
- ❌ High maintenance burden (bug fixes need N×updates)
- ❌ Difficult to add new plot types

## Proposed Solution

Add `IndicatorController` class to OakScriptJS core:

```typescript
import { createIndicator } from '@deepentropy/oakscriptjs';

export function createBalanceOfPowerIndicator(chart, mainSeries, overlay, options = {}) {
    return createIndicator(
        chart,
        mainSeries,
        { ...indicatorMetadata, overlay },
        calculateBalanceOfPowerIndicatorValues,
        options
    );
}
```

**Result:** 100+ lines → ~8 lines per indicator 🎉

## API Design

```typescript
export interface IndicatorControllerInterface {
    attach(): void;
    detach(): void;
    update(): void;
    setOptions(options: any): void;
}

export function createIndicator(
    chart: IChartApi,
    mainSeries: ISeriesApi<any>,
    metadata: IndicatorMetadata,
    calculateFn: (data: any[], options: any) => any[],
    options?: any
): IndicatorControllerInterface;
```

The controller handles:
- ✅ Series creation with correct colors, styles, and pane placement
- ✅ Data subscription and automatic updates
- ✅ Lifecycle management (attach/detach)
- ✅ Pine color mapping
- ✅ Pane height management for non-overlay indicators

## Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Code per indicator | ~100 lines | ~10 lines | **90% reduction** |
| Color map duplication | Every indicator | Once in OakScriptJS | **N→1** |
| Bug fix propagation | Update all indicators | Update controller | **Instant** |
| New plot type support | Update all indicators | Update controller | **Single point** |

## Implementation Plan

**Phase 1: Core functionality**
- [ ] `IndicatorController` class with LineSeries support
- [ ] `createIndicator()` factory function
- [ ] Pine color → hex mapping
- [ ] Pane management (overlay vs separate)

**Phase 2: Plot styles**
- [ ] Support plot styles: histogram, area, circles, columns
- [ ] Map Pine `plot.style_*` to Lightweight Charts series types

**Phase 3: Advanced features**
- [ ] Multiple plots per indicator
- [ ] Plot fills and colors
- [ ] Custom pane heights

## Example Usage

**Complete working example:**

```javascript
// balance-of-power-calculation.js
export const indicatorMetadata = {
    title: 'Balance of Power',
    version: 6,
    overlay: false,
    description: 'Measures buyer vs seller strength',
    plots: [{
        varName: "bop",
        title: "Balance of Power",
        color: "red",
        linewidth: 2,
        style: "line"
    }]
};

export function calculateBalanceOfPowerIndicatorValues(data, options) {
    return data.map(item => ({
        time: item.time,
        value: (item.close - item.open) / (item.high - item.low)
    }));
}

// balance-of-power.js
import { createIndicator } from '@deepentropy/oakscriptjs';
import { calculateBalanceOfPowerIndicatorValues, indicatorMetadata } from './balance-of-power-calculation.js';

export function createBalanceOfPowerIndicator(chart, mainSeries, overlay, options = {}) {
    return createIndicator(
        chart,
        mainSeries,
        { ...indicatorMetadata, overlay },
        calculateBalanceOfPowerIndicatorValues,
        options
    );
}

// Usage in demo
const indicator = createBalanceOfPowerIndicator(chart, candlestickSeries, false);
indicator.attach();  // Creates red line series in separate pane
```

## Open Questions

1. **Multiple plots**: Should calculateFn return `any[]` (single dataset) or `Record<string, any[]>` (multiple datasets)?
2. **Plot types**: Start with just LineSeries or include Histogram/Area in Phase 1?
3. **Pane customization**: Should users be able to override default pane heights?

## References

- [Lightweight Charts Panes API](https://tradingview.github.io/lightweight-charts/docs/api#panes)
- [PineScript plot() reference](https://www.tradingview.com/pine-script-reference/v6/#fun_plot)
- Working implementation: [oakscript-engine/examples/indicators](https://github.com/deepentropy/oakscript-engine/tree/main/examples/indicators)

## Breaking Changes

None - this is a new addition. Existing code continues to work unchanged.

---

**Additional Context:**

This proposal comes from real-world experience building [oakscript-engine](https://github.com/deepentropy/oakscript-engine), a PineScript→TypeScript converter. After converting multiple indicators, the pattern became clear: 90% of the code is identical boilerplate that belongs in OakScriptJS.

The full detailed proposal is available here: [indicator-controller-proposal.md](https://github.com/deepentropy/oakscript-engine/blob/main/docs/proposals/indicator-controller-proposal.md)
