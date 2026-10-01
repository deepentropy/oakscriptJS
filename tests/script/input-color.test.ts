/**
 * input.color default: PineScript keeps an alpha of 2 decimals for the default (#122).
 */
import { executeScript, indicator, input, color } from '../../src/script';
import type { Bar } from '../../src/types';

const BARS: Bar[] = [100, 102, 101].map((c, i) => ({
  time: 1_700_000_000 + i * 86_400,
  open: c - 1,
  high: c + 1,
  low: c - 2,
  close: c,
  volume: 1000,
}));


describe('input.color default (PineScript rules)', () => {
  it('color.new(c, 90) as an input default has the alpha byte 26 (25 in the script)', () => {
    let low = '';
    executeScript(() => {
      indicator('input colour');
      low = input.color(color.new('#FFFFE0', 90), 'Low');
    }, BARS);
    expect(low).toBe(`rgba(255, 255, 224, ${26 / 255})`);
    // PineScript, Volume Profile Heatmap band colour: RGB (255, 64, 56), alpha 58
    expect(color.from_gradient(0.4285315888041461, 0, 1, low, color.new('#FF0000', 60))).toBe(`rgba(255, 64, 56, ${58 / 255})`);
  });

  it('keeps (100 - trunc(t)) / 100 for color.new / color.rgb, round(AA / 255, 2) for a hex literal', () => {
    const got: string[] = [];
    executeScript(() => {
      indicator('input colour');
      got.push(input.color(color.new('#FFFFE0', 9.9), 'a')); // 0.91: byte 232 (230 in the script)
      got.push(input.color(color.rgb(255, 255, 224, 33.3), 'b')); // 0.67: byte 171
      got.push(input.color('#FFFFE019', 'c')); // 0.1: byte 26
      got.push(input.color(color.new('#FFFFE0', 0.4), 'd')); // 1: opaque
    }, BARS);
    expect(got).toEqual([
      `rgba(255, 255, 224, ${232 / 255})`,
      `rgba(255, 255, 224, ${171 / 255})`,
      `rgba(255, 255, 224, ${26 / 255})`,
      'rgb(255, 255, 224)',
    ]);
  });

  it('leaves a default whose alpha byte does not change, and a value given by the host', () => {
    let got: string[] = [];
    const run = executeScript(() => {
      indicator('input colour');
      got = [input.color('#F23645', 'e'), input.color(color.new('#FFFFE0', 50), 'f'), input.color(color.new('#FFFFE0', 90), 'g')];
    }, BARS, { g: 'rgba(255, 255, 224, 0.09999999999999998)' });
    expect(got).toEqual(['#F23645', color.new('#FFFFE0', 50), 'rgba(255, 255, 224, 0.09999999999999998)']);
    expect(run.inputConfig.map((c) => c.defval)).toEqual(['#F23645', color.new('#FFFFE0', 50), `rgba(255, 255, 224, ${26 / 255})`]);
  });
});
