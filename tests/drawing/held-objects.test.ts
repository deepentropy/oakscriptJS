/**
 * An object held by a `var` variable is never deleted by the maximum count, and it still counts (#158).
 * The counts are the PineScript results of the same scripts.
 */
import { box, holdDrawing, label, line, linefill, releaseDrawing, resetDrawings, setDrawingBar, varDrawing } from '../../src';
import { box as scriptBox, eachBar, executeScript, indicator, varDrawing as scriptVar } from '../../src/script';
import type { Bar, Box, Line, Linefill } from '../../src/types';

describe('drawing limit with objects held by a var variable (#158)', () => {
  beforeEach(() => resetDrawings({ line: 10, label: 10, box: 50 }));
  afterAll(() => resetDrawings());

  it('held objects survive and count: 9 held boxes and a maximum of 50 end with 9 held + 46', () => {
    const heldBoxes = Array.from({ length: 9 }, (_, i) => holdDrawing(box.new(i, 2, i + 1, 1)));
    const others: Box[] = [];
    for (let i = 9; i < 103; i++) others.push(box.new(i, 2, i + 1, 1));
    const live = box.all();
    expect(live.length).toBe(55);
    expect(live.slice(0, 9)).toEqual(heldBoxes);
    expect(live.slice(9)).toEqual(others.slice(-46));
    // the count follows "above max + 5, cut to max" on the total
    box.new(103, 2, 104, 1);
    expect(box.all().length).toBe(50);
    expect(box.all().slice(0, 9)).toEqual(heldBoxes);
  });

  it('a variable that gets another object or na releases the one before', () => {
    const level = varDrawing<Line>();
    const first = (level.value = line.new(0, 1, 1, 1));
    for (let i = 0; i < 30; i++) line.new(i, 2, i + 1, 2);
    expect(line.all()[0]).toBe(first);
    const second = line.new(40, 1, 41, 1);
    level.value = second; // := another object
    for (let i = 0; i < 30; i++) line.new(i, 3, i + 1, 3);
    expect(line.all()).not.toContain(first);
    expect(line.all()).toContain(second);
    level.value = undefined; // := na
    for (let i = 0; i < 30; i++) line.new(i, 4, i + 1, 4);
    expect(line.all()).not.toContain(second);
  });

  it('setters do not protect, an explicit delete removes a held object, two variables hold until both release', () => {
    const plain = label.new(0, 1, 'a');
    label.set_text(plain, 'b');
    const kept = holdDrawing(holdDrawing(label.new(1, 1, 'c')));
    const gone = holdDrawing(label.new(2, 1, 'd'));
    label.delete(gone);
    for (let i = 0; i < 20; i++) label.new(i, 2, 'x');
    expect(label.all()).not.toContain(plain);
    expect(label.all()).not.toContain(gone);
    expect(label.all()).toContain(kept);
    releaseDrawing(kept);
    for (let i = 0; i < 20; i++) label.new(i, 2, 'x');
    expect(label.all()).toContain(kept);
    releaseDrawing(kept);
    for (let i = 0; i < 20; i++) label.new(i, 2, 'x');
    expect(label.all()).not.toContain(kept);
  });

  it('a script run: varDrawing with indicator(max_boxes_count)', () => {
    const bars: Bar[] = Array.from({ length: 200 }, (_, i) => ({
      time: 1_000_000 + i * 60, open: 1, high: 2, low: 0, close: 1, volume: 1,
    }));
    const result = executeScript(() => {
      indicator('held', { max_boxes_count: 10 });
      const area = scriptVar<Box>();
      eachBar((c) => {
        const b = scriptBox.new(c.i, 2, c.i + 1, 1);
        if (c.i === 0) area.value = b;
      });
    }, bars);
    const boxes = result.result.boxes!;
    expect(boxes.length).toBeGreaterThanOrEqual(10);
    expect(boxes.length).toBeLessThanOrEqual(15);
    expect(boxes[0]!.time1).toBe(bars[0]!.time);
    expect(boxes[1]!.time1).toBeGreaterThan(bars[100]!.time);
  });
});

describe('linefill limit: max_lines_count, held fills and fills released less than 5,000 bars ago (#158)', () => {
  beforeEach(() => resetDrawings({ line: 10 }));
  afterAll(() => resetDrawings());
  // lines deleted by the maximum count do not delete their fills
  const l1 = () => line.new(0, 1, 1, 1);
  const fill = () => linefill.new(l1(), l1());

  it('recently released fills are skipped; still above max + 5, the oldest go', () => {
    const zone = varDrawing<Linefill>();
    const made: Linefill[] = [];
    for (let bar = 0; bar < 16; bar++) {
      setDrawingBar(bar);
      const f = fill();
      made.push(f);
      zone.value = f;
    }
    // 16 fills, all held or released on bars 1 to 15: none can be skipped over, so the 6 oldest are deleted
    expect(linefill.all()).toEqual(made.slice(6));

    // 5,000 bars later the released ones are deleted first; the fill of the variable stays
    setDrawingBar(6000);
    const plain: Linefill[] = [];
    for (let k = 0; k < 6; k++) {
      plain.push(fill());
    }
    expect(linefill.all()).toEqual([...made.slice(12), ...plain]);
    for (let k = 0; k < 30; k++) {
      fill();
    }
    expect(linefill.all()).toContain(made[15]);
    expect(linefill.all()).not.toContain(made[14]);
    expect(linefill.all().length).toBeLessThanOrEqual(15);
  });
});
