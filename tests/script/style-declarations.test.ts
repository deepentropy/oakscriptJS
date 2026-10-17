/**
 * Script API: what a host needs for the Style settings of a study — output ids on the per-bar data, `editable`,
 * the static colours / palettes of the declarations and the drawing kinds a run created.
 */
import {
  executeScript,
  indicator,
  plot,
  hline,
  fill,
  plotshape,
  plotchar,
  plotarrow,
  plotcandle,
  plotbar,
  bgcolor,
  barcolor,
  label,
  line,
  eachBar,
  color,
  open,
  high,
  low,
  close,
} from '../../src/script';
import type { Bar } from '../../src/types';

function makeBars(closes: number[]): Bar[] {
  return closes.map((c, i) => ({ time: 1700000000 + i * 86400, open: c - 1, high: c + 1, low: c - 2, close: c, volume: 1000 }));
}

const BARS = makeBars([100, 102, 101, 103, 105, 104, 106, 108, 107, 109]);

describe('output ids', () => {
  test('bgcolor / barcolor data carry the id of their declaration', () => {
    const run = executeScript(() => {
      indicator('Ids');
      bgcolor('rgba(0,0,255,0.1)', { title: 'Bg' });
      bgcolor(color.when(close.gt(105), 'red'));
      barcolor(color.when(close.gt(close.offset(1)), color.green, color.red));
    }, BARS);
    const ids = new Set(run.result.bgColors!.map((b) => b.id));
    expect(ids).toEqual(new Set(['bgcolor0', 'bgcolor1']));
    expect(run.result.barColors!.every((b) => b.id === 'barcolor0')).toBe(true);
  });

  test('every fill is in fillConfig; a fill between plots lists its id on its data', () => {
    const run = executeScript(() => {
      indicator('Fills');
      const a = plot(high, 'H');
      const b = plot(low, 'L');
      fill(a, b, 'rgba(255,0,0,0.2)', 'Band');
      const u = hline(110, 'U');
      const d = hline(90, 'D');
      fill(u, d, 'rgba(0,0,255,0.1)', 'Levels');
    }, BARS);
    expect(run.fillConfig.map((f) => [f.id, f.plot1, f.plot2, f.title, f.color])).toEqual([
      ['fill0', 'plot0', 'plot1', 'Band', 'rgba(255,0,0,0.2)'],
      ['fill1', 'hline0', 'hline1', 'Levels', 'rgba(0,0,255,0.1)'],
    ]);
    expect(run.result.fills).toHaveLength(1);
    expect(run.result.fills![0]).toMatchObject({ id: 'fill0', plot1: 'plot0', plot2: 'plot1' });
  });

  test('a gradient fill declares its top / bottom colours when they are the same on every bar', () => {
    const run = executeScript(() => {
      indicator('Gradient');
      const a = plot(close, 'C');
      const b = plot(close.add(5), 'C5');
      fill(a, b, 110, 100, 'rgba(76,175,80,1)', 'rgba(76,175,80,0)', 'Gradient');
      fill(a, b, 110, 100, color.when(close.gt(105), 'red', 'blue'), 'rgba(0,0,0,0)', 'Mixed');
    }, BARS);
    expect(run.fillConfig[0]).toMatchObject({ topColor: 'rgba(76,175,80,1)', bottomColor: 'rgba(76,175,80,0)' });
    expect(run.fillConfig[1].topColor).toBeUndefined();
    expect(run.fillConfig[1].bottomColor).toBe('rgba(0,0,0,0)');
  });
});

