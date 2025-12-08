import {type IndicatorResult, type InputConfig, type PlotConfig, Series, ta} from 'oakscriptjs';

export interface IndicatorInputs {
    rsiLengthInput: number;
    rsiSourceInput: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
    maTypeInput: "None" | "SMA" | "SMA + Bollinger Bands" | "EMA" | "SMMA (RMA)" | "WMA" | "VWMA";
    maLengthInput: number;
    bbMultInput: number;
}

const defaultInputs: IndicatorInputs = {
    rsiLengthInput: 14,
    rsiSourceInput: "close",
    maTypeInput: "SMA",
    maLengthInput: 14,
    bbMultInput: 2,
};

export function Relative_Strength_Index(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
    const {rsiLengthInput, rsiSourceInput, maTypeInput, maLengthInput, bbMultInput} = {...defaultInputs, ...inputs};

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
    const rsiSource = (() => {
        switch (rsiSourceInput) {
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

    // RSI Calculation using ta.rsi
    const rsi = ta.rsi(rsiSource, rsiLengthInput);

    // Smoothing MA inputs
    const isBB = (maTypeInput === "SMA + Bollinger Bands");
    const enableMA = (maTypeInput !== "None");

    // Smoothing MA Calculation
    function ma(source: any, length: any, MAtype: any): any {
        switch (MAtype) {
            case "SMA":
                return ta.sma(source, length);
            case "SMA + Bollinger Bands":
                return ta.sma(source, length);
            case "EMA":
                return ta.ema(source, length);
            case "SMMA (RMA)":
                return ta.rma(source, length);
            case "WMA":
                return ta.wma(source, length);
            case "VWMA":
                return ta.vwma(source, length, volume);
            default:
                return ta.sma(source, length);
        }
    }

    // Smoothing MA plots
    const smoothingMA = enableMA ? ma(rsi, maLengthInput, maTypeInput) : new Series(bars, () => NaN);
    const smoothingStDev = isBB ? ta.stdev(rsi, maLengthInput).mul(bbMultInput) : new Series(bars, () => NaN);

    return {
        metadata: {title: "Relative Strength Index", shorttitle: "RSI", overlay: false},
        plots: {
            'plot0': rsi.toArray().map((v: number | undefined, i: number) => ({time: bars[i]!.time, value: v ?? NaN})),
            'plot1': smoothingMA.toArray().map((v: number | undefined, i: number) => ({
                time: bars[i]!.time,
                value: v ?? NaN
            })),
            'plot2': smoothingMA.add(smoothingStDev).toArray().map((v: number | undefined, i: number) => ({
                time: bars[i]!.time,
                value: v ?? NaN
            })),
            'plot3': smoothingMA.sub(smoothingStDev).toArray().map((v: number | undefined, i: number) => ({
                time: bars[i]!.time,
                value: v ?? NaN
            }))
        },
    };
}

// Additional exports for compatibility
export const metadata = {title: "Relative Strength Index", shortTitle: "RSI", overlay: false};
export {defaultInputs};
export const inputConfig: InputConfig[] = [
    {id: 'rsiLengthInput', type: 'int', title: 'RSI Length', defval: 14, min: 1},
    {id: 'rsiSourceInput', type: 'source', title: 'Source', defval: "close"},
    {
        id: 'maTypeInput',
        type: 'string',
        title: 'Type',
        defval: "SMA",
        options: ['None', 'SMA', 'SMA + Bollinger Bands', 'EMA', 'SMMA (RMA)', 'WMA', 'VWMA']
    },
    {id: 'maLengthInput', type: 'int', title: 'Length', defval: 14},
    {id: 'bbMultInput', type: 'float', title: 'BB StdDev', defval: 2, min: 0.001, max: 50, step: 0.5}
];
export const plotConfig: PlotConfig[] = [
    {id: 'plot0', title: 'RSI', color: '#7E57C2', lineWidth: 2},
    {id: 'plot1', title: 'RSI-based MA', color: '#FFFF00', lineWidth: 2, display: 'all', visible: 'enableMA'},
    {id: 'plot2', title: 'Upper Bollinger Band', color: '#00FF00', lineWidth: 2, display: 'all', visible: 'isBB'},
    {id: 'plot3', title: 'Lower Bollinger Band', color: '#00FF00', lineWidth: 2, display: 'all', visible: 'isBB'}
];
export const hlineConfig = [
    {id: 'hline0', value: 70, title: 'RSI Upper Band', color: '#787B86'},
    {id: 'hline1', value: 50, title: 'RSI Middle Band', color: '#787B86'},
    {id: 'hline2', value: 30, title: 'RSI Lower Band', color: '#787B86'}
];
export const calculate = Relative_Strength_Index;
export {Relative_Strength_Index as Relative_Strength_IndexIndicator};
export type Relative_Strength_IndexInputs = IndicatorInputs;
