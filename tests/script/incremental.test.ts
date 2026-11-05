/**
 * Incremental runs (#196): a full run on bars 0..k equals a run created on the history and updated up to k (several
 * prices of the forming bar, then new bars), every output compared (numbers with Object.is), for every k.
 */
import {
  createScriptRun,
  executeScript,
  indicator,
  plot,
  ta,
  close,
  open,
  high,
  low,
  hl2,
  eachBar,
  persist,
  label,
  type ScriptRunUpdate,
} from '../../src/script';
import type { Bar } from '../../src/types';

function makeBars(n: number, seed: number): Bar[] {
  let s = seed;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let p = 100;
  return Array.from({ length: n }, (_, i) => {
    const o = p;
    p = Math.max(1, p * (1 + (r() - 0.5) * 0.05));
    const c = i % 37 === 5 ? o : p; // flat bars
    return {
      time: Date.UTC(2024, 0, 1) + i * 86_400_000,
      open: o,
      high: Math.max(o, c) * (1 + r() * 0.01),
      low: Math.min(o, c) * (1 - r() * 0.01),
      close: c,
      volume: i % 23 === 0 ? 0 : 1000 + Math.floor(r() * 500),
    };
  });
}

const FINAL = makeBars(260, 7);
const HISTORY = 200;

/** The forming bar before its close: a few prices, then its final values */
function ticks(bar: Bar): Bar[] {
  const t1 = { ...bar, high: bar.open, low: bar.open, close: bar.open };
  const mid = (bar.open + bar.close) / 2;
  const t2 = { ...bar, high: Math.max(bar.open, mid), low: Math.min(bar.open, mid), close: mid };
  return [t1, t2, bar];
}

/** Runs the feed and compares every update with a full run on the same bars */
function feed(body: () => void, options: { verify?: number } = { verify: 0 }): { updates: ScriptRunUpdate[]; reason: string | null } {
  const run = createScriptRun(body, {}, {}, options);
  const updates: ScriptRunUpdate[] = [];
  updates.push(run.update(FINAL.slice(0, HISTORY)));
  for (let k = HISTORY; k < FINAL.length; k++) {
    for (const tick of ticks(FINAL[k]!)) {
      const bars = [...FINAL.slice(0, k), tick];
      const got = run.update(bars);
      const { from: _from, incremental: _inc, ...result } = got;
      expect(result).toEqual(executeScript(body, bars));
      updates.push(got);
    }
  }
  return { updates, reason: run.fullRunReason };
}

