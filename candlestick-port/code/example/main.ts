/**
 * Example: run the "*All Candlestick Patterns*" composite over synthetic bars
 * and render the Tier 1 outputs (markers, background highlights) on a
 * lightweight-charts v5 candlestick chart.
 */
import { createChart, CandlestickSeries, type UTCTimestamp } from 'lightweight-charts';
import { executeScript, type Bar } from '../../../src/script';
import { allPatternsScript } from '../index';
import { applyMarkers, BgColorPrimitive } from './render';

/** Deterministic OHLC walk with two hand-planted patterns. */
function makeBars(count: number): Bar[] {
  const bars: Bar[] = [];
  let level = 100;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const t0 = 1700000000;
  for (let i = 0; i < count; i++) {
    const open = level;
    const drift = (rnd() - 0.5) * 3;
    const close = Math.max(1, open + drift);
    const high = Math.max(open, close) + rnd() * 1.5;
    const low = Math.max(0.5, Math.min(open, close) - rnd() * 1.5);
    bars.push({ time: t0 + i * 86400, open, high, low, close, volume: 1000 + i });
    level = close;
  }
  // plant a textbook bullish engulfing pair
  const j = Math.floor(count * 0.6);
  const base = bars[j - 1]!.close;
  bars[j] = { time: t0 + j * 86400, open: base + 0.1, high: base + 0.3, low: base - 0.4, close: base - 0.2, volume: 1500 };
  bars[j + 1] = { time: t0 + (j + 1) * 86400, open: base - 0.4, high: base + 5.2, low: base - 0.6, close: base + 5.0, volume: 2500 };
  for (let k = j + 2; k < count; k++) {
    const prev = bars[k - 1]!.close;
    const open = prev;
    const close = Math.max(1, prev + (rnd() - 0.5) * 3);
    bars[k] = {
      time: t0 + k * 86400,
      open,
      high: Math.max(open, close) + rnd() * 1.5,
      low: Math.max(0.5, Math.min(open, close) - rnd() * 1.5),
      close,
      volume: 1000 + k,
    };
  }
  // plant a doji
  const d = Math.floor(count * 0.3);
  const lvl = bars[d - 1]!.close;
  bars[d] = { time: t0 + d * 86400, open: lvl, high: lvl + 1, low: lvl - 1, close: lvl, volume: 1200 };
  if (bars[d + 1]) bars[d + 1] = { ...bars[d + 1]!, open: lvl };
  return bars;
}

const bars = makeBars(150);
const run = executeScript(allPatternsScript, bars);

const container = document.getElementById('chart')!;
const chart = createChart(container, {
  width: 1000,
  height: 520,
  layout: { background: { color: '#FFFFFF' }, textColor: '#191919' },
  grid: { vertLines: { color: '#F0F3FA' }, horzLines: { color: '#F0F3FA' } },
});
const series = chart.addSeries(CandlestickSeries, {
  upColor: '#089981',
  downColor: '#F23645',
  borderVisible: false,
  wickUpColor: '#089981',
  wickDownColor: '#F23645',
});
series.setData(
  bars.map((b) => ({
    time: b.time as UTCTimestamp,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  }))
);

if (run.result.bgcolors) series.attachPrimitive(new BgColorPrimitive(run.result.bgcolors));
if (run.result.markers) applyMarkers(series, run.result.markers);
chart.timeScale().fitContent();

const info = document.getElementById('info')!;
info.textContent =
  `${run.metadata.title}: ${run.result.markers?.length ?? 0} markers, ` +
  `${run.result.bgcolors?.length ?? 0} highlighted bars ` +
  `(patterns detected: ${[...new Set(run.result.markers?.map((m) => m.text))].join(', ')})`;
