/**
 * Functions a port needs without running a whole script, from the package root (#157).
 */
import { afterCompletion, heikinAshi, line, mapToChart, periodsOf, resample, resetDrawings, setDrawingLimits } from '../../src';

describe('package root exports for ports', () => {
  afterEach(() => resetDrawings());

  it('resetDrawings / setDrawingLimits set the maximum count of the library line.new', () => {
    resetDrawings({ line: 10 });
    for (let i = 0; i < 16; i++) line.new(i, 1, i + 1, 2);
    expect(line.all().length).toBe(10); // above 10 + 5: cut to 10
    setDrawingLimits({ line: 500 });
    for (let i = 0; i < 100; i++) line.new(i, 1, i + 1, 2);
    expect(line.all().length).toBe(110);
  });

  it('the resample functions and heikinAshi are functions', () => {
    for (const fn of [resample, periodsOf, afterCompletion, mapToChart, heikinAshi]) expect(typeof fn).toBe('function');
    const ha = heikinAshi([{ time: 1, open: 10, high: 12, low: 9, close: 11, volume: 1 }]);
    expect(ha[0]!.close).toBe((10 + 12 + 9 + 11) / 4);
  });
});
