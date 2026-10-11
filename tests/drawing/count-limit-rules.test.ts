/**
 * The maximum count of drawing objects: held objects above the maximum, polylines after script deletes, and the last
 * bar (#158). The counts are the PineScript results of the same scripts (one object per bar on a daily chart,
 * `plot(array.size(line.all))`); the last-bar cases start from the same state as the measured ones.
 */
import { box, chartPoint, label, line, linefill, polyline, resetDrawings, setDrawingBar, varDrawing } from '../../src';
import type { Label, Line, Polyline } from '../../src/types';

const newLine = (i: number): Line => line.new(i, 1, i + 1, 1);
const newPolyline = (i: number): Polyline => polyline.new([chartPoint.from_index(i - 1, 1), chartPoint.from_index(i, 2)]);

/** Runs `bar(i)` on `count` bars (the last one marked as such) and returns `size()` at the end of every bar. */
function run(count: number, bar: (i: number) => void, size: () => number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    setDrawingBar(i, i === count - 1);
    bar(i);
    if (i === count - 1) setDrawingBar(null);
    out.push(size());
  }
  return out;
}

afterAll(() => resetDrawings());

describe('more held objects than the maximum (#158)', () => {
  const held = (count: number, bars: number): number[] => {
    resetDrawings({ line: 5 });
    return run(
      bars,
      (i) => {
        if (i === 0) for (let k = 0; k < count; k++) varDrawing(newLine(i));
        newLine(i);
      },
      () => line.all().length
    );
  };

  it('3 held lines, maximum 5: the plain cycle', () => {
    expect(held(3, 14)).toEqual([4, 5, 6, 7, 8, 9, 10, 5, 6, 7, 8, 9, 10, 5]);
  });

  it('5, 6 and 8 held lines, maximum 5: the held ones and the newest line stay', () => {
    expect(held(5, 11)).toEqual([6, 7, 8, 9, 10, 6, 7, 8, 9, 10, 6]);
    expect(held(6, 9)).toEqual([7, 8, 9, 10, 7, 8, 9, 10, 7]);
    expect(held(8, 6)).toEqual([9, 10, 9, 10, 9, 10]);
  });

  it('12 lines held on the first bar, maximum 5: the first 6 are deleted on that bar', () => {
    expect(held(12, 9)).toEqual([7, 8, 9, 10, 7, 8, 9, 10, 7]);
  });

  it('60 labels held on the first bar, maximum 50: 54 stay', () => {
    resetDrawings();
    const made: Label[] = [];
    const counts = run(
      20,
      (i) => {
        if (i === 0) for (let k = 0; k < 60; k++) made.push(varDrawing(label.new(i, k, 'f')).value!);
        if (i % 10 === 5) label.new(i, 0, 'x');
      },
      () => label.all().length
    );
    expect(counts.slice(0, 6)).toEqual([54, 54, 54, 54, 54, 55]);
    expect(counts[19]).toBe(55);
    expect(label.all().slice(0, 54)).toEqual(made.slice(6));
  });
});

describe('polylines: the script deletes move the limit (#158)', () => {
  beforeEach(() => resetDrawings({ polyline: 10 }));

  it('a delete every 2nd bar', () => {
    const last = varDrawing<Polyline>();
    const counts = run(
      46,
      (i) => {
        if (i % 2 === 0 && last.value) polyline.delete(last.value);
        last.value = newPolyline(i);
      },
      () => polyline.all().length
    );
    expect(counts.slice(26, 44)).toEqual([14, 15, 15, 16, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 10, 11]);
  });

  it('delete and create on every bar, one more polyline every 3rd bar: cuts on bars 42 and 61', () => {
    const cur = varDrawing<Polyline>();
    const counts = run(
      70,
      (i) => {
        if (cur.value) polyline.delete(cur.value);
        cur.value = newPolyline(i);
        if (i % 3 === 0) newPolyline(i);
      },
      () => polyline.all().length
    );
    expect(counts.slice(39, 45)).toEqual([15, 15, 15, 10, 10, 10]);
    expect(counts.slice(57, 64)).toEqual([15, 15, 15, 16, 10, 10, 11]);
  });

  it.each([
    [1, [11, 12, 13, 14, 15, 16, 11, 12, 13, 14, 15, 10]],
    [2, [10, 11, 12, 13, 14, 15, 16, 17, 12, 13, 14, 15, 10]],
    [3, [9, 10, 11, 12, 13, 14, 15, 10, 11]],
    [7, [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 10]],
  ])('12 polylines, %i deleted on one bar, then one per bar', (deletes, expected) => {
    const made: Polyline[] = [];
    const counts = run(
      12 + expected.length + 1,
      (i) => {
        if (i < 12) made.push(newPolyline(i));
        else if (i === 12) for (let k = 0; k < deletes; k++) polyline.delete(made.pop()!);
        else newPolyline(i);
      },
      () => polyline.all().length
    );
    // the last bar of this run is left out: it has its own rule
    expect(counts.slice(12, 12 + expected.length)).toEqual(expected);
  });

  it('lines, labels and boxes do not do this on the bars before the last', () => {
    resetDrawings({ line: 10, box: 10 });
    const last = varDrawing<Line>();
    const counts = run(
      44,
      (i) => {
        if (i % 2 === 0 && last.value) line.delete(last.value);
        last.value = newLine(i);
        box.new(i, 2, i + 1, 1);
      },
      () => line.all().length
    );
    expect(counts.slice(26, 42)).toEqual([14, 15, 15, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 10]);
  });
});

