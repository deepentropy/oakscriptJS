import {type IndicatorResult, type InputConfig, type PlotConfig, Series, ta} from 'oakscriptjs';

export interface IndicatorInputs {
    periodK: number;
    smoothK: number;
    periodD: number;
}

const defaultInputs: IndicatorInputs = {
    periodK: 14,
    smoothK: 1,
    periodD: 3,
};

export function Stochastic(bars: any[], inputs: Partial<IndicatorInputs> = {}): IndicatorResult {
    const {periodK, smoothK, periodD} = {...defaultInputs, ...inputs};

    // OHLCV Series
    const high = new Series(bars, (bar) => bar.high);
    const low = new Series(bars, (bar) => bar.low);
    const close = new Series(bars, (bar) => bar.close);

    // ta.stoch(close, high, low, periodK) = 100 * (close - lowest(low, periodK)) / (highest(high, periodK) - lowest(low, periodK))
    // Since ta.stoch isn't in ta-series, we implement it manually using Series operations
    const lowestLow = ta.lowest(low, periodK);
    const highestHigh = ta.highest(high, periodK);

    // stoch = 100 * (close - lowestLow) / (highestHigh - lowestLow)
    const range = highestHigh.sub(lowestLow);
    const stochRaw = close.sub(lowestLow).div(range).mul(100);

    // k = ta.sma(stoch, smoothK)
    // d = ta.sma(k, periodD)
    const k = ta.sma(stochRaw, smoothK);
    const d = ta.sma(k, periodD);

    return {
        metadata: {title: "Stochastic", shorttitle: "Stoch", overlay: false},
        plots: {
            'plot0': k.toArray().map((v: number | undefined, i: number) => ({time: bars[i]!.time, value: v ?? NaN})),
            'plot1': d.toArray().map((v: number | undefined, i: number) => ({time: bars[i]!.time, value: v ?? NaN})),
        },
    };
}

// Additional exports for compatibility
export const metadata = {title: "Stochastic", shortTitle: "Stoch", overlay: false};
export {defaultInputs};
export const inputConfig: InputConfig[] = [
    {id: 'periodK', type: 'int', title: '%K Length', defval: 14, min: 1},
    {id: 'smoothK', type: 'int', title: '%K Smoothing', defval: 1, min: 1},
    {id: 'periodD', type: 'int', title: '%D Smoothing', defval: 3, min: 1},
];
export const plotConfig: PlotConfig[] = [
    {id: 'plot0', title: '%K', color: '#2962FF', lineWidth: 2},
    {id: 'plot1', title: '%D', color: '#FF6D00', lineWidth: 2},
];
export const hlineConfig = [
    {id: 'hline0', value: 80, title: 'Upper Band', color: '#787B86'},
    {id: 'hline1', value: 50, title: 'Middle Band', color: '#787B86'},
    {id: 'hline2', value: 20, title: 'Lower Band', color: '#787B86'},
];
export const calculate = Stochastic;
export {Stochastic as StochasticIndicator};
export type StochasticInputs = IndicatorInputs;
