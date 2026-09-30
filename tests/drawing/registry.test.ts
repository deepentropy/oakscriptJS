/**
 * Drawing registry rules. Each expected value is the result of the same Pine code
 * (30/09/2026, BITSTAMP:BTCUSD 1D, 5,490 bars, see drawing-check/doc/README.md).
 */
import { box, chart, eachBar, executeScript, indicator, label, line, linefill, na, polyline, text } from '../../src/script';
import type { Bar } from '../../src/types';

const bars = (n: number): Bar[] =>
  Array.from({ length: n }, (_, i) => ({ time: 1_300_000_000_000 + i * 86_400_000, open: 10, high: 11, low: 9, close: 10 + (i % 3), volume: 1 }));
const BTC = bars(5490);
const last = BTC.length - 1;

/** Runs `perBar` on every bar and `onLast` on the last bar, like a Pine script, and returns onLast's result. */
function run<T>(options: Parameters<typeof indicator>[1], perBar: (i: number) => void, onLast: () => T, input = BTC): T {
  let result: T | undefined;
  executeScript(() => {
    indicator('test', options);
    eachBar((c) => {
      perBar(c.i);
      if (c.i === c.n - 1) result = onLast();
    });
  }, input);
  return result as T;
}

describe('maximum counts (keeps up to max + 5, then deletes the oldest down to max)', () => {
  const lines = (max?: number) =>
    run({ max_lines_count: max }, (i) => line.new(i, 1, i + 1, 1), () => [line.all.length, line.all[0]!.x1, line.all.at(-1)!.x1]);

  it.each([
    [undefined, [54, 5436, last]],
    [10, [12, 5478, last]],
    [500, [504, 4986, last]],
  ])('lines, max %s', (max, expected) => {
    expect(lines(max)).toEqual(expected);
  });

  it('labels, boxes and polylines follow the same rule', () => {
    expect(run({}, (i) => label.new(i, 1, 'x'), () => [label.all.length, label.all[0]!.x])).toEqual([54, 5436]);
    expect(run({ max_labels_count: 5 }, (i) => label.new(i, 1), () => [label.all.length, label.all[0]!.x])).toEqual([6, 5484]);
    expect(run({ max_boxes_count: 7 }, (i) => box.new(i, 2, i + 1, 1), () => [box.all.length, box.all[0]!.left])).toEqual([12, 5478]);
    const pts = (i: number) => [chart.point.from_index(i, 1), chart.point.from_index(i + 1, 2)];
    expect(run({}, (i) => polyline.new(pts(i)), () => polyline.all.length)).toBe(54);
    expect(run({ max_polylines_count: 3 }, (i) => polyline.new(pts(i)), () => polyline.all.length)).toBe(6);
  });

  it('linefills have their own count (max_lines_count); removed lines keep their linefills', () => {
    const make = (i: number) => linefill.new(line.new(i, 2, i + 1, 2), line.new(i, 1, i + 1, 1), '#0000ff');
    expect(run({}, make, () => [linefill.all.length, line.all.length])).toEqual([54, 54]);
    expect(run({ max_lines_count: 10 }, make, () => [linefill.all.length, line.all.length])).toEqual([12, 12]);
  });

  it('matches the count on every bar (max 10: 10, 11 ... 15, then back to 10)', () => {
    const sizes: number[] = [];
    run({ max_lines_count: 10 }, (i) => {
      line.new(i, 1, i + 1, 1);
      sizes.push(line.all.length);
    }, () => 0, bars(30));
    expect(sizes).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 10, 11, 12, 13, 14, 15, 10, 11, 12, 13, 14, 15, 10, 11, 12]);
  });
});

