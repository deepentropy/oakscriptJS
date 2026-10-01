/**
 * PineScript fill() overloads and gradient fills (issue #83); PineScript color.from_gradient rules.
 */
import { color, close, executeScript, fill, hline, plot } from '../../src/script';
import type { Bar } from '../../src/types';

const BARS: Bar[] = [1, 2, 3].map((c, i) => ({ time: 1_700_000_000 + i * 86_400, open: c, high: c, low: c, close: c, volume: 1 }));

describe('fill() overloads', () => {
  it('positional colour and title (PineScript order)', () => {
    const r = executeScript(() => {
      const a = plot(close, 'a');
      const b = plot(close, 'b');
      fill(a, b, '#2962FF', 'band');
    }, BARS);
    expect(r.result.fills![0]!.options).toEqual({ color: '#2962FF', title: 'band' });
  });

  it('options object (oakscriptjs form) still works', () => {
    const r = executeScript(() => {
      fill(plot(close, 'a'), plot(close, 'b'), { color: '#FF0000', title: 'old' });
    }, BARS);
    expect(r.result.fills![0]!.options).toEqual({ color: '#FF0000', title: 'old' });
  });

  it('gradient form: per-bar values and colours from numbers, Series and color.when() arrays', () => {
    const r = executeScript(() => {
      const a = plot(close, 'a');
      const b = plot(close, 'b');
      fill(a, b, close.mul(2), 0, ['#00E676', null, '#FDD835'], color.red, 'grad');
    }, BARS);
    const f = r.result.fills![0]!;
    expect(f.options?.title).toBe('grad');
    expect(f.gradient).toEqual({
      topValue: [2, 4, 6],
      bottomValue: [0, 0, 0],
      topColor: ['#00E676', null, '#FDD835'],
      bottomColor: ['#F23645', '#F23645', '#F23645'],
    });
  });

  it('gradient form between two hlines', () => {
    const r = executeScript(() => {
      fill(hline(100), hline(0), 100, 0, color.red, color.blue);
    }, BARS);
    expect(r.fillConfig[0]!.gradient?.topValue).toEqual([100, 100, 100]);
    expect(r.fillConfig[0]!.gradient?.bottomColor[0]).toBe('#2962FF');
  });
});

describe('color.from_gradient (PineScript rules)', () => {
  const red = color.rgb(255, 0, 0);
  const green = color.rgb(0, 255, 0);
  const parts = (c: string) => [color.r(c), color.g(c), color.b(c), Math.round(color.t(c))];

  it('truncates the channels and clamps outside the range', () => {
    expect(parts(color.from_gradient(25, 0, 100, red, green))).toEqual([191, 63, 0, 0]);
    expect(parts(color.from_gradient(-10, 0, 100, red, green))).toEqual([255, 0, 0, 0]);
    expect(parts(color.from_gradient(50, 100, 0, red, green))).toEqual([255, 0, 0, 0]); // value <= bottom_value first
  });

  it('mixes with premultiplied byte alpha', () => {
    expect(parts(color.from_gradient(50, 0, 100, color.rgb(255, 0, 0, 20), color.rgb(0, 255, 0, 60)))).toEqual([170, 85, 0, 40]);
    expect(parts(color.from_gradient(50, 0, 100, '#08998133', '#F23645'))).toEqual([203, 70, 79, 40]);
  });

  it('truncates the mixed alpha byte', () => {
    // PineScript gives #4CAE50 with alpha 0x4B (75.9 truncated)
    const c = color.from_gradient(2, 1, 11, color.new('#4CAF50', 78), '#4CAF50');
    expect(c).toBe(`rgba(76, 174, 80, ${75 / 255})`);
    expect(color.t(c)).toBe(71);
  });

  it('is fully transparent for na inputs or an empty range', () => {
    expect(color.t(color.from_gradient(NaN, 0, 100, red, green))).toBe(100);
    expect(color.t(color.from_gradient(50, 50, 50, red, green))).toBe(100);
    expect(parts(color.from_gradient(50, 0, 100, null as unknown as string, green))).toEqual([0, 255, 0, 50]);
  });

  it('an inverted range (bottom_value > top_value) gives bottom_color wherever the value is (#121)', () => {
    // PineScript: #00E676 and #787B86 alpha 0x4D (the bottom colours)
    expect(color.from_gradient(3.0683396268358347, 0.04239173455150783, 0.0, '#00E676', color.new(color.gray, 70))).toBe(
      'rgb(0, 230, 118)'
    );
    expect(color.from_gradient(0.19886148884144617, 0.0, -0.0978266120094954, color.new(color.gray, 70), '#F44336')).toBe(
      `rgba(120, 123, 134, ${77 / 255})`
    );
    expect(parts(color.from_gradient(-5, 10, 0, red, green))).toEqual([255, 0, 0, 0]);
    expect(parts(color.from_gradient(5, 10, 0, red, green))).toEqual([255, 0, 0, 0]);
  });

  it('reads an rgba() alpha as its byte: 0.1 is 26 (#122); color.new(c, 90) stays 25', () => {
    // PineScript stores the input default color.new(#FFFFE0, 90) as rgba(255,255,224,0.1): alpha byte 26.
    // PineScript: RGB (255, 64, 56), alpha 58
    expect(color.from_gradient(0.4285315888041461, 0, 1, 'rgba(255, 255, 224, 0.1)', 'rgba(255, 0, 0, 0.4)')).toBe(
      `rgba(255, 64, 56, ${58 / 255})`
    );
    expect(color.from_gradient(0, 0, 1, 'rgba(255, 255, 224, 0.1)', red)).toBe(`rgba(255, 255, 224, ${26 / 255})`);
    // a series color.new(c, 90) has the alpha byte 25 in PineScript (issue #102 probe)
    expect(color.from_gradient(0, 0, 1, color.new('#FFFFE0', 90), red)).toBe(`rgba(255, 255, 224, ${25 / 255})`);
  });
});
