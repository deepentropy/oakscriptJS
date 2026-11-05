/**
 * Objects a `var` variable gets or releases on the bar where the maximum count cuts (#193). The expected labels are
 * the PineScript results of the same scripts (max_labels_count = 50, BITSTAMP:BTCUSD 1D, 05/11/2026): a `held` label
 * and 60 labels "v0".."v59" made on one bar.
 */
import { label, resetDrawings, setDrawingBar, varDrawing } from '../../src';
import type { Label } from '../../src/types';

const LAST = 20;

/** Runs `bar(i)` on bars 0..LAST (the last one marked as such) and returns the texts of the live labels. */
function run(bar: (i: number) => void): string[] {
  resetDrawings({ label: 50 });
  for (let i = 0; i <= LAST; i++) {
    setDrawingBar(i, i === LAST);
    bar(i);
  }
  setDrawingBar(null);
  return label.all().map((l) => l.text);
}

const plain = (i: number, from = 0, to = 59) => {
  for (let k = from; k <= to; k++) label.new(i, 0, `v${k}`);
};
const vs = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k) => `v${from + k}`);

afterAll(() => resetDrawings());

describe('a var object assigned or released on the bar of the cut (#193)', () => {
  it.each([
    ['the last bar', LAST],
    ['an earlier bar', LAST - 3],
  ])('assigned on %s before 60 labels: it stays, v0..v5 go', (_, on) => {
    const held = varDrawing<Label>();
    const texts = run((i) => {
      if (i !== on) return;
      held.value = label.new(i, 1, 'held');
      plain(i);
    });
    expect(texts).toEqual(['held', ...vs(6, 59)]);
  });

  it.each([
    ['the last bar', LAST],
    ['an earlier bar', LAST - 3],
  ])('released on %s, before 60 labels made on that bar: it stays', (_, on) => {
    const held = varDrawing<Label>();
    const texts = run((i) => {
      if (i === LAST - 10) held.value = label.new(i, 1, 'held');
      if (i === on) {
        held.value = undefined;
        plain(i);
      }
    });
    expect(texts).toEqual(['held', ...vs(6, 59)]);
  });

  it('assigned after the 60 labels: it stays (the newest)', () => {
    const held = varDrawing<Label>();
    const texts = run((i) => {
      if (i !== LAST) return;
      plain(i);
      held.value = label.new(i, 1, 'held');
    });
    expect(texts).toEqual([...vs(6, 59), 'held']);
  });

  it('released on an earlier bar: deleted like any other label', () => {
    const held = varDrawing<Label>();
    const texts = run((i) => {
      if (i === LAST - 10) held.value = label.new(i, 1, 'held');
      if (i === LAST - 5) held.value = undefined;
      if (i === LAST - 3) plain(i);
    });
    expect(texts).toEqual(vs(5, 59));
  });

  it('two var labels between 60 and 5 more labels: both stay', () => {
    const h0 = varDrawing<Label>();
    const h1 = varDrawing<Label>();
    const texts = run((i) => {
      if (i !== LAST - 3) return;
      plain(i);
      h0.value = label.new(i, 1, 'h0');
      h1.value = label.new(i, 1, 'h1');
      plain(i, 60, 64);
    });
    expect(texts).toEqual([...vs(12, 59), 'h0', 'h1', ...vs(60, 64)]);
  });
});
