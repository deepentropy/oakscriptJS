/**
 * A bar index more than 10,000 bars before the current bar stops the script (PineScript runtime error RE10026, #170).
 * Each message is the PineScript text of the same call.
 */
import { box, chartPoint, label, line, polyline, resetDrawings, setDrawingBar } from '../../src';
import { box as scriptBox, eachBar, executeScript } from '../../src/script';
import type { Bar } from '../../src/types';

const far = (variable: string, method: string) =>
  `Error on bar 10500: Bar index value of the \`${variable}\` argument (499) in \`${method}()\` is too far from the current bar index. Try using \`time\` instead.`;

describe('drawings more than 10,000 bars back (#170)', () => {
  beforeEach(() => {
    resetDrawings();
    setDrawingBar(10500);
  });
  afterAll(() => resetDrawings());

  it('10,000 bars back is accepted, 10,001 is the error', () => {
    expect(() => box.new(500, 2, 10500, 1)).not.toThrow();
    expect(() => line.new(500, 2, 10500, 1)).not.toThrow();
    expect(() => label.new(500, 2, 'a')).not.toThrow();
    expect(() => box.new(499, 2, 10500, 1)).toThrow(far('left', 'box.new'));
    expect(() => box.new(10500, 2, 499, 1)).toThrow(far('right', 'box.new'));
    expect(() => line.new(499, 2, 10500, 1)).toThrow(far('x1', 'line.new'));
    expect(() => line.new(10500, 2, 499, 1)).toThrow(far('x2', 'line.new'));
    expect(() => label.new(499, 2, 'a')).toThrow(far('x', 'label.new'));
    expect(() => line.new(chartPoint.from_index(499, 2), chartPoint.from_index(10500, 1))).toThrow(far('x1', 'line.new'));
    expect(() => polyline.new([chartPoint.from_index(499, 2), chartPoint.from_index(10500, 1)])).toThrow(
      far('points', 'polyline.new')
    );
  });

  it('the setters of x have the method names of the PineScript message', () => {
    const l = line.new(10499, 2, 10500, 1);
    expect(() => line.set_x1(l, 499)).toThrow(far('x1', 'line.set_x***'));
    expect(() => line.set_x2(l, 499)).toThrow(far('x2', 'line.set_x***'));
    expect(() => line.set_xy1(l, 499, 1)).toThrow(far('x1', 'line.set_x***'));
    const b = box.new(10499, 2, 10500, 1);
    expect(() => box.set_left(b, 499)).toThrow(far('left', 'box.set_(left*/xloc)'));
    expect(() => box.set_lefttop(b, 499, 2)).toThrow(far('left', 'box.set_(left*/xloc)'));
    expect(() => box.set_right(b, 499)).toThrow(far('right', 'box.set_(right*/xlock)'));
    const t = label.new(10500, 2, 'a');
    expect(() => label.set_x(t, 499)).toThrow(far('x', 'label.set_x'));
    expect(() => label.set_xy(t, 499, 2)).toThrow(far('x', 'label.set_x'));
  });

  it('no check for bar_time, and none without a current bar', () => {
    expect(() => line.new(499, 2, 10500, 1, 'bar_time')).not.toThrow();
    setDrawingBar(null);
    expect(() => line.new(-50000, 2, 10500, 1)).not.toThrow();
  });

  it('a script run checks against the bar of eachBar', () => {
    const bars: Bar[] = Array.from({ length: 10003 }, (_, i) => ({
      time: 1_000_000 + i * 60, open: 1, high: 2, low: 0, close: 1, volume: 1,
    }));
    const runWith = (back: number) => () =>
      executeScript(() => {
        eachBar((c) => {
          if (c.i === 10002) scriptBox.new(c.i - back, 2, c.i, 1);
        });
      }, bars);
    expect(runWith(10001)).toThrow('Error on bar 10002: Bar index value of the `left` argument (1) in `box.new()` is too far');
    expect(runWith(10000)).not.toThrow();
  });
});

describe('drawings more than 500 bars after the last bar (#174)', () => {
  const future = (bar: number) =>
    `Error on bar ${bar}: Objects positioned using xloc.bar_index cannot be drawn further than 500 bars into the future.`;
  afterEach(() => resetDrawings());

  it('counts from the last bar of the data, not from the current bar', () => {
    // BITSTAMP:BTCUSD 1D, last bar 5501: x = 6001 is accepted on bar 100, 6002 stops the script
    setDrawingBar(100, false, 5501);
    expect(() => line.new(100, 1, 6001, 1)).not.toThrow();
    expect(() => label.new(6001, 1, 'a')).not.toThrow();
    expect(() => line.new(100, 1, 6002, 1)).toThrow(future(100));
    expect(() => line.new(6002, 1, 100, 1)).toThrow(future(100));
    expect(() => label.new(6002, 1, 'a')).toThrow(future(100));
    expect(() => box.new(100, 2, 6002, 1)).toThrow(future(100));
    expect(() => polyline.new([chartPoint.from_index(100, 1), chartPoint.from_index(6002, 1)])).toThrow(future(100));
    const l = line.new(100, 1, 101, 1);
    expect(() => line.set_x2(l, 6002)).toThrow(future(100));
    setDrawingBar(4501, false, 5501);
    expect(() => line.new(4501, 1, 6002, 1)).toThrow(future(4501));
  });

  it('on the last bar, without the last index', () => {
    setDrawingBar(5501, true);
    expect(() => line.new(5501, 1, 6001, 1)).not.toThrow();
    expect(() => line.new(5501, 1, 6002, 1)).toThrow(future(5501));
    expect(() => line.new(5501, 1, 99999, 1, 'bar_time')).not.toThrow();
  });

  it('the script API knows the last bar', () => {
    const bars: Bar[] = Array.from({ length: 50 }, (_, i) => ({
      time: 1_000_000 + i * 60, open: 1, high: 2, low: 0, close: 1, volume: 1,
    }));
    const runTo = (x: number) => () =>
      executeScript(() => {
        eachBar((c) => {
          if (c.i === 10) scriptBox.new(c.i, 2, x, 1);
        });
      }, bars);
    expect(runTo(549)).not.toThrow();
    expect(runTo(550)).toThrow(future(10));
  });
});