describe('editable', () => {
  test('editable = false is on the declarations; the default is left unset', () => {
    const run = executeScript(() => {
      indicator('Editable');
      const a = plot(close, 'Shown');
      const b = plot(open, 'Hidden', { editable: false });
      hline(100, 'Lvl', { editable: false });
      fill(a, b, 'red', 'F', false);
      plotshape(close.gt(105), 'S', { editable: false });
      plotchar(close.gt(105), 'C', { editable: false });
      plotarrow(close.sub(open), 'A', { editable: false });
      bgcolor('red', { editable: false });
      barcolor('blue', { editable: false });
      plotcandle(open, high, low, close, 'K', { editable: false });
      plotbar(open, high, low, close, 'B', { editable: false });
    }, BARS);
    expect(run.plotConfig.map((p) => p.editable)).toEqual([undefined, false]);
    expect(run.hlineConfig[0].editable).toBe(false);
    expect(run.fillConfig[0].editable).toBe(false);
    expect(run.shapeConfig.map((s) => s.editable)).toEqual([false, false]);
    expect(run.arrowConfig[0].editable).toBe(false);
    expect(run.barColorConfig.map((s) => s.editable)).toEqual([false, false]);
    expect(run.candleConfig.map((s) => s.editable)).toEqual([false, false]);
  });
});

describe('palettes', () => {
  test('a constant bgcolor / barcolor colour is a palette of one colour; per-bar colours have none', () => {
    const run = executeScript(() => {
      indicator('Palettes');
      bgcolor('rgba(41,98,255,0.1)');
      barcolor(color.when(close.gt(105), 'red', 'green'));
    }, BARS);
    expect(run.barColorConfig[0].palette).toEqual(['rgba(41,98,255,0.1)']);
    expect(run.barColorConfig[1].palette).toBeUndefined();
  });

  test('bgcolor / barcolor know their place among the outputs', () => {
    const run = executeScript(() => {
      indicator('Order');
      plot(close, 'A');
      bgcolor('red');
      plot(open, 'B');
      plotshape(close.gt(105), 'S');
      barcolor('blue');
    }, BARS);
    expect(run.barColorConfig.map((b) => b.outputIndex)).toEqual([1, 3]);
  });
});

describe('drawing kinds', () => {
  test('the kinds created during the run, deleted ones included', () => {
    const run = executeScript(() => {
      indicator('Drawings');
      eachBar((b) => {
        if (b.i === 2) label.delete(label.new(b.i, b.close, 'x'));
        if (b.i === b.n - 1) line.new(0, 100, b.i, 110);
      });
    }, BARS);
    expect(new Set(run.drawingKinds)).toEqual(new Set(['label', 'line']));
    expect(run.result.labels ?? []).toHaveLength(0);
  });

  test('none without drawings', () => {
    const run = executeScript(() => {
      indicator('None');
      plot(close, 'C');
    }, BARS);
    expect(run.drawingKinds).toEqual([]);
  });
});

describe('default titles', () => {
  test('untitled outputs get the names the PineScript compiler gives them', () => {
    const run = executeScript(() => {
      indicator('Untitled');
      const a = plot(high);
      const b = plot(low);
      fill(a, b, 'red');
      const u = hline(110);
      const d = hline(90);
      fill(u, d, 'blue');
      plotshape(close.gt(105));
      plotchar(close.gt(105));
      plotarrow(close.sub(open));
      bgcolor('red');
      barcolor('blue');
      plotcandle(open, high, low, close);
      plotbar(open, high, low, close);
    }, BARS);
    expect(run.plotConfig.map((p) => p.title)).toEqual(['Plot', 'Plot']);
    expect(run.hlineConfig.map((h) => h.title)).toEqual(['Level', 'Level']);
    expect(run.fillConfig.map((f) => f.title)).toEqual(['Plots Background', 'Hlines Background']);
    expect(run.shapeConfig.map((s) => s.title)).toEqual(['Shapes', 'Chars']);
    expect(run.arrowConfig[0].title).toBe('Arrows');
    expect(run.barColorConfig.map((x) => x.title)).toEqual(['Background Color', 'Bar Color']);
    expect(run.candleConfig.map((x) => x.title)).toEqual(['PlotCandle', 'PlotBar']);
    expect(run.outputs.map((o) => o.title)).toEqual(['Plot', 'Plot', 'Shapes', 'Chars', 'Arrows', 'PlotCandle', 'PlotBar']);
  });
});
