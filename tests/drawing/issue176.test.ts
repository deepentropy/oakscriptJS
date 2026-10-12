/**
 * Tables per position, fractional bar indexes, polylines created on the last bar and the array index error (#176).
 * Each expected value is the PineScript result of the same calls (BITSTAMP:BTCUSD 1D).
 */
import { array, box, chartPoint, label, line, polyline, resetDrawings, setDrawingBar, table } from '../../src';
import type { Polyline } from '../../src/types';

afterEach(() => {
  setDrawingBar(null);
  resetDrawings();
});

describe('table.new: one live table per position', () => {
  it('a table at the position of a live table deletes it', () => {
    const a = table.new('top_right', 1, 1);
    table.cell(a, 0, 0, 'A');
    expect(table.all()).toHaveLength(1);
    const b = table.new('top_right', 2, 2);
    table.cell(b, 0, 0, 'B');
    expect(table.all()).toEqual([b]);
    const c = table.new('bottom_left', 1, 1);
    expect(table.all()).toEqual([b, c]);
  });

  it('the replaced table is deleted: its cells do nothing', () => {
    const a = table.new('top_right', 1, 1);
    const b = table.new('top_right', 1, 1);
    table.cell(b, 0, 0, 'B');
    table.cell(a, 0, 0, 'A after');
    expect(table.all()).toEqual([b]);
    expect(b.cells.get('0,0')?.text).toBe('B');
  });

  it('one new table per bar at one position leaves one', () => {
    for (let i = 0; i < 200; i++) table.new('middle_center', 1, 1);
    expect(table.all()).toHaveLength(1);
  });
});

describe('a fractional bar index is truncated', () => {
  // last bar 299: bar_index - 10 / 3 = 295.67 is drawn on bar 295, bar_index - 4 / 3 = 297.67 on 297
  it('box.new, line.new, label.new', () => {
    const b = box.new(299 - 10 / 3, 2, 299 - 4 / 3, 1);
    expect([box.get_left(b), box.get_right(b)]).toEqual([295, 297]);
    const l = line.new(299 - 10 / 3, 2, 299 - 4 / 3, 1);
    expect([line.get_x1(l), line.get_x2(l)]).toEqual([295, 297]);
    expect(label.get_x(label.new(299 - 10 / 3, 2, 'x'))).toBe(295);
  });

  it('the setters', () => {
    const b = box.new(295, 2, 298, 1);
    box.set_left(b, 299 - 10 / 3);
    expect(box.get_left(b)).toBe(295);
    const l = line.new(295, 2, 298, 1);
    line.set_x1(l, 299 - 10 / 3);
    expect(line.get_x1(l)).toBe(295);
  });

  it('a bar_time x is kept', () => {
    expect(line.get_x1(line.new(1000.5, 1, 2000, 1, 'bar_time'))).toBe(1000.5);
  });
});

describe('polylines created on the last bar after the script deleted the old ones', () => {
  /** Deletes all its polylines and creates `n` new ones on each bar; counts at the end of the bars, in-bar counts. */
  function run(bars: number, max: number, n: number): { counts: number[]; inBar: number[] } {
    resetDrawings({ polyline: max });
    let mine: Polyline[] = [];
    const counts: number[] = [];
    const inBar: number[] = [];
    for (let i = 0; i < bars; i++) {
      const last = i === bars - 1;
      setDrawingBar(i, last, bars - 1);
      for (const p of mine) polyline.delete(p);
      mine = [];
      for (let k = 0; k < n; k++) {
        mine.push(polyline.new([chartPoint.from_index(i - 2, k), chartPoint.from_index(i, k)]));
        if (last && (k % 10 === 9 || k === n - 1)) inBar.push(polyline.all().length);
      }
      counts.push(polyline.all().length);
    }
    return { counts, inBar };
  }

  it('max 100: all the polylines of the last bar are kept', () => {
    for (const [n, before] of [[106, 100], [110, 104], [149, 101], [200, 104]] as const) {
      const { counts } = run(600, 100, n);
      expect(counts.at(-1)).toBe(n);
      expect(counts.slice(-8, -1).every((c) => c >= 100 && c <= 104)).toBe(true);
      expect(counts).toContain(before);
    }
  });

  it('max 20, 45 per bar: 21 on the bars before, 45 on the last, counted as they come', () => {
    const { counts, inBar } = run(300, 20, 45);
    expect(counts.slice(-12)).toEqual([21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 45]);
    expect(inBar).toEqual([10, 20, 30, 40, 45]);
  });

  it('above max + 5 + the old polylines deleted on the bar, the cut is back', () => {
    // max 100, 230 per bar: 206 at the end of the last bar (PineScript)
    expect(run(600, 100, 230).counts.at(-1)).toBe(206);
  });
});

describe('array index out of bounds', () => {
  it('has the PineScript text', () => {
    expect(() => array.get(array.from(1, 2, 3), 5)).toThrow("In 'array.get()' function. Index 5 is out of bounds, array size is 3.");
    expect(array.get(array.from(1, 2, 3), -1)).toBe(3); // v6: from the end
  });
});
