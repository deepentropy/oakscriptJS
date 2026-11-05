/**
 * Long runs at the maximum count (#199): the oldest objects leave the live list by moving its head. The order of
 * `all()`, the deleted objects, a `var` object, deletes by the script and a nested run stay as on a short run.
 */
import { box, line, linefill, resetDrawings, setDrawingBar, varDrawing } from '../../src';
import { all, isDeleted, restoreDrawingState, saveDrawingState } from '../../src/drawing/registry';
import type { Box, Line } from '../../src/types';

describe('creations at the maximum count over a long run (#199)', () => {
  afterEach(() => resetDrawings());

  it('keeps the newest boxes in creation order, the others deleted', () => {
    resetDrawings({ box: 500 });
    const made: Box[] = [];
    for (let bar = 0; bar < 2000; bar++) {
      setDrawingBar(bar);
      for (let k = 0; k < 7; k++) made.push(box.new(bar, k + 1, bar + 1, k));
    }
    setDrawingBar(null);
    const alive = all('box');
    // 14,000 boxes: a cut down to 500 at the 506th and then every 6 creations, the last one at the 14,000th
    expect(alive.length).toBe(500);
    expect(alive).toEqual(made.slice(-500));
    expect(made.slice(0, -500).every(isDeleted)).toBe(true);
    expect(alive.some(isDeleted)).toBe(false);
  });

  it('a var box stays first, a box deleted by the script leaves, a nested run puts the list back', () => {
    resetDrawings({ box: 50 });
    const held = varDrawing<Box>();
    const made: Box[] = [];
    for (let bar = 0; bar < 3000; bar++) {
      setDrawingBar(bar);
      const b = box.new(bar, 2, bar + 1, 1);
      made.push(b);
      if (bar === 0) held.value = b;
      if (bar === 2990) box.delete(made[2985]!);
      if (bar === 2995) {
        const saved = saveDrawingState();
        resetDrawings({ box: 50 });
        for (let k = 0; k < 200; k++) box.new(k, 1, k + 1, 0);
        restoreDrawingState(saved);
        setDrawingBar(bar);
      }
    }
    setDrawingBar(null);
    const alive = all('box');
    expect(alive[0]).toBe(made[0]);
    expect(alive.includes(made[2985]!)).toBe(false);
    expect(alive.slice(1)).toEqual(made.filter((b, i) => i !== 0 && i !== 2985).slice(-(alive.length - 1)));
    expect(alive.length).toBeGreaterThanOrEqual(50);
    expect(alive.length).toBeLessThanOrEqual(55);
  });

  it('linefills of the lines at the maximum count follow their lines', () => {
    resetDrawings({ line: 20 });
    const lines: Line[] = [];
    for (let bar = 0; bar < 1000; bar++) {
      setDrawingBar(bar);
      lines.push(line.new(bar, 1, bar + 1, 1), line.new(bar, 2, bar + 1, 2));
      linefill.new(lines[lines.length - 2]!, lines[lines.length - 1]!, '#ff0000');
    }
    setDrawingBar(null);
    const alive = all('line');
    expect(alive).toEqual(lines.slice(-alive.length));
    const fills = all('linefill');
    expect(fills.length).toBeLessThanOrEqual(25);
    expect(fills.every((f) => !isDeleted(f))).toBe(true);
  });
});
