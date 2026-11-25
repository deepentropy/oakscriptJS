/**
 * Visible range and chart type built-ins, drawings placed on the pane (#210).
 */
import {
  box,
  chart as chartApi,
  close,
  createScriptRun,
  eachBar,
  executeScript,
  indicator,
  label,
  line,
  linefill,
  plot,
  polyline,
  ta,
  xloc,
  yloc,
  type ChartContext,
} from '../../src/script/index';

const bars = (n: number, last = 0) =>
  Array.from({ length: n }, (_, i) => {
    const c = 100 + Math.sin(i / 3) + (i === n - 1 ? last : 0);
    return { time: 1_700_000_000 + i * 300, open: c, high: c + 1, low: c - 1, close: c, volume: 1 };
  });

function read<T>(chart: ChartContext, fn: () => T, n = 3): { value: T; usesVisibleRange: boolean } {
  let value!: T;
  const out = executeScript(() => {
    indicator('x', { overlay: true });
    value = fn();
  }, bars(n), {}, chart);
  return { value, usesVisibleRange: out.usesVisibleRange };
}

describe('chart.left_visible_bar_time / right_visible_bar_time', () => {
  it('are the values of the chart context, and the run says it read them', () => {
    const out = read({ leftVisibleBarTime: 5, rightVisibleBarTime: 9 }, () => [chartApi.left_visible_bar_time, chartApi.right_visible_bar_time]);
    expect(out).toEqual({ value: [5, 9], usesVisibleRange: true });
    expect(read({ leftVisibleBarTime: 5 }, () => 1).usesVisibleRange).toBe(false);
  });

  it('default to the first and the last bar, in ms', () => {
    const at = () => [chartApi.left_visible_bar_time, chartApi.right_visible_bar_time];
    expect(read({}, at).value).toEqual([1_700_000_000_000, 1_700_000_600_000]);
    expect(read({}, at, 0).value).toEqual([NaN, NaN]);
  });

  it('a read inside eachBar() counts', () => {
    const out = read({}, () => eachBar((c) => { if (c.i === 2) void chartApi.right_visible_bar_time; }));
    expect(out.usesVisibleRange).toBe(true);
  });
});

describe('createScriptRun and the visible range', () => {
  const ctx = { timeframe: '5', timezone: 'Etc/UTC', session: '24x7' } as const;
  const view = (k: number): ChartContext => ({ ...ctx, leftVisibleBarTime: k, rightVisibleBarTime: k + 1 });

  it('a script that does not read it is resumed when the view moves', () => {
    const run = createScriptRun(() => {
      indicator('x', { overlay: true });
      plot(ta.ema(close, 5));
    });
    run.update(bars(40), view(1));
    const out = run.update(bars(40, 1), view(2));
    expect([out.incremental, out.usesVisibleRange, run.fullRunReason]).toEqual([true, false, null]);
  });

  it('a script that reads it is calculated in full when the view moves, and resumed when it does not', () => {
    const run = createScriptRun(() => {
      indicator('x', { overlay: true });
      plot(close.mul(0).add(chartApi.left_visible_bar_time), 'L');
    });
    run.update(bars(40), view(1));
    expect(run.update(bars(40, 1), view(1)).incremental).toBe(true);
    const moved = run.update(bars(40, 2), view(7));
    expect(moved.incremental).toBe(false);
    expect(Object.values(moved.result.plots)[0]!.map((p) => p.value)).toEqual(Array(40).fill(7));
  });

  it('a read made once on a bar of the past is kept by the resumed updates', () => {
    const run = createScriptRun(() => {
      indicator('x', { overlay: true });
      eachBar((c) => { if (c.i === 3) void chartApi.left_visible_bar_time; });
      plot(ta.ema(close, 5));
    });
    run.update(bars(40), view(1));
    const same = run.update(bars(40, 1), view(1));
    expect([same.incremental, same.usesVisibleRange, run.fullRunReason]).toEqual([true, true, null]);
    expect(run.update(bars(40, 2), view(2)).incremental).toBe(false);
  });
});

describe('chart.is_*', () => {
  const all = () => [
    chartApi.is_standard, chartApi.is_heikinashi, chartApi.is_renko, chartApi.is_kagi, chartApi.is_linebreak, chartApi.is_pnf, chartApi.is_range,
  ];

  it('follow the chart type of the context, standard by default', () => {
    expect(read({}, all).value).toEqual([true, false, false, false, false, false, false]);
    const types = ['standard', 'heikinashi', 'renko', 'kagi', 'linebreak', 'pnf', 'range'] as const;
    types.forEach((chartType, k) => expect(read({ chartType }, all).value).toEqual(types.map((_, i) => i === k)));
  });
});

describe('xloc.pane', () => {
  it('keeps the percents of the pane in the times of the drawings', () => {
    const { result } = executeScript(() => {
      indicator('x', { overlay: true });
      eachBar((c) => {
        if (c.i !== c.n - 1) return;
        box.new(70, 101, 100, 99, { xloc: xloc.pane });
        const a = line.new(0, 100, 99.5, 100, { xloc: xloc.pane });
        const b = line.new({ x1: 0, y1: 98, x2: 100, y2: 98, xloc: xloc.pane });
        linefill.new(a, b, '#ff0000');
        label.new(100, 100, 'now', { xloc: xloc.pane, yloc: yloc.abovebar });
        polyline.new([chartApi.point.from_index(10, 99), chartApi.point.from_index(20.5, 101)], { xloc: xloc.pane });
      });
    }, bars(5));
    expect(result.boxes).toMatchObject([{ time1: 70, price1: 101, time2: 100, price2: 99, xloc: 'pane' }]);
    expect(result.lines).toMatchObject([{ time1: 0, time2: 99.5, xloc: 'pane' }, { time1: 0, time2: 100, xloc: 'pane' }]);
    expect(result.linefills![0]!.line1).toMatchObject({ time2: 99.5, xloc: 'pane' });
    // no bar to be above of: the label is at its price
    expect(result.labels).toMatchObject([{ time: 100, price: 100, yloc: 'price', xloc: 'pane' }]);
    expect(result.polylines).toMatchObject([{ points: [{ time: 10, price: 99 }, { time: 20.5, price: 101 }], xloc: 'pane' }]);
  });

  it('line.get_price needs bar indexes', () => {
    expect(() => read({}, () => line.get_price(line.new(0, 1, 100, 1, { xloc: xloc.pane }), 2))).toThrow("'xloc=xloc.bar_index'");
  });
});
