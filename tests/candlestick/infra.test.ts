/**
 * Infrastructure tests for the candlestick pattern port: shared candle props,
 * the generic pattern runner, and the three exemplar patterns against
 * synthetic bars that form the pattern by construction.
 */
import { executeScript } from '../../src/script';
import type { Bar } from '../../src/types';
import { patternScript } from '../../candlestick-port/code/pattern-runner';
import { engulfingBullish } from '../../candlestick-port/code/patterns/engulfing-bullish';
import { doji } from '../../candlestick-port/code/patterns/doji';
import { morningStarBullish } from '../../candlestick-port/code/patterns/morning-star-bullish';

function bar(i: number, open: number, high: number, low: number, close: number): Bar {
  return { time: 1700000000 + i * 86400, open, high, low, close, volume: 1000 };
}

/** Small-body noise bars so ta.ema(body, 14) has warmed up before the pattern. */
function noiseBars(count: number, level = 100): Bar[] {
  const bars: Bar[] = [];
  for (let i = 0; i < count; i++) {
    const o = level + (i % 2 === 0 ? 0.2 : -0.2);
    const c = level + (i % 2 === 0 ? -0.2 : 0.2);
    bars.push(bar(i, o, Math.max(o, c) + 0.3, Math.min(o, c) - 0.3, c));
  }
  return bars;
}

const NO_TREND = { detect_trend_based_on: 'No detection' };

describe('candlestick port infrastructure', () => {
  test('engulfing bullish triggers on a constructed engulfing pair', () => {
    const bars = noiseBars(28);
    // bar 28: small black body (below the 0.4 noise body average);
    // bar 29: long white body engulfing it
    bars.push(bar(28, 100.1, 100.4, 99.6, 99.9)); // black, body 0.2
    bars.push(bar(29, 99.5, 104.5, 99.2, 104.0)); // white, body 4.5, engulfs
    // trailing bars so the bgcolor windows after the pattern exist (as on a
    // historical chart in Pine); tiny bodies, no further trigger
    bars.push(bar(30, 104.1, 104.4, 103.6, 103.9));
    bars.push(bar(31, 103.9, 104.4, 103.6, 104.1));
    const run = executeScript(() => patternScript(engulfingBullish), bars, NO_TREND);

    const markers = run.result.markers!;
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      time: bars[29]!.time,
      text: 'BE',
      style: 'labelup',
      location: 'belowbar',
    });
    // background: 2 candles highlighted, shifted back by 1
    const bg = run.result.bgcolors!;
    const bgTimes = bg.map((x) => x.time);
    expect(bgTimes).toContain(bars[28]!.time);
    expect(bgTimes).toContain(bars[29]!.time);
    // alert is declared; it evaluates the LAST bar, which is a trailing noise
    // bar here, so it is not triggered
    expect(run.alertConfig).toHaveLength(1);
    expect(run.result.alerts![0]!.triggered).toBe(false);
    // declared inputs: trend rule + label color
    expect(run.inputConfig.map((i) => i.type)).toEqual(['string', 'color']);
  });

  test('doji triggers on an open==close bar with equal shadows', () => {
    const bars = noiseBars(25);
    bars.push(bar(25, 100, 101, 99, 100)); // perfect doji
    const run = executeScript(() => patternScript(doji), bars);
    const markers = run.result.markers!;
    expect(markers.map((m) => m.time)).toContain(bars[25]!.time);
    // no trend input for neutral single-candle doji
    expect(run.inputConfig.map((i) => i.type)).toEqual(['color']);
  });

  test('morning star triggers on a constructed three-candle reversal', () => {
    const bars = noiseBars(28, 110);
    // long black, gapped-down small candle, long white closing into candle 1 body
    bars.push(bar(28, 110.5, 110.8, 104.9, 105.0)); // long black body 5.5
    bars.push(bar(29, 104.2, 104.5, 103.6, 103.9)); // small body below bodyLo[2]=105
    bars.push(bar(30, 104.6, 109.4, 104.4, 109.2)); // long white, bodyHi 109.2 in [107.75, 110.5)
    // trailing bars so the bgcolor windows after the pattern exist
    bars.push(bar(31, 109.1, 109.5, 108.7, 108.9));
    bars.push(bar(32, 108.9, 109.5, 108.7, 109.1));
    bars.push(bar(33, 109.1, 109.5, 108.7, 108.9));
    const run = executeScript(() => patternScript(morningStarBullish), bars, NO_TREND);
    const markers = run.result.markers!;
    expect(markers).toHaveLength(1);
    expect(markers[0]!.time).toBe(bars[30]!.time);
    // 3-candle highlight
    const bgTimes = run.result.bgcolors!.map((x) => x.time);
    expect(bgTimes).toEqual(expect.arrayContaining([bars[28]!.time, bars[29]!.time, bars[30]!.time]));
  });

  test('no false positive on plain noise bars', () => {
    const run = executeScript(() => patternScript(engulfingBullish), noiseBars(60), NO_TREND);
    expect(run.result.markers).toBeUndefined();
  });
});
