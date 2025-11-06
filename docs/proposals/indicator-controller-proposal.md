# Proposal: Add Indicator Controller to OakScriptJS

## Summary

Add a standardized `IndicatorController` class and `createIndicator()` factory function to OakScriptJS to handle plot functionality and indicator metadata management across all indicators.

## Motivation

Currently, every indicator that uses OakScriptJS with Lightweight Charts needs to implement the same boilerplate code:

- Pine color to hex conversion
- Series creation and management
- Pane index calculation (overlay vs separate pane)
- Data subscription and updates
- Attach/detach lifecycle
- Options management

This leads to:
- **Code duplication**: Every indicator has ~100 lines of identical logic
- **Inconsistency**: Different implementations may handle edge cases differently
- **Maintenance burden**: Bug fixes must be applied to every indicator
- **Harder to extend**: Adding new plot types (histograms, areas, etc.) requires updating all indicators

## Proposed Solution

Add an `IndicatorController` class to OakScriptJS that encapsulates all common indicator functionality.

### API Design

```typescript
// In @deepentropy/oakscriptjs

export interface PlotMetadata {
    varName: string;
    title: string;
    color: string;
    linewidth: number;
    style: 'line' | 'stepline' | 'histogram' | 'area' | 'circles' | 'columns';
}

export interface IndicatorMetadata {
    title: string;
    version: number;
    overlay: boolean;
    description: string;
    plots: PlotMetadata[];
}

export interface IndicatorControllerInterface {
    attach(): void;
    detach(): void;
    update(): void;
    setOptions(options: any): void;
}

export class IndicatorController implements IndicatorControllerInterface {
    private chart: IChartApi;
    private mainSeries: ISeriesApi<any>;
    private metadata: IndicatorMetadata;
    private calculateFn: (data: any[], options: any) => any[];
    private options: any;
    private series: ISeriesApi<any>[] = [];
    private attached: boolean = false;

    constructor(
        chart: IChartApi,
        mainSeries: ISeriesApi<any>,
        metadata: IndicatorMetadata,
        calculateFn: (data: any[], options: any) => any[],
        options: any = {}
    ) {
        this.chart = chart;
        this.mainSeries = mainSeries;
        this.metadata = metadata;
        this.calculateFn = calculateFn;
        this.options = options;
    }

    attach(): void {
        if (this.attached) return;

        const paneIndex = this.metadata.overlay ? 0 : 1;

        // Create series for each plot
        this.metadata.plots.forEach((plot, idx) => {
            const seriesOptions = this.createSeriesOptions(plot);
            const seriesType = this.getSeriesType(plot.style);

            const series = this.chart.addSeries(seriesType, seriesOptions, paneIndex);
            this.series[idx] = series;
        });

        // Subscribe to data changes
        this.mainSeries.subscribeDataChanged(this.update);

        this.attached = true;
        this.update();

        // Set pane heights if not overlay
        if (!this.metadata.overlay) {
            const panes = this.chart.panes();
            if (panes.length > 1) {
                panes[0].setHeight(400);  // Main chart
                panes[1].setHeight(200);  // Indicator
            }
        }
    }

    detach(): void {
        if (!this.attached) return;

        // Unsubscribe from data changes
        this.mainSeries.unsubscribeDataChanged(this.update);

        // Remove all series
        this.series.forEach(series => {
            if (series) {
                this.chart.removeSeries(series);
            }
        });
        this.series = [];

        this.attached = false;
    }

    update = (): void => {
        if (!this.attached) return;

        const sourceData = this.mainSeries.data();
        const indicatorValues = this.calculateFn(sourceData, this.options);

        // For single plot indicators
        if (this.series[0] && indicatorValues) {
            this.series[0].setData(indicatorValues);
        }

        // TODO: Handle multiple plots (would need calculateFn to return array of datasets)
    }

    setOptions(newOptions: any): void {
        this.options = { ...this.options, ...newOptions };
        this.update();
    }

    private createSeriesOptions(plot: PlotMetadata): any {
        return {
            color: this.pineColorToHex(plot.color),
            lineWidth: plot.linewidth || 2,
            title: plot.title,
        };
    }

    private getSeriesType(style: string): any {
        // Map Pine plot styles to Lightweight Charts series types
        switch (style) {
            case 'histogram':
                return HistogramSeries;
            case 'area':
                return AreaSeries;
            case 'line':
            default:
                return LineSeries;
        }
    }

    private pineColorToHex(color: string): string {
        const colorMap: Record<string, string> = {
            red: '#FF0000',
            green: '#00FF00',
            blue: '#0000FF',
            yellow: '#FFFF00',
            orange: '#FFA500',
            purple: '#800080',
            white: '#FFFFFF',
            black: '#000000',
            gray: '#808080',
            aqua: '#00FFFF',
            lime: '#00FF00',
            maroon: '#800000',
            navy: '#000080',
            olive: '#808000',
            teal: '#008080',
            fuchsia: '#FF00FF',
            silver: '#C0C0C0'
        };
        return colorMap[color] || '#2962FF';
    }
}

/**
 * Factory function to create an indicator controller
 */
export function createIndicator(
    chart: IChartApi,
    mainSeries: ISeriesApi<any>,
    metadata: IndicatorMetadata,
    calculateFn: (data: any[], options: any) => any[],
    options: any = {}
): IndicatorControllerInterface {
    return new IndicatorController(chart, mainSeries, metadata, calculateFn, options);
}
```

