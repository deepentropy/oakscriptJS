/**
 * Script API: the renderable drawings of a run (result.labels, lines, boxes, linefills, polylines, tables),
 * table.*, plotcandle() and plotbar() (issue #153).
 */
import {
  executeScript,
  indicator,
  eachBar,
  label,
  line,
  box,
  linefill,
  polyline,
  table,
  position,
  text,
  chart,
  plotcandle,
  plotbar,
  color,
  open,
  high,
  low,
  close,
} from '../../src/script';
import { barInterval, barTime, drawingOutputs } from '../../src';
import type { Bar } from '../../src/types';

const DAY = 86400;
const T0 = 1700000000;

function makeBars(closes: number[]): Bar[] {
  return closes.map((c, i) => ({ time: T0 + i * DAY, open: c - 1, high: c + 1, low: c - 2, close: c, volume: 1000 }));
}

const BARS = makeBars([100, 102, 101, 103, 105, 104, 106, 108, 107, 109]);
const LAST = BARS.length - 1;

describe('labels', () => {
  test('bar_index x is the bar time; unset properties are omitted', () => {
    const run = executeScript(() => {
      indicator('Labels');
      label.new(2, 101.5, 'A');
    }, BARS);
    expect(run.result.labels).toEqual([{ time: BARS[2]!.time, price: 101.5, text: 'A', yloc: 'price' }]);
  });

  test('a label after the last bar gets the time of that future bar', () => {
    const run = executeScript(() => {
      indicator('Future');
      label.new(LAST + 3, 110, 'F');
    }, BARS);
    expect(run.result.labels![0]!.time).toBe(BARS[LAST]!.time + 3 * DAY);
  });

  test('bar_time x (UNIX ms) is converted to the unit of the bar times', () => {
    const ms = (BARS[4]!.time as number) * 1000;
    const inSeconds = executeScript(() => {
      indicator('Time');
      label.new(ms, 100, 'T', 'bar_time');
    }, BARS);
    expect(inSeconds.result.labels![0]!.time).toBe(BARS[4]!.time);

    const msBars = BARS.map((b) => ({ ...b, time: (b.time as number) * 1000 }));
    const inMs = executeScript(
      () => {
        indicator('TimeMs');
        label.new(ms, 100, 'T', 'bar_time');
        label.new(1, 100, 'I');
      },
      msBars,
      {},
      { timeUnit: 'ms' }
    );
    expect(inMs.result.labels!.map((l) => l.time)).toEqual([ms, msBars[1]!.time]);
  });

  test('all properties, na colour as transparent, force_overlay', () => {
    const run = executeScript(() => {
      indicator('Props', { overlay: false });
      label.new(1, 100, 'P', 'bar_index', 'abovebar', null as unknown as string, 'label_lower_left', '#FFFFFF', 'large',
        'left', 'tip', 'monospace', true, text.format_bold + text.format_italic);
    }, BARS);
    expect(run.result.labels).toEqual([
      {
        time: BARS[1]!.time,
        price: 100,
        text: 'P',
        yloc: 'abovebar',
        color: 'transparent',
        style: 'label_lower_left',
        textColor: '#FFFFFF',
        size: 'large',
        textAlign: 'left',
        tooltip: 'tip',
        fontFamily: 'monospace',
        textFormatting: 3,
        forceOverlay: true,
      },
    ]);
  });

  test('only the live labels after the last bar (deleted and over the maximum count are gone)', () => {
    const run = executeScript(() => {
      indicator('Live', { max_labels_count: 3 });
      eachBar((c) => {
        const l = label.new(c.i, c.close, String(c.i));
        if (c.i === LAST) label.delete(l);
      });
    }, BARS);
    // 10 labels with max 3: the count goes back to 3 at 9 labels (3 + 5 + 1), the last one is deleted
    expect(run.result.labels!.map((l) => l.text)).toEqual(['6', '7', '8']);
  });

  test('na coordinates are not drawn; abovebar labels do not need a price', () => {
    const run = executeScript(() => {
      indicator('Na');
      label.new(NaN, 100, 'no x');
      label.new(1, NaN, 'no y');
      label.new(2, NaN, 'above', 'bar_index', 'abovebar');
      label.new(-1, 100, 'before the first bar');
    }, BARS);
    expect(run.result.labels!.map((l) => l.text)).toEqual(['above']);
  });
});