describe('createScriptRun (#196)', () => {
  it('ta.* calls and Series: resumed updates equal full runs', () => {
    const body = () => {
      indicator('ta');
      const src = hl2.add(close).div(2);
      plot(ta.sma(src, 14), 'sma');
      plot(ta.ema(close, 9), 'ema', { offset: 2 });
      plot(ta.rsi(close, 14), 'rsi', { offset: -3 });
      const [m, s, h] = ta.macd(close, 12, 26, 9);
      plot(m, 'macd');
      plot(s, 'signal');
      plot(h, 'hist');
      const [basis, upper, lower] = ta.bb(close, 20, 2);
      plot(basis, 'basis');
      plot(upper.sub(lower), 'width');
      plot(ta.atr(14), 'atr');
      plot(ta.tr(true), 'tr');
      plot(ta.stoch(close, high, low, 14), 'stoch');
      plot(ta.highest(10).sub(ta.lowest(low, 10)), 'range');
      const cross = ta.crossover(close, ta.sma(close, 20));
      plot(ta.barssince(cross), 'since');
      plot(ta.valuewhen(cross, close, 1), 'when');
      plot(ta.change(close, 3).add(ta.mom(close, 2)).add(ta.roc(close, 4)), 'changes');
      plot(ta.cum(close.sub(open)), 'cum');
      plot(ta.wma(close, 10), 'wma');
      plot(ta.stdev(close, 10, false), 'stdev');
      plot(ta.vwma(close, 10), 'vwma');
      plot(ta.linreg(close, 10, 0), 'linreg'); // no machine: the array function on the full values
    };
    const { updates, reason } = feed(body);
    expect(reason).toBeNull();
    expect(updates[0]!.incremental).toBe(false);
    expect(updates.slice(1).every((u) => u.incremental)).toBe(true);
    expect(updates[1]!.from).toBe(HISTORY - 1);
  });

  it('eachBar() with persist() boxes: resumed updates equal full runs', () => {
    const body = () => {
      indicator('state');
      const dir = persist(0);
      const swings = persist<number[]>([]);
      const fast = ta.ema(close, 5);
      const trend = eachBar((c) => {
        if (c.close > c.get(close, 1)) dir.value = 1;
        else if (c.close < c.get(close, 1)) dir.value = -1;
        if (dir.value !== c.prev()) swings.value.push(c.i);
        if (swings.value.length > 5) swings.value.shift();
        return dir.value * (1 + swings.value.length) + c.get(fast, 2) / 1000;
      });
      plot(trend, 'trend');
      const count = persist(0);
      plot(eachBar((c) => {
        if (c.get(trend) > 0) count.value++;
        return count.value;
      }), 'count');
    };
    const { updates, reason } = feed(body);
    expect(reason).toBeNull();
    expect(updates.slice(1).every((u) => u.incremental)).toBe(true);
  });

  it('drawings are not resumed: full runs, the same results', () => {
    const body = () => {
      indicator('labels', { overlay: true });
      eachBar((c) => {
        if (c.i % 50 === 0) label.new(c.i, c.close, 'x');
      });
      plot(close, 'close');
    };
    const { updates, reason } = feed(body);
    expect(reason).toBe('drawings');
    expect(updates.every((u) => !u.incremental)).toBe(true);
  });

  it('state kept in a let variable outside the callback: full runs, the same results', () => {
    const body = () => {
      indicator('let');
      let dir = 0;
      plot(eachBar((c) => {
        if (c.close > c.get(close, 1)) dir = 1;
        else if (c.close < c.get(close, 1)) dir = -1;
        return dir;
      }), 'dir');
    };
    const { updates, reason } = feed(body);
    expect(reason).toBe('eachBar() callback changes dir outside it (use persist())');
    expect(updates.every((u) => !u.incremental)).toBe(true);
  });

  it('a change of the history before the forming bar runs the script in full', () => {
    const body = () => {
      indicator('sma');
      plot(ta.sma(close, 5), 'sma');
    };
    const run = createScriptRun(body, {}, {}, { verify: 0 });
    run.update(FINAL.slice(0, 100));
    const changed = FINAL.slice(0, 101).map((b, i) => (i === 50 ? { ...b, close: b.close + 1 } : b));
    const got = run.update(changed);
    expect(got.incremental).toBe(false);
    const { from: _f, incremental: _i, ...result } = got;
    expect(result).toEqual(executeScript(body, changed));
    expect(run.update(changed.concat([FINAL[101]!])).incremental).toBe(true);
  });
});

describe('createScriptRun verification (#196)', () => {
  it('a script with its state in persist() passes the verification of its first updates', () => {
    const body = () => {
      indicator('ok');
      const n = persist(0);
      plot(eachBar((c) => (c.close > c.open ? ++n.value : n.value)), 'n');
      plot(ta.rsi(close, 7), 'rsi');
    };
    const { updates, reason } = feed(body, {});
    expect(reason).toBeNull();
    expect(updates.slice(1).every((u) => u.incremental)).toBe(true);
  });

  it('state changed by a helper function (not read from the callback): the verification finds it', () => {
    const body = () => {
      indicator('helper');
      let n = 0;
      const bump = (): number => ++n;
      plot(eachBar(() => bump()), 'n');
    };
    const { reason } = feed(body, {});
    expect(reason).toMatch(/differs from a full run/);
  });
});
