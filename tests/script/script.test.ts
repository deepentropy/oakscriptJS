/**
 * Tests for the PineScript-style script API (src/script).
 */
import {
  executeScript,
  indicator,
  input,
  plot,
  hline,
  fill,
  alertcondition,
  ta,
  color,
  close,
  volume,
} from '../../src/script';
import type { Bar } from '../../src/types';

function makeBars(closes: number[]): Bar[] {
  return closes.map((c, i) => ({
    time: 1700000000 + i * 86400,
    open: c - 1,
    high: c + 1,
    low: c - 2,
    close: c,
    volume: 1000 + i,
  }));
}

const BARS = makeBars([100, 102, 101, 103, 105, 104, 106, 108, 107, 109]);

describe('executeScript', () => {
  test('collects metadata, inputs, plots and data for a simple SMA script', () => {
    const run = executeScript(() => {
      indicator('My SMA', { shorttitle: 'SMA', overlay: true });
      const length = input.int(3, 'Length', { minval: 1 });
      const src = input.source('close', 'Source');
      plot(ta.sma(src, length), 'SMA', { color: '#2962FF' });
    }, BARS);

    expect(run.metadata).toMatchObject({ title: 'My SMA', shortTitle: 'SMA', overlay: true });
    expect(run.inputConfig).toEqual([
      { id: 'length', type: 'int', defval: 3, title: 'Length', min: 1, max: undefined, step: undefined },
      { id: 'source', type: 'source', defval: 'close', title: 'Source' },
    ]);
    expect(run.defaultInputs).toEqual({ length: 3, source: 'close' });
    expect(run.plotConfig).toHaveLength(1);
    expect(run.plotConfig[0]).toMatchObject({ id: 'plot0', title: 'SMA', color: '#2962FF' });

    const data = run.result.plots['plot0']!;
    // SMA(3) has 2 warm-up NaN bars, filtered out of the plot data.
    expect(data).toHaveLength(BARS.length - 2);
    expect(data[0]!.time).toBe(BARS[2]!.time);
    expect(data[0]!.value).toBeCloseTo((100 + 102 + 101) / 3);
  });

  test('input values override defaults on re-run', () => {
    const body = () => {
      indicator('Len echo');
      const length = input.int(5, 'Length');
      plot(ta.sma(close, length), 'x');
    };
    const first = executeScript(body, BARS);
    const second = executeScript(body, BARS, { length: 2 });
    // Shorter length → fewer warm-up bars → more plotted points.
    expect(second.result.plots['plot0']!.length).toBeGreaterThan(first.result.plots['plot0']!.length);
  });

  test('context-bound builtins and ta.tr work without passing bars', () => {
    const run = executeScript(() => {
      indicator('TR', { overlay: false });
      const trueRange = ta.tr(true);
      const emaVol = ta.ema(volume, 3);
      plot(trueRange.div(emaVol), 'ratio');
    }, BARS);
    expect(run.result.plots['plot0']!.length).toBeGreaterThan(0);
  });

  test('per-bar colors from color.when land on the plot points', () => {
    const run = executeScript(() => {
      indicator('Colors', { overlay: false });
      const c = color.when(close.gt(103), color.green, color.red);
      plot(close, 'close', { color: c, style: 'histogram' });
    }, BARS);
    const data = run.result.plots['plot0']!;
    expect(data).toHaveLength(BARS.length);
    expect(data[0]!.color).toBe(color.red); // close=100
    expect(data[4]!.color).toBe(color.green); // close=105
  });

  test('hline and hline-to-hline fill produce configs', () => {
    const run = executeScript(() => {
      indicator('Bands', { overlay: false });
      plot(close, 'c');
      const upper = hline(70, 'Upper', { linestyle: 'dashed' });
      const lower = hline(30, 'Lower');
      fill(upper, lower, { color: 'rgba(126, 87, 194, 0.1)' });
    }, BARS);
    expect(run.hlineConfig).toHaveLength(2);
    expect(run.hlineConfig[0]).toMatchObject({ id: 'hline0', price: 70, linestyle: 'dashed' });
    expect(run.fillConfig).toHaveLength(1);
    expect(run.fillConfig[0]).toMatchObject({ plot1: 'hline0', plot2: 'hline1' });
  });

  test('plot-to-plot fill lands in result.fills', () => {
    const run = executeScript(() => {
      indicator('Cloud');
      const a = plot(ta.sma(close, 2), 'fast');
      const b = plot(ta.sma(close, 4), 'slow');
      fill(a, b, { color: 'rgba(0,0,0,0.1)' });
    }, BARS);
    expect(run.result.fills).toHaveLength(1);
    expect(run.result.fills![0]).toMatchObject({ plot1: 'plot0', plot2: 'plot1' });
  });

  test('alertcondition evaluates the last bar', () => {
    const run = executeScript(() => {
      indicator('Alert');
      plot(close, 'c');
      alertcondition(close.gt(0), 'Always', 'msg');
      alertcondition(close.lt(0), 'Never');
    }, BARS);
    expect(run.alertConfig).toHaveLength(2);
    expect(run.result.alerts).toEqual([
      { id: 'alert0', title: 'Always', message: 'msg', triggered: true },
      { id: 'alert1', title: 'Never', message: undefined, triggered: false },
    ]);
  });

  test('duplicate input titles get unique ids', () => {
    const run = executeScript(() => {
      indicator('Dups');
      input.int(1, 'Period');
      input.int(2, 'Period');
      plot(close, 'c');
    }, BARS);
    expect(run.inputConfig.map((i) => i.id)).toEqual(['period', 'period_2']);
  });

  test('script functions outside executeScript throw', () => {
    expect(() => indicator('nope')).toThrow(/executeScript/);
  });

  test('Series.pow computes elementwise powers', () => {
    const run = executeScript(() => {
      indicator('Pow');
      plot(close.pow(2), 'sq');
    }, BARS.slice(0, 2));
    expect(run.result.plots['plot0']![0]!.value).toBe(100 * 100);
  });

  test('re-running with the same bars reuses the module-level BarData', () => {
    const body = () => {
      indicator('KSI-ish', { overlay: false });
      const emaVolume = ta.ema(volume, 3);
      const ksi = emaVolume.gt(0).iff(ta.tr(true).pow(2).div(volume.mul(emaVolume)), 0).mul(1e6);
      plot(ksi, 'ksi', { style: 'histogram' });
    };
    const a = executeScript(body, BARS);
    const b = executeScript(body, BARS);
    expect(b.result.plots['plot0']).toEqual(a.result.plots['plot0']);
    // And different bars produce different values (context actually swaps).
    const c = executeScript(body, makeBars([50, 51, 52, 53, 54, 55]));
    expect(c.result.plots['plot0']).not.toEqual(a.result.plots['plot0']);
  });
});
