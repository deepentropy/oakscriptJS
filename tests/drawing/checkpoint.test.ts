/**
 * Drawing checkpoint of a port with its own bar loop (#203): saved at the end of the last confirmed bar and put back
 * before the forming bar is calculated again, a live update gives the drawings of a full run on the same bars.
 */
import {
  box,
  drawingOutputs,
  label,
  line,
  linefill,
  polyline,
  resetDrawings,
  restoreDrawingCheckpoint,
  saveDrawingCheckpoint,
  setDrawingBar,
  varDrawing,
  type DrawingCheckpoint,
  type DrawingVariable,
} from '../../src';
import type { Bar, Box, Label, Line } from '../../src/types';

const LIMITS = { line: 5, label: 5, polyline: 3 };

/** The study's own variables: what a full run keeps from bar to bar besides the registry */
interface Host {
  /** The newest lines (a plain array: not a `var` hold) */
  recent: Line[];
  /** var line level = na */
  level: DrawingVariable<Line>;
  /** var box zone = na */
  zone: DrawingVariable<Box>;
  /** The newest label, moved on every bar */
  lastLabel: Label | undefined;
}

const newHost = (): Host => ({ recent: [], level: varDrawing<Line>(), zone: varDrawing<Box>(), lastLabel: undefined });
const copyHost = (h: Host): Host => ({ ...h, recent: [...h.recent] });

/** One bar of the study: draws on every bar, and more on the last one */
function drawBar(h: Host, i: number, bars: Bar[]): void {
  const b = bars[i]!;
  const isLast = i === bars.length - 1;
  setDrawingBar(i, isLast);
  const l = line.new(i, b.close, i + 1, b.close);
  h.recent.push(l);
  if (h.recent.length > 6) h.recent.shift();
  if (i % 4 === 0) h.level.value = l;
  if (h.level.value) line.set_x2(h.level.value, i + 1);
  if (i % 2 === 1 && h.recent.length >= 2) linefill.new(h.recent[h.recent.length - 2]!, l, '#2196f3');
  if (i % 5 === 3 && h.recent.length > 3) line.delete(h.recent[h.recent.length - 4]!);
  if (i % 3 === 0 || b.close > b.open) h.lastLabel = label.new(i, b.high, `bar ${i}`);
  if (h.lastLabel) label.set_y(h.lastLabel, Math.max(label.get_y(h.lastLabel), b.high));
  if (i % 7 === 2 && h.lastLabel && b.close < b.open) label.delete(h.lastLabel);
  if (i % 6 === 0) h.zone.value = box.new(i, b.high, i + 2, b.low);
  if (h.zone.value) box.set_right(h.zone.value, i + 1);
  if (i % 2 === 0) {
    polyline.new([
      { index: i, time: null, price: b.low },
      { index: i + 1, time: null, price: b.high },
    ]);
  }
  if (isLast) {
    // the last bar has rules of its own for the maximum count
    for (let k = 0; k < 8; k++) label.new(i, b.close + k, `last ${k}`);
    for (let k = 0; k < 3; k++) line.new(i - k, b.low, i + 1, b.high);
    if (h.recent.length > 1) line.delete(h.recent[0]!);
  }
}

/**
 * A live run of the study: an update whose bars equal the previous ones up to the forming bar of the previous update
 * puts the drawings and the study's variables back to the end of the last confirmed bar, then calculates from there.
 */
function createLoopRun() {
  let host: Host | null = null;
  let saved: { cp: DrawingCheckpoint; host: Host } | null = null;
  let seen: Bar[] = [];
  let confirmed = 0;
  return {
    update(bars: Bar[]) {
      const resume = saved !== null && bars.length > confirmed && bars.slice(0, confirmed).every((b, i) => b === seen[i]);
      let from = 0;
      if (resume) {
        restoreDrawingCheckpoint(saved!.cp);
        host = copyHost(saved!.host);
        from = confirmed;
      } else {
        resetDrawings(LIMITS);
        host = newHost();
      }
      for (let i = from; i < bars.length; i++) {
        if (i === bars.length - 1) {
          // the end of the last confirmed bar
          saved = { cp: saveDrawingCheckpoint(), host: copyHost(host) };
          confirmed = i;
        }
        drawBar(host, i, bars);
      }
      setDrawingBar(null);
      seen = bars.slice();
      return { from, out: drawingOutputs(bars), counts: [line.all().length, label.all().length, box.all().length] };
    },
  };
}

