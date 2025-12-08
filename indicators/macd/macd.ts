import {type IndicatorResult, type InputConfig, type PlotConfig, Series, ta} from 'oakscriptjs';

export interface IndicatorInputs {
    fast_length: number;
    slow_length: number;
    src: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
    signal_length: number;
    sma_source: "SMA" | "EMA";
    sma_signal: "SMA" | "EMA";
}

const defaultInputs: IndicatorInputs = {
    fast_length: 12,
    slow_length: 26,
    src: "close",
    signal_length: 9,
    sma_source: "EMA",
    sma_signal: "EMA",
};

export function Moving_Average_Convergence_Divergence(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
    const {fast_length, slow_length, src, signal_length, sma_source, sma_signal} = {...defaultInputs, ...inputs};

    // OHLCV Series
    const open = new Series(bars, (bar) => bar.open);
    const high = new Series(bars, (bar) => bar.high);
    const low = new Series(bars, (bar) => bar.low);
    const close = new Series(bars, (bar) => bar.close);

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

    // Calculating MACD
    // fast_ma = sma_source == "SMA" ? ta.sma(src, fast_length) : ta.ema(src, fast_length)
    // slow_ma = sma_source == "SMA" ? ta.sma(src, slow_length) : ta.ema(src, slow_length)
    // macd = fast_ma - slow_ma
    // signal = sma_signal == "SMA" ? ta.sma(macd, signal_length) : ta.ema(macd, signal_length)
    // hist = macd - signal

    const fast_ma = sma_source === "SMA" ? ta.sma(srcSeries, fast_length) : ta.ema(srcSeries, fast_length);
    const slow_ma = sma_source === "SMA" ? ta.sma(srcSeries, slow_length) : ta.ema(srcSeries, slow_length);
    const macd = fast_ma.sub(slow_ma);
    const signal = sma_signal === "SMA" ? ta.sma(macd, signal_length) : ta.ema(macd, signal_length);
    const hist = macd.sub(signal);

    return {
        metadata: {title: "Moving Average Convergence Divergence", shorttitle: "MACD", overlay: false},
        plots: {
            'plot0': hist.toArray().map((v: number | undefined, i: number) => ({time: bars[i]!.time, value: v ?? NaN})),
            'plot1': macd.toArray().map((v: number | undefined, i: number) => ({time: bars[i]!.time, value: v ?? NaN})),
            'plot2': signal.toArray().map((v: number | undefined, i: number) => ({
                time: bars[i]!.time,
                value: v ?? NaN
            })),
        },
    };
}

// Additional exports for compatibility
export const metadata = {title: "Moving Average Convergence Divergence", shortTitle: "MACD", overlay: false};
export {defaultInputs};
export const inputConfig: InputConfig[] = [
    {id: 'fast_length', type: 'int', title: 'Fast Length', defval: 12},
    {id: 'slow_length', type: 'int', title: 'Slow Length', defval: 26},
    {id: 'src', type: 'source', title: 'Source', defval: "close"},
    {id: 'signal_length', type: 'int', title: 'Signal Smoothing', defval: 9, min: 1, max: 50},
    {id: 'sma_source', type: 'string', title: 'Oscillator MA Type', defval: "EMA", options: ['SMA', 'EMA']},
    {id: 'sma_signal', type: 'string', title: 'Signal Line MA Type', defval: "EMA", options: ['SMA', 'EMA']},
];
export const plotConfig: PlotConfig[] = [
    {id: 'plot0', title: 'Histogram', color: '#26A69A', lineWidth: 2},
    {id: 'plot1', title: 'MACD', color: '#2962FF', lineWidth: 2},
    {id: 'plot2', title: 'Signal', color: '#FF6D00', lineWidth: 2},
];
export const hlineConfig = [
    {id: 'hline0', value: 0, title: 'Zero Line', color: '#787B86'},
];
export const calculate = Moving_Average_Convergence_Divergence;
export {Moving_Average_Convergence_Divergence as Moving_Average_Convergence_DivergenceIndicator};
export type Moving_Average_Convergence_DivergenceInputs = IndicatorInputs;