### Usage Example

**Before** (current approach - ~100 lines):
```javascript
export function createBalanceOfPowerIndicator(chart, mainSeries, overlay, options = {}) {
    const plots = indicatorMetadata.plots || [];
    let _series = [];
    let _chart = chart;
    let _mainSeries = mainSeries;
    let _overlay = overlay;
    let _options = options;
    let _attached = false;

    const pineColorToHex = { /* 17 colors */ };

    const attach = () => {
        if (_attached) return;
        const paneIndex = _overlay ? 0 : 1;
        plots.forEach((plot, idx) => {
            const color = pineColorToHex[plot.color] || '#2962FF';
            const series = _chart.addSeries(LightweightCharts.LineSeries, {
                color: color,
                lineWidth: plot.linewidth || 2,
                title: plot.title,
            }, paneIndex);
            _series[idx] = series;
        });
        _mainSeries.subscribeDataChanged(update);
        _attached = true;
        update();
    };

    const detach = () => { /* ... */ };
    const update = () => { /* ... */ };
    const setOptions = (newOptions) => { /* ... */ };

    return { attach, detach, update, setOptions };
}
```

**After** (with OakScriptJS IndicatorController - ~10 lines):
```javascript
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
```

## Benefits

1. **Reduced code size**: 90% reduction in generated indicator code
2. **Consistency**: All indicators use the same battle-tested implementation
3. **Easier maintenance**: Bug fixes and features added in one place
4. **Better extensibility**: New plot types can be added to the controller
5. **Improved testing**: Single controller can be thoroughly tested
6. **Better documentation**: One well-documented API vs scattered implementations

## Implementation Plan

1. **Phase 1**: Implement `IndicatorController` class with basic line series support
2. **Phase 2**: Add support for multiple plot styles (histogram, area, etc.)
3. **Phase 3**: Add support for multiple plots per indicator
4. **Phase 4**: Add advanced features (custom colors, plot fills, etc.)

## Breaking Changes

None - this is a new addition. Existing code continues to work.

## Alternative Approaches Considered

1. **Keep in each indicator**: Rejected due to duplication and maintenance burden
2. **Separate utility library**: Rejected because it logically belongs in OakScriptJS as the bridge between Pine calculations and chart rendering
3. **Use Lightweight Charts primitives**: Rejected because it doesn't provide Pine-specific abstractions

## Open Questions

1. Should multiple plots return an array of datasets or a single object with named properties?
2. How to handle advanced plot features like `plotshape()`, `plotchar()`, etc.?
3. Should the controller support custom pane height ratios?

## References

- [Lightweight Charts Panes Documentation](https://tradingview.github.io/lightweight-charts/docs/api#panes)
- [PineScript v6 plot() function](https://www.tradingview.com/pine-script-reference/v6/#fun_plot)
- Current implementation: `oakscript-engine/examples/indicators/balance-of-power.js`
