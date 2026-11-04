/**
 * PineScript call forms of the script API: named arguments of the drawing functions, Series arguments read on the
 * current bar in a bar loop, ta.vwma with the chart volume, input.source(close), input.price, bar_index /
 * last_bar_index, plot(offset).
 */
import {
  bar_index, box, chart, close, color, eachBar, executeScript, extend, high, indicator, input, label, last_bar_index,
  line, linefill, low, plot, polyline, position, size, ta, table, volume, xloc,
} from '../../src/script';
import { syntheticBars, testChart } from '../../src/check/harness';

const BARS = syntheticBars(60);
const run = (body: () => void, inputs: Record<string, unknown> = {}) => executeScript(body, BARS, inputs, testChart(BARS));
const last = (body: (c: { i: number; n: number; high: number; low: number; close: number }) => void) =>
  run(() => {
    indicator('D', { overlay: true });
    eachBar((c) => {
      if (c.i === c.n - 1) body(c);
    });
  }).result;

describe('named arguments of the drawing functions', () => {
  it('label.new: positional then named, all named, with a chart point', () => {
    const r = last((c) => {
      label.new(c.i, c.high, 'A', { style: label.style_label_down, textcolor: color.white, size: size.large });
      label.new({ x: c.i - 1, y: c.low, text: 'B', yloc: 'belowbar' });
      label.new(chart.point.from_index(c.i - 2, c.close), { text: 'C', color: color.red });
    });
    expect(r.labels!.map((l) => [l.text, l.style, l.size, l.yloc])).toEqual([
      ['A', 'label_down', 'large', 'price'],
      ['B', undefined, undefined, 'belowbar'],
      ['C', undefined, undefined, 'price'],
    ]);
    expect(r.labels![0]).toMatchObject({ textColor: expect.stringMatching(/^#FFFFFF/i) });
  });

  it('line.new, box.new, table.new / table.cell, polyline.new, linefill.new', () => {
    const r = last((c) => {
      const a = line.new(c.i - 10, c.low, c.i, c.low, { extend: extend.right, style: line.style_dashed, width: 2 });
      const b = line.new({ x1: c.i - 10, y1: c.high, x2: c.i, y2: c.high, color: color.green });
      linefill.new(a, b, { color: color.new(color.blue, 80) });
      box.new(c.i - 5, c.high, c.i, c.low, { border_color: color.orange, bgcolor: color.new(color.orange, 90), text: 'Box' });
      const t = table.new(position.top_right, 2, 1, { bgcolor: color.black, border_width: 1 });
      table.cell(t, 0, 0, 'k', { text_color: color.white });
      table.cell({ table_id: t, column: 1, row: 0, text: 'v', text_size: size.small });
      polyline.new([chart.point.from_index(c.i - 3, c.low), chart.point.from_index(c.i, c.high)], { line_color: color.purple, line_width: 3 });
    });
    expect(r.lines!.map((l) => [l.extend, l.style, l.width])).toEqual([
      ['right', 'dashed', 2],
      ['none', 'solid', 1],
    ]);
    expect(r.linefills).toHaveLength(1);
    expect(r.boxes![0]).toMatchObject({ text: 'Box' });
    expect(r.tables![0]!.cells.map((cell) => cell.text)).toEqual(['k', 'v']);
    expect(r.polylines![0]).toMatchObject({ lineWidth: 3 });
  });

  it('an unknown name throws with the closest names; a name given twice throws', () => {
    expect(() => last((c) => void label.new(c.i, c.high, 'A', { textcolour: color.white } as never))).toThrow(
      /label\.new\(\): unknown argument "textcolour"\. Did you mean textcolor\b/
    );
    expect(() => last((c) => void label.new(c.i, c.high, 'A', { text: 'B' }))).toThrow(/"text" is given twice/);
  });
});

describe('Series arguments', () => {
  it('in a bar loop: the value on the current bar', () => {
    const r = last(() => {
      label.new(bar_index, high, 'S');
      line.new(bar_index.sub(5), low, bar_index, low);
    });
    const n = BARS.length;
    expect(r.labels![0]).toMatchObject({ price: BARS[n - 1]!.high, time: BARS[n - 1]!.time });
    expect(r.lines![0]).toMatchObject({ price1: BARS[n - 1]!.low, price2: BARS[n - 1]!.low, time1: BARS[n - 6]!.time, time2: BARS[n - 1]!.time });
  });

  it('outside a bar loop: an error with the fix', () => {
    expect(() =>
      run(() => {
        indicator('S');
        label.new(bar_index, high, 'S');
      })
    ).toThrow(/label\.new\(\): argument 1 is a Series, a drawing takes one value: call label\.new\(\) inside eachBar\(\)/);
  });
});

describe('script API alignments', () => {
  it('ta.vwma(source, length) uses the chart volume', () => {
    run(() => {
      indicator('V');
      expect(ta.vwma(close, 10).toArray()).toEqual(ta.vwma(close, 10, volume).toArray());
    });
  });

  it('input.source(close) is input.source("close")', () => {
    const out = run(() => {
      indicator('I');
      plot(input.source(close, 'Source'), 'S');
      plot(input.source(high, 'Other'), 'H');
    });
    expect(out.inputConfig.map((i) => [i.id, i.defval])).toEqual([
      ['source', 'close'],
      ['other', 'high'],
    ]);
    expect(out.result.plots.plot0![10]!.value).toBe(BARS[10]!.close);
    expect(() =>
      run(() => {
        indicator('I');
        input.source(close.add(1), 'Bad');
      })
    ).toThrow(/the default must be a built-in source/);
  });

  it('input.price is a float input', () => {
    const out = run(() => {
      indicator('P');
      plot(close.sub(input.price(100.5, 'Level')), 'D');
    }, { level: 101 });
    expect(out.inputConfig[0]).toMatchObject({ id: 'level', type: 'float', defval: 100.5 });
    expect(out.result.plots.plot0![0]!.value).toBeCloseTo(BARS[0]!.close - 101, 12);
  });

  it('bar_index and last_bar_index', () => {
    run(() => {
      indicator('B');
      expect(bar_index.toArray()).toEqual(BARS.map((_, i) => i));
      expect(last_bar_index.toArray().every((v) => v === BARS.length - 1)).toBe(true);
      const seen = eachBar((c) => c.get(bar_index) === c.i && c.get(last_bar_index) === c.n - 1).toArray();
      expect(seen.every((v) => v === 1)).toBe(true);
    });
  });

  it('plot(offset): bar i drawn on bar i + offset, both directions', () => {
    const out = run(() => {
      indicator('O');
      plot(close, 'Right', { offset: 2 });
      plot(close, 'Left', { offset: -3 });
    });
    const right = out.result.plots.plot0!;
    const left = out.result.plots.plot1!;
    expect(right).toHaveLength(BARS.length - 2);
    expect(right[0]).toEqual({ time: BARS[2]!.time, value: BARS[0]!.close });
    expect(left).toHaveLength(BARS.length - 3);
    expect(left[0]).toEqual({ time: BARS[0]!.time, value: BARS[3]!.close });
  });

  it('xloc constants in drawings', () => {
    const r = last((c) => void label.new(c.i, c.close, 'X', { xloc: xloc.bar_index }));
    expect(r.labels![0]!.text).toBe('X');
  });
});