function makeBars(n: number): Bar[] {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const bars: Bar[] = [];
  let price = 100;
  for (let i = 0; i < n; i++) {
    const open = price;
    price += (rnd() - 0.5) * 4;
    bars.push({ time: 1e9 + i * 60, open, high: Math.max(open, price) + rnd(), low: Math.min(open, price) - rnd(), close: price, volume: 1 });
  }
  return bars;
}

/** The forming bar before its close: the open, a midpoint, then its final values */
function ticks(bar: Bar): Bar[] {
  const mid = (bar.open + bar.close) / 2;
  return [
    { ...bar, high: bar.open, low: bar.open, close: bar.open },
    { ...bar, high: Math.max(bar.open, mid), low: Math.min(bar.open, mid), close: mid },
    bar,
  ];
}

/** Another study on the same chart: it resets and uses the registry between two updates */
function otherStudy(): void {
  resetDrawings({ line: 3 });
  for (let i = 0; i < 9; i++) {
    setDrawingBar(i, i === 8);
    line.new(i, 1, i + 1, 2);
    label.new(i, 1, 'other');
  }
  setDrawingBar(null);
}

describe('drawing checkpoint of a host bar loop (#203)', () => {
  afterAll(() => resetDrawings());

  it('every live update equals a full run: ticks of the forming bar, new bars, another study in between', () => {
    const all = makeBars(70);
    const run = createLoopRun();
    const full = (bars: Bar[]) => createLoopRun().update(bars);
    const check = (bars: Bar[], from: number) => {
      const got = run.update(bars);
      const want = full(bars);
      expect(got.from).toBe(from);
      expect(got.out).toEqual(want.out);
      expect(got.counts).toEqual(want.counts);
    };
    check(all.slice(0, 1), 0);
    for (let k = 1; k < 60; k++) {
      ticks(all[k]!).forEach((tick, t) => {
        if (t === 1) otherStudy();
        // a new bar resumes from the bar before it (the forming bar of the previous update), a tick from the bar itself
        check([...all.slice(0, k), tick], t === 0 ? k - 1 : k);
      });
    }
    // several new bars at once
    check(all.slice(0, 60).concat(all.slice(60, 66)), 59);
    check(all, 65);
  });

  it('the objects of the confirmed bars keep their identity; the ones of the forming bar are undone', () => {
    const bars = makeBars(30);
    const run = createLoopRun();
    run.update(bars.slice(0, 20));
    const kept = line.all();
    const formingLabels = label.all().filter((l) => l.x === 19);
    expect(formingLabels.length).toBeGreaterThan(0);
    run.update([...bars.slice(0, 19), { ...bars[19]!, close: bars[19]!.close + 1 }]);
    const after = line.all();
    // the lines of the bars before the forming bar are the same objects, in the same order
    const old = kept.filter((l) => l.x1 < 17);
    expect(after.filter((l) => l.x1 < 17)).toEqual(old);
    old.forEach((l, k) => expect(after.filter((x) => x.x1 < 17)[k]).toBe(l));
    // the labels of the forming bar were made again: none of the earlier update is alive
    for (const l of formingLabels) expect(label.all()).not.toContain(l);
  });

  it('a checkpoint taken on the last bar is not changed by the rest of the bar', () => {
    // polylines on the last bar: the first creation of the bar changes the count of the deleted ones
    resetDrawings({ polyline: 3 });
    const poly = (i: number, price: number) =>
      polyline.new([
        { index: i, time: null, price },
        { index: i + 1, time: null, price },
      ]);
    for (let i = 0; i < 6; i++) {
      setDrawingBar(i, false);
      poly(i, i);
      if (i % 2 === 1) polyline.delete(polyline.all()[0]!);
    }
    setDrawingBar(6, true);
    const cp = saveDrawingCheckpoint();
    const rest = () => {
      for (let k = 0; k < 12; k++) poly(6, 10 + k);
      return polyline.all().map((p) => p.points[0]!.price);
    };
    const once = rest();
    restoreDrawingCheckpoint(cp);
    setDrawingBar(6, true);
    expect(rest()).toEqual(once);
    setDrawingBar(null);
  });
});