describe('lines, boxes and linefills', () => {
  test('lines keep style, width, extend and colour', () => {
    const run = executeScript(() => {
      indicator('Lines');
      line.new(1, 100, LAST + 2, 110, 'bar_index', 'right', '#FF0000', 'arrow_right', 2, true);
    }, BARS);
    expect(run.result.lines).toEqual([
      {
        time1: BARS[1]!.time,
        price1: 100,
        time2: BARS[LAST]!.time + 2 * DAY,
        price2: 110,
        color: '#FF0000',
        width: 2,
        style: 'arrow_right',
        extend: 'right',
        forceOverlay: true,
      },
    ]);
  });

  test('boxes: left / top / right / bottom and the text properties', () => {
    const run = executeScript(() => {
      indicator('Boxes');
      box.new(2, 108, 5, 101, '#00FF00', 2, 'dashed', 'both', 'bar_index', null as unknown as string, 'Zone', 'small',
        '#000000', text.align_left, text.align_top, text.wrap_auto, 'monospace', false, text.format_bold);
    }, BARS);
    expect(run.result.boxes).toEqual([
      {
        time1: BARS[2]!.time,
        price1: 108,
        time2: BARS[5]!.time,
        price2: 101,
        bgColor: 'transparent',
        borderColor: '#00FF00',
        borderWidth: 2,
        borderStyle: 'dashed',
        text: 'Zone',
        textColor: '#000000',
        textSize: 'small',
        textHAlign: 'left',
        textVAlign: 'top',
        textWrap: 'auto',
        fontFamily: 'monospace',
        textFormatting: 1,
        extend: 'both',
      },
    ]);
  });

  test('a linefill carries its two lines as drawn; a line with an na point drops it', () => {
    const run = executeScript(() => {
      indicator('Fills');
      const a = line.new(0, 110, 5, 112, 'bar_index', 'right');
      const b = line.new(0, 100, 5, 102, 'bar_index', 'right');
      linefill.new(a, b, color.new('#2962FF', 80));
      const c = line.new(0, 90, NaN, 95);
      linefill.new(b, c, '#FF0000');
    }, BARS);
    expect(run.result.linefills).toHaveLength(1);
    const fill = run.result.linefills![0]!;
    expect(fill.color).toBe(color.new('#2962FF', 80));
    expect(fill.line1).toMatchObject({ price1: 110, price2: 112, extend: 'right' });
    expect(fill.line2).toMatchObject({ price1: 100, price2: 102, time2: BARS[5]!.time });
    expect(run.result.lines).toHaveLength(2); // the line with an na x is not drawn
  });
});

describe('polylines', () => {
  test('points by index or by time; no fill colour is omitted', () => {
    const run = executeScript(() => {
      indicator('Poly');
      polyline.new([chart.point.from_index(0, 100), chart.point.from_index(LAST + 1, 105)], true, false, 'bar_index',
        '#FF9800', null, 'dotted', 3);
      polyline.new([chart.point.from_time((BARS[3]!.time as number) * 1000, 99)], false, true, 'bar_time', '#000000',
        '#00000033');
    }, BARS);
    expect(run.result.polylines).toEqual([
      {
        points: [
          { time: BARS[0]!.time, price: 100 },
          { time: BARS[LAST]!.time + DAY, price: 105 },
        ],
        curved: true,
        closed: false,
        lineColor: '#FF9800',
        lineStyle: 'dotted',
        lineWidth: 3,
      },
      {
        points: [{ time: BARS[3]!.time, price: 99 }],
        curved: false,
        closed: true,
        lineColor: '#000000',
        fillColor: '#00000033',
        lineStyle: 'solid',
        lineWidth: 1,
      },
    ]);
  });
});

