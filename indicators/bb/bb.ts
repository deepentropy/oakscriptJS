import {type IndicatorResult, type InputConfig, type PlotConfig, Series, ta} from 'oakscriptjs';

export interface IndicatorInputs {
    length: number;
    maType: "SMA" | "EMA" | "SMMA (RMA)" | "WMA" | "VWMA";
    src: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
    mult: number;
}

const defaultInputs: IndicatorInputs = {
    length: 20,
    maType: "SMA",
    src: "close",
    mult: 2.0,
};

export function Bollinger_Bands(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
    const {length, maType, src, mult} = {...defaultInputs, ...inputs};

    // OHLCV Series
    const open = new Series(bars, (bar) => bar.open);
    const high = new Series(bars, (bar) => bar.high);
    const low = new Series(bars, (bar) => bar.low);
    const close = new Series(bars, (bar) => bar.close);
    const volume = new Series(bars, (bar) => bar.volume ?? 0);

    // Calculated price sources
    const hl2 = high.add(low).div(2);
    const hlc3 = high.add(low).add(close).div(3);
    const ohlc4 = open.add(high).add(low).add(close).div(4);
    const hlcc4 = high.add(low).add(close).add(close).div(4);

    // Map source inputs to Series
    const srcSeries = (() => {
        switch (src) {
            case "open":
                return open;
            case "high":
                return high;
            case "low":
                return low;
            case "close":
                return close;
            case "hl2":
                return hl2;
            case "hlc3":
                return hlc3;
            case "ohlc4":
                return ohlc4;
            case "hlcc4":
                return hlcc4;
            default:
                return close;
        }
    })();

    // MA function based on type
    // ma(source, length, _type) =>
    //     switch _type
    //         "SMA" => ta.sma(source, length)
    //         "EMA" => ta.ema(source, length)
    //         "SMMA (RMA)" => ta.rma(source, length)
    //         "WMA" => ta.wma(source, length)
    //         "VWMA" => ta.vwma(source, length)
    function ma(source: Series, len: number, type: string): Series {
        switch (type) {
            case "SMA":
                return ta.sma(source, len);
            case "EMA":
                return ta.ema(source, len);
            case "SMMA (RMA)":
                return ta.rma(source, len);
            case "WMA":
                return ta.wma(source, len);
            case "VWMA":
                return ta.vwma(source, len, volume);
            default:
                return ta.sma(source, len);
        }
    }

    // basis = ma(src, length, maType)
    // dev = mult * ta.stdev(src, length)
    // upper = basis + dev
    // lower = basis - dev
    const basis = ma(srcSeries, length, maType);
    const dev = ta.stdev(srcSeries, length).mul(mult);
    const upper = basis.add(dev);
    const lower = basis.sub(dev);

    return {
        metadata: {title: "Bollinger Bands", shorttitle: "BB", overlay: true},
        plots: {
            'plot0': basis.toArray().map((v: number | undefined, i: number) => ({
                time: bars[i]!.time,
                value: v ?? NaN
            })),
            'plot1': upper.toArray().map((v: number | undefined, i: number) => ({
                time: bars[i]!.time,
                value: v ?? NaN
            })),
            'plot2': lower.toArray().map((v: number | undefined, i: number) => ({
                time: bars[i]!.time,
                value: v ?? NaN
            })),
        },
    };
}

// Additional exports for compatibility
export const metadata = {title: "Bollinger Bands", shortTitle: "BB", overlay: true};
export {defaultInputs};
export const inputConfig: InputConfig[] = [
    {id: 'length', type: 'int', title: 'Length', defval: 20, min: 1},
    {
        id: 'maType',
        type: 'string',
        title: 'Basis MA Type',
        defval: "SMA",
        options: ['SMA', 'EMA', 'SMMA (RMA)', 'WMA', 'VWMA']
    },
    {id: 'src', type: 'source', title: 'Source', defval: "close"},
    {id: 'mult', type: 'float', title: 'StdDev', defval: 2.0, min: 0.001, max: 50},
];
export const plotConfig: PlotConfig[] = [
    {id: 'plot0', title: 'Basis', color: '#2962FF', lineWidth: 2},
    {id: 'plot1', title: 'Upper', color: '#F23645', lineWidth: 2},
    {id: 'plot2', title: 'Lower', color: '#089981', lineWidth: 2},
];
export const calculate = Bollinger_Bands;
export {Bollinger_Bands as Bollinger_BandsIndicator};
export type Bollinger_BandsInputs = IndicatorInputs;
