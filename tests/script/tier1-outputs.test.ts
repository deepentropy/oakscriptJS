/**
 * Tests for the Tier 1 visual outputs of the script API:
 * plotshape, plotchar, bgcolor, barcolor.
 */
import {
  executeScript,
  indicator,
  plotshape,
  plotchar,
  bgcolor,
  barcolor,
  color,
  close,
  high,
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

describe('plotshape', () => {
  test('emits one marker per truthy bar with declaration config', () => {
    const run = executeScript(() => {
      indicator('Shapes', { overlay: true });
      plotshape(close.gt(105), 'Breakout', {
        style: 'triangleup',
        location: 'belowbar',
        color: color.green,
        text: 'B',
        size: 'small',
      });
    }, BARS);

    expect(run.shapeConfig).toEqual([
      expect.objectContaining({ id: 'shape0', kind: 'shape', title: 'Breakout', style: 'triangleup', location: 'belowbar' }),
    ]);
    const markers = run.result.markers!;
    // closes > 105: 106, 108, 107, 109 → 4 markers
    expect(markers).toHaveLength(4);
    expect(markers[0]).toMatchObject({
      id: 'shape0',
      time: BARS[6]!.time,
      style: 'triangleup',
      location: 'belowbar',
      color: color.green,
      text: 'B',
      size: 'small',
    });
    expect(markers[0]!.price).toBeUndefined();
  });

  test('location absolute carries the series value as price', () => {
    const run = executeScript(() => {
      indicator('Abs');
      plotshape(close.gt(108).iff(high, 0), 'Peak', { location: 'absolute' });
    }, BARS);
    const markers = run.result.markers!;
    expect(markers).toHaveLength(1);
    expect(markers[0]!.price).toBe(BARS[9]!.close + 1); // high of last bar
  });

  test('offset shifts the marker to another bar and drops out-of-range', () => {
    const run = executeScript(() => {
      indicator('Off');
      plotshape(close.eq(100), 'first', { offset: -1 }); // bar 0 → out of range
      plotshape(close.eq(105), 'mid', { offset: -2 }); // bar 4 → bar 2
    }, BARS);
    const markers = run.result.markers!;
    expect(markers).toHaveLength(1);
    expect(markers[0]!.time).toBe(BARS[2]!.time);
  });

  test('tooltip lands on the marker', () => {
    const run = executeScript(() => {
      indicator('Tip');
      plotshape(close.eq(109), 'x', { text: 'BE', tooltip: 'Bullish Engulfing' });
    }, BARS);
    expect(run.result.markers![0]!.tooltip).toBe('Bullish Engulfing');
  });
});

describe('plotchar', () => {
  test('emits char markers with default char *', () => {
    const run = executeScript(() => {
      indicator('Chars');
      plotchar(close.lt(101), 'low');
    }, BARS);
    expect(run.shapeConfig[0]).toMatchObject({ id: 'char0', kind: 'char', char: '*' });
    const markers = run.result.markers!;
    expect(markers).toHaveLength(1); // only close=100
    expect(markers[0]).toMatchObject({ style: 'char', char: '*', time: BARS[0]!.time });
  });
});

describe('bgcolor', () => {
  test('per-bar colors from color.when without colorFalse skip untriggered bars', () => {
    const run = executeScript(() => {
      indicator('Bg');
      bgcolor(color.when(close.gt(106), 'rgba(0,0,255,0.1)'));
    }, BARS);
    const bg = run.result.bgcolors!;
    // closes > 106: 108, 107, 109 → 3 entries
    expect(bg).toHaveLength(3);
    expect(bg[0]).toEqual({ time: BARS[7]!.time, color: 'rgba(0,0,255,0.1)' });
    expect(run.barColorConfig[0]).toMatchObject({ id: 'bgcolor0', kind: 'bgcolor' });
  });

  test('negative offset moves the color to earlier bars (candlestick highlight)', () => {
    const run = executeScript(() => {
      indicator('BgOff');
      bgcolor(color.when(close.eq(105), 'blue'), { offset: -2 });
    }, BARS);
    const bg = run.result.bgcolors!;
    expect(bg).toHaveLength(1);
    expect(bg[0]!.time).toBe(BARS[2]!.time); // bar 4 shifted back 2
  });

  test('static color applies to every bar', () => {
    const run = executeScript(() => {
      indicator('BgAll');
      bgcolor('rgba(255,0,0,0.05)');
    }, BARS);
    expect(run.result.bgcolors!).toHaveLength(BARS.length);
  });
});

describe('barcolor', () => {
  test('per-bar candle colors land in result.barcolors', () => {
    const run = executeScript(() => {
      indicator('Bc');
      barcolor(color.when(close.gt(close.offset(1)), color.green, color.red));
    }, BARS);
    const bc = run.result.barcolors!;
    // bar 0 comparison with NaN → falsy → red; all bars colored
    expect(bc).toHaveLength(BARS.length);
    expect(bc[0]!.color).toBe(color.red);
    expect(bc[1]!.color).toBe(color.green); // 102 > 100
    expect(bc[2]!.color).toBe(color.red); // 101 < 102
  });
});

describe('result wiring', () => {
  test('empty outputs stay undefined', () => {
    const run = executeScript(() => {
      indicator('Nothing');
    }, BARS);
    expect(run.result.markers).toBeUndefined();
    expect(run.result.bgcolors).toBeUndefined();
    expect(run.result.barcolors).toBeUndefined();
    expect(run.shapeConfig).toEqual([]);
    expect(run.barColorConfig).toEqual([]);
  });
});