describe('tables', () => {
  test('table.new / table.cell / cell_set_* / merge_cells give result.tables', () => {
    const run = executeScript(() => {
      indicator('Table');
      const t = table.new(position.top_right, 2, 3, '#131722', '#787B86', 1, '#363A45', 1);
      table.cell(t, 1, 0, 'Value', 0, 0, '#FFFFFF', text.align_right, text.align_center, 'small', null as unknown as string,
        'tip', 'monospace', text.format_bold);
      table.cell(t, 0, 0, 'RSI');
      table.cell_set_text(t, 0, 2, 'Total');
      table.cell_set_bgcolor(t, 0, 2, '#FF0000');
      table.merge_cells(t, 0, 2, 1, 2);
    }, BARS);
    expect(run.result.tables).toEqual([
      {
        position: 'top_right',
        columns: 2,
        rows: 3,
        bgColor: '#131722',
        frameColor: '#787B86',
        frameWidth: 1,
        borderColor: '#363A45',
        borderWidth: 1,
        cells: [
          { row: 0, column: 0, text: 'RSI' },
          {
            row: 0,
            column: 1,
            text: 'Value',
            width: 0,
            height: 0,
            textColor: '#FFFFFF',
            textHAlign: 'right',
            textVAlign: 'center',
            textSize: 'small',
            bgColor: 'transparent',
            tooltip: 'tip',
            fontFamily: 'monospace',
            textFormatting: 1,
          },
          { row: 2, column: 0, text: 'Total', bgColor: '#FF0000' },
        ],
        merges: [{ startColumn: 0, startRow: 2, endColumn: 1, endRow: 2 }],
      },
    ]);
  });

  test('table.cell replaces the cell; table.clear removes cells and their merges', () => {
    const run = executeScript(() => {
      indicator('Clear');
      const t = table.new(position.bottom_left, 3, 1);
      table.cell(t, 0, 0, 'a', 0, 0, '#FFFFFF');
      table.cell(t, 0, 0, 'b'); // a new definition: the text colour goes back to the default
      table.cell(t, 1, 0, 'c');
      table.cell(t, 2, 0, 'd');
      table.merge_cells(t, 1, 0, 2, 0);
      table.clear(t, 1, 0, 2, 0);
      table.set_position(t, position.middle_center);
    }, BARS);
    const t = run.result.tables![0]!;
    expect(t.position).toBe('middle_center');
    expect(t.cells).toEqual([{ row: 0, column: 0, text: 'b' }]);
    expect(t.merges).toBeUndefined();
  });

  test('a cell outside the table throws; a deleted table is not drawn and ignores calls', () => {
    expect(() =>
      executeScript(() => {
        indicator('Out');
        const t = table.new(position.top_left, 2, 2);
        table.cell(t, 2, 0, 'x');
      }, BARS)
    ).toThrow('table.cell(): column 2, row 0 is outside the table (2 columns, 2 rows).');

    const run = executeScript(() => {
      indicator('Deleted');
      const t = table.new(position.top_left, 1, 1);
      table.delete(t);
      table.cell(t, 0, 0, 'x');
      const kept = table.new(position.top_left, 1, 1);
      expect(table.all).toEqual([kept]);
    }, BARS);
    expect(run.result.tables).toHaveLength(1);
  });
});

describe('plotcandle / plotbar', () => {
  test('one candle per bar without na; per-bar colours, na entries transparent', () => {
    const run = executeScript(() => {
      indicator('Candles', { overlay: false });
      const o = eachBar((c) => (c.i === 3 ? NaN : c.open));
      plotcandle(o, high, low, close, 'HA', {
        color: color.when(close.gt(open), '#26A69A'),
        wickcolor: '#787B86',
        force_overlay: true,
      });
    }, BARS);
    expect(run.candleConfig).toEqual([
      { id: 'plotcandle0', kind: 'candle', title: 'HA', color: undefined, wickColor: '#787B86', borderColor: undefined,
        display: undefined, forceOverlay: true },
    ]);
    const candles = run.result.plotCandles!['plotcandle0']!;
    expect(candles).toHaveLength(BARS.length - 1); // bar 3 has an na open
    expect(candles[0]).toEqual({
      time: BARS[0]!.time,
      open: BARS[0]!.open,
      high: BARS[0]!.high,
      low: BARS[0]!.low,
      close: BARS[0]!.close,
      color: '#26A69A',
      wickColor: '#787B86',
      forceOverlay: true,
    });
  });

  test('plotbar goes to result.plotBars; color.when without a false colour gives transparent bars', () => {
    const run = executeScript(() => {
      indicator('Bars');
      plotbar(open, high, low, close, 'OHLC', { color: color.when(close.gt(105), '#FF0000') });
    }, BARS);
    expect(run.candleConfig[0]).toMatchObject({ id: 'plotbar0', kind: 'bar', title: 'OHLC' });
    const bars = run.result.plotBars!['plotbar0']!;
    expect(bars).toHaveLength(BARS.length);
    expect(bars.map((b) => b.color)).toEqual(BARS.map((b) => (b.close > 105 ? '#FF0000' : 'transparent')));
    expect(run.result.plotCandles).toBeUndefined();
  });
});

describe('bar times and drawingOutputs', () => {
  test('barInterval is the most frequent gap; barTime extrapolates after the last bar', () => {
    const weekdays = [0, 1, 2, 3, 4, 7, 8].map((d) => ({ time: d * DAY }));
    expect(barInterval(weekdays)).toBe(DAY);
    expect(barTime(weekdays, 6)).toBe(8 * DAY);
    expect(barTime(weekdays, 8)).toBe(10 * DAY);
    expect(barTime(weekdays, -1)).toBeNaN();
    expect(barTime(weekdays, 1.5)).toBeNaN();
    expect(barInterval([{ time: 5 }])).toBe(0);
  });

  test('drawingOutputs converts the live drawings outside a script run', () => {
    executeScript(() => {
      indicator('Reset');
    }, BARS); // empty registry
    const l = label.new(1, 100, 'x');
    expect(drawingOutputs(BARS).labels).toEqual([{ time: BARS[1]!.time, price: 100, text: 'x', yloc: 'price' }]);
    label.delete(l);
    expect(drawingOutputs(BARS).labels).toBeUndefined();
  });
});
