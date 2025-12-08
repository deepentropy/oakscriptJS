import {type IndicatorResult, type InputConfig, type PlotConfig, Series, ta} from 'oakscriptjs';

export interface IndicatorInputs {
    length: number;
    smoothing: "RMA" | "SMA" | "EMA" | "WMA";
}

const defaultInputs: IndicatorInputs = {
    length: 14,
    smoothing: "RMA",
};

export function Average_True_Range(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
    const {length, smoothing} = {...defaultInputs, ...inputs};

    // OHLCV Series
    const high = new Series(bars, (bar) => bar.high);
    const low = new Series(bars, (bar) => bar.low);
    const close = new Series(bars, (bar) => bar.close);

    // True Range calculation with handle_na=true (matches PineScript ta.tr(true))
    // TR = max(high - low, |high - close[1]|, |low - close[1]|)
    // When previous close is NaN, use high - low
    const trValues: number[] = [];
    for (let i = 0; i < bars.length; i++) {
        const h = bars[i].high;
        const l = bars[i].low;
        const prevClose = i > 0 ? bars[i - 1].close : NaN;

        if (i === 0 || isNaN(prevClose)) {
            // handle_na=true: use high - low when no previous close
            trValues.push(h - l);
        } else {
            const tr = Math.max(
                h - l,
                Math.abs(h - prevClose),
                Math.abs(l - prevClose)
            );
            trValues.push(tr);
        }
    }
    const trueRange = Series.fromArray(bars, trValues);

    // MA function based on smoothing selection
    function ma(source: Series, len: number, type: string): Series {
        switch (type) {
            case "RMA":
                return ta.rma(source, len);
            case "SMA":
                return ta.sma(source, len);
            case "EMA":
                return ta.ema(source, len);
            case "WMA":
                return ta.wma(source, len);
            default:
                return ta.rma(source, len);
        }
    }

    // ATR = smoothed True Range
    const atrResult = ma(trueRange, length, smoothing);

    return {
        metadata: {title: "Average True Range", shorttitle: "ATR", overlay: false},
        plots: {
            'plot0': atrResult.toArray().map((v: number | undefined, i: number) => ({
                time: bars[i]!.time,
                value: v ?? NaN
            }))
        },
    };
}

// Additional exports for compatibility
export const metadata = {title: "Average True Range", shortTitle: "ATR", overlay: false};
export {defaultInputs};
export const inputConfig: InputConfig[] = [
    {id: 'length', type: 'int', title: 'Length', defval: 14, min: 1},
    {id: 'smoothing', type: 'string', title: 'Smoothing', defval: "RMA", options: ['RMA', 'SMA', 'EMA', 'WMA']}
];
export const plotConfig: PlotConfig[] = [
    {id: 'plot0', title: 'ATR', color: '#B71C1C', lineWidth: 2}
];
export const calculate = Average_True_Range;
export {Average_True_Range as Average_True_RangeIndicator};
export type Average_True_RangeInputs = IndicatorInputs;