describe('delete', () => {
  const onLast = <T>(fn: () => T): T => run({}, () => undefined, fn, bars(5));

  it('removes the line from line.all, keeps creation order', () => {
    expect(onLast(() => {
      line.new(1, 1, 2, 1);
      const b = line.new(3, 1, 4, 1);
      line.new(2, 1, 5, 1);
      line.delete(b);
      return [line.all.length, line.all[0]!.x1, line.all[1]!.x1];
    })).toEqual([2, 1, 2]);
  });

  it('makes the object na: getters give NaN, setters do nothing, a second delete is ignored', () => {
    expect(onLast(() => {
      const b = line.new(3, 1, 4, 1);
      line.delete(b);
      line.delete(b);
      line.set_x1(b, 9);
      return [line.get_x1(b), na(b), line.all.length];
    })).toEqual([NaN, true, 0]);
  });

  it('deletes the linefills of a deleted line', () => {
    expect(onLast(() => {
      const a = line.new(1, 1, 2, 1);
      const b = line.new(1, 2, 2, 2);
      linefill.new(a, b, '#ff0000');
      line.delete(a);
      return [linefill.all.length, line.all.length];
    })).toEqual([0, 1]);
  });

  it('counts copies as new objects; line.all is a copy of the list', () => {
    expect(run({ max_lines_count: 2 }, () => undefined, () => {
      const a = line.new(1, 1, 2, 1);
      line.copy(line.copy(a));
      return [line.all.length, line.all[0]!.x1];
    }, bars(5))).toEqual([3, 1]);
    expect(onLast(() => {
      line.new(1, 1, 2, 1);
      const arr = line.all;
      line.new(2, 1, 3, 1);
      return [arr.length, line.all.length];
    })).toEqual([1, 2]);
  });

  it('starts every script run with an empty registry', () => {
    run({}, (i) => line.new(i, 1, i + 1, 1), () => 0, bars(5));
    expect(run({}, () => undefined, () => line.all.length, bars(5))).toBe(0);
  });
});

describe('points', () => {
  const onLast = <T>(fn: () => T): T => run({}, () => undefined, fn, bars(5));

  it('set_first_point / set_second_point use point.index for bar_index lines and point.time for bar_time lines', () => {
    expect(onLast(() => {
      const l = line.new(0, 1, 5, 2);
      line.set_first_point(l, chart.point.new(1000, 10, 7));
      line.set_second_point(l, chart.point.new(1000, 12, 8));
      const t = line.new(1000, 1, 2000, 2, 'bar_time');
      line.set_first_point(t, chart.point.new(123456789, 10, 7));
      const n = line.new(0, 1, 5, 2);
      line.set_first_point(n, chart.point.from_time(1000, 7));
      return [l.x1, l.y1, l.x2, l.y2, t.x1, t.y1, n.x1, n.y1];
    })).toEqual([10, 7, 12, 8, 123456789, 7, NaN, 7]);
  });

  it('line.new accepts two chart points (x from index or time by xloc)', () => {
    expect(onLast(() => {
      const l = line.new(chart.point.from_index(3, 10), chart.point.from_index(8, 12), 'bar_index', 'right');
      const t = line.new(chart.point.from_time(1000, 10), chart.point.from_time(2000, 12), 'bar_time');
      return [l.x1, l.y1, l.x2, l.y2, l.extend, t.x1, t.x2, line.all.length];
    })).toEqual([3, 10, 8, 12, 'right', 1000, 2000, 2]);
  });

  it('label.set_point and box.set_top_left_point / set_bottom_right_point', () => {
    expect(onLast(() => {
      const l = label.new(0, 1, 'x');
      label.set_point(l, chart.point.new(1000, 10, 7));
      const t = label.new(1000, 1, 'y', 'bar_time');
      label.set_point(t, chart.point.new(123456789, 10, 7));
      const b = box.new(0, 10, 5, 2);
      box.set_top_left_point(b, chart.point.new(1000, 1, 20));
      box.set_bottom_right_point(b, chart.point.new(1000, 9, 3));
      return [l.x, l.y, t.x, t.y, b.left, b.top, b.right, b.bottom];
    })).toEqual([10, 7, 123456789, 7, 1, 20, 9, 3]);
  });

  it('chart.point.now() is the current bar, with the close as default price', () => {
    const input = bars(5);
    expect(run({}, () => undefined, () => [chart.point.now(), chart.point.now(123.5).price], input)).toEqual([
      { index: 4, time: input[4]!.time, price: input[4]!.close },
      123.5,
    ]);
    expect(() => executeScript(() => chart.point.now(), input)).toThrow('inside eachBar');
  });

  it('text formatting flags add up like (bold + italic = 3)', () => {
    expect(onLast(() => {
      const l = label.new(0, 1, 'b');
      label.set_text_formatting(l, text.format_bold + text.format_italic);
      const b = box.new(0, 2, 1, 1, undefined, undefined, undefined, 'none', 'bar_index', undefined, 'x');
      box.set_text_formatting(b, text.format_italic);
      return [l.text_formatting, b.text_formatting];
    })).toEqual([3, 2]);
  });
});