describe('the last bar is calculated twice (#158)', () => {
  // 17 bars: one line per bar, 10 lines alive after the 16th (the cut of that bar)
  const lastBar = (deletes: number, creations: number, kind: 'line' | 'polyline' = 'line'): number[] => {
    resetDrawings({ line: 10, polyline: 10 });
    const make = kind === 'line' ? newLine : newPolyline;
    const ns = kind === 'line' ? line : polyline;
    const made: object[] = [];
    const numbers = new Map<object, number>();
    const create = (i: number): object => {
      const obj = make(i);
      numbers.set(obj, numbers.size - 16); // 0 = the object of the last bar
      return obj;
    };
    run(
      17,
      (i) => {
        made.push(create(i));
        if (i === 15) for (let k = 0; k < deletes; k++) (ns.delete as (o: unknown) => void)(made.pop());
        if (i === 16) for (let k = 0; k < creations; k++) create(i);
      },
      () => ns.all().length
    );
    return (ns.all() as object[]).map((obj) => numbers.get(obj)!);
  };
  const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, k) => from + k);

  it('8 more lines on the last bar: one cut, as on any bar', () => {
    expect(lastBar(0, 8)).toEqual(range(-4, 8));
  });

  it('14, 26 more lines: the lines of the bars before are gone after the first calculation', () => {
    expect(lastBar(0, 14)).toEqual(range(0, 14)); // one calculation would leave 2 to 14
    expect(lastBar(0, 26)).toEqual(range(12, 26));
  });

  it('script deletes of the bar before allow as many more lines (reset at 5)', () => {
    expect(lastBar(1, 6)).toEqual([...range(-10, -2), ...range(0, 6)]); // 16 lines
    expect(lastBar(1, 7)).toEqual([...range(-4, -2), ...range(0, 7)]);
    expect(lastBar(3, 10)).toEqual([...range(-10, -4), ...range(0, 10)]); // 18 lines
    expect(lastBar(3, 14)).toEqual([-4, ...range(0, 14)]);
    expect(lastBar(4, 12)).toEqual([...range(-10, -5), ...range(0, 12)]); // 19 lines
    expect(lastBar(5, 10)).toEqual(range(0, 10));
    expect(lastBar(7, 12)).toEqual(range(0, 12));
  });

  it('polylines on the last bar', () => {
    expect(lastBar(0, 5, 'polyline')).toEqual(range(-4, 5));
    expect(lastBar(0, 14, 'polyline')).toEqual(range(-4, 14)); // 19 polylines
    expect(lastBar(0, 20, 'polyline')).toEqual(range(0, 20));
    expect(lastBar(3, 14, 'polyline')).toEqual([-4, ...range(0, 14)]);
  });

  it('a line deleted by the count on the last bar takes its linefill with it', () => {
    const counts = (more: number): [number, number] => {
      resetDrawings({ line: 10 });
      run(
        23,
        (i) => {
          linefill.new(newLine(i), newLine(i), '#2962ff');
          if (i === 22) for (let k = 0; k < more; k++) newLine(i);
        },
        () => line.all().length
      );
      return [line.all().length, linefill.all().length];
    };
    expect(counts(0)).toEqual([10, 8]); // 11 fills on a bar before the last
    expect(counts(8)).toEqual([12, 5]);
  });

  it('a line of the last bar that the second calculation keeps has its coordinates', () => {
    resetDrawings({ line: 10 });
    const made: Line[] = [];
    run(
      17,
      (i) => {
        made.push(line.new(i, 1, i + 1, 2));
        if (i === 16) for (let k = 1; k <= 14; k++) made.push(line.new(i - k, 3, i, 4));
      },
      () => line.all().length
    );
    expect(line.all()).toEqual(made.slice(16));
    expect(line.get_x1(made[16]!)).toBe(16);
    expect(line.get_y2(made[17]!)).toBe(4);
    expect(line.get_x1(made[15]!)).toBeNaN();
  });
});
